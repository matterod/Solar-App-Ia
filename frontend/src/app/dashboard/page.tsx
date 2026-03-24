"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { dashboard, DashboardStats } from "@/services/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.05, type: "spring" as const, stiffness: 300, damping: 30 },
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
        <div className="p-6 lg:p-8">
            <PageHeader 
                title="Dashboard" 
                description="Resumen general del negocio e indicadores clave."
            />

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Card key={i} className="p-5 animate-pulse">
                            <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
                            <div className="h-8 w-16 bg-slate-200 rounded" />
                        </Card>
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
                                <Card hoverable className="p-5 group cursor-pointer h-full flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-slate-500">{card.label}</span>
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-md ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                            <span className="text-base">{card.icon}</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</p>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-slate-500">No se pudieron cargar las estadísticas.</p>
                </div>
            )}

            {/* Quick actions for empty states */}
            {stats && (stats.total_clients === 0 || stats.total_installations === 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="mt-8 bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-100 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">🚀</div>
                        <div className="relative z-10 w-full max-w-2xl">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">¡Empezá a usar Solar ERP!</h3>
                            <p className="text-base text-slate-600 mb-6">
                                Tu sistema está listo. Creá tu primer cliente e instalación para comenzar a monitorear.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/dashboard/clients">
                                    <Button variant="primary">+ Crear Cliente</Button>
                                </Link>
                                <Link href="/dashboard/installations">
                                    <Button variant="primary" className="from-emerald-500 to-emerald-600 shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500">
                                        + Crear Instalación
                                    </Button>
                                </Link>
                                <Link href="/dashboard/inventory">
                                    <Button variant="secondary">+ Agregar Producto</Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
