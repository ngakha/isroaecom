import Button from '../ui/Button';
import { clsx } from 'clsx';

export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary-50 text-muted mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-primary-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
