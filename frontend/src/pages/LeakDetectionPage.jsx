import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, Sparkles, X } from 'lucide-react';

const EMPTY_FORM = {
  zone_name: '',
  sensor_id: '',
  pressure_psi: '',
  flow_rate_gpm: '',
  normal_pressure: '',
  normal_flow: '',
  status: 'monitoring',
  severity: 'low',
  location_lat: '',
  location_lng: '',
};

export default function LeakDetectionPage() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/leak-detection');
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load leak detection records');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const openCreateForm = () => {
    setFormData(EMPTY_FORM);
    setEditMode(false);
    setShowForm(true);
  };

  const openEditForm = () => {
    setFormData({
      zone_name: selectedItem.zone_name || '',
      sensor_id: selectedItem.sensor_id || '',
      pressure_psi: selectedItem.pressure_psi || '',
      flow_rate_gpm: selectedItem.flow_rate_gpm || '',
      normal_pressure: selectedItem.normal_pressure || '',
      normal_flow: selectedItem.normal_flow || '',
      status: selectedItem.status || 'monitoring',
      severity: selectedItem.severity || 'low',
      location_lat: selectedItem.location_lat || '',
      location_lng: selectedItem.location_lng || '',
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leak-detection', formData);
      toast.success('Leak detection record created');
      setShowForm(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create record');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/leak-detection/${selectedItem._id || selectedItem.id}`, formData);
      toast.success('Record updated successfully');
      setShowForm(false);
      setSelectedItem(data.data || data);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update record');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/leak-detection/${selectedItem._id || selectedItem.id}`);
      toast.success('Record deleted');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete record');
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const { data } = await api.post(`/leak-detection/${selectedItem._id || selectedItem.id}/analyze`);
      const updated = data.data || data;
      setSelectedItem(updated);
      setItems((prev) =>
        prev.map((item) => ((item._id || item.id) === (updated._id || updated.id) ? updated : item))
      );
      toast.success('AI analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <LoadingSpinner text="Loading leak detection data..." />;

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e0e6ed', margin: 0 }}>Leak Detection</h1>
        <button className="btn btn-primary" onClick={openCreateForm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> New Record
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Sensor ID</th>
              <th>Pressure (PSI)</th>
              <th>Flow (GPM)</th>
              <th>Status</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#7a8ba8' }}>
                  No leak detection records found. Click &quot;New Record&quot; to add one.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item._id || item.id}
                  onClick={() => handleRowClick(item)}
                  style={{ cursor: 'pointer' }}
                  className="table-row-hover"
                >
                  <td>{item.zone_name}</td>
                  <td>{item.sensor_id}</td>
                  <td>{item.pressure_psi}</td>
                  <td>{item.flow_rate_gpm}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td><StatusBadge status={item.severity} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {showDetail && selectedItem && (
        <div className="detail-panel-overlay" onClick={() => setShowDetail(false)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-panel-header">
              <h2 style={{ margin: 0, fontSize: '20px', color: '#e0e6ed' }}>Leak Detection Detail</h2>
              <button className="btn-icon" onClick={() => setShowDetail(false)}><X size={20} /></button>
            </div>

            <div className="detail-panel-actions">
              <button className="btn btn-secondary" onClick={openEditForm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={16} /> Edit
              </button>
              <button className="btn btn-danger" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={16} /> Delete
              </button>
              <button
                className="btn btn-ai"
                onClick={handleAnalyze}
                disabled={analyzing}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={16} /> {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>

            <div className="detail-panel-body">
              <div className="detail-grid">
                <DetailField label="Zone Name" value={selectedItem.zone_name} />
                <DetailField label="Sensor ID" value={selectedItem.sensor_id} />
                <DetailField label="Pressure (PSI)" value={selectedItem.pressure_psi} />
                <DetailField label="Flow Rate (GPM)" value={selectedItem.flow_rate_gpm} />
                <DetailField label="Normal Pressure" value={selectedItem.normal_pressure} />
                <DetailField label="Normal Flow" value={selectedItem.normal_flow} />
                <DetailField label="Pressure Drop %" value={selectedItem.pressure_drop_pct != null ? `${selectedItem.pressure_drop_pct}%` : '--'} />
                <DetailField label="Flow Anomaly %" value={selectedItem.flow_anomaly_pct != null ? `${selectedItem.flow_anomaly_pct}%` : '--'} />
                <DetailField label="Status" value={<StatusBadge status={selectedItem.status} />} />
                <DetailField label="Severity" value={<StatusBadge status={selectedItem.severity} />} />
                <DetailField label="Latitude" value={selectedItem.location_lat} />
                <DetailField label="Longitude" value={selectedItem.location_lng} />
                <DetailField label="Detected At" value={selectedItem.detected_at ? new Date(selectedItem.detected_at).toLocaleString() : '--'} />
              </div>

              {/* AI Analysis Section */}
              <div style={{ marginTop: '24px' }}>
                <AIAnalysisDisplay analysis={selectedItem.ai_analysis} timestamp={selectedItem.analyzed_at} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editMode ? 'Edit Leak Detection Record' : 'New Leak Detection Record'}
      >
        <form onSubmit={editMode ? handleUpdate : handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label>Zone Name</label>
              <input type="text" value={formData.zone_name} onChange={(e) => handleFormChange('zone_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Sensor ID</label>
              <input type="text" value={formData.sensor_id} onChange={(e) => handleFormChange('sensor_id', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Pressure (PSI)</label>
              <input type="number" step="any" value={formData.pressure_psi} onChange={(e) => handleFormChange('pressure_psi', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Flow Rate (GPM)</label>
              <input type="number" step="any" value={formData.flow_rate_gpm} onChange={(e) => handleFormChange('flow_rate_gpm', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Normal Pressure</label>
              <input type="number" step="any" value={formData.normal_pressure} onChange={(e) => handleFormChange('normal_pressure', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Normal Flow</label>
              <input type="number" step="any" value={formData.normal_flow} onChange={(e) => handleFormChange('normal_flow', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={(e) => handleFormChange('status', e.target.value)}>
                <option value="monitoring">Monitoring</option>
                <option value="alert">Alert</option>
                <option value="critical">Critical</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="form-group">
              <label>Severity</label>
              <select value={formData.severity} onChange={(e) => handleFormChange('severity', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" value={formData.location_lat} onChange={(e) => handleFormChange('location_lat', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" value={formData.location_lng} onChange={(e) => handleFormChange('location_lng', e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value ?? '--'}</span>
    </div>
  );
}
