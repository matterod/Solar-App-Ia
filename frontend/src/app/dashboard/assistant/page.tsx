"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    toolCalls?: Array<{ tool: string; input: Record<string, unknown> }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const suggestions = [
    "¿Cuántas instalaciones hay?",
    "¿Cuándo es el próximo mantenimiento?",
    "¿Qué productos hay en stock bajo?",
    "Dame las estadísticas del negocio",
    "¿Cuántos clientes tenemos?",
    "¿Hay instalaciones en progreso?",
];

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [showLogin, setShowLogin] = useState(true);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

    // Check for saved token
    useEffect(() => {
        const saved = localStorage.getItem("solar_token");
        if (saved) {
            setToken(saved);
            setShowLogin(false);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError("");

        try {
            const res = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `username=${encodeURIComponent(loginEmail)}&password=${encodeURIComponent(loginPassword)}`,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Login incorrecto");
            }

            const data = await res.json();
            setToken(data.access_token);
            localStorage.setItem("solar_token", data.access_token);
            setShowLogin(false);
        } catch (err) {
            setLoginError(err instanceof Error ? err.message : "Error de conexión");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleRegister = async () => {
        setIsLoggingIn(true);
        setLoginError("");

        try {
            const res = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                    full_name: "Admin",
                    role: "admin",
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Error al registrar");
            }

            // Auto-login after register
            await handleLogin(new Event("submit") as unknown as React.FormEvent);
        } catch (err) {
            setLoginError(err instanceof Error ? err.message : "Error al registrar");
            setIsLoggingIn(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || !token) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const res = await fetch(`${API_URL}/api/v1/agent/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: text,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                }),
            });

            if (res.status === 401) {
                setToken(null);
                localStorage.removeItem("solar_token");
                setShowLogin(true);
                setIsTyping(false);
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Error del servidor");
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
                content: `❌ Error: ${err instanceof Error ? err.message : "No se pudo conectar al servidor"}.\n\nVerificá que:\n1. El backend esté corriendo (\`docker compose up\`)\n2. La API key de Anthropic esté configurada en \`.env\``,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    // ── Login Screen ──
    if (showLogin) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-0px)] p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm"
                >
                    <div className="text-center mb-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/20 mx-auto mb-3">
                            <span className="text-2xl">☀️</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Iniciar Sesión</h2>
                        <p className="text-sm text-slate-500 mt-1">Conectate a Sol para comenzar</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-3">
                        <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
                        />
                        <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Contraseña"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
                        />

                        {loginError && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{loginError}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-medium shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 transition-all"
                        >
                            {isLoggingIn ? "Conectando..." : "Iniciar Sesión"}
                        </button>

                        <button
                            type="button"
                            onClick={handleRegister}
                            disabled={isLoggingIn || !loginEmail || !loginPassword}
                            className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            Crear Cuenta Nueva
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

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
                            onClick={() => {
                                setToken(null);
                                localStorage.removeItem("solar_token");
                                setShowLogin(true);
                            }}
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
                        placeholder="Escribe tu mensaje a Sol..."
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all"
                    />
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
