import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'

export default function ClientsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-32 animate-pulse rounded bg-slate-800" />
      <DataTableSkeleton rows={8} columns={5} />
    </div>
  )
}
