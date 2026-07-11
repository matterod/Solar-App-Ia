'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { queryKeys } from '@/lib/query-keys'
import { installations, clients, Installation, Client } from '@/services/api'
import { handleApiError } from '@/lib/handle-api-error'
import { useURLState } from '@/hooks/use-url-state'
import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'
import { Badge } from '@/components/ui/Badge'

const statusMap: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export default function InstallationsPage() {
  const queryClient = useQueryClient()

  // URL-driven filter state
  const [search, setSearch] = useURLState<string>('search', '')
  const [filterStatus, setFilterStatus] = useURLState<string>('status', '')
  const [page, setPage] = useURLState<number>('page', 1)

  // Create modal state
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    clientId: '', locationName: '', address: '', city: '', province: '',
    panelCount: '0', panelModel: '', inverterModel: '', inverterCount: '1',
    systemPowerKw: '', installationDate: '', status: 'pending', description: '',
  })

  const filters = {
    search: search || undefined,
    status: filterStatus || undefined,
    page,
  }

  const { data: data = [], isLoading, isError, error } = useQuery({
    queryKey: queryKeys.installations.list(filters),
    queryFn: () => installations.list({ search: search || undefined, status: filterStatus || undefined }),
    staleTime: 1000 * 60 * 2,
  })

  const { data: clientList = [] } = useQuery({
    queryKey: queryKeys.clients.list({}),
    queryFn: () => clients.list(),
    staleTime: 1000 * 60 * 5,
  })

  if (isError) {
    handleApiError(error)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await installations.create({
        ...form,
        panelCount: parseInt(form.panelCount) || 0,
        inverterCount: parseInt(form.inverterCount) || 1,
        systemPowerKw: form.systemPowerKw ? parseFloat(form.systemPowerKw) : undefined,
        installationDate: form.installationDate || undefined,
      })
      setShowModal(false)
      setForm({
        clientId: '', locationName: '', address: '', city: '', province: '',
        panelCount: '0', panelModel: '', inverterModel: '', inverterCount: '1',
        systemPowerKw: '', installationDate: '', status: 'pending', description: '',
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.installations.all() })
    } catch (err) {
      handleApiError(err)
    }
    setSaving(false)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-50">Instalaciones</h1>
          <p className="text-sm text-slate-400 mt-1">
            {data.length} instalaci{data.length !== 1 ? 'ones' : 'ón'} registrada{data.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            if (clientList.length === 0) {
              alert('Primero creá un cliente.')
              return
            }
            setShowModal(true)
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva Instalación
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value as string); setPage(1) }}
          placeholder="Buscar por ubicación..."
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40 transition-all"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as string); setPage(1) }}
          className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <DataTableSkeleton rows={8} columns={6} />
      ) : data.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="text-5xl mb-4">⚡</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            {search || filterStatus ? 'Sin resultados' : 'No hay instalaciones aún'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {search || filterStatus ? 'Probá con otros filtros.' : 'Creá tu primera instalación.'}
          </p>
          {!search && !filterStatus && clientList.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-colors"
            >
              + Crear Primera Instalación
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data as Installation[]).map((inst: Installation, i: number) => {
            const clientInfo = (clientList as Client[]).find((c: Client) => c.id === inst.clientId)
            return (
              <motion.div
                key={inst.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/60 rounded-2xl p-5 border border-white/5 hover:border-white/10 hover:shadow-lg transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-slate-100">{inst.locationName}</h3>
                    <Badge status={inst.status as any}>
                      {statusMap[inst.status] ?? inst.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-sky-400 mb-3">
                    {clientInfo?.name || 'Cliente Desconocido'}
                    {clientInfo?.company && (
                      <span className="text-xs text-slate-500 font-normal ml-1">({clientInfo.company})</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    {inst.address}{inst.city ? `, ${inst.city}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-3 border-t border-white/5">
                  <span className="bg-slate-800/60 px-2 py-1 rounded">{inst.panelCount} paneles</span>
                  {inst.systemPowerKw && (
                    <span className="bg-slate-800/60 px-2 py-1 rounded">{inst.systemPowerKw} kW</span>
                  )}
                  {inst.installationDate && (
                    <span className="bg-slate-800/60 px-2 py-1 rounded">
                      {new Date(inst.installationDate).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/dashboard/installations/${inst.id}`}
                    className="text-sky-400 hover:text-sky-300 text-sm transition-colors"
                  >
                    Ver detalle →
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-lg font-bold text-slate-100">Nueva Instalación</h2>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Cliente *</label>
                    <select
                      required
                      value={form.clientId}
                      onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                    >
                      <option value="">Seleccionar cliente</option>
                      {(clientList as Client[]).map((c: Client) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1">Ubicación *</label>
                      <input
                        required
                        value={form.locationName}
                        onChange={(e) => setForm({ ...form, locationName: e.target.value })}
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
                        value={form.panelCount}
                        onChange={(e) => setForm({ ...form, panelCount: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Potencia (kW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={form.systemPowerKw}
                        onChange={(e) => setForm({ ...form, systemPowerKw: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Modelo Panel</label>
                      <input
                        value={form.panelModel}
                        onChange={(e) => setForm({ ...form, panelModel: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Modelo Inversor</label>
                      <input
                        value={form.inverterModel}
                        onChange={(e) => setForm({ ...form, inverterModel: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Instalación</label>
                      <input
                        type="date"
                        value={form.installationDate}
                        onChange={(e) => setForm({ ...form, installationDate: e.target.value })}
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
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:bg-slate-800/60 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Guardando...' : 'Crear Instalación'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
