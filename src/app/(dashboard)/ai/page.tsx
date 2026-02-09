"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { FoodBotAvatar } from "@/components/foodbot/FoodBotAvatar";
import {
  Send,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Shield,
  Zap,
  Clock,
  BookOpen,
  ChevronRight,
  User,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  {
    icon: Shield,
    title: "Requisitos INVIMA",
    description: "Normativa de etiquetado",
    gradient: "from-blue-500 to-indigo-500",
    query: "Cuales son los requisitos de etiquetado INVIMA para alimentos en Colombia?",
  },
  {
    icon: Zap,
    title: "Alergenos",
    description: "Lista obligatoria",
    gradient: "from-amber-500 to-orange-500",
    query: "Cuales son los alergenos de declaracion obligatoria en etiquetado de alimentos?",
  },
  {
    icon: Clock,
    title: "Conservacion",
    description: "Tiempos por producto",
    gradient: "from-cyan-500 to-teal-500",
    query: "Cuales son los tiempos de conservacion recomendados para productos de panaderia?",
  },
  {
    icon: BookOpen,
    title: "BPM Cocinas",
    description: "Buenas practicas",
    gradient: "from-purple-500 to-pink-500",
    query: "Cuales son las buenas practicas de manufactura (BPM) para cocinas industriales?",
  },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { getToken, userData } = useAuth();
  const t = useTranslations("ai");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showWelcome = messages.length === 0;

  const userInitials = userData?.name
    ? userData.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "TU";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Auto-resize textarea back to 1 row
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { role: "assistant", content: data.reply, timestamp: new Date() }]);
      } else {
        const err = await res.json();
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${err.error || "No se pudo obtener respuesta"}`, timestamp: new Date() },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error de conexion. Intenta de nuevo.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, getToken]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (content: string, idx: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleRegenerate = async (idx: number) => {
    // Find the last user message before this assistant message
    const userMessages = messages.slice(0, idx);
    const lastUserMsg = [...userMessages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    // Remove messages from idx onwards and resend
    const trimmed = messages.slice(0, idx);
    setMessages(trimmed);
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...trimmed, { role: "assistant", content: data.reply, timestamp: new Date() }]);
      }
    } catch {
      setMessages([...trimmed, { role: "assistant", content: "Error al regenerar.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700/50">
        <FoodBotAvatar size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">FoodBot</h1>
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En linea
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-2 -mr-2">
        {/* Welcome screen */}
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <FoodBotAvatar size="xl" />

            <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
              {t("greeting")} 🧪
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Tu cientifico de seguridad alimentaria. Puedo ayudarte con normativas, etiquetado, conservacion y buenas practicas.
            </p>

            {/* Suggestion cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => handleSend(s.query)}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-3.5 text-left hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 transition-all"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-md", s.gradient)}>
                    <s.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-orange-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3 py-2", msg.role === "user" ? "justify-end" : "justify-start")}>
            {/* Bot avatar */}
            {msg.role === "assistant" && (
              <div className="shrink-0 mt-1">
                <FoodBotAvatar size="sm" />
              </div>
            )}

            <div className={cn("max-w-[80%] sm:max-w-[75%]", msg.role === "user" && "order-first")}>
              {/* Bubble */}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-br-md"
                    : "bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-bl-md shadow-sm"
                )}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                <p className={cn(
                  "text-[10px] mt-1.5 text-right",
                  msg.role === "user" ? "text-white/60" : "text-slate-400 dark:text-slate-500"
                )}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>

              {/* Bot message actions */}
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mt-1 ml-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity group-hover:opacity-100"
                  style={{ opacity: undefined }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {copiedIdx === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedIdx === i ? "Copiado" : "Copiar"}
                  </button>
                  <button className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-emerald-500 transition-colors">
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-red-400 transition-colors">
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleRegenerate(i)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerar
                  </button>
                </div>
              )}
            </div>

            {/* User avatar */}
            {msg.role === "user" && (
              <div className="shrink-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white shadow-md">
                {userInitials}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 py-2">
            <div className="shrink-0 mt-1">
              <FoodBotAvatar size="sm" />
            </div>
            <div className="rounded-2xl rounded-bl-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              disabled={loading}
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-400 dark:focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-500/20 disabled:opacity-50 transition-colors"
              style={{ maxHeight: 120 }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
              input.trim() && !loading
                ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:scale-105 active:scale-95"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
          FoodBot puede cometer errores. Verifica la informacion importante.
        </p>
      </div>
    </div>
  );
}
