import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, DollarSign, Package, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const role = user?.role;
  const canViewStats = role === 'super_admin' || role === 'shop_manager';

  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        if (canViewStats) {
          const [statsRes, ordersRes] = await Promise.all([
            api.get('/orders/stats'),
            api.get('/orders', { params: { limit: 5, sortBy: 'created_at', sortOrder: 'desc' } }),
          ]);
          setStats(statsRes.data.data);
          setRecentOrders(ordersRes.data.data || []);
        } else {
          // content_editor: just fetch product count
          const productsRes = await api.get('/products', { params: { limit: 1 } });
          setProductCount(productsRes.data.pagination?.total || 0);
        }
      } catch {
        // Stats might fail if no orders yet
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [canViewStats]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(canViewStats ? 4 : 2)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  // Content Editor Dashboard
  if (!canViewStats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-gray-500">{t('dashboard.welcome', { name: user?.firstName })}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/products" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.products')}</p>
                <p className="text-2xl font-bold">{productCount}</p>
              </div>
            </div>
          </Link>
          <Link to="/categories" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.categories')}</p>
                <p className="text-lg font-medium text-primary-600">{t('common.manage')}</p>
              </div>
            </div>
          </Link>
          <Link to="/media" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.mediaLibrary')}</p>
                <p className="text-lg font-medium text-primary-600">{t('common.upload')}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Super Admin / Shop Manager Dashboard
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalOrders')}
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title={t('dashboard.todayOrders')}
          value={stats?.todayOrders || 0}
          icon={Package}
          color="bg-green-500"
        />
        <StatCard
          title={t('dashboard.totalRevenue')}
          value={`${(stats?.totalRevenue || 0).toFixed(2)} GEL`}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title={t('dashboard.todayRevenue')}
          value={`${(stats?.todayRevenue || 0).toFixed(2)} GEL`}
          icon={DollarSign}
          color="bg-orange-500"
        />
      </div>

      {/* Order Status Chart */}
      {stats?.statusCounts && Object.keys(stats.statusCounts).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.ordersByStatus')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(stats.statusCounts).map(([status, count]) => ({
              status: t(`status.${status}`),
              count,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('dashboard.recentOrders')}</h2>
          <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700">
            {t('common.viewAll')}
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">{t('dashboard.noOrders')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-600">{t('dashboard.orderNumber')}</th>
                  <th className="text-left py-2 text-gray-600">{t('dashboard.customer')}</th>
                  <th className="text-left py-2 text-gray-600">{t('common.status')}</th>
                  <th className="text-right py-2 text-gray-600">{t('dashboard.total')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link to={`/orders/${order.id}`} className="text-primary-600 hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-2">{order.customer_name}</td>
                    <td className="py-2">
                      <span className="capitalize text-xs px-2 py-1 rounded-full bg-gray-100">
                        {t(`status.${order.status}`)}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">{order.total} {order.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
