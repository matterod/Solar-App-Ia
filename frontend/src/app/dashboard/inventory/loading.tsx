import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'

export default function InventoryLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-36 animate-pulse rounded bg-slate-800" />
      <div className="flex gap-3">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-slate-800" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-800" />
      </div>
      <DataTableSkeleton rows={10} columns={5} />
    </div>
  )
}
