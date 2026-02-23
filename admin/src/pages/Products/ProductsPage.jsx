import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { usePaginatedApi } from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { user } = useAuthStore();
  const canDelete = user?.role === 'super_admin' || user?.role === 'shop_manager';
  const [search, setSearch] = useState('');
  const { data: products, pagination, loading, refetch, setPage, updateFilters } = usePaginatedApi('/products');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.images?.[0] ? (
            <img src={row.images[0].thumbnail_url || row.images[0].url} alt="" className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">N/A</div>
          )}
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-gray-500">{row.sku || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => (
        <div>
          {row.sale_price ? (
            <>
              <span className="text-red-600 font-medium">{row.sale_price}</span>
              <span className="text-gray-400 line-through text-xs ml-1">{row.price}</span>
            </>
          ) : (
            <span className="font-medium">{row.price}</span>
          )}
        </div>
      ),
    },
    {
      key: 'stock_quantity',
      label: 'Stock',
      render: (row) => (
        <span className={row.stock_quantity <= row.low_stock_threshold ? 'text-red-600 font-medium' : ''}>
          {row.stock_quantity}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <Link to={`/products/${row.id}/edit`} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
            <Edit size={16} />
          </Link>
          {canDelete && (
            <button onClick={() => handleDelete(row.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link to="/products/new" className="btn-primary">
          <Plus size={16} className="mr-2" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        <select
          className="input w-auto"
          onChange={(e) => updateFilters({ status: e.target.value || undefined })}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        pagination={pagination}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No products found"
      />
    </div>
  );
}
