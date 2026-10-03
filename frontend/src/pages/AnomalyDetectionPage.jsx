import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, Sparkles, X } from 'lucide-react';

const EMPTY_FORM = {
  meter_id: '', customer_name: '', account_number: '', reading_date: '',
  consumption_gallons: '', avg_consumption: '', deviation_pct: '',
  anomaly_type: 'high_usage', status: 'detected',
};

const STATUS_MAP = { detected: 'warning', investigating: 'info', confirmed: 'danger', resolved: 'success' };

export default function AnomalyDetectionPage() {
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
      const { data } = await api.get('/anomaly-detection');
      const anomalies = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(anomalies)) throw new Error('Invalid anomaly response');
      setItems(anomalies);
    } catch {
      toast.error('Failed to load anomaly data');
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
    if (!window.confirm(`Delete anomaly for meter ${selectedItem.meter_id}?`)) return;
    try {
      await api.delete(`/anomaly-detection/${selectedItem._id}`);
      toast.success('Anomaly record deleted');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete anomaly');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        const { data } = await api.put(`/anomaly-detection/${selectedItem._id}`, formData);
        toast.success('Anomaly updated');
        setSelectedItem(data);
      } else {
        await api.post('/anomaly-detection', formData);
        toast.success('Anomaly created');
      }
      setShowForm(false);
      fetchItems();
    } catch {
      toast.error(editMode ? 'Failed to update anomaly' : 'Failed to create anomaly');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await api.post(`/anomaly-detection/${selectedItem._id}/analyze`);
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

  if (loading) return <LoadingSpinner text="Loading anomaly data..." />;

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e0e6ed', margin: 0 }}>Anomaly Detection</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          <Plus size={16} /> New Anomaly
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Meter ID</th><th>Customer</th><th>Reading Date</th>
                <th>Consumption (gal)</th><th>Deviation %</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} onClick={() => handleRowClick(item)}
                  className={selectedItem?._id === item._id ? 'row-selected' : ''}
                  style={{ cursor: 'pointer' }}>
                  <td>{item.meter_id}</td>
                  <td>{item.customer_name}</td>
                  <td>{item.reading_date}</td>
                  <td>{item.consumption_gallons}</td>
                  <td>{item.deviation_pct}%</td>
                  <td><span className={`badge badge-${STATUS_MAP[item.status] || 'info'}`}>
                    <span className="badge-dot"></span>{item.status}
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
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e0e6ed', margin: 0 }}>Anomaly Details</h2>
              <button onClick={() => { setShowDetail(false); setSelectedItem(null); }}
                style={{ background: 'none', border: 'none', color: '#7a8ba8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-fields" style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              {[
                ['Meter ID', selectedItem.meter_id],
                ['Customer Name', selectedItem.customer_name],
                ['Account Number', selectedItem.account_number],
                ['Reading Date', selectedItem.reading_date],
                ['Consumption (gal)', selectedItem.consumption_gallons],
                ['Avg Consumption', selectedItem.avg_consumption],
                ['Deviation %', selectedItem.deviation_pct != null ? `${selectedItem.deviation_pct}%` : '-'],
                ['Anomaly Type', selectedItem.anomaly_type],
                ['Status', selectedItem.status],
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
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editMode ? 'Edit Anomaly' : 'New Anomaly'}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="form-group">
            <label>Meter ID</label>
            <input className="form-input" value={formData.meter_id} onChange={e => onChange('meter_id', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Customer Name</label>
            <input className="form-input" value={formData.customer_name} onChange={e => onChange('customer_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input className="form-input" value={formData.account_number} onChange={e => onChange('account_number', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Reading Date</label>
            <input type="date" className="form-input" value={formData.reading_date} onChange={e => onChange('reading_date', e.target.value)} required />
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label>Consumption (gal)</label>
              <input type="number" className="form-input" value={formData.consumption_gallons} onChange={e => onChange('consumption_gallons', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Avg Consumption</label>
              <input type="number" className="form-input" value={formData.avg_consumption} onChange={e => onChange('avg_consumption', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Deviation %</label>
            <input type="number" step="0.1" className="form-input" value={formData.deviation_pct} onChange={e => onChange('deviation_pct', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Anomaly Type</label>
            <select className="form-input" value={formData.anomaly_type} onChange={e => onChange('anomaly_type', e.target.value)}>
              {['high_usage','low_usage','irregular_pattern','possible_leak','meter_error'].map(o =>
                <option key={o} value={o}>{o}</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-input" value={formData.status} onChange={e => onChange('status', e.target.value)}>
              {['detected','investigating','confirmed','resolved'].map(o =>
                <option key={o} value={o}>{o}</option>
              )}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            {editMode ? 'Update Anomaly' : 'Create Anomaly'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
