import { MetricCardSkeleton } from '@/components/dashboard/metric-card/skeleton'
import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'

export default function ClientDetailLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <DataTableSkeleton rows={3} columns={4} />
    </div>
  )
}
