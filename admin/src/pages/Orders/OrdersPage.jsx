import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Eye, Archive, ArchiveRestore, Plus, Download } from 'lucide-react';
import { usePaginatedApi } from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');
  const [exportOpen, setExportOpen] = useState(false);
  const [customRange, setCustomRange] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const exportRef = useRef(null);
  const { data: orders, pagination, loading, setPage, updateFilters, refetch } = usePaginatedApi('/orders');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
        setCustomRange(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    updateFilters({ archived: newTab === 'archived' ? 'true' : 'false', status: undefined });
  };

  const handleArchive = async (id) => {
    try {
      await api.patch(`/orders/${id}/archive`);
      toast.success(t('orders.orderArchived'));
      refetch();
    } catch {
      toast.error(t('orders.archiveFailed'));
    }
  };

  const handleUnarchive = async (id) => {
    try {
      await api.patch(`/orders/${id}/unarchive`);
      toast.success(t('orders.orderRestored'));
      refetch();
    } catch {
      toast.error(t('orders.restoreFailed'));
    }
  };

  const handleExport = async (range) => {
    try {
      const params = { range };
      if (range === 'custom') {
        if (!exportFrom || !exportTo) {
          toast.error(t('orders.selectDates'));
          return;
        }
        params.from = exportFrom;
        params.to = exportTo;
      }
      const res = await api.get('/orders/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportOpen(false);
      setCustomRange(false);
    } catch {
      toast.error(t('orders.exportFailed'));
    }
  };

  const columns = [
    {
      key: 'order_number',
      label: t('orders.orderNumber'),
      render: (row) => (
        <Link to={`/orders/${row.id}`} className="text-primary-600 hover:underline font-medium">
          {row.order_number}
        </Link>
      ),
    },
    { key: 'customer_name', label: t('orders.customer') },
    {
      key: 'status',
      label: t('common.status'),
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'payment_status',
      label: t('orders.payment'),
      render: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      key: 'total',
      label: t('orders.total'),
      render: (row) => <span className="font-medium">{row.total} {row.currency}</span>,
    },
    {
      key: 'created_at',
      label: t('common.date'),
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link to={`/orders/${row.id}`} className="p-1.5 text-gray-400 hover:text-primary-600 inline-block">
            <Eye size={16} />
          </Link>
          {tab === 'active' ? (
            <button
              onClick={() => handleArchive(row.id)}
              className="p-1.5 text-gray-400 hover:text-amber-600"
              title={t('orders.archive')}
            >
              <Archive size={16} />
            </button>
          ) : (
            <button
              onClick={() => handleUnarchive(row.id)}
              className="p-1.5 text-gray-400 hover:text-green-600"
              title={t('orders.restore')}
            >
              <ArchiveRestore size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-secondary flex items-center gap-1.5"
            >
              <Download size={16} />
              {t('orders.export')}
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-20 w-56 py-1">
                <button onClick={() => handleExport('1d')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                  {t('orders.export1d')}
                </button>
                <button onClick={() => handleExport('7d')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                  {t('orders.export7d')}
                </button>
                <button onClick={() => handleExport('1m')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                  {t('orders.export1m')}
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => setCustomRange(true)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 font-medium">
                  {t('orders.exportCustom')}
                </button>
                {customRange && (
                  <div className="px-4 py-2 space-y-2 border-t border-gray-100">
                    <input type="date" className="input text-sm" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
                    <input type="date" className="input text-sm" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
                    <button onClick={() => handleExport('custom')} className="btn-primary w-full text-sm">
                      {t('orders.exportDownload')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link to="/orders/create" className="btn-primary flex items-center gap-1.5">
            <Plus size={16} />
            {t('orders.createOrder')}
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => handleTabChange('active')}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'active'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('orders.activeOrders')}
        </button>
        <button
          onClick={() => handleTabChange('archived')}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'archived'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('orders.archived')}
        </button>
      </div>

      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className="input pl-9" placeholder={t('orders.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        <select className="input w-auto" onChange={(e) => updateFilters({ status: e.target.value || undefined })}>
          <option value="">{t('orders.allStatuses')}</option>
          <option value="pending">{t('status.pending')}</option>
          <option value="confirmed">{t('status.confirmed')}</option>
          <option value="processing">{t('status.processing')}</option>
          <option value="shipped">{t('status.shipped')}</option>
          <option value="delivered">{t('status.delivered')}</option>
          <option value="completed">{t('status.completed')}</option>
          <option value="cancelled">{t('status.cancelled')}</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        pagination={pagination}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={tab === 'archived' ? t('orders.noArchived') : t('orders.noOrders')}
      />
    </div>
  );
}
