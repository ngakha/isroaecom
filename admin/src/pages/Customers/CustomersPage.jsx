import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { usePaginatedApi } from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { data: customers, pagination, loading, setPage, updateFilters } = usePaginatedApi('/customers');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const viewCustomer = async (id) => {
    try {
      const { data } = await api.get(`/customers/${id}`);
      setSelectedCustomer(data.data);
    } catch {
      // Handle error
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium">{row.first_name} {row.last_name}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '-' },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (row) => row.last_login ? new Date(row.last_login).toLocaleDateString() : 'Never',
    },
    {
      key: 'created_at',
      label: 'Registered',
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button onClick={() => viewCustomer(row.id)} className="p-1.5 text-gray-400 hover:text-primary-600">
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" className="input pl-9" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <DataTable
        columns={columns}
        data={customers}
        pagination={pagination}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No customers found"
      />

      {/* Customer Detail Modal */}
      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Customer Details" size="lg">
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p>{selectedCustomer.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registered</p>
                <p>{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="font-medium">{selectedCustomer.orderCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="font-medium">{selectedCustomer.totalSpent?.toFixed(2)} GEL</p>
              </div>
            </div>

            {selectedCustomer.addresses?.length > 0 && (
              <div>
                <h4 className="font-semibold mt-4 mb-2">Addresses</h4>
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">{addr.label} {addr.is_default && '(Default)'}</p>
                      <p>{addr.address_line1}, {addr.city}, {addr.country}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
