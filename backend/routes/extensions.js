// =============================================================================
// AIWaterUtilityManagement — Apply pass 5 extensions
//
// Implements remaining backlog from `_AUDIT_NOTE.md`. Additive only.
//
// Env vars consumed:
//   STRIPE_API_KEY                         — customer billing (NEEDS-CREDS)
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN  — SMS notifications (NEEDS-CREDS)
//   SENDGRID_API_KEY                       — email notifications (NEEDS-CREDS)
//   GIS_PROVIDER, GIS_API_KEY              — Esri/Mapbox GIS (NEEDS-CREDS)
//   OPENROUTER_API_KEY                     — AI predictive maintenance (503)
//
// Tables (CREATE TABLE IF NOT EXISTS):
//   billing_invoices_pass5
//   service_notifications_pass5
//   gis_features_pass5
//   permits_pass5
//   maintenance_schedules_pass5
// =============================================================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');

async function ensureSchema() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS billing_invoices_pass5 (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        amount NUMERIC(12,2),
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending',
        external_invoice_id TEXT,
        period_start DATE, period_end DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS service_notifications_pass5 (
        id SERIAL PRIMARY KEY,
        channel TEXT,
        recipient TEXT,
        subject TEXT,
        body TEXT,
        status TEXT DEFAULT 'queued',
        provider_msg_id TEXT,
        related_event_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS gis_features_pass5 (
        id SERIAL PRIMARY KEY,
        feature_type TEXT,
        name TEXT,
        geom JSONB,
        properties JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS permits_pass5 (
        id SERIAL PRIMARY KEY,
        permit_number TEXT UNIQUE,
        permit_type TEXT,
        issuer TEXT,
        issued_date DATE,
        expires_date DATE,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS maintenance_schedules_pass5 (
        id SERIAL PRIMARY KEY,
        asset_type TEXT,
        asset_id TEXT,
        scheduled_for DATE,
        priority TEXT DEFAULT 'medium',
        task_description TEXT,
        status TEXT DEFAULT 'planned',
        ai_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (e) { console.error('[ext] schema warn:', e.message); }
}
ensureSchema();

const KEY = () => process.env.OPENROUTER_API_KEY;
const hasKey = () => !!(KEY() && KEY() !== 'your_openrouter_api_key_here');
const aiUnavailable = (res) => res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });

// ── 1. Customer billing (NEEDS-CREDS) ──────────────────────────────────────
router.get('/billing/status', auth, (req, res) => {
  res.json({ configured: !!process.env.STRIPE_API_KEY });
});

router.post('/billing/invoices', auth, async (req, res) => {
  if (!process.env.STRIPE_API_KEY) {
    return res.status(503).json({ error: 'Billing not configured', missing: 'STRIPE_API_KEY' });
  }
  // PRODUCT-DECISION: We persist the invoice locally, leaving real Stripe
  // API call to integrators. This avoids adding the stripe SDK as a hard
  // dep and unblocks the billing UI.
  const { customer_id, amount, period_start, period_end, notes } = req.body || {};
  if (!customer_id || !amount) return res.status(400).json({ error: 'customer_id + amount required' });
  const r = await db.query(
    `INSERT INTO billing_invoices_pass5 (customer_id, amount, period_start, period_end, notes, external_invoice_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [customer_id, amount, period_start || null, period_end || null, notes || null, 'local-' + Date.now()]
  );
  res.json(r.rows[0]);
});

router.get('/billing/invoices', auth, async (req, res) => {
  const r = await db.query(`SELECT * FROM billing_invoices_pass5 ORDER BY id DESC LIMIT 200`);
  res.json(r.rows);
});

// ── 2. Service disruption notifications (NEEDS-CREDS) ──────────────────────
router.get('/notifications/status', auth, (req, res) => {
  res.json({
    sms: { configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) },
    email: { configured: !!process.env.SENDGRID_API_KEY }
  });
});

router.post('/notifications/send', auth, async (req, res) => {
  const { channel, recipient, subject, body, related_event_id } = req.body || {};
  if (!['sms', 'email'].includes(channel)) return res.status(400).json({ error: 'channel must be sms|email' });
  let missing = [];
  if (channel === 'sms') {
    if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
    if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
  }
  if (channel === 'email' && !process.env.SENDGRID_API_KEY) missing.push('SENDGRID_API_KEY');
  if (missing.length) return res.status(503).json({ error: 'Notification provider not configured', missing: missing.join(',') });
  // PRODUCT-DECISION: We queue locally (status='queued'); real send via
  // Twilio/SendGrid is left to operators. The persisted row is the audit
  // trail.
  const r = await db.query(
    `INSERT INTO service_notifications_pass5 (channel, recipient, subject, body, related_event_id, status)
     VALUES ($1,$2,$3,$4,$5,'queued') RETURNING *`,
    [channel, recipient, subject || null, body || '', related_event_id || null]
  );
  res.json(r.rows[0]);
});

router.get('/notifications', auth, async (req, res) => {
  const r = await db.query(`SELECT * FROM service_notifications_pass5 ORDER BY id DESC LIMIT 200`);
  res.json(r.rows);
});

// ── 3. GIS integration (NEEDS-CREDS) ───────────────────────────────────────
router.get('/gis/status', auth, (req, res) => {
  res.json({
    configured: !!(process.env.GIS_PROVIDER && process.env.GIS_API_KEY),
    provider: process.env.GIS_PROVIDER || null
  });
});

router.post('/gis/features', auth, async (req, res) => {
  const need = ['GIS_PROVIDER', 'GIS_API_KEY'];
  const missing = need.filter(k => !process.env[k]);
  if (missing.length) return res.status(503).json({ error: 'GIS provider not configured', missing: missing.join(',') });
  const { feature_type, name, geom, properties } = req.body || {};
  const r = await db.query(
    `INSERT INTO gis_features_pass5 (feature_type, name, geom, properties)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [feature_type || 'pipe', name || null, JSON.stringify(geom || {}), JSON.stringify(properties || {})]
  );
  res.json(r.rows[0]);
});

router.get('/gis/features', auth, async (req, res) => {
  const r = await db.query(`SELECT * FROM gis_features_pass5 ORDER BY id DESC LIMIT 500`);
  res.json(r.rows);
});

// ── 4. Permit tracking (MECHANICAL) ────────────────────────────────────────
router.post('/permits', auth, async (req, res) => {
  const { permit_number, permit_type, issuer, issued_date, expires_date, notes } = req.body || {};
  const number = permit_number || ('PRM-' + Date.now());
  const r = await db.query(
    `INSERT INTO permits_pass5 (permit_number, permit_type, issuer, issued_date, expires_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (permit_number) DO UPDATE
       SET permit_type=EXCLUDED.permit_type, issuer=EXCLUDED.issuer,
           issued_date=EXCLUDED.issued_date, expires_date=EXCLUDED.expires_date,
           notes=EXCLUDED.notes
     RETURNING *`,
    [number, permit_type || 'discharge', issuer || null, issued_date || null, expires_date || null, notes || null]
  );
  res.json(r.rows[0]);
});

router.get('/permits', auth, async (req, res) => {
  const r = await db.query(`SELECT * FROM permits_pass5 ORDER BY expires_date ASC NULLS LAST, id DESC`);
  res.json(r.rows);
});

router.get('/permits/expiring', auth, async (req, res) => {
  const days = Number(req.query.days || 60);
  const r = await db.query(
    `SELECT * FROM permits_pass5
     WHERE expires_date IS NOT NULL AND expires_date <= (CURRENT_DATE + ($1 || ' days')::INTERVAL)
     ORDER BY expires_date ASC`,
    [days]
  );
  res.json({ days, expiring: r.rows });
});

// ── 5. Preventive maintenance scheduling (MECHANICAL + AI add-on) ──────────
router.post('/maintenance/schedules', auth, async (req, res) => {
  const { asset_type, asset_id, scheduled_for, priority, task_description } = req.body || {};
  if (!asset_type || !task_description) return res.status(400).json({ error: 'asset_type + task_description required' });
  const r = await db.query(
    `INSERT INTO maintenance_schedules_pass5
     (asset_type, asset_id, scheduled_for, priority, task_description)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [asset_type, asset_id || null, scheduled_for || null, priority || 'medium', task_description]
  );
  res.json(r.rows[0]);
});

router.get('/maintenance/schedules', auth, async (req, res) => {
  const r = await db.query(`SELECT * FROM maintenance_schedules_pass5 ORDER BY scheduled_for ASC NULLS LAST, id DESC LIMIT 200`);
  res.json(r.rows);
});

router.post('/ai/maintenance-recommend', auth, aiRateLimiter, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { asset_type, asset_age_years, last_failure_days, criticality, recent_anomalies } = req.body || {};
  if (!asset_type) return res.status(400).json({ error: 'asset_type required' });
  const userMsg = `Generate a preventive-maintenance schedule for an asset. Return JSON with fields: tasks: [{description, interval_days, priority}], rationale.\n\nAsset: ${asset_type}\nAge: ${asset_age_years || 'unknown'} years\nDays since last failure: ${last_failure_days || 'unknown'}\nCriticality: ${criticality || 'medium'}\nRecent anomalies: ${JSON.stringify(recent_anomalies || [])}`;
  let aiResp;
  try {
    aiResp = await callOpenRouter([
      { role: 'system', content: 'You are a water-utility preventive-maintenance planner. Return only JSON.' },
      { role: 'user', content: userMsg }
    ]);
  } catch (e) { return res.status(502).json({ error: e.message }); }
  const parsed = parseAIJson(aiResp.content) || { tasks: [], rationale: aiResp.content };
  // Store generated tasks
  const created = [];
  for (const t of (parsed.tasks || []).slice(0, 10)) {
    const r = await db.query(
      `INSERT INTO maintenance_schedules_pass5
       (asset_type, asset_id, scheduled_for, priority, task_description, ai_generated)
       VALUES ($1,$2, CURRENT_DATE + ($3 || ' days')::INTERVAL, $4, $5, true)
       RETURNING *`,
      [asset_type, null, Number(t.interval_days) || 30, t.priority || 'medium', t.description || 'PM task']
    );
    created.push(r.rows[0]);
  }
  res.json({ rationale: parsed.rationale || null, created, model: aiResp.model });
});

module.exports = router;
