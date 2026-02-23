import { clsx } from 'clsx';

const variantStyles = {
  default: 'border border-primary-300 bg-white focus:border-primary-900',
  filled: 'border-0 bg-primary-50 focus:bg-primary-100',
  underline: 'border-0 border-b border-primary-300 rounded-none bg-transparent focus:border-primary-900',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-3.5 text-base',
  lg: 'h-11 px-4 text-lg',
};

export default function Input({
  label,
  error,
  helperText,
  prefix,
  suffix,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-primary-700">{label}</label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-muted pointer-events-none">{prefix}</span>
        )}
        <input
          className={clsx(
            'w-full rounded-md transition-all duration-150 outline-none',
            'placeholder:text-muted',
            'focus:ring-2 focus:ring-primary-900/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variantStyles[variant],
            sizeStyles[size],
            error && '!border-error focus:ring-error/10',
            prefix && 'pl-10',
            suffix && 'pr-10'
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-muted pointer-events-none">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
    </div>
  );
}
