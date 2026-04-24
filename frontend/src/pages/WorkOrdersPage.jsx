import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

const emptyForm = {
  work_order_number: '', title: '', description: '', category: 'maintenance',
  priority: 'medium', status: 'open', assigned_to: '', location: '',
  estimated_hours: '', actual_hours: '', due_date: '', completed_date: '', cost: '',
};

export default function WorkOrdersPage() {
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
      const { data } = await api.get('/api/work-orders');
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error('Failed to load work orders');
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
      work_order_number: selected.work_order_number || '',
      title: selected.title || '',
      description: selected.description || '',
      category: selected.category || 'maintenance',
      priority: selected.priority || 'medium',
      status: selected.status || 'open',
      assigned_to: selected.assigned_to || '',
      location: selected.location || '',
      estimated_hours: selected.estimated_hours || '',
      actual_hours: selected.actual_hours || '',
      due_date: selected.due_date ? selected.due_date.slice(0, 10) : '',
      completed_date: selected.completed_date ? selected.completed_date.slice(0, 10) : '',
      cost: selected.cost || '',
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selected || !window.confirm('Delete this work order?')) return;
    try {
      await api.delete(`/api/work-orders/${selected._id}`);
      toast.success('Work order deleted');
      setSelected(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete work order');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/work-orders/${selected._id}`, form);
        toast.success('Work order updated');
      } else {
        await api.post('/api/work-orders', form);
        toast.success('Work order created');
      }
      setModalOpen(false);
      setSelected(null);
      fetchItems();
    } catch {
      toast.error(editing ? 'Failed to update work order' : 'Failed to create work order');
    }
  };

  const onChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const priorityLabel = (p) => {
    const map = { low: 'low', medium: 'medium', high: 'high', critical: 'critical' };
    return map[p] || p;
  };

  if (loading) return <LoadingSpinner text="Loading work orders..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Work Orders</h1>
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
                <th>WO #</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#7a8ba8' }}>No work orders found</td></tr>
              ) : items.map(item => (
                <tr
                  key={item._id}
                  className={selected?._id === item._id ? 'row-selected' : ''}
                  onClick={() => handleSelect(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{item.work_order_number}</td>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td><StatusBadge status={priorityLabel(item.priority)} /></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.assigned_to}</td>
                  <td>{item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card detail-panel" style={{ width: '360px', flexShrink: 0 }}>
            <div className="detail-header">
              <h3>{selected.work_order_number}</h3>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={openEdit}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14} /> Delete</button>
            </div>
            <div className="detail-fields">
              <div className="detail-row"><span className="detail-label">WO #</span><span>{selected.work_order_number}</span></div>
              <div className="detail-row"><span className="detail-label">Title</span><span>{selected.title}</span></div>
              <div className="detail-row"><span className="detail-label">Description</span><span>{selected.description || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Category</span><span>{selected.category}</span></div>
              <div className="detail-row"><span className="detail-label">Priority</span><StatusBadge status={priorityLabel(selected.priority)} /></div>
              <div className="detail-row"><span className="detail-label">Status</span><StatusBadge status={selected.status} /></div>
              <div className="detail-row"><span className="detail-label">Assigned To</span><span>{selected.assigned_to}</span></div>
              <div className="detail-row"><span className="detail-label">Location</span><span>{selected.location || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Est. Hours</span><span>{selected.estimated_hours || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Actual Hours</span><span>{selected.actual_hours || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Due Date</span><span>{selected.due_date ? new Date(selected.due_date).toLocaleDateString() : '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Completed</span><span>{selected.completed_date ? new Date(selected.completed_date).toLocaleDateString() : '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Cost</span><span>{selected.cost ? `$${selected.cost}` : '—'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Work Order' : 'New Work Order'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>WO #</label>
              <input type="text" value={form.work_order_number} onChange={e => onChange('work_order_number', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={form.title} onChange={e => onChange('title', e.target.value)} required />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea value={form.description} onChange={e => onChange('description', e.target.value)} rows={3} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => onChange('category', e.target.value)}>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="installation">Installation</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => onChange('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => onChange('status', e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Assigned To</label>
              <input type="text" value={form.assigned_to} onChange={e => onChange('assigned_to', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={e => onChange('location', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Estimated Hours</label>
              <input type="number" step="0.5" value={form.estimated_hours} onChange={e => onChange('estimated_hours', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Actual Hours</label>
              <input type="number" step="0.5" value={form.actual_hours} onChange={e => onChange('actual_hours', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => onChange('due_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Completed Date</label>
              <input type="date" value={form.completed_date} onChange={e => onChange('completed_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Cost</label>
              <input type="number" step="0.01" value={form.cost} onChange={e => onChange('cost', e.target.value)} />
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
