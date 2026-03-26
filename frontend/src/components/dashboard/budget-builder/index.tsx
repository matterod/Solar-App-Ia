"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  budgets,
  Budget,
  Client,
  Installation,
  Product,
} from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { handleApiError } from "@/lib/handle-api-error";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ItemForm {
  product_id?: string;
  description: string;
  quantity: string;
  unit_price: string;
  sort_order: number;
}

interface BudgetForm {
  client_id: string;
  installation_id: string;
  title: string;
  description: string;
  tax_rate: string;
  valid_until: string;
  notes: string;
  items: ItemForm[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return "$0";
  return `$${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const emptyItem = (): ItemForm => ({
  description: "",
  quantity: "1",
  unit_price: "0",
  sort_order: 0,
});

const emptyForm = (): BudgetForm => ({
  client_id: "",
  installation_id: "",
  title: "",
  description: "",
  tax_rate: "21",
  valid_until: "",
  notes: "",
  items: [emptyItem()],
});

function budgetToForm(b: Budget): BudgetForm {
  return {
    client_id: b.client_id || "",
    installation_id: b.installation_id || "",
    title: b.title,
    description: b.description || "",
    tax_rate: String(b.tax_rate),
    valid_until: b.valid_until || "",
    notes: b.notes || "",
    items:
      b.items.length > 0
        ? b.items.map((it) => ({
            product_id: it.product_id || undefined,
            description: it.description,
            quantity: String(it.quantity),
            unit_price: String(it.unit_price),
            sort_order: it.sort_order,
          }))
        : [emptyItem()],
  };
}

function buildPayload(form: BudgetForm) {
  return {
    client_id: form.client_id || undefined,
    installation_id: form.installation_id || undefined,
    title: form.title,
    description: form.description || undefined,
    tax_rate: parseFloat(form.tax_rate) || 21,
    valid_until: form.valid_until || undefined,
    notes: form.notes || undefined,
    items: form.items.map((item, i) => ({
      product_id: item.product_id || undefined,
      description: item.description,
      quantity: parseFloat(item.quantity) || 1,
      unit_price: parseFloat(item.unit_price) || 0,
      sort_order: i,
    })),
  };
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface BudgetBuilderFormProps {
  onSuccess: () => void;
  budgetToEdit?: Budget;
  clients: Client[];
  installations: Installation[];
  products: Product[];
}

// ── Component ──────────────────────────────────────────────────────────────────

export function BudgetBuilderForm({
  onSuccess,
  budgetToEdit,
  clients,
  installations,
  products,
}: BudgetBuilderFormProps) {
  const queryClient = useQueryClient();
  const isEditing = budgetToEdit != null;

  // Draft editor state — all client-side, never touches React Query cache
  const [form, setForm] = useState<BudgetForm>(() =>
    budgetToEdit ? budgetToForm(budgetToEdit) : emptyForm()
  );

  // Product dropdown UI state
  const [productSearch, setProductSearch] = useState<string>("");
  const [showProductDropdown, setShowProductDropdown] = useState<number | null>(null);

  // ── Computed totals (useMemo — no re-derive on every render) ──
  const itemTotals = useMemo(
    () =>
      form.items.map((item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        return qty * price;
      }),
    [form.items]
  );

  const subtotal = useMemo(
    () => itemTotals.reduce((sum, t) => sum + t, 0),
    [itemTotals]
  );

  const taxAmount = useMemo(
    () => subtotal * ((parseFloat(form.tax_rate) || 0) / 100),
    [subtotal, form.tax_rate]
  );

  const total = subtotal + taxAmount;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation<Budget, Error, ReturnType<typeof buildPayload>>({
    mutationFn: (data) => budgets.create(data as Parameters<typeof budgets.create>[0]),
    onSuccess: () => {
      toast.success("Presupuesto creado");
      queryClient.invalidateQueries({ queryKey: queryKeys.presupuestos.all() });
      onSuccess();
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });

  const updateMutation = useMutation<Budget, Error, { id: string; data: ReturnType<typeof buildPayload> }>({
    mutationFn: ({ id, data }) => budgets.update(id, data),
    onSuccess: () => {
      toast.success("Presupuesto guardado");
      queryClient.invalidateQueries({ queryKey: queryKeys.presupuestos.all() });
      onSuccess();
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── Line item handlers ─────────────────────────────────────────────────────

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem(), sort_order: prev.items.length }],
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const selectProduct = (index: number, product: Product) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = {
        ...items[index],
        product_id: product.id,
        description: product.name,
        unit_price: String(product.sale_price ?? product.unit_cost ?? 0),
      };
      return { ...prev, items };
    });
    setShowProductDropdown(null);
    setProductSearch("");
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload = buildPayload(form);
    if (isEditing && budgetToEdit) {
      updateMutation.mutate({ id: budgetToEdit.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Filtered products for dropdown ────────────────────────────────────────

  const filteredProducts = useMemo(
    () =>
      productSearch
        ? products.filter((p) =>
            p.name.toLowerCase().includes(productSearch.toLowerCase())
          )
        : products,
    [products, productSearch]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* General Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Información General
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Título *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Instalación Solar Residencial 5kW"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cliente
            </label>
            <select
              value={form.client_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, client_id: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instalación{" "}
              <span className="text-slate-400">(opcional)</span>
            </label>
            <select
              value={form.installation_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, installation_id: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
            >
              <option value="">Sin instalación</option>
              {installations.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.location_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              IVA (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.tax_rate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tax_rate: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Válido hasta
            </label>
            <input
              type="date"
              value={form.valid_until}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, valid_until: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Ítems</h3>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium hover:bg-sky-100 transition-colors flex items-center gap-1"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Agregar Ítem
          </button>
        </div>

        <div className="space-y-3">
          {form.items.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-slate-300">
                  #{idx + 1}
                </span>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="ml-auto p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Product search */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={showProductDropdown === idx ? productSearch : ""}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(idx);
                  }}
                  onFocus={() => setShowProductDropdown(idx)}
                  placeholder="Buscar producto del inventario..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                />
                <AnimatePresence>
                  {showProductDropdown === idx && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-10 max-h-40 overflow-y-auto"
                    >
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-slate-400 p-3">Sin resultados</p>
                      ) : (
                        filteredProducts.slice(0, 10).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectProduct(idx, p)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 transition-colors flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-700">
                              {p.name}
                            </span>
                            <span className="text-slate-400">
                              {p.sale_price
                                ? formatCurrency(p.sale_price)
                                : p.unit_cost
                                ? formatCurrency(p.unit_cost)
                                : "Sin precio"}
                            </span>
                          </button>
                        ))
                      )}
                      <button
                        type="button"
                        onClick={() => setShowProductDropdown(null)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-400 border-t border-slate-100 hover:bg-slate-50"
                      >
                        Cerrar / Ítem libre
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Item fields */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    Descripción
                  </label>
                  <input
                    required
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white text-right focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    P. Unitario
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white text-right focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    Total
                  </label>
                  <div className="px-2.5 py-2 rounded-lg bg-slate-100 text-xs text-right font-semibold text-slate-700">
                    {formatCurrency(itemTotals[idx])}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-semibold text-slate-700">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm border-t border-slate-100">
          <span className="text-slate-500">IVA ({form.tax_rate || 0}%)</span>
          <span className="font-semibold text-slate-700">
            {formatCurrency(taxAmount)}
          </span>
        </div>
        <div className="flex justify-between px-4 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white">
          <span className="font-bold">TOTAL</span>
          <span className="font-bold text-lg">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Notas / Condiciones
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Condiciones de pago, garantías, etc."
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 resize-none"
        />
      </div>

      {/* Footer actions — sticky at bottom of form scroll */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 transition-all"
        >
          {isSaving
            ? "Guardando..."
            : isEditing
            ? "Guardar Cambios"
            : "Crear Presupuesto"}
        </button>
      </div>

      {/* Click outside product dropdown to close */}
      {showProductDropdown !== null && (
        <div
          className="fixed inset-0 z-[45]"
          onClick={() => {
            setShowProductDropdown(null);
            setProductSearch("");
          }}
        />
      )}
    </form>
  );
}
