import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Pencil } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

export default function ShippingZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [form, setForm] = useState({ name: '', country: '*', flatRate: '', freeShippingThreshold: '', isActive: true });

  const loadZones = () => {
    setLoading(true);
    api.get('/shipping/zones').then((res) => {
      setZones(res.data.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadZones(); }, []);

  const resetForm = () => {
    setForm({ name: '', country: '*', flatRate: '', freeShippingThreshold: '', isActive: true });
    setEditingZone(null);
    setShowForm(false);
  };

  const handleEdit = (zone) => {
    setForm({
      name: zone.name,
      country: zone.country || '*',
      flatRate: String(zone.flat_rate || ''),
      freeShippingThreshold: String(zone.free_shipping_threshold || ''),
      isActive: zone.is_active !== false,
    });
    setEditingZone(zone.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Zone name is required'); return; }

    const payload = {
      name: form.name,
      country: form.country || '*',
      flatRate: form.flatRate ? parseFloat(form.flatRate) : 0,
      freeShippingThreshold: form.freeShippingThreshold ? parseFloat(form.freeShippingThreshold) : null,
      isActive: form.isActive,
    };

    try {
      if (editingZone) {
        await api.put(`/shipping/zones/${editingZone}`, payload);
        toast.success('Shipping zone updated');
      } else {
        await api.post('/shipping/zones', payload);
        toast.success('Shipping zone created');
      }
      resetForm();
      loadZones();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this shipping zone?')) return;
    try {
      await api.delete(`/shipping/zones/${id}`);
      toast.success('Shipping zone deleted');
      loadZones();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="card h-64" /></div>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shipping Zones</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus size={16} className="mr-2" /> Add Zone
        </button>
      </div>

      {zones.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>No shipping zones configured.</p>
          <p className="text-sm mt-1">Add zones to set delivery rates by region.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{zone.name}</p>
                  {!zone.is_active && <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">Inactive</span>}
                </div>
                <div className="text-sm text-gray-500 mt-1 flex gap-4">
                  <span>Country: {zone.country === '*' ? 'All' : zone.country}</span>
                  <span>Rate: {zone.flat_rate} GEL</span>
                  {zone.free_shipping_threshold && <span>Free over: {zone.free_shipping_threshold} GEL</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(zone)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(zone.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={resetForm} title={editingZone ? 'Edit Shipping Zone' : 'New Shipping Zone'}>
        <div className="space-y-4">
          <div>
            <label className="label">Zone Name *</label>
            <input className="input" placeholder="e.g. Tbilisi" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" placeholder="* for all countries" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Flat Rate (GEL)</label>
              <input type="number" step="0.01" className="input" value={form.flatRate} onChange={(e) => setForm((p) => ({ ...p, flatRate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Free Shipping Over (GEL)</label>
              <input type="number" step="0.01" className="input" value={form.freeShippingThreshold} onChange={(e) => setForm((p) => ({ ...p, freeShippingThreshold: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
            <span className="text-sm">Active</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="btn-primary">{editingZone ? 'Update' : 'Create'}</button>
            <button onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
