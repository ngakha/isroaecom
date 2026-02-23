import { Minus, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export default function QuantitySelector({ value, onChange, min = 1, max = 99, disabled = false, className }) {
  return (
    <div className={clsx('inline-flex items-center border border-primary-300 rounded-md', className)}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="w-9 h-9 flex items-center justify-center text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-md"
      >
        <Minus size={16} />
      </button>
      <span className="w-10 h-9 flex items-center justify-center text-sm font-medium text-primary-900 border-x border-primary-300">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="w-9 h-9 flex items-center justify-center text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-md"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
