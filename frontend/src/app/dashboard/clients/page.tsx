"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clients, Client, installations, Installation } from "@/services/api";

export default function ClientsPage() {
    const [data, setData] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientInstallations, setClientInstallations] = useState<Installation[]>([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", city: "", province: "", address: "", notes: "" });

    const load = (q?: string) => {
        setLoading(true);
        clients.list(q).then(setData).catch(() => setData([])).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        const t = setTimeout(() => load(search || undefined), 300);
        return () => clearTimeout(t);
    }, [search]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await clients.create(form);
            setShowModal(false);
            setForm({ name: "", email: "", phone: "", company: "", city: "", province: "", address: "", notes: "" });
            load();
        } catch { /* error handled by api */ }
        setSaving(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
        try { await clients.delete(id); load(); } catch { /* */ }
    };

    const handleViewClient = (client: Client) => {
        setSelectedClient(client);
        setClientInstallations([]); // reset previous
        installations.list({ client_id: client.id })
            .then(setClientInstallations)
            .catch(() => setClientInstallations([]));
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Clientes</h1>
                    <p className="text-sm text-slate-500 mt-1">{data.length} cliente{data.length !== 1 ? "s" : ""} registrado{data.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full sm:w-80 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
                            <div className="h-5 w-32 bg-slate-200 rounded mb-2" />
                            <div className="h-4 w-48 bg-slate-100 rounded mb-1" />
                            <div className="h-4 w-40 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : data.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <div className="text-5xl mb-4">👥</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {search ? "No se encontraron clientes" : "No hay clientes aún"}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        {search ? "Probá con otro término de búsqueda." : "Creá tu primer cliente para empezar."}
                    </p>
                    {!search && (
                        <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 transition-colors">
                            + Crear Primer Cliente
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((client, i) => (
                        <motion.div
                            key={client.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all group cursor-pointer"
                            onClick={() => handleViewClient(client)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white text-sm font-bold shadow-sm">
                                        {client.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{client.name}</h3>
                                        {client.company && <p className="text-xs text-slate-500">{client.company}</p>}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, client.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                                    title="Eliminar"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                </button>
                            </div>
                            <div className="space-y-1 text-sm text-slate-600">
                                {client.email && <p className="flex items-center gap-2"><span className="text-slate-400">✉</span> {client.email}</p>}
                                {client.phone && <p className="flex items-center gap-2"><span className="text-slate-400">📱</span> {client.phone}</p>}
                                {client.city && <p className="flex items-center gap-2"><span className="text-slate-400">📍</span> {client.city}{client.province ? `, ${client.province}` : ""}</p>}
                            </div>
                            <p className="mt-3 text-[10px] text-slate-400">
                                Creado: {new Date(client.created_at).toLocaleDateString("es-AR")}
                            </p>
                        </motion.div>
                    ))}
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
                                    <h2 className="text-lg font-bold text-slate-900">Nuevo Cliente</h2>
                                    <p className="text-sm text-slate-500">Completá los datos del cliente</p>
                                </div>
                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                                            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                                            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                                            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
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
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                                            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                                            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 resize-none" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 disabled:opacity-50 transition-colors">{saving ? "Guardando..." : "Crear Cliente"}</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* View Modal */}
            <AnimatePresence>
                {selectedClient && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedClient(null)} className="fixed inset-0 z-40 bg-black/50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white text-lg font-bold shadow-sm">
                                            {selectedClient.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">{selectedClient.name}</h2>
                                            {selectedClient.company && <p className="text-sm font-medium text-sky-600">{selectedClient.company}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedClient(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                        ✕
                                    </button>
                                </div>
                                <div className="p-6">
                                    {/* Client Details */}
                                    <div className="bg-slate-50 rounded-xl p-5 mb-8">
                                        <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Detalles de Contacto</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                            <div className="flex gap-2.5">
                                                <span className="text-slate-400">✉</span>
                                                <span className="text-slate-700">{selectedClient.email || "No registrado"}</span>
                                            </div>
                                            <div className="flex gap-2.5">
                                                <span className="text-slate-400">📱</span>
                                                <span className="text-slate-700">{selectedClient.phone || "No registrado"}</span>
                                            </div>
                                            <div className="flex gap-2.5">
                                                <span className="text-slate-400">📍</span>
                                                <span className="text-slate-700">{[selectedClient.address, selectedClient.city, selectedClient.province].filter(Boolean).join(", ") || "No registrado"}</span>
                                            </div>
                                            <div className="flex gap-2.5">
                                                <span className="text-slate-400">📅</span>
                                                <span className="text-slate-700">Registrado el {new Date(selectedClient.created_at).toLocaleDateString("es-AR")}</span>
                                            </div>
                                            {selectedClient.notes && (
                                                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                                                    <p className="font-medium text-slate-500 mb-1 text-xs">NOTAS</p>
                                                    <p className="text-slate-700 bg-white p-3 rounded border border-slate-100">{selectedClient.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Installations list */}
                                    <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Instalaciones ({clientInstallations.length})</h3>
                                    {clientInstallations.length === 0 ? (
                                        <div className="text-center py-8 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                                            <p className="text-sm text-slate-500">Este cliente aún no tiene instalaciones registradas.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {clientInstallations.map(inst => (
                                                <div key={inst.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-300 transition-colors">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                                            {inst.location_name}
                                                            {inst.status === "completed" && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Completada</span>}
                                                            {inst.status === "in_progress" && <span className="bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold">En Progreso</span>}
                                                            {inst.status === "pending" && <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">Pendiente</span>}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-1">📍 {[inst.address, inst.city].filter(Boolean).join(", ")}</p>
                                                    </div>
                                                    <div className="flex gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg self-start sm:self-auto">
                                                        <span>🔲 {inst.panel_count} pan.</span>
                                                        {inst.system_power_kw && <span className="border-l border-slate-200 pl-2">⚡ {inst.system_power_kw} kW</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
