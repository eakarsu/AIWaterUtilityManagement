const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../domain');

function fixture() {
  return {
  utility:{id:'u1',tenantId:'t1',sitePermissionVersion:'site1',waterSafetyVersion:'safe1',operatingConstraintVersion:'op1',retentionDays:30},
  assets:[{id:'pump1',kind:'pump',version:'v1',status:'active',constraintVersion:'c1',provenanceRef:'scada:1'}],
  telemetry:[{id:'e1',assetId:'pump1',observedAt:'2026-07-18T00:00:00Z',receivedAt:'2026-07-18T00:00:01Z',sourceVersion:'s1',unit:'psi',value:55,duplicate:false,stale:false}],
  workOrder:{id:'w1',ownerId:'owner',priority:'high',status:'approved'},
  decision:{id:'d1',jobId:'w1',modelVersion:'m1',constraintVersion:'op1',eventIds:['e1'],uncertaintyNote:'licensed review',autonomousValveOrChemicalAction:false,operatorApproved:true,approvedBy:'reviewer',waterSafetyPassed:true},
  execution:{status:'receipt_recorded',feedbackAt:'2026-07-18T00:00:02Z',receiptRef:'cmms:1'},
  validation:{datasetVersion:'ds1',forecastError:0.01,latencyMs:10,missedEvents:0,realizedOutcomeRecorded:true,constraintViolations:0}
};
}

test('accepts governed water utility operation', () => {
  const result = evaluate(fixture(), { tenant: 't1', actor: 'owner' });
  assert.deepEqual(result.errors, []);
});

test('blocks unsafe or ungoverned water utility operation', () => {
  const input = fixture();
  input.decision.autonomousValveOrChemicalAction = true;
  assert.ok(evaluate(input, { tenant: 't1', actor: 'owner' }).errors.length > 0);
  assert.ok(evaluate(fixture(), { tenant: 'other', actor: 'owner' }).errors.length > 0);
});
