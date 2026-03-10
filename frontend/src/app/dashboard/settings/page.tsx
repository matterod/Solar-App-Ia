"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth, invitations, Invitation } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
    const { logout } = useAuth();
    const [user, setUser] = useState<{ email: string; full_name: string; role: string; company_name?: string | null; plan?: string | null } | null>(null);
    const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteCategory, setInviteCategory] = useState("technician");

    useEffect(() => {
        auth.getMe().then(u => {
            setUser(u);
            if (u && (u.role === 'admin' || u.role === 'manager')) {
                fetchInvitations();
            }
        }).catch(() => { });
    }, []);

    const fetchInvitations = () => {
        invitations.list().then(setPendingInvitations).catch(console.error);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await invitations.create({ email: inviteEmail, role: inviteCategory });
            setInviteEmail("");
            fetchInvitations();
        } catch (error: any) {
            alert("Error al enviar invitación: " + error.message);
        }
    };

    const handleCancelInvite = async (id: string) => {
        try {
            await invitations.delete(id);
            fetchInvitations();
        } catch (error: any) {
            alert("Error al cancelar invitación: " + error.message);
        }
    };

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
                            {user.company_name && (
                                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                    <span className="text-sm text-slate-500">Empresa</span>
                                    <span className="text-sm font-medium text-slate-900 capitalize">{user.company_name}</span>
                                </div>
                            )}
                            {user.plan && (
                                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                    <span className="text-sm text-slate-500">Plan</span>
                                    <span className="text-sm font-medium text-slate-900 capitalize">{user.plan}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                <span className="text-sm text-slate-500">API Backend</span>
                                <span className="text-sm font-medium text-emerald-600">Conectado ✓</span>
                            </div>
                        </div>
                    </div>

                    {(user.role === 'admin' || user.role === 'manager') && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
                            <h2 className="text-base font-semibold text-slate-900 mb-4">Equipo</h2>
                            <p className="text-sm text-slate-500 mb-4">
                                Invita a otros socios o empleados a unirse a tu empresa.
                            </p>

                            <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-3 mb-6">
                                <input
                                    type="email"
                                    required
                                    placeholder="correo@ejemplo.com"
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                                <select
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                                    value={inviteCategory}
                                    onChange={(e) => setInviteCategory(e.target.value)}
                                >
                                    <option value="technician">Técnico</option>
                                    <option value="manager">Mánager</option>
                                    <option value="admin">Administrador</option>
                                </select>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
                                >
                                    Invitar
                                </button>
                            </form>

                            {pendingInvitations.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-slate-900 mb-3">Invitaciones pendientes</h3>
                                    <div className="space-y-2">
                                        {pendingInvitations.map(inv => (
                                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{inv.email}</p>
                                                    <p className="text-xs text-slate-500 capitalize">Rol: {inv.role}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleCancelInvite(inv.id)}
                                                    className="text-xs font-medium text-red-500 hover:text-red-700"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl p-6 border border-slate-100">
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Acciones</h2>
                        <button
                            onClick={() => logout()}
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
