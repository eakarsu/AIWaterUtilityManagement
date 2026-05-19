const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// GET /api/demand-forecast - list all with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const total = parseInt((await db.query('SELECT COUNT(*) FROM demand_forecasts')).rows[0].count);
    const result = await db.query(
      'SELECT * FROM demand_forecasts ORDER BY forecast_date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching demand forecasts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/demand-forecast/:id - get one
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM demand_forecasts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Demand forecast record not found' });
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

    if (result.rows.length === 0) return res.status(404).json({ error: 'Demand forecast record not found' });
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
    if (result.rows.length === 0) return res.status(404).json({ error: 'Demand forecast record not found' });
    res.json({ message: 'Demand forecast record deleted', record: result.rows[0] });
  } catch (err) {
    console.error('Error deleting demand forecast:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/demand-forecast/:id/analyze - Deep AI analysis with JSON output
router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const record = await db.query('SELECT * FROM demand_forecasts WHERE id = $1', [req.params.id]);
    if (record.rows.length === 0) return res.status(404).json({ error: 'Demand forecast record not found' });

    const data = record.rows[0];

    // Query historical data for context
    const historicalData = await db.query(
      'SELECT * FROM demand_forecasts WHERE zone_name = $1 AND id != $2 ORDER BY forecast_date DESC LIMIT 10',
      [data.zone_name, data.id]
    );
    const reservoirData = await db.query('SELECT * FROM reservoirs LIMIT 5');

    const aiResult = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert water demand analyst with deep knowledge of municipal water systems. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Analyze water demand forecast data for zone "${data.zone_name}".

Current Record:
- Forecast Date: ${data.forecast_date}
- Predicted Demand: ${data.predicted_demand_mgd} MGD
- Actual Demand: ${data.actual_demand_mgd || 'Not yet recorded'} MGD
- Temperature: ${data.temperature_f}°F
- Precipitation: ${data.precipitation_in} inches
- Day of Week: ${data.day_of_week}
- Holiday: ${data.is_holiday ? 'Yes' : 'No'}
- Population Served: ${data.population_served || 'N/A'}
- Season: ${data.season}
- Confidence: ${data.confidence_pct}%

Historical records for same zone (${historicalData.rows.length}): ${JSON.stringify(historicalData.rows.slice(0, 5).map(r => ({
  date: r.forecast_date, predicted: r.predicted_demand_mgd, actual: r.actual_demand_mgd, temp: r.temperature_f, season: r.season
})))}

Reservoir status: ${JSON.stringify(reservoirData.rows.map(r => ({ name: r.reservoir_name, level_pct: r.level_pct, status: r.status })))}

Respond with this JSON:
{
  "demand_pattern_assessment": "detailed assessment",
  "weather_impact_score": 0-100,
  "weather_impact_description": "how weather affects demand",
  "forecast_accuracy_evaluation": "accuracy assessment",
  "variance_explanation": "if actual vs predicted differs",
  "peak_demand_risk": "low|medium|high|critical",
  "peak_demand_probability": 0-100,
  "operational_recommendations": ["action 1", "action 2", "action 3"],
  "conservation_advisory": "conservation message if needed",
  "7_day_forecast": [{"day": "Monday", "predicted_mgd": 0, "confidence": 0}],
  "30_day_trend": "increasing|stable|decreasing",
  "resource_adequacy_score": 0-100,
  "risk_factors": ["risk 1", "risk 2"]
}`
      }
    ]);

    const parsedResult = parseAIJson(aiResult.content);

    await db.query('UPDATE demand_forecasts SET ai_analysis = $1 WHERE id = $2', [aiResult.content, data.id]);
    await persistAIResult({
      featureType: 'demand_forecast_analysis',
      entityId: data.id,
      entityType: 'demand_forecast',
      userId: req.user.id,
      inputData: { zone_name: data.zone_name, forecast_date: data.forecast_date, predicted_demand_mgd: data.predicted_demand_mgd },
      result: parsedResult,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      processingTimeMs: aiResult.processingTimeMs
    });

    const updated = await db.query('SELECT * FROM demand_forecasts WHERE id = $1', [data.id]);

    res.json({ success: true, analysis: parsedResult, raw: aiResult.content, record: updated.rows[0] });
  } catch (err) {
    console.error('Error analyzing demand forecast:', err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

module.exports = router;
