"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { activities, Activity, installations, Installation, tasks, Task } from "@/services/api";

export default function ActivitiesPage() {
    const [actData, setActData] = useState<Activity[]>([]);
    const [taskData, setTaskData] = useState<Task[]>([]);
    const [instList, setInstList] = useState<Installation[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"activities" | "tasks">("activities");
    const [showModal, setShowModal] = useState<"activity" | "task" | null>(null);
    const [saving, setSaving] = useState(false);
    const [actForm, setActForm] = useState({ installation_id: "", title: "", description: "", duration_minutes: "" });
    const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", due_date: "", installation_id: "" });

    const load = () => {
        setLoading(true);
        Promise.all([
            activities.list().then(setActData).catch(() => setActData([])),
            tasks.list().then(setTaskData).catch(() => setTaskData([])),
            installations.list().then(setInstList).catch(() => { }),
        ]).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleCreateActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await activities.create({
                ...actForm,
                duration_minutes: actForm.duration_minutes ? parseInt(actForm.duration_minutes) : undefined,
                installation_id: actForm.installation_id || undefined,
            });
            setShowModal(null);
            setActForm({ installation_id: "", title: "", description: "", duration_minutes: "" });
            load();
        } catch { /* */ }
        setSaving(false);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await tasks.create({
                ...taskForm,
                installation_id: taskForm.installation_id || undefined,
                due_date: taskForm.due_date || undefined,
            });
            setShowModal(null);
            setTaskForm({ title: "", description: "", priority: "medium", due_date: "", installation_id: "" });
            load();
        } catch { /* */ }
        setSaving(false);
    };

    const handleCompleteTask = async (id: string) => {
        try {
            await tasks.update(id, { status: "completed" } as Partial<Task>);
            load();
        } catch { /* */ }
    };

    const priorityColors: Record<string, string> = {
        high: "bg-red-100 text-red-700",
        medium: "bg-amber-100 text-amber-700",
        low: "bg-slate-100 text-slate-600",
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Actividades & Tareas</h1>
                    <p className="text-sm text-slate-500 mt-1">{actData.length} actividades · {taskData.filter(t => t.status === "pending").length} tareas pendientes</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { if (instList.length === 0) { alert("Primero creá una instalación."); return; } setShowModal("activity"); }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium shadow-sm hover:from-sky-400 hover:to-sky-500 transition-all flex items-center gap-2">
                        + Actividad
                    </button>
                    <button onClick={() => setShowModal("task")}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-medium shadow-sm hover:from-rose-400 hover:to-rose-500 transition-all flex items-center gap-2">
                        + Tarea
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
                <button onClick={() => setTab("activities")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "activities" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Actividades</button>
                <button onClick={() => setTab("tasks")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "tasks" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Tareas</button>
            </div>

            {loading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse"><div className="h-5 w-40 bg-slate-200 rounded mb-2" /><div className="h-4 w-56 bg-slate-100 rounded" /></div>))}</div>
            ) : tab === "activities" ? (
                actData.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                        <div className="text-5xl mb-4">📋</div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay actividades registradas</h3>
                        <p className="text-sm text-slate-500">Registrá la primera actividad de una instalación.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {actData.map((a, i) => {
                            const instName = instList.find(inst => inst.id === a.installation_id)?.location_name || "Instalación";
                            return (
                                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{a.title}</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">📍 {instName} · 📅 {new Date(a.activity_date).toLocaleDateString("es-AR")}</p>
                                            {a.description && <p className="text-sm text-slate-500 mt-1">{a.description}</p>}
                                        </div>
                                        {a.duration_minutes && <span className="text-xs text-slate-400 bg-slate-50 rounded-lg px-2 py-1">{a.duration_minutes} min</span>}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )
            ) : (
                taskData.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay tareas</h3>
                        <p className="text-sm text-slate-500">Creá tu primera tarea pendiente.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {taskData.map((t, i) => (
                            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className={`bg-white rounded-2xl p-5 border hover:shadow-md transition-all ${t.status === "completed" ? "border-emerald-100 opacity-60" : "border-slate-100"}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`font-semibold ${t.status === "completed" ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${priorityColors[t.priority] || "bg-slate-100 text-slate-600"}`}>{t.priority === "high" ? "Alta" : t.priority === "medium" ? "Media" : "Baja"}</span>
                                        </div>
                                        {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
                                        {t.due_date && <p className="text-xs text-slate-400 mt-1">Vence: {new Date(t.due_date).toLocaleDateString("es-AR")}</p>}
                                    </div>
                                    {t.status !== "completed" && (
                                        <button onClick={() => handleCompleteTask(t.id)} className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap">
                                            ✓ Completar
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            )}

            {/* Activity Modal */}
            <AnimatePresence>
                {showModal === "activity" && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(null)} className="fixed inset-0 z-40 bg-black/50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Nueva Actividad</h2></div>
                                <form onSubmit={handleCreateActivity} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Instalación *</label>
                                        <select required value={actForm.installation_id} onChange={(e) => setActForm({ ...actForm, installation_id: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                                            <option value="">Seleccionar</option>
                                            {instList.map(i => <option key={i.id} value={i.id}>{i.location_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                                        <input required value={actForm.title} onChange={(e) => setActForm({ ...actForm, title: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                        <textarea rows={2} value={actForm.description} onChange={(e) => setActForm({ ...actForm, description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Duración (minutos)</label>
                                        <input type="number" min="0" value={actForm.duration_minutes} onChange={(e) => setActForm({ ...actForm, duration_minutes: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 disabled:opacity-50">{saving ? "Guardando..." : "Registrar"}</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Task Modal */}
            <AnimatePresence>
                {showModal === "task" && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(null)} className="fixed inset-0 z-40 bg-black/50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">Nueva Tarea</h2></div>
                                <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                                        <input required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                        <textarea rows={2} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                                            <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                                                <option value="low">Baja</option>
                                                <option value="medium">Media</option>
                                                <option value="high">Alta</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento</label>
                                            <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                                        </div>
                                    </div>
                                    {instList.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Instalación (opcional)</label>
                                            <select value={taskForm.installation_id} onChange={(e) => setTaskForm({ ...taskForm, installation_id: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                                                <option value="">Ninguna</option>
                                                {instList.map(i => <option key={i.id} value={i.id}>{i.location_name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-400 disabled:opacity-50">{saving ? "Guardando..." : "Crear Tarea"}</button>
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
