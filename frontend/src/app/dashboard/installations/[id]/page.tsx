'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { installations } from '@/services/api'
import { handleApiError } from '@/lib/handle-api-error'
import { MetricCardSkeleton } from '@/components/dashboard/metric-card/skeleton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InstallationDetailPage({ params }: PageProps) {
  const { id } = use(params)

  // ANTI-WATERFALL: IDENTICAL queryKey to layout.tsx — React Query serves from cache, zero re-fetch
  const {
    data: installation,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.installations.detail(id),
    queryFn: () => installations.get(id),
  })

  if (isError) {
    handleApiError(error)
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-white/5 bg-slate-900/40">
        <p className="text-sm text-slate-400">No se pudo cargar la instalación.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!installation) return null

  return (
    <div className="space-y-6">
      {/* System Details */}
      <div className="rounded-xl border border-white/5 bg-slate-900/60 p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
          Detalles del Sistema
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Potencia Instalada</p>
            <p className="text-sm font-semibold text-slate-100">
              {installation.system_power_kw ? `${installation.system_power_kw} kWp` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Fecha de Instalación</p>
            <p className="text-sm font-semibold text-slate-100">
              {installation.installation_date
                ? new Date(installation.installation_date).toLocaleDateString('es-AR')
                : 'Pendiente'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Paneles Solares</p>
            <p className="text-sm font-semibold text-slate-100">
              {installation.panel_count}x {installation.panel_model || 'Genérico'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Inversor</p>
            <p className="text-sm font-semibold text-slate-100">
              {installation.inverter_count}x {installation.inverter_model || 'Genérico'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Ubicación</p>
            <p className="text-sm font-semibold text-slate-100">
              {[installation.address, installation.city, installation.province]
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Fecha de alta</p>
            <p className="text-sm font-semibold text-slate-100">
              {new Date(installation.created_at).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      {/* Description / Notes */}
      {installation.description && (
        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Notas / Descripción
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed italic">
            &ldquo;{installation.description}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
