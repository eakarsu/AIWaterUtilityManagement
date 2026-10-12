import React from 'react';

export function fillEveryField(values, variant = 0, choices = {}) {
  const names = ['Pressure anomaly review', 'Water quality follow-up', 'Asset maintenance plan'];
  return Object.fromEntries(Object.entries(values).map(([key, value]) => {
    if (['id', 'created_at', 'updated_at', 'user_id'].includes(key) || /(?:^|_)(?:id|ids)$|[a-z]Ids?$/.test(key) || /file|upload|photo|image|attachment|url/i.test(key)) return [key, value];
    if (key === 'ai_suggestions') return [key, {}];
    if (choices[key]) return [key, choices[key][variant % choices[key].length]];
    if (Array.isArray(value)) return [key, [`${names[variant]} example`, 'Validate telemetry and record references before action']];
    if (value && typeof value === 'object') return [key, { pressure_psi: 42, flow_gpm: 210, measured_at: 'Illustrative reading; verify source' }];
    if (typeof value === 'boolean') return [key, true];
    if (/date|deadline|valid_until/.test(key)) return [key, new Date(Date.now() + (variant + 7) * 86400000).toISOString().slice(0, key === 'scheduled_date' ? 16 : 10)];
    if (/email/.test(key)) return [key, `operator${variant + 1}@example.com`];
    if (/photo_name|filename|file|upload/.test(key)) return [key, value];
    if (/budget|price|cost|amount/.test(key)) return [key, [2400, 650, 4200][variant]];
    if (/duration/.test(key)) return [key, [6, 2, 8][variant]];
    if (/crew|party_size/.test(key)) return [key, [3, 2, 5][variant]];
    if (/travel/.test(key)) return [key, [25, 8, 40][variant]];
    if (/deliverables/.test(key)) return [key, [250, 35, 80][variant]];
    if (/experience/.test(key)) return [key, [6, 4, 8][variant]];
    if (typeof value === 'number') return [key, [3, 2, 5][variant]];
    if (/location|address|market/.test(key)) return [key, ['North pressure zone', 'Reservoir inlet', 'Central service district'][variant]];
    if (/status/.test(key)) return [key, 'Pending'];
    if (/tone/.test(key)) return [key, ['Clear and concise', 'Operational and practical', 'Executive and evidence based'][variant]];
    if (/type/.test(key)) return [key, ['Pressure monitoring', 'Water quality', 'Asset maintenance'][variant]];
    if (/title|name/.test(key)) return [key, names[variant]];
    return [key, `${names[variant]} example: verify source readings, identify service impact, assign review owners, and flag assumptions before operational changes.`];
  }));
}

export default function FullFieldPresets({ value, onChange, choices = {}, presets, disabled = false }) {
  const labels = presets ? presets.map((preset) => preset.label) : ['Pressure example', 'Quality example', 'Maintenance example'];
  return <div className="ai-preset-bar"><div><strong>Fill every field</strong><p>Each example fills required and optional fields. Review and edit before generating.</p></div><div className="ai-actions">{labels.map((label, index) => <button type="button" className="btn btn-secondary" key={label} disabled={disabled} onClick={() => onChange(presets ? { ...value, ...presets[index].values } : fillEveryField(value, index, choices))}>{label}</button>)}</div></div>;
}
