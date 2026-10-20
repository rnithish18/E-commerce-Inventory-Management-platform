export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 mt-auto">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  )
}
