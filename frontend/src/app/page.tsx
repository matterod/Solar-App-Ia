"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SolarPanel3D } from "@/components/ui/SolarPanel3D";
import { useRef, useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

export default function LandingPage() {
  const { active, progress } = useProgress();
  const [showLoader, setShowLoader] = useState(true);

  // Mantenemos el loader visualmente sincronizado incluso si WebGL parpadea
  useEffect(() => {
    if (!active && progress === 100) {
      setTimeout(() => setShowLoader(false), 500); // Medio segundo de gracia para asegurar el montaje
    }
  }, [active, progress]);

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
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.4 } },
  };

  // Parallax super premium para el modelo 3D
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden relative selection:bg-sky-500/30">
      
      {/* 🟢 PANTALLA DE CARGA GLOBAL (Cortina) 🟢 */}
      <AnimatePresence>
        {showLoader && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center"
          >
            {/* Animación del isologo o spinner */}
            <div className="relative flex justify-center items-center mb-8">
              <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full" />
              <div className="relative h-16 w-16 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_-5px_rgba(14,165,233,0.5)]">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </div>
            </div>
            
            <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,1)]" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-sky-400 font-mono text-xs tracking-[0.3em] uppercase">
              CARGANDO SISTEMA {Math.round(progress)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Nav Totalmente Integrado (sin cortes) */}
      <nav className="relative z-50 flex items-center justify-between p-6 lg:px-12 bg-transparent sticky top-0">
         <div className="flex items-center gap-3">
           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/25">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
             </svg>
           </div>
           <span className="text-xl font-bold text-white tracking-tight">Solar ERP</span>
         </div>

         {/* Secciones de Navegación centradas */}
         <div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-300">
           <a href="#features" className="hover:text-sky-400 transition-colors">La IA Sol</a>
           <a href="#modulos" className="hover:text-sky-400 transition-colors">Módulos ERP</a>
           <a href="#planes" className="hover:text-sky-400 transition-colors">Planes</a>
         </div>

         <div>
           <Link href="/login">
             <Button variant="primary" className="px-6 rounded-full font-medium shadow-[0_0_20px_-5px_rgba(14,165,233,0.4)]">
               Ingresar al Sistema
             </Button>
           </Link>
         </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 w-full min-h-[90vh] flex flex-col justify-center" ref={ref}>
        {/* Absolute 3D Model Background con Parallax */}
        <motion.div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ y: backgroundY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: !active ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          <SolarPanel3D />
        </motion.div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10 pointer-events-none py-20 lg:py-0">
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate={!active ? "show" : "hidden"}
              className="flex flex-col items-start w-full"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sky-400 text-xs font-semibold tracking-wide uppercase mb-8 backdrop-blur-md shadow-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                Impulsado por IA
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-8">
                Llevá el control de tu <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">empresa solar</span> <br className="hidden md:block"/>
                al siguiente nivel.
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-400 max-w-xl mb-12 leading-relaxed">
                Gestioná ventas, clientes y stock en un entorno visual y fácil de usar. ¿Estás a mil? Usá a <span className="text-sky-400 font-semibold">Sol</span>, tu asistente virtual, para automatizar procesos pesados o pedirle resúmenes por chat sin tener que abrir la aplicación.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pointer-events-auto">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-full px-8 bg-sky-500 text-white border-none hover:bg-sky-400 hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(14,165,233,0.5)]">
                    Empezar Ahora
                  </Button>
                </Link>
                <a href="#features" className="w-full sm:w-auto">
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-full px-8 text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                    Conocer a Sol
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section: Sol AI */}
      <section id="features" className="relative z-20 py-32 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5">
        <div className="container mx-auto px-6 lg:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Conocé a <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Sol</span>, tu nueva administradora.
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed">
              No es un chatbot de soporte. Es el motor operativo de tu empresa operando 24/7. Ella cruza datos, automatiza procesos repetitivos y te mantiene al tanto de lo que importa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* AI Callouts */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-9xl">🧠</span>
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-sky-500/30">
                  💬
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Gestión Conversacional Integral</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Olvidate de los formularios interminables. Decile a Sol: <span className="italic">"Agregá un costo de $50.000 de flete en la instalación de los Pérez"</span>, y ella lo registra en la base de datos, mapea al cliente correcto y te avisa que está listo.
                </p>
                <ul className="space-y-3">
                  {['Creación de Clientes y Proyectos', 'Registro de Costos e Inventario', 'Armado automático de Presupuestos'].map((item, i) => (
                    <li key={i} className="flex items-center text-sm font-medium text-slate-300">
                      <svg className="h-5 w-5 text-sky-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-9xl">⚡</span>
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-cyan-500/30">
                  📄
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Automatización de Proveedores</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  ¿Te mandan un PDF de 40 hojas con actualización de precios? Sol lo procesa usando modelos de IA, detecta qué productos de tu stock cambiaron, y aplica la actualización calculando nuevamente tus márgenes.
                </p>
                <div className="bg-black/50 p-5 rounded-xl border border-white/5 font-mono text-sm shadow-inner">
                  <span className="text-slate-500">Sol &gt;</span> <span className="text-sky-300">"Encontré 12 precios nuevos en el PDF del proveedor Huawei. El modelo SUN2000 subió un 5%. ¿Actualizo tu lista de precios automática?"</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Grid of Core Modules */}
      <section className="relative z-20 py-24 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Control de Inventario", desc: "Seguimiento milimétrico de paneles y existencias. Alertas de stock bajo antes de enfrentar tu próxima instalación.", icon: "📦" },
              { title: "Mantenimiento Preventivo", desc: "Sol te envía recordatorios recurrentes mes a mes para que coordines las limpiezas e inspecciones técnicas de tus obras activas.", icon: "🔧" },
              { title: "Rentabilidad por Obra", desc: "Balanceo de costos reales vs presupuestados. Analizá dónde estás perdiendo plata y qué equipos te dan mejor margen comercial.", icon: "📈" },
            ].map((f, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 hover:bg-slate-800/50 hover:border-sky-500/20 transition-all cursor-default"
              >
                <div className="text-4xl mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-20 py-32 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-sky-950/20" />
        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Elevá el estándar de tu <br className="hidden md:block"/> empresa energética.
          </h2>
          <Link href="/login">
            <Button size="lg" className="rounded-full px-12 py-6 text-lg bg-sky-500 text-white border-none hover:bg-sky-400 shadow-[0_0_50px_-10px_rgba(14,165,233,0.5)] hover:scale-105 transition-all">
              Probar Solar ERP Ahora
            </Button>
          </Link>

          <div className="mt-20 flex flex-col items-center gap-3">
            <p className="text-slate-500 text-sm font-medium">Diseñado para la industria latinoamericana inteligente.</p>
            <div className="h-px w-24 bg-white/10" />
            <p className="text-slate-400 text-sm font-medium">
              Creado por <span className="text-sky-400 font-semibold tracking-wide">Mateo Rodriguez</span>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
