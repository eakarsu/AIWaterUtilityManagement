const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// POST /api/ai/emergency-response
router.post('/', auth, aiRateLimiter, async (req, res) => {
  try {
    const { incidentType, location, severity, affectedCustomers, availableCrews } = req.body || {};
    const messages = [
      { role: 'system', content: 'You are a water-utility emergency response coordinator. Always respond with valid JSON.' },
      { role: 'user', content: `Plan an emergency response.\n\nIncident type: ${incidentType || 'unknown'}\nLocation: ${JSON.stringify(location || {})}\nSeverity: ${severity || 'unknown'}\nAffected customers: ${affectedCustomers ?? 0}\nAvailable crews: ${JSON.stringify(availableCrews || [])}\n\nReturn JSON: { "actions": [{ "step": "", "ownerRole": "", "etaMinutes": 0, "priority": "low|medium|high|critical" }], "publicNotification": "", "estimatedRestoreMinutes": 0, "escalation": ["..."], "summary": "" }` }
    ];
    const result = await callOpenRouter(messages);
    const parsed = parseAIJson(result.content) || { raw: result.content };
    await persistAIResult({ featureType: 'emergency-response', entityType: 'incident', userId: req.user?.id, inputData: { incidentType, severity }, result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
    res.json({ result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
  } catch (err) {
    console.error('Emergency response error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
