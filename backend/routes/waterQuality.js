const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

// GET /api/water-quality - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM water_quality ORDER BY sampled_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching water quality records:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/water-quality/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM water_quality WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water quality record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching water quality record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/water-quality - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      sample_id, location_name, ph_level, turbidity_ntu,
      chlorine_residual, lead_ppb, copper_ppb, coliform_present,
      ecoli_present, temperature_c, compliance_status, sampled_at
    } = req.body;

    const result = await db.query(
      `INSERT INTO water_quality (sample_id, location_name, ph_level, turbidity_ntu,
        chlorine_residual, lead_ppb, copper_ppb, coliform_present,
        ecoli_present, temperature_c, compliance_status, sampled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [sample_id, location_name, ph_level, turbidity_ntu,
       chlorine_residual, lead_ppb, copper_ppb, coliform_present || false,
       ecoli_present || false, temperature_c, compliance_status || 'compliant', sampled_at]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating water quality record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/water-quality/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      sample_id, location_name, ph_level, turbidity_ntu,
      chlorine_residual, lead_ppb, copper_ppb, coliform_present,
      ecoli_present, temperature_c, compliance_status
    } = req.body;

    const result = await db.query(
      `UPDATE water_quality SET
        sample_id = COALESCE($1, sample_id),
        location_name = COALESCE($2, location_name),
        ph_level = COALESCE($3, ph_level),
        turbidity_ntu = COALESCE($4, turbidity_ntu),
        chlorine_residual = COALESCE($5, chlorine_residual),
        lead_ppb = COALESCE($6, lead_ppb),
        copper_ppb = COALESCE($7, copper_ppb),
        coliform_present = COALESCE($8, coliform_present),
        ecoli_present = COALESCE($9, ecoli_present),
        temperature_c = COALESCE($10, temperature_c),
        compliance_status = COALESCE($11, compliance_status)
       WHERE id = $12 RETURNING *`,
      [sample_id, location_name, ph_level, turbidity_ntu,
       chlorine_residual, lead_ppb, copper_ppb, coliform_present,
       ecoli_present, temperature_c, compliance_status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water quality record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating water quality record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/water-quality/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM water_quality WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Water quality record not found' });
    }
    res.json({ message: 'Water quality record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting water quality record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/water-quality/:id/analyze - AI analysis
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM water_quality WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Water quality record not found' });
    }

    const data = record.rows[0];

    const promptText = `Analyze the following water quality sample data for regulatory compliance and public health assessment.

Sample ID: ${data.sample_id}
Location: ${data.location_name}
Sample Date: ${data.sampled_at}

Water Quality Parameters:
- pH Level: ${data.ph_level} (EPA Standard: 6.5-8.5)
- Turbidity: ${data.turbidity_ntu} NTU (EPA MCL: 1.0 NTU, Goal: <0.3 NTU)
- Chlorine Residual: ${data.chlorine_residual} mg/L (EPA Range: 0.2-4.0 mg/L)
- Lead: ${data.lead_ppb} ppb (EPA Action Level: 15 ppb)
- Copper: ${data.copper_ppb} ppb (EPA Action Level: 1300 ppb)
- Total Coliform: ${data.coliform_present ? 'DETECTED' : 'Not Detected'}
- E. coli: ${data.ecoli_present ? 'DETECTED' : 'Not Detected'}
- Water Temperature: ${data.temperature_c}°C

Current Compliance Status: ${data.compliance_status}

Please provide a comprehensive water quality analysis including:
1) Regulatory Compliance Assessment - Evaluate each parameter against EPA Safe Drinking Water Act standards and state regulations
2) Public Health Risk Evaluation - Assess any immediate or long-term health risks based on the sample results
3) Contaminant Source Analysis - Identify potential sources for any parameters that are elevated or out of range
4) Treatment Effectiveness - Evaluate whether current treatment processes are adequately controlling contaminants
5) Corrective Actions Required - Specific steps needed if any parameters exceed regulatory limits
6) Monitoring Recommendations - Suggested follow-up sampling frequency and additional parameters to test
7) Consumer Notification Requirements - Whether public notification is required under the Safe Drinking Water Act

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

    await db.query('UPDATE water_quality SET ai_analysis = $1 WHERE id = $2', [aiResult, req.params.id]);

    const updated = await db.query('SELECT * FROM water_quality WHERE id = $1', [req.params.id]);

    res.json({ analysis: aiResult, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing water quality:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
