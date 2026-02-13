import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  useEffect(() => {
    api.get('/settings').then((res) => {
      setSettings(res.data.data || {});
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Flatten settings for the API
      const flat = {};
      for (const group of Object.values(settings)) {
        for (const [key, value] of Object.entries(group)) {
          flat[key] = value;
        }
      }
      await api.put('/settings', flat);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
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

  const tabs = [
    { key: 'store', label: 'Store' },
    { key: 'tax', label: 'Tax' },
    { key: 'orders', label: 'Orders' },
    { key: 'checkout', label: 'Checkout' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="card h-96" /></div>;
  }

  const currentGroup = settings[activeTab] || {};

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
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

      {/* Settings Form */}
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
                <span className="text-sm">{value ? 'Enabled' : 'Disabled'}</span>
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
          <p className="text-gray-500 text-sm py-4">No settings in this group yet. Run database seeds first.</p>
        )}
      </div>
    </div>
  );
}
