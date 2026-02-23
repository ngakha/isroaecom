import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import api from '../../services/api';

export default function PaymentConfigPage() {
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
        <h1 className="text-2xl font-bold">Payment Methods</h1>
      </div>

      <p className="text-sm text-gray-500">
        Payment providers are configured in <code className="bg-gray-100 px-1 rounded">server/config/plugins.js</code> and <code className="bg-gray-100 px-1 rounded">.env</code>.
        Enable or disable providers by editing the config file and restarting the server.
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
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Configuration Guide</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>To enable a payment provider:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Set <code className="bg-blue-100 px-1 rounded">enabled: true</code> in <code className="bg-blue-100 px-1 rounded">server/config/plugins.js</code></li>
            <li>Add API keys to <code className="bg-blue-100 px-1 rounded">.env</code> file</li>
            <li>Restart the server</li>
          </ol>
          <p className="mt-2">Required environment variables:</p>
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
