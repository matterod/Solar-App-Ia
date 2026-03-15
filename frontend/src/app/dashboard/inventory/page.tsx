"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { products, Product } from "@/services/api";

export default function InventoryPage() {
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showLowStock, setShowLowStock] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", sku: "", description: "", category: "", unit: "unidades", current_stock: "0", min_stock: "0", unit_cost: "" });

    const isFirstMount = useRef(true);

    const load = (silent = false) => {
        if (!silent) setLoading(true);
        products.list({ search: search || undefined, low_stock: showLowStock || undefined })
            .then(setData)
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isFirstMount.current) {
            load();
            isFirstMount.current = false;
            return;
        }
        const t = setTimeout(() => load(true), 400);
        return () => clearTimeout(t);
    }, [search, showLowStock]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await products.create({
                ...form,
                current_stock: parseFloat(form.current_stock) || 0,
                min_stock: parseFloat(form.min_stock) || 0,
                unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : undefined,
            });
            setShowModal(false);
            setForm({ name: "", sku: "", description: "", category: "", unit: "unidades", current_stock: "0", min_stock: "0", unit_cost: "" });
            load();
        } catch { /* */ }
        setSaving(false);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Inventario</h1>
                    <p className="text-sm text-slate-500 mt-1">{data.length} producto{data.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-medium shadow-md shadow-violet-500/20 hover:from-violet-400 hover:to-violet-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Agregar Producto
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..."
                    className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                <button onClick={() => setShowLowStock(!showLowStock)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showLowStock ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    ⚠ Stock Bajo
                </button>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex p-4 border-b border-slate-50 last:border-0 animate-pulse">
                            <div className="h-5 w-1/3 bg-slate-200 rounded" />
                            <div className="h-5 w-1/4 bg-slate-100 rounded ml-4" />
                            <div className="h-5 w-1/6 bg-slate-100 rounded ml-4" />
                        </div>
                    ))}
                </div>
            ) : data.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{search || showLowStock ? "Sin resultados" : "No hay productos aún"}</h3>
                    <p className="text-sm text-slate-500 mb-4">{search ? "Probá con otro término." : "Agregá tu primer producto al inventario."}</p>
                    {!search && !showLowStock && (
                        <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors">+ Agregar Primer Producto</button>
                    )}
                </motion.div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="font-semibold py-4 px-6 font-medium">Producto</th>
                                    <th className="font-semibold py-4 px-6 font-medium">Categoría</th>
                                    <th className="font-semibold py-4 px-6 font-medium">Precio Unit.</th>
                                    <th className="font-semibold py-4 px-6 font-medium text-right">Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((p, i) => {
                                    const isLow = p.current_stock <= p.min_stock;
                                    return (
                                        <motion.tr
                                            key={p.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`hover:bg-slate-50 transition-colors ${isLow ? "bg-orange-50/30" : ""}`}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{p.name}</p>
                                                        {p.sku && <p className="text-xs text-slate-500 mt-0.5">SKU: {p.sku}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {p.category ? (
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                                        {p.category}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">
                                                {p.unit_cost ? `$${p.unit_cost.toLocaleString()}` : <span className="text-slate-400">-</span>}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex flex-col items-end">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className={`text-base font-bold ${isLow ? 'text-orange-600' : 'text-slate-900'}`}>
                                                            {p.current_stock}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{p.unit}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        Mín: {p.min_stock}
                                                    </div>
                                                    {isLow && <span className="text-[10px] text-orange-600 font-semibold mt-0.5">Stock Bajo</span>}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 z-40 bg-black/50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-900">Nuevo Producto</h2>
                                </div>
                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                                            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400">
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
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                                            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial</label>
                                            <input type="number" min="0" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label>
                                            <input type="number" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Costo Unitario</label>
                                            <input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 resize-none" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 disabled:opacity-50">{saving ? "Guardando..." : "Agregar Producto"}</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
