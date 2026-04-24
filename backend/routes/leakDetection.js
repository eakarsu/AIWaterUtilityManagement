const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

// GET /api/leak-detection - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM leak_detections ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching leak detections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leak-detection/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM leak_detections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leak detection record not found' });
    }
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leak detection record not found' });
    }

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
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leak detection record not found' });
    }
    res.json({ message: 'Leak detection record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting leak detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leak-detection/:id/analyze - AI analysis
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM leak_detections WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Leak detection record not found' });
    }

    const data = record.rows[0];

    const promptText = `Analyze the following water pressure and flow data for potential leak detection in a municipal water distribution system.

Zone: ${data.zone_name}
Sensor ID: ${data.sensor_id}
Current Pressure: ${data.pressure_psi} PSI (Normal Baseline: ${data.normal_pressure} PSI)
Current Flow Rate: ${data.flow_rate_gpm} GPM (Normal Baseline: ${data.normal_flow} GPM)
Pressure Drop: ${data.pressure_drop_pct}%
Flow Anomaly: ${data.flow_anomaly_pct}%
Current Status: ${data.status}
Current Severity: ${data.severity}
Detection Time: ${data.detected_at}

Please provide a comprehensive analysis including:
1) Leak Probability Assessment - Based on pressure drop and flow anomaly percentages, estimate the likelihood of an active leak
2) Severity Classification - Classify as low/medium/high/critical with justification
3) Root Cause Analysis - Possible causes for the observed pressure and flow deviations
4) Recommended Immediate Actions - Steps to take right now to address the situation
5) Long-term Recommendations - Infrastructure improvements or monitoring changes to prevent future occurrences
6) Estimated Water Loss - Based on the flow anomaly, estimate gallons per hour being lost

Format your response in clear, labeled sections.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: process.env.OPENROUTER_MODEL,
      messages: [{ role: 'user', content: promptText }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResult = response.data.choices[0].message.content;

    await db.query('UPDATE leak_detections SET ai_analysis = $1 WHERE id = $2', [aiResult, req.params.id]);

    const updated = await db.query('SELECT * FROM leak_detections WHERE id = $1', [req.params.id]);

    res.json({ analysis: aiResult, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing leak detection:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
