import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['completed', 'refund_requested'],
  refund_requested: ['refunded', 'delivered'],
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, refetch } = useApi(`/orders/${id}`);
  const [updating, setUpdating] = useState(false);

  const order = data?.data;
  const allowedTransitions = order ? STATUS_TRANSITIONS[order.status] || [] : [];

  const handleStatusChange = async (newStatus) => {
    const note = prompt('Add a note (optional):');
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus, note });
      toast.success(`Status updated to ${newStatus}`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="card h-96" /></div>;
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-500">Order not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="p-2 text-gray-400 hover:text-gray-600 rounded">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.payment_status} />
        </div>
      </div>

      {/* Status Actions */}
      {allowedTransitions.length > 0 && (
        <div className="card flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Update Status:</span>
          {allowedTransitions.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={updating}
              className={`btn text-xs capitalize ${status === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
            >
              <CheckCircle size={14} className="mr-1" />
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold mb-4">Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Product</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">
                    <p className="font-medium">{item.name}</p>
                    {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">{item.price}</td>
                  <td className="py-2 text-right font-medium">{item.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t">
              <tr><td colSpan="3" className="py-1 text-right text-gray-600">Subtotal</td><td className="py-1 text-right">{order.subtotal}</td></tr>
              <tr><td colSpan="3" className="py-1 text-right text-gray-600">Shipping</td><td className="py-1 text-right">{order.shipping_amount}</td></tr>
              <tr><td colSpan="3" className="py-1 text-right text-gray-600">Tax</td><td className="py-1 text-right">{order.tax_amount}</td></tr>
              {parseFloat(order.discount_amount) > 0 && (
                <tr><td colSpan="3" className="py-1 text-right text-gray-600">Discount</td><td className="py-1 text-right text-red-600">-{order.discount_amount}</td></tr>
              )}
              <tr className="border-t"><td colSpan="3" className="py-2 text-right font-bold">Total</td><td className="py-2 text-right font-bold text-lg">{order.total} {order.currency}</td></tr>
            </tfoot>
          </table>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card">
            <h3 className="font-semibold mb-2">Customer</h3>
            <p className="text-sm">{order.customer_name}</p>
            <p className="text-sm text-gray-500">{order.customer_email}</p>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="card">
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-sm">{order.shippingAddress.first_name} {order.shippingAddress.last_name}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.address_line1}</p>
              {order.shippingAddress.address_line2 && <p className="text-sm text-gray-600">{order.shippingAddress.address_line2}</p>}
              <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.country}</p>
            </div>
          )}

          {/* Status History */}
          <div className="card">
            <h3 className="font-semibold mb-3">History</h3>
            <div className="space-y-3">
              {order.history?.map((entry) => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                  <div>
                    <p className="font-medium capitalize">{entry.status.replace(/_/g, ' ')}</p>
                    {entry.note && <p className="text-gray-500">{entry.note}</p>}
                    <p className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
