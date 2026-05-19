import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Wires the four AI endpoints surfaced by backend/server.js that previously
// had no FE entrypoint:
//   POST /api/ai/leak-analyzer
//   POST /api/ai/demand-forecasting
//   POST /api/ai/water-quality-risk
//   POST /api/ai/infrastructure-aging
// Auth is handled by services/api.js (Bearer token from localStorage).

const TABS = [
  { key: 'leak', label: 'Leak Analyzer', endpoint: '/ai/leak-analyzer' },
  { key: 'demand', label: 'Demand Forecasting', endpoint: '/ai/demand-forecasting' },
  { key: 'quality', label: 'Water-Quality Risk', endpoint: '/ai/water-quality-risk' },
  { key: 'aging', label: 'Infrastructure Aging', endpoint: '/ai/infrastructure-aging' },
  { key: 'treatment', label: 'Treatment Optimization', endpoint: '/ai/treatment-optimization' },
  { key: 'anomaly', label: 'Anomaly Analyzer', endpoint: '/ai/anomaly-analyzer' },
];

const DEFAULTS = {
  leak: {
    sensorReadings: '{"pressure_psi":42,"flow_gpm":210,"normal_pressure":58,"normal_flow":190}',
    pipeSegment: '{"id":"P-104","material":"cast-iron","installed":1972,"length_ft":840}',
    recentEvents: '[{"date":"2024-08-12","type":"pressure_drop"}]',
  },
  demand: {
    region: 'Zone 4 / Riverside',
    historicalDemand: '[{"hour":0,"mgd":3.4},{"hour":1,"mgd":3.2}]',
    weatherForecast: '{"temp_f":92,"rain_pct":0.05}',
    populationTrend: '{"yoy_pct":1.6,"new_meters":420}',
    horizonHours: '168',
  },
  quality: {
    sampleResults: '{"chlorine_ppm":0.4,"turbidity_ntu":0.6,"ph":7.4,"e_coli":0}',
    location: 'Reservoir 2 inlet',
    recentTreatment: '{"chlorine_dose_mgL":1.2,"date":"2024-09-21"}',
    complianceLimits: '{"chlorine_ppm":[0.2,4.0],"turbidity_ntu":1.0}',
  },
  aging: {
    pipes: '[{"id":"P-104","material":"cast-iron","age":53,"breaks_per_mile":0.4}]',
    pumpStations: '[{"id":"PS-3","installed":1985,"failures_24m":2}]',
    breakHistory: '[{"year":2023,"count":18},{"year":2024,"count":21}]',
    budget: '2500000',
  },
  treatment: {
    plantName: 'North Plant',
    processStage: 'coagulation',
    chemicalType: 'alum',
    currentDosage: '32',
    recommendedDosage: '28',
    influentTurbidity: '6.4',
    effluentTurbidity: '0.5',
    flowRateMgd: '12',
    energyKwh: '4200',
    costPerDay: '1850',
    goals: '["cost","compliance","energy"]',
  },
  anomaly: {
    meterId: 'M-2207',
    customerName: 'Acme Tenants LLC',
    readingDate: '2024-09-30',
    consumptionGallons: '48000',
    avgConsumption: '12000',
    deviationPct: '300',
    anomalyType: 'spike',
    history: '[{"date":"2024-08-30","consumption":11800,"deviation":-2}]',
    context: '{"property_type":"multi_family","occupancy":"stable"}',
  },
};

function tryParse(v) {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (!t) return undefined;
  if (t.startsWith('{') || t.startsWith('[')) {
    try { return JSON.parse(t); } catch { return v; }
  }
  return v;
}

function buildPayload(tab, form) {
  if (tab === 'leak') {
    return {
      sensorReadings: tryParse(form.sensorReadings),
      pipeSegment: tryParse(form.pipeSegment),
      recentEvents: tryParse(form.recentEvents),
    };
  }
  if (tab === 'demand') {
    return {
      region: form.region,
      historicalDemand: tryParse(form.historicalDemand),
      weatherForecast: tryParse(form.weatherForecast),
      populationTrend: tryParse(form.populationTrend),
      horizonHours: Number(form.horizonHours) || 168,
    };
  }
  if (tab === 'quality') {
    return {
      sampleResults: tryParse(form.sampleResults),
      location: form.location,
      recentTreatment: tryParse(form.recentTreatment),
      complianceLimits: tryParse(form.complianceLimits),
    };
  }
  if (tab === 'aging') {
    return {
      pipes: tryParse(form.pipes),
      pumpStations: tryParse(form.pumpStations),
      breakHistory: tryParse(form.breakHistory),
      budget: Number(form.budget) || undefined,
    };
  }
  if (tab === 'treatment') {
    return {
      plantName: form.plantName,
      processStage: form.processStage,
      chemicalType: form.chemicalType,
      currentDosage: Number(form.currentDosage) || undefined,
      recommendedDosage: Number(form.recommendedDosage) || undefined,
      influentTurbidity: Number(form.influentTurbidity) || undefined,
      effluentTurbidity: Number(form.effluentTurbidity) || undefined,
      flowRateMgd: Number(form.flowRateMgd) || undefined,
      energyKwh: Number(form.energyKwh) || undefined,
      costPerDay: Number(form.costPerDay) || undefined,
      goals: tryParse(form.goals),
    };
  }
  if (tab === 'anomaly') {
    return {
      meterId: form.meterId,
      customerName: form.customerName,
      readingDate: form.readingDate,
      consumptionGallons: Number(form.consumptionGallons) || undefined,
      avgConsumption: Number(form.avgConsumption) || undefined,
      deviationPct: Number(form.deviationPct) || undefined,
      anomalyType: form.anomalyType,
      history: tryParse(form.history),
      context: tryParse(form.context),
    };
  }
  return form;
}

