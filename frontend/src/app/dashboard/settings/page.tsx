"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth } from "@/services/api";

export default function SettingsPage() {
    const [user, setUser] = useState<{ email: string; full_name: string; role: string } | null>(null);

    useEffect(() => {
        auth.me().then(setUser).catch(() => { });
    }, []);

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Configuración</h1>
                <p className="text-sm text-slate-500 mt-1">Ajustes de tu cuenta</p>
            </div>

            {user ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Perfil</h2>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white text-lg font-bold shadow-md shadow-sky-500/20">
                                {user.full_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{user.full_name}</p>
                                <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                <span className="text-sm text-slate-500">Rol</span>
                                <span className="text-sm font-medium text-slate-900 capitalize">{user.role}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                <span className="text-sm text-slate-500">API Backend</span>
                                <span className="text-sm font-medium text-emerald-600">Conectado ✓</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100">
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Acciones</h2>
                        <button
                            onClick={() => auth.logout()}
                            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </motion.div>
            ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
                    <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
                    <div className="h-14 w-14 bg-slate-200 rounded-2xl mb-4" />
                    <div className="h-4 w-48 bg-slate-100 rounded" />
                </div>
            )}
        </div>
    );
}
