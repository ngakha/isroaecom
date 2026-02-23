import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary-900 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-white text-primary-900 border border-primary-300 hover:bg-primary-50 active:bg-primary-100',
  ghost: 'bg-transparent text-primary-700 hover:bg-primary-100 active:bg-primary-200',
  danger: 'bg-error text-white hover:bg-red-600 active:bg-red-700',
  link: 'bg-transparent text-primary-900 underline hover:text-primary-600 !p-0 !h-auto',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-base gap-2',
  lg: 'h-11 px-6 text-lg gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconOnly = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary-900 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        iconOnly && '!px-0 aspect-square',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {!iconOnly && children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
}
