// Custom Views endpoints — 2 VIZ + 2 NON-VIZ for AI Water Utility Management.
// Auth-guarded. In-memory tariff store (CRUD) keeps endpoint surface deterministic.
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ----- In-memory tariff store (seeded) -----
let tariffSeq = 4;
const tariffs = [
  { id: 1, tier: 'Tier 1 — Essential', min_gallons: 0,     max_gallons: 3000,  rate_per_1000: 3.25, description: 'Basic household use' },
  { id: 2, tier: 'Tier 2 — Standard',  min_gallons: 3001,  max_gallons: 8000,  rate_per_1000: 4.75, description: 'Average residential' },
  { id: 3, tier: 'Tier 3 — Heavy',     min_gallons: 8001,  max_gallons: 20000, rate_per_1000: 7.50, description: 'High-volume users' },
  { id: 4, tier: 'Tier 4 — Excessive', min_gallons: 20001, max_gallons: null,  rate_per_1000: 12.00, description: 'Conservation surcharge' },
];

// ===== VIZ 1: Consumption trend chart =====
// GET /api/custom-views/consumption-trend?days=14
router.get('/consumption-trend', auth, (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 14, 60);
  const today = new Date();
  const points = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayIndex = (days - 1 - i);
    const seasonal = Math.sin((dayIndex / days) * Math.PI * 2) * 18000;
    const weekday = d.getDay();
    const weekendBoost = (weekday === 0 || weekday === 6) ? 9000 : 0;
    const noise = Math.round((Math.random() - 0.5) * 6000);
    const consumption = 145000 + seasonal + weekendBoost + noise;
    const peak_hour_demand = Math.round(consumption / 16);
    points.push({
      date: d.toISOString().slice(0, 10),
      consumption_gallons: Math.max(80000, Math.round(consumption)),
      peak_hour_gpm: peak_hour_demand,
      avg_pressure_psi: +(62 + Math.sin(dayIndex / 3) * 4).toFixed(1),
    });
  }
  const total = points.reduce((s, p) => s + p.consumption_gallons, 0);
  res.json({
    period_days: days,
    series: points,
    summary: {
      total_gallons: total,
      avg_daily_gallons: Math.round(total / days),
      peak_day: points.reduce((m, p) => p.consumption_gallons > m.consumption_gallons ? p : m, points[0]),
    },
  });
});

// ===== VIZ 2: Leak detection heatmap (region x sensor) =====
// GET /api/custom-views/leak-heatmap
router.get('/leak-heatmap', auth, (req, res) => {
  const regions = ['North', 'South', 'East', 'West', 'Downtown', 'Industrial'];
  const sensors = ['Pressure', 'Flow', 'Acoustic', 'Vibration', 'Turbidity'];
  // Severity 0..100 — higher = stronger leak signal.
  const cells = [];
  regions.forEach((r, ri) => {
    sensors.forEach((s, si) => {
      // Deterministic-ish but varied per (region,sensor)
      const base = ((ri * 7 + si * 13) % 11) * 6;
      const flair = Math.round(Math.random() * 40);
      const severity = Math.min(100, base + flair);
      cells.push({
        region: r,
        sensor: s,
        severity,
        anomaly_count: Math.round(severity / 18),
        last_reading_minutes_ago: Math.round(Math.random() * 30) + 1,
      });
    });
  });
  const hotspots = [...cells].sort((a, b) => b.severity - a.severity).slice(0, 3);
  res.json({
    regions,
    sensors,
    cells,
    hotspots,
    generated_at: new Date().toISOString(),
  });
});

