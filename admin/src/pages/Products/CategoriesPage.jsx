import { useState, useRef } from 'react';
import { Plus, Edit, Trash2, ChevronRight, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const { user } = useAuthStore();
  const canDelete = user?.role === 'super_admin' || user?.role === 'shop_manager';
  const { data, loading, refetch } = useApi('/products/categories');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', parentId: '', imageUrl: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const categories = data?.data || [];

  const openCreate = (parentId = '') => {
    setEditingCategory(null);
    setForm({ name: '', description: '', parentId, imageUrl: '' });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      parentId: cat.parent_id || '',
      imageUrl: cat.image_url || '',
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('files', file);

    try {
      const { data: res } = await api.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = res.data?.[0] || res[0];
      if (uploaded?.url) {
        setForm((prev) => ({ ...prev, imageUrl: uploaded.url }));
      }
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        parentId: form.parentId || null,
        imageUrl: form.imageUrl || null,
      };

      if (editingCategory) {
        await api.put(`/products/categories/${editingCategory.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/products/categories', payload);
        toast.success('Category created');
      }

      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Child categories will be moved to parent.')) return;
    try {
      await api.delete(`/products/categories/${id}`);
      toast.success('Category deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const renderCategory = (cat, depth = 0) => (
    <div key={cat.id}>
      <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded" style={{ paddingLeft: 12 + depth * 24 }}>
        {cat.image_url ? (
          <img src={cat.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ImageIcon size={14} className="text-gray-300" />
          </div>
        )}
        {cat.children?.length > 0 && <ChevronRight size={14} className="text-gray-400" />}
        <span className="flex-1 text-sm font-medium">{cat.name}</span>
        <span className="text-xs text-gray-400">{cat.slug}</span>
        <button onClick={() => openCreate(cat.id)} className="p-1 text-gray-400 hover:text-green-600" title="Add child">
          <Plus size={14} />
        </button>
        <button onClick={() => openEdit(cat)} className="p-1 text-gray-400 hover:text-primary-600">
          <Edit size={14} />
        </button>
        {canDelete && (
          <button onClick={() => handleDelete(cat.id)} className="p-1 text-gray-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {cat.children?.map((child) => renderCategory(child, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button className="btn-primary" onClick={() => openCreate()}>
          <Plus size={16} className="mr-2" /> Add Category
        </button>
      </div>

      <div className="card p-2">
        {loading ? (
          <div className="animate-pulse space-y-3 p-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No categories yet</p>
        ) : (
          <div className="divide-y">
            {categories.map((cat) => renderCategory(cat))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCategory ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Category Image */}
          <div>
            <label className="label">Image</label>
            {form.imageUrl ? (
              <div className="relative inline-block">
                <img src={form.imageUrl} alt="Category" className="w-32 h-24 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editingCategory ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
