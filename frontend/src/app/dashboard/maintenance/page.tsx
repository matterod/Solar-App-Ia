"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { maintenance, Maintenance, installations, Installation } from "@/services/api";

const statusLabels: Record<string, { label: string; color: string }> = {
    scheduled: { label: "Programado", color: "bg-sky-100 text-sky-700" },
    in_progress: { label: "En Progreso", color: "bg-sky-100 text-sky-700" },
    completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default function MaintenancePage() {
    const [data, setData] = useState<Maintenance[]>([]);
    const [instList, setInstList] = useState<Installation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ installation_id: "", scheduled_date: "", maintenance_type: "routine", description: "" });

    const isFirstMount = useRef(true);

    const load = (silent = false) => {
        if (!silent) setLoading(true);
        maintenance.list({ status: filterStatus || undefined })
            .then(setData)
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isFirstMount.current) {
            load();
            installations.list().then(setInstList).catch(() => { });
            isFirstMount.current = false;
            return;
        }
        load(true);
    }, [filterStatus]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await maintenance.create(form);
            setShowModal(false);
            setForm({ installation_id: "", scheduled_date: "", maintenance_type: "routine", description: "" });
            load();
        } catch { /* */ }
        setSaving(false);
    };

    const handleComplete = async (id: string) => {
        try {
            await maintenance.update(id, { status: "completed", completed_date: new Date().toISOString().split("T")[0] } as Partial<Maintenance>);
            load();
        } catch { /* */ }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Mantenimiento</h1>
                    <p className="text-sm text-slate-500 mt-1">{data.length} registro{data.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => { if (instList.length === 0) { alert("Primero creá una instalación."); return; } setShowModal(true); }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-medium shadow-md shadow-violet-500/20 hover:from-violet-400 hover:to-violet-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Programar Mantenimiento
                </button>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
                {["", "scheduled", "completed"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? "bg-sky-100 text-sky-700 border border-sky-200" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {s === "" ? "Todos" : s === "scheduled" ? "Programados" : "Completados"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse"><div className="h-5 w-48 bg-slate-200 rounded mb-2" /><div className="h-4 w-32 bg-slate-100 rounded" /></div>))}
                </div>
            ) : data.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <div className="text-5xl mb-4">🔧</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{filterStatus ? "Sin resultados" : "No hay mantenimientos programados"}</h3>
                    <p className="text-sm text-slate-500 mb-4">Los mantenimientos se programan automáticamente al crear instalaciones.</p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {data.map((m, i) => {
                        const s = statusLabels[m.status] || { label: m.status, color: "bg-slate-100 text-slate-600" };
                        const instName = instList.find(inst => inst.id === m.installation_id)?.location_name || "Instalación";
                        const isOverdue = m.status === "scheduled" && new Date(m.scheduled_date) < new Date();
                        return (
                            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className={`bg-white rounded-2xl p-5 border hover:shadow-md transition-all ${isOverdue ? "border-red-200" : "border-slate-100"}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-900">{instName}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${s.color}`}>{s.label}</span>
                                            {isOverdue && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">Vencido</span>}
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            📅 {new Date(m.scheduled_date).toLocaleDateString("es-AR")} · {m.maintenance_type === "routine" ? "Rutina" : m.maintenance_type === "corrective" ? "Correctivo" : m.maintenance_type}
                                        </p>
                                        {m.description && <p className="text-sm text-slate-500 mt-1">{m.description}</p>}
                                    </div>
                                    {m.status === "scheduled" && (
                                        <button onClick={() => handleComplete(m.id)} className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap">
                                            ✓ Completar
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 z-40 bg-black/50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-900">Programar Mantenimiento</h2>
                                </div>
                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Instalación *</label>
                                        <select required value={form.installation_id} onChange={(e) => setForm({ ...form, installation_id: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400">
                                            <option value="">Seleccionar instalación</option>
                                            {instList.map(inst => <option key={inst.id} value={inst.id}>{inst.location_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
                                        <input type="date" required value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                        <select value={form.maintenance_type} onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400">
                                            <option value="routine">Rutina</option>
                                            <option value="corrective">Correctivo</option>
                                            <option value="preventive">Preventivo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 disabled:opacity-50">{saving ? "Guardando..." : "Programar"}</button>
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
