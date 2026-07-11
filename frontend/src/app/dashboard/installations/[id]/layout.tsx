'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumb } from '@/components/dashboard/breadcrumb'
import { InstallationTabNav } from '@/components/dashboard/installation-tab-nav'
import { Badge } from '@/components/ui/Badge'
import { queryKeys } from '@/lib/query-keys'
import { installations } from '@/services/api'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default function InstallationDetailLayout({ children, params }: LayoutProps) {
  const { id } = use(params)

  // ANTI-WATERFALL: same queryKey as all child pages — React Query deduplicates automatically
  const { data: installation } = useQuery({
    queryKey: queryKeys.installations.detail(id),
    queryFn: () => installations.get(id),
    staleTime: 1000 * 60 * 5,
  })

  const tabs = [
    { label: 'General', href: `/dashboard/installations/${id}`, exact: true },
    { label: 'Costos', href: `/dashboard/installations/${id}/costs` },
    { label: 'Actividades', href: `/dashboard/installations/${id}/activities` },
    { label: 'Mantenimiento', href: `/dashboard/installations/${id}/maintenance` },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/5 bg-slate-950/80 px-6 py-4 backdrop-blur-sm">
        <Link
          href="/dashboard/installations"
          className="mb-3 flex w-fit items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Instalaciones
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Breadcrumb
              items={[
                { label: 'Instalaciones', href: '/dashboard/installations' },
                { label: installation?.locationName ?? 'Detalle' },
              ]}
            />
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-50">
                {installation?.locationName ?? '—'}
              </h1>
              {installation?.status && (
                <Badge status={installation.status as any}>
                  {installation.status === 'pending' ? 'Pendiente'
                    : installation.status === 'in_progress' ? 'En Progreso'
                    : installation.status === 'completed' ? 'Completada'
                    : installation.status === 'cancelled' ? 'Cancelada'
                    : installation.status}
                </Badge>
              )}
            </div>
          </div>
          {/* Key stats inline in header */}
          {installation && (
            <div className="hidden items-center gap-6 text-right sm:flex">
              <div>
                <p className="text-xs text-slate-400">Potencia</p>
                <p className="text-sm font-semibold text-sky-400">
                  {installation.systemPowerKw ?? '—'} kW
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Paneles</p>
                <p className="text-sm font-semibold text-slate-200">
                  {installation.panelCount ?? '—'}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <InstallationTabNav tabs={tabs} />
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  )
}
