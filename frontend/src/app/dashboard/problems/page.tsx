"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { problems, Problem } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { handleApiError } from "@/lib/handle-api-error";

export default function ProblemsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("");

    // Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState({ title: "", description: "" });

    // Solution Modal
    const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
    const [solutionText, setSolutionText] = useState("");

    const { data = [], isLoading: loading } = useQuery({
        queryKey: queryKeys.problems.list({ search: search || undefined, status: filterStatus || undefined }),
        queryFn: () => problems.list({ search: search || undefined, status: filterStatus || undefined }),
    });

    // Speech Recognition State
    const [isListeningSearch, setIsListeningSearch] = useState(false);
    const recognitionSearchRef = useRef<any>(null);

    const [isListeningCreate, setIsListeningCreate] = useState(false);
    const recognitionCreateRef = useRef<any>(null);

    const [isListeningSolution, setIsListeningSolution] = useState(false);
    const recognitionSolutionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            // Search transcriber
            recognitionSearchRef.current = new SpeechRecognition();
            recognitionSearchRef.current.continuous = false;
            recognitionSearchRef.current.interimResults = true;
            recognitionSearchRef.current.lang = 'es-AR';
            recognitionSearchRef.current.onresult = (e: any) => {
                let final = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) {
                    if (e.results[i].isFinal) final += e.results[i][0].transcript;
                }
                if (final) setSearch(prev => prev + " " + final);
            };
            recognitionSearchRef.current.onend = () => setIsListeningSearch(false);
            recognitionSearchRef.current.onerror = () => setIsListeningSearch(false);

            // Create Problem transcriber
            recognitionCreateRef.current = new SpeechRecognition();
            recognitionCreateRef.current.continuous = false;
            recognitionCreateRef.current.interimResults = true;
            recognitionCreateRef.current.lang = 'es-AR';
            recognitionCreateRef.current.onresult = (e: any) => {
                let final = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) {
                    if (e.results[i].isFinal) final += e.results[i][0].transcript;
                }
                if (final) setForm(f => ({ ...f, description: f.description + " " + final }));
            };
            recognitionCreateRef.current.onend = () => setIsListeningCreate(false);
            recognitionCreateRef.current.onerror = () => setIsListeningCreate(false);

            // Solution transcriber
            recognitionSolutionRef.current = new SpeechRecognition();
            recognitionSolutionRef.current.continuous = false;
            recognitionSolutionRef.current.interimResults = true;
            recognitionSolutionRef.current.lang = 'es-AR';
            recognitionSolutionRef.current.onresult = (e: any) => {
                let final = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) {
                    if (e.results[i].isFinal) final += e.results[i][0].transcript;
                }
                if (final) setSolutionText(prev => prev + " " + final);
            };
            recognitionSolutionRef.current.onend = () => setIsListeningSolution(false);
            recognitionSolutionRef.current.onerror = () => setIsListeningSolution(false);
        }
    }, []);

    const toggleListen = (type: 'search' | 'create' | 'solution') => {
        try {
            if (type === 'search') {
                if (isListeningSearch) { recognitionSearchRef.current?.stop(); setIsListeningSearch(false); }
                else { recognitionSearchRef.current?.start(); setIsListeningSearch(true); }
            } else if (type === 'create') {
                if (isListeningCreate) { recognitionCreateRef.current?.stop(); setIsListeningCreate(false); }
                else { recognitionCreateRef.current?.start(); setIsListeningCreate(true); }
            } else if (type === 'solution') {
                if (isListeningSolution) { recognitionSolutionRef.current?.stop(); setIsListeningSolution(false); }
                else { recognitionSolutionRef.current?.start(); setIsListeningSolution(true); }
            }
        } catch (e) { handleApiError(e) }
    };

    const createMutation = useMutation({
        mutationFn: (data: { title: string; description: string }) => problems.create(data),
        onSuccess: () => {
            toast.success("Problema registrado correctamente");
            queryClient.invalidateQueries({ queryKey: queryKeys.problems.all() });
            setShowCreateModal(false);
            setForm({ title: "", description: "" });
        },
        onError: (e) => handleApiError(e),
    });

    const addSolutionMutation = useMutation({
        mutationFn: ({ id, text }: { id: string; text: string }) => problems.addSolution(id, text),
        onSuccess: () => {
            toast.success("Solución agregada correctamente");
            queryClient.invalidateQueries({ queryKey: queryKeys.problems.all() });
            setSolutionText("");
            setSelectedProblem(null);
        },
        onError: (e) => handleApiError(e),
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(form);
    };

    const handleAddSolution = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProblem || !solutionText.trim()) return;
        addSolutionMutation.mutate({ id: selectedProblem.id, text: solutionText });
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Base de Conocimiento IA</h1>
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
                <div className="flex flex-1 sm:w-72 gap-2">
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en problemas o soluciones..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300" />
                    <button type="button" onClick={() => toggleListen('search')} className={`px-3 rounded-xl border flex items-center justify-center transition-colors ${isListeningSearch ? 'bg-red-100 border-red-300 text-red-600 animate-pulse' : 'bg-slate-900 border-white/10 text-slate-500 hover:bg-slate-950'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                    </button>
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-slate-300 outline-none"
                >
                    <option value="">Todos los estados</option>
                    <option value="open">Abiertos (Sin solución)</option>
                    <option value="resolved">Resueltos (Con solución)</option>
                </select>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-slate-900 rounded-2xl p-5 border border-white/10 animate-pulse h-32" />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-slate-900 rounded-2xl border border-dashed border-white/10">
                    <div className="text-5xl mb-4">🧠</div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">{search || filterStatus ? "No se encontraron coincidencias" : "La base de conocimiento está vacía"}</h3>
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
                                className={`bg-slate-900/80 rounded-2xl border transition-all overflow-hidden ${isResolved ? "border-white/5" : "border-red-500/20 shadow-md shadow-red-500/5"}`}>

                                {/* Problem Header */}
                                <div className={`p-5 flex flex-col md:flex-row gap-4 justify-between items-start ${!isResolved ? 'bg-gradient-to-r from-red-500/5 to-transparent' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-2 h-2 shrink-0 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-red-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                                            <h3 className="font-bold text-slate-100 text-lg">{p.title}</h3>
                                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${isResolved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {isResolved ? 'Resuelto' : 'Abierto'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm whitespace-pre-wrap">{p.description}</p>
                                        <p className="text-xs text-slate-400 mt-3 font-mono">Reportado: {new Date(p.created_at).toLocaleDateString('es-AR')}</p>
                                    </div>

                                    {!isResolved && (
                                        <button
                                            onClick={() => setSelectedProblem(p)}
                                            className="shrink-0 px-4 py-2 rounded-lg bg-slate-900 border border-white/10 shadow-sm text-sm font-medium text-slate-300 hover:bg-slate-950 hover:border-slate-300 transition-all"
                                        >
                                            💡 Agregar Solución
                                        </button>
                                    )}
                                </div>

                                {/* Solutions */}
                                {p.solutions && p.solutions.length > 0 && (
                                    <div className="bg-slate-950 border-t border-white/10 p-5">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Solución Aplicada
                                        </h4>
                                        {p.solutions.map(sol => (
                                            <div key={sol.id} className="bg-slate-900 border border-white/10 rounded-xl p-4 shadow-sm">
                                                <p className="text-slate-300 text-sm whitespace-pre-wrap">{sol.description}</p>
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
                            <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-white/10">
                                    <h2 className="text-lg font-bold text-slate-100">Registrar Nuevo Problema</h2>
                                    <p className="text-sm text-slate-500">Anotá el inconveniente con mucho detalle para el agente.</p>
                                </div>
                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Título del problema *</label>
                                        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Falla de inversor Huawei en sombra..." className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <label className="block text-sm font-medium text-slate-300">Descripción detallada *</label>
                                            <button type="button" onClick={() => toggleListen('create')} className={`p-1.5 rounded-lg border transition-colors ${isListeningCreate ? 'bg-red-100 border-red-300 text-red-600 animate-pulse' : 'bg-slate-900 border-white/10 text-slate-500 hover:bg-slate-950'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <textarea required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Explicá cómo se presentó el problema, qué síntomas tenía, qué viste..." className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-950 transition-colors">Cancelar</button>
                                        <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition-colors">{createMutation.isPending ? "Guardando..." : "Guardar Problema"}</button>
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
                            <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-white/10 flex gap-3">
                                    <div className="shrink-0 text-3xl">💡</div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-100">Agregar Solución</h2>
                                        <p className="text-sm text-slate-500 font-medium clamp-1">Para: {selectedProblem.title}</p>
                                    </div>
                                </div>
                                <form onSubmit={handleAddSolution} className="p-6 space-y-4">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="block text-sm font-medium text-slate-300">
                                                ¿Cómo lograste solucionar este problema? *
                                            </label>
                                            <button type="button" onClick={() => toggleListen('solution')} className={`p-1.5 rounded-lg border transition-colors ${isListeningSolution ? 'bg-red-100 border-red-300 text-red-600 animate-pulse' : 'bg-slate-900 border-white/10 text-slate-500 hover:bg-slate-950'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <textarea required rows={5} value={solutionText} onChange={(e) => setSolutionText(e.target.value)} placeholder="Ej: Resulta que el panel estaba haciendo tierra con la estructura. Lo que hicimos fue..." className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 shadow-inner resize-none bg-slate-950 focus:bg-slate-800 transition-colors" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setSelectedProblem(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-950 transition-colors">Cancelar</button>
                                        <button type="submit" disabled={addSolutionMutation.isPending || !solutionText.trim()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                            {addSolutionMutation.isPending ? "Guardando..." : "Marcar como Resuelto"}
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
