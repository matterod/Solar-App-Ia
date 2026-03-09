"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { problems, Problem, Solution } from "@/services/api";

export default function ProblemsPage() {
    const [data, setData] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("");

    // Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: "", description: "" });

    // Solution Modal
    const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
    const [solutionText, setSolutionText] = useState("");
    const [savingSolution, setSavingSolution] = useState(false);

    const load = () => {
        setLoading(true);
        problems.list({ search: search || undefined, status: filterStatus || undefined })
            .then(setData).catch(() => setData([])).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search, filterStatus]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await problems.create(form);
            setShowCreateModal(false);
            setForm({ title: "", description: "" });
            load();
        } catch { /* */ }
        setSaving(false);
    };

    const handleAddSolution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProblem || !solutionText.trim()) return;

        setSavingSolution(true);
        try {
            await problems.addSolution(selectedProblem.id, solutionText);
            setSolutionText("");
            setSelectedProblem(null);
            load(); // Reload to show the problem as resolved
        } catch { /* */ }
        setSavingSolution(false);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Base de Conocimiento IA</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Registrá problemas y soluciones para que Sol aprenda de tu experiencia.
                    </p>
                </div>
                <button onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium shadow-md shadow-red-500/20 hover:from-red-400 hover:to-red-500 transition-all hover:-translate-y-0.5 flex items-center gap-2 self-start">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Anotar Problema
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en problemas o soluciones..."
                    className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 outline-none"
                >
                    <option value="">Todos los estados</option>
                    <option value="open">Abiertos (Sin solución)</option>
                    <option value="resolved">Resueltos (Con solución)</option>
                </select>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-32" />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="text-5xl mb-4">🧠</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{search || filterStatus ? "No se encontraron coincidencias" : "La base de conocimiento está vacía"}</h3>
                    <p className="text-sm text-slate-500 mb-4">{search ? "Probá buscando con otras palabras." : "Anotá el primer problema que tuviste y cómo lo solucionaste."}</p>
                    {!search && !filterStatus && (
                        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors">+ Registrar un problema</button>
                    )}
                </motion.div>
            ) : (
                <div className="space-y-4">
                    {data.map((p, i) => {
                        const isResolved = p.status === 'resolved';
                        return (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className={`bg-white rounded-2xl border transition-all overflow-hidden ${isResolved ? "border-slate-200" : "border-red-200 shadow-sm shadow-red-100/50"}`}>

                                {/* Problem Header */}
                                <div className={`p-5 flex flex-col md:flex-row gap-4 justify-between items-start ${!isResolved ? 'bg-red-50/30' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                                            <h3 className="font-bold text-slate-900 text-lg">{p.title}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {isResolved ? 'Resuelto' : 'Abierto'}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm whitespace-pre-wrap">{p.description}</p>
                                        <p className="text-xs text-slate-400 mt-3 font-mono">Reportado: {new Date(p.created_at).toLocaleDateString('es-AR')}</p>
                                    </div>

                                    {!isResolved && (
                                        <button
                                            onClick={() => setSelectedProblem(p)}
                                            className="shrink-0 px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                                        >
                                            💡 Agregar Solución
                                        </button>
                                    )}
                                </div>

                                {/* Solutions */}
                                {p.solutions && p.solutions.length > 0 && (
                                    <div className="bg-slate-50 border-t border-slate-100 p-5">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Solución Aplicada
                                        </h4>
                                        {p.solutions.map(sol => (
                                            <div key={sol.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{sol.description}</p>
                                                <p className="text-xs text-slate-400 mt-2 font-mono">Aplicada: {new Date(sol.created_at).toLocaleDateString('es-AR')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Problem Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-900">Registrar Nuevo Problema</h2>
                                    <p className="text-sm text-slate-500">Anotá el inconveniente con mucho detalle para el agente.</p>
                                </div>
                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Título del problema *</label>
                                        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Falla de inversor Huawei en sombra..." className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción detallada *</label>
                                        <textarea required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Explicá cómo se presentó el problema, qué síntomas tenía, qué viste..." className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition-colors">{saving ? "Guardando..." : "Guardar Problema"}</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Solution Modal */}
            <AnimatePresence>
                {selectedProblem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProblem(null)} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100 flex gap-3">
                                    <div className="shrink-0 text-3xl">💡</div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Agregar Solución</h2>
                                        <p className="text-sm text-slate-500 font-medium clamp-1">Para: {selectedProblem.title}</p>
                                    </div>
                                </div>
                                <form onSubmit={handleAddSolution} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            ¿Cómo lograste solucionar este problema? *
                                        </label>
                                        <textarea required rows={5} value={solutionText} onChange={(e) => setSolutionText(e.target.value)} placeholder="Ej: Resulta que el panel estaba haciendo tierra con la estructura. Lo que hicimos fue..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 shadow-inner resize-none bg-slate-50 focus:bg-white transition-colors" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setSelectedProblem(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                                        <button type="submit" disabled={savingSolution || !solutionText.trim()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                            {savingSolution ? "Guardando..." : "Marcar como Resuelto"}
                                        </button>
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