export default function AIInsightsPage() {
  const [tab, setTab] = useState('leak');
  const [forms, setForms] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const current = TABS.find(t => t.key === tab);
  const form = forms[tab];

  const setField = (k) => (e) => {
    setForms({ ...forms, [tab]: { ...form, [k]: e.target.value } });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError(null);
    try {
      const payload = buildPayload(tab, form);
      const { data } = await api.post(current.endpoint, payload);
      setResult(data);
      toast.success('AI analysis complete');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || 'Request failed';
      if (status === 503) {
        const friendly = `${msg} (set OPENROUTER_API_KEY on the backend and restart)`;
        setError(friendly);
        toast.error(friendly);
      } else {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = {
    leak: [
      ['sensorReadings', 'Sensor Readings (JSON)', 3],
      ['pipeSegment', 'Pipe Segment (JSON)', 3],
      ['recentEvents', 'Recent Events (JSON array)', 2],
    ],
    demand: [
      ['region', 'Region', 1],
      ['historicalDemand', 'Historical Demand (JSON array)', 3],
      ['weatherForecast', 'Weather Forecast (JSON)', 2],
      ['populationTrend', 'Population Trend (JSON)', 2],
      ['horizonHours', 'Horizon (hours)', 1],
    ],
    quality: [
      ['sampleResults', 'Sample Results (JSON)', 3],
      ['location', 'Location', 1],
      ['recentTreatment', 'Recent Treatment (JSON)', 2],
      ['complianceLimits', 'Compliance Limits (JSON)', 2],
    ],
    aging: [
      ['pipes', 'Pipes (JSON array)', 3],
      ['pumpStations', 'Pump Stations (JSON array)', 3],
      ['breakHistory', 'Break History (JSON array)', 2],
      ['budget', 'Annual Budget ($)', 1],
    ],
    treatment: [
      ['plantName', 'Plant Name', 1],
      ['processStage', 'Process Stage', 1],
      ['chemicalType', 'Chemical Type', 1],
      ['currentDosage', 'Current Dosage (mg/L)', 1],
      ['recommendedDosage', 'Recommended Dosage (mg/L)', 1],
      ['influentTurbidity', 'Influent Turbidity (NTU)', 1],
      ['effluentTurbidity', 'Effluent Turbidity (NTU)', 1],
      ['flowRateMgd', 'Flow Rate (MGD)', 1],
      ['energyKwh', 'Energy (kWh/day)', 1],
      ['costPerDay', 'Cost ($/day)', 1],
      ['goals', 'Goals (JSON array)', 2],
    ],
    anomaly: [
      ['meterId', 'Meter ID', 1],
      ['customerName', 'Customer Name', 1],
      ['readingDate', 'Reading Date', 1],
      ['consumptionGallons', 'Consumption (gal)', 1],
      ['avgConsumption', 'Average Consumption (gal)', 1],
      ['deviationPct', 'Deviation (%)', 1],
      ['anomalyType', 'Anomaly Type', 1],
      ['history', 'History (JSON array)', 3],
      ['context', 'Context (JSON)', 2],
    ],
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><Sparkles size={24} /> AI Insights</h1>
          <p>Direct entrypoints for the four AI analytics endpoints exposed by the backend.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 6, marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setTab(t.key); setResult(null); setError(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {fields[tab].map(([k, label, rows]) => (
              <div className="form-group" key={k}>
                <label>{label}</label>
                {rows > 1 ? (
                  <textarea rows={rows} value={form[k] || ''} onChange={setField(k)} />
                ) : (
                  <input value={form[k] || ''} onChange={setField(k)} />
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (<><Loader2 size={14} className="spin" /> Running…</>) : `Run ${current.label}`}
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: '#7a8ba8' }}>
            Endpoint: <code>POST {current.endpoint}</code> · JSON fields support raw arrays / objects.
          </p>
        </form>
      </div>

      {error && (
        <div className="alert alert-error" style={{ padding: 12, background: '#7a1d1d22', border: '1px solid #ef444466', borderRadius: 8, color: '#fecaca', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ padding: 20 }}>
          <h3>Result</h3>
          {result.model && <p style={{ fontSize: 12, color: '#7a8ba8' }}>Model: {result.model}</p>}
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#0f172a08', padding: 12, borderRadius: 8 }}>
            {JSON.stringify(result.result || result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
