"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { agent, plan as planApi, PlanUsage } from "@/services/api";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    toolCalls?: Array<{ tool: string; input: Record<string, unknown> }>;
}

const suggestions = [
    "¿Cuántas instalaciones hay?",
    "¿Cuándo es el próximo mantenimiento?",
    "¿Qué productos hay en stock bajo?",
    "Dame las estadísticas del negocio",
    "¿Cuántos clientes tenemos?",
    "¿Hay instalaciones en progreso?",
];

export default function AssistantPage() {
    const { user, dbUser, logout } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [usage, setUsage] = useState<PlanUsage | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Speech Recognition State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        // Initialize Web Speech API
        if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-AR'; // Español Argentina

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Si hay texto final, lo sumamos al input actual
                if (finalTranscript) {
                    setInput((prev) => prev + " " + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.error(e);
                }
            } else {
                alert("Tu navegador no soporta reconocimiento de voz nativo.");
            }
        }
    };

    // Load conversation history from session storage on mount
    useEffect(() => {
        const savedHistory = sessionStorage.getItem("solar_chat_history");
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                const withDates = parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
                setMessages(withDates);
                return;
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }

        // Default initial message if no history
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content: "¡Hola! Soy **Sol** ☀️, tu asistente de energía solar.\n\nPuedo ayudarte con:\n- 🔍 Buscar instalaciones y clientes\n- 🔧 Programar mantenimientos\n- 📦 Consultar inventario\n- 📊 Ver estadísticas del negocio\n\n¿En qué puedo ayudarte?",
                timestamp: new Date(),
            },
        ]);
    }, []);

    // Fetch plan usage on mount
    useEffect(() => {
        planApi.usage().then(setUsage).catch(console.error);
    }, []);

    // Save history to session storage when messages update
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem("solar_chat_history", JSON.stringify(messages));
        }
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || !user) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date(),
        };
        const currentHistory = messages.map(m => ({ role: m.role, content: m.content }));
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const data = await agent.chat(text, currentHistory);

            // Optimistic update of AI limit counter
            if (usage && usage.plan === 'demo') {
                setUsage(prev => prev ? { ...prev, ai_questions: { ...prev.ai_questions, used: prev.ai_questions.used + 1 } } : prev);
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
                toolCalls: data.tool_calls,
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `❌ Error: ${err instanceof Error ? err.message : "No se pudo conectar al servidor"}.\n\nVerificá que el backend esté corriendo correctamente.`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };



    const limitReached = usage && usage.plan === 'demo' && usage.ai_questions.limit !== null && usage.ai_questions.used >= usage.ai_questions.limit;

    // ── Chat Screen ──
    return (
        <div className="-mt-14 md:mt-0 flex flex-col h-screen">
            {/* Header */}
            <div className="shrink-0 pl-14 pr-3 md:px-6 py-0 md:py-4 h-14 md:h-auto flex items-center border-b border-slate-200 bg-white/90 backdrop-blur-md z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-md shadow-sky-500/20 shrink-0">
                            <span className="text-base sm:text-lg">☀️</span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm sm:text-base font-semibold text-slate-900">Asistente Sol</h1>
                            <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1.5">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                En línea · Claude AI
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <button
                            onClick={() => {
                                sessionStorage.removeItem("solar_chat_history");
                                setMessages([{
                                    id: "welcome",
                                    role: "assistant",
                                    content: "¡Hola! Soy **Sol** ☀️, tu asistente de energía solar.\n\nPuedo ayudarte con:\n- 🔍 Buscar instalaciones y clientes\n- 🔧 Programar mantenimientos\n- 📦 Consultar inventario\n- 📊 Ver estadísticas del negocio\n\n¿En qué puedo ayudarte?",
                                    timestamp: new Date(),
                                }]);
                            }}
                            className="text-[10px] sm:text-xs text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors font-medium border border-sky-100"
                        >
                            Nueva Conversación
                        </button>
                        <button
                            onClick={logout}
                            className="text-[10px] sm:text-xs text-slate-400 hover:text-slate-600 transition-colors hidden sm:block"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
                {limitReached && (
                    <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center justify-between">
                        <span>Has alcanzado el límite de consultas de IA en el plan Demo.</span>
                        <button 
                            onClick={() => window.open("https://wa.me/[TU_NUMERO_AQUI]?text=Hola,%20quiero%20actualizar%20mi%20plan%20a%20Pro", "_blank")}
                            className="text-red-700 underline font-medium"
                        >
                            Actualizar a Pro
                        </button>
                    </div>
                )}
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed
                  ${msg.role === "user"
                                        ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/15"
                                        : "bg-white border border-slate-100 text-slate-700 shadow-sm"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                {msg.toolCalls && msg.toolCalls.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                        <p className="text-[10px] text-slate-400 mb-1">Herramientas usadas:</p>
                                        {msg.toolCalls.map((tc, i) => (
                                            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 text-[10px] text-sky-700 mr-1">
                                                🔧 {tc.tool}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className={`mt-2 text-[10px] ${msg.role === "user" ? "text-sky-200" : "text-slate-400"}`}>
                                    {msg.timestamp.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                            <div className="flex gap-1.5 items-center">
                                <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0ms]" />
                                <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce [animation-delay:150ms]" />
                                <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce [animation-delay:300ms]" />
                                <span className="text-xs text-slate-400 ml-2">Sol está pensando...</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="shrink-0 px-3 sm:px-6 pb-3"
                >
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                            <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                disabled={limitReached || false}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                    limitReached ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-sky-50 border-sky-100 text-sky-700 hover:bg-sky-100 hover:border-sky-200"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            <div className="shrink-0 p-2.5 sm:p-4 border-t border-slate-200 bg-white/70 backdrop-blur-md">
                {usage && usage.plan === 'demo' && (
                    <div className="text-[10px] text-slate-500 mb-2 pl-2">
                        {usage.ai_questions.used} / {usage.ai_questions.limit} consultas usadas
                    </div>
                )}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage(input);
                    }}
                    className="flex gap-2 sm:gap-3"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={limitReached || false}
                        placeholder={limitReached ? "Actualizá a Pro para seguir usando Sol" : isListening ? "Escuchando... Hablá ahora" : "Escribe tu mensaje a Sol..."}
                        className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${
                            limitReached ? "bg-slate-100 cursor-not-allowed" :
                            isListening ? "bg-red-50 border-red-200 focus:border-red-300" : "bg-slate-50 border-slate-200 focus:border-sky-300"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={limitReached || false}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center
                            ${limitReached ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200" :
                              isListening ? 'bg-red-100 border-red-300 text-red-600 animate-pulse' : 'bg-white border-slate-200'}
                        `}
                        title="Dictar por voz"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                    </button>
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping || limitReached || false}
                        className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-xs sm:text-sm font-medium shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    );
}
