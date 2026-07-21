'use strict';
function evaluate(input = {}, context = {}) {
  const errors = [];
  const utility = input.utility || {};
  const assets = input.assets || [];
  const telemetry = input.telemetry || [];
  const job = input.workOrder || {};
  const decision = input.decision || {};
  const execution = input.execution || {};
  const validation = input.validation || {};
  if (!utility.id || !utility.tenantId || utility.tenantId !== context.tenant || !utility.sitePermissionVersion || !utility.waterSafetyVersion
      || !utility.operatingConstraintVersion || !utility.retentionDays) errors.push('scoped water utility and safety policy required');
  const assetIds = new Set();
  for (const asset of assets) {
    if (!asset.id || assetIds.has(String(asset.id)) || !['pipe','pump','reservoir','treatment','meter','valve'].includes(asset.kind)
        || !asset.version || !asset.status || !asset.constraintVersion || !asset.provenanceRef) errors.push('versioned water asset invalid');
    assetIds.add(String(asset.id));
  }
  const eventIds = new Set();
  for (const event of telemetry) {
    if (!event.id || eventIds.has(String(event.id)) || !assetIds.has(String(event.assetId)) || !event.observedAt
        || !event.receivedAt || !event.sourceVersion || !event.unit || !Number.isFinite(event.value)
        || event.duplicate || event.stale) errors.push('timestamped utility telemetry invalid');
    eventIds.add(String(event.id));
  }
  if (!job.id || !job.ownerId || job.ownerId !== context.actor || !job.priority || !['planned','submitted','approved','executing','completed','failed','manual_recovery'].includes(job.status)) errors.push('utility work order state invalid');
  if (!decision.id || decision.jobId !== job.id || !decision.modelVersion || !decision.constraintVersion
      || !decision.eventIds?.every((id) => eventIds.has(String(id))) || !decision.uncertaintyNote
      || decision.autonomousValveOrChemicalAction || decision.operatorApproved !== true || !decision.approvedBy
      || decision.approvedBy === job.ownerId || decision.waterSafetyPassed !== true) errors.push('independent water-safe decision required');
  if (!['queued','receipt_recorded','failed','manual_recovery'].includes(execution.status) || !execution.feedbackAt
      || (execution.status === 'receipt_recorded' && !execution.receiptRef)) errors.push('execution feedback or recovery invalid');
  for (const key of ['datasetVersion','forecastError','latencyMs','missedEvents','realizedOutcomeRecorded']) {
    if (validation[key] === undefined) errors.push(`validation ${key} required`);
  }
  if (validation.constraintViolations !== 0) errors.push('historical water safety constraint failed');
  return { errors, result: { utilityId: utility.id, workOrderId: job.id, disposition: errors.length ? 'revise' : 'operator-reviewed' },
    assumptions: ['No valve, pump, treatment, or public notification action is automatic'],
    uncertainty: { scadaConnected: false, licensedOperatorRequired: true } };
}
module.exports = { evaluate };
