const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// POST /api/ai/anomaly-analyzer
// Text-only AI counterpart to /api/anomaly-detection. Accepts arbitrary anomaly events
// (no DB binding) and returns triage classification + recommendation in JSON.
router.post('/', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable. Set OPENROUTER_API_KEY on the backend and restart.' });
    }

    const { meterId, customerName, readingDate, consumptionGallons, avgConsumption, deviationPct, anomalyType, history, context } = req.body || {};

    const messages = [
      {
        role: 'system',
        content: 'You are a water-utility consumption anomaly analyst specializing in fraud prevention, leak detection, and meter diagnostics. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Triage this anomaly event.

Meter: ${meterId || 'Unknown'}
Customer: ${customerName || 'Unknown'}
Reading Date: ${readingDate || 'unspecified'}
Consumption: ${consumptionGallons ?? 'N/A'} gal
Average: ${avgConsumption ?? 'N/A'} gal
Deviation: ${deviationPct ?? 'N/A'}%
Anomaly Type: ${anomalyType || 'unspecified'}
History: ${JSON.stringify(history || [])}
Context: ${JSON.stringify(context || {})}

Respond with JSON: {
  "classification": "customer_leak|meter_malfunction|unauthorized_usage|seasonal_variation|billing_error|unknown",
  "primaryCauseProbability": 0-100,
  "severity": "low|medium|high|critical",
  "fraudIndicator": false,
  "fraudProbability": 0-100,
  "infrastructureConcern": false,
  "estimatedFinancialImpactUsd": 0,
  "investigationSteps": ["..."],
  "resolutionActions": ["..."],
  "estimatedResolutionDays": 0,
  "customerCommunication": "",
  "summary": ""
}`
      }
    ];

    const result = await callOpenRouter(messages);
    const parsed = parseAIJson(result.content) || { raw: result.content };
    await persistAIResult({
      featureType: 'anomaly-analyzer',
      entityType: 'meter',
      entityId: undefined,
      userId: req.user?.id,
      inputData: { meterId, deviationPct, anomalyType },
      result: parsed,
      model: result.model,
      tokensUsed: result.tokensUsed,
      processingTimeMs: result.processingTimeMs,
    });
    res.json({ result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
  } catch (err) {
    console.error('Anomaly analyzer AI error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
