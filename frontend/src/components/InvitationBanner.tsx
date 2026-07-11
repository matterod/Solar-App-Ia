"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invitations, ReceivedInvitation } from "@/services/api";

export default function InvitationBanner() {
    const [received, setReceived] = useState<ReceivedInvitation[]>([]);
    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        invitations
            .received()
            .then(setReceived)
            .catch(() => { });
    }, []);

    const handleAccept = async (id: string) => {
        setLoading(id);
        try {
            await invitations.accept(id);
            setReceived((prev) => prev.filter((i) => i.id !== id));
            // Reload so the user sees updated company context
            window.location.reload();
        } catch (error: any) {
            alert("Error al aceptar invitación: " + error.message);
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        setLoading(id);
        try {
            await invitations.reject(id);
            setReceived((prev) => prev.filter((i) => i.id !== id));
        } catch (error: any) {
            alert("Error al rechazar invitación: " + error.message);
        } finally {
            setLoading(null);
        }
    };

    if (received.length === 0) return null;

    return (
        <div className="px-4 md:px-6 lg:px-8 pt-4">
            <AnimatePresence>
                {received.map((inv) => (
                    <motion.div
                        key={inv.id}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12, height: 0 }}
                        className="mb-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-4 md:p-5 shadow-sm"
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                            {/* Icon */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                </svg>
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                    Te han invitado a unirte a <span className="text-sky-700">{inv.companyName}</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Rol asignado: <span className="capitalize font-medium">{inv.role}</span>
                                    {" · "}Tu empresa demo actual será eliminada al aceptar.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleAccept(inv.id)}
                                    disabled={loading === inv.id}
                                    className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading === inv.id ? "..." : "Aceptar"}
                                </button>
                                <button
                                    onClick={() => handleReject(inv.id)}
                                    disabled={loading === inv.id}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
