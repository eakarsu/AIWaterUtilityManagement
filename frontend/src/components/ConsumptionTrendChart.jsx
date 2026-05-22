import { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp } from 'lucide-react';

export default function ConsumptionTrendChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/custom-views/consumption-trend?days=${days}`)
      .then((r) => { if (active) setData(r.data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days]);

  if (loading) return <div style={{ padding: 20, color: '#7a8ba8' }}>Loading consumption trend...</div>;
  if (!data?.series?.length) return <div style={{ padding: 20, color: '#7a8ba8' }}>No data</div>;

  const series = data.series;
  const max = Math.max(...series.map(p => p.consumption_gallons));
  const min = Math.min(...series.map(p => p.consumption_gallons));
  const w = 720, h = 220, pad = 36;
  const xStep = (w - pad * 2) / Math.max(series.length - 1, 1);
  const yScale = (v) => h - pad - ((v - min) / Math.max(max - min, 1)) * (h - pad * 2);
  const path = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * xStep} ${yScale(p.consumption_gallons)}`).join(' ');
  const area = `${path} L ${pad + (series.length - 1) * xStep} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <div style={{ background: '#111d35', border: '1px solid #253a5c', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#e0e6ed' }}>
          <TrendingUp size={20} color="#00b4d8" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Consumption Trend</h3>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          style={{ background: '#0a1628', border: '1px solid #253a5c', color: '#e0e6ed', borderRadius: 8, padding: '6px 10px' }}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 220 }}>
        <defs>
          <linearGradient id="ctgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00b4d8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00b4d8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i} x1={pad} x2={w - pad} y1={pad + (h - pad * 2) * f} y2={pad + (h - pad * 2) * f}
            stroke="#1d2f4d" strokeDasharray="3 3" />
        ))}
        <path d={area} fill="url(#ctgrad)" />
        <path d={path} fill="none" stroke="#00b4d8" strokeWidth="2.2" />
        {series.map((p, i) => (
          <circle key={i} cx={pad + i * xStep} cy={yScale(p.consumption_gallons)} r="3" fill="#00b4d8">
            <title>{`${p.date}: ${p.consumption_gallons.toLocaleString()} gal`}</title>
          </circle>
        ))}
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 14 }}>
        <Metric label="Total" value={`${data.summary.total_gallons.toLocaleString()} gal`} />
        <Metric label="Daily Avg" value={`${data.summary.avg_daily_gallons.toLocaleString()} gal`} />
        <Metric label="Peak Day" value={`${data.summary.peak_day.date} (${data.summary.peak_day.consumption_gallons.toLocaleString()})`} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ background: '#0a1628', border: '1px solid #1d2f4d', borderRadius: 8, padding: 10 }}>
      <div style={{ color: '#7a8ba8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color: '#e0e6ed', fontSize: 14, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}
