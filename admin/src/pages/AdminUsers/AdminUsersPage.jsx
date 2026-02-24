import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit, Shield } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const { user: currentUser } = useAuthStore();

  const ROLES = [
    { value: 'super_admin', label: t('adminUsers.superAdmin') },
    { value: 'shop_manager', label: t('adminUsers.shopManager') },
    { value: 'content_editor', label: t('adminUsers.contentEditor') },
  ];

  const [createForm, setCreateForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'content_editor' });
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: '', isActive: true });

  const loadAdmins = () => {
    setLoading(true);
    api.get('/auth/admin/users').then((res) => {
      setAdmins(res.data.data || []);
    }).catch(() => {
      toast.error(t('adminUsers.loadFailed'));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName) {
      toast.error(t('adminUsers.fieldsRequired'));
      return;
    }
    try {
      await api.post('/auth/admin/register', createForm);
      toast.success(t('adminUsers.created'));
      setCreateForm({ email: '', password: '', firstName: '', lastName: '', role: 'content_editor' });
      setShowCreateForm(false);
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || t('adminUsers.createFailed'));
    }
  };

  const handleEdit = (admin) => {
    setEditForm({
      firstName: admin.first_name,
      lastName: admin.last_name,
      role: admin.role,
      isActive: admin.is_active,
    });
    setEditModal(admin);
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/auth/admin/users/${editModal.id}`, editForm);
      toast.success(t('adminUsers.updated'));
      setEditModal(null);
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || t('adminUsers.updateFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      toast.error(t('adminUsers.cantDeleteSelf'));
      return;
    }
    if (!confirm(t('adminUsers.deleteConfirm'))) return;
    try {
      await api.delete(`/auth/admin/users/${id}`);
      toast.success(t('adminUsers.deleted'));
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || t('adminUsers.deleteFailed'));
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-700',
      shop_manager: 'bg-blue-100 text-blue-700',
      content_editor: 'bg-green-100 text-green-700',
    };
    const roleLabel = ROLES.find((r) => r.value === role)?.label || role.replace('_', ' ');
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
      {roleLabel}
    </span>;
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="card h-64" /></div>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('adminUsers.title')}</h1>
        <button onClick={() => setShowCreateForm(true)} className="btn-primary">
          <Plus size={16} className="mr-2" /> {t('adminUsers.addAdmin')}
        </button>
      </div>

      <div className="space-y-3">
        {admins.map((admin) => (
          <div key={admin.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold">
                {admin.first_name?.[0]}{admin.last_name?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{admin.first_name} {admin.last_name}</p>
                  {getRoleBadge(admin.role)}
                  {!admin.is_active && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">{t('adminUsers.inactive')}</span>}
                </div>
                <p className="text-sm text-gray-500">{admin.email}</p>
              </div>
            </div>
            {admin.id !== currentUser?.id && (
              <div className="flex gap-2">
                <button onClick={() => handleEdit(admin)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(admin.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title={t('adminUsers.newAdmin')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('adminUsers.firstNameLabel')} *</label>
              <input className="input" value={createForm.firstName} onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('adminUsers.lastNameLabel')} *</label>
              <input className="input" value={createForm.lastName} onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">{t('adminUsers.emailLabel')} *</label>
            <input type="email" className="input" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('adminUsers.passwordLabel')} *</label>
            <input type="password" className="input" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t('adminUsers.roleLabel')}</label>
            <select className="input" value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}>
              {ROLES.filter(r => r.value !== 'super_admin').map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} className="btn-primary">{t('common.save')}</button>
            <button onClick={() => setShowCreateForm(false)} className="btn-secondary">{t('common.cancel')}</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title={t('adminUsers.editAdmin')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('adminUsers.firstNameLabel')}</label>
              <input className="input" value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('adminUsers.lastNameLabel')}</label>
              <input className="input" value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">{t('adminUsers.roleLabel')}</label>
            <select className="input" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
            <span className="text-sm">{t('adminUsers.active')}</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={handleUpdate} className="btn-primary">{t('common.save')}</button>
            <button onClick={() => setEditModal(null)} className="btn-secondary">{t('common.cancel')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
