import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, Sparkles, X } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPTY_FORM = {
  zone_name: '',
  forecast_date: '',
  predicted_demand_mgd: '',
  actual_demand_mgd: '',
  temperature_f: '',
  precipitation_in: '',
  day_of_week: 'Monday',
  is_holiday: false,
  population_served: '',
  season: 'spring',
};

export default function DemandForecastPage() {
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
      const { data } = await api.get('/demand-forecast');
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load demand forecast records');
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
      forecast_date: selectedItem.forecast_date ? selectedItem.forecast_date.substring(0, 10) : '',
      predicted_demand_mgd: selectedItem.predicted_demand_mgd || '',
      actual_demand_mgd: selectedItem.actual_demand_mgd || '',
      temperature_f: selectedItem.temperature_f || '',
      precipitation_in: selectedItem.precipitation_in || '',
      day_of_week: selectedItem.day_of_week || 'Monday',
      is_holiday: selectedItem.is_holiday || false,
      population_served: selectedItem.population_served || '',
      season: selectedItem.season || 'spring',
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/demand-forecast', formData);
      toast.success('Demand forecast record created');
      setShowForm(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create record');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/demand-forecast/${selectedItem._id || selectedItem.id}`, formData);
      toast.success('Record updated successfully');
      setShowForm(false);
      setSelectedItem(data.data || data);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update record');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this forecast record?')) return;
    try {
      await api.delete(`/demand-forecast/${selectedItem._id || selectedItem.id}`);
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
      const { data } = await api.post(`/demand-forecast/${selectedItem._id || selectedItem.id}/analyze`);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) return <LoadingSpinner text="Loading demand forecast data..." />;

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e0e6ed', margin: 0 }}>Demand Forecasting</h1>
        <button className="btn btn-primary" onClick={openCreateForm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> New Forecast
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Forecast Date</th>
              <th>Predicted (MGD)</th>
              <th>Actual (MGD)</th>
              <th>Temp (F)</th>
              <th>Confidence %</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#7a8ba8' }}>
                  No demand forecast records found. Click &quot;New Forecast&quot; to add one.
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
                  <td>{formatDate(item.forecast_date)}</td>
                  <td>{item.predicted_demand_mgd}</td>
                  <td>{item.actual_demand_mgd ?? '--'}</td>
                  <td>{item.temperature_f}</td>
                  <td>{item.confidence_pct != null ? `${item.confidence_pct}%` : '--'}</td>
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
              <h2 style={{ margin: 0, fontSize: '20px', color: '#e0e6ed' }}>Demand Forecast Detail</h2>
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
                <DetailField label="Forecast Date" value={formatDate(selectedItem.forecast_date)} />
                <DetailField label="Predicted Demand (MGD)" value={selectedItem.predicted_demand_mgd} />
                <DetailField label="Actual Demand (MGD)" value={selectedItem.actual_demand_mgd} />
                <DetailField label="Temperature (F)" value={selectedItem.temperature_f} />
                <DetailField label="Precipitation (in)" value={selectedItem.precipitation_in} />
                <DetailField label="Day of Week" value={selectedItem.day_of_week} />
                <DetailField label="Holiday" value={selectedItem.is_holiday ? 'Yes' : 'No'} />
                <DetailField label="Population Served" value={selectedItem.population_served?.toLocaleString()} />
                <DetailField label="Season" value={selectedItem.season} />
                <DetailField label="Confidence %" value={selectedItem.confidence_pct != null ? `${selectedItem.confidence_pct}%` : '--'} />
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
        title={editMode ? 'Edit Demand Forecast' : 'New Demand Forecast'}
      >
        <form onSubmit={editMode ? handleUpdate : handleCreate}>
          <div className="form-grid">
            <div className="form-group">
              <label>Zone Name</label>
              <input type="text" value={formData.zone_name} onChange={(e) => handleFormChange('zone_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Forecast Date</label>
              <input type="date" value={formData.forecast_date} onChange={(e) => handleFormChange('forecast_date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Predicted Demand (MGD)</label>
              <input type="number" step="any" value={formData.predicted_demand_mgd} onChange={(e) => handleFormChange('predicted_demand_mgd', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Actual Demand (MGD)</label>
              <input type="number" step="any" value={formData.actual_demand_mgd} onChange={(e) => handleFormChange('actual_demand_mgd', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Temperature (F)</label>
              <input type="number" step="any" value={formData.temperature_f} onChange={(e) => handleFormChange('temperature_f', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Precipitation (in)</label>
              <input type="number" step="any" value={formData.precipitation_in} onChange={(e) => handleFormChange('precipitation_in', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Day of Week</label>
              <select value={formData.day_of_week} onChange={(e) => handleFormChange('day_of_week', e.target.value)}>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Season</label>
              <select value={formData.season} onChange={(e) => handleFormChange('season', e.target.value)}>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
            </div>
            <div className="form-group">
              <label>Population Served</label>
              <input type="number" value={formData.population_served} onChange={(e) => handleFormChange('population_served', e.target.value)} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
              <input
                type="checkbox"
                id="is_holiday"
                checked={formData.is_holiday}
                onChange={(e) => handleFormChange('is_holiday', e.target.checked)}
                style={{ width: 'auto' }}
              />
              <label htmlFor="is_holiday" style={{ margin: 0 }}>Holiday</label>
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
