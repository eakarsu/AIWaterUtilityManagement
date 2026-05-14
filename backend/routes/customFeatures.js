// Custom feature endpoints (batch_09 audit suggestions)
// CommonJS Express router — auth-guarded, uses project's OpenRouter client.
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');

async function safeCall(messages, res, label) {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service unavailable. Set OPENROUTER_API_KEY on the backend and restart.' });
  }
  try {
    const ai = await callOpenRouter(messages);
    const parsed = parseAIJson(ai.content);
    return res.json({ type: label, result: parsed || { raw: ai.content }, model: ai.model });
  } catch (err) {
    console.error(`${label} error:`, err.message);
    return res.status(500).json({ error: err.message || 'AI call failed' });
  }
}

// 1. Real-time multi-sensor fusion (flow/pressure/chlorine/turbidity)
router.post('/sensor-fusion', auth, async (req, res) => {
  const { sensors } = req.body || {};
  if (!sensors || typeof sensors !== 'object') return res.status(400).json({ error: 'sensors object required' });
  const messages = [
    { role: 'system', content: 'You fuse multi-sensor water-utility telemetry into anomaly verdicts. Respond JSON only.' },
    { role: 'user', content: `SENSORS: ${JSON.stringify(sensors)}\nReturn JSON {"fused_score":0,"anomaly_detected":false,"contributing_signals":[""],"likely_cause":"","recommended_action":"","confidence":0}` },
  ];
  return safeCall(messages, res, 'sensor-fusion');
});

// 2. Water demand nowcasting from weather + events + time-of-day
// TODO: configure credentials for WEATHER_API_KEY (live forecast feed).
router.post('/demand-nowcast', auth, async (req, res) => {
  const { zone, hours_ahead = 6, weather, events } = req.body || {};
  const messages = [
    { role: 'system', content: 'You produce short-horizon water demand nowcasts. Respond JSON only.' },
    { role: 'user', content: `ZONE: ${zone || 'whole-network'}\nHOURS: ${hours_ahead}\nWEATHER: ${JSON.stringify(weather || {})}\nEVENTS: ${JSON.stringify(events || [])}\nWeather API configured: ${Boolean(process.env.WEATHER_API_KEY)}\nReturn JSON {"forecast_gpm":[{"hour_offset":0,"demand_gpm":0}],"peak_hour":"","drivers":[""],"alerts":[""]}` },
  ];
  return safeCall(messages, res, 'demand-nowcast');
});

// 3. Meter analytics driving conservation incentive programs
router.post('/conservation-incentives', auth, async (req, res) => {
  const { customer_id, monthly_usage_gallons, baseline_gallons, household_size } = req.body || {};
  if (!customer_id) return res.status(400).json({ error: 'customer_id required' });
  const messages = [
    { role: 'system', content: 'You design conservation incentives based on metered consumption vs baseline. Respond JSON only.' },
    { role: 'user', content: `CUSTOMER: ${customer_id}\nUSAGE: ${monthly_usage_gallons}\nBASELINE: ${baseline_gallons}\nHOUSEHOLD: ${household_size || 'unknown'}\nReturn JSON {"savings_pct":0,"tier":"green|yellow|red","eligible_rewards":[{"name":"","value_usd":0}],"behavioral_tips":[""],"projected_annual_savings_usd":0}` },
  ];
  return safeCall(messages, res, 'conservation-incentives');
});

// 4. Emergency response integration for main breaks
// TODO: configure credentials for EMERGENCY_DISPATCH_API_KEY (CAD/911 bridge).
router.post('/main-break-response', auth, async (req, res) => {
  const { pipe_id, location, severity, affected_customers } = req.body || {};
  if (!pipe_id) return res.status(400).json({ error: 'pipe_id required' });
  const messages = [
    { role: 'system', content: 'You orchestrate water main break emergency response — isolation, dispatch, notifications. Respond JSON only.' },
    { role: 'user', content: `PIPE: ${pipe_id}\nLOC: ${location || 'unknown'}\nSEVERITY: ${severity || 'medium'}\nAFFECTED: ${affected_customers || 0}\nDispatch API: ${Boolean(process.env.EMERGENCY_DISPATCH_API_KEY)}\nReturn JSON {"isolation_valves":[""],"crew_size":0,"eta_minutes":0,"customer_notification":{"channels":[""],"message":""},"escalation_required":false}` },
  ];
  return safeCall(messages, res, 'main-break-response');
});

// 5. Public water quality dashboard payload
router.get('/public-quality-snapshot', async (req, res) => {
  const messages = [
    { role: 'system', content: 'You generate a citizen-facing water quality snapshot from monitored parameters. Respond JSON only.' },
    { role: 'user', content: `Build a sample public quality summary for the current period (no specific tenant). Return JSON {"overall_grade":"A|B|C|D|F","parameters":[{"name":"","value":"","unit":"","compliance":"yes|no"}],"narrative":"","next_test_date":"","trust_score":0}` },
  ];
  return safeCall(messages, res, 'public-quality-snapshot');
});

// 6. Smart meter rollout orchestration with billing handoff
// TODO: configure credentials for BILLING_SYSTEM_API_KEY.
router.post('/smart-meter-rollout', auth, async (req, res) => {
  const { zone, target_meters, current_completed = 0 } = req.body || {};
  if (!zone || !target_meters) return res.status(400).json({ error: 'zone and target_meters required' });
  const messages = [
    { role: 'system', content: 'You plan smart-meter rollout waves and bill-system handoff. Respond JSON only.' },
    { role: 'user', content: `ZONE: ${zone}\nTARGET: ${target_meters}\nDONE: ${current_completed}\nBilling API: ${Boolean(process.env.BILLING_SYSTEM_API_KEY)}\nReturn JSON {"waves":[{"week":0,"meters":0,"crew_size":0}],"billing_handoff":{"format":"","frequency":""},"projected_completion":"","risks":[""]}` },
  ];
  return safeCall(messages, res, 'smart-meter-rollout');
});

module.exports = router;
