import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, DollarSign, Package, Users } from 'lucide-react';
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
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/orders/stats'),
          api.get('/orders', { params: { limit: 5, sortBy: 'created_at', sortOrder: 'desc' } }),
        ]);
        setStats(statsRes.data.data);
        setRecentOrders(ordersRes.data.data || []);
      } catch {
        // Stats might fail if no orders yet
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Today's Orders"
          value={stats?.todayOrders || 0}
          icon={Package}
          color="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value={`${(stats?.totalRevenue || 0).toFixed(2)} GEL`}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="Today's Revenue"
          value={`${(stats?.todayRevenue || 0).toFixed(2)} GEL`}
          icon={DollarSign}
          color="bg-orange-500"
        />
      </div>

      {/* Order Status Chart */}
      {stats?.statusCounts && Object.keys(stats.statusCounts).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(stats.statusCounts).map(([status, count]) => ({
              status: status.replace(/_/g, ' '),
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
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-600">Order #</th>
                  <th className="text-left py-2 text-gray-600">Customer</th>
                  <th className="text-left py-2 text-gray-600">Status</th>
                  <th className="text-right py-2 text-gray-600">Total</th>
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
                        {order.status}
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