// ===== NON-VIZ 1: Generate water bill / usage PDF =====
// POST /api/custom-views/bill-pdf  { account_number, customer_name, usage_gallons, period }
router.post('/bill-pdf', auth, (req, res) => {
  const {
    account_number = 'ACC-000000',
    customer_name = 'Sample Customer',
    usage_gallons = 6200,
    period = new Date().toISOString().slice(0, 7),
    address = '—',
  } = req.body || {};

  // Compute tiered charges from current tariff table
  let remaining = Number(usage_gallons) || 0;
  let total = 0;
  const breakdown = [];
  const sorted = [...tariffs].sort((a, b) => a.min_gallons - b.min_gallons);
  for (const t of sorted) {
    if (remaining <= 0) break;
    const ceiling = t.max_gallons == null ? Infinity : t.max_gallons;
    const bandWidth = ceiling - t.min_gallons + 1;
    const billed = Math.min(remaining, bandWidth);
    const cost = +((billed / 1000) * t.rate_per_1000).toFixed(2);
    breakdown.push({ tier: t.tier, gallons: billed, rate_per_1000: t.rate_per_1000, cost });
    total += cost;
    remaining -= billed;
  }
  const fixed_service_charge = 14.50;
  const tax = +((total + fixed_service_charge) * 0.0625).toFixed(2);
  const grand_total = +(total + fixed_service_charge + tax).toFixed(2);

  // Minimal valid PDF (1 page) with bill text. No external deps.
  const lines = [
    'AquaFlow AI - Water Utility Bill',
    `Account: ${account_number}`,
    `Customer: ${customer_name}`,
    `Service Address: ${address}`,
    `Billing Period: ${period}`,
    '',
    `Total Usage: ${usage_gallons} gallons`,
    '',
    'Tiered Charges:',
    ...breakdown.map(b => `  ${b.tier}: ${b.gallons} gal @ $${b.rate_per_1000}/kgal = $${b.cost}`),
    '',
    `Subtotal: $${total.toFixed(2)}`,
    `Fixed Service Charge: $${fixed_service_charge.toFixed(2)}`,
    `Tax (6.25%): $${tax.toFixed(2)}`,
    `Amount Due: $${grand_total.toFixed(2)}`,
  ];

  // Build a tiny PDF by hand (one page, Helvetica, multiple text lines).
  const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let textOps = 'BT\n/F1 12 Tf\n14 TL\n50 770 Td\n';
  lines.forEach((ln, i) => {
    if (i === 0) textOps += `(${escape(ln)}) Tj\n`;
    else textOps += `T*\n(${escape(ln)}) Tj\n`;
  });
  textOps += 'ET';

  const stream = textOps;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, idx) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${idx + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const buffer = Buffer.from(pdf, 'binary');

  if (req.query.format === 'json') {
    return res.json({
      account_number,
      customer_name,
      period,
      usage_gallons,
      breakdown,
      fixed_service_charge,
      tax,
      grand_total,
      pdf_bytes: buffer.length,
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="bill-${account_number}-${period}.pdf"`);
  res.setHeader('X-Bill-Amount', String(grand_total));
  res.send(buffer);
});

// ===== NON-VIZ 2: Tariff / rate rules editor (CRUD) =====
// GET /api/custom-views/tariffs
// POST /api/custom-views/tariffs            -> create
// PUT /api/custom-views/tariffs/:id         -> update
// DELETE /api/custom-views/tariffs/:id      -> delete
router.get('/tariffs', auth, (req, res) => {
  res.json({ count: tariffs.length, tariffs: tariffs.slice().sort((a, b) => a.min_gallons - b.min_gallons) });
});

router.post('/tariffs', auth, (req, res) => {
  const { tier, min_gallons, max_gallons, rate_per_1000, description } = req.body || {};
  if (!tier || min_gallons == null || rate_per_1000 == null) {
    return res.status(400).json({ error: 'tier, min_gallons, rate_per_1000 required' });
  }
  const row = {
    id: ++tariffSeq,
    tier: String(tier),
    min_gallons: Number(min_gallons),
    max_gallons: max_gallons == null || max_gallons === '' ? null : Number(max_gallons),
    rate_per_1000: Number(rate_per_1000),
    description: description || '',
  };
  tariffs.push(row);
  res.status(201).json({ created: row });
});

router.put('/tariffs/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const row = tariffs.find(t => t.id === id);
  if (!row) return res.status(404).json({ error: 'tariff not found' });
  const fields = ['tier', 'min_gallons', 'max_gallons', 'rate_per_1000', 'description'];
  fields.forEach((k) => {
    if (k in (req.body || {})) {
      if (k === 'max_gallons' && (req.body[k] === '' || req.body[k] == null)) row[k] = null;
      else if (['min_gallons', 'max_gallons', 'rate_per_1000'].includes(k)) row[k] = Number(req.body[k]);
      else row[k] = req.body[k];
    }
  });
  res.json({ updated: row });
});

router.delete('/tariffs/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const idx = tariffs.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'tariff not found' });
  const [removed] = tariffs.splice(idx, 1);
  res.json({ deleted: removed });
});

module.exports = router;
