"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  MessageCircleMore,
  Minimize2,
  Sparkles
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";

import type { BusinessSnapshot, ChatMessage } from "@/lib/types";

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;

type ApexIntelligenceProps = {
  snapshot: BusinessSnapshot;
};

export function ApexIntelligence({ snapshot }: ApexIntelligenceProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Global Intelligence está conectado al estado actual del negocio. Preguntame por reposición, margen, rotación, inventario o stock crítico."
    }
  ]);

  const formRef = useRef<HTMLFormElement>(null);

  const quickPrompts = useMemo(
    () => [
      "¿Qué debería reponer hoy?",
      "¿Cómo está mi margen?",
      "¿Qué se vende más?"
    ],
    []
  );

  async function ask(message: string) {
    const text = message.trim();
    if (!text || pending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          snapshot
        })
      });

      const payload = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      const answer =
        payload.answer ??
        payload.error ??
        "No pude analizar esa consulta con el estado actual.";

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "No pude comunicarme con el motor analítico. Los datos del dashboard siguen disponibles."
        }
      ]);
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.button
            key="closed"
            layoutId="apex-intelligence"
            transition={spring}
            onClick={() => setOpen(true)}
            className="flex h-14 items-center gap-3 rounded-full border border-white/10 bg-black px-5 text-white shadow-[0_18px_60px_rgba(0,0,0,.32)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.985 }}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#8F0000]">
              <Sparkles size={15} />
            </span>
            <span className="text-sm font-semibold">Global Intelligence</span>
          </motion.button>
        ) : (
          <motion.section
            key="open"
            layoutId="apex-intelligence"
            transition={spring}
            className="apex-glass flex h-[min(640px,calc(100vh-32px))] w-[min(430px,calc(100vw-32px))] flex-col overflow-hidden rounded-[30px] bg-[var(--apex-surface)]"
          >
            <header className="flex items-center justify-between border-b border-[var(--apex-border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#8F0000] text-white">
                  <Bot size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">Global Intelligence</h2>
                  <p className="mt-0.5 text-[10px] font-medium text-[var(--apex-muted)]">
                    Contexto operativo en tiempo real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]"
                aria-label="Minimizar Global Intelligence"
              >
                <Minimize2 size={15} />
              </button>
            </header>

            <div className="apex-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-12 rounded-[20px] rounded-br-md bg-[#8F0000] px-4 py-3 text-sm leading-6 text-white"
                      : "mr-8 rounded-[20px] rounded-bl-md border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3 text-sm leading-6"
                  }
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}

              {pending && (
                <div className="mr-24 flex items-center gap-2 rounded-[20px] rounded-bl-md border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3 text-xs text-[var(--apex-muted)]">
                  <MessageCircleMore size={15} className="animate-pulse" />
                  Analizando inventario, ventas y márgenes…
                </div>
              )}
            </div>

            <div className="border-t border-[var(--apex-border)] p-3">
              <div className="apex-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void ask(prompt)}
                    className="shrink-0 rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-1.5 text-[10px] font-semibold text-[var(--apex-muted)] transition hover:text-[var(--apex-text)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form ref={formRef} onSubmit={submit} className="relative">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  rows={1}
                  placeholder="Preguntá sobre tu negocio…"
                  className="apex-input max-h-28 resize-none py-3.5 pl-4 pr-14 text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || pending}
                  className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-[#8F0000] text-white disabled:opacity-35"
                  aria-label="Enviar consulta"
                >
                  <ArrowUp size={16} />
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
