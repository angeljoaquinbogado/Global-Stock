"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
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
import { createPortal } from "react-dom";

import { calculateMetrics } from "@/lib/analytics";
import type { BusinessSnapshot, ChatMessage } from "@/lib/types";

type ApexIntelligenceProps = {
  snapshot: BusinessSnapshot;
};

type UiLanguage = "es" | "en" | "pt" | "fr" | "de";

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;

const uiCopy: Record<
  UiLanguage,
  {
    title: string;
    subtitle: string;
    welcome: string;
    placeholder: string;
    analyzing: string;
    alerts: string;
    margin: string;
    units: string;
    close: string;
    send: string;
    contextHint: string;
  }
> = {
  es: {
    title: "Global Intelligence",
    subtitle: "Analista conectado a tu negocio",
    welcome:\n      "Listo. Preguntame lo que quieras: puedo conversar normalmente y, cuando haga falta, usar los datos reales de Global Stock para analizar tu negocio.",
    placeholder: "Preguntá algo sobre tu negocio…",
    analyzing: "Cruzando stock, ventas, costos y márgenes…",
    alerts: "alertas",
    margin: "margen",
    units: "unidades",
    close: "Minimizar inteligencia",
    send: "Enviar consulta",
    contextHint: "Puede razonar con inventario, ventas, costos, márgenes, escenarios y cualquier consulta general."
  },
  en: {
    title: "Global Intelligence",
    subtitle: "Analyst connected to your business",
    welcome:\n      "Ready. Ask me anything: I can chat normally and, when useful, use Global Stock’s live business data for analysis.",
    placeholder: "Ask about your business…",
    analyzing: "Crossing stock, sales, costs and margins…",
    alerts: "alerts",
    margin: "margin",
    units: "units",
    close: "Minimize intelligence",
    send: "Send question",
    contextHint: "It can reason over inventory, sales, costs, margins, scenarios and general questions."
  },
  pt: {
    title: "Global Intelligence",
    subtitle: "Analista conectado ao seu negócio",
    welcome:\n      "Pronto. Pergunte o que quiser: posso conversar normalmente e usar os dados reais do Global Stock quando for útil.",
    placeholder: "Pergunte sobre seu negócio…",
    analyzing: "Cruzando estoque, vendas, custos e margens…",
    alerts: "alertas",
    margin: "margem",
    units: "unidades",
    close: "Minimizar inteligência",
    send: "Enviar pergunta",
    contextHint: "Pode raciocinar sobre estoque, vendas, custos, margens, cenários e perguntas gerais."
  },
  fr: {
    title: "Global Intelligence",
    subtitle: "Analyste connecté à votre activité",
    welcome:\n      "Prêt. Posez-moi n’importe quelle question : je peux discuter normalement et utiliser les données réelles de Global Stock lorsque c’est utile.",
    placeholder: "Posez une question sur votre activité…",
    analyzing: "Analyse du stock, des ventes, coûts et marges…",
    alerts: "alertes",
    margin: "marge",
    units: "unités",
    close: "Réduire l’intelligence",
    send: "Envoyer la question",
    contextHint: "Peut raisonner sur le stock, les ventes, les coûts, les marges, les scénarios et les questions générales."
  },
  de: {
    title: "Global Intelligence",
    subtitle: "Analyst für deinen Betrieb",
    welcome:\n      "Bereit. Frag mich alles: Ich kann normal antworten und bei Bedarf die echten Global-Stock-Daten für Analysen verwenden.",
    placeholder: "Frag etwas über deinen Betrieb…",
    analyzing: "Bestand, Verkäufe, Kosten und Margen werden analysiert…",
    alerts: "Warnungen",
    margin: "Marge",
    units: "Einheiten",
    close: "Intelligenz minimieren",
    send: "Frage senden",
    contextHint: "Kann über Bestand, Verkäufe, Kosten, Margen, Szenarien und allgemeine Fragen nachdenken."
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

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: copy.welcome }
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setMounted(true), []);

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

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function ask(message: string) {
    const text = message.trim();
    if (!text || pending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text
    };

    const history = [...messages, userMessage]
      .filter((item) => item.id !== "welcome")
      .slice(-14)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          snapshot,
          history,
          runtime: {
            clientNow: new Date().toISOString(),
            clientTimeZone:
              Intl.DateTimeFormat().resolvedOptions().timeZone
          }
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
            language === "en"
              ? "I could not reach the analytics engine. The rest of the app remains available."
              : language === "pt"
                ? "Não consegui acessar o motor analítico. O restante do app continua disponível."
                : language === "fr"
                  ? "Impossible de joindre le moteur analytique. Le reste de l’application reste disponible."
                  : language === "de"
                    ? "Die Analyse-Engine ist gerade nicht erreichbar. Der Rest der App bleibt verfügbar."
                    : "No pude comunicarme con el motor analítico. El resto de la app sigue disponible."
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

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="intelligence-overlay"
          className="fixed inset-0 z-[120] bg-black/35 sm:bg-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <motion.section
            initial={{ y: "100%", opacity: 0.7 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.7 }}
            transition={spring}
            className="absolute inset-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--apex-bg)] text-[var(--apex-text)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(720px,calc(100dvh-48px))] sm:w-[440px] sm:rounded-[30px] sm:border sm:border-[var(--apex-border)] sm:bg-[var(--apex-surface)] sm:shadow-[0_28px_100px_rgba(0,0,0,.32)] sm:backdrop-blur-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--apex-border)] px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] sm:px-5 sm:py-4">
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
                aria-label={copy.close}
              >
                <Minimize2 size={16} />
              </button>
            </header>

            <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-[var(--apex-border)] px-3 py-3 sm:px-4">
              <InsightChip
                icon={<PackageSearch size={14} />}
                value={String(metrics.lowStockCount + metrics.outOfStockCount)}
                label={copy.alerts}
              />
              <InsightChip
                icon={<TrendingUp size={14} />}
                value={`${metrics.marginPct.toFixed(1)}%`}
                label={copy.margin}
              />
              <InsightChip
                icon={<ChartNoAxesCombined size={14} />}
                value={String(metrics.inventoryUnits)}
                label={copy.units}
              />
            </div>

            <div className="apex-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-5">
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
              <div className="mb-2 px-1 text-[10px] leading-4 text-[var(--apex-muted)]">
                {copy.contextHint}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
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
                  onTouchEnd={(event) => {
                    event.preventDefault();
                    void ask(input);
                  }}
                  onClick={() => void ask(input)}
                  disabled={!input.trim() || pending}
                  className="grid h-12 w-12 shrink-0 touch-manipulation place-items-center rounded-2xl bg-[#8F0000] text-white shadow-[0_10px_30px_rgba(143,0,0,.25)] transition active:scale-[.96] disabled:opacity-35"
                  aria-label={copy.send}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-50 flex h-14 touch-manipulation items-center gap-3 rounded-full border border-white/10 bg-black px-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.34)] sm:bottom-6 sm:right-6"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#8F0000]">
          <Sparkles size={16} />
        </span>
        <span className="hidden text-sm font-semibold sm:inline">
          {copy.title}
        </span>
      </motion.button>

      {mounted ? createPortal(panel, document.body) : null}
    </>
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
