"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  Minimize2,
  PackageSearch,
  Sparkles,
  TrendingUp
} from "lucide-react";
import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { calculateMetrics } from "@/lib/analytics";
import type { BusinessSnapshot, ChatMessage } from "@/lib/types";

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;

type ApexIntelligenceProps = {
  snapshot: BusinessSnapshot;
};

type UiLanguage = "es" | "en" | "pt" | "fr" | "de";

const uiCopy: Record<
  UiLanguage,
  {
    title: string;
    subtitle: string;
    welcome: string;
    placeholder: string;
    analyzing: string;
    prompts: string[];
  }
> = {
  es: {
    title: "Global Intelligence",
    subtitle: "Analista conectado a tu negocio",
    welcome:
      "Estoy leyendo inventario, rotación, costos, precios y ventas. Puedo cruzar esos datos para recomendar reposición, detectar capital inmovilizado, revisar márgenes o simular cambios de precio.",
    placeholder: "Preguntá algo sobre tu negocio…",
    analyzing: "Cruzando stock, ventas, costos y márgenes…",
    prompts: [
      "¿Qué debería reponer hoy y cuánto costaría?",
      "¿Qué productos me inmovilizan capital?",
      "¿Cómo están mis márgenes?",
      "¿Qué pasa si subo precios 8%?"
    ]
  },
  en: {
    title: "Global Intelligence",
    subtitle: "Analyst connected to your business",
    welcome:
      "I am reading inventory, rotation, costs, prices and sales. I can combine them to recommend restocking, detect tied capital, review margins or simulate price changes.",
    placeholder: "Ask about your business…",
    analyzing: "Crossing stock, sales, costs and margins…",
    prompts: [
      "What should I restock today and what would it cost?",
      "Which products tie up capital?",
      "How are my margins?",
      "What if I raise prices 8%?"
    ]
  },
  pt: {
    title: "Global Intelligence",
    subtitle: "Analista conectado ao seu negócio",
    welcome:
      "Estou lendo estoque, rotação, custos, preços e vendas. Posso cruzar esses dados para recomendar reposição, detectar capital parado, revisar margens ou simular mudanças de preço.",
    placeholder: "Pergunte sobre seu negócio…",
    analyzing: "Cruzando estoque, vendas, custos e margens…",
    prompts: [
      "O que devo repor hoje e quanto custaria?",
      "Quais produtos prendem capital?",
      "Como estão minhas margens?",
      "E se eu aumentar os preços em 8%?"
    ]
  },
  fr: {
    title: "Global Intelligence",
    subtitle: "Analyste connecté à votre activité",
    welcome:
      "J’analyse stock, rotation, coûts, prix et ventes. Je peux croiser ces données pour recommander le réapprovisionnement, détecter le capital immobilisé, revoir les marges ou simuler des prix.",
    placeholder: "Posez une question sur votre activité…",
    analyzing: "Analyse du stock, des ventes, coûts et marges…",
    prompts: [
      "Que dois-je réapprovisionner aujourd’hui ?",
      "Quels produits immobilisent du capital ?",
      "Comment évoluent mes marges ?",
      "Et si j’augmente les prix de 8% ?"
    ]
  },
  de: {
    title: "Global Intelligence",
    subtitle: "Analyst für deinen Betrieb",
    welcome:
      "Ich analysiere Bestand, Umschlag, Kosten, Preise und Verkäufe. Daraus kann ich Nachbestellungen empfehlen, gebundenes Kapital erkennen, Margen prüfen oder Preisänderungen simulieren.",
    placeholder: "Frag etwas über deinen Betrieb…",
    analyzing: "Bestand, Verkäufe, Kosten und Margen werden analysiert…",
    prompts: [
      "Was sollte ich heute nachbestellen?",
      "Welche Produkte binden Kapital?",
      "Wie sind meine Margen?",
      "Was passiert bei 8% höheren Preisen?"
    ]
  }
};

function languageFromLocale(locale: string): UiLanguage {
  if (locale.startsWith("en")) return "en";
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("fr")) return "fr";
  if (locale.startsWith("de")) return "de";
  return "es";
}

