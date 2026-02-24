import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Clock } from 'lucide-react';
import OrderStatusBadge from '../components/ecommerce/OrderStatusBadge';
import Badge from '../components/ui/Badge';
import Breadcrumb from '../components/ui/Breadcrumb';
import Skeleton from '../components/ui/Skeleton';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    api.get(`/orders/my-orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 lg:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-container mx-auto px-4 lg:px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-primary-900 mb-2">{t('orderDetail.notFound')}</h1>
        <Link to="/account?tab=orders" className="text-sm text-primary-900 font-medium hover:underline">
          {t('orderDetail.backToOrders')}
        </Link>
      </div>
    );
  }

  const paymentStatusConfig = {
    pending: { label: 'Pending', variant: 'warning' },
    processing: { label: 'Processing', variant: 'info' },
    completed: { label: 'Paid', variant: 'success' },
    failed: { label: 'Failed', variant: 'error' },
    refunded: { label: 'Refunded', variant: 'neutral' },
  };
  const payStatus = paymentStatusConfig[order.payment_status] || { label: order.payment_status, variant: 'neutral' };

  return (
    <div className="max-w-container mx-auto px-4 lg:px-6 py-8">
      <Link
        to="/account?tab=orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-900 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        {t('orderDetail.backToOrders')}
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-primary-900">{order.order_number}</h1>
        <OrderStatusBadge status={order.status} />
        <Badge variant={payStatus.variant} dot size="md">{payStatus.label}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border bg-surface rounded-t-lg">
              <h3 className="text-sm font-semibold text-primary-900 flex items-center gap-2">
                <Package size={16} />
                {t('orderDetail.items', { count: order.items?.length || 0 })}
              </h3>
            </div>
            <div className="divide-y divide-border">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900">{item.name}</p>
                    {item.sku && <p className="text-xs text-muted">SKU: {item.sku}</p>}
                  </div>
                  <span className="text-sm text-muted">x{item.quantity}</span>
                  <span className="text-sm font-medium text-primary-900 w-24 text-right">
                    {parseFloat(item.total).toFixed(2)} GEL
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {order.history?.length > 0 && (
            <div className="border border-border rounded-lg">
              <div className="px-4 py-3 border-b border-border bg-surface rounded-t-lg">
                <h3 className="text-sm font-semibold text-primary-900 flex items-center gap-2">
                  <Clock size={16} />
                  {t('orderDetail.statusHistory')}
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {order.history.map((entry, i) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-primary-900' : 'bg-primary-300'}`} />
                        {i < order.history.length - 1 && <div className="w-px h-8 bg-primary-200" />}
                      </div>
                      <div className="flex-1 -mt-0.5">
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={entry.status} />
                          <span className="text-xs text-muted">
                            {new Date(entry.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {entry.note && <p className="text-xs text-muted mt-0.5">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary-900 mb-3">{t('orderDetail.summary')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t('orderDetail.subtotal')}</span>
                <span>{parseFloat(order.subtotal).toFixed(2)} GEL</span>
              </div>
              {parseFloat(order.shipping_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">{t('orderDetail.shipping')}</span>
                  <span>{parseFloat(order.shipping_amount).toFixed(2)} GEL</span>
                </div>
              )}
              {parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">{t('orderDetail.tax')}</span>
                  <span>{parseFloat(order.tax_amount).toFixed(2)} GEL</span>
                </div>
              )}
              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>{t('orderDetail.discount')}</span>
                  <span>-{parseFloat(order.discount_amount).toFixed(2)} GEL</span>
                </div>
              )}
              {order.coupon_code && (
                <div className="flex justify-between">
                  <span className="text-muted">{t('orderDetail.coupon')}</span>
                  <span className="text-xs bg-primary-100 px-1.5 py-0.5 rounded">{order.coupon_code}</span>
                </div>
              )}
              <hr className="border-border" />
              <div className="flex justify-between font-semibold text-primary-900">
                <span>{t('orderDetail.total')}</span>
                <span>{parseFloat(order.total).toFixed(2)} {order.currency || 'GEL'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <MapPin size={14} />
                {t('orderDetail.shippingAddress')}
              </h3>
              <div className="text-sm text-primary-600 space-y-0.5">
                <p>{order.shippingAddress.first_name} {order.shippingAddress.last_name}</p>
                <p>{order.shippingAddress.address_line1}</p>
                {order.shippingAddress.address_line2 && <p>{order.shippingAddress.address_line2}</p>}
                <p>{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} {order.shippingAddress.postal_code}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary-900 mb-3 flex items-center gap-2">
              <CreditCard size={14} />
              {t('orderDetail.payment')}
            </h3>
            <div className="text-sm text-primary-600 space-y-1">
              <p>{t('orderDetail.method', { value: order.payment_method || 'N/A' })}</p>
              <p className="text-xs text-muted">
                {t('orderDetail.ordered', { date: new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                }) })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
