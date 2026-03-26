export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-white/5 bg-slate-900/60 p-5 ${className ?? ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
          <div className="h-7 w-28 animate-pulse rounded bg-slate-800" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-800" />
      </div>
      <div className="mt-3 h-3 w-24 animate-pulse rounded bg-slate-800" />
    </div>
  )
}
