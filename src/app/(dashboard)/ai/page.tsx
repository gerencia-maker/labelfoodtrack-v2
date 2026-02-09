"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { FoodBotAvatar } from "@/components/foodbot/FoodBotAvatar";
import { BotMessageRenderer } from "@/components/foodbot/BotMessageRenderer";
import {
  Send,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE = `\u00a1Hola! \ud83d\udc4b Soy **FoodBot**, tu asistente de seguridad alimentaria. Estoy aqu\u00ed para ayudarte con normativas, etiquetado, conservaci\u00f3n y buenas pr\u00e1cticas.

\u00bfQu\u00e9 te gustar\u00eda consultar?

[menu]
\ud83d\udcca|Resumen|resumen
\ud83d\udce6|Productos|productos
\u23f0|Vencimientos|vencimientos
\ud83c\udfe2|Sedes|sedes
\ud83d\udcc8|An\u00e1lisis|analisis
[/menu]`;

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { getToken, userData } = useAuth();
  const t = useTranslations("ai");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initRef = useRef(false);

  const userInitials = userData?.name
    ? userData.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "TU";

  // Initial welcome message
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      setMessages([
        { role: "assistant", content: WELCOME_MESSAGE, timestamp: new Date() },
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      const userMsg: Message = {
        role: "user",
        content: msg,
        timestamp: new Date(),
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

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
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages([
            ...newMessages,
            {
              role: "assistant",
              content: data.reply,
              timestamp: new Date(),
            },
          ]);
        } else {
          const err = await res.json();
          setMessages([
            ...newMessages,
            {
              role: "assistant",
              content: `Error: ${err.error || "No se pudo obtener respuesta"}`,
              timestamp: new Date(),
            },
          ]);
        }
      } catch {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "Error de conexion. Intenta de nuevo.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, messages, getToken]
  );

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
    const userMessages = messages.slice(0, idx);
    const lastUserMsg = [...userMessages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMsg) return;

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
          messages: trimmed.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([
          ...trimmed,
          {
            role: "assistant",
            content: data.reply,
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages([
        ...trimmed,
        {
          role: "assistant",
          content: "Error al regenerar.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
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
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              FoodBot
            </h1>
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
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 py-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {/* Bot avatar */}
            {msg.role === "assistant" && (
              <div className="shrink-0 mt-1">
                <FoodBotAvatar size="sm" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%] sm:max-w-[75%]",
                msg.role === "user" && "order-first"
              )}
            >
              {msg.role === "assistant" ? (
                <BotMessageRenderer
                  content={msg.content}
                  onAction={(label) => handleSend(label)}
                  timestamp={formatTime(msg.timestamp)}
                />
              ) : (
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-br-md">
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                  <p className="text-[10px] mt-1.5 text-right text-white/60">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              )}

              {/* Bot message actions */}
              {msg.role === "assistant" && (
                <div
                  className="flex items-center gap-1 mt-1 ml-1 opacity-0 transition-opacity"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.opacity = "1")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.opacity = "0")
                  }
                >
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {copiedIdx === i ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
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
                <span
                  className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
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
