import React, { useState } from 'react';
import { Siren, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function EmergencyResponsePage() {
  const [form, setForm] = useState({
    incident_type: 'main_break',
    location: '',
    severity: 'moderate',
    affected_population: '',
    description: '',
    constraints: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.post('/ai/emergency-response', {
        ...form,
        affected_population: Number(form.affected_population) || undefined,
      });
      setResult(data);
      toast.success('Response plan generated');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Request failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><Siren size={24} /> AI Emergency Response</h1>
          <p>Generate an incident-response plan for a water utility emergency.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div className="form-group">
              <label>Incident Type</label>
              <select value={form.incident_type} onChange={set('incident_type')}>
                <option value="main_break">Main Break</option>
                <option value="contamination">Contamination Event</option>
                <option value="pump_failure">Pump Station Failure</option>
                <option value="boil_water">Boil-Water Advisory</option>
                <option value="power_loss">Power Loss</option>
                <option value="cyberattack">Cyber / SCADA Incident</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Severity</label>
              <select value={form.severity} onChange={set('severity')}>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input value={form.location} onChange={set('location')} placeholder="e.g. Zone 4, Riverside Pump Station" />
            </div>
            <div className="form-group">
              <label>Affected Population</label>
              <input type="number" value={form.affected_population} onChange={set('affected_population')} placeholder="e.g. 12000" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description *</label>
              <textarea rows={3} value={form.description} onChange={set('description')} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Resource / Time Constraints</label>
              <textarea rows={2} value={form.constraints} onChange={set('constraints')} placeholder="Crew availability, backup capacity, regulatory deadlines..." />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (<><Loader2 size={14} className="spin" /> Planning…</>) : 'Generate Response Plan'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className="card" style={{ padding: 20 }}>
          <h3>Response Plan</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#0f172a08', padding: 12, borderRadius: 8 }}>
            {typeof (result.plan || result.result) === 'string'
              ? (result.plan || result.result)
              : JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
