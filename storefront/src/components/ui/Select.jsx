import { clsx } from 'clsx';

export default function Select({ label, error, options = [], placeholder, className, ...props }) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-primary-700">{label}</label>
      )}
      <select
        className={clsx(
          'w-full h-9 px-3 rounded-md border border-primary-300 bg-white text-base',
          'outline-none transition-all duration-150',
          'focus:border-primary-900 focus:ring-2 focus:ring-primary-900/10',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && '!border-error focus:ring-error/10'
        )}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
