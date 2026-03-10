"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { agent } from "@/services/api";

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



    // ── Chat Screen ──
    return (
        <div className="flex flex-col h-[calc(100vh-0px)]">
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-200 bg-white/70 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-md shadow-sky-500/20">
                            <span className="text-lg">☀️</span>
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-slate-900">Asistente Sol</h1>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                En línea · Claude AI
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
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
                            className="text-xs text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors font-medium border border-sky-100"
                        >
                            Nueva Conversación
                        </button>
                        <button
                            onClick={logout}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
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
                    className="shrink-0 px-6 pb-3"
                >
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                            <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-100 text-xs text-sky-700 font-medium hover:bg-sky-100 hover:border-sky-200 transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Input */}
            <div className="shrink-0 p-4 border-t border-slate-200 bg-white/70 backdrop-blur-md">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage(input);
                    }}
                    className="flex gap-3"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Escuchando... Hablá ahora" : "Escribe tu mensaje a Sol..."}
                        className={`flex-1 px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all ${isListening
                            ? "bg-red-50 border-red-200 focus:border-red-300"
                            : "bg-slate-50 border-slate-200 focus:border-sky-300"
                            }`}
                    />
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`px-4 py-3 rounded-xl border text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center
                            ${isListening ? 'bg-red-100 border-red-300 text-red-600 animate-pulse' : 'bg-white border-slate-200'}
                        `}
                        title="Dictar por voz"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                    </button>
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    );
}
