import { clsx } from 'clsx';

const variantStyles = {
  neutral: 'bg-primary-100 text-primary-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-50 text-blue-700',
  outline: 'bg-transparent border border-primary-300 text-primary-700',
};

const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
};

export default function Badge({ children, variant = 'neutral', size = 'sm', dot, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-md whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', {
            'bg-primary-500': variant === 'neutral' || variant === 'outline',
            'bg-green-500': variant === 'success',
            'bg-amber-500': variant === 'warning',
            'bg-red-500': variant === 'error',
            'bg-blue-500': variant === 'info',
          })}
        />
      )}
      {children}
    </span>
  );
}
