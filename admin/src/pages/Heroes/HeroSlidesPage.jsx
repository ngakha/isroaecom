import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical, Eye, EyeOff, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

export default function HeroSlidesPage() {
  const { t } = useTranslation();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroMode, setHeroMode] = useState('carousel');
  const [savingMode, setSavingMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const fileInputRef = useRef(null);

  const emptyForm = {
    title: '', subtitle: '', buttonText: '', buttonUrl: '',
    imageUrl: '', thumbnailUrl: '', mediaId: null, isActive: true,
  };
  const [form, setForm] = useState(emptyForm);

  const loadSlides = () => {
    setLoading(true);
    Promise.all([
      api.get('/heroes/admin'),
      api.get('/heroes/mode'),
    ]).then(([slidesRes, modeRes]) => {
      setSlides(slidesRes.data.data || []);
      setHeroMode(modeRes.data.data?.heroMode || 'carousel');
    }).catch(() => {
      toast.error(t('heroes.loadFailed'));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadSlides(); }, []);

  const handleModeChange = async (mode) => {
    setSavingMode(true);
    try {
      await api.put('/heroes/mode', { heroMode: mode });
      setHeroMode(mode);
      toast.success(t('heroes.modeSet', { mode }));
    } catch {
      toast.error(t('heroes.modeFailed'));
    } finally {
      setSavingMode(false);
    }
  };

  const openAdd = () => {
    setEditingSlide(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (slide) => {
    setEditingSlide(slide);
    setForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      buttonText: slide.button_text || '',
      buttonUrl: slide.button_url || '',
      imageUrl: slide.image_url || '',
      thumbnailUrl: slide.thumbnail_url || '',
      mediaId: slide.media_id || null,
      isActive: slide.is_active,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', files[0]);
      const res = await api.post('/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const media = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      setForm((prev) => ({
        ...prev,
        mediaId: media.id,
        imageUrl: media.url,
        thumbnailUrl: media.thumbnail_url,
      }));
      toast.success(t('heroes.imageUploaded'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('heroes.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title || null,
        subtitle: form.subtitle || null,
        buttonText: form.buttonText || null,
        buttonUrl: form.buttonUrl || null,
        mediaId: form.mediaId || null,
        isActive: form.isActive,
      };
      if (editingSlide) {
        await api.put(`/heroes/${editingSlide.id}`, payload);
        toast.success(t('heroes.slideUpdated'));
      } else {
        await api.post('/heroes', payload);
        toast.success(t('heroes.slideCreated'));
      }
      setShowForm(false);
      loadSlides();
    } catch (err) {
      toast.error(err.response?.data?.error || t('heroes.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('heroes.deleteConfirm'))) return;
    try {
      await api.delete(`/heroes/${id}`);
      toast.success(t('heroes.slideDeleted'));
      loadSlides();
    } catch {
      toast.error(t('heroes.deleteFailed'));
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      await api.put(`/heroes/${slide.id}`, { isActive: !slide.is_active });
      loadSlides();
    } catch {
      toast.error(t('heroes.updateFailed'));
    }
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...slides];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setSlides(reordered);
    setDragIdx(null);
    try {
      await api.put('/heroes/reorder', { slideIds: reordered.map((s) => s.id) });
    } catch {
      toast.error(t('heroes.reorderFailed'));
      loadSlides();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('heroes.title')}</h1>
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('heroes.title')}</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {t('heroes.addSlide')}
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="card p-4">
        <label className="label mb-2">{t('heroes.displayMode')}</label>
        <div className="flex gap-2">
          {['carousel', 'static'].map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              disabled={savingMode}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                heroMode === mode
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-900'
              }`}
            >
              {mode === 'carousel' ? t('heroes.carousel') : t('heroes.static')}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {heroMode === 'carousel'
            ? t('heroes.carouselDesc')
            : t('heroes.staticDesc')}
        </p>
      </div>

      {/* Slides List */}
      {slides.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('heroes.noSlides')}</p>
          <button onClick={openAdd} className="btn-primary mt-4">{t('heroes.addFirst')}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              className={`card p-4 flex items-center gap-4 cursor-move ${
                dragIdx === idx ? 'opacity-50' : ''
              } ${!slide.is_active ? 'opacity-60' : ''}`}
            >
              <GripVertical size={18} className="text-gray-300 flex-shrink-0" />

              {/* Thumbnail */}
              <div className="w-24 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                {slide.thumbnail_url || slide.image_url ? (
                  <img
                    src={slide.thumbnail_url || slide.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{slide.title || t('heroes.untitled')}</p>
                {slide.subtitle && (
                  <p className="text-xs text-gray-400 truncate">{slide.subtitle}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(slide)}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                  title={slide.is_active ? t('heroes.deactivate') : t('heroes.activate')}
                >
                  {slide.is_active ? (
                    <Eye size={16} className="text-green-600" />
                  ) : (
                    <EyeOff size={16} className="text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(slide)}
                  className="px-3 py-1 text-xs font-medium border rounded-md hover:bg-gray-50 transition-colors"
                >
                  {t('heroes.editSlide')}
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingSlide ? t('heroes.editSlide') : t('heroes.addSlideModal')} size="lg">
        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="label">{t('heroes.backgroundImage')}</label>
            {form.imageUrl ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 mt-1">
                <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setForm((p) => ({ ...p, imageUrl: '', thumbnailUrl: '', mediaId: null }))}
                  className="absolute top-2 right-2 bg-white/90 text-gray-600 rounded-full p-1 hover:bg-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-1 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
              >
                {uploading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Upload size={24} />
                    <span className="text-xs mt-1">{t('heroes.clickToUpload')}</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('heroes.slideTitle')}</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={t('heroes.titlePlaceholder')}
              />
            </div>
            <div>
              <label className="label">{t('heroes.subtitle')}</label>
              <input
                className="input"
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder={t('heroes.subtitlePlaceholder')}
              />
            </div>
            <div>
              <label className="label">{t('heroes.buttonText')}</label>
              <input
                className="input"
                value={form.buttonText}
                onChange={(e) => setForm((p) => ({ ...p, buttonText: e.target.value }))}
                placeholder={t('heroes.buttonTextPlaceholder')}
              />
            </div>
            <div>
              <label className="label">{t('heroes.buttonUrl')}</label>
              <input
                className="input"
                value={form.buttonUrl}
                onChange={(e) => setForm((p) => ({ ...p, buttonUrl: e.target.value }))}
                placeholder={t('heroes.buttonUrlPlaceholder')}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">{t('heroes.activate')}</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
