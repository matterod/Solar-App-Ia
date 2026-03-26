'use client'

import { use, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { installations, costs, Cost } from '@/services/api'
import { handleApiError } from '@/lib/handle-api-error'
import { DataTable } from '@/components/dashboard/data-table'
import { DataTableSkeleton } from '@/components/dashboard/data-table/skeleton'

interface PageProps {
  params: Promise<{ id: string }>
}

const costTypeLabels: Record<string, string> = {
  food: 'Comida / Viáticos',
  materials: 'Materiales / Stock',
  vehicle: 'Combustible / Vehículo',
  lodging: 'Alojamiento',
  other: 'Otros',
}

export default function InstallationCostsPage({ params }: PageProps) {
  const { id } = use(params)
  const queryClient = useQueryClient()

  // Same key as layout — served from cache, zero re-fetch
  const { data: installation } = useQuery({
    queryKey: queryKeys.installations.detail(id),
    queryFn: () => installations.get(id),
    staleTime: 1000 * 60 * 5,
  })

  // Separate query for costs list
  const { data: costsList = [], isLoading } = useQuery({
    queryKey: queryKeys.costs.byInstallation(id),
    queryFn: () => costs.list(id),
    enabled: !!id,
  })

  // Create cost form state
  const [showCostForm, setShowCostForm] = useState(false)
  const [addingCost, setAddingCost] = useState(false)
  const [costForm, setCostForm] = useState({
    cost_type: 'materials',
    amount: '',
    quantity: '1',
    description: '',
    cost_date: new Date().toISOString().split('T')[0],
  })

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!installation) return
    setAddingCost(true)
    try {
      await costs.create({
        installation_id: installation.id,
        cost_type: costForm.cost_type,
        amount: parseFloat(costForm.amount),
        quantity: parseInt(costForm.quantity) || 1,
        description: costForm.description,
        cost_date: costForm.cost_date,
      })
      setCostForm({
        cost_type: 'materials',
        amount: '',
        quantity: '1',
        description: '',
        cost_date: new Date().toISOString().split('T')[0],
      })
      setShowCostForm(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.costs.byInstallation(id) })
    } catch (err) {
      handleApiError(err)
    } finally {
      setAddingCost(false)
    }
  }

  const handleDeleteCost = async (costId: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    try {
      await costs.delete(costId)
      queryClient.invalidateQueries({ queryKey: queryKeys.costs.byInstallation(id) })
    } catch (err) {
      handleApiError(err)
    }
  }

  const total = (costsList as Cost[]).reduce((acc, c) => acc + c.amount * c.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Total summary */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-sky-300 mb-1">
            Gasto Total Acumulado
          </p>
          <p className="text-2xl font-bold text-sky-100">
            ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-3xl opacity-60">💵</div>
      </div>

      {/* Costs table */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Historial de Gastos ({(costsList as Cost[]).length})
        </h2>
        {isLoading ? (
          <DataTableSkeleton rows={5} columns={4} />
        ) : (
          <DataTable
            columns={[
              {
                key: 'cost_type',
                header: 'Tipo',
                render: (cost) => (
                  <span className="text-slate-200">
                    {costTypeLabels[cost.cost_type] ?? cost.cost_type}
                  </span>
                ),
              },
              {
                key: 'description',
                header: 'Descripción',
                render: (cost) => (
                  <span className="text-slate-300">{cost.description || '—'}</span>
                ),
              },
              {
                key: 'cost_date',
                header: 'Fecha',
                render: (cost) => (
                  <span className="text-slate-400">
                    {new Date(cost.cost_date).toLocaleDateString('es-AR')}
                  </span>
                ),
              },
              {
                key: 'amount',
                header: 'Total',
                render: (cost) => (
                  <span className="font-semibold text-slate-100">
                    ${(cost.amount * cost.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    {cost.quantity > 1 && (
                      <span className="ml-1 text-xs text-slate-500 font-normal">
                        ({cost.quantity}x ${cost.amount.toLocaleString('es-AR')})
                      </span>
                    )}
                  </span>
                ),
              },
              {
                key: 'id',
                header: '',
                render: (cost) => (
                  <button
                    onClick={() => handleDeleteCost(cost.id)}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-all"
                    title="Eliminar gasto"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ),
              },
            ]}
            data={costsList as Cost[]}
            keyExtractor={(cost) => cost.id}
            emptyMessage="No hay gastos registrados aún."
          />
        )}
      </div>

      {/* Add cost toggle + form */}
      {!showCostForm ? (
        <button
          onClick={() => setShowCostForm(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 text-sm font-medium text-slate-400 hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/5 transition-all flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar Gasto Manualmente
        </button>
      ) : (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100">Registrar Gasto</h3>
            <button
              onClick={() => setShowCostForm(false)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕ Cerrar
            </button>
          </div>
          <form onSubmit={handleAddCost} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Tipo</label>
              <select
                value={costForm.cost_type}
                onChange={(e) => setCostForm({ ...costForm, cost_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="food">Comida / Viáticos</option>
                <option value="materials">Materiales / Stock</option>
                <option value="vehicle">Combustible / Vehículo</option>
                <option value="lodging">Alojamiento</option>
                <option value="other">Otros</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
              <input
                type="date"
                value={costForm.cost_date}
                onChange={(e) => setCostForm({ ...costForm, cost_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Monto (Unitario)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={costForm.amount}
                  onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={costForm.quantity}
                onChange={(e) => setCostForm({ ...costForm, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Descripción</label>
              <input
                value={costForm.description}
                onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Ej: Tornillería extra, almuerzo equipo..."
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCostForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/60 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={addingCost}
                className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-bold shadow-md shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-50 transition-all"
              >
                {addingCost ? 'Guardando...' : 'Agregar Gasto'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
