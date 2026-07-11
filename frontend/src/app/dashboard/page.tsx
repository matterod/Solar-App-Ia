'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Zap,
  CheckCircle2,
  Sun,
  Wrench,
  ClipboardList,
  Package,
  Plus,
  ArrowRight,
} from 'lucide-react'

import { dashboard, clients, installations, tasks } from '@/services/api'
import { queryKeys } from '@/lib/query-keys'
import { handleApiError } from '@/lib/handle-api-error'
import { MetricCard } from '@/components/dashboard/metric-card'
import { MetricCardSkeleton } from '@/components/dashboard/metric-card/skeleton'
import { DataTable } from '@/components/dashboard/data-table'
import { Badge, BadgeStatus } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'

/* ── helpers ── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function installationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Activa',
    inactive: 'Inactiva',
    maintenance: 'Mantenimiento',
    in_progress: 'En progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    pending: 'Pendiente',
  }
  return map[status] ?? status
}

function taskPriorityBadge(priority: string): BadgeStatus {
  const map: Record<string, BadgeStatus> = {
    high: 'danger',
    medium: 'warning',
    low: 'neutral',
  }
  return map[priority] ?? 'neutral'
}

/* ── page ── */

export default function DashboardPage() {
  const router = useRouter()

  /* ── queries ── */

  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboard.stats(),
    meta: { onError: (err: unknown) => handleApiError(err, 'Error al cargar estadísticas') },
  })

  const recentClientsQuery = useQuery({
    queryKey: queryKeys.clients.list({ page: 1 }),
    queryFn: () => clients.list(),
    select: (data) => data.slice(0, 5),
    meta: { onError: (err: unknown) => handleApiError(err, 'Error al cargar clientes') },
  })

  const recentInstallationsQuery = useQuery({
    queryKey: queryKeys.installations.list({ page: 1 }),
    queryFn: () => installations.list(),
    select: (data) => data.slice(0, 5),
    meta: { onError: (err: unknown) => handleApiError(err, 'Error al cargar instalaciones') },
  })

  const pendingTasksQuery = useQuery({
    queryKey: queryKeys.tasks.list({ status: 'pending' }),
    queryFn: () => tasks.list({ status: 'pending' }),
    select: (data) => data.slice(0, 5),
    meta: { onError: (err: unknown) => handleApiError(err, 'Error al cargar tareas') },
  })

  const stats = statsQuery.data
  const isStatsLoading = statsQuery.isLoading

  const isEmptyState =
    stats && (stats.total_clients === 0 || stats.total_installations === 0)

  /* ── columns ── */

  const clientColumns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (row: { name: string; email?: string }) => (
        <div>
          <p className="font-medium text-slate-200">{row.name}</p>
          {row.email && <p className="text-xs text-slate-500">{row.email}</p>}
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Ciudad',
      render: (row: { city?: string; province?: string }) => (
        <span className="text-slate-400">{row.city ?? row.province ?? '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Alta',
      render: (row: { createdAt: string }) => (
        <span className="text-slate-500">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  const installationColumns = [
    {
      key: 'locationName',
      header: 'Instalación',
      render: (row: { locationName: string; systemPowerKw?: number }) => (
        <div>
          <p className="font-medium text-slate-200">{row.locationName}</p>
          {row.systemPowerKw != null && (
            <p className="text-xs text-slate-500">{row.systemPowerKw} kW</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: { status: string }) => (
        <Badge status={row.status as BadgeStatus}>
          {installationStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'installationDate',
      header: 'Fecha',
      render: (row: { installationDate?: string }) => (
        <span className="text-slate-500">
          {row.installationDate ? formatDate(row.installationDate) : '—'}
        </span>
      ),
    },
  ]

  const taskColumns = [
    {
      key: 'title',
      header: 'Tarea',
      render: (row: { title: string; description?: string }) => (
        <div>
          <p className="font-medium text-slate-200">{row.title}</p>
          {row.description && (
            <p className="truncate text-xs text-slate-500 max-w-[200px]">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (row: { priority: string }) => (
        <Badge status={taskPriorityBadge(row.priority)}>
          {row.priority === 'high' ? 'Alta' : row.priority === 'medium' ? 'Media' : 'Baja'}
        </Badge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Vence',
      render: (row: { dueDate?: string }) => (
        <span className="text-slate-500">{row.dueDate ? formatDate(row.dueDate) : '—'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        description="Resumen general del negocio e indicadores clave."
      />

      {/* ── Row 1: KPI Bento Grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Clientes — col-span-1 */}
        {isStatsLoading ? (
          <MetricCardSkeleton />
        ) : (
          <MetricCard
            title="Clientes"
            value={stats?.total_clients ?? 0}
            subtitle="Total registrados"
            icon={Users}
            variant="primary"
          />
        )}

        {/* Instalaciones activas — col-span-1 */}
        {isStatsLoading ? (
          <MetricCardSkeleton />
        ) : (
          <MetricCard
            title="Instalaciones activas"
            value={stats?.active_installations ?? 0}
            subtitle={`de ${stats?.total_installations ?? 0} totales`}
            icon={CheckCircle2}
            variant="success"
          />
        )}

        {/* Potencia total — col-span-2, más importante visualmente */}
        {isStatsLoading ? (
          <MetricCardSkeleton className="lg:col-span-2" />
        ) : (
          <MetricCard
            title="Potencia total instalada"
            value={`${stats?.total_power_kw ?? 0} kW`}
            subtitle="Capacidad operativa del parque"
            icon={Sun}
            variant="primary"
            className="lg:col-span-2"
          />
        )}
      </div>

      {/* ── Row 2: Secondary KPIs ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isStatsLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Mantenimientos próximos"
              value={stats?.upcoming_maintenance ?? 0}
              subtitle="Próximos 30 días"
              icon={Wrench}
              variant={stats?.upcoming_maintenance ? 'warning' : 'default'}
            />
            <MetricCard
              title="Tareas pendientes"
              value={stats?.pending_tasks ?? 0}
              subtitle="Sin completar"
              icon={ClipboardList}
              variant={stats?.pending_tasks ? 'warning' : 'default'}
            />
            <MetricCard
              title="Stock bajo"
              value={stats?.lowStock_products ?? 0}
              subtitle="Productos bajo mínimo"
              icon={Package}
              variant={stats?.lowStock_products ? 'danger' : 'default'}
            />
          </>
        )}
      </div>

      {/* ── Row 3: Tables — Recent clients + Recent installations ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent clients — 2/3 width */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Últimos clientes
            </h2>
            <Link
              href="/dashboard/clients"
              className="flex items-center gap-1 text-xs text-sky-400 transition-colors hover:text-sky-300"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentClientsQuery.isLoading ? (
            <div className="h-48 animate-pulse rounded-xl border border-white/5 bg-slate-900/60" />
          ) : (
            <DataTable
              columns={clientColumns as Parameters<typeof DataTable>[0]['columns']}
              data={recentClientsQuery.data ?? []}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => router.push(`/dashboard/clients/${row.id}`)}
              emptyMessage="No hay clientes registrados"
            />
          )}
        </div>

        {/* Pending tasks — 1/3 width */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Tareas pendientes
            </h2>
            <Link
              href="/dashboard/activities"
              className="flex items-center gap-1 text-xs text-sky-400 transition-colors hover:text-sky-300"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {pendingTasksQuery.isLoading ? (
            <div className="h-48 animate-pulse rounded-xl border border-white/5 bg-slate-900/60" />
          ) : (
            <DataTable
              columns={taskColumns as Parameters<typeof DataTable>[0]['columns']}
              data={pendingTasksQuery.data ?? []}
              keyExtractor={(row) => row.id}
              emptyMessage="Sin tareas pendientes"
            />
          )}
        </div>
      </div>

      {/* ── Row 4: Recent installations (full width) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Instalaciones recientes
          </h2>
          <Link
            href="/dashboard/installations"
            className="flex items-center gap-1 text-xs text-sky-400 transition-colors hover:text-sky-300"
          >
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentInstallationsQuery.isLoading ? (
          <div className="h-40 animate-pulse rounded-xl border border-white/5 bg-slate-900/60" />
        ) : (
          <DataTable
            columns={installationColumns as Parameters<typeof DataTable>[0]['columns']}
            data={recentInstallationsQuery.data ?? []}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => router.push(`/dashboard/installations/${row.id}`)}
            emptyMessage="No hay instalaciones registradas"
          />
        )}
      </div>

      {/* ── Empty state / onboarding panel ── */}
      {isEmptyState && (
        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/60 p-8">
          <div className="absolute right-6 top-6 opacity-5">
            <Zap className="h-24 w-24 text-sky-400" />
          </div>
          <div className="relative z-10 max-w-xl">
            <h3 className="text-lg font-semibold text-slate-50">¡Empezá a usar Solar ERP!</h3>
            <p className="mt-1 text-sm text-slate-400">
              Tu sistema está listo. Creá tu primer cliente e instalación para comenzar a monitorear.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/clients"
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
              >
                <Plus className="h-3.5 w-3.5" /> Crear Cliente
              </Link>
              <Link
                href="/dashboard/installations"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <Plus className="h-3.5 w-3.5" /> Crear Instalación
              </Link>
              <Link
                href="/dashboard/inventory"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar Producto
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
