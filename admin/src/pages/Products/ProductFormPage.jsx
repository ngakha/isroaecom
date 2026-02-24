import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Loader2, Plus, Trash2, GripVertical, Pencil } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [pendingMedia, setPendingMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [expandVariants, setExpandVariants] = useState(false);
  // Track which fields were manually edited (don't auto-fill those)
  const [manualEdits, setManualEdits] = useState({ sku: false, metaTitle: false, metaDescription: false });
  const [form, setForm] = useState({
    name: '',
    description: '',
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
    api.get('/products/categories').then((res) => {
      setCategories(flattenCategories(res.data.data || []));
    });

    if (isEdit) {
      setLoading(true);
      api.get(`/products/${id}`).then((res) => {
        const p = res.data.data;
        setForm({
          name: p.name || '',
          description: p.description || '',
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
        setImages(p.images || []);
        setVariants(p.variants || []);
        setAttributes(p.attributes || []);
        // In edit mode, treat all fields as manually set
        setManualEdits({ sku: true, metaTitle: true, metaDescription: true });
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

  const generateSkuFromName = (name) => {
    const prefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
    const suffix = String(Date.now() % 100000).padStart(5, '0');
    return `${prefix}-${suffix}`;
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-fill SKU and SEO when name changes (only in create mode and if not manually edited)
      if (field === 'name' && !isEdit) {
        if (!manualEdits.sku) next.sku = value ? generateSkuFromName(value) : '';
        if (!manualEdits.metaTitle) next.metaTitle = value;
      }

      // Auto-fill meta description from description
      if (field === 'description' && !isEdit && !manualEdits.metaDescription) {
        next.metaDescription = value ? value.substring(0, 160) : '';
      }

      return next;
    });
  };

  const handleManualEdit = (field, value) => {
    setManualEdits((prev) => ({ ...prev, [field]: true }));
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

  // ─── Images ─────────────────────────────────────

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      const mediaRes = await api.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const mediaItems = Array.isArray(mediaRes.data.data)
        ? mediaRes.data.data
        : [mediaRes.data.data];

      if (isEdit) {
        const mediaIds = mediaItems.map((m) => m.id);
        const attachRes = await api.post(`/products/${id}/images`, { mediaIds });
        setImages((prev) => [...prev, ...attachRes.data.data]);
      } else {
        setPendingMedia((prev) => [...prev, ...mediaItems]);
      }
      toast.success(`${mediaItems.length} photo(s) uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageRemove = async (imageId) => {
    if (isEdit) {
      try {
        await api.delete(`/products/${id}/images/${imageId}`);
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      } catch {
        toast.error('Failed to remove image');
      }
    } else {
      setPendingMedia((prev) => prev.filter((m) => m.id !== imageId));
    }
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const currentImages = isEdit ? [...images] : [...pendingMedia];
    const [moved] = currentImages.splice(dragIdx, 1);
    currentImages.splice(targetIdx, 0, moved);

    if (isEdit) {
      setImages(currentImages);
      try {
        await api.put(`/products/${id}/images/reorder`, {
          imageIds: currentImages.map((img) => img.id),
        });
      } catch {
        toast.error('Failed to reorder images');
      }
    } else {
      setPendingMedia(currentImages);
    }
    setDragIdx(null);
  };

  // ─── Variants ───────────────────────────────────

  const [variantForm, setVariantForm] = useState({ name: '', sku: '', price: '', salePrice: '', stockQuantity: '0', url: '' });
  const [editingVariant, setEditingVariant] = useState(null);
  const [showVariantForm, setShowVariantForm] = useState(false);

  const handleSaveVariant = async () => {
    if (!variantForm.name || !variantForm.price) {
      toast.error('Variant name and price are required');
      return;
    }

    const payload = {
      name: variantForm.name,
      sku: variantForm.sku || undefined,
      price: parseFloat(variantForm.price),
      salePrice: variantForm.salePrice ? parseFloat(variantForm.salePrice) : undefined,
      stockQuantity: parseInt(variantForm.stockQuantity) || 0,
      url: variantForm.url || undefined,
    };

    if (isEdit) {
      try {
        if (editingVariant) {
          const res = await api.put(`/products/${id}/variants/${editingVariant}`, payload);
          setVariants((prev) => prev.map((v) => v.id === editingVariant ? res.data.data : v));
          toast.success('Variant updated');
        } else {
          const res = await api.post(`/products/${id}/variants`, payload);
          setVariants((prev) => [...prev, res.data.data]);
          toast.success('Variant added');
        }
      } catch (err) {
        const details = err.response?.data?.details;
        const msg = details?.length
          ? details.map((d) => `${d.field}: ${d.message}`).join(', ')
          : err.response?.data?.error || 'Failed to save variant';
        toast.error(msg);
        return;
      }
    } else {
      // Create mode: store locally
      if (editingVariant) {
        setVariants((prev) => prev.map((v) => v._tempId === editingVariant ? { ...v, ...payload, sale_price: payload.salePrice, stock_quantity: payload.stockQuantity, url: payload.url } : v));
        toast.success('Variant updated');
      } else {
        setVariants((prev) => [...prev, { ...payload, sale_price: payload.salePrice, stock_quantity: payload.stockQuantity, url: payload.url, _tempId: Date.now() }]);
        toast.success('Variant added');
      }
    }
    setVariantForm({ name: '', sku: '', price: '', salePrice: '', stockQuantity: '0', url: '' });
    setEditingVariant(null);
    setShowVariantForm(false);
  };

  const handleEditVariant = (variant) => {
    setVariantForm({
      name: variant.name,
      sku: variant.sku || '',
      price: String(variant.price),
      salePrice: String(variant.sale_price || ''),
      stockQuantity: String(variant.stock_quantity || '0'),
      url: variant.url || '',
    });
    setEditingVariant(variant.id || variant._tempId);
    setShowVariantForm(true);
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('Delete this variant?')) return;
    if (isEdit) {
      try {
        await api.delete(`/products/${id}/variants/${variantId}`);
        setVariants((prev) => prev.filter((v) => v.id !== variantId));
        toast.success('Variant deleted');
      } catch {
        toast.error('Failed to delete variant');
      }
    } else {
      setVariants((prev) => prev.filter((v) => v._tempId !== variantId));
      toast.success('Variant removed');
    }
  };

  // ─── Attributes ─────────────────────────────────

  const [attrForm, setAttrForm] = useState({ key: '', value: '' });
  const [editingAttr, setEditingAttr] = useState(null);
  const [showAttrForm, setShowAttrForm] = useState(false);

  const handleSaveAttribute = async () => {
    if (!attrForm.key || !attrForm.value) {
      toast.error('Attribute key and value are required');
      return;
    }

    if (isEdit) {
      try {
        if (editingAttr) {
          const res = await api.put(`/products/${id}/attributes/${editingAttr}`, attrForm);
          setAttributes((prev) => prev.map((a) => a.id === editingAttr ? res.data.data : a));
          toast.success('Attribute updated');
        } else {
          const res = await api.post(`/products/${id}/attributes`, attrForm);
          setAttributes((prev) => [...prev, res.data.data]);
          toast.success('Attribute added');
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to save attribute');
        return;
      }
    } else {
      // Create mode: store locally
      if (editingAttr) {
        setAttributes((prev) => prev.map((a) => a._tempId === editingAttr ? { ...a, ...attrForm } : a));
        toast.success('Attribute updated');
      } else {
        setAttributes((prev) => [...prev, { ...attrForm, _tempId: Date.now() }]);
        toast.success('Attribute added');
      }
    }
    setAttrForm({ key: '', value: '' });
    setEditingAttr(null);
    setShowAttrForm(false);
  };

  const handleEditAttribute = (attr) => {
    setAttrForm({ key: attr.key, value: attr.value });
    setEditingAttr(attr.id || attr._tempId);
    setShowAttrForm(true);
  };

  const handleDeleteAttribute = async (attrId) => {
    if (!confirm('Delete this attribute?')) return;
    if (isEdit) {
      try {
        await api.delete(`/products/${id}/attributes/${attrId}`);
        setAttributes((prev) => prev.filter((a) => a.id !== attrId));
        toast.success('Attribute deleted');
      } catch {
        toast.error('Failed to delete attribute');
      }
    } else {
      setAttributes((prev) => prev.filter((a) => a._tempId !== attrId));
      toast.success('Attribute removed');
    }
  };

  // ─── Submit ─────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!isEdit && expandVariants && variants.length > 0) {
        // ─── Expanded: create separate product per variant ───
        const expandedPayload = {
          name: form.name,
          description: form.description || undefined,
          costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
          taxRate: parseFloat(form.taxRate),
          lowStockThreshold: parseInt(form.lowStockThreshold),
          trackInventory: form.trackInventory,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          status: form.status,
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
          categoryIds: form.categoryIds.length ? form.categoryIds : undefined,
          mediaIds: pendingMedia.length ? pendingMedia.map((m) => m.id) : undefined,
          attributes: attributes.length
            ? attributes.map((a) => ({ key: a.key, value: a.value }))
            : undefined,
          variants: variants.map((v) => ({
            name: v.name,
            sku: v.sku || undefined,
            price: parseFloat(v.price),
            salePrice: v.sale_price ? parseFloat(v.sale_price) : undefined,
            stockQuantity: parseInt(v.stock_quantity) || 0,
          })),
        };
        await api.post('/products/create-expanded', expandedPayload);
        toast.success(`${variants.length} products created from variants`);
      } else {
        // ─── Normal create/update ───
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
          const res = await api.post('/products', payload);
          const newProductId = res.data.data.id;
          if (pendingMedia.length > 0) {
            const mediaIds = pendingMedia.map((m) => m.id);
            await api.post(`/products/${newProductId}/images`, { mediaIds });
          }
          for (const v of variants) {
            await api.post(`/products/${newProductId}/variants`, {
              name: v.name,
              sku: v.sku || undefined,
              price: parseFloat(v.price),
              salePrice: v.sale_price ? parseFloat(v.sale_price) : undefined,
              stockQuantity: parseInt(v.stock_quantity) || 0,
              url: v.url || undefined,
            });
          }
          for (const a of attributes) {
            await api.post(`/products/${newProductId}/attributes`, {
              key: a.key,
              value: a.value,
            });
          }
          toast.success('Product created');
        }
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

  const currentImages = isEdit ? images : pendingMedia;

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
            </div>

            {/* Product Images */}
            <div className="card space-y-4">
              <h3 className="font-semibold">Product Images</h3>
              {currentImages.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {currentImages.map((img, idx) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx)}
                      className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing ${
                        dragIdx === idx ? 'border-primary-400 opacity-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="absolute top-1 left-1 p-1 bg-black/40 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={14} />
                      </div>
                      <img src={img.thumbnail_url || img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(img.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary-600 text-white text-[10px] rounded">Main</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary flex items-center gap-2"
                >
                  {uploading ? (
                    <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload size={16} /> Add Images</>
                  )}
                </button>
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
                  <label className="label">SKU {!isEdit && !manualEdits.sku && form.sku && <span className="text-xs text-gray-400 font-normal">(auto)</span>}</label>
                  <input className="input" value={form.sku} onChange={(e) => handleManualEdit('sku', e.target.value)} placeholder="Auto-generated from name" />
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

            {/* Variants */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Variants</h3>
                <button
                  type="button"
                  onClick={() => { setShowVariantForm(true); setEditingVariant(null); setVariantForm({ name: '', sku: '', price: '', salePrice: '', stockQuantity: '0', url: '' }); }}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>

              {!isEdit && variants.length > 0 && (
                <label className="flex items-center gap-3 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <input
                    type="checkbox"
                    checked={expandVariants}
                    onChange={(e) => setExpandVariants(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-amber-900">Create separate product for each variant</span>
                    <p className="text-xs text-amber-600 mt-0.5">Each variant becomes its own product page with cross-links.</p>
                  </div>
                </label>
              )}

              {variants.length > 0 && (
                <div className="divide-y">
                  {variants.map((v) => (
                    <div key={v.id || v._tempId} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">{v.name}</p>
                          <p className="text-xs text-gray-500">
                            {v.sku && `SKU: ${v.sku} · `}
                            Price: {v.price}
                            {v.sale_price ? ` (Sale: ${v.sale_price})` : ''}
                            {' · '}Stock: {v.stock_quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => handleEditVariant(v)} className="p-1.5 text-gray-400 hover:text-primary-600">
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => handleDeleteVariant(v.id || v._tempId)} className="p-1.5 text-gray-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showVariantForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Name *</label>
                      <input className="input" placeholder="e.g. Red / XL" value={variantForm.name} onChange={(e) => setVariantForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">SKU</label>
                      <input className="input" value={variantForm.sku} onChange={(e) => setVariantForm((p) => ({ ...p, sku: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Price *</label>
                      <input type="number" step="0.01" className="input" value={variantForm.price} onChange={(e) => setVariantForm((p) => ({ ...p, price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Sale Price</label>
                      <input type="number" step="0.01" className="input" value={variantForm.salePrice} onChange={(e) => setVariantForm((p) => ({ ...p, salePrice: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Stock</label>
                      <input type="number" className="input" value={variantForm.stockQuantity} onChange={(e) => setVariantForm((p) => ({ ...p, stockQuantity: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSaveVariant} className="btn-primary text-xs">
                      {editingVariant ? 'Update' : 'Add'}
                    </button>
                    <button type="button" onClick={() => { setShowVariantForm(false); setEditingVariant(null); }} className="btn-secondary text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {variants.length === 0 && !showVariantForm && (
                <p className="text-sm text-gray-500">No variants. Add variants for different sizes, colors, etc.</p>
              )}
            </div>

            {/* Attributes */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Attributes</h3>
                <button
                  type="button"
                  onClick={() => { setShowAttrForm(true); setEditingAttr(null); setAttrForm({ key: '', value: '' }); }}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  <Plus size={14} /> Add Attribute
                </button>
              </div>

              {attributes.length > 0 && (
                <div className="divide-y">
                  {attributes.map((a) => (
                    <div key={a.id || a._tempId} className="flex items-center justify-between py-3">
                      <div>
                        <span className="text-sm font-medium">{a.key}:</span>
                        <span className="text-sm text-gray-600 ml-2">{a.value}</span>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => handleEditAttribute(a)} className="p-1.5 text-gray-400 hover:text-primary-600">
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => handleDeleteAttribute(a.id || a._tempId)} className="p-1.5 text-gray-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAttrForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Key *</label>
                      <input className="input" placeholder="e.g. Material" value={attrForm.key} onChange={(e) => setAttrForm((p) => ({ ...p, key: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Value *</label>
                      <input className="input" placeholder="e.g. Cotton" value={attrForm.value} onChange={(e) => setAttrForm((p) => ({ ...p, value: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSaveAttribute} className="btn-primary text-xs">
                      {editingAttr ? 'Update' : 'Add'}
                    </button>
                    <button type="button" onClick={() => { setShowAttrForm(false); setEditingAttr(null); }} className="btn-secondary text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {attributes.length === 0 && !showAttrForm && (
                <p className="text-sm text-gray-500">No attributes. Add custom attributes like Material, Color, etc.</p>
              )}
            </div>

            {/* SEO */}
            <div className="card space-y-4">
              <h3 className="font-semibold">SEO</h3>
              <div>
                <label className="label">Meta Title {!isEdit && !manualEdits.metaTitle && form.metaTitle && <span className="text-xs text-gray-400 font-normal">(auto)</span>}</label>
                <input className="input" value={form.metaTitle} onChange={(e) => handleManualEdit('metaTitle', e.target.value)} placeholder="Auto-generated from product name" />
                {form.metaTitle && <p className="text-xs text-gray-400 mt-1">{form.metaTitle.length}/60 characters</p>}
              </div>
              <div>
                <label className="label">Meta Description {!isEdit && !manualEdits.metaDescription && form.metaDescription && <span className="text-xs text-gray-400 font-normal">(auto)</span>}</label>
                <textarea className="input h-20" value={form.metaDescription} onChange={(e) => handleManualEdit('metaDescription', e.target.value)} placeholder="Auto-generated from description" />
                {form.metaDescription && <p className="text-xs text-gray-400 mt-1">{form.metaDescription.length}/160 characters</p>}
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
            {saving ? 'Saving...' : expandVariants && variants.length > 0 && !isEdit ? `Create ${variants.length} Products` : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
