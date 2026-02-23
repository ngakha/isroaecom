import { clsx } from 'clsx';

export default function PriceDisplay({ price, salePrice, currency = 'GEL', size = 'md', className }) {
  const hasDiscount = salePrice && salePrice < price;

  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const formatPrice = (p) => parseFloat(p).toFixed(2);

  return (
    <div className={clsx('flex items-baseline gap-2', className)}>
      {hasDiscount ? (
        <>
          <span className={clsx('font-semibold text-primary-900', sizeStyles[size])}>
            {formatPrice(salePrice)} {currency}
          </span>
          <span className="text-sm text-muted line-through">
            {formatPrice(price)}
          </span>
        </>
      ) : (
        <span className={clsx('font-semibold text-primary-900', sizeStyles[size])}>
          {formatPrice(price)} {currency}
        </span>
      )}
    </div>
  );
}
