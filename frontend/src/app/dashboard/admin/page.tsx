"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { admin, CompanyAdmin } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
    const { dbUser } = useAuth();
    const router = useRouter();
    
    const [stats, setStats] = useState<{ totalCompanies: number; totalUsers: number; demoCount: number; proCount: number } | null>(null);
    const [companies, setCompanies] = useState<CompanyAdmin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (dbUser && !dbUser.isSuperadmin) {
            router.push("/dashboard");
            return;
        }

        if (dbUser?.isSuperadmin) {
            fetchData();
        }
    }, [dbUser, router]);

    const fetchData = async () => {
        try {
            const [s, c] = await Promise.all([admin.stats(), admin.companies()]);
            setStats(s);
            setCompanies(c);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlan = async (company: CompanyAdmin) => {
        try {
            const newPlan = company.plan === "demo" ? "pro" : "demo";
            await admin.changePlan(company.id, newPlan);
            fetchData();
        } catch (error) {
            alert("Error cambiando plan");
        }
    };

    if (isLoading) {
        return <div className="p-8 text-slate-500">Cargando panel de administración...</div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Panel de SuperAdmin</h1>
                <p className="text-sm text-slate-500 mt-1">Gestión global de empresas y usuarios</p>
            </div>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Empresas Totales", value: stats.totalCompanies, color: "text-sky-600" },
                        { label: "Usuarios Totales", value: stats.totalUsers, color: "text-emerald-600" },
                        { label: "Planes Demo", value: stats.demoCount, color: "text-indigo-600" },
                        { label: "Planes Pro", value: stats.proCount, color: "text-purple-600" },
                    ].map((s, i) => (
                        <div key={i} className="bg-slate-900 rounded-2xl p-5 border border-white/10 shadow-sm">
                            <p className="text-sm text-slate-500 font-medium mb-1">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 border border-white/10 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-100 mb-4">Empresas Registradas</h2>

                {/* Mobile: Card layout */}
                <div className="md:hidden space-y-3">
                    {companies.map((company) => (
                        <div key={company.id} className="border border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-slate-100">{company.name}</h3>
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                                    company.plan === 'pro' ? 'bg-sky-100 text-sky-700' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {company.plan}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                                <span>👥 {company.userCount} usuarios</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                    company.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {company.subscriptionStatus}
                                </span>
                            </div>
                            <button
                                onClick={() => togglePlan(company)}
                                className="text-xs font-medium text-sky-600 hover:text-sky-700"
                            >
                                Cambiar a {company.plan === 'demo' ? 'Pro' : 'Demo'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-500 border-b border-white/10">
                                <th className="pb-3 font-medium">Empresa</th>
                                <th className="pb-3 font-medium">Usuarios</th>
                                <th className="pb-3 font-medium">Estado</th>
                                <th className="pb-3 font-medium w-[100px]">Plan</th>
                                <th className="pb-3 font-medium text-right w-[150px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {companies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-800/50 transition-colors h-16">
                                    <td className="py-4 font-medium text-slate-100">{company.name}</td>
                                    <td className="py-4 text-slate-400">{company.userCount}</td>
                                    <td className="py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                                            company.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {company.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="py-4 w-[100px]">
                                        <div className="flex items-center h-full">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider text-center min-w-[55px] ${
                                                company.plan === 'pro' ? 'bg-sky-100 text-sky-700' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {company.plan}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right w-[150px]">
                                        <button
                                            onClick={() => togglePlan(company)}
                                            className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline whitespace-nowrap"
                                        >
                                            Cambiar a {company.plan === 'demo' ? 'Pro' : 'Demo'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
