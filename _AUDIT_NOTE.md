# Audit Recommendations & Status — AIWaterUtilityManagement

Source: /Users/erolakarsu/projects/_AUDIT/reports/batch_09.md

Verdict per audit: skeleton — domain routes existed but TSV reported 0 AI endpoints. Inspection found that `server.js` already references **five AI route files that did not exist** (`aiLeakAnalyzer`, `aiDemandForecasting`, `aiWaterQualityRisk`, `aiInfrastructureAging`, `aiEmergencyResponse`), so startup was broken.

## Original audit recommendations

Missing AI features (critical):
- AI demand forecasting
- Leak prediction and severity scoring
- Treatment optimization via ML
- Anomaly detection on sensor data
- Preventive maintenance scheduling
- Water quality prediction

Missing non-AI:
- Customer billing
- Service disruption notifications
- GIS integration for pipe mapping
- Permit tracking

## Implemented in this pass (MECHANICAL)

Created the five missing route files referenced by `server.js`. All reuse the existing `services/openrouter.js` (`callOpenRouter`, `parseAIJson`, `persistAIResult` matching the documented `ai_results` schema), `auth`, and `aiRateLimiter`.

- `POST /api/ai/leak-analyzer` (`routes/aiLeakAnalyzer.js`) — leak probability, severity, recommended actions.
- `POST /api/ai/demand-forecasting` (`routes/aiDemandForecasting.js`) — hourly demand forecast with CIs.
- `POST /api/ai/water-quality-risk` (`routes/aiWaterQualityRisk.js`) — quality risk score, exceedances, public-notification flag.
- `POST /api/ai/infrastructure-aging` (`routes/aiInfrastructureAging.js`) — prioritized replacement plan against budget.
- `POST /api/ai/emergency-response` (`routes/aiEmergencyResponse.js`) — incident response plan.

This unblocks server boot and provides the missing AI surface called out in the audit.

## Backlog

1. Treatment optimization endpoint (`/api/ai/treatment-optimization`) — text-only AI add-on; not done in this pass to keep scope to fixing the missing-module crash + audit gaps.
2. Anomaly-detection AI counterpart to existing `/api/anomaly-detection` (currently a non-AI route).
3. Customer billing integration — credentials decision.
4. Service disruption notifications — needs SMS/email provider decision.
5. GIS integration — credentials decision (Esri/Mapbox).

## Apply pass 4 (mechanical backlog)

- **Action:** UPDATED-BE+FE — implemented two MECHANICAL backlog items.
- **Backend (new files):**
  - `backend/routes/aiTreatmentOptimization.js` —
    `POST /api/ai/treatment-optimization`. Text-only AI add-on that
    takes a process snapshot (plant, dosages, turbidity, flow, energy,
    cost, goals) and returns a JSON optimization plan
    (efficiency score, recommended dosage, savings, SCADA setpoints,
    trade-offs). Reuses existing
    `services/openrouter.js` (`callOpenRouter`/`parseAIJson`/
    `persistAIResult`) + `auth` + `aiRateLimiter`. Explicit 503 on
    missing `OPENROUTER_API_KEY`.
  - `backend/routes/aiAnomalyAnalyzer.js` —
    `POST /api/ai/anomaly-analyzer`. AI counterpart to existing
    non-AI `/api/anomaly-detection`. Accepts an arbitrary anomaly
    event (no DB binding required) and returns triage classification,
    fraud probability, severity, investigation/resolution steps.
    Explicit 503 on missing key.
- **Backend (modified):**
  - `backend/server.js` — registered both new route mounts after
    `aiEmergencyResponse`, before `aiResults`.
- **Frontend (modified):**
  - `frontend/src/pages/AIInsightsPage.jsx` — added two tabs
    (`Treatment Optimization`, `Anomaly Analyzer`) with default
    payloads, payload builders, and field grids matching the existing
    pattern. 503 handling already present.
- **Syntax check:** PASS (`node --check` on both routes + server,
  `esbuild --loader:.jsx=jsx` on the page).
- **Smoke test:** Backend booted on alt port 3501 (port 3001 held by
  another agent's process). Login as `admin@waterutility.com` → token.
  With `OPENROUTER_API_KEY` cleared, both new endpoints returned HTTP
  503 with the documented body. With placeholder key, both reached
  OpenRouter and got upstream 401 (expected).

## Apply pass 3 (frontend)

- **Stack:** Express + Vite-React (`frontend/`, axios + lucide-react +
  react-hot-toast).
- **Backend AI endpoints:** `POST /api/ai/leak-analyzer`,
  `/api/ai/demand-forecasting`, `/api/ai/water-quality-risk`,
  `/api/ai/infrastructure-aging`, `/api/ai/emergency-response`.
- **Action:** UPDATED-FE — only `EmergencyResponsePage` was wired to
  `/api/ai/emergency-response`. The other four `/api/ai/*` endpoints had no
  FE entrypoint (existing pages call legacy non-AI routes like
  `/leak-detection/:id/analyze`). Added `pages/AIInsightsPage.jsx`, a
  tabbed page that posts to all four endpoints with editable JSON fields
  and 503 handling. Registered `/ai-insights` in `App.jsx` and added the
  link to the AI section of `components/Layout.jsx`.
- **Files written/modified:**
  - `frontend/src/pages/AIInsightsPage.jsx` (new)
  - `frontend/src/App.jsx` (import + route)
  - `frontend/src/components/Layout.jsx` (sidebar link, Sparkles icon)
- **Syntax check:** PASS (esbuild loader=jsx).
- **Notes:** Auth handled by existing `services/api.js` axios interceptor
  (Bearer from `localStorage`). 503 surfaces an `OPENROUTER_API_KEY` hint.

