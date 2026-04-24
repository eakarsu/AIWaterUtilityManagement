import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

const statusMap = { operational: 'success', maintenance: 'warning', offline: 'danger', standby: 'info' };
const statuses = ['operational', 'maintenance', 'offline', 'standby'];

const emptyForm = {
  station_name: '', station_id: '', location: '', capacity_gpm: '', current_flow_gpm: '',
  pressure_psi: '', power_kw: '', status: 'operational', last_maintenance: '',
  pump_count: '', runtime_hours: '', efficiency_pct: ''
};

export default function PumpStationsPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/pump-stations');
      setStations(res.data);
    } catch {
      toast.error('Failed to load pump stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStations(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(false); setShowModal(true); };

  const openEdit = () => {
    setForm({
      station_name: selected.station_name || '', station_id: selected.station_id || '',
      location: selected.location || '', capacity_gpm: selected.capacity_gpm || '',
      current_flow_gpm: selected.current_flow_gpm || '', pressure_psi: selected.pressure_psi || '',
      power_kw: selected.power_kw || '', status: selected.status || 'operational',
      last_maintenance: selected.last_maintenance?.slice(0, 10) || '',
      pump_count: selected.pump_count || '', runtime_hours: selected.runtime_hours || '',
      efficiency_pct: selected.efficiency_pct || ''
    });
    setEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/pump-stations/${selected.id}`, form);
        toast.success('Pump station updated successfully');
        setSelected(null);
      } else {
        await api.post('/api/pump-stations', form);
        toast.success('Pump station created successfully');
      }
      setShowModal(false);
      fetchStations();
    } catch {
      toast.error(editing ? 'Failed to update pump station' : 'Failed to create pump station');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this pump station?')) return;
    try {
      await api.delete(`/api/pump-stations/${selected.id}`);
      toast.success('Pump station deleted successfully');
      setSelected(null);
      fetchStations();
    } catch {
      toast.error('Failed to delete pump station');
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pump Stations</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> New
        </button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 overflow-auto">
          <table className="w-full table">
            <thead>
              <tr>
                <th>Station Name</th><th>Station ID</th><th>Capacity (GPM)</th>
                <th>Current Flow</th><th>Pressure (PSI)</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr key={s.id} onClick={() => setSelected(s)}
                  className={`cursor-pointer hover:bg-gray-50 ${selected?.id === s.id ? 'bg-blue-50' : ''}`}>
                  <td>{s.station_name}</td>
                  <td>{s.station_id}</td>
                  <td>{s.capacity_gpm}</td>
                  <td>{s.current_flow_gpm}</td>
                  <td>{s.pressure_psi}</td>
                  <td><StatusBadge status={s.status} variant={statusMap[s.status] || 'info'} /></td>
                </tr>
              ))}
              {stations.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">No pump stations found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-80 border rounded-lg p-4 bg-white shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Station Details</h2>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">Station Name</dt><dd className="font-medium">{selected.station_name}</dd></div>
              <div><dt className="text-gray-500">Station ID</dt><dd>{selected.station_id}</dd></div>
              <div><dt className="text-gray-500">Location</dt><dd>{selected.location}</dd></div>
              <div><dt className="text-gray-500">Capacity (GPM)</dt><dd>{selected.capacity_gpm}</dd></div>
              <div><dt className="text-gray-500">Current Flow (GPM)</dt><dd>{selected.current_flow_gpm}</dd></div>
              <div><dt className="text-gray-500">Pressure (PSI)</dt><dd>{selected.pressure_psi}</dd></div>
              <div><dt className="text-gray-500">Power (kW)</dt><dd>{selected.power_kw}</dd></div>
              <div><dt className="text-gray-500">Status</dt><dd><StatusBadge status={selected.status} variant={statusMap[selected.status] || 'info'} /></dd></div>
              <div><dt className="text-gray-500">Last Maintenance</dt><dd>{selected.last_maintenance?.slice(0, 10)}</dd></div>
              <div><dt className="text-gray-500">Pump Count</dt><dd>{selected.pump_count}</dd></div>
              <div><dt className="text-gray-500">Runtime Hours</dt><dd>{selected.runtime_hours}</dd></div>
              <div><dt className="text-gray-500">Efficiency (%)</dt><dd>{selected.efficiency_pct}</dd></div>
            </dl>
            <div className="flex gap-2 mt-4">
              <button onClick={openEdit} className="btn btn-secondary flex items-center gap-1"><Edit3 size={16} /> Edit</button>
              <button onClick={handleDelete} className="btn btn-danger flex items-center gap-1"><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Pump Station' : 'New Pump Station'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Station Name</label>
              <input name="station_name" value={form.station_name} onChange={onChange} required className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Station ID</label>
              <input name="station_id" value={form.station_id} onChange={onChange} required className="input w-full" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Location</label>
              <input name="location" value={form.location} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity (GPM)</label>
              <input name="capacity_gpm" type="number" value={form.capacity_gpm} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Flow (GPM)</label>
              <input name="current_flow_gpm" type="number" value={form.current_flow_gpm} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pressure (PSI)</label>
              <input name="pressure_psi" type="number" value={form.pressure_psi} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Power (kW)</label>
              <input name="power_kw" type="number" value={form.power_kw} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" value={form.status} onChange={onChange} className="input w-full">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Maintenance</label>
              <input name="last_maintenance" type="date" value={form.last_maintenance} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pump Count</label>
              <input name="pump_count" type="number" value={form.pump_count} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Runtime Hours</label>
              <input name="runtime_hours" type="number" value={form.runtime_hours} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Efficiency (%)</label>
              <input name="efficiency_pct" type="number" value={form.efficiency_pct} onChange={onChange} className="input w-full" />
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
