import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

const emptyForm = {
  meter_id: '', customer_name: '', reading_value: '', previous_reading: '',
  consumption: '', reading_date: '', read_by: '', status: 'pending', notes: '',
};

export default function MeterReadingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/meter-readings');
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error('Failed to load meter readings');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => setSelected(selected?._id === item._id ? null : item);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditing(false);
    setModalOpen(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      meter_id: selected.meter_id || '',
      customer_name: selected.customer_name || '',
      reading_value: selected.reading_value || '',
      previous_reading: selected.previous_reading || '',
      consumption: selected.consumption || '',
      reading_date: selected.reading_date ? selected.reading_date.slice(0, 10) : '',
      read_by: selected.read_by || '',
      status: selected.status || 'pending',
      notes: selected.notes || '',
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selected || !window.confirm('Delete this meter reading?')) return;
    try {
      await api.delete(`/api/meter-readings/${selected._id}`);
      toast.success('Meter reading deleted');
      setSelected(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete meter reading');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/meter-readings/${selected._id}`, form);
        toast.success('Meter reading updated');
      } else {
        await api.post('/api/meter-readings', form);
        toast.success('Meter reading created');
      }
      setModalOpen(false);
      setSelected(null);
      fetchItems();
    } catch {
      toast.error(editing ? 'Failed to update meter reading' : 'Failed to create meter reading');
    }
  };

  const onChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  if (loading) return <LoadingSpinner text="Loading meter readings..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Meter Readings</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New
        </button>
      </div>

      <div className="page-content" style={{ display: 'flex', gap: '24px' }}>
        {/* Table */}
        <div className="card" style={{ flex: 1, overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Meter ID</th>
                <th>Customer</th>
                <th>Reading</th>
                <th>Previous</th>
                <th>Consumption</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#7a8ba8' }}>No meter readings found</td></tr>
              ) : items.map(item => (
                <tr
                  key={item._id}
                  className={selected?._id === item._id ? 'row-selected' : ''}
                  onClick={() => handleSelect(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{item.meter_id}</td>
                  <td>{item.customer_name}</td>
                  <td>{item.reading_value}</td>
                  <td>{item.previous_reading}</td>
                  <td>{item.consumption}</td>
                  <td>{item.reading_date ? new Date(item.reading_date).toLocaleDateString() : '—'}</td>
                  <td><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card detail-panel" style={{ width: '360px', flexShrink: 0 }}>
            <div className="detail-header">
              <h3>Meter {selected.meter_id}</h3>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={openEdit}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14} /> Delete</button>
            </div>
            <div className="detail-fields">
              <div className="detail-row"><span className="detail-label">Meter ID</span><span>{selected.meter_id}</span></div>
              <div className="detail-row"><span className="detail-label">Customer</span><span>{selected.customer_name}</span></div>
              <div className="detail-row"><span className="detail-label">Reading Value</span><span>{selected.reading_value}</span></div>
              <div className="detail-row"><span className="detail-label">Previous Reading</span><span>{selected.previous_reading}</span></div>
              <div className="detail-row"><span className="detail-label">Consumption</span><span>{selected.consumption}</span></div>
              <div className="detail-row"><span className="detail-label">Reading Date</span><span>{selected.reading_date ? new Date(selected.reading_date).toLocaleDateString() : '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Read By</span><span>{selected.read_by}</span></div>
              <div className="detail-row"><span className="detail-label">Status</span><StatusBadge status={selected.status} /></div>
              <div className="detail-row"><span className="detail-label">Notes</span><span>{selected.notes || '—'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Meter Reading' : 'New Meter Reading'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Meter ID</label>
              <input type="text" value={form.meter_id} onChange={e => onChange('meter_id', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Customer Name</label>
              <input type="text" value={form.customer_name} onChange={e => onChange('customer_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Reading Value</label>
              <input type="number" value={form.reading_value} onChange={e => onChange('reading_value', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Previous Reading</label>
              <input type="number" value={form.previous_reading} onChange={e => onChange('previous_reading', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Consumption</label>
              <input type="number" value={form.consumption} onChange={e => onChange('consumption', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Reading Date</label>
              <input type="date" value={form.reading_date} onChange={e => onChange('reading_date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Read By</label>
              <input type="text" value={form.read_by} onChange={e => onChange('read_by', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => onChange('status', e.target.value)}>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="estimated">Estimated</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea value={form.notes} onChange={e => onChange('notes', e.target.value)} rows={3} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
