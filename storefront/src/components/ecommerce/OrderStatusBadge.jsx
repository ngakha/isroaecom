import Badge from '../ui/Badge';

const statusConfig = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  processing: { label: 'Processing', variant: 'info' },
  shipped: { label: 'Shipped', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  refund_requested: { label: 'Refund Requested', variant: 'warning' },
  refunded: { label: 'Refunded', variant: 'neutral' },
};

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, variant: 'neutral' };

  return (
    <Badge variant={config.variant} dot size="md">
      {config.label}
    </Badge>
  );
}
