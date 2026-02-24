import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { usePaginatedApi } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MediaPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const canDelete = user?.role === 'super_admin' || user?.role === 'shop_manager';
  const { data: files, loading, refetch } = usePaginatedApi('/media');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setUploading(true);
    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('files', file);
    }

    try {
      await api.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(t('media.filesUploaded'));
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || t('media.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('media.confirmDelete'))) return;
    try {
      await api.delete(`/media/${id}`);
      toast.success(t('media.fileDeleted'));
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || t('media.deleteFailed'));
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('media.title')}</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={16} className="mr-2" />
            {uploading ? t('common.uploading') : t('common.uploadFiles')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="card text-center py-16">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{t('media.noFiles')}</p>
          <button className="btn-primary mt-4" onClick={() => fileInputRef.current?.click()}>
            {t('media.uploadFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div key={file.id} className="group relative bg-white rounded-lg border overflow-hidden">
              {file.mime_type?.startsWith('image/') ? (
                <img
                  src={file.thumbnail_url || file.url}
                  alt={file.original_name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center">
                  <span className="text-xs text-gray-400 uppercase">{file.mime_type?.split('/')[1]}</span>
                </div>
              )}

              {/* Overlay */}
              {canDelete && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Info */}
              <div className="p-2">
                <p className="text-xs truncate">{file.original_name}</p>
                <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
