"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { queryKeys } from "@/lib/query-keys";
import { products, Product } from "@/services/api";
import { handleApiError } from "@/lib/handle-api-error";
import { useURLState } from "@/hooks/use-url-state";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/dashboard/data-table";
import { DataTableSkeleton } from "@/components/dashboard/data-table/skeleton";

const CATEGORY_LABELS: Record<string, string> = {
  panels: "Paneles",
  inverters: "Inversores",
  structures: "Estructuras",
  cables: "Cables",
  accessories: "Accesorios",
  tools: "Herramientas",
};

const EMPTY_FORM = {
  name: "",
  sku: "",
  description: "",
  category: "",
  unit: "unidades",
  current_stock: "0",
  min_stock: "0",
  unit_cost: "",
};

type FormState = typeof EMPTY_FORM;

export default function InventoryPage() {
  const queryClient = useQueryClient();

  // URL-driven filter state
  const [search, setSearch] = useURLState<string>("search", "");
  const [showLowStock, setShowLowStock] = useURLState<boolean>("low_stock", false);
  const [sort, setSort] = useURLState<string>("sort", "name");

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const filters = {
    search: search || undefined,
    low_stock: showLowStock || undefined,
    sort: sort || undefined,
  };

  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.inventory.list({ search: search || undefined, low_stock: showLowStock || undefined, sort: sort || undefined }),
    queryFn: () => products.list(filters),
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: (formData: Partial<Product>) => products.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      setIsFormOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      products.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      setIsFormOpen(false);
      setEditingProduct(null);
      setForm(EMPTY_FORM);
    },
    onError: (error) => handleApiError(error),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku ?? "",
      description: product.description ?? "",
      category: product.category ?? "",
      unit: product.unit,
      current_stock: String(product.current_stock),
      min_stock: String(product.min_stock),
      unit_cost: product.unit_cost != null ? String(product.unit_cost) : "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Product> = {
      ...form,
      current_stock: parseFloat(form.current_stock) || 0,
      min_stock: parseFloat(form.min_stock) || 0,
      unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : undefined,
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      key: "name" as const,
      header: "Producto",
      render: (p: Product) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              p.current_stock <= p.min_stock ? "bg-orange-500" : "bg-emerald-500"
            }`}
          />
          <p className="font-semibold text-slate-100">{p.name}</p>
        </div>
      ),
    },
    {
      key: "sku" as const,
      header: "Código",
      render: (p: Product) =>
        p.sku ? (
          <span className="font-mono text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded">
            {p.sku}
          </span>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        ),
    },
    {
      key: "category" as const,
      header: "Categoría",
      render: (p: Product) =>
        p.category ? (
          <Badge status="neutral">{CATEGORY_LABELS[p.category] ?? p.category}</Badge>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        ),
    },
    {
      key: "unit_cost" as const,
      header: "Precio Unit.",
      render: (p: Product) =>
        p.unit_cost != null ? (
          <span className="text-slate-300">${p.unit_cost.toLocaleString()}</span>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      key: "current_stock" as const,
      header: "Stock",
      render: (p: Product) => {
        const isLow = p.current_stock <= p.min_stock;
        return (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-baseline gap-1.5">
              {isLow ? (
                <Badge status="low_stock">
                  {p.current_stock} {p.unit}
                </Badge>
              ) : (
                <span className="text-sm font-semibold text-slate-100">
                  {p.current_stock}{" "}
                  <span className="text-xs font-normal text-slate-400">{p.unit}</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">Mín: {p.min_stock}</span>
          </div>
        );
      },
    },
    {
      key: "id" as const,
      header: "Acciones",
      className: "text-right",
      render: (p: Product) => (
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
          >
            Editar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-50">Inventario</h1>
          <p className="text-sm text-slate-400 mt-1">
            {data.length} producto{data.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-medium shadow-md shadow-violet-500/20 hover:from-violet-400 hover:to-violet-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar Producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value as string)}
          placeholder="Buscar por nombre o código..."
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 transition-all"
        />
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            showLowStock
              ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
              : "bg-slate-900/60 border-white/10 text-slate-400 hover:bg-slate-800/60"
          }`}
        >
          Stock Bajo
        </button>
        <div className="flex gap-2 sm:ml-auto">
          {[
            { value: "name", label: "Nombre" },
            { value: "price_asc", label: "Precio ↑" },
            { value: "price_desc", label: "Precio ↓" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                sort === opt.value
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                  : "bg-slate-900/60 border-white/10 text-slate-400 hover:bg-slate-800/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <DataTableSkeleton rows={10} columns={5} />
      ) : data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            {search || showLowStock ? "Sin resultados" : "No hay productos aún"}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {search
              ? "Probá con otro término."
              : showLowStock
              ? "No hay productos con stock bajo."
              : "Agregá tu primer producto al inventario."}
          </p>
          {!search && !showLowStock && (
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors"
            >
              + Agregar Primer Producto
            </button>
          )}
        </motion.div>
      ) : (
        <DataTable<Product>
          columns={columns}
          data={data}
          keyExtractor={(p) => p.id}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
          setForm(EMPTY_FORM);
        }}
        title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nombre *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
              >
                <option value="">Sin categoría</option>
                <option value="panels">Paneles</option>
                <option value="inverters">Inversores</option>
                <option value="structures">Estructuras</option>
                <option value="cables">Cables</option>
                <option value="accessories">Accesorios</option>
                <option value="tools">Herramientas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Unidad</label>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Stock {editingProduct ? "Actual" : "Inicial"}
              </label>
              <input
                type="number"
                min="0"
                value={form.current_stock}
                onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Costo Unitario
              </label>
              <input
                type="number"
                step="0.01"
                value={form.unit_cost}
                onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingProduct(null);
                setForm(EMPTY_FORM);
              }}
              className="px-4 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 disabled:opacity-50 transition-colors"
            >
              {isSaving
                ? "Guardando..."
                : editingProduct
                ? "Guardar Cambios"
                : "Agregar Producto"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
