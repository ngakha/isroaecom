import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';
import api from '../../services/api';

export default function PaymentConfigPage() {
  const { t } = useTranslation();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/methods').then((res) => {
      setMethods(res.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const allProviders = [
    { name: 'bog', label: 'Bank of Georgia (BOG)', description: 'Georgian bank payment integration' },
    { name: 'tbc', label: 'TBC Bank', description: 'TBC Bank payment integration' },
    { name: 'stripe', label: 'Stripe', description: 'International payments via Stripe' },
    { name: 'cash_on_delivery', label: 'Cash on Delivery', description: 'Payment upon delivery (no online payment required)' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="card h-64" /></div>;
  }

  const enabledNames = methods.map((m) => m.name);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <CreditCard size={24} />
        <h1 className="text-2xl font-bold">{t('payments.title')}</h1>
      </div>

      <p className="text-sm text-gray-500">
        {t('payments.configuredIn', { configFile: 'server/config/plugins.js', envFile: '.env' })}{' '}
        {t('payments.configInstructions')}
      </p>

      <div className="space-y-3">
        {allProviders.map((provider) => {
          const isEnabled = enabledNames.includes(provider.name);
          return (
            <div key={provider.name} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                  isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {provider.name.toUpperCase().slice(0, 3)}
                </div>
                <div>
                  <p className="font-medium">{provider.label}</p>
                  <p className="text-sm text-gray-500">{provider.description}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {isEnabled ? t('common.enabled') : t('common.disabled')}
              </span>
            </div>
          );
        })}
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">{t('payments.configGuide')}</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>{t('payments.toEnable')}</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>{t('payments.setIn', { value: 'enabled: true', file: 'server/config/plugins.js' })}</li>
            <li>{t('payments.addKeysTo', { file: '.env' })}</li>
            <li>{t('payments.restartServer')}</li>
          </ol>
          <p className="mt-2">{t('payments.requiredVars')}</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>BOG:</strong> BOG_CLIENT_ID, BOG_CLIENT_SECRET, BOG_CALLBACK_URL</li>
            <li><strong>TBC:</strong> TBC_CLIENT_ID, TBC_CLIENT_SECRET, TBC_CALLBACK_URL</li>
            <li><strong>Stripe:</strong> STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET</li>
            <li><strong>Cash on Delivery:</strong> No API keys needed — just enable in config</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
