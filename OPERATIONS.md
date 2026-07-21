# Water Utility Management operations

## Supported boundary

The governed path covers utility/site permissions, water-safety constraints, assets, timestamped telemetry and laboratory evidence, work orders, licensed independent review, execution receipts, outcomes, and manual recovery. SCADA, GIS, AMI meter, laboratory, CMMS, ERP, weather, maintenance, notification, and regulatory-reporting names are typed adapter contracts—not claims that live utility systems are connected.

The application never autonomously operates valves, changes chemical dosing, or bypasses licensed review. Generated routes are disabled by default and cannot be enabled in production.

## Deploy and run

Install dependencies explicitly in `backend/` and `frontend/`. Configure `.env` from `.env.example` with `DATABASE_URL`, unique `GOVERNANCE_TENANT_ID`, and a random `JWT_SECRET` of at least 32 characters. Store SCADA and provider credentials in a secret manager.

Use `./start.sh check`; after migration review and backup run `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`; then use `./start.sh start`. Baseline utility schema provisioning is a separate reviewed deployment step; application startup never mutates or seeds it.

## Workflow and recovery

Create a subject-scoped operation at `/api/governance` with authoritative provenance and `Idempotency-Key`, submit the version, and obtain a different licensed/safety reviewer’s decision. Workers checkpoint inbound telemetry and use leased outbox claims with typed receipts. On stale or duplicated readings, water-quality violation, sensor outage, SCADA mismatch, delayed laboratory result, or ambiguous receipt, stop consequential action, reconcile the authoritative source, and resume the same durable item or use manual licensed procedures.

Historical fixtures measure forecast error, violations, latency, missed events, and outcomes. Run `node --test backend/governance/tests/*.test.js` and `bash -n start.sh`. Static seed SQL contains no credentials and never runs during startup.
