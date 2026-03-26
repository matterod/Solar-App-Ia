import { DataTableSkeleton } from "@/components/dashboard/data-table/skeleton";

export default function PresupuestosLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-44 animate-pulse rounded bg-slate-800" />
      <DataTableSkeleton rows={8} columns={5} />
    </div>
  );
}
