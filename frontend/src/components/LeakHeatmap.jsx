import { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function severityColor(s) {
  // 0..100 -> from cool teal to red
  const clamped = Math.max(0, Math.min(100, s));
  if (clamped < 25) return '#0f3a4a';
  if (clamped < 50) return '#0e6f8a';
  if (clamped < 70) return '#d4a017';
  if (clamped < 85) return '#e07a3c';
  return '#ef5350';
}

export default function LeakHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/custom-views/leak-heatmap')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <div style={{ padding: 20, color: '#7a8ba8' }}>Loading heatmap...</div>;
  if (!data) return <div style={{ padding: 20, color: '#7a8ba8' }}>No data</div>;

  return (
    <div style={{ background: '#111d35', border: '1px solid #253a5c', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#e0e6ed' }}>
          <AlertTriangle size={20} color="#ef5350" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Leak Detection Heatmap</h3>
        </div>
        <button onClick={load} style={{ background: '#0a1628', border: '1px solid #253a5c',
          color: '#00b4d8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <RefreshCw size={14} /> Re-scan
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', color: '#7a8ba8', fontSize: 12, padding: 6 }}>Region \\ Sensor</th>
              {data.sensors.map(s => (
                <th key={s} style={{ color: '#7a8ba8', fontSize: 12, padding: 6 }}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.regions.map(region => (
              <tr key={region}>
                <td style={{ color: '#e0e6ed', fontWeight: 500, padding: 6, fontSize: 13 }}>{region}</td>
                {data.sensors.map(sensor => {
                  const cell = data.cells.find(c => c.region === region && c.sensor === sensor) || {};
                  const sev = cell.severity ?? 0;
                  return (
                    <td key={sensor} style={{ padding: 0 }}>
                      <div title={`${region} / ${sensor} — severity ${sev}, anomalies ${cell.anomaly_count}`}
                        style={{
                          background: severityColor(sev),
                          color: sev > 50 ? '#0a1628' : '#e0e6ed',
                          fontSize: 12, fontWeight: 600,
                          padding: '14px 10px', textAlign: 'center',
                          borderRadius: 6, minWidth: 64,
                        }}>
                        {sev}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, padding: 12, background: '#0a1628', border: '1px solid #1d2f4d', borderRadius: 8 }}>
        <div style={{ color: '#7a8ba8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Top Hotspots</div>
        {data.hotspots.map((h, i) => (
          <div key={i} style={{ color: '#e0e6ed', fontSize: 13, padding: '4px 0' }}>
            <span style={{ color: severityColor(h.severity), fontWeight: 600 }}>{h.severity}</span>
            {' — '}{h.region} · {h.sensor} <span style={{ color: '#7a8ba8' }}>({h.anomaly_count} anomalies)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
