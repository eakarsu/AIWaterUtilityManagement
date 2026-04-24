import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, Sparkles, X } from 'lucide-react';

const EMPTY_FORM = {
  sample_id: '',
  location_name: '',
  ph_level: '',
  turbidity_ntu: '',
  chlorine_residual: '',
  lead_ppb: '',
  copper_ppb: '',
  coliform_present: false,
  ecoli_present: false,
  temperature_c: '',
  compliance_status: 'compliant',
};

export default function WaterQualityPage() {
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
      const { data } = await api.get('/water-quality');
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load water quality records');
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
      sample_id: selectedItem.sample_id || '',
      location_name: selectedItem.location_name || '',
      ph_level: selectedItem.ph_level || '',
      turbidity_ntu: selectedItem.turbidity_ntu || '',
      chlorine_residual: selectedItem.chlorine_residual || '',
      lead_ppb: selectedItem.lead_ppb || '',
      copper_ppb: selectedItem.copper_ppb || '',
      coliform_present: selectedItem.coliform_present || false,
      ecoli_present: selectedItem.ecoli_present || false,
      temperature_c: selectedItem.temperature_c || '',
      compliance_status: selectedItem.compliance_status || 'compliant',
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/water-quality', formData);
      toast.success('Water quality record created');
      setShowForm(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create record');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/water-quality/${selectedItem._id || selectedItem.id}`, formData);
      toast.success('Record updated successfully');
      setShowForm(false);
      setSelectedItem(data.data || data);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update record');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this water quality record?')) return;
    try {
      await api.delete(`/water-quality/${selectedItem._id || selectedItem.id}`);
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
      const { data } = await api.post(`/water-quality/${selectedItem._id || selectedItem.id}/analyze`);
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

  if (loading) return <LoadingSpinner text="Loading water quality data..." />;

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e0e6ed', margin: 0 }}>Water Quality</h1>
        <button className="btn btn-primary" onClick={openCreateForm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> New Sample
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sample ID</th>
              <th>Location</th>
              <th>pH</th>
              <th>Turbidity (NTU)</th>
              <th>Chlorine</th>
              <th>Compliance Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#7a8ba8' }}>
                  No water quality records found. Click &quot;New Sample&quot; to add one.
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
                  <td>{item.sample_id}</td>
                  <td>{item.location_name}</td>
                  <td>{item.ph_level}</td>
                  <td>{item.turbidity_ntu}</td>
                  <td>{item.chlorine_residual}</td>
                  <td><StatusBadge status={item.compliance_status} /></td>
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
              <h2 style={{ margin: 0, fontSize: '20px', color: '#e0e6ed' }}>Water Quality Detail</h2>
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
                <DetailField label="Sample ID" value={selectedItem.sample_id} />
                <DetailField label="Location" value={selectedItem.location_name} />
                <DetailField label="pH Level" value={selectedItem.ph_level} />
                <DetailField label="Turbidity (NTU)" value={selectedItem.turbidity_ntu} />
                <DetailField label="Chlorine Residual" value={selectedItem.chlorine_residual} />
                <DetailField label="Lead (ppb)" value={selectedItem.lead_ppb} />
                <DetailField label="Copper (ppb)" value={selectedItem.copper_ppb} />
                <DetailField label="Coliform Present" value={selectedItem.coliform_present ? 'Yes' : 'No'} />
                <DetailField label="E. coli Present" value={selectedItem.ecoli_present ? 'Yes' : 'No'} />
                <DetailField label="Temperature (C)" value={selectedItem.temperature_c} />
                <DetailField label="Compliance Status" value={<StatusBadge status={selectedItem.compliance_status} />} />
                <DetailField label="Sampled At" value={selectedItem.sampled_at ? new Date(selectedItem.sampled_at).toLocaleString() : '--'} />
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
        title={editMode ? 'Edit Water Quality Record' : 'New Water Quality Sample'}
      >
        <form onSubmit={editMode ? handleUpdate : handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label>Sample ID</label>
              <input type="text" value={formData.sample_id} onChange={(e) => handleFormChange('sample_id', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Location Name</label>
              <input type="text" value={formData.location_name} onChange={(e) => handleFormChange('location_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>pH Level</label>
              <input type="number" step="any" value={formData.ph_level} onChange={(e) => handleFormChange('ph_level', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Turbidity (NTU)</label>
              <input type="number" step="any" value={formData.turbidity_ntu} onChange={(e) => handleFormChange('turbidity_ntu', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Chlorine Residual</label>
              <input type="number" step="any" value={formData.chlorine_residual} onChange={(e) => handleFormChange('chlorine_residual', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Lead (ppb)</label>
              <input type="number" step="any" value={formData.lead_ppb} onChange={(e) => handleFormChange('lead_ppb', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Copper (ppb)</label>
              <input type="number" step="any" value={formData.copper_ppb} onChange={(e) => handleFormChange('copper_ppb', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Temperature (C)</label>
              <input type="number" step="any" value={formData.temperature_c} onChange={(e) => handleFormChange('temperature_c', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Compliance Status</label>
              <select value={formData.compliance_status} onChange={(e) => handleFormChange('compliance_status', e.target.value)}>
                <option value="compliant">Compliant</option>
                <option value="warning">Warning</option>
                <option value="violation">Violation</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                <input
                  type="checkbox"
                  id="coliform_present"
                  checked={formData.coliform_present}
                  onChange={(e) => handleFormChange('coliform_present', e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="coliform_present" style={{ margin: 0 }}>Coliform Present</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="ecoli_present"
                  checked={formData.ecoli_present}
                  onChange={(e) => handleFormChange('ecoli_present', e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="ecoli_present" style={{ margin: 0 }}>E. coli Present</label>
              </div>
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
