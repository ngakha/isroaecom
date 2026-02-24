import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import OrderStatusBadge from '../components/ecommerce/OrderStatusBadge';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      api.get(`/orders/my-orders/${id}`)
        .then((res) => setOrder(res.data.data))
        .catch(() => {});
    }
  }, [id]);

  return (
    <div className="max-w-container mx-auto px-4 lg:px-6 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-50 mx-auto mb-4">
          <CheckCircle size={32} className="text-success" />
        </div>

        <h1 className="text-2xl font-semibold text-primary-900 mb-2">{t('orderSuccess.title')}</h1>
        <p className="text-sm text-muted mb-6">
          {t('orderSuccess.subtitle')}
        </p>

        {order && (
          <div className="border border-border rounded-lg p-6 text-left mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted">{t('orderSuccess.orderNumber')}</p>
                <p className="text-sm font-semibold text-primary-900">{order.order_number}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t('orderSuccess.total')}</span>
              <span className="font-semibold text-primary-900">
                {parseFloat(order.total).toFixed(2)} {order.currency || 'GEL'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted">{t('orderSuccess.payment')}</span>
              <span className="text-primary-600">{order.payment_method || 'N/A'}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {order && (
            <Link to={`/account/order/${order.id}`}>
              <Button variant="secondary" icon={<Package size={16} />}>
                {t('orderSuccess.viewOrder')}
              </Button>
            </Link>
          )}
          <Link to="/shop">
            <Button icon={<ArrowRight size={16} />} iconPosition="right">
              {t('orderSuccess.continueShopping')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
