const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// GET /api/water-quality - list all with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const total = parseInt((await db.query('SELECT COUNT(*) FROM water_quality')).rows[0].count);
    const result = await db.query(
      'SELECT * FROM water_quality ORDER BY sampled_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching water quality records:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/water-quality/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM water_quality WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Water quality record not found' });
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

    if (result.rows.length === 0) return res.status(404).json({ error: 'Water quality record not found' });
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
    if (result.rows.length === 0) return res.status(404).json({ error: 'Water quality record not found' });
    res.json({ message: 'Water quality record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting water quality record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/water-quality/:id/analyze - Deep AI analysis with JSON output
router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM water_quality WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) return res.status(404).json({ error: 'Water quality record not found' });

    const data = record.rows[0];

    // Query recent readings from same location for trend analysis
    const recentReadings = await db.query(
      'SELECT * FROM water_quality WHERE location_name = $1 AND id != $2 ORDER BY sampled_at DESC LIMIT 5',
      [data.location_name, data.id]
    );

    const aiResult = await callOpenRouter([
      {
        role: 'system',
        content: 'You are a certified water quality engineer and public health expert with deep knowledge of EPA SDWA regulations. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Analyze water quality sample for regulatory compliance and public health assessment.

Sample Data:
- Sample ID: ${data.sample_id}
- Location: ${data.location_name}
- Sample Date: ${data.sampled_at}
- pH Level: ${data.ph_level} (EPA Range: 6.5-8.5)
- Turbidity: ${data.turbidity_ntu} NTU (EPA MCL: 1.0 NTU)
- Chlorine Residual: ${data.chlorine_residual} mg/L (EPA Range: 0.2-4.0 mg/L)
- Lead: ${data.lead_ppb} ppb (EPA Action Level: 15 ppb)
- Copper: ${data.copper_ppb} ppb (EPA Action Level: 1300 ppb)
- Total Coliform: ${data.coliform_present ? 'DETECTED' : 'Not Detected'}
- E. coli: ${data.ecoli_present ? 'DETECTED' : 'Not Detected'}
- Temperature: ${data.temperature_c}°C
- Compliance Status: ${data.compliance_status}

Historical readings from same location (${recentReadings.rows.length} records): ${JSON.stringify(recentReadings.rows.map(r => ({
  date: r.sampled_at, ph: r.ph_level, turbidity: r.turbidity_ntu, chlorine: r.chlorine_residual, lead: r.lead_ppb, compliance: r.compliance_status
})))}

Respond with this JSON:
{
  "compliance_status": "compliant|non_compliant|borderline",
  "overall_risk_level": "low|medium|high|critical",
  "overall_risk_score": 0-100,
  "parameter_assessments": [
    {"parameter": "pH", "value": 0, "status": "normal|elevated|critical", "epa_limit": "6.5-8.5", "action_required": false}
  ],
  "public_health_risk": "assessment text",
  "immediate_actions_required": ["action 1"],
  "treatment_recommendations": ["recommendation 1"],
  "consumer_notification_required": false,
  "notification_reason": "reason if required",
  "contaminant_source_analysis": ["source 1"],
  "monitoring_frequency_recommendation": "daily|weekly|monthly",
  "trend_analysis": "improving|stable|deteriorating",
  "estimated_remediation_cost": 0,
  "regulatory_violations": ["violation 1"]
}`
      }
    ]);

    const parsedResult = parseAIJson(aiResult.content);

    await db.query('UPDATE water_quality SET ai_analysis = $1 WHERE id = $2', [aiResult.content, data.id]);
    await persistAIResult({
      featureType: 'water_quality_analysis',
      entityId: data.id,
      entityType: 'water_quality',
      userId: req.user.id,
      inputData: { sample_id: data.sample_id, location_name: data.location_name, ph_level: data.ph_level },
      result: parsedResult,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      processingTimeMs: aiResult.processingTimeMs
    });

    const updated = await db.query('SELECT * FROM water_quality WHERE id = $1', [data.id]);

    res.json({ success: true, analysis: parsedResult, raw: aiResult.content, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing water quality:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
