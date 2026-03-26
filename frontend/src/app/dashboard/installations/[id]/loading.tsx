import { MetricCardSkeleton } from '@/components/dashboard/metric-card/skeleton'

export default function InstallationDetailLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}
