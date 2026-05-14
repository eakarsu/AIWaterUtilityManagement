const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// GET /api/leak-detection - list all with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const total = parseInt((await db.query('SELECT COUNT(*) FROM leak_detections')).rows[0].count);
    const result = await db.query(
      'SELECT * FROM leak_detections ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching leak detections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leak-detection/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM leak_detections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Leak detection record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching leak detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leak-detection - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      zone_name, sensor_id, pressure_psi, flow_rate_gpm,
      normal_pressure, normal_flow, pressure_drop_pct, flow_anomaly_pct,
      status, severity, location_lat, location_lng
    } = req.body;

    const result = await db.query(
      `INSERT INTO leak_detections (zone_name, sensor_id, pressure_psi, flow_rate_gpm,
        normal_pressure, normal_flow, pressure_drop_pct, flow_anomaly_pct,
        status, severity, location_lat, location_lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [zone_name, sensor_id, pressure_psi, flow_rate_gpm,
       normal_pressure, normal_flow, pressure_drop_pct, flow_anomaly_pct,
       status || 'monitoring', severity || 'low', location_lat, location_lng]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating leak detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/leak-detection/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      zone_name, sensor_id, pressure_psi, flow_rate_gpm,
      normal_pressure, normal_flow, pressure_drop_pct, flow_anomaly_pct,
      status, severity, location_lat, location_lng
    } = req.body;

    const result = await db.query(
      `UPDATE leak_detections SET
        zone_name = COALESCE($1, zone_name),
        sensor_id = COALESCE($2, sensor_id),
        pressure_psi = COALESCE($3, pressure_psi),
        flow_rate_gpm = COALESCE($4, flow_rate_gpm),
        normal_pressure = COALESCE($5, normal_pressure),
        normal_flow = COALESCE($6, normal_flow),
        pressure_drop_pct = COALESCE($7, pressure_drop_pct),
        flow_anomaly_pct = COALESCE($8, flow_anomaly_pct),
        status = COALESCE($9, status),
        severity = COALESCE($10, severity),
        location_lat = COALESCE($11, location_lat),
        location_lng = COALESCE($12, location_lng)
       WHERE id = $13 RETURNING *`,
      [zone_name, sensor_id, pressure_psi, flow_rate_gpm,
       normal_pressure, normal_flow, pressure_drop_pct, flow_anomaly_pct,
       status, severity, location_lat, location_lng, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Leak detection record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating leak detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/leak-detection/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM leak_detections WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Leak detection record not found' });
    res.json({ message: 'Leak detection record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting leak detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leak-detection/:id/analyze - Deep AI analysis with JSON output
router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM leak_detections WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) return res.status(404).json({ error: 'Leak detection record not found' });

    const data = record.rows[0];

    // Query additional context from DB
    const nearbyLeaks = await db.query(
      'SELECT * FROM leak_detections WHERE zone_name = $1 AND id != $2 ORDER BY created_at DESC LIMIT 5',
      [data.zone_name, data.id]
    );

    const aiResult = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert water utility engineer specializing in leak detection and pressure analysis. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Analyze the following water pressure and flow data for potential leak detection.

Sensor Reading:
- Zone: ${data.zone_name}
- Sensor ID: ${data.sensor_id}
- Current Pressure: ${data.pressure_psi} PSI (Normal Baseline: ${data.normal_pressure} PSI)
- Current Flow Rate: ${data.flow_rate_gpm} GPM (Normal Baseline: ${data.normal_flow} GPM)
- Pressure Drop: ${data.pressure_drop_pct}%
- Flow Anomaly: ${data.flow_anomaly_pct}%
- Current Status: ${data.status}
- Current Severity: ${data.severity}
- Location: lat ${data.location_lat}, lng ${data.location_lng}
- Detection Time: ${data.detected_at}

Recent zone history (${nearbyLeaks.rows.length} records): ${JSON.stringify(nearbyLeaks.rows.map(r => ({
  sensor: r.sensor_id, pressure: r.pressure_psi, flow: r.flow_rate_gpm, severity: r.severity, date: r.detected_at
})))}

Respond with this JSON structure:
{
  "leak_probability": 0-100,
  "severity_classification": "low|medium|high|critical",
  "severity_reason": "explanation",
  "root_cause_analysis": ["possible cause 1", "possible cause 2"],
  "immediate_actions": ["action 1", "action 2", "action 3"],
  "long_term_recommendations": ["recommendation 1", "recommendation 2"],
  "estimated_water_loss_gph": 0,
  "estimated_repair_cost": 0,
  "confidence_score": 0-100,
  "priority_score": 0-100,
  "affected_population_estimate": 0,
  "recommended_response_time_hours": 0
}`
      }
    ]);

    const parsedResult = parseAIJson(aiResult.content);

    await db.query('UPDATE leak_detections SET ai_analysis = $1 WHERE id = $2', [aiResult.content, data.id]);
    await persistAIResult({
      featureType: 'leak_detection_analysis',
      entityId: data.id,
      entityType: 'leak_detection',
      userId: req.user.id,
      inputData: { zone_name: data.zone_name, pressure_psi: data.pressure_psi, flow_rate_gpm: data.flow_rate_gpm },
      result: parsedResult,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      processingTimeMs: aiResult.processingTimeMs
    });

    const updated = await db.query('SELECT * FROM leak_detections WHERE id = $1', [data.id]);

    res.json({ success: true, analysis: parsedResult, raw: aiResult.content, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing leak detection:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
