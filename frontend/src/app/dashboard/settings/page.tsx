"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth, invitations, Invitation, team, TeamMember, plan as planApi, PlanUsage, telegram, TelegramStatus, TelegramLinkCode } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
    const { logout } = useAuth();
    const [user, setUser] = useState<{ email: string; full_name: string; role: string; company_name?: string | null; plan?: string | null } | null>(null);
    const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteCategory, setInviteCategory] = useState("installer");
    const [usage, setUsage] = useState<PlanUsage | null>(null);
    const [tgStatus, setTgStatus] = useState<TelegramStatus | null>(null);
    const [tgCode, setTgCode] = useState<TelegramLinkCode | null>(null);
    const [tgLoading, setTgLoading] = useState(false);

    useEffect(() => {
        auth.getMe().then(u => {
            setUser(u);
            if (u) {
                fetchTeam();
                planApi.usage().then(setUsage).catch(console.error);
                telegram.status().then(setTgStatus).catch(console.error);
                if (u.role === 'admin' || u.role === 'partner') {
                    fetchInvitations();
                }
            }
        }).catch(() => { });
    }, []);

    const fetchInvitations = () => {
        invitations.list().then(setPendingInvitations).catch(console.error);
    };

    const fetchTeam = () => {
        team.list().then(setTeamMembers).catch(console.error);
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

    const handleGenerateTgCode = async () => {
        setTgLoading(true);
        setTgCode(null);
        try {
            const result = await telegram.generateCode();
            setTgCode(result);
        } catch { /* */ }
        setTgLoading(false);
    };

    const handleUnlinkTg = async () => {
        if (!confirm("¿Desvincular tu cuenta de Telegram?")) return;
        try {
            await telegram.unlink();
            setTgStatus({ linked: false });
            setTgCode(null);
        } catch { /* */ }
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
                            <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                <span className="text-sm text-slate-500">API Backend</span>
                                <span className="text-sm font-medium text-emerald-600">Conectado ✓</span>
                            </div>
                        </div>
                    </div>

                    {usage && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-slate-900">Tu Plan</h2>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${usage.plan === 'pro' ? 'bg-gradient-to-r from-sky-400 to-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {usage.plan}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: "Consultas de IA", data: usage.ai_questions },
                                    { label: "Clientes", data: usage.clients },
                                    { label: "Instalaciones", data: usage.installations },
                                    { label: "Miembros del Equipo", data: usage.team_members },
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-slate-600 font-medium">{item.label}</span>
                                            <span className="text-slate-900">
                                                {item.data.limit === null ? "Ilimitado" : `${item.data.used} / ${item.data.limit}`}
                                            </span>
                                        </div>
                                        {item.data.limit !== null && (
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${item.data.used >= item.data.limit ? 'bg-red-500' : 'bg-sky-500'}`}
                                                    style={{ width: `${Math.min((item.data.used / item.data.limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {usage.plan === 'demo' && (
                                <div className="mt-6">
                                    <button 
                                        onClick={() => window.open("https://wa.me/[TU_NUMERO_AQUI]?text=Hola,%20quiero%20actualizar%20mi%20plan%20a%20Pro", "_blank")}
                                        className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        Actualizar a Pro ⚡
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {(user.role === 'admin' || user.role === 'partner') && (
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
                                    <option value="installer">Instalador</option>
                                    <option value="partner">Socio</option>
                                    <option value="accountant">Contador</option>
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

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-slate-100 mb-6"
                    >
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Tu Equipo</h2>
                        
                        {/* Mobile: Card layout */}
                        <div className="md:hidden space-y-3">
                            {teamMembers.map((member) => (
                                <div key={member.id} className="border border-slate-100 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-slate-900 text-sm">{member.full_name}</p>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${member.is_active
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-red-700"
                                        }`}>
                                            {member.is_active ? "Activo" : "Inactivo"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">{member.email}</p>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                                        {member.role === 'admin' ? 'Administrador' :
                                            member.role === 'partner' ? 'Socio' :
                                                member.role === 'installer' ? 'Instalador' :
                                                    member.role === 'accountant' ? 'Contador' : member.role}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Table layout */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-100">
                                        <th className="pb-3 font-medium">Nombre</th>
                                        <th className="pb-3 font-medium">Email</th>
                                        <th className="pb-3 font-medium">Rol</th>
                                        <th className="pb-3 font-medium">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {teamMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors pointer-events-none">
                                            <td className="py-4 font-medium text-slate-900">{member.full_name}</td>
                                            <td className="py-4 text-slate-600">{member.email}</td>
                                            <td className="py-4">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                                                    {member.role === 'admin' ? 'Administrador' :
                                                        member.role === 'partner' ? 'Socio' :
                                                            member.role === 'installer' ? 'Instalador' :
                                                                member.role === 'accountant' ? 'Contador' : member.role}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${member.is_active
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}>
                                                    {member.is_active ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* ── Telegram ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white rounded-2xl p-6 border border-slate-100 mb-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            {/* Telegram plane icon */}
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 shrink-0">
                                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">Telegram</h2>
                                <p className="text-xs text-slate-500">Chateá con Sol desde Telegram</p>
                            </div>
                            {tgStatus?.linked && (
                                <span className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                                    Vinculado ✓
                                </span>
                            )}
                        </div>

                        {tgStatus?.linked ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                    <span className="text-sm text-slate-500">Usuario</span>
                                    <span className="text-sm font-medium text-slate-900">
                                        {tgStatus.telegram_username ? `@${tgStatus.telegram_username}` : "Vinculado"}
                                    </span>
                                </div>
                                <button
                                    onClick={handleUnlinkTg}
                                    className="w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 hover:text-red-500 hover:border-red-200 transition-colors"
                                >
                                    Desvincular Telegram
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">
                                    Vinculá tu cuenta para hablar con Sol directamente desde Telegram — mismas herramientas, misma base de datos.
                                </p>

                                {!tgCode ? (
                                    <button
                                        onClick={handleGenerateTgCode}
                                        disabled={tgLoading}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium shadow-sm shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 disabled:opacity-60 transition-all"
                                    >
                                        {tgLoading ? "Generando..." : "Generar Código de Vinculación"}
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Code display */}
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
                                            <p className="text-xs text-slate-400 mb-1">Tu código (válido 10 min)</p>
                                            <p className="text-3xl font-bold tracking-[0.3em] text-slate-900 font-mono">
                                                {tgCode.code}
                                            </p>
                                        </div>

                                        {/* Instructions */}
                                        <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 space-y-2">
                                            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Cómo vincular</p>
                                            <ol className="text-sm text-sky-800 space-y-1 list-decimal list-inside">
                                                <li>
                                                    Abrí Telegram y buscá{" "}
                                                    {tgCode.bot_username
                                                        ? <a href={`https://t.me/${tgCode.bot_username}`} target="_blank" rel="noreferrer" className="font-bold underline">@{tgCode.bot_username}</a>
                                                        : <span className="font-bold">el bot de Solar ERP</span>
                                                    }
                                                </li>
                                                <li>Enviá el siguiente mensaje:</li>
                                            </ol>
                                            <div className="mt-2 rounded-lg bg-white border border-sky-200 px-4 py-2 font-mono text-sm text-slate-800 select-all">
                                                /vincular {tgCode.code}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleGenerateTgCode}
                                            className="text-xs text-slate-400 hover:text-slate-600 underline w-full text-center"
                                        >
                                            Generar nuevo código
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

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
