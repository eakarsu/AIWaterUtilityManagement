const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// GET /api/infrastructure-aging - list all with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const total = parseInt((await db.query('SELECT COUNT(*) FROM infrastructure_aging')).rows[0].count);
    const result = await db.query(
      'SELECT * FROM infrastructure_aging ORDER BY failure_probability DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching infrastructure records:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/infrastructure-aging/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM infrastructure_aging WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Infrastructure record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching infrastructure record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/infrastructure-aging - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      asset_id, asset_type, material, install_date, age_years,
      condition_score, failure_probability, replacement_cost,
      last_inspection, location, diameter_inches, length_feet,
      break_history, priority
    } = req.body;

    const result = await db.query(
      `INSERT INTO infrastructure_aging (asset_id, asset_type, material, install_date, age_years,
        condition_score, failure_probability, replacement_cost,
        last_inspection, location, diameter_inches, length_feet,
        break_history, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [asset_id, asset_type, material, install_date, age_years,
       condition_score, failure_probability, replacement_cost,
       last_inspection, location, diameter_inches, length_feet,
       break_history || 0, priority || 'medium']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating infrastructure record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/infrastructure-aging/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      asset_id, asset_type, material, install_date, age_years,
      condition_score, failure_probability, replacement_cost,
      last_inspection, location, diameter_inches, length_feet,
      break_history, priority
    } = req.body;

    const result = await db.query(
      `UPDATE infrastructure_aging SET
        asset_id = COALESCE($1, asset_id),
        asset_type = COALESCE($2, asset_type),
        material = COALESCE($3, material),
        install_date = COALESCE($4, install_date),
        age_years = COALESCE($5, age_years),
        condition_score = COALESCE($6, condition_score),
        failure_probability = COALESCE($7, failure_probability),
        replacement_cost = COALESCE($8, replacement_cost),
        last_inspection = COALESCE($9, last_inspection),
        location = COALESCE($10, location),
        diameter_inches = COALESCE($11, diameter_inches),
        length_feet = COALESCE($12, length_feet),
        break_history = COALESCE($13, break_history),
        priority = COALESCE($14, priority)
       WHERE id = $15 RETURNING *`,
      [asset_id, asset_type, material, install_date, age_years,
       condition_score, failure_probability, replacement_cost,
       last_inspection, location, diameter_inches, length_feet,
       break_history, priority, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Infrastructure record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating infrastructure record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/infrastructure-aging/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM infrastructure_aging WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Infrastructure record not found' });
    res.json({ message: 'Infrastructure record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting infrastructure record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/infrastructure-aging/:id/analyze - Deep AI analysis with JSON output
router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM infrastructure_aging WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) return res.status(404).json({ error: 'Infrastructure record not found' });

    const data = record.rows[0];

    // Query related assets for context
    const sameTypeAssets = await db.query(
      'SELECT * FROM infrastructure_aging WHERE asset_type = $1 AND id != $2 ORDER BY failure_probability DESC LIMIT 5',
      [data.asset_type, data.id]
    );
    const recentLeaks = await db.query(
      'SELECT * FROM leak_detections WHERE zone_name ILIKE $1 ORDER BY detected_at DESC LIMIT 3',
      [`%${data.location?.split(' ')[0] || ''}%`]
    );

    const aiResult = await callOpenRouter([
      {
        role: 'system',
        content: 'You are a water utility infrastructure engineer with expertise in asset management and failure prediction. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Analyze this water infrastructure asset for aging and failure risk.

Asset Details:
- Asset ID: ${data.asset_id}
- Asset Type: ${data.asset_type}
- Material: ${data.material}
- Installation Date: ${data.install_date}
- Age: ${data.age_years} years
- Condition Score: ${data.condition_score}/10
- Current Failure Probability: ${(data.failure_probability * 100).toFixed(1)}%
- Replacement Cost: $${data.replacement_cost ? Number(data.replacement_cost).toLocaleString() : 'N/A'}
- Last Inspection: ${data.last_inspection}
- Location: ${data.location}
- Diameter: ${data.diameter_inches ? data.diameter_inches + ' inches' : 'N/A'}
- Length: ${data.length_feet ? data.length_feet + ' feet' : 'N/A'}
- Break History: ${data.break_history} recorded breaks
- Current Priority: ${data.priority}

Similar assets in system (${sameTypeAssets.rows.length}): ${JSON.stringify(sameTypeAssets.rows.map(r => ({
  id: r.asset_id, age: r.age_years, condition: r.condition_score, failure_prob: r.failure_probability, breaks: r.break_history
})))}

Recent leaks in area: ${JSON.stringify(recentLeaks.rows.map(r => ({ zone: r.zone_name, severity: r.severity, date: r.detected_at })))}

Respond with this JSON:
{
  "remaining_useful_life_years": 0,
  "failure_probability_updated": 0.0,
  "failure_risk_level": "low|medium|high|critical",
  "risk_consequences": "description of failure impact",
  "material_specific_concerns": ["concern 1", "concern 2"],
  "recommended_action": "replace|rehabilitate|monitor",
  "recommended_action_timeline": "immediate|within_1_year|within_3_years|within_5_years",
  "rehabilitation_options": [{"method": "", "cost": 0, "extends_life_years": 0, "effectiveness": "low|medium|high"}],
  "capital_planning_year": 2025,
  "risk_mitigation_measures": ["measure 1", "measure 2"],
  "inspection_frequency_recommendation": "monthly|quarterly|annual",
  "priority_score": 0-100,
  "replacement_urgency": "low|medium|high|emergency",
  "estimated_annual_risk_cost": 0
}`
      }
    ]);

    const parsedResult = parseAIJson(aiResult.content);

    await db.query('UPDATE infrastructure_aging SET ai_analysis = $1 WHERE id = $2', [aiResult.content, data.id]);
    await persistAIResult({
      featureType: 'infrastructure_aging_analysis',
      entityId: data.id,
      entityType: 'infrastructure_aging',
      userId: req.user.id,
      inputData: { asset_id: data.asset_id, material: data.material, age_years: data.age_years },
      result: parsedResult,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      processingTimeMs: aiResult.processingTimeMs
    });

    const updated = await db.query('SELECT * FROM infrastructure_aging WHERE id = $1', [data.id]);

    res.json({ success: true, analysis: parsedResult, raw: aiResult.content, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing infrastructure:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
