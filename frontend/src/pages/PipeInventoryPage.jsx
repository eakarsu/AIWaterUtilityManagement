import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

const conditionMap = { excellent: 'success', good: 'success', fair: 'warning', poor: 'danger', critical: 'danger' };
const materials = ['cast_iron', 'ductile_iron', 'pvc', 'hdpe', 'concrete', 'copper', 'steel'];
const conditions = ['excellent', 'good', 'fair', 'poor', 'critical'];

const emptyForm = {
  pipe_id: '', material: 'pvc', diameter_inches: '', length_feet: '', install_year: '',
  zone: '', street_name: '', condition_rating: 'good', pressure_class: '', last_inspection: '', notes: ''
};

export default function PipeInventoryPage() {
  const [pipes, setPipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchPipes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/pipe-inventory');
      setPipes(res.data);
    } catch {
      toast.error('Failed to load pipe inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPipes(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(false); setShowModal(true); };

  const openEdit = () => {
    setForm({
      pipe_id: selected.pipe_id || '', material: selected.material || 'pvc',
      diameter_inches: selected.diameter_inches || '', length_feet: selected.length_feet || '',
      install_year: selected.install_year || '', zone: selected.zone || '',
      street_name: selected.street_name || '', condition_rating: selected.condition_rating || 'good',
      pressure_class: selected.pressure_class || '', last_inspection: selected.last_inspection?.slice(0, 10) || '',
      notes: selected.notes || ''
    });
    setEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/pipe-inventory/${selected.id}`, form);
        toast.success('Pipe updated successfully');
        setSelected(null);
      } else {
        await api.post('/api/pipe-inventory', form);
        toast.success('Pipe created successfully');
      }
      setShowModal(false);
      fetchPipes();
    } catch {
      toast.error(editing ? 'Failed to update pipe' : 'Failed to create pipe');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this pipe record?')) return;
    try {
      await api.delete(`/api/pipe-inventory/${selected.id}`);
      toast.success('Pipe deleted successfully');
      setSelected(null);
      fetchPipes();
    } catch {
      toast.error('Failed to delete pipe');
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pipe Inventory</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> New
        </button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 overflow-auto">
          <table className="w-full table">
            <thead>
              <tr>
                <th>Pipe ID</th><th>Material</th><th>Diameter (in)</th>
                <th>Length (ft)</th><th>Zone</th><th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {pipes.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)}
                  className={`cursor-pointer hover:bg-gray-50 ${selected?.id === p.id ? 'bg-blue-50' : ''}`}>
                  <td>{p.pipe_id}</td>
                  <td>{p.material?.replace('_', ' ')}</td>
                  <td>{p.diameter_inches}</td>
                  <td>{p.length_feet}</td>
                  <td>{p.zone}</td>
                  <td><StatusBadge status={p.condition_rating} variant={conditionMap[p.condition_rating] || 'info'} /></td>
                </tr>
              ))}
              {pipes.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">No pipes found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-80 border rounded-lg p-4 bg-white shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Pipe Details</h2>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">Pipe ID</dt><dd className="font-medium">{selected.pipe_id}</dd></div>
              <div><dt className="text-gray-500">Material</dt><dd>{selected.material?.replace('_', ' ')}</dd></div>
              <div><dt className="text-gray-500">Diameter (in)</dt><dd>{selected.diameter_inches}</dd></div>
              <div><dt className="text-gray-500">Length (ft)</dt><dd>{selected.length_feet}</dd></div>
              <div><dt className="text-gray-500">Install Year</dt><dd>{selected.install_year}</dd></div>
              <div><dt className="text-gray-500">Zone</dt><dd>{selected.zone}</dd></div>
              <div><dt className="text-gray-500">Street</dt><dd>{selected.street_name}</dd></div>
              <div><dt className="text-gray-500">Condition</dt><dd><StatusBadge status={selected.condition_rating} variant={conditionMap[selected.condition_rating] || 'info'} /></dd></div>
              <div><dt className="text-gray-500">Pressure Class</dt><dd>{selected.pressure_class}</dd></div>
              <div><dt className="text-gray-500">Last Inspection</dt><dd>{selected.last_inspection?.slice(0, 10)}</dd></div>
              <div><dt className="text-gray-500">Notes</dt><dd>{selected.notes || '—'}</dd></div>
            </dl>
            <div className="flex gap-2 mt-4">
              <button onClick={openEdit} className="btn btn-secondary flex items-center gap-1"><Edit3 size={16} /> Edit</button>
              <button onClick={handleDelete} className="btn btn-danger flex items-center gap-1"><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Pipe' : 'New Pipe'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pipe ID</label>
              <input name="pipe_id" value={form.pipe_id} onChange={onChange} required className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Material</label>
              <select name="material" value={form.material} onChange={onChange} className="input w-full">
                {materials.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Diameter (in)</label>
              <input name="diameter_inches" type="number" value={form.diameter_inches} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Length (ft)</label>
              <input name="length_feet" type="number" value={form.length_feet} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Install Year</label>
              <input name="install_year" type="number" value={form.install_year} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zone</label>
              <input name="zone" value={form.zone} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Street Name</label>
              <input name="street_name" value={form.street_name} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <select name="condition_rating" value={form.condition_rating} onChange={onChange} className="input w-full">
                {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pressure Class</label>
              <input name="pressure_class" value={form.pressure_class} onChange={onChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Inspection</label>
              <input name="last_inspection" type="date" value={form.last_inspection} onChange={onChange} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={onChange} rows={3} className="input w-full" />
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
