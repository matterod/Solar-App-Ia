'use client'

import { use, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { installations, maintenance, Maintenance } from '@/services/api'
import { handleApiError } from '@/lib/handle-api-error'
import { Badge } from '@/components/ui/Badge'
import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'

interface PageProps {
  params: Promise<{ id: string }>
}

const maintenanceTypeLabels: Record<string, string> = {
  preventive: 'Preventivo',
  corrective: 'Correctivo',
  inspection: 'Inspección',
  cleaning: 'Limpieza',
  other: 'Otro',
}

export default function InstallationMaintenancePage({ params }: PageProps) {
  const { id } = use(params)
  const queryClient = useQueryClient()

  // Same key as layout — served from cache, zero re-fetch
  const { data: installation } = useQuery({
    queryKey: queryKeys.installations.detail(id),
    queryFn: () => installations.get(id),
    staleTime: 1000 * 60 * 5,
  })

  // Separate query for maintenance records
  const { data: records = [], isLoading } = useQuery({
    queryKey: queryKeys.maintenance.list({ installation_id: id }),
    queryFn: () => maintenance.list({ installation_id: id }),
    enabled: !!id,
  })

  // Create maintenance form state
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    maintenance_type: 'preventive',
    scheduled_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!installation) return
    setSaving(true)
    try {
      await maintenance.create({
        installation_id: installation.id,
        maintenance_type: form.maintenance_type,
        scheduled_date: form.scheduled_date,
        description: form.description || undefined,
        status: form.status,
        notification_sent: false,
      })
      setForm({
        maintenance_type: 'preventive',
        scheduled_date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'pending',
      })
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.list({ installation_id: id }) })
    } catch (err) {
      handleApiError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Mantenimiento ({(records as Maintenance[]).length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-xs font-medium text-slate-300 hover:text-slate-100 hover:border-white/20 transition-all"
        >
          {showForm ? '✕ Cancelar' : '+ Programar Mantenimiento'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Programar Mantenimiento</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Tipo *</label>
                <select
                  required
                  value={form.maintenance_type}
                  onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="preventive">Preventivo</option>
                  <option value="corrective">Correctivo</option>
                  <option value="inspection">Inspección</option>
                  <option value="cleaning">Limpieza</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Fecha Programada *</label>
                <input
                  type="date"
                  required
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800/60 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-bold hover:bg-violet-400 disabled:opacity-50 transition-all"
              >
                {saving ? 'Guardando...' : 'Programar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance records */}
      {isLoading ? (
        <DataTableSkeleton rows={5} columns={4} />
      ) : (records as Maintenance[]).length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-white/5 bg-slate-900/40">
          <p className="text-sm text-slate-500">No hay historial de mantenimiento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(records as Maintenance[]).map((record) => (
            <div
              key={record.id}
              className="rounded-xl border border-white/5 bg-slate-900/60 p-4 flex items-start gap-4"
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5 ${
                  record.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-sky-500/10 text-sky-400'
                }`}
              >
                🔧
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-100">
                    {maintenanceTypeLabels[record.maintenance_type] ?? record.maintenance_type}
                  </p>
                  <Badge status={record.status as any}>
                    {record.status === 'completed' ? 'Completado'
                      : record.status === 'in_progress' ? 'En Progreso'
                      : 'Pendiente'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Programado: {new Date(record.scheduled_date).toLocaleDateString('es-AR')}
                  {record.completed_date && (
                    <span className="ml-2">
                      · Completado: {new Date(record.completed_date).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </p>
                {record.description && (
                  <p className="text-sm text-slate-400 italic">&ldquo;{record.description}&rdquo;</p>
                )}
                {record.findings && (
                  <p className="text-sm text-slate-300 mt-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Hallazgos:</span>
                    {record.findings}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
