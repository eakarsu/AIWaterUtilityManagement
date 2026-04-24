const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

// GET /api/anomaly-detection - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM anomaly_detection ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching anomaly detections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/anomaly-detection/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM anomaly_detection WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anomaly detection record not found' });
    }
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anomaly detection record not found' });
    }

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
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anomaly detection record not found' });
    }
    res.json({ message: 'Anomaly detection record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting anomaly detection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/anomaly-detection/:id/analyze - AI analysis
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM anomaly_detection WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Anomaly detection record not found' });
    }

    const data = record.rows[0];

    const promptText = `Analyze the following water meter consumption anomaly for a municipal water utility customer.

Meter ID: ${data.meter_id}
Customer: ${data.customer_name}
Account Number: ${data.account_number}
Reading Date: ${data.reading_date}
Current Consumption: ${Number(data.consumption_gallons).toLocaleString()} gallons
Average Consumption: ${Number(data.avg_consumption).toLocaleString()} gallons
Deviation: ${data.deviation_pct}%
Anomaly Type: ${data.anomaly_type}
Current Status: ${data.status}

Please provide a comprehensive consumption anomaly analysis including:
1) Anomaly Classification - Categorize this anomaly (e.g., customer-side leak, meter malfunction, unauthorized usage, seasonal variation, billing error)
2) Probability Assessment - What is the most likely cause of this consumption deviation?
3) Financial Impact - Estimate the financial impact on the customer's bill and potential revenue implications for the utility
4) Infrastructure Concerns - Could this anomaly indicate a distribution system issue (e.g., main break, service line leak)?
5) Customer Communication Recommendation - Suggested approach for notifying and working with the customer
6) Investigation Steps - Specific field investigation steps to determine the root cause
7) Resolution Actions - Recommended actions to resolve the anomaly and prevent recurrence

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

    await db.query('UPDATE anomaly_detection SET ai_analysis = $1 WHERE id = $2', [aiResult, req.params.id]);

    const updated = await db.query('SELECT * FROM anomaly_detection WHERE id = $1', [req.params.id]);

    res.json({ analysis: aiResult, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing anomaly:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
