import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

const statusMap = { normal: 'success', low: 'warning', high: 'warning', maintenance: 'info', offline: 'danger' };
const statuses = ['normal', 'low', 'high', 'maintenance', 'offline'];

const emptyForm = {
  reservoir_name: '', reservoir_id: '', location: '', capacity_mg: '', current_level_mg: '',
  level_pct: '', inflow_gpm: '', outflow_gpm: '', water_temp_f: '', status: 'normal', last_inspection: ''
};

export default function ReservoirsPage() {
  const [reservoirs, setReservoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchReservoirs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reservoirs');
      setReservoirs(res.data);
    } catch {
      toast.error('Failed to load reservoirs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservoirs(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(false); setShowModal(true); };

  const openEdit = () => {
    setForm({
      reservoir_name: selected.reservoir_name || '', reservoir_id: selected.reservoir_id || '',
      location: selected.location || '', capacity_mg: selected.capacity_mg || '',
      current_level_mg: selected.current_level_mg || '', level_pct: selected.level_pct || '',
      inflow_gpm: selected.inflow_gpm || '', outflow_gpm: selected.outflow_gpm || '',
      water_temp_f: selected.water_temp_f || '', status: selected.status || 'normal',
      last_inspection: selected.last_inspection?.slice(0, 10) || ''
    });
    setEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/reservoirs/${selected.id}`, form);
        toast.success('Reservoir updated successfully');
        setSelected(null);
      } else {
        await api.post('/api/reservoirs', form);
        toast.success('Reservoir created successfully');
      }
      setShowModal(false);
      fetchReservoirs();
    } catch {
      toast.error(editing ? 'Failed to update reservoir' : 'Failed to create reservoir');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this reservoir?')) return;
    try {
      await api.delete(`/api/reservoirs/${selected.id}`);
      toast.success('Reservoir deleted successfully');
      setSelected(null);
      fetchReservoirs();
    } catch {
      toast.error('Failed to delete reservoir');
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reservoirs</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> New
        </button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 overflow-auto">
          <table className="w-full table">
            <thead>
              <tr>
                <th>Name</th><th>Reservoir ID</th><th>Capacity (MG)</th>
                <th>Current Level (MG)</th><th>Level %</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reservoirs.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)}
                  className={`cursor-pointer hover:bg-gray-50 ${selected?.id === r.id ? 'bg-blue-50' : ''}`}>
                  <td>{r.reservoir_name}</td>
                  <td>{r.reservoir_id}</td>
                  <td>{r.capacity_mg}</td>
                  <td>{r.current_level_mg}</td>
                  <td>{r.level_pct}%</td>
                  <td><StatusBadge status={r.status} variant={statusMap[r.status] || 'info'} /></td>
                </tr>
              ))}
              {reservoirs.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">No reservoirs found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-80 border rounded-lg p-4 bg-white shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reservoir Details</h2>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{selected.reservoir_name}</dd></div>
              <div><dt className="text-gray-500">Reservoir ID</dt><dd>{selected.reservoir_id}</dd></div>
              <div><dt className="text-gray-500">Location</dt><dd>{selected.location}</dd></div>
              <div><dt className="text-gray-500">Capacity (MG)</dt><dd>{selected.capacity_mg}</dd></div>
              <div><dt className="text-gray-500">Current Level (MG)</dt><dd>{selected.current_level_mg}</dd></div>
              <div><dt className="text-gray-500">Level %</dt><dd>{selected.level_pct}%</dd></div>
              <div><dt className="text-gray-500">Inflow (GPM)</dt><dd>{selected.inflow_gpm}</dd></div>
              <div><dt className="text-gray-500">Outflow (GPM)</dt><dd>{selected.outflow_gpm}</dd></div>
              <div><dt className="text-gray-500">Water Temp (F)</dt><dd>{selected.water_temp_f}</dd></div>
              <div><dt className="text-gray-500">Status</dt><dd><StatusBadge status={selected.status} variant={statusMap[selected.status] || 'info'} /></dd></div>
              <div><dt className="text-gray-500">Last Inspection</dt><dd>{selected.last_inspection?.slice(0, 10)}</dd></div>
            </dl>
            <div className="flex gap-2 mt-4">
              <button onClick={openEdit} className="btn btn-secondary flex items-center gap-1"><Edit3 size={16} /> Edit</button>
              <button onClick={handleDelete} className="btn btn-danger flex items-center gap-1"><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Reservoir' : 'New Reservoir'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reservoir Name</label>
              <input name="reservoir_name" value={form.reservoir_name} onChange={onChange} required className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reservoir ID</label>
              <input name="reservoir_id" value={form.reservoir_id} onChange={onChange} required className="input w-full" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Location</label>
              <input name="location" value={form.location} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity (MG)</label>
              <input name="capacity_mg" type="number" step="any" value={form.capacity_mg} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Level (MG)</label>
              <input name="current_level_mg" type="number" step="any" value={form.current_level_mg} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level %</label>
              <input name="level_pct" type="number" step="any" value={form.level_pct} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inflow (GPM)</label>
              <input name="inflow_gpm" type="number" step="any" value={form.inflow_gpm} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Outflow (GPM)</label>
              <input name="outflow_gpm" type="number" step="any" value={form.outflow_gpm} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Water Temp (F)</label>
              <input name="water_temp_f" type="number" step="any" value={form.water_temp_f} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" value={form.status} onChange={onChange} className="input w-full">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Inspection</label>
              <input name="last_inspection" type="date" value={form.last_inspection} onChange={onChange} className="input w-full" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
