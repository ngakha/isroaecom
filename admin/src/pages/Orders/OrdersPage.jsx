import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { usePaginatedApi } from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const { data: orders, pagination, loading, setPage, updateFilters } = usePaginatedApi('/orders');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const columns = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (row) => (
        <Link to={`/orders/${row.id}`} className="text-primary-600 hover:underline font-medium">
          {row.order_number}
        </Link>
      ),
    },
    { key: 'customer_name', label: 'Customer' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => <span className="font-medium">{row.total} {row.currency}</span>,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link to={`/orders/${row.id}`} className="p-1.5 text-gray-400 hover:text-primary-600 inline-block">
          <Eye size={16} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className="input pl-9" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        <select className="input w-auto" onChange={(e) => updateFilters({ status: e.target.value || undefined })}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        pagination={pagination}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No orders found"
      />
    </div>
  );
}
