const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// POST /api/ai/demand-forecasting
router.post('/', auth, aiRateLimiter, async (req, res) => {
  try {
    const { region, historicalDemand, weatherForecast, populationTrend, horizonHours = 168 } = req.body || {};
    const messages = [
      { role: 'system', content: 'You are a water demand forecasting analyst. Always respond with valid JSON.' },
      { role: 'user', content: `Forecast hourly water demand for the next ${horizonHours} hours in ${region || 'the service area'}.\n\nHistorical demand: ${JSON.stringify(historicalDemand || [])}\nWeather forecast: ${JSON.stringify(weatherForecast || {})}\nPopulation / events: ${JSON.stringify(populationTrend || {})}\n\nReturn JSON: { "forecast": [{ "hour": 0, "expectedDemandM3": 0, "ciLow": 0, "ciHigh": 0 }], "peakHours": [0], "drivers": ["..."], "summary": "" }` }
    ];
    const result = await callOpenRouter(messages);
    const parsed = parseAIJson(result.content) || { raw: result.content };
    await persistAIResult({ featureType: 'demand-forecasting', entityType: 'region', userId: req.user?.id, inputData: { region, horizonHours }, result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
    res.json({ result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
  } catch (err) {
    console.error('Demand forecasting error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
