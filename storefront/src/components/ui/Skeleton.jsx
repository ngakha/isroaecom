import { clsx } from 'clsx';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx('animate-pulse bg-primary-100 rounded-md', className)}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    </div>
  );
}
