'use client'

import { use, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit2 } from 'lucide-react'
import { queryKeys } from '@/lib/query-keys'
import { installations } from '@/services/api'
import { handleApiError } from '@/lib/handle-api-error'
import { MetricCardSkeleton } from '@/components/dashboard/metric-card/skeleton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InstallationDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

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

  const handleEdit = () => {
    if (!installation) return
    setForm({
      location_name: installation.location_name || '',
      address: installation.address || '',
      city: installation.city || '',
      province: installation.province || '',
      panel_count: installation.panel_count || 0,
      system_power_kw: installation.system_power_kw || '',
      panel_model: installation.panel_model || '',
      inverter_model: installation.inverter_model || '',
      inverter_count: installation.inverter_count || 1,
      installation_date: installation.installation_date ? installation.installation_date.split('T')[0] : '', // Format for date input
      status: installation.status || 'pending',
      description: installation.description || '',
    })
    setIsEditing(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await installations.update(id, {
        ...form,
        panel_count: parseInt(form.panel_count) || 0,
        inverter_count: parseInt(form.inverter_count) || 1,
        system_power_kw: form.system_power_kw ? parseFloat(form.system_power_kw) : null,
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.installations.detail(id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.installations.list({}) })
      setIsEditing(false)
    } catch (err) {
      handleApiError(err)
    }
    setSaving(false)
  }

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

  if (isEditing) {
    return (
      <div className="rounded-xl border border-white/5 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Editar Sistema
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Ubicación *</label>
              <input
                required
                value={form.location_name}
                onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Dirección *</label>
              <input
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ciudad</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Provincia</label>
              <input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Paneles</label>
              <input
                type="number"
                min="0"
                value={form.panel_count}
                onChange={(e) => setForm({ ...form, panel_count: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Potencia (kW)</label>
              <input
                type="number"
                step="0.1"
                value={form.system_power_kw}
                onChange={(e) => setForm({ ...form, system_power_kw: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Modelo Panel</label>
              <input
                value={form.panel_model}
                onChange={(e) => setForm({ ...form, panel_model: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Modelo Inversor</label>
              <input
                value={form.inverter_model}
                onChange={(e) => setForm({ ...form, inverter_model: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Instalación</label>
              <input
                type="date"
                value={form.installation_date}
                onChange={(e) => setForm({ ...form, installation_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Notas / Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:bg-slate-800/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Details */}
      <div className="rounded-xl border border-white/5 bg-slate-900/60 p-6 flex flex-col relative group overflow-hidden">
        <button 
          onClick={handleEdit}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-sky-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-white/10"
          title="Editar instalación"
        >
          <Edit2 className="w-4 h-4" />
        </button>
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
