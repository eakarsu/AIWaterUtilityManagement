import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

const emptyForm = {
  account_number: '', name: '', email: '', phone: '', address: '',
  service_type: 'residential', meter_id: '', status: 'active',
  monthly_avg_gallons: '', balance: '', join_date: '',
};

export default function CustomersPage() {
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
      const { data } = await api.get('/api/customers');
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error('Failed to load customers');
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
      account_number: selected.account_number || '',
      name: selected.name || '',
      email: selected.email || '',
      phone: selected.phone || '',
      address: selected.address || '',
      service_type: selected.service_type || 'residential',
      meter_id: selected.meter_id || '',
      status: selected.status || 'active',
      monthly_avg_gallons: selected.monthly_avg_gallons || '',
      balance: selected.balance || '',
      join_date: selected.join_date ? selected.join_date.slice(0, 10) : '',
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selected || !window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/api/customers/${selected._id}`);
      toast.success('Customer deleted');
      setSelected(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/customers/${selected._id}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/api/customers', form);
        toast.success('Customer created');
      }
      setModalOpen(false);
      setSelected(null);
      fetchItems();
    } catch {
      toast.error(editing ? 'Failed to update customer' : 'Failed to create customer');
    }
  };

  const onChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  if (loading) return <LoadingSpinner text="Loading customers..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
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
                <th>Account #</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Service Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#7a8ba8' }}>No customers found</td></tr>
              ) : items.map(item => (
                <tr
                  key={item._id}
                  className={selected?._id === item._id ? 'row-selected' : ''}
                  onClick={() => handleSelect(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{item.account_number}</td>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.phone}</td>
                  <td>{item.service_type}</td>
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
              <h3>{selected.name}</h3>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="detail-actions">
              <button className="btn btn-secondary" onClick={openEdit}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14} /> Delete</button>
            </div>
            <div className="detail-fields">
              <div className="detail-row"><span className="detail-label">Account #</span><span>{selected.account_number}</span></div>
              <div className="detail-row"><span className="detail-label">Name</span><span>{selected.name}</span></div>
              <div className="detail-row"><span className="detail-label">Email</span><span>{selected.email}</span></div>
              <div className="detail-row"><span className="detail-label">Phone</span><span>{selected.phone}</span></div>
              <div className="detail-row"><span className="detail-label">Address</span><span>{selected.address}</span></div>
              <div className="detail-row"><span className="detail-label">Service Type</span><span>{selected.service_type}</span></div>
              <div className="detail-row"><span className="detail-label">Meter ID</span><span>{selected.meter_id}</span></div>
              <div className="detail-row"><span className="detail-label">Status</span><StatusBadge status={selected.status} /></div>
              <div className="detail-row"><span className="detail-label">Monthly Avg (gal)</span><span>{selected.monthly_avg_gallons}</span></div>
              <div className="detail-row"><span className="detail-label">Balance</span><span>${selected.balance}</span></div>
              <div className="detail-row"><span className="detail-label">Join Date</span><span>{selected.join_date ? new Date(selected.join_date).toLocaleDateString() : '—'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'New Customer'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Account #</label>
              <input type="text" value={form.account_number} onChange={e => onChange('account_number', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={form.name} onChange={e => onChange('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => onChange('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={form.phone} onChange={e => onChange('phone', e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label>Address</label>
              <textarea value={form.address} onChange={e => onChange('address', e.target.value)} rows={2} />
            </div>
            <div className="form-group">
              <label>Service Type</label>
              <select value={form.service_type} onChange={e => onChange('service_type', e.target.value)}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="municipal">Municipal</option>
              </select>
            </div>
            <div className="form-group">
              <label>Meter ID</label>
              <input type="text" value={form.meter_id} onChange={e => onChange('meter_id', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => onChange('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="form-group">
              <label>Monthly Avg (gallons)</label>
              <input type="number" value={form.monthly_avg_gallons} onChange={e => onChange('monthly_avg_gallons', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Balance</label>
              <input type="number" step="0.01" value={form.balance} onChange={e => onChange('balance', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Join Date</label>
              <input type="date" value={form.join_date} onChange={e => onChange('join_date', e.target.value)} />
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
