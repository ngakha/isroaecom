import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PhoneCall, Search, Trash2, Clock, CheckCircle, XCircle, Phone } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function CallRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({});
  const user = useAuthStore((s) => s.user);

  const STATUS_OPTIONS = [
    { value: 'new', label: t('callRequests.new'), color: 'bg-blue-100 text-blue-700' },
    { value: 'contacted', label: t('callRequests.contacted'), color: 'bg-yellow-100 text-yellow-700' },
    { value: 'completed', label: t('callRequests.completed'), color: 'bg-green-100 text-green-700' },
    { value: 'cancelled', label: t('callRequests.cancelled'), color: 'bg-gray-100 text-gray-600' },
  ];

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25, sortOrder: 'desc' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const [listRes, statsRes] = await Promise.all([
        api.get(`/call-requests?${params}`),
        api.get('/call-requests/stats'),
      ]);

      setRequests(listRes.data.data || []);
      setPagination(listRes.data.pagination || {});
      setStats(statsRes.data.data || {});
    } catch (err) {
      toast.error(t('callRequests.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(1);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/call-requests/${id}/status`, { status: newStatus });
      toast.success(t('callRequests.statusUpdated'));
      loadData(pagination.page);
    } catch (err) {
      toast.error(t('callRequests.statusFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('callRequests.deleteConfirm'))) return;
    try {
      await api.delete(`/call-requests/${id}`);
      toast.success(t('callRequests.deleted'));
      loadData(pagination.page);
    } catch (err) {
      toast.error(t('callRequests.deleteFailed'));
    }
  };

  const totalNew = stats.new || 0;

  const statusBadge = (status) => {
    const opt = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${opt?.color || 'bg-gray-100 text-gray-600'}`}>
        {opt?.label || status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('callRequests.title')}</h1>
          {totalNew > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {t('callRequests.newCount', { count: totalNew })}
            </span>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <div key={s.value} className="card p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
              {s.value === 'new' && <PhoneCall size={16} />}
              {s.value === 'contacted' && <Phone size={16} />}
              {s.value === 'completed' && <CheckCircle size={16} />}
              {s.value === 'cancelled' && <XCircle size={16} />}
            </div>
            <div>
              <p className="text-lg font-bold">{stats[s.value] || 0}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${!statusFilter ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setStatusFilter('')}
          >
            {t('common.all')}
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${statusFilter === s.value ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-60"
              placeholder={t('callRequests.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary text-sm">{t('common.search')}</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('callRequests.noRequests')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('common.name')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('common.phone')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('callRequests.product')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('callRequests.message')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('common.status')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('common.date')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-20">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.customer_name}</td>
                    <td className="px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{r.product_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{r.message || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {user?.role === 'super_admin' && (
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {t('common.showing', { from: (pagination.page - 1) * pagination.limit + 1, to: Math.min(pagination.page * pagination.limit, pagination.total), total: pagination.total })}
          </span>
          <div className="flex gap-1">
            <button
              className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
              onClick={() => loadData(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              {t('common.prev')}
            </button>
            <button
              className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
              onClick={() => loadData(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
