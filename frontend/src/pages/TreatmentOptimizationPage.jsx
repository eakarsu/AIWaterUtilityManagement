import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, Sparkles, X } from 'lucide-react';

const EMPTY_FORM = {
  plant_name: '', process_stage: 'coagulation', chemical_type: 'chlorine',
  current_dosage: '', recommended_dosage: '', influent_turbidity: '',
  effluent_turbidity: '', flow_rate_mgd: '', energy_kwh: '',
  cost_per_day: '', optimization_status: 'pending',
};

const STATUS_MAP = { pending: 'warning', optimized: 'success', review_needed: 'info', implemented: 'success' };

export default function TreatmentOptimizationPage() {
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
      const { data } = await api.get('/treatment-optimization');
      setItems(data);
    } catch {
      toast.error('Failed to load treatment data');
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
    if (!window.confirm(`Delete treatment record for ${selectedItem.plant_name}?`)) return;
    try {
      await api.delete(`/treatment-optimization/${selectedItem._id}`);
      toast.success('Treatment record deleted');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete treatment record');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        const { data } = await api.put(`/treatment-optimization/${selectedItem._id}`, formData);
        toast.success('Treatment record updated');
        setSelectedItem(data);
      } else {
        await api.post('/treatment-optimization', formData);
        toast.success('Treatment record created');
      }
      setShowForm(false);
      fetchItems();
    } catch {
      toast.error(editMode ? 'Failed to update record' : 'Failed to create record');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await api.post(`/treatment-optimization/${selectedItem._id}/analyze`);
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

  if (loading) return <LoadingSpinner text="Loading treatment data..." />;

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e0e6ed', margin: 0 }}>Treatment Optimization</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          <Plus size={16} /> New Record
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plant Name</th><th>Process Stage</th><th>Chemical</th>
                <th>Current Dosage</th><th>Recommended</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} onClick={() => handleRowClick(item)}
                  className={selectedItem?._id === item._id ? 'row-selected' : ''}
                  style={{ cursor: 'pointer' }}>
                  <td>{item.plant_name}</td>
                  <td>{item.process_stage}</td>
                  <td>{item.chemical_type}</td>
                  <td>{item.current_dosage}</td>
                  <td>{item.recommended_dosage}</td>
                  <td><span className={`badge badge-${STATUS_MAP[item.optimization_status] || 'info'}`}>
                    <span className="badge-dot"></span>{item.optimization_status}
                  </span></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#7a8ba8' }}>No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {showDetail && selectedItem && (
          <div className="detail-panel" style={{ width: 420, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e0e6ed', margin: 0 }}>Treatment Details</h2>
              <button onClick={() => { setShowDetail(false); setSelectedItem(null); }}
                style={{ background: 'none', border: 'none', color: '#7a8ba8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-fields" style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              {[
                ['Plant Name', selectedItem.plant_name],
                ['Process Stage', selectedItem.process_stage],
                ['Chemical Type', selectedItem.chemical_type],
                ['Current Dosage', selectedItem.current_dosage],
                ['Recommended Dosage', selectedItem.recommended_dosage],
                ['Influent Turbidity', selectedItem.influent_turbidity],
                ['Effluent Turbidity', selectedItem.effluent_turbidity],
                ['Flow Rate (MGD)', selectedItem.flow_rate_mgd],
                ['Energy (kWh)', selectedItem.energy_kwh],
                ['Cost Per Day', selectedItem.cost_per_day != null ? `$${Number(selectedItem.cost_per_day).toLocaleString()}` : '-'],
                ['Status', selectedItem.optimization_status],
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
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editMode ? 'Edit Treatment Record' : 'New Treatment Record'}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="form-group">
            <label>Plant Name</label>
            <input className="form-input" value={formData.plant_name} onChange={e => onChange('plant_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Process Stage</label>
            <select className="form-input" value={formData.process_stage} onChange={e => onChange('process_stage', e.target.value)}>
              {['coagulation','flocculation','sedimentation','filtration','disinfection'].map(o =>
                <option key={o} value={o}>{o}</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Chemical Type</label>
            <select className="form-input" value={formData.chemical_type} onChange={e => onChange('chemical_type', e.target.value)}>
              {['chlorine','alum','polymer','fluoride','lime','permanganate'].map(o =>
                <option key={o} value={o}>{o}</option>
              )}
            </select>
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label>Current Dosage</label>
              <input type="number" step="0.01" className="form-input" value={formData.current_dosage} onChange={e => onChange('current_dosage', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Recommended Dosage</label>
              <input type="number" step="0.01" className="form-input" value={formData.recommended_dosage} onChange={e => onChange('recommended_dosage', e.target.value)} />
            </div>
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label>Influent Turbidity</label>
              <input type="number" step="0.01" className="form-input" value={formData.influent_turbidity} onChange={e => onChange('influent_turbidity', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Effluent Turbidity</label>
              <input type="number" step="0.01" className="form-input" value={formData.effluent_turbidity} onChange={e => onChange('effluent_turbidity', e.target.value)} />
            </div>
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label>Flow Rate (MGD)</label>
              <input type="number" step="0.01" className="form-input" value={formData.flow_rate_mgd} onChange={e => onChange('flow_rate_mgd', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Energy (kWh)</label>
              <input type="number" step="0.01" className="form-input" value={formData.energy_kwh} onChange={e => onChange('energy_kwh', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Cost Per Day ($)</label>
            <input type="number" step="0.01" className="form-input" value={formData.cost_per_day} onChange={e => onChange('cost_per_day', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Optimization Status</label>
            <select className="form-input" value={formData.optimization_status} onChange={e => onChange('optimization_status', e.target.value)}>
              {['pending','optimized','review_needed','implemented'].map(o =>
                <option key={o} value={o}>{o}</option>
              )}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            {editMode ? 'Update Record' : 'Create Record'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
