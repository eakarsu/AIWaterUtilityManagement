import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Layers, Plus, Save, Trash2, X } from 'lucide-react';

const empty = { tier: '', min_gallons: 0, max_gallons: '', rate_per_1000: 0, description: '' };

export default function TariffRulesEditor() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ ...empty });
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/custom-views/tariffs')
      .then(r => setRows(r.data.tariffs || []))
      .catch(() => toast.error('Failed to load tariffs'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!newRow.tier || newRow.rate_per_1000 == null) {
      toast.error('Tier name and rate required'); return;
    }
    try {
      await api.post('/custom-views/tariffs', newRow);
      toast.success('Tariff added');
      setAdding(false); setNewRow({ ...empty }); load();
    } catch { toast.error('Create failed'); }
  };

  const startEdit = (r) => { setEditId(r.id); setEditRow({ ...r, max_gallons: r.max_gallons ?? '' }); };

  const saveEdit = async () => {
    try {
      await api.put(`/custom-views/tariffs/${editId}`, editRow);
      toast.success('Tariff updated');
      setEditId(null); setEditRow(null); load();
    } catch { toast.error('Update failed'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this tariff tier?')) return;
    try {
      await api.delete(`/custom-views/tariffs/${id}`);
      toast.success('Deleted'); load();
    } catch { toast.error('Delete failed'); }
  };

  const inputStyle = {
    width: '100%', padding: '6px 8px', background: '#0a1628',
    border: '1px solid #253a5c', borderRadius: 6, color: '#e0e6ed', fontSize: 12, boxSizing: 'border-box',
  };

  return (
    <div style={{ background: '#111d35', border: '1px solid #253a5c', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Layers size={20} color="#ffa726" />
          <h3 style={{ margin: 0, color: '#e0e6ed', fontSize: 16, fontWeight: 600 }}>Rate / Tariff Rules Editor</h3>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            style={{ background: 'linear-gradient(135deg,#00b4d8,#0096c7)', color: 'white', border: 'none',
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12,
              display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Plus size={14} /> Add Tier
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 16, color: '#7a8ba8' }}>Loading tariffs...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#7a8ba8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <Th>Tier</Th><Th>Min Gallons</Th><Th>Max Gallons</Th><Th>Rate $/kgal</Th><Th>Description</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => editId === r.id ? (
                <tr key={r.id} style={{ borderTop: '1px solid #1d2f4d', background: '#0a1628' }}>
                  <Td><input style={inputStyle} value={editRow.tier} onChange={e => setEditRow({ ...editRow, tier: e.target.value })} /></Td>
                  <Td><input type="number" style={inputStyle} value={editRow.min_gallons} onChange={e => setEditRow({ ...editRow, min_gallons: e.target.value })} /></Td>
                  <Td><input type="number" placeholder="(no cap)" style={inputStyle} value={editRow.max_gallons} onChange={e => setEditRow({ ...editRow, max_gallons: e.target.value })} /></Td>
                  <Td><input type="number" step="0.01" style={inputStyle} value={editRow.rate_per_1000} onChange={e => setEditRow({ ...editRow, rate_per_1000: e.target.value })} /></Td>
                  <Td><input style={inputStyle} value={editRow.description} onChange={e => setEditRow({ ...editRow, description: e.target.value })} /></Td>
                  <Td>
                    <button onClick={saveEdit} style={iconBtn('#00c853')}><Save size={14} /></button>
                    <button onClick={() => { setEditId(null); setEditRow(null); }} style={iconBtn('#7a8ba8')}><X size={14} /></button>
                  </Td>
                </tr>
              ) : (
                <tr key={r.id} style={{ borderTop: '1px solid #1d2f4d', color: '#e0e6ed' }}>
                  <Td>{r.tier}</Td>
                  <Td>{r.min_gallons.toLocaleString()}</Td>
                  <Td>{r.max_gallons == null ? <span style={{ color: '#7a8ba8' }}>∞</span> : r.max_gallons.toLocaleString()}</Td>
                  <Td>${Number(r.rate_per_1000).toFixed(2)}</Td>
                  <Td style={{ color: '#7a8ba8' }}>{r.description}</Td>
                  <Td>
                    <button onClick={() => startEdit(r)} style={iconBtn('#00b4d8')}>Edit</button>
                    <button onClick={() => remove(r.id)} style={iconBtn('#ef5350')}><Trash2 size={14} /></button>
                  </Td>
                </tr>
              ))}
              {adding && (
                <tr style={{ borderTop: '1px solid #1d2f4d', background: '#0a1628' }}>
                  <Td><input style={inputStyle} placeholder="Tier name" value={newRow.tier} onChange={e => setNewRow({ ...newRow, tier: e.target.value })} /></Td>
                  <Td><input type="number" style={inputStyle} value={newRow.min_gallons} onChange={e => setNewRow({ ...newRow, min_gallons: e.target.value })} /></Td>
                  <Td><input type="number" placeholder="(no cap)" style={inputStyle} value={newRow.max_gallons} onChange={e => setNewRow({ ...newRow, max_gallons: e.target.value })} /></Td>
                  <Td><input type="number" step="0.01" style={inputStyle} value={newRow.rate_per_1000} onChange={e => setNewRow({ ...newRow, rate_per_1000: e.target.value })} /></Td>
                  <Td><input style={inputStyle} value={newRow.description} onChange={e => setNewRow({ ...newRow, description: e.target.value })} /></Td>
                  <Td>
                    <button onClick={create} style={iconBtn('#00c853')}><Save size={14} /></button>
                    <button onClick={() => { setAdding(false); setNewRow({ ...empty }); }} style={iconBtn('#7a8ba8')}><X size={14} /></button>
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }) { return <th style={{ textAlign: 'left', padding: '8px 10px' }}>{children}</th>; }
function Td({ children, style }) { return <td style={{ padding: '8px 10px', verticalAlign: 'middle', ...style }}>{children}</td>; }
function iconBtn(color) {
  return {
    background: 'transparent', border: `1px solid ${color}`, color,
    padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
    marginRight: 6, display: 'inline-flex', gap: 4, alignItems: 'center',
  };
}
