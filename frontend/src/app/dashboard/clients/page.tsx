'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { queryKeys } from '@/lib/query-keys'
import { clients, Client } from '@/services/api'
import { handleApiError } from '@/lib/handle-api-error'
import { useURLState } from '@/hooks/use-url-state'
import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'

export default function ClientsPage() {
  const queryClient = useQueryClient()

  // URL-driven filter state
  const [search, setSearch] = useURLState<string>('search', '')
  const [page, setPage] = useURLState('page', 1)

  // Create modal state
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    city: '', province: '', address: '', notes: '',
  })

  const filters = { search: search || undefined, page }

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => clients.list(search || undefined),
    staleTime: 1000 * 60 * 2,
  })

  if (isError) {
    handleApiError(error)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await clients.create(form)
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', company: '', city: '', province: '', address: '', notes: '' })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all() })
    } catch (err) {
      handleApiError(err)
    }
    setSaving(false)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    try {
      await clients.delete(id)
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all() })
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-50">Clientes</h1>
          <p className="text-sm text-slate-400 mt-1">
            {data.length} cliente{data.length !== 1 ? 's' : ''} registrado{data.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value as string); setPage(1) }}
          placeholder="Buscar por nombre..."
          className="w-full sm:w-80 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40 transition-all"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <DataTableSkeleton rows={8} columns={5} />
      ) : data.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            {search ? 'No se encontraron clientes' : 'No hay clientes aún'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {search ? 'Probá con otro término de búsqueda.' : 'Creá tu primer cliente para empezar.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 transition-colors"
            >
              + Crear Primer Cliente
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((client: Client, i: number) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-900/60 rounded-2xl p-5 border border-white/5 hover:border-white/10 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white text-sm font-bold shadow-sm shrink-0">
                    {client.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-100 truncate">{client.name}</h3>
                    {client.company && <p className="text-xs text-slate-400 truncate">{client.company}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, client.id)}
                    className="sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                    title="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-400">
                {client.email && <p className="flex items-center gap-2"><span>✉</span> {client.email}</p>}
                {client.phone && <p className="flex items-center gap-2"><span>📱</span> {client.phone}</p>}
                {client.city && (
                  <p className="flex items-center gap-2">
                    <span>📍</span> {client.city}{client.province ? `, ${client.province}` : ''}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-[10px] text-slate-500">
                  Creado: {new Date(client.created_at).toLocaleDateString('es-AR')}
                </p>
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="text-sky-400 hover:text-sky-300 text-sm transition-colors"
                >
                  Ver detalles →
                </Link>
              </div>
            </motion.div>
          ))}
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
                  <h2 className="text-lg font-bold text-slate-100">Nuevo Cliente</h2>
                  <p className="text-sm text-slate-400">Completá los datos del cliente</p>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1">Nombre *</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Empresa</label>
                      <input
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Ciudad</label>
                      <input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Provincia</label>
                      <input
                        value={form.province}
                        onChange={(e) => setForm({ ...form, province: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Dirección</label>
                      <input
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1">Notas</label>
                      <textarea
                        rows={2}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40 resize-none"
                      />
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
                      className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Guardando...' : 'Crear Cliente'}
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
