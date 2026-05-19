const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// GET /api/anomaly-detection - list all with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const total = parseInt((await db.query('SELECT COUNT(*) FROM anomaly_detection')).rows[0].count);
    const result = await db.query(
      'SELECT * FROM anomaly_detection ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching anomaly detections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/anomaly-detection/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM anomaly_detection WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anomaly detection record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching anomaly detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/anomaly-detection - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      meter_id, customer_name, account_number, reading_date,
      consumption_gallons, avg_consumption, deviation_pct,
      anomaly_type, status
    } = req.body;

    const result = await db.query(
      `INSERT INTO anomaly_detection (meter_id, customer_name, account_number, reading_date,
        consumption_gallons, avg_consumption, deviation_pct,
        anomaly_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [meter_id, customer_name, account_number, reading_date,
       consumption_gallons, avg_consumption, deviation_pct,
       anomaly_type, status || 'detected']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating anomaly detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/anomaly-detection/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      meter_id, customer_name, account_number, reading_date,
      consumption_gallons, avg_consumption, deviation_pct,
      anomaly_type, status
    } = req.body;

    const result = await db.query(
      `UPDATE anomaly_detection SET
        meter_id = COALESCE($1, meter_id),
        customer_name = COALESCE($2, customer_name),
        account_number = COALESCE($3, account_number),
        reading_date = COALESCE($4, reading_date),
        consumption_gallons = COALESCE($5, consumption_gallons),
        avg_consumption = COALESCE($6, avg_consumption),
        deviation_pct = COALESCE($7, deviation_pct),
        anomaly_type = COALESCE($8, anomaly_type),
        status = COALESCE($9, status)
       WHERE id = $10 RETURNING *`,
      [meter_id, customer_name, account_number, reading_date,
       consumption_gallons, avg_consumption, deviation_pct,
       anomaly_type, status, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Anomaly detection record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating anomaly detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/anomaly-detection/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM anomaly_detection WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anomaly detection record not found' });
    res.json({ message: 'Anomaly detection record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting anomaly detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/anomaly-detection/:id/analyze - Deep AI analysis with JSON output
router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM anomaly_detection WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) return res.status(404).json({ error: 'Anomaly detection record not found' });

    const data = record.rows[0];

    // Query same meter history and customer meter readings
    const meterHistory = await db.query(
      'SELECT * FROM anomaly_detection WHERE meter_id = $1 AND id != $2 ORDER BY reading_date DESC LIMIT 5',
      [data.meter_id, data.id]
    );
    const meterReadings = await db.query(
      'SELECT * FROM meter_readings WHERE meter_id = $1 ORDER BY reading_date DESC LIMIT 5',
      [data.meter_id]
    );

    const aiResult = await callOpenRouter([
      {
        role: 'system',
        content: 'You are a water utility consumption analyst specializing in anomaly detection and fraud prevention. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Analyze this water meter consumption anomaly.

Anomaly Record:
- Meter ID: ${data.meter_id}
- Customer: ${data.customer_name}
- Account Number: ${data.account_number}
- Reading Date: ${data.reading_date}
- Current Consumption: ${Number(data.consumption_gallons).toLocaleString()} gallons
- Average Consumption: ${Number(data.avg_consumption).toLocaleString()} gallons
- Deviation: ${data.deviation_pct}%
- Anomaly Type: ${data.anomaly_type}
- Current Status: ${data.status}

Anomaly history for this meter (${meterHistory.rows.length}): ${JSON.stringify(meterHistory.rows.map(r => ({
  date: r.reading_date, consumption: r.consumption_gallons, deviation: r.deviation_pct, type: r.anomaly_type
})))}

Recent meter readings: ${JSON.stringify(meterReadings.rows.map(r => ({
  date: r.reading_date, value: r.reading_value, consumption: r.consumption
})))}

Respond with this JSON:
{
  "anomaly_classification": "customer_leak|meter_malfunction|unauthorized_usage|seasonal_variation|billing_error|unknown",
  "primary_cause_probability": 0-100,
  "cause_description": "detailed explanation",
  "financial_impact_customer": 0,
  "financial_impact_utility": 0,
  "infrastructure_concern": false,
  "infrastructure_concern_description": "if applicable",
  "customer_communication_approach": "notification approach",
  "investigation_steps": ["step 1", "step 2", "step 3"],
  "resolution_actions": ["action 1", "action 2"],
  "estimated_resolution_days": 0,
  "severity_level": "low|medium|high|critical",
  "fraud_indicator": false,
  "fraud_probability": 0-100,
  "recommended_bill_adjustment": false,
  "adjustment_amount": 0
}`
      }
    ]);

    const parsedResult = parseAIJson(aiResult.content);

    await db.query('UPDATE anomaly_detection SET ai_analysis = $1 WHERE id = $2', [aiResult.content, data.id]);
    await persistAIResult({
      featureType: 'anomaly_detection_analysis',
      entityId: data.id,
      entityType: 'anomaly_detection',
      userId: req.user.id,
      inputData: { meter_id: data.meter_id, consumption_gallons: data.consumption_gallons, deviation_pct: data.deviation_pct },
      result: parsedResult,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      processingTimeMs: aiResult.processingTimeMs
    });

    const updated = await db.query('SELECT * FROM anomaly_detection WHERE id = $1', [data.id]);

    res.json({ success: true, analysis: parsedResult, raw: aiResult.content, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing anomaly:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
