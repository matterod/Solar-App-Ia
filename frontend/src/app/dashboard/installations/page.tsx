"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { installations, Installation, clients, Client, costs, Cost, InstallationDetail } from "@/services/api";

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

    // Detail Modal State
    const [selectedInst, setSelectedInst] = useState<InstallationDetail | null>(null);
    const [activeTab, setActiveTab] = useState<"info" | "costs" | "activities" | "maintenance">("info");
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Cost Form State
    const [costForm, setCostForm] = useState({
        cost_type: "materials",
        amount: "",
        quantity: "1",
        description: "",
        cost_date: new Date().toISOString().split("T")[0],
    });
    const [addingCost, setAddingCost] = useState(false);

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

    const openDetail = async (instId: string) => {
        setLoadingDetail(true);
        setActiveTab("info");
        try {
            const detail = await installations.get(instId);
            setSelectedInst(detail);
        } catch (err) {
            console.error("Error loading detail:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleAddCost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInst) return;
        setAddingCost(true);
        try {
            const newCost = await costs.create({
                installation_id: selectedInst.id,
                cost_type: costForm.cost_type,
                amount: parseFloat(costForm.amount),
                quantity: parseInt(costForm.quantity) || 1,
                description: costForm.description,
                cost_date: costForm.cost_date,
            });
            setSelectedInst({
                ...selectedInst,
                costs: [newCost, ...selectedInst.costs]
            });
            setCostForm({
                cost_type: "materials",
                amount: "",
                quantity: "1",
                description: "",
                cost_date: new Date().toISOString().split("T")[0],
            });
        } catch (err) {
            console.error("Error adding cost:", err);
        } finally {
            setAddingCost(false);
        }
    };

    const handleDeleteCost = async (costId: string) => {
        if (!confirm("¿Eliminar este gasto?")) return;
        try {
            await costs.delete(costId);
            if (selectedInst) {
                setSelectedInst({
                    ...selectedInst,
                    costs: selectedInst.costs.filter(c => c.id !== costId)
                });
            }
        } catch (err) {
            console.error("Error deleting cost:", err);
        }
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
                                onClick={() => openDetail(inst.id)}
                                className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/5 transition-all flex flex-col justify-between cursor-pointer group">
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

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedInst && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInst(null)} className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 z-[70] w-full max-w-2xl bg-white shadow-2xl flex flex-col">
                            
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-slate-900">{selectedInst.location_name}</h2>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusLabels[selectedInst.status]?.color || ""}`}>
                                            {statusLabels[selectedInst.status]?.label || selectedInst.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">📍 {selectedInst.address}, {selectedInst.city}</p>
                                </div>
                                <button onClick={() => setSelectedInst(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex px-6 border-b border-slate-100 gap-6 overflow-x-auto no-scrollbar">
                                {[
                                    { id: "info", label: "Información", icon: "📋" },
                                    { id: "costs", label: "Costos e Insumos", icon: "💰" },
                                    { id: "activities", label: "Actividades", icon: "🏗️" },
                                    { id: "maintenance", label: "Mantenimiento", icon: "🔧" }
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                        className={`py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                                        <span className="text-base">{tab.icon}</span> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                                {activeTab === "info" && (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Detalles del Sistema</h3>
                                            <div className="grid grid-cols-2 gap-y-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-0.5">Potencia Instalada</p>
                                                    <p className="font-semibold text-slate-900">{selectedInst.system_power_kw || "—"} kWp</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-0.5">Fecha de Instalación</p>
                                                    <p className="font-semibold text-slate-900">{selectedInst.installation_date ? new Date(selectedInst.installation_date).toLocaleDateString("es-AR") : "Pendiente"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-0.5">Paneles Solares</p>
                                                    <p className="font-semibold text-slate-900">{selectedInst.panel_count}x {selectedInst.panel_model || "Genérico"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-0.5">Inversor</p>
                                                    <p className="font-semibold text-slate-900">{selectedInst.inverter_count}x {selectedInst.inverter_model || "Genérico"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {selectedInst.description && (
                                            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notas / Descripción</h3>
                                                <p className="text-sm text-slate-700 leading-relaxed italic">"{selectedInst.description}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "costs" && (
                                    <div className="space-y-6">
                                        {/* Total Summary */}
                                        <div className="bg-sky-600 rounded-2xl p-6 text-white shadow-lg shadow-sky-600/20 flex items-center justify-between">
                                            <div>
                                                <p className="text-sky-100 text-sm font-medium mb-1">Gasto Total Acumulado</p>
                                                <h3 className="text-3xl font-bold">
                                                    ${selectedInst.costs.reduce((acc, c) => acc + (c.amount * c.quantity), 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                                </h3>
                                            </div>
                                            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">💵</div>
                                        </div>

                                        {/* Add Cost Form */}
                                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <span className="text-sky-500 text-xl">+</span> Registrar Gasto
                                            </h3>
                                            <form onSubmit={handleAddCost} className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo</label>
                                                    <select value={costForm.cost_type} onChange={(e) => setCostForm({ ...costForm, cost_type: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                                                        <option value="food">🍱 Comida / Viáticos</option>
                                                        <option value="materials">🔩 Materiales / Stock</option>
                                                        <option value="vehicle">🚗 Combustible / Vehículo</option>
                                                        <option value="lodging">🏨 Alojamiento</option>
                                                        <option value="other">📦 Otros</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
                                                    <input type="date" value={costForm.cost_date} onChange={(e) => setCostForm({ ...costForm, cost_date: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monto (Unitario)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                                        <input type="number" step="0.01" required value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                                                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" placeholder="0.00" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cantidad</label>
                                                    <input type="number" min="1" value={costForm.quantity} onChange={(e) => setCostForm({ ...costForm, quantity: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</label>
                                                    <input value={costForm.description} onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" placeholder="Ej: Tornillería extra, almuerzo equipo..." />
                                                </div>
                                                <div className="col-span-2 flex justify-end">
                                                    <button type="submit" disabled={addingCost}
                                                        className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-bold shadow-md shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-50 transition-all">
                                                        {addingCost ? "Guardando..." : "Agregar Gasto"}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Costs List */}
                                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historial de Gastos</h3>
                                            </div>
                                            {selectedInst.costs.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <p className="text-sm text-slate-400 italic">No hay gastos registrados para esta obra.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-50">
                                                    {selectedInst.costs.map(cost => (
                                                        <div key={cost.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-lg grayscale group-hover:grayscale-0 transition-all">
                                                                    {cost.cost_type === "food" ? "🍱" : cost.cost_type === "materials" ? "🔩" : cost.cost_type === "vehicle" ? "⛽" : cost.cost_type === "lodging" ? "🏨" : "📦"}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm font-semibold text-slate-900">{cost.description || (cost.cost_type.charAt(0).toUpperCase() + cost.cost_type.slice(1))}</p>
                                                                        <span className="text-[10px] text-slate-400 font-medium">{new Date(cost.cost_date).toLocaleDateString("es-AR")}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">
                                                                        {cost.quantity > 1 ? `${cost.quantity} x $${cost.amount.toLocaleString("es-AR")}` : `$${cost.amount.toLocaleString("es-AR")}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <p className="text-sm font-bold text-slate-900">
                                                                    ${(cost.amount * cost.quantity).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                                                </p>
                                                                <button onClick={() => handleDeleteCost(cost.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-slate-300">
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "activities" && (
                                    <div className="space-y-4">
                                        {selectedInst.activities.length === 0 ? (
                                            <div className="bg-white rounded-2xl p-10 border border-dotted border-slate-300 text-center">
                                                <p className="text-slate-400 italic">No hay actividades registradas.</p>
                                            </div>
                                        ) : (
                                            selectedInst.activities.map(act => (
                                                <div key={act.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-4">
                                                    <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs mt-1">🏗️</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{act.title}</p>
                                                        <p className="text-xs text-slate-500 mb-2">{new Date(act.activity_date).toLocaleString("es-AR")}</p>
                                                        {act.description && <p className="text-sm text-slate-600 leading-relaxed italic">{act.description}</p>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === "maintenance" && (
                                    <div className="space-y-4">
                                        {selectedInst.maintenance_records.length === 0 ? (
                                            <div className="bg-white rounded-2xl p-10 border border-dotted border-slate-300 text-center">
                                                <p className="text-slate-400 italic">No hay historial de mantenimiento.</p>
                                            </div>
                                        ) : (
                                            selectedInst.maintenance_records.map(r => (
                                                <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-4">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs mt-1 ${r.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>🔧</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{r.maintenance_type}</p>
                                                        <p className="text-xs text-slate-500 mb-2">{new Date(r.scheduled_date).toLocaleDateString("es-AR")}</p>
                                                        {r.description && <p className="text-sm text-slate-600 italic">"{r.description}"</p>}
                                                        {r.status === 'completed' && <span className="mt-2 inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-wider">Completado</span>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
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
