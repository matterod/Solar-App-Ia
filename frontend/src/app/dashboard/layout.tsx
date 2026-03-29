"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import InvitationBanner from "@/components/InvitationBanner";
import { DashboardProviders } from "./providers";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    // Only show full page loader if we don't have a user OR we are specifically in a hard-loading state.
    // However, if we already have a user, we should SHOW the layout to prevent the sidebar from disappearing.
    const isAuthenticating = loading && !user;

    if (isAuthenticating) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
                </div>
            </div>
        );
    }

    // Still check for redirected state (determined in useEffect)
    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-50">
            <Toaster theme="dark" richColors />
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-x-hidden md:ml-64">
                <div className="min-h-screen pt-14 md:pt-0">
                    <InvitationBanner />
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <DashboardProviders>
                            {children}
                        </DashboardProviders>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

