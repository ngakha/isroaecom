import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: '',
    salePrice: '',
    costPrice: '',
    taxRate: '0',
    stockQuantity: '0',
    lowStockThreshold: '5',
    trackInventory: true,
    weight: '',
    status: 'draft',
    metaTitle: '',
    metaDescription: '',
    categoryIds: [],
  });

  useEffect(() => {
    // Load categories
    api.get('/products/categories').then((res) => {
      setCategories(flattenCategories(res.data.data || []));
    });

    // Load product if editing
    if (isEdit) {
      setLoading(true);
      api.get(`/products/${id}`).then((res) => {
        const p = res.data.data;
        setForm({
          name: p.name || '',
          description: p.description || '',
          shortDescription: p.short_description || '',
          sku: p.sku || '',
          price: String(p.price || ''),
          salePrice: String(p.sale_price || ''),
          costPrice: String(p.cost_price || ''),
          taxRate: String(p.tax_rate || '0'),
          stockQuantity: String(p.stock_quantity || '0'),
          lowStockThreshold: String(p.low_stock_threshold || '5'),
          trackInventory: p.track_inventory !== false,
          weight: String(p.weight || ''),
          status: p.status || 'draft',
          metaTitle: p.meta_title || '',
          metaDescription: p.meta_description || '',
          categoryIds: p.categories?.map((c) => c.id) || [],
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  function flattenCategories(tree, depth = 0) {
    let flat = [];
    for (const cat of tree) {
      flat.push({ ...cat, depth });
      if (cat.children?.length) {
        flat = flat.concat(flattenCategories(cat.children, depth + 1));
      }
    }
    return flat;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (categoryId) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        taxRate: parseFloat(form.taxRate),
        stockQuantity: parseInt(form.stockQuantity),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        weight: form.weight ? parseFloat(form.weight) : undefined,
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }

      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="card h-96" /></div>;
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')} className="p-2 text-gray-400 hover:text-gray-600 rounded">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card space-y-4">
              <div>
                <label className="label">Product Name *</label>
                <input className="input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input h-32" value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
              </div>
              <div>
                <label className="label">Short Description</label>
                <input className="input" value={form.shortDescription} onChange={(e) => handleChange('shortDescription', e.target.value)} />
              </div>
            </div>

            {/* Pricing */}
            <div className="card space-y-4">
              <h3 className="font-semibold">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price *</label>
                  <input type="number" step="0.01" className="input" value={form.price} onChange={(e) => handleChange('price', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Sale Price</label>
                  <input type="number" step="0.01" className="input" value={form.salePrice} onChange={(e) => handleChange('salePrice', e.target.value)} />
                </div>
                <div>
                  <label className="label">Cost Price</label>
                  <input type="number" step="0.01" className="input" value={form.costPrice} onChange={(e) => handleChange('costPrice', e.target.value)} />
                </div>
                <div>
                  <label className="label">Tax Rate (%)</label>
                  <input type="number" step="0.01" className="input" value={form.taxRate} onChange={(e) => handleChange('taxRate', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="card space-y-4">
              <h3 className="font-semibold">Inventory</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">SKU</label>
                  <input className="input" value={form.sku} onChange={(e) => handleChange('sku', e.target.value)} />
                </div>
                <div>
                  <label className="label">Stock Quantity</label>
                  <input type="number" className="input" value={form.stockQuantity} onChange={(e) => handleChange('stockQuantity', e.target.value)} />
                </div>
                <div>
                  <label className="label">Low Stock Alert</label>
                  <input type="number" className="input" value={form.lowStockThreshold} onChange={(e) => handleChange('lowStockThreshold', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input type="number" step="0.01" className="input w-48" value={form.weight} onChange={(e) => handleChange('weight', e.target.value)} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.trackInventory} onChange={(e) => handleChange('trackInventory', e.target.checked)} className="rounded" />
                <span className="text-sm">Track inventory</span>
              </label>
            </div>

            {/* SEO */}
            <div className="card space-y-4">
              <h3 className="font-semibold">SEO</h3>
              <div>
                <label className="label">Meta Title</label>
                <input className="input" value={form.metaTitle} onChange={(e) => handleChange('metaTitle', e.target.value)} />
              </div>
              <div>
                <label className="label">Meta Description</label>
                <textarea className="input h-20" value={form.metaDescription} onChange={(e) => handleChange('metaDescription', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card space-y-4">
              <h3 className="font-semibold">Status</h3>
              <select className="input" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="card space-y-3">
              <h3 className="font-semibold">Categories</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500">No categories</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer" style={{ paddingLeft: cat.depth * 16 }}>
                      <input
                        type="checkbox"
                        checked={form.categoryIds.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
