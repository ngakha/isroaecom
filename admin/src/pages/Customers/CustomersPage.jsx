import { useState } from 'react';
import { Search, Eye, Edit } from 'lucide-react';
import { usePaginatedApi } from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', isActive: true });
  const { data: customers, pagination, loading, setPage, updateFilters, refetch } = usePaginatedApi('/customers');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const viewCustomer = async (id) => {
    try {
      const { data } = await api.get(`/customers/${id}`);
      setSelectedCustomer(data.data);
    } catch {
      toast.error('Failed to load customer');
    }
  };

  const openEdit = (customer) => {
    setEditForm({
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone || '',
      isActive: customer.is_active !== false,
    });
    setEditModal(customer);
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/customers/${editModal.id}`, editForm);
      toast.success('Customer updated');
      setEditModal(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
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
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
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
        <div className="flex gap-1">
          <button onClick={() => viewCustomer(row.id)} className="p-1.5 text-gray-400 hover:text-primary-600">
            <Eye size={16} />
          </button>
          <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-primary-600">
            <Edit size={16} />
          </button>
        </div>
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

      {/* Edit Customer Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Customer">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
            <span className="text-sm">Active</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={handleUpdate} className="btn-primary">Update</button>
            <button onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
