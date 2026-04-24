const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

// GET /api/demand-forecast - list all
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM demand_forecasts ORDER BY forecast_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching demand forecasts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/demand-forecast/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM demand_forecasts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demand forecast record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching demand forecast:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/demand-forecast - create new
router.post('/', auth, async (req, res) => {
  try {
    const {
      zone_name, forecast_date, predicted_demand_mgd, actual_demand_mgd,
      temperature_f, precipitation_in, day_of_week, is_holiday,
      population_served, season, confidence_pct
    } = req.body;

    const result = await db.query(
      `INSERT INTO demand_forecasts (zone_name, forecast_date, predicted_demand_mgd, actual_demand_mgd,
        temperature_f, precipitation_in, day_of_week, is_holiday,
        population_served, season, confidence_pct)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [zone_name, forecast_date, predicted_demand_mgd, actual_demand_mgd,
       temperature_f, precipitation_in, day_of_week, is_holiday,
       population_served, season, confidence_pct]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating demand forecast:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/demand-forecast/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      zone_name, forecast_date, predicted_demand_mgd, actual_demand_mgd,
      temperature_f, precipitation_in, day_of_week, is_holiday,
      population_served, season, confidence_pct
    } = req.body;

    const result = await db.query(
      `UPDATE demand_forecasts SET
        zone_name = COALESCE($1, zone_name),
        forecast_date = COALESCE($2, forecast_date),
        predicted_demand_mgd = COALESCE($3, predicted_demand_mgd),
        actual_demand_mgd = COALESCE($4, actual_demand_mgd),
        temperature_f = COALESCE($5, temperature_f),
        precipitation_in = COALESCE($6, precipitation_in),
        day_of_week = COALESCE($7, day_of_week),
        is_holiday = COALESCE($8, is_holiday),
        population_served = COALESCE($9, population_served),
        season = COALESCE($10, season),
        confidence_pct = COALESCE($11, confidence_pct)
       WHERE id = $12 RETURNING *`,
      [zone_name, forecast_date, predicted_demand_mgd, actual_demand_mgd,
       temperature_f, precipitation_in, day_of_week, is_holiday,
       population_served, season, confidence_pct, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demand forecast record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating demand forecast:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/demand-forecast/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM demand_forecasts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demand forecast record not found' });
    }
    res.json({ message: 'Demand forecast record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting demand forecast:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/demand-forecast/:id/analyze - AI analysis
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM demand_forecasts WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Demand forecast record not found' });
    }

    const data = record.rows[0];

    const promptText = `Analyze the following water demand forecast data for a municipal water utility service zone.

Zone: ${data.zone_name}
Forecast Date: ${data.forecast_date}
Predicted Demand: ${data.predicted_demand_mgd} MGD (Million Gallons per Day)
Actual Demand: ${data.actual_demand_mgd || 'Not yet recorded'} MGD
Temperature: ${data.temperature_f}°F
Precipitation: ${data.precipitation_in} inches
Day of Week: ${data.day_of_week}
Holiday: ${data.is_holiday ? 'Yes' : 'No'}
Population Served: ${data.population_served ? data.population_served.toLocaleString() : 'N/A'}
Season: ${data.season}
Forecast Confidence: ${data.confidence_pct}%

Please provide a comprehensive demand forecast analysis including:
1) Demand Pattern Assessment - Evaluate the predicted demand relative to seasonal norms and population size
2) Weather Impact Analysis - How temperature and precipitation are likely affecting water demand
3) Forecast Accuracy Evaluation - ${data.actual_demand_mgd ? 'Compare predicted vs actual demand and explain any variance' : 'Assess the confidence level and factors that could affect accuracy'}
4) Peak Demand Risk - Assess the likelihood of demand spikes that could stress the system
5) Operational Recommendations - Suggested actions for treatment plant operations, pump scheduling, and reservoir management
6) Conservation Advisory - Any water conservation measures that should be communicated to customers

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

    await db.query('UPDATE demand_forecasts SET ai_analysis = $1 WHERE id = $2', [aiResult, req.params.id]);

    const updated = await db.query('SELECT * FROM demand_forecasts WHERE id = $1', [req.params.id]);

    res.json({ analysis: aiResult, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing demand forecast:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
