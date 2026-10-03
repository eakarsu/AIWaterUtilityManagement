import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, Sparkles, X } from 'lucide-react';

const EMPTY_FORM = {
  asset_id: '', asset_type: 'water_main', material: 'cast_iron', install_date: '',
  age_years: '', condition_score: '', failure_probability: '', replacement_cost: '',
  last_inspection: '', location: '', diameter_inches: '', length_feet: '',
  break_history: '', priority: 'medium',
};

const PRIORITY_MAP = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' };

export default function InfrastructureAgingPage() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/infrastructure-aging');
      const infrastructure = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(infrastructure)) throw new Error('Invalid infrastructure response');
      setItems(infrastructure);
    } catch {
      toast.error('Failed to load infrastructure data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleCreate = () => {
    setFormData(EMPTY_FORM);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = () => {
    setFormData({ ...EMPTY_FORM, ...selectedItem });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete asset ${selectedItem.asset_id}?`)) return;
    try {
      await api.delete(`/infrastructure-aging/${selectedItem._id}`);
      toast.success('Asset deleted');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        const { data } = await api.put(`/infrastructure-aging/${selectedItem._id}`, formData);
        toast.success('Asset updated');
        setSelectedItem(data);
      } else {
        await api.post('/infrastructure-aging', formData);
        toast.success('Asset created');
      }
      setShowForm(false);
      fetchItems();
    } catch {
      toast.error(editMode ? 'Failed to update asset' : 'Failed to create asset');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await api.post(`/infrastructure-aging/${selectedItem._id}/analyze`);
      setSelectedItem(data);
      toast.success('AI analysis complete');
      fetchItems();
    } catch {
      toast.error('AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const onChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <LoadingSpinner text="Loading infrastructure data..." />;

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e0e6ed', margin: 0 }}>Infrastructure Aging</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          <Plus size={16} /> New Asset
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset ID</th><th>Asset Type</th><th>Material</th><th>Age (yrs)</th>
                <th>Condition Score</th><th>Failure Prob</th><th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} onClick={() => handleRowClick(item)}
                  className={selectedItem?._id === item._id ? 'row-selected' : ''}
                  style={{ cursor: 'pointer' }}>
                  <td>{item.asset_id}</td>
                  <td>{item.asset_type}</td>
                  <td>{item.material}</td>
                  <td>{item.age_years}</td>
                  <td>{item.condition_score}</td>
                  <td>{item.failure_probability}</td>
                  <td><span className={`badge badge-${PRIORITY_MAP[item.priority] || 'info'}`}>
                    <span className="badge-dot"></span>{item.priority}
                  </span></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#7a8ba8' }}>No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {showDetail && selectedItem && (
          <div className="detail-panel" style={{ width: 420, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e0e6ed', margin: 0 }}>Asset Details</h2>
              <button onClick={() => { setShowDetail(false); setSelectedItem(null); }}
                style={{ background: 'none', border: 'none', color: '#7a8ba8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-fields" style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              {[
                ['Asset ID', selectedItem.asset_id], ['Asset Type', selectedItem.asset_type],
                ['Material', selectedItem.material], ['Install Date', selectedItem.install_date],
                ['Age (years)', selectedItem.age_years], ['Condition Score', selectedItem.condition_score],
                ['Failure Probability', selectedItem.failure_probability],
                ['Replacement Cost', selectedItem.replacement_cost ? `$${Number(selectedItem.replacement_cost).toLocaleString()}` : ''],
                ['Last Inspection', selectedItem.last_inspection], ['Location', selectedItem.location],
                ['Diameter (in)', selectedItem.diameter_inches], ['Length (ft)', selectedItem.length_feet],
                ['Break History', selectedItem.break_history],
                ['Priority', selectedItem.priority],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#7a8ba8', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#e0e6ed' }}>{val ?? '-'}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-secondary" onClick={handleEdit}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14} /> Delete</button>
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
                <Sparkles size={14} /> {analyzing ? 'Analyzing...' : 'AI Analyze'}
              </button>
            </div>

            <AIAnalysisDisplay analysis={selectedItem.ai_analysis} timestamp={selectedItem.analyzed_at} />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editMode ? 'Edit Asset' : 'New Asset'}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="form-group">
            <label>Asset ID</label>
            <input className="form-input" value={formData.asset_id} onChange={e => onChange('asset_id', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Asset Type</label>
            <select className="form-input" value={formData.asset_type} onChange={e => onChange('asset_type', e.target.value)}>
              {['water_main','valve','hydrant','pump','tank','meter'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Material</label>
            <select className="form-input" value={formData.material} onChange={e => onChange('material', e.target.value)}>
              {['cast_iron','ductile_iron','pvc','concrete','steel','copper'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label>Install Date</label>
              <input type="date" className="form-input" value={formData.install_date} onChange={e => onChange('install_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Age (years)</label>
              <input type="number" className="form-input" value={formData.age_years} onChange={e => onChange('age_years', e.target.value)} />
            </div>
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label>Condition Score (1-10)</label>
              <input type="number" min="1" max="10" className="form-input" value={formData.condition_score} onChange={e => onChange('condition_score', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Failure Probability (0-1)</label>
              <input type="number" min="0" max="1" step="0.01" className="form-input" value={formData.failure_probability} onChange={e => onChange('failure_probability', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Replacement Cost ($)</label>
            <input type="number" className="form-input" value={formData.replacement_cost} onChange={e => onChange('replacement_cost', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Last Inspection</label>
            <input type="date" className="form-input" value={formData.last_inspection} onChange={e => onChange('last_inspection', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input className="form-input" value={formData.location} onChange={e => onChange('location', e.target.value)} />
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label>Diameter (in)</label>
              <input type="number" className="form-input" value={formData.diameter_inches} onChange={e => onChange('diameter_inches', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Length (ft)</label>
              <input type="number" className="form-input" value={formData.length_feet} onChange={e => onChange('length_feet', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Break History</label>
              <input type="number" className="form-input" value={formData.break_history} onChange={e => onChange('break_history', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="form-input" value={formData.priority} onChange={e => onChange('priority', e.target.value)}>
              {['low','medium','high','critical'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            {editMode ? 'Update Asset' : 'Create Asset'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
