'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { clients, installations } from '@/services/api'
import { handleApiError } from '@/lib/handle-api-error'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/dashboard/data-table'
import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ClientDetailPage({ params }: PageProps) {
  const { id } = use(params)

  const {
    data: client,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => clients.get(id),
  })

  const { data: clientInstallations = [], isLoading: installationsLoading } = useQuery({
    queryKey: queryKeys.installations.list({ client_id: id }),
    queryFn: () => installations.list({ client_id: id }),
    enabled: !!id,
  })

  if (isError) {
    handleApiError(error)
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-white/5 bg-slate-900/40">
        <p className="text-sm text-slate-400">No se pudo cargar el cliente.</p>
      </div>
    )
  }

  const statusMap: Record<string, string> = {
    completed: 'Completada',
    in_progress: 'En Progreso',
    pending: 'Pendiente',
    maintenance: 'Mantenimiento',
    cancelled: 'Cancelada',
  }

  return (
    <div className="space-y-6">
      {/* Client info */}
      {isLoading ? (
        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-6 animate-pulse">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-800" />
                <div className="h-4 w-36 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      ) : client ? (
        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-6">
          {/* Client header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white text-lg font-bold shadow-sm shrink-0">
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50">{client.name}</h1>
              {client.company && (
                <p className="text-sm text-sky-400 font-medium">{client.company}</p>
              )}
            </div>
          </div>

          {/* Contact details */}
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Detalles de Contacto
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Email</p>
              <p className="text-sm text-slate-200">{client.email || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Teléfono</p>
              <p className="text-sm text-slate-200">{client.phone || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Ubicación</p>
              <p className="text-sm text-slate-200">
                {[client.address, client.city, client.province].filter(Boolean).join(', ') || 'No registrado'}
              </p>
            </div>
            {client.tax_id && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">CUIT / Tax ID</p>
                <p className="text-sm text-slate-200">{client.tax_id}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Fecha de registro</p>
              <p className="text-sm text-slate-200">
                {new Date(client.created_at).toLocaleDateString('es-AR')}
              </p>
            </div>
            {client.notes && (
              <div className="sm:col-span-2 pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500 mb-1.5">Notas</p>
                <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3 border border-white/5">
                  {client.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Installations section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Instalaciones ({clientInstallations.length})
        </h2>
        {installationsLoading ? (
          <DataTableSkeleton rows={3} columns={4} />
        ) : (
          <DataTable
            columns={[
              {
                key: 'location_name',
                header: 'Ubicación',
                render: (inst) => (
                  <span className="font-medium text-slate-100">{inst.location_name}</span>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (inst) => {
                  const statusKey = inst.status as 'completed' | 'in_progress' | 'pending' | 'maintenance' | 'cancelled'
                  return (
                    <Badge status={statusKey}>
                      {statusMap[inst.status] ?? inst.status}
                    </Badge>
                  )
                },
              },
              {
                key: 'panel_count',
                header: 'Paneles',
                render: (inst) => (
                  <span className="text-slate-300">{inst.panel_count} pan.</span>
                ),
              },
              {
                key: 'system_power_kw',
                header: 'Potencia',
                render: (inst) => (
                  <span className="text-slate-300">
                    {inst.system_power_kw ? `${inst.system_power_kw} kW` : '—'}
                  </span>
                ),
              },
              {
                key: 'city',
                header: 'Ciudad',
                render: (inst) => (
                  <span className="text-slate-400">
                    {[inst.address, inst.city].filter(Boolean).join(', ') || '—'}
                  </span>
                ),
              },
            ]}
            data={clientInstallations}
            keyExtractor={(inst) => inst.id}
            emptyMessage="Este cliente aún no tiene instalaciones registradas."
          />
        )}
      </div>
    </div>
  )
}
