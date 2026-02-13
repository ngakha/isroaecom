import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { usePaginatedApi } from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DiscountsPage() {
  const { data: discounts, pagination, loading, refetch, setPage } = usePaginatedApi('/discounts');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', code: '', type: 'percentage', value: '',
    minimumOrderAmount: '0', maximumDiscountAmount: '', usageLimit: '',
    isActive: true, startsAt: '', endsAt: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '', code: '', type: 'percentage', value: '',
      minimumOrderAmount: '0', maximumDiscountAmount: '', usageLimit: '',
      isActive: true, startsAt: new Date().toISOString().slice(0, 16), endsAt: '',
    });
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name, code: d.code || '', type: d.type, value: String(d.value),
      minimumOrderAmount: String(d.minimum_order_amount || 0),
      maximumDiscountAmount: String(d.maximum_discount_amount || ''),
      usageLimit: String(d.usage_limit || ''),
      isActive: d.is_active,
      startsAt: d.starts_at ? new Date(d.starts_at).toISOString().slice(0, 16) : '',
      endsAt: d.ends_at ? new Date(d.ends_at).toISOString().slice(0, 16) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        value: parseFloat(form.value),
        minimumOrderAmount: parseFloat(form.minimumOrderAmount) || 0,
        maximumDiscountAmount: form.maximumDiscountAmount ? parseFloat(form.maximumDiscountAmount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        startsAt: form.startsAt || new Date().toISOString(),
        endsAt: form.endsAt || null,
      };

      if (editing) {
        await api.put(`/discounts/${editing.id}`, payload);
        toast.success('Discount updated');
      } else {
        await api.post('/discounts', payload);
        toast.success('Discount created');
      }

      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this discount?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      toast.success('Discount deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'code', label: 'Code', render: (row) => row.code ? <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{row.code}</code> : '-' },
    {
      key: 'value',
      label: 'Value',
      render: (row) => row.type === 'percentage' ? `${row.value}%` : row.type === 'fixed' ? `${row.value} GEL` : 'Free Ship',
    },
    { key: 'usage', label: 'Usage', render: (row) => `${row.usage_count}${row.usage_limit ? ` / ${row.usage_limit}` : ''}` },
    { key: 'is_active', label: 'Status', render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-primary-600"><Edit size={16} /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discounts</h1>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} className="mr-2" /> Add Discount</button>
      </div>

      <DataTable columns={columns} data={discounts} pagination={pagination} onPageChange={setPage} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Discount' : 'New Discount'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Coupon Code</label><input className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SAVE20" /></div>
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div><label className="label">Value *</label><input type="number" step="0.01" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
            <div><label className="label">Min Order Amount</label><input type="number" step="0.01" className="input" value={form.minimumOrderAmount} onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })} /></div>
            <div><label className="label">Usage Limit</label><input type="number" className="input" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" /></div>
            <div><label className="label">Starts At</label><input type="datetime-local" className="input" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
            <div><label className="label">Ends At</label><input type="datetime-local" className="input" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            <span className="text-sm">Active</span>
          </label>
          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
