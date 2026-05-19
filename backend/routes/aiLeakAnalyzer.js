const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// POST /api/ai/leak-analyzer
router.post('/', auth, aiRateLimiter, async (req, res) => {
  try {
    const { sensorReadings, pipeSegment, recentEvents } = req.body || {};
    const messages = [
      { role: 'system', content: 'You are a water-utility leak detection analyst. Always respond with valid JSON.' },
      { role: 'user', content: `Assess leak likelihood and severity for this pipe segment.\n\nSensor readings: ${JSON.stringify(sensorReadings || {})}\nPipe segment: ${JSON.stringify(pipeSegment || {})}\nRecent events: ${JSON.stringify(recentEvents || [])}\n\nReturn JSON: { "leakProbability": 0, "severity": "low|medium|high|critical", "estimatedLossRateLpm": 0, "suspectedLocation": "", "recommendedActions": ["..."], "confidence": "low|medium|high" }` }
    ];
    const result = await callOpenRouter(messages);
    const parsed = parseAIJson(result.content) || { raw: result.content };
    await persistAIResult({ featureType: 'leak-analyzer', entityType: 'pipe', entityId: pipeSegment?.id, userId: req.user?.id, inputData: { pipeSegment }, result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
    res.json({ result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
  } catch (err) {
    console.error('Leak analyzer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
