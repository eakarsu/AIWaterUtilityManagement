const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// POST /api/ai/infrastructure-aging
router.post('/', auth, aiRateLimiter, async (req, res) => {
  try {
    const { pipes, pumpStations, breakHistory, budget } = req.body || {};
    const messages = [
      { role: 'system', content: 'You are a water-infrastructure asset-management analyst. Always respond with valid JSON.' },
      { role: 'user', content: `Recommend prioritized pipe/pump replacements based on age, material, and break history.\n\nPipes (subset): ${JSON.stringify((pipes || []).slice(0, 100))}\nPump stations: ${JSON.stringify(pumpStations || [])}\nBreak history: ${JSON.stringify(breakHistory || [])}\nBudget: ${budget ?? 'unknown'}\n\nReturn JSON: { "priorities": [{ "assetId": "", "type": "pipe|pump", "score": 0, "rationale": "", "estimatedCost": 0 }], "totalEstimatedCost": 0, "summary": "" }` }
    ];
    const result = await callOpenRouter(messages);
    const parsed = parseAIJson(result.content) || { raw: result.content };
    await persistAIResult({ featureType: 'infrastructure-aging', entityType: 'system', userId: req.user?.id, inputData: { budget }, result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
    res.json({ result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
  } catch (err) {
    console.error('Infrastructure aging error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
