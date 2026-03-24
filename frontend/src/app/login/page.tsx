"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      // user stat is updated in AuthContext, useEffect redirects
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión con Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/25 mb-8">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Solar ERP
          </h1>
          <p className="text-lg text-sky-200/70 leading-relaxed">
            Plataforma de gestión integral para empresas de energía solar. Controlá instalaciones, clientes, inventario y mantenimientos desde un solo lugar.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            {[
              { icon: "⚡", label: "Instalaciones" },
              { icon: "👥", label: "Clientes" },
              { icon: "📦", label: "Inventario" },
              { icon: "🤖", label: "IA Asistente" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sky-200/60">
                <span>{f.icon}</span> {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/20">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Solar ERP</h2>
              <p className="text-xs text-sky-600 font-medium">Energía Solar</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Bienvenido
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Iniciá sesión para continuar
          </p>

          <div className="space-y-4">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex tracking-wide items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-5 h-5" />
              {loading ? "Iniciando..." : "Ingresar con Google"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
