interface DataTableSkeletonProps {
  rows?: number
  columns?: number
}

export function DataTableSkeleton({ rows = 5, columns = 4 }: DataTableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <div className="border-b border-white/5 bg-slate-900/80 px-4 py-3">
        <div className="flex gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-3 w-16 animate-pulse rounded bg-slate-800" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/5 bg-slate-900/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-6 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className="h-4 animate-pulse rounded bg-slate-800"
                style={{ width: `${60 + (j * 20) % 60}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
