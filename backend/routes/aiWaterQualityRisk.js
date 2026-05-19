const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// POST /api/ai/water-quality-risk
router.post('/', auth, aiRateLimiter, async (req, res) => {
  try {
    const { sampleResults, location, recentTreatment, complianceLimits } = req.body || {};
    const messages = [
      { role: 'system', content: 'You are a water-quality risk analyst. Always respond with valid JSON.' },
      { role: 'user', content: `Assess water-quality risk and recommend actions.\n\nSample results: ${JSON.stringify(sampleResults || {})}\nLocation: ${JSON.stringify(location || {})}\nRecent treatment: ${JSON.stringify(recentTreatment || {})}\nCompliance limits: ${JSON.stringify(complianceLimits || {})}\n\nReturn JSON: { "riskScore": 0, "riskLevel": "low|medium|high|critical", "exceedances": [{ "param": "", "value": 0, "limit": 0 }], "publicNotificationRequired": false, "recommendedActions": ["..."], "summary": "" }` }
    ];
    const result = await callOpenRouter(messages);
    const parsed = parseAIJson(result.content) || { raw: result.content };
    await persistAIResult({ featureType: 'water-quality-risk', entityType: 'location', entityId: location?.id, userId: req.user?.id, inputData: { location }, result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
    res.json({ result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
  } catch (err) {
    console.error('Water quality risk error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
