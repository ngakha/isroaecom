import Badge from '../ui/Badge';
import { useTranslation } from 'react-i18next';

const variantMap = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'error',
  refund_requested: 'warning',
  refunded: 'neutral',
};

export default function OrderStatusBadge({ status }) {
  const { t } = useTranslation();
  const variant = variantMap[status] || 'neutral';

  return (
    <Badge variant={variant} dot size="md">
      {t(`status.${status}`, status)}
    </Badge>
  );
}
