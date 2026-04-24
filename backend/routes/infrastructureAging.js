const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

// GET /api/infrastructure-aging - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM infrastructure_aging ORDER BY failure_probability DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching infrastructure records:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/infrastructure-aging/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM infrastructure_aging WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Infrastructure record not found' });
    }
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Infrastructure record not found' });
    }

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
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Infrastructure record not found' });
    }
    res.json({ message: 'Infrastructure record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting infrastructure record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/infrastructure-aging/:id/analyze - AI analysis
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM infrastructure_aging WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Infrastructure record not found' });
    }

    const data = record.rows[0];

    const promptText = `Analyze the following water infrastructure asset for aging assessment, failure risk, and capital improvement planning.

Asset ID: ${data.asset_id}
Asset Type: ${data.asset_type}
Material: ${data.material}
Installation Date: ${data.install_date}
Age: ${data.age_years} years
Condition Score: ${data.condition_score}/10
Failure Probability: ${(data.failure_probability * 100).toFixed(1)}%
Replacement Cost: $${data.replacement_cost ? Number(data.replacement_cost).toLocaleString() : 'N/A'}
Last Inspection: ${data.last_inspection}
Location: ${data.location}
Diameter: ${data.diameter_inches ? data.diameter_inches + ' inches' : 'N/A'}
Length: ${data.length_feet ? data.length_feet + ' feet' : 'N/A'}
Break History: ${data.break_history} recorded breaks
Current Priority: ${data.priority}

Please provide a comprehensive infrastructure aging analysis including:
1) Remaining Useful Life Estimate - Based on material type, age, condition score, and break history, estimate years of remaining service life
2) Failure Risk Assessment - Evaluate the probability and consequences of failure, including potential for service disruption and property damage
3) Material-Specific Concerns - Known degradation patterns for ${data.material} pipes/assets of this age
4) Prioritization Recommendation - Should this asset be prioritized for replacement, rehabilitation, or continued monitoring? Justify the recommendation
5) Rehabilitation Options - Available rehabilitation methods (e.g., CIPP lining, slip lining, cathodic protection) and their cost-effectiveness
6) Capital Planning Recommendation - When should this asset be budgeted for replacement in the Capital Improvement Program (CIP)?
7) Risk Mitigation Measures - Interim measures to reduce failure risk before replacement/rehabilitation

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

    await db.query('UPDATE infrastructure_aging SET ai_analysis = $1 WHERE id = $2', [aiResult, req.params.id]);

    const updated = await db.query('SELECT * FROM infrastructure_aging WHERE id = $1', [req.params.id]);

    res.json({ analysis: aiResult, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing infrastructure:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
