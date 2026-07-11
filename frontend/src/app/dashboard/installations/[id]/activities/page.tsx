'use client'

import { use, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { installations, activities, Activity } from '@/services/api'
import { handleApiError } from '@/lib/handle-api-error'
import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InstallationActivitiesPage({ params }: PageProps) {
  const { id } = use(params)
  const queryClient = useQueryClient()

  // Same key as layout — served from cache, zero re-fetch
  const { data: installation } = useQuery({
    queryKey: queryKeys.installations.detail(id),
    queryFn: () => installations.get(id),
    staleTime: 1000 * 60 * 5,
  })

  // Separate query for activities
  const { data: activityList = [], isLoading } = useQuery({
    queryKey: queryKeys.activities.byInstallation(id),
    queryFn: () => activities.list(id),
    enabled: !!id,
  })

  // Create activity form state
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    activityDate: new Date().toISOString().split('T')[0],
    durationMinutes: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!installation) return
    setSaving(true)
    try {
      await activities.create({
        installationId: installation.id,
        title: form.title,
        description: form.description || undefined,
        activityDate: form.activityDate,
        durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
      })
      setForm({
        title: '',
        description: '',
        activityDate: new Date().toISOString().split('T')[0],
        durationMinutes: '',
      })
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.byInstallation(id) })
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
          Actividades ({(activityList as Activity[]).length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-xs font-medium text-slate-300 hover:text-slate-100 hover:border-white/20 transition-all"
        >
          {showForm ? '✕ Cancelar' : '+ Nueva Actividad'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Registrar Actividad</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Título *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Ej: Revisión de paneles, Limpieza sistema..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={form.activityDate}
                  onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Duración (min)</label>
                <input
                  type="number"
                  min="0"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
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
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 disabled:opacity-50 transition-all"
              >
                {saving ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities list */}
      {isLoading ? (
        <DataTableSkeleton rows={5} columns={4} />
      ) : (activityList as Activity[]).length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-white/5 bg-slate-900/40">
          <p className="text-sm text-slate-500">No hay actividades registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(activityList as Activity[]).map((act) => (
            <div
              key={act.id}
              className="rounded-xl border border-white/5 bg-slate-900/60 p-4 flex items-start gap-4"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm shrink-0 mt-0.5">
                🏗️
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-100">{act.title}</p>
                <p className="text-xs text-slate-500 mb-2">
                  {new Date(act.activityDate).toLocaleString('es-AR')}
                  {act.durationMinutes && (
                    <span className="ml-2 text-slate-600">· {act.durationMinutes} min</span>
                  )}
                </p>
                {act.description && (
                  <p className="text-sm text-slate-400 leading-relaxed italic">{act.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
