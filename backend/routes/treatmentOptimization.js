const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

// GET /api/treatment-optimization - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM treatment_optimization ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching treatment optimization records:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/treatment-optimization/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM treatment_optimization WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment optimization record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching treatment optimization record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/treatment-optimization - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      plant_name, process_stage, chemical_type, current_dosage,
      recommended_dosage, influent_turbidity, effluent_turbidity,
      flow_rate_mgd, energy_kwh, cost_per_day, optimization_status
    } = req.body;

    const result = await db.query(
      `INSERT INTO treatment_optimization (plant_name, process_stage, chemical_type, current_dosage,
        recommended_dosage, influent_turbidity, effluent_turbidity,
        flow_rate_mgd, energy_kwh, cost_per_day, optimization_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [plant_name, process_stage, chemical_type, current_dosage,
       recommended_dosage, influent_turbidity, effluent_turbidity,
       flow_rate_mgd, energy_kwh, cost_per_day, optimization_status || 'pending']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating treatment optimization record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/treatment-optimization/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      plant_name, process_stage, chemical_type, current_dosage,
      recommended_dosage, influent_turbidity, effluent_turbidity,
      flow_rate_mgd, energy_kwh, cost_per_day, optimization_status
    } = req.body;

    const result = await db.query(
      `UPDATE treatment_optimization SET
        plant_name = COALESCE($1, plant_name),
        process_stage = COALESCE($2, process_stage),
        chemical_type = COALESCE($3, chemical_type),
        current_dosage = COALESCE($4, current_dosage),
        recommended_dosage = COALESCE($5, recommended_dosage),
        influent_turbidity = COALESCE($6, influent_turbidity),
        effluent_turbidity = COALESCE($7, effluent_turbidity),
        flow_rate_mgd = COALESCE($8, flow_rate_mgd),
        energy_kwh = COALESCE($9, energy_kwh),
        cost_per_day = COALESCE($10, cost_per_day),
        optimization_status = COALESCE($11, optimization_status)
       WHERE id = $12 RETURNING *`,
      [plant_name, process_stage, chemical_type, current_dosage,
       recommended_dosage, influent_turbidity, effluent_turbidity,
       flow_rate_mgd, energy_kwh, cost_per_day, optimization_status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment optimization record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating treatment optimization record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/treatment-optimization/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM treatment_optimization WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment optimization record not found' });
    }
    res.json({ message: 'Treatment optimization record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting treatment optimization record:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/treatment-optimization/:id/analyze - AI analysis
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM treatment_optimization WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment optimization record not found' });
    }

    const data = record.rows[0];

    const promptText = `Analyze the following water treatment process data for optimization opportunities at a municipal water treatment plant.

Plant: ${data.plant_name}
Process Stage: ${data.process_stage}
Chemical Type: ${data.chemical_type || 'N/A (physical process)'}
Current Dosage: ${data.current_dosage ? data.current_dosage + ' mg/L' : 'N/A'}
Recommended Dosage: ${data.recommended_dosage ? data.recommended_dosage + ' mg/L' : 'N/A'}
Influent Turbidity: ${data.influent_turbidity ? data.influent_turbidity + ' NTU' : 'N/A'}
Effluent Turbidity: ${data.effluent_turbidity ? data.effluent_turbidity + ' NTU' : 'N/A'}
Flow Rate: ${data.flow_rate_mgd} MGD
Energy Consumption: ${data.energy_kwh} kWh
Daily Operating Cost: $${data.cost_per_day}
Current Optimization Status: ${data.optimization_status}

Please provide a comprehensive treatment optimization analysis including:
1) Process Efficiency Assessment - Evaluate the current treatment efficiency based on influent vs effluent quality and chemical dosing
2) Chemical Dosage Optimization - Analyze whether the current dosage is optimal, and if the recommended dosage would maintain water quality while reducing costs
3) Cost Savings Analysis - Calculate potential daily, monthly, and annual savings from optimizing chemical usage and energy consumption
4) Energy Efficiency Recommendations - Identify opportunities to reduce energy consumption in this process stage
5) Water Quality Impact - Assess whether proposed optimizations could affect finished water quality or regulatory compliance
6) Process Control Recommendations - Suggest SCADA setpoints, monitoring parameters, and control strategies for optimal performance
7) Environmental Impact - Evaluate chemical usage reduction benefits and sludge production implications

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

    await db.query('UPDATE treatment_optimization SET ai_analysis = $1 WHERE id = $2', [aiResult, req.params.id]);

    const updated = await db.query('SELECT * FROM treatment_optimization WHERE id = $1', [req.params.id]);

    res.json({ analysis: aiResult, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing treatment optimization:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
