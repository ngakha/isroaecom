import { MapPin, Edit2, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import { clsx } from 'clsx';

export default function AddressCard({ address, selected, onSelect, onEdit, onDelete, selectable = false }) {
  return (
    <div
      onClick={() => selectable && onSelect?.(address)}
      className={clsx(
        'border rounded-lg p-4 transition-all',
        selectable && 'cursor-pointer',
        selected ? 'border-primary-900 bg-primary-50' : 'border-border hover:border-primary-300'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-muted flex-shrink-0" />
          <span className="text-sm font-medium text-primary-900">{address.label || 'Address'}</span>
          {address.is_default && (
            <Badge variant="neutral" size="sm">Default</Badge>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(address); }}
                className="p-1 text-muted hover:text-primary-900 transition-colors"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(address); }}
                className="p-1 text-muted hover:text-error transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="text-sm text-primary-600 space-y-0.5 ml-6">
        <p>{address.first_name} {address.last_name}</p>
        <p>{address.address_line1}</p>
        {address.address_line2 && <p>{address.address_line2}</p>}
        <p>{address.city}{address.state ? `, ${address.state}` : ''} {address.postal_code}</p>
        <p>{address.country}</p>
        {address.phone && <p>{address.phone}</p>}
      </div>
    </div>
  );
}
