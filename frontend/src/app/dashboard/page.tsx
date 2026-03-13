"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { dashboard, DashboardStats } from "@/services/api";

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, type: "spring" as const, stiffness: 300, damping: 30 },
    }),
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboard.stats()
            .then(setStats)
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    const cards = stats ? [
        { label: "Clientes", value: stats.total_clients, icon: "👥", href: "/dashboard/clients", color: "from-sky-500 to-sky-600", shadow: "shadow-sky-500/20" },
        { label: "Instalaciones", value: stats.total_installations, icon: "⚡", href: "/dashboard/installations", color: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/20" },
        { label: "Activas", value: stats.active_installations, icon: "✅", href: "/dashboard/installations", color: "from-teal-500 to-teal-600", shadow: "shadow-teal-500/20" },
        { label: "Potencia Total", value: `${stats.total_power_kw} kW`, icon: "☀️", href: "#", color: "from-sky-500 to-sky-600", shadow: "shadow-sky-500/20" },
        { label: "Mantenimientos", value: stats.upcoming_maintenance, icon: "🔧", href: "/dashboard/maintenance", color: "from-violet-500 to-violet-600", shadow: "shadow-violet-500/20" },
        { label: "Tareas Pendientes", value: stats.pending_tasks, icon: "📋", href: "/dashboard/activities", color: "from-rose-500 to-rose-600", shadow: "shadow-rose-500/20" },
        { label: "Stock Bajo", value: stats.low_stock_products, icon: "📦", href: "/dashboard/inventory", color: "from-orange-500 to-orange-600", shadow: "shadow-orange-500/20" },
    ] : [];

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Resumen general del negocio</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
                            <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
                            <div className="h-8 w-16 bg-slate-200 rounded" />
                        </div>
                    ))}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Link href={card.href}>
                                <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all group cursor-pointer">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-slate-500">{card.label}</span>
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-md ${card.shadow} group-hover:scale-110 transition-transform`}>
                                            <span className="text-sm">{card.icon}</span>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-slate-500">No se pudieron cargar las estadísticas.</p>
                </div>
            )}

            {/* Quick actions */}
            {stats && (stats.total_clients === 0 || stats.total_installations === 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-100 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">🚀 ¡Empezá a usar Solar ERP!</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        Tu sistema está vacío. Creá tu primer cliente e instalación para empezar.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/dashboard/clients"
                            className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 transition-colors shadow-sm"
                        >
                            + Crear Cliente
                        </Link>
                        <Link
                            href="/dashboard/installations"
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-colors shadow-sm"
                        >
                            + Crear Instalación
                        </Link>
                        <Link
                            href="/dashboard/inventory"
                            className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors shadow-sm"
                        >
                            + Agregar Producto
                        </Link>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
