import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save, X, Pencil } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

export default function ShippingZonesPage() {
  const { t } = useTranslation();
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
    if (!form.name) { toast.error(t('shipping.nameRequired')); return; }

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
        toast.success(t('shipping.updated'));
      } else {
        await api.post('/shipping/zones', payload);
        toast.success(t('shipping.created'));
      }
      resetForm();
      loadZones();
    } catch (err) {
      toast.error(err.response?.data?.error || t('shipping.saveFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('shipping.deleteConfirm'))) return;
    try {
      await api.delete(`/shipping/zones/${id}`);
      toast.success(t('shipping.deleted'));
      loadZones();
    } catch (err) {
      toast.error(err.response?.data?.error || t('shipping.deleteFailed'));
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="card h-64" /></div>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('shipping.title')}</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus size={16} className="mr-2" /> {t('shipping.addZone')}
        </button>
      </div>

      {zones.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>{t('shipping.noZones')}</p>
          <p className="text-sm mt-1">{t('shipping.noZonesHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{zone.name}</p>
                  {!zone.is_active && <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">{t('common.inactive')}</span>}
                </div>
                <div className="text-sm text-gray-500 mt-1 flex gap-4">
                  <span>{t('shipping.country')}: {zone.country === '*' ? t('shipping.allCountries') : zone.country}</span>
                  <span>{t('shipping.rate', { amount: zone.flat_rate })}</span>
                  {zone.free_shipping_threshold && <span>{t('shipping.freeOver', { amount: zone.free_shipping_threshold })}</span>}
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

      <Modal isOpen={showForm} onClose={resetForm} title={editingZone ? t('shipping.editZone') : t('shipping.newZone')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('shipping.zoneName')} *</label>
            <input className="input" placeholder="e.g. Tbilisi" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('shipping.country')}</label>
            <input className="input" placeholder={t('shipping.countryPlaceholder')} value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('shipping.flatRate')}</label>
              <input type="number" step="0.01" className="input" value={form.flatRate} onChange={(e) => setForm((p) => ({ ...p, flatRate: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('shipping.freeShippingOver')}</label>
              <input type="number" step="0.01" className="input" value={form.freeShippingThreshold} onChange={(e) => setForm((p) => ({ ...p, freeShippingThreshold: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
            <span className="text-sm">{t('common.active')}</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="btn-primary">{t('common.save')}</button>
            <button onClick={resetForm} className="btn-secondary">{t('common.cancel')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
