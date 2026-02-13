import clsx from 'clsx';

const statusStyles = {
  // Order statuses
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refund_requested: 'bg-orange-100 text-orange-800',
  refunded: 'bg-gray-100 text-gray-800',
  // Payment statuses
  failed: 'bg-red-100 text-red-800',
  // Product statuses
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
  // Generic
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
      statusStyles[status] || 'bg-gray-100 text-gray-800'
    )}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