export function ApexIntelligence({ snapshot }: ApexIntelligenceProps) {
  const language = languageFromLocale(snapshot.locale);
  const copy = uiCopy[language];
  const metrics = useMemo(() => calculateMetrics(snapshot), [snapshot]);

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: copy.welcome
    }
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.id === "welcome") {
        return [{ id: "welcome", role: "assistant", content: copy.welcome }];
      }
      return current;
    });
  }, [copy.welcome]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

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

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            payload.answer ??
            payload.error ??
            "No pude completar el análisis con los datos actuales."
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "No pude comunicarme con el motor analítico. El resto de la app sigue disponible."
        }
      ]);
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void ask(input);
    }
  }

  return (
    <div className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-50 sm:bottom-6 sm:right-6">
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.button
            key="closed"
            layoutId="global-intelligence"
            transition={spring}
            type="button"
            onClick={() => setOpen(true)}
            whileTap={{ scale: 0.97 }}
            className="flex h-14 touch-manipulation items-center gap-3 rounded-full border border-white/10 bg-black px-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.34)]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#8F0000]">
              <Sparkles size={16} />
            </span>
            <span className="hidden text-sm font-semibold sm:inline">
              {copy.title}
            </span>
          </motion.button>
        ) : (
          <motion.section
            key="open"
            layoutId="global-intelligence"
            transition={spring}
            className="fixed inset-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--apex-bg)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(720px,calc(100dvh-48px))] sm:w-[440px] sm:rounded-[30px] sm:border sm:border-[var(--apex-border)] sm:bg-[var(--apex-surface)] sm:shadow-[0_28px_100px_rgba(0,0,0,.28)] sm:backdrop-blur-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--apex-border)] px-4 py-3.5 sm:px-5 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#8F0000] text-white">
                  <BrainCircuit size={19} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{copy.title}</h2>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-[var(--apex-muted)]">
                    {copy.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 touch-manipulation place-items-center rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]"
                aria-label="Minimizar Global Intelligence"
              >
                <Minimize2 size={16} />
              </button>
            </header>

            <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-[var(--apex-border)] px-3 py-3 sm:px-4">
              <InsightChip
                icon={<PackageSearch size={14} />}
                value={String(
                  metrics.lowStockCount + metrics.outOfStockCount
                )}
                label={language === "en" ? "alerts" : "alertas"}
              />
              <InsightChip
                icon={<TrendingUp size={14} />}
                value={`${metrics.marginPct.toFixed(1)}%`}
                label={language === "en" ? "margin" : "margen"}
              />
              <InsightChip
                icon={<ChartNoAxesCombined size={14} />}
                value={String(metrics.inventoryUnits)}
                label={language === "en" ? "units" : "unidades"}
              />
            </div>

            <div className="apex-scrollbar flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-5">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    message.role === "user"
                      ? "ml-8 rounded-[20px] rounded-br-md bg-[#8F0000] px-4 py-3 text-sm leading-6 text-white sm:ml-12"
                      : "mr-4 rounded-[20px] rounded-bl-md border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3 text-sm leading-6 sm:mr-8"
                  }
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </motion.div>
              ))}

              {pending && (
                <div className="mr-12 flex items-center gap-2 rounded-[20px] rounded-bl-md border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3 text-xs text-[var(--apex-muted)]">
                  <Sparkles size={15} className="animate-pulse" />
                  {copy.analyzing}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="shrink-0 border-t border-[var(--apex-border)] bg-[var(--apex-surface)] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:p-3">
              <div className="apex-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
                {copy.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void ask(prompt)}
                    className="min-h-9 shrink-0 touch-manipulation rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-[10px] font-semibold text-[var(--apex-muted)] active:scale-[.98]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  enterKeyHint="send"
                  placeholder={copy.placeholder}
                  className="apex-input max-h-28 min-h-12 flex-1 resize-none px-4 py-3 text-[16px] sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => void ask(input)}
                  disabled={!input.trim() || pending}
                  className="grid h-12 w-12 shrink-0 touch-manipulation place-items-center rounded-2xl bg-[#8F0000] text-white shadow-[0_10px_30px_rgba(143,0,0,.25)] transition active:scale-[.96] disabled:opacity-35"
                  aria-label="Enviar consulta"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function InsightChip({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[#8F0000]">
        {icon}
        <span className="text-xs font-bold">{value}</span>
      </div>
      <div className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
        {label}
      </div>
    </div>
  );
}
