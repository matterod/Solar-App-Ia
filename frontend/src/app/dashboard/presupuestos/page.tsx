"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { handleApiError } from "@/lib/handle-api-error";
import { useURLState } from "@/hooks/use-url-state";
import {
  budgets,
  Budget,
  BudgetListItem,
  clients,
  installations,
  products,
} from "@/services/api";
import { BudgetBuilderForm } from "@/components/dashboard/budget-builder";

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Borrador", bg: "bg-slate-800", text: "text-slate-400" },
  sent: { label: "Enviado", bg: "bg-sky-100", text: "text-sky-700" },
  approved: { label: "Aprobado", bg: "bg-emerald-100", text: "text-emerald-700" },
  rejected: { label: "Rechazado", bg: "bg-red-100", text: "text-red-700" },
};

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return "$0";
  return `$${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: string | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PresupuestosPage() {
  const queryClient = useQueryClient();

  // URL-driven filter state
  const [search, setSearch] = useURLState<string>("search", "");
  const [statusFilter, setStatusFilter] = useURLState<string>("status", "");
  const [page, setPage] = useURLState<number>("page", 1);

  // UI panel state — no network data, no computations
  const [showBuilder, setShowBuilder] = useState<boolean>(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);

  // ── React Query: list ────────────────────────────────────────────────────────

  const filters = {
    search: search || undefined,
    status: statusFilter || undefined,
    page,
  };

  const {
    data: listData = [],
    isLoading: listLoading,
  } = useQuery<BudgetListItem[]>({
    queryKey: queryKeys.presupuestos.list(filters),
    queryFn: () =>
      budgets.list({
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    staleTime: 1000 * 60 * 2,
  });

  // ── React Query: lookup data for builder ─────────────────────────────────────

  const { data: clientList = [] } = useQuery({
    queryKey: queryKeys.clients.all(),
    queryFn: () => clients.list(),
    staleTime: 1000 * 60 * 5,
    enabled: showBuilder,
  });

  const { data: installationList = [] } = useQuery({
    queryKey: queryKeys.installations.all(),
    queryFn: () => installations.list(),
    staleTime: 1000 * 60 * 5,
    enabled: showBuilder,
  });

  const { data: productList = [] } = useQuery({
    queryKey: queryKeys.inventory.all(),
    queryFn: () => products.list(),
    staleTime: 1000 * 60 * 5,
    enabled: showBuilder,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => budgets.delete(id),
    onSuccess: () => {
      toast.success("Presupuesto eliminado");
      queryClient.invalidateQueries({ queryKey: queryKeys.presupuestos.all() });
    },
    onError: (error) => handleApiError(error),
  });

  const statusMutation = useMutation<
    Budget,
    Error,
    { id: string; status: string }
  >({
    mutationFn: ({ id, status }) => budgets.updateStatus(id, status),
    onSuccess: async (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.presupuestos.all() });
      // Refresh detail panel if open for this budget
      if (detailBudget?.id === updated.id) {
        setDetailBudget(updated);
      }
    },
    onError: (error) => handleApiError(error),
  });

  const duplicateMutation = useMutation<Budget, Error, string>({
    mutationFn: (id: string) => budgets.duplicate(id),
    onSuccess: () => {
      toast.success("Presupuesto duplicado");
      queryClient.invalidateQueries({ queryKey: queryKeys.presupuestos.all() });
    },
    onError: (error) => handleApiError(error),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setBudgetToEdit(null);
    setShowBuilder(true);
  };

  const openEdit = async (id: string) => {
    try {
      const b = await budgets.get(id);
      setBudgetToEdit(b);
      setShowBuilder(true);
    } catch (err) {
      handleApiError(err);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const b = await budgets.get(id);
      setDetailBudget(b);
      setShowDetail(true);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleBuilderSuccess = () => {
    setShowBuilder(false);
    setBudgetToEdit(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    deleteMutation.mutate(id);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  const handleDownloadPdf = async (id: string, budgetNumber?: string) => {
    try {
      await budgets.downloadPdf(id, `${budgetNumber || "presupuesto"}.pdf`);
    } catch (err) {
      handleApiError(err);
    }
  };

  // ── Stats (derived from list data) ───────────────────────────────────────────

  const stats = {
    total: listData.length,
    draft: listData.filter((b) => b.status === "draft").length,
    sent: listData.filter((b) => b.status === "sent").length,
    approved: listData.filter((b) => b.status === "approved").length,
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Presupuestos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona tus cotizaciones y propuestas
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nuevo Presupuesto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-slate-100" },
          { label: "Borradores", value: stats.draft, color: "text-slate-500" },
          { label: "Enviados", value: stats.sent, color: "text-sky-600" },
          { label: "Aprobados", value: stats.approved, color: "text-emerald-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-slate-900 rounded-2xl border border-white/10 p-4 shadow-sm"
          >
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar presupuesto..."
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviado</option>
          <option value="approved">Aprobado</option>
          <option value="rejected">Rechazado</option>
        </select>
      </div>

      {/* Content */}
      {listLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-900 rounded-2xl border border-white/10 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-5 w-28 bg-slate-700 rounded" />
                <div className="h-5 w-48 bg-slate-800 rounded" />
                <div className="ml-auto h-5 w-24 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : listData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            {search || statusFilter ? "Sin resultados" : "No hay presupuestos aún"}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {search || statusFilter
              ? "Probá con otros filtros."
              : "Creá tu primer presupuesto para comenzar."}
          </p>
          {!search && !statusFilter && (
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 transition-colors"
            >
              + Crear Primer Presupuesto
            </button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {listData.map((b, i) => {
              const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-slate-900 rounded-2xl border border-white/10 p-4 shadow-sm hover:shadow-md hover:border-sky-900 transition-all cursor-pointer"
                  onClick={() => openDetail(b.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-400">
                        {b.budget_number}
                      </p>
                      <p className="font-semibold text-slate-100 text-sm truncate">
                        {b.title}
                      </p>
                      {b.client_name && (
                        <p className="text-xs text-slate-500">{b.client_name}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${st.bg} ${st.text} shrink-0`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-100">
                      {formatCurrency(b.total)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(b.created_at)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-slate-900 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 border-b border-white/10 text-slate-500">
                <tr>
                  <th className="font-semibold py-4 px-6">N&deg;</th>
                  <th className="font-semibold py-4 px-6">Título</th>
                  <th className="font-semibold py-4 px-6">Cliente</th>
                  <th className="font-semibold py-4 px-6">Estado</th>
                  <th className="font-semibold py-4 px-6 text-right">Total</th>
                  <th className="font-semibold py-4 px-6">Fecha</th>
                  <th className="font-semibold py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {listData.map((b, i) => {
                  const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
                  return (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-950 transition-colors"
                    >
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {b.budget_number}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-100">{b.title}</p>
                        {b.installation_name && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {b.installation_name}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {b.client_name || (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${st.bg} ${st.text}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-100">
                        {formatCurrency(b.total)}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {formatDate(b.created_at)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetail(b.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Ver detalle"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.8}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadPdf(
                                b.id,
                                b.budget_number ?? undefined
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Descargar PDF"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.8}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                              />
                            </svg>
                          </button>
                          {b.status === "draft" && (
                            <>
                              <button
                                onClick={() => openEdit(b.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                                title="Editar"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.8}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(b.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Eliminar"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.8}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Builder Slide-In Panel ── */}
      <AnimatePresence>
        {showBuilder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowBuilder(false);
                setBudgetToEdit(null);
              }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-screen w-full max-w-2xl bg-slate-900 shadow-2xl flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    {budgetToEdit ? "Editar Presupuesto" : "Nuevo Presupuesto"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Completa los datos y agregá los ítems
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBuilder(false);
                    setBudgetToEdit(null);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Panel Body — BudgetBuilderForm owns all draft state */}
              <BudgetBuilderForm
                key={budgetToEdit?.id ?? "new"}
                onSuccess={handleBuilderSuccess}
                budgetToEdit={budgetToEdit ?? undefined}
                clients={clientList}
                installations={installationList}
                products={productList}
              />

              {/* Footer cancel button — outside the form so it doesn't submit */}
              <div className="flex items-center justify-start px-6 py-4 border-t border-white/10 shrink-0 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowBuilder(false);
                    setBudgetToEdit(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:bg-slate-950"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Detail Slide-In Panel ── */}
      <AnimatePresence>
        {showDetail && detailBudget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDetail(false);
                setDetailBudget(null);
              }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-screen w-full max-w-2xl bg-slate-900 shadow-2xl flex flex-col"
            >
              {/* Detail Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <div>
                  <p className="text-xs font-mono text-slate-400">
                    {detailBudget.budget_number}
                  </p>
                  <h2 className="text-lg font-bold text-slate-100">
                    {detailBudget.title}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setDetailBudget(null);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Actions bar */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleDownloadPdf(
                        detailBudget.id,
                        detailBudget.budget_number ?? undefined
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium hover:bg-sky-100 transition-colors flex items-center gap-1.5"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => handleDuplicate(detailBudget.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.5a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                      />
                    </svg>
                    Duplicar
                  </button>

                  {/* Status transitions */}
                  {detailBudget.status === "draft" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusChange(detailBudget.id, "sent")
                        }
                        className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium hover:bg-sky-400 transition-colors flex items-center gap-1.5"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                          />
                        </svg>
                        Marcar como Enviado
                      </button>
                      <button
                        onClick={() => openEdit(detailBudget.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors"
                      >
                        Editar
                      </button>
                    </>
                  )}
                  {detailBudget.status === "sent" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusChange(detailBudget.id, "approved")
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-400 transition-colors"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(detailBudget.id, "rejected")
                        }
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {detailBudget.status === "rejected" && (
                    <button
                      onClick={() =>
                        handleStatusChange(detailBudget.id, "draft")
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors"
                    >
                      Volver a Borrador
                    </button>
                  )}
                </div>

                {/* Status + Dates */}
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const st =
                      STATUS_CONFIG[detailBudget.status] ||
                      STATUS_CONFIG.draft;
                    return (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}
                      >
                        {st.label}
                      </span>
                    );
                  })()}
                  <span className="text-xs text-slate-400">
                    Creado: {formatDate(detailBudget.created_at)}
                  </span>
                  {detailBudget.valid_until && (
                    <span className="text-xs text-slate-400">
                      Válido hasta: {formatDate(detailBudget.valid_until)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {detailBudget.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Descripción
                    </h4>
                    <p className="text-sm text-slate-400">
                      {detailBudget.description}
                    </p>
                  </div>
                )}

                {/* Items table */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Ítems ({detailBudget.items.length})
                  </h4>
                  <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-950 border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-4 text-left text-xs font-semibold text-slate-500">
                            #
                          </th>
                          <th className="py-2.5 px-4 text-left text-xs font-semibold text-slate-500">
                            Descripción
                          </th>
                          <th className="py-2.5 px-4 text-right text-xs font-semibold text-slate-500">
                            Cant.
                          </th>
                          <th className="py-2.5 px-4 text-right text-xs font-semibold text-slate-500">
                            P. Unit.
                          </th>
                          <th className="py-2.5 px-4 text-right text-xs font-semibold text-slate-500">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {detailBudget.items
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((item, idx) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-950 transition-colors"
                            >
                              <td className="py-3 px-4 text-slate-400 text-xs">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-200">
                                {item.description}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-400">
                                {item.quantity}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-400">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-100">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 rounded-xl border border-white/10 overflow-hidden">
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(detailBudget.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-sm border-t border-white/10">
                      <span className="text-slate-500">
                        IVA ({detailBudget.tax_rate}%)
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(detailBudget.tax_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white">
                      <span className="font-bold">TOTAL</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(detailBudget.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {detailBudget.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Notas
                    </h4>
                    <div className="bg-slate-950 rounded-lg p-4 text-sm text-slate-400 whitespace-pre-wrap border border-white/10">
                      {detailBudget.notes}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
