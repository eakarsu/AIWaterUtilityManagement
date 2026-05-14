const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter, parseAIJson, persistAIResult } = require('../services/openrouter');

// POST /api/ai/treatment-optimization
// Text-only AI add-on: takes process snapshot, returns optimization plan in JSON
router.post('/', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable. Set OPENROUTER_API_KEY on the backend and restart.' });
    }

    const {
      plantName,
      processStage,
      chemicalType,
      currentDosage,
      recommendedDosage,
      influentTurbidity,
      effluentTurbidity,
      flowRateMgd,
      energyKwh,
      costPerDay,
      goals,
    } = req.body || {};

    const messages = [
      {
        role: 'system',
        content: 'You are a senior water-treatment process engineer. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Optimize this water-treatment process snapshot.

Plant: ${plantName || 'Unknown'}
Process Stage: ${processStage || 'unspecified'}
Chemical: ${chemicalType || 'N/A'}
Current Dosage: ${currentDosage ?? 'N/A'} mg/L
Suggested Dosage: ${recommendedDosage ?? 'N/A'} mg/L
Influent Turbidity: ${influentTurbidity ?? 'N/A'} NTU
Effluent Turbidity: ${effluentTurbidity ?? 'N/A'} NTU
Flow Rate: ${flowRateMgd ?? 'N/A'} MGD
Energy: ${energyKwh ?? 'N/A'} kWh/day
Daily Cost: $${costPerDay ?? 'N/A'}
Goals: ${JSON.stringify(goals || ['cost', 'compliance', 'energy'])}

Respond with JSON: {
  "efficiencyScore": 0-100,
  "recommendedDosageMgL": 0,
  "expectedDailySavingsUsd": 0,
  "expectedAnnualSavingsUsd": 0,
  "energyReductionPct": 0,
  "qualityImpact": "improved|neutral|degraded",
  "complianceRisk": "low|medium|high",
  "scadaSetpoints": [{"parameter": "", "value": "", "unit": ""}],
  "recommendations": ["..."],
  "tradeOffs": ["..."],
  "summary": ""
}`
      }
    ];

    const result = await callOpenRouter(messages);
    const parsed = parseAIJson(result.content) || { raw: result.content };
    await persistAIResult({
      featureType: 'treatment-optimization-ai',
      entityType: 'plant',
      userId: req.user?.id,
      inputData: { plantName, processStage, chemicalType },
      result: parsed,
      model: result.model,
      tokensUsed: result.tokensUsed,
      processingTimeMs: result.processingTimeMs,
    });
    res.json({ result: parsed, model: result.model, tokensUsed: result.tokensUsed, processingTimeMs: result.processingTimeMs });
  } catch (err) {
    console.error('Treatment optimization AI error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
