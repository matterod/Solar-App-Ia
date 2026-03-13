"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { installations, Installation, clients, Client } from "@/services/api";

const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-slate-100 text-slate-600" },
    in_progress: { label: "En Progreso", color: "bg-sky-100 text-sky-700" },
    completed: { label: "Completada", color: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700" },
};

export default function InstallationsPage() {
    const [data, setData] = useState<Installation[]>([]);
    const [clientList, setClientList] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        client_id: "", location_name: "", address: "", city: "", province: "",
        panel_count: "0", panel_model: "", inverter_model: "", inverter_count: "1",
        system_power_kw: "", installation_date: "", status: "pending", description: "",
    });

    const load = () => {
        setLoading(true);
        installations.list({ search: search || undefined, status: filterStatus || undefined })
            .then(setData).catch(() => setData([])).finally(() => setLoading(false));
    };

    useEffect(() => { load(); clients.list().then(setClientList).catch(() => { }); }, []);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [search, filterStatus]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await installations.create({
                ...form,
                panel_count: parseInt(form.panel_count) || 0,
                inverter_count: parseInt(form.inverter_count) || 1,
                system_power_kw: form.system_power_kw ? parseFloat(form.system_power_kw) : undefined,
                installation_date: form.installation_date || undefined,
            });
            setShowModal(false);
            setForm({ client_id: "", location_name: "", address: "", city: "", province: "", panel_count: "0", panel_model: "", inverter_model: "", inverter_count: "1", system_power_kw: "", installation_date: "", status: "pending", description: "" });
            load();
        } catch { /* */ }
        setSaving(false);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Instalaciones</h1>
                    <p className="text-sm text-slate-500 mt-1">{data.length} instalaci{data.length !== 1 ? "ones" : "ón"}</p>
                </div>
                <button onClick={() => { if (clientList.length === 0) { alert("Primero creá un cliente."); return; } setShowModal(true); }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Nueva Instalación
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ubicación..."
                    className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
                            <div className="h-5 w-40 bg-slate-200 rounded mb-3" />
                            <div className="h-4 w-32 bg-slate-100 rounded mb-1" />
                            <div className="h-4 w-28 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : data.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <div className="text-5xl mb-4">⚡</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{search || filterStatus ? "Sin resultados" : "No hay instalaciones aún"}</h3>
                    <p className="text-sm text-slate-500 mb-4">{search || filterStatus ? "Probá con otros filtros." : "Creá tu primera instalación."}</p>
                    {!search && !filterStatus && clientList.length > 0 && (
                        <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-colors">
                            + Crear Primera Instalación
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((inst, i) => {
                        const s = statusLabels[inst.status] || { label: inst.status, color: "bg-slate-100 text-slate-600" };
                        const clientInfo = clientList.find(c => c.id === inst.client_id);
                        return (
                            <motion.div key={inst.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-semibold text-slate-900">{inst.location_name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${s.color}`}>{s.label}</span>
                                    </div>
                                    <p className="text-sm font-medium text-sky-600 mb-3 flex items-center gap-1.5">
                                        👤 {clientInfo?.name || "Cliente Desconocido"}
                                        {clientInfo?.company && <span className="text-xs text-slate-400 font-normal">({clientInfo.company})</span>}
                                    </p>
                                    <p className="text-sm text-slate-500 mb-4">📍 {inst.address}{inst.city ? `, ${inst.city}` : ""}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-3 border-t border-slate-50">
                                    <span className="bg-slate-50 px-2 py-1 rounded">🔲 {inst.panel_count} paneles</span>
                                    {inst.system_power_kw && <span className="bg-slate-50 px-2 py-1 rounded">⚡ {inst.system_power_kw} kW</span>}
                                    {inst.installation_date && <span className="bg-slate-50 px-2 py-1 rounded">📅 {new Date(inst.installation_date).toLocaleDateString("es-AR")}</span>}
                                </div>
                            </motion.div>
                        );
                    })}
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
                                    <h2 className="text-lg font-bold text-slate-900">Nueva Instalación</h2>
                                </div>
                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
                                        <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400">
                                            <option value="">Seleccionar cliente</option>
                                            {clientList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación *</label>
                                            <input required value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección *</label>
                                            <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                                            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Provincia</label>
                                            <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Paneles</label>
                                            <input type="number" min="0" value={form.panel_count} onChange={(e) => setForm({ ...form, panel_count: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Potencia (kW)</label>
                                            <input type="number" step="0.1" value={form.system_power_kw} onChange={(e) => setForm({ ...form, system_power_kw: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo Panel</label>
                                            <input value={form.panel_model} onChange={(e) => setForm({ ...form, panel_model: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo Inversor</label>
                                            <input value={form.inverter_model} onChange={(e) => setForm({ ...form, inverter_model: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Instalación</label>
                                            <input type="date" value={form.installation_date} onChange={(e) => setForm({ ...form, installation_date: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400">
                                                <option value="pending">Pendiente</option>
                                                <option value="in_progress">En Progreso</option>
                                                <option value="completed">Completada</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-50">{saving ? "Guardando..." : "Crear Instalación"}</button>
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
