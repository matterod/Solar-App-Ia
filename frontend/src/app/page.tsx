"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SolarPanel3D } from "@/components/ui/SolarPanel3D";

export default function LandingPage() {
  const staggerChildren = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/25">
             <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Solar ERP</span>
        </div>
        <div>
          <Link href="/login">
            <Button variant="primary" className="px-6 rounded-full">
              Ingresar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Text */}
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sky-400 text-xs font-semibold tracking-wide uppercase mb-8 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Plataforma Integral
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-8">
              El control total de tu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">Energía Solar</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-400 max-w-xl mb-12 leading-relaxed">
              Una arquitectura industrial diseñada para escalar. Gestioná tus instalaciones, clientes, inventario y mantenimientos con precisión matemática y asistencia de IA.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 bg-white text-slate-900 border-none hover:bg-slate-100 hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                  Empezar Ahora
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-full px-8 text-sky-400 hover:bg-sky-400/10 hover:text-sky-300">
                Saber más
              </Button>
            </motion.div>
          </motion.div>

          {/* Right 3D Model */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: "spring", duration: 2, bounce: 0.3, delay: 0.2 }}
            className="w-full flex justify-center lg:justify-end"
          >
             <SolarPanel3D />
          </motion.div>
        </div>

        {/* Feature Grid / Glassmorphism Cards */}
        <motion.div 
          variants={staggerChildren} 
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full max-w-6xl mx-auto"
        >
          {[
            { title: "Dashboard Inteligente", desc: "Monitor de instalaciones y estado de mantenimiento en tiempo real.", icon: "📊" },
            { title: "Inventario Activo", desc: "Control de stock técnico, salidas de paneles e inversores.", icon: "🏗️" },
            { title: "Asistencia IA", desc: "Nuestra IA analiza presupuestos y optimiza mantenimientos preventivos.", icon: "🤖" },
          ].map((f, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
