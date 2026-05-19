const axios = require('axios');
const db = require('../db');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

function parseAIJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch(e) {}
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(stripped); } catch(e) {}
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) { try { return JSON.parse(text.slice(start, end + 1)); } catch(e) {} }
  return null;
}

async function callOpenRouter(messages) {
  const startTime = Date.now();
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: OPENROUTER_MODEL,
    messages,
    response_format: { type: 'json_object' }
  }, {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'AI Water Utility Management'
    }
  });

  const content = response.data.choices[0].message.content;
  const processingTimeMs = Date.now() - startTime;

  return {
    content,
    model: response.data.model,
    tokensUsed: response.data.usage?.total_tokens,
    processingTimeMs
  };
}

async function persistAIResult({ featureType, entityId, entityType, userId, inputData, result, model, tokensUsed, processingTimeMs }) {
  try {
    await db.query(
      `INSERT INTO ai_results (feature_type, entity_id, entity_type, user_id, input_data, result, model_used, tokens_used, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [featureType, entityId || null, entityType || null, userId || null,
       JSON.stringify(inputData), JSON.stringify(result), model, tokensUsed, processingTimeMs]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err.message);
  }
}

module.exports = { callOpenRouter, parseAIJson, persistAIResult, OPENROUTER_MODEL };
