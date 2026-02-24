import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Lock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Change password
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      setSettings(res.data.data || {});
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const flat = {};
      for (const group of Object.values(settings)) {
        for (const [key, value] of Object.entries(group)) {
          flat[key] = value;
        }
      }
      await api.put('/settings', flat);
      toast.success(t('settings.saved'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (group, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }));
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error(t('settings.fillPasswords'));
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error(t('settings.passwordMinLength'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.passwordsMismatch'));
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(t('settings.passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.passwordFailed'));
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs = [
    { key: 'store', label: t('settings.store') },
    { key: 'tax', label: t('settings.tax') },
    { key: 'orders', label: t('settings.ordersTab') },
    { key: 'checkout', label: t('settings.checkout') },
    { key: 'security', label: t('settings.security') },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="card h-96" /></div>;
  }

  const currentGroup = settings[activeTab] || {};

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        {activeTab !== 'security' && (
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? t('common.saving') : t('settings.saveChanges')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white font-medium shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Security Tab — Change Password */}
      {activeTab === 'security' ? (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={18} />
            <h3 className="font-semibold">{t('settings.changePassword')}</h3>
          </div>
          <div className="max-w-md space-y-4">
            <div>
              <label className="label">{t('settings.currentPassword')}</label>
              <input
                type="password"
                className="input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t('settings.newPassword')}</label>
              <input
                type="password"
                className="input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">{t('settings.minChars')}</p>
            </div>
            <div>
              <label className="label">{t('settings.confirmPassword')}</label>
              <input
                type="password"
                className="input"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            </div>
            <button onClick={handleChangePassword} disabled={changingPassword} className="btn-primary">
              {changingPassword ? t('common.saving') : t('settings.changePassword')}
            </button>
          </div>
        </div>
      ) : (
        /* Settings Form */
        <div className="card space-y-4">
          {Object.entries(currentGroup).map(([key, value]) => (
            <div key={key}>
              <label className="label">{key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
              {typeof value === 'boolean' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSetting(activeTab, key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">{value ? t('common.enabled') : t('common.disabled')}</span>
                </label>
              ) : typeof value === 'number' ? (
                <input
                  type="number"
                  className="input w-48"
                  value={value}
                  onChange={(e) => updateSetting(activeTab, key, parseFloat(e.target.value) || 0)}
                />
              ) : (
                <input
                  type="text"
                  className="input"
                  value={value}
                  onChange={(e) => updateSetting(activeTab, key, e.target.value)}
                />
              )}
            </div>
          ))}

          {Object.keys(currentGroup).length === 0 && (
            <p className="text-gray-500 text-sm py-4">{t('settings.noSettings')}</p>
          )}
        </div>
      )}
    </div>
  );
}
