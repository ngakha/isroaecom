import { Star } from 'lucide-react';
import { clsx } from 'clsx';

export default function StarRating({ rating = 0, count, size = 14, interactive = false, onChange, className }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {stars.map((star) => (
          <button
            key={star}
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={clsx(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              size={size}
              className={clsx(
                star <= rating
                  ? 'fill-primary-900 text-primary-900'
                  : 'fill-none text-primary-300'
              )}
            />
          </button>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted ml-0.5">({count})</span>
      )}
    </div>
  );
}
