"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  BrainCircuit,
  ChartNoAxesCombined,
  Minimize2,
  X,
  PackageSearch,
  Sparkles,
  TrendingUp
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";

import { calculateMetrics, formatMoney } from "@/lib/analytics";
import { businessStorageKey } from "@/lib/business-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { BusinessSnapshot, ChatMessage } from "@/lib/types";
import { WORKSPACE_ACCENTS, type WorkspaceAccent } from "@/lib/workspace-accent";

type ApexIntelligenceProps = {
  snapshot: BusinessSnapshot;
  appContext?: Record<string, unknown>;
  raiseOnMobile?: boolean;
  demoMode?: boolean;
  businessId?: string | null;
  accent?: WorkspaceAccent;
};

type UiLanguage = "es" | "en" | "pt" | "fr" | "de";
type AiStatus = "checking" | "ready" | "local" | "offline";

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
    online: string;
    offline: string;
    disconnected: string;
    providerError: string;
  }
> = {
  es: {
    title: "Global Intelligence",
    subtitle: "Analista conectado a tu negocio",
    welcome:
      "Preguntame lo que quieras. Puedo conversar normalmente y usar los datos reales de Global Stock para analizar stock, ventas, compras, margen, actividad, notas y escenarios.",
    placeholder: "Preguntá algo sobre tu negocio…",
    analyzing: "Analizando tu negocio…",
    alerts: "alertas",
    margin: "margen",
    units: "unidades",
    close: "Minimizar inteligencia",
    send: "Enviar consulta",
    contextHint:
      "Usa inventario, ventas, costos, márgenes, actividad, notas y escenarios del negocio.",
    online: "IA conectada",
    offline: "IA sin conexión",
    disconnected:
      "La inteligencia avanzada todavía no está conectada en este entorno. La interfaz ya está lista, pero hace falta activar el proveedor de IA del servidor para obtener respuestas reales.",
    providerError:
      "La IA está conectada, pero el proveedor no respondió correctamente. Probá nuevamente en unos segundos."
  },
  en: {
    title: "Global Intelligence",
    subtitle: "Analyst connected to your business",
    welcome:
      "Ask me anything. I can chat normally and use Global Stock's real business data to analyze inventory, sales, purchases, margins, activity, notes and scenarios.",
    placeholder: "Ask about your business…",
    analyzing: "Analyzing your business…",
    alerts: "alerts",
    margin: "margin",
    units: "units",
    close: "Minimize intelligence",
    send: "Send question",
    contextHint:
      "Uses inventory, sales, costs, margins, activity, notes and business scenarios.",
    online: "AI connected",
    offline: "AI offline",
    disconnected:
      "Advanced intelligence is not connected in this environment yet. The interface is ready, but the server AI provider must be enabled to get real answers.",
    providerError:
      "The AI is connected, but the provider did not respond correctly. Try again in a few seconds."
  },
  pt: {
    title: "Global Intelligence",
    subtitle: "Analista conectado ao seu negócio",
    welcome:
      "Pergunte o que quiser. Posso conversar normalmente e usar os dados reais do Global Stock para analisar estoque, vendas, compras, margem, atividade, notas e cenários.",
    placeholder: "Pergunte sobre seu negócio…",
    analyzing: "Analisando seu negócio…",
    alerts: "alertas",
    margin: "margem",
    units: "unidades",
    close: "Minimizar inteligência",
    send: "Enviar pergunta",
    contextHint:
      "Usa estoque, vendas, custos, margens, atividade, notas e cenários do negócio.",
    online: "IA conectada",
    offline: "IA sem conexão",
    disconnected:
      "A inteligência avançada ainda não está conectada neste ambiente. A interface está pronta, mas é necessário ativar o provedor de IA no servidor para obter respostas reais.",
    providerError:
      "A IA está conectada, mas o provedor não respondeu corretamente. Tente novamente em alguns segundos."
  },
  fr: {
    title: "Global Intelligence",
    subtitle: "Analyste connecté à votre activité",
    welcome:
      "Posez-moi n’importe quelle question. Je peux discuter normalement et utiliser les données réelles de Global Stock pour analyser stock, ventes, achats, marges, activité, notes et scénarios.",
    placeholder: "Posez une question sur votre activité…",
    analyzing: "Analyse de votre activité…",
    alerts: "alertes",
    margin: "marge",
    units: "unités",
    close: "Réduire l’intelligence",
    send: "Envoyer la question",
    contextHint:
      "Utilise stock, ventes, coûts, marges, activité, notes et scénarios de l’entreprise.",
    online: "IA connectée",
    offline: "IA hors ligne",
    disconnected:
      "L’intelligence avancée n’est pas encore connectée dans cet environnement. L’interface est prête, mais le fournisseur d’IA du serveur doit être activé pour obtenir de vraies réponses.",
    providerError:
      "L’IA est connectée, mais le fournisseur n’a pas répondu correctement. Réessayez dans quelques secondes."
  },
  de: {
    title: "Global Intelligence",
    subtitle: "Analyst für deinen Betrieb",
    welcome:
      "Frag mich alles. Ich kann normal antworten und echte Global-Stock-Daten nutzen, um Bestand, Verkäufe, Einkauf, Margen, Aktivität, Notizen und Szenarien zu analysieren.",
    placeholder: "Frag etwas über deinen Betrieb…",
    analyzing: "Dein Betrieb wird analysiert…",
    alerts: "Warnungen",
    margin: "Marge",
    units: "Einheiten",
    close: "Intelligenz minimieren",
    send: "Frage senden",
    contextHint:
      "Verwendet Bestand, Verkäufe, Kosten, Margen, Aktivität, Notizen und Geschäftsszenarien.",
    online: "KI verbunden",
    offline: "KI offline",
    disconnected:
      "Die erweiterte Intelligenz ist in dieser Umgebung noch nicht verbunden. Die Oberfläche ist bereit, aber der KI-Anbieter auf dem Server muss aktiviert werden, damit echte Antworten möglich sind.",
    providerError:
      "Die KI ist verbunden, aber der Anbieter hat nicht korrekt geantwortet. Versuch es in ein paar Sekunden erneut."
  }
};


const authErrorCopy: Record<UiLanguage, string> = {
  es: "Global Intelligence necesita una sesión segura válida. Cerrá sesión y volvé a ingresar; si continúa, falta completar la autenticación de producción.",
  en: "Global Intelligence needs a valid secure session. Sign out and sign in again; if it continues, production authentication still needs to be completed.",
  pt: "O Global Intelligence precisa de uma sessão segura válida. Saia e entre novamente; se continuar, ainda falta concluir a autenticação de produção.",
  fr: "Global Intelligence nécessite une session sécurisée valide. Déconnectez-vous puis reconnectez-vous ; si le problème persiste, l’authentification de production doit encore être finalisée.",
  de: "Global Intelligence benötigt eine gültige sichere Sitzung. Melde dich ab und wieder an; wenn das Problem bleibt, muss die Produktionsauthentifizierung noch abgeschlossen werden."
};

function languageFromLocale(locale: string): UiLanguage {
  if (locale.startsWith("en")) return "en";
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("fr")) return "fr";
  if (locale.startsWith("de")) return "de";
  return "es";
}

const localStatusCopy: Record<UiLanguage, string> = {
  es: "Análisis local activo",
  en: "Local analysis active",
  pt: "Análise local ativa",
  fr: "Analyse locale active",
  de: "Lokale Analyse aktiv"
};

function normalizeIntent(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

function localBusinessAnswer({
  message,
  snapshot,
  now
}: {
  message: string;
  snapshot: BusinessSnapshot;
  now: Date;
}) {
  const language = languageFromLocale(snapshot.locale);
  const text = normalizeIntent(message);
  const metrics = calculateMetrics(snapshot);
  const money = (value: number) =>
    formatMoney(value, snapshot.currency, snapshot.locale);

  const wantsGreeting =
    /^(hola|buenas|hello|hi|hey|ola|bonjour|salut|hallo|guten tag)\b/.test(text);

  if (wantsGreeting) {
    const answers: Record<UiLanguage, string> = {
      es: "Hola. Estoy listo para ayudarte con stock, ventas, margen, compras y el resto de los datos cargados en Global Stock.",
      en: "Hello. I’m ready to help with inventory, sales, margins, purchases and the rest of the data loaded in Global Stock.",
      pt: "Olá. Estou pronto para ajudar com estoque, vendas, margens, compras e os demais dados carregados no Global Stock.",
      fr: "Bonjour. Je suis prêt à vous aider avec le stock, les ventes, les marges, les achats et les autres données chargées dans Global Stock.",
      de: "Hallo. Ich kann dir mit Bestand, Verkäufen, Margen, Einkäufen und den übrigen in Global Stock geladenen Daten helfen."
    };
    return answers[language];
  }

  const wantsDate =
    /\b(hoy|dia|fecha|today|date|hoje|jour|date|heute|datum)\b/.test(text);
  const wantsProfit =
    /\b(gane|ganancia|ganancias|beneficio|beneficios|profit|profits|lucro|ganho|ganhei|benefice|gewinn|verdient)\b/.test(text);
  const wantsRevenue =
    /\b(ingreso|ingresos|ventas|facturacion|revenue|sales|receita|vendas|chiffre|umsatz)\b/.test(text);
  const wantsMargin =
    /\b(margen|margin|margem|marge)\b/.test(text);
  const wantsStock =
    /\b(stock|inventario|inventory|estoque|bestand)\b/.test(text);
  const wantsUnits =
    /\b(unidades|units|unitades|unidades|einheiten)\b/.test(text);
  const wantsBest =
    /\b(mejor|best|melhor|meilleur|beste)\b/.test(text);
  const wantsWorst =
    /\b(peor|debil|worst|weakest|pior|faible|schwach)\b/.test(text);

  const weekdayKey = normalizeIntent(
    new Intl.DateTimeFormat(snapshot.locale, {
      weekday: "short"
    }).format(now)
  ).slice(0, 3);

  const todayPoint = snapshot.trend.find(
    (point) => normalizeIntent(point.label).slice(0, 3) === weekdayKey
  );

  const formattedDate = new Intl.DateTimeFormat(snapshot.locale, {
    dateStyle: "full"
  }).format(now);

  if (wantsDate && wantsProfit) {
    if (todayPoint) {
      const profit =
        Number.isFinite(todayPoint.profit)
          ? todayPoint.profit
          : todayPoint.revenue - todayPoint.cost;

      const answers: Record<UiLanguage, string> = {
        es: `Hoy es ${formattedDate}. La ganancia bruta registrada para hoy es ${money(profit)} (ingresos ${money(todayPoint.revenue)} menos costos ${money(todayPoint.cost)}).`,
        en: `Today is ${formattedDate}. Recorded gross profit for today is ${money(profit)} (revenue ${money(todayPoint.revenue)} minus costs ${money(todayPoint.cost)}).`,
        pt: `Hoje é ${formattedDate}. O lucro bruto registrado hoje é ${money(profit)} (receita ${money(todayPoint.revenue)} menos custos ${money(todayPoint.cost)}).`,
        fr: `Nous sommes le ${formattedDate}. Le bénéfice brut enregistré aujourd’hui est de ${money(profit)} (revenus ${money(todayPoint.revenue)} moins coûts ${money(todayPoint.cost)}).`,
        de: `Heute ist ${formattedDate}. Der erfasste Bruttogewinn für heute beträgt ${money(profit)} (Umsatz ${money(todayPoint.revenue)} minus Kosten ${money(todayPoint.cost)}).`
      };
      return answers[language];
    }

    const answers: Record<UiLanguage, string> = {
      es: `Hoy es ${formattedDate}. Todavía no hay un punto de ventas identificado para hoy en los datos cargados, así que no voy a inventar una ganancia diaria.`,
      en: `Today is ${formattedDate}. There is no sales point identified for today in the loaded data yet, so I will not invent a daily profit figure.`,
      pt: `Hoje é ${formattedDate}. Ainda não há um ponto de vendas identificado para hoje nos dados carregados, então não vou inventar um lucro diário.`,
      fr: `Nous sommes le ${formattedDate}. Aucune donnée de vente n’est identifiée pour aujourd’hui dans les données chargées, donc je n’inventerai pas de bénéfice quotidien.`,
      de: `Heute ist ${formattedDate}. Für heute ist in den geladenen Daten noch kein Verkaufspunkt vorhanden, daher erfinde ich keinen Tagesgewinn.`
    };
    return answers[language];
  }

  if (wantsDate) {
    const answers: Record<UiLanguage, string> = {
      es: `Hoy es ${formattedDate}.`,
      en: `Today is ${formattedDate}.`,
      pt: `Hoje é ${formattedDate}.`,
      fr: `Nous sommes le ${formattedDate}.`,
      de: `Heute ist ${formattedDate}.`
    };
    return answers[language];
  }

  if (wantsProfit) {
    const answers: Record<UiLanguage, string> = {
      es: `La ganancia bruta acumulada en el período cargado es ${money(metrics.grossProfit)}. No la llamo ganancia neta porque Global Stock no tiene todos los gastos del negocio cargados.`,
      en: `Gross profit for the loaded period is ${money(metrics.grossProfit)}. I am not calling it net profit because Global Stock does not have every business expense recorded.`,
      pt: `O lucro bruto acumulado no período carregado é ${money(metrics.grossProfit)}. Não é lucro líquido porque o Global Stock não tem todas as despesas do negócio registradas.`,
      fr: `Le bénéfice brut cumulé sur la période chargée est de ${money(metrics.grossProfit)}. Ce n’est pas un bénéfice net, car toutes les dépenses ne sont pas enregistrées.`,
      de: `Der Bruttogewinn im geladenen Zeitraum beträgt ${money(metrics.grossProfit)}. Das ist kein Nettogewinn, da nicht alle Betriebsausgaben erfasst sind.`
    };
    return answers[language];
  }

  if (wantsRevenue) {
    const answers: Record<UiLanguage, string> = {
      es: `Los ingresos acumulados del período cargado son ${money(metrics.revenue)}.`,
      en: `Revenue for the loaded period is ${money(metrics.revenue)}.`,
      pt: `A receita acumulada do período carregado é ${money(metrics.revenue)}.`,
      fr: `Le chiffre d’affaires cumulé sur la période chargée est de ${money(metrics.revenue)}.`,
      de: `Der Umsatz im geladenen Zeitraum beträgt ${money(metrics.revenue)}.`
    };
    return answers[language];
  }

  if (wantsMargin) {
    const answers: Record<UiLanguage, string> = {
      es: `El margen bruto promedio del período cargado es ${metrics.marginPct.toFixed(1)}%.`,
      en: `Gross margin for the loaded period is ${metrics.marginPct.toFixed(1)}%.`,
      pt: `A margem bruta do período carregado é ${metrics.marginPct.toFixed(1)}%.`,
      fr: `La marge brute sur la période chargée est de ${metrics.marginPct.toFixed(1)}%.`,
      de: `Die Bruttomarge im geladenen Zeitraum beträgt ${metrics.marginPct.toFixed(1)}%.`
    };
    return answers[language];
  }

  if (wantsStock || wantsUnits) {
    const alerts = metrics.lowStockCount + metrics.outOfStockCount;
    const answers: Record<UiLanguage, string> = {
      es: `Tenés ${metrics.inventoryUnits} unidades en inventario y ${alerts} alertas de stock (${metrics.lowStockCount} con stock bajo y ${metrics.outOfStockCount} sin stock).`,
      en: `You have ${metrics.inventoryUnits} inventory units and ${alerts} stock alerts (${metrics.lowStockCount} low-stock and ${metrics.outOfStockCount} out-of-stock).`,
      pt: `Você tem ${metrics.inventoryUnits} unidades em estoque e ${alerts} alertas (${metrics.lowStockCount} com estoque baixo e ${metrics.outOfStockCount} sem estoque).`,
      fr: `Vous avez ${metrics.inventoryUnits} unités en stock et ${alerts} alertes (${metrics.lowStockCount} en stock faible et ${metrics.outOfStockCount} en rupture).`,
      de: `Du hast ${metrics.inventoryUnits} Einheiten im Bestand und ${alerts} Warnungen (${metrics.lowStockCount} niedrig, ${metrics.outOfStockCount} ausverkauft).`
    };
    return answers[language];
  }

  if ((wantsBest || wantsWorst) && snapshot.trend.length) {
    const point = [...snapshot.trend].sort((a, b) =>
      wantsWorst ? a.profit - b.profit : b.profit - a.profit
    )[0];
    const answers: Record<UiLanguage, string> = {
      es: `El ${wantsWorst ? "día más débil" : "mejor día"} del período cargado es ${point.label}, con ${money(point.profit)} de ganancia bruta.`,
      en: `The ${wantsWorst ? "weakest" : "best"} day in the loaded period is ${point.label}, with ${money(point.profit)} in gross profit.`,
      pt: `O ${wantsWorst ? "dia mais fraco" : "melhor dia"} do período carregado é ${point.label}, com ${money(point.profit)} de lucro bruto.`,
      fr: `Le ${wantsWorst ? "jour le plus faible" : "meilleur jour"} de la période chargée est ${point.label}, avec ${money(point.profit)} de bénéfice brut.`,
      de: `Der ${wantsWorst ? "schwächste" : "beste"} Tag im geladenen Zeitraum ist ${point.label} mit ${money(point.profit)} Bruttogewinn.`
    };
    return answers[language];
  }

  return null;
}

export function ApexIntelligence({
  snapshot,
  appContext = {},
  raiseOnMobile = false,
  demoMode = false,
  businessId = null,
  accent = "red"
}: ApexIntelligenceProps) {
  const language = languageFromLocale(snapshot.locale);
  const copy = uiCopy[language];
  const accentColors = WORKSPACE_ACCENTS[accent];
  const metrics = useMemo(() => calculateMetrics(snapshot), [snapshot]);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [launcherExpanded, setLauncherExpanded] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const [hoverDismissed, setHoverDismissed] = useState(false);
  const [autoRevealCancelled, setAutoRevealCancelled] = useState(false);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<AiStatus>("checking");
  const [aiConsent, setAiConsent] = useState(demoMode);
  const [aiConsentLoading, setAiConsentLoading] = useState(!demoMode);
  const [aiConsentSaving, setAiConsentSaving] = useState(false);
  const [aiConsentError, setAiConsentError] = useState("");
  const [recoveredBusinessId, setRecoveredBusinessId] = useState<string | null>(null);
  const aiBusinessId = businessId ?? recoveredBusinessId;
  const [mobileViewport, setMobileViewport] = useState<{
    compact: boolean;
    height: number;
    offsetTop: number;
  }>({
    compact: false,
    height: 0,
    offsetTop: 0
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: copy.welcome }
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastTouchSendRef = useRef(0);

  useEffect(() => setMounted(true), []);

  // Fine-pointer devices reveal the launcher on hover. Touch devices reveal
  // its label once after five seconds; the X can suppress the automatic reveal.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      setSupportsHover(query.matches);
      setLauncherExpanded(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!mounted || supportsHover || autoRevealCancelled || open) return;
    const timer = window.setTimeout(() => setLauncherExpanded(true), 5000);
    return () => window.clearTimeout(timer);
  }, [mounted, supportsHover, autoRevealCancelled, open]);

  function activateLauncher() {
    if (!launcherExpanded) {
      setLauncherExpanded(true);
      return;
    }
    setOpen(true);
  }


  // Identical, revocable AI data consent for PC and Expo Go. A prior legal
  // acceptance does NOT authorize sharing merchant records with a model.
  useEffect(() => {
    if (demoMode) { setAiConsent(true); setAiConsentLoading(false); return; }
    setAiConsent(false);
    setAiConsentError("");
    if (!aiBusinessId) { setAiConsentLoading(false); return; }
    let live = true;
    setAiConsentLoading(true);
    void (async () => {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Ingresá a una cuenta para autorizar la IA.");
      const { data: verified, error: userError } = await client.auth.getUser();
      if (userError || !verified.user) throw new Error("Tu sesión venció. Volvé a entrar.");
      const { data, error } = await client.from("global_stock_ai_data_consents")
        .select("approved")
        .eq("user_id", verified.user.id)
        .eq("business_id", aiBusinessId)
        .maybeSingle();
      if (error) throw error;
      if (live) setAiConsent(data?.approved === true);
    })().catch(reason => {
      if (live) setAiConsentError(reason instanceof Error ? reason.message : "No pudimos comprobar el permiso de IA.");
    }).finally(() => { if (live) setAiConsentLoading(false); });
    return () => { live = false; };
  }, [demoMode, aiBusinessId]);

  async function revokeAiConsent() {
    if (!aiBusinessId || demoMode || aiConsentSaving) return;
    setAiConsentSaving(true);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Iniciá sesión nuevamente.");
      const { data: verified, error: userError } = await client.auth.getUser();
      if (userError || !verified.user) throw new Error("Tu sesión cambió.");
      const { error } = await client.from("global_stock_ai_data_consents").upsert({
        user_id: verified.user.id, business_id: aiBusinessId,
        approved: false, updated_at: new Date().toISOString()
      }, { onConflict: "user_id,business_id" });
      if (error) throw error;
      setAiConsent(false);
      setAiConsentError("");
    } catch (reason) {
      setAiConsentError(reason instanceof Error ? reason.message : "No pudimos revocar el permiso.");
    } finally {
      setAiConsentSaving(false);
    }
  }

  async function approveAiConsent() {
    if (aiConsentSaving || demoMode) return;
    setAiConsentSaving(true);
    setAiConsentError("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Ingresá a una cuenta para continuar.");
      const { data: verified, error: userError } = await client.auth.getUser();
      if (userError || !verified.user) throw new Error("Tu sesión venció. Volvé a entrar.");

      let targetBusinessId = aiBusinessId;

      // Workspace hydration can finish after the assistant first renders.
      // Recover only an authorized business and never guess across multiple
      // businesses because the consent must apply to the intended business.
      if (!targetBusinessId) {
        const { data: memberships, error: membershipError } = await client
          .from("global_stock_members")
          .select("business_id")
          .eq("user_id", verified.user.id)
          .eq("active", true)
          .limit(100);

        if (membershipError) {
          throw new Error("No pudimos comprobar qué negocio está vinculado a tu cuenta. Recargá la página e intentá nuevamente.");
        }

        const memberBusinessIds = [...new Set(
          (memberships ?? [])
            .map((item) => String(item.business_id || ""))
            .filter(Boolean)
        )];
        const savedBusinessId = window.localStorage.getItem("global-stock-active-business-id");

        if (savedBusinessId && memberBusinessIds.includes(savedBusinessId)) {
          targetBusinessId = savedBusinessId;
        } else if (memberBusinessIds.length === 1) {
          targetBusinessId = memberBusinessIds[0];
        } else if (memberBusinessIds.length > 1) {
          throw new Error("Tu cuenta tiene varios negocios. Seleccioná primero el negocio que querés analizar y volvé a abrir Global Intelligence.");
        } else {
          const { data: ownedBusinesses, error: ownedError } = await client
            .from("global_stock_businesses")
            .select("id")
            .eq("owner_user_id", verified.user.id)
            .limit(100);

          if (ownedError) {
            throw new Error("No pudimos verificar el negocio de esta cuenta. Recargá la página e intentá nuevamente.");
          }

          const ownedBusinessIds = [...new Set(
            (ownedBusinesses ?? [])
              .map((item) => String(item.id || ""))
              .filter(Boolean)
          )];

          if (savedBusinessId && ownedBusinessIds.includes(savedBusinessId)) {
            targetBusinessId = savedBusinessId;
          } else if (ownedBusinessIds.length === 1) {
            targetBusinessId = ownedBusinessIds[0];
          } else if (ownedBusinessIds.length > 1) {
            throw new Error("Tu cuenta tiene varios negocios. Seleccioná primero el negocio que querés analizar y volvé a abrir Global Intelligence.");
          }
        }
      }

      if (!targetBusinessId) {
        throw new Error("No encontramos un negocio vinculado a tu cuenta. Completá la configuración del negocio o volvé a iniciar sesión antes de dar el permiso.");
      }

      if (targetBusinessId !== aiBusinessId) setRecoveredBusinessId(targetBusinessId);

      const { error } = await client.from("global_stock_ai_data_consents").upsert({
        user_id: verified.user.id,
        business_id: targetBusinessId,
        approved: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,business_id" });

      if (error) throw error;
      setAiConsent(true);
      setAiConsentError("");
    } catch (reason) {
      setAiConsentError(reason instanceof Error ? reason.message : "No pudimos guardar tu permiso.");
    } finally {
      setAiConsentSaving(false);
    }
  }

  useEffect(() => {
    if (demoMode) {
      setStatus("local");
      return;
    }

    let cancelled = false;

    async function checkStatus() {
      try {
        const response = await fetch("/api/intelligence", {
          method: "GET",
          cache: "no-store"
        });
        const payload = (await response.json()) as { configured?: boolean };
        if (!cancelled) {
          setStatus(payload.configured ? "ready" : "local");
        }
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    void checkStatus();
    return () => {
      cancelled = true;
    };
  }, [demoMode]);

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const updateViewport = () => {
      const viewport = window.visualViewport;
      const compact = window.innerWidth < 640;

      setMobileViewport({
        compact,
        height: viewport?.height ?? window.innerHeight,
        offsetTop: viewport?.offsetTop ?? 0
      });
    };

    updateViewport();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEscape);

    const timer = window.setTimeout(() => {
      if (window.innerWidth >= 640) inputRef.current?.focus();
    }, 120);

    return () => {
      window.clearTimeout(timer);
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("keydown", onEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function ask(message: string) {
    const text = message.trim();
    if (!text || pending || text.length > 4000 || aiConsentLoading) return;
    if (!demoMode && !aiConsent) {
      setAiConsentError("Antes de enviar, autorizá el uso de datos del negocio con Global Intelligence.");
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text
    };

    const history = [...messages, userMessage]
      .filter((item) => item.id !== "welcome")
      .slice(-20)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);

    try {
      const now = new Date();
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const localAnswer = localBusinessAnswer({
        message: text,
        snapshot,
        now
      });

      if (localAnswer) {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: localAnswer
          }
        ]);
        return;
      }

      if (demoMode) {
        const demoReplies: Record<UiLanguage, string> = {
          es: "La cuenta demo usa únicamente el análisis local para no consumir ninguna API externa. Cargá productos o ventas de prueba y puedo analizar esos datos durante esta sesión.",
          en: "The demo account uses local analysis only, so it never consumes an external AI API. Add sample products or sales and I can analyze that data during this session.",
          pt: "A conta demo usa apenas análise local para não consumir nenhuma API externa. Adicione produtos ou vendas de teste e posso analisar esses dados nesta sessão.",
          fr: "Le compte démo utilise uniquement l’analyse locale afin de ne consommer aucune API d’IA externe. Ajoutez des produits ou des ventes de test et je pourrai analyser ces données pendant cette session.",
          de: "Das Demokonto nutzt nur die lokale Analyse und verbraucht keine externe KI-API. Füge Testprodukte oder Verkäufe hinzu, dann kann ich diese Daten während der Sitzung analysieren."
        };

        setStatus("local");
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: demoReplies[language]
          }
        ]);
        return;
      }

      const localModules: Record<string, unknown> = {};
      for (const [name, key] of [
        ["freeNotes", "global-stock-free-notes-v1"],
        ["onlineOrders", "global-stock-online-orders-v1"],
        ["onlineConnections", "global-stock-online-connections-v1"],
        ["suppliers", "global-stock-suppliers-v1"],
        ["documents", "global-stock-documents-v1"],
        ["smartDocuments", "global-stock-smart-documents-v1"],
        ["businessSuite", "global-stock-business-suite-v1"]
      ] as const) {
        try {
          const scopedKey = businessStorageKey(
            key,
            aiBusinessId,
            demoMode
          );
          const raw = scopedKey
            ? window.localStorage.getItem(scopedKey)
            : null;
          if (raw) localModules[name] = JSON.parse(raw);
        } catch {
          // Corrupt optional local context must never block the assistant.
        }
      }

      const supabase = getSupabaseBrowserClient();
      const accessToken = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : null;

      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {})
        },
        cache: "no-store",
        body: JSON.stringify({
          message: text,
          snapshot,
          history,
          runtime: {
            clientNow: now.toISOString(),
            clientLocalTime: new Intl.DateTimeFormat(snapshot.locale, {
              dateStyle: "full",
              timeStyle: "long",
              timeZone
            }).format(now),
            clientTimeZone: timeZone,
            appContext: {
              ...appContext,
              businessId: aiBusinessId,
              platform: typeof window !== "undefined" && window.ReactNativeWebView
                ? "Global Stock React Native" : "Global Stock Web",
              ...localModules
            }
          }
        })
      });

      const payload = (await response.json()) as {
        answer?: string;
        code?: string;
        configured?: boolean;
      };

      if (payload.configured === true) setStatus("ready");

      let content = payload.answer;

      if (
        !content &&
        (payload.code === "AI_NOT_CONNECTED" ||
          payload.code === "AUTH_REQUIRED" ||
          payload.code === "AUTH_NOT_CONFIGURED")
      ) {
        const localAnswer = localBusinessAnswer({
          message: text,
          snapshot,
          now
        });

        if (localAnswer) {
          setStatus("local");
          content = localAnswer;
        } else if (payload.code === "AI_NOT_CONNECTED") {
          setStatus("local");
          content = copy.disconnected;
        } else {
          setStatus("local");
          content = authErrorCopy[language];
        }
      }

      if (!content && payload.code === "AI_PROVIDER_ERROR") {
        setStatus("ready");
        content = copy.providerError;
      }

      if (!content) {
        content = copy.providerError;
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content
        }
      ]);
    } catch {
      const localAnswer = localBusinessAnswer({
        message: text,
        snapshot,
        now: new Date()
      });
      setStatus(localAnswer ? "local" : "offline");
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: localAnswer || copy.providerError
        }
      ]);
    } finally {
      setPending(false);
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
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

  const panelStyle =
    mobileViewport.compact && mobileViewport.height
      ? {
          height: `${mobileViewport.height}px`,
          top: `${mobileViewport.offsetTop}px`
        }
      : undefined;

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="intelligence-overlay"
          className="fixed inset-0 z-[220] bg-black/45 sm:bg-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <motion.section
            initial={{ transform: "translate3d(0,100%,0)" }}
            animate={{ transform: "translate3d(0,0,0)" }}
            exit={{ transform: "translate3d(0,100%,0)" }}
            transition={{
              duration: 0.28,
              ease: [0.32, 0.72, 0, 1]
            }}
            style={{ ...panelStyle, "--ai-accent": accentColors.main } as React.CSSProperties}
            className="absolute left-0 right-0 top-0 flex w-full flex-col overflow-hidden bg-[var(--apex-surface-strong)] text-[var(--apex-text)] sm:bottom-6 sm:left-auto sm:right-6 sm:top-auto sm:h-[min(760px,calc(100dvh-48px))] sm:w-[460px] sm:rounded-[30px] sm:border sm:border-[var(--apex-border)] sm:shadow-[0_28px_100px_rgba(0,0,0,.32)]"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] sm:px-5 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#8F0000] text-white">
                  <BrainCircuit size={19} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold">
                      {copy.title}
                    </h2>
                    <span
                      className={
                        "h-2 w-2 shrink-0 rounded-full " +
                        (status === "ready"
                          ? "bg-emerald-500"
                          : status === "local" || status === "checking"
                            ? "bg-amber-500"
                            : "bg-red-500")
                      }
                    />
                  </div>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-[var(--apex-muted)]">
                    {status === "ready"
                      ? copy.online
                      : status === "local"
                        ? localStatusCopy[language]
                        : status === "offline"
                          ? copy.offline
                          : copy.subtitle}
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
                accentColor={accentColors.main}
                icon={<PackageSearch size={14} />}
                value={String(
                  metrics.lowStockCount + metrics.outOfStockCount
                )}
                label={copy.alerts}
              />
              <InsightChip
                accentColor={accentColors.main}
                icon={<TrendingUp size={14} />}
                value={`${metrics.marginPct.toFixed(1)}%`}
                label={copy.margin}
              />
              <InsightChip
                accentColor={accentColors.main}
                icon={<ChartNoAxesCombined size={14} />}
                value={String(metrics.inventoryUnits)}
                label={copy.units}
              />
            </div>

            {!demoMode && (
              <div className="shrink-0 border-b border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3">
                {aiConsentLoading ? (
                  <p role="status" className="text-xs text-[var(--apex-muted)]">Comprobando autorización de datos para la IA…</p>
                ) : !aiConsent ? (
                  <div className="space-y-2 rounded-2xl border p-3" style={{ borderColor: accentColors.main + "70", backgroundColor: "var(--apex-bg)" }}>
                    <p className="text-sm font-semibold">Antes de compartir datos del negocio</p>
                    <p className="text-xs leading-5 text-[var(--apex-muted)]">
                      Global Intelligence puede enviar al proveedor de IA la consulta y datos necesarios del inventario, ventas, márgenes y actividad.
                      Es opcional y podés revocarlo desde Configuración o solicitándolo a soporte.
                    </p>
                    {aiConsentError && <p role="alert" className="text-xs text-red-500">{aiConsentError}</p>}
                    {!aiBusinessId && (
                      <p className="text-xs leading-5 text-[var(--apex-muted)]">
                        Antes de guardar el permiso, comprobaremos qué negocio activo está vinculado a tu cuenta.
                      </p>
                    )}
                    <button type="button" onClick={() => void approveAiConsent()}
                      disabled={aiConsentSaving}
                      className="min-h-10 rounded-xl px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
                      style={{ backgroundColor: accentColors.main }}>
                      {aiConsentSaving ? "Verificando y guardando…" : !aiBusinessId ? "Verificar negocio y permitir" : "Permitir compartir datos con Global Intelligence"}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--apex-muted)]">
                    Datos autorizados para este negocio · <button type="button" className="underline" onClick={() => void revokeAiConsent()}>Revocar permiso</button>
                  </p>
                )}
              </div>
            )}
            <div className="apex-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-5">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{
                    opacity: 0,
                    transform: "translate3d(0,6px,0)"
                  }}
                  animate={{
                    opacity: 1,
                    transform: "translate3d(0,0,0)"
                  }}
                  transition={{
                    duration: 0.18,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  className={
                    message.role === "user"
                      ? "ml-10 rounded-[20px] rounded-br-md px-4 py-3 text-sm leading-6 text-white sm:ml-12"
                      : "mr-3 rounded-[20px] rounded-bl-md border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3 text-sm leading-6 sm:mr-8"
                  }
                  style={message.role === "user" ? { backgroundColor: accentColors.main } : undefined}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </motion.div>
              ))}

              {pending && (
                <div className="mr-10 flex items-center gap-2 rounded-[20px] rounded-bl-md border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3 text-xs text-[var(--apex-muted)]">
                  <Sparkles size={15} className="animate-pulse" />
                  {copy.analyzing}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={submit}
              className="shrink-0 border-t border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:p-3"
            >
              <div className="mb-2 px-1 text-[10px] leading-4 text-[var(--apex-muted)]">
                {copy.contextHint}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={4000}
                  rows={1}
                  enterKeyHint="send"
                  placeholder={copy.placeholder}
                  className="apex-input max-h-28 min-h-12 flex-1 resize-none px-4 py-3 text-[16px] sm:text-sm"
                  aria-label={copy.placeholder}
                />
                <button
                  type="button"
                  disabled={!input.trim() || pending || aiConsentLoading || (!demoMode && !aiConsent)}
                  onClick={() => {
                    if (performance.now() - lastTouchSendRef.current < 700) return;
                    void ask(input);
                  }}
                  onPointerUp={(event) => {
                    if (event.pointerType !== "touch") return;
                    event.preventDefault();
                    lastTouchSendRef.current = performance.now();
                    void ask(input);
                  }}
                  className="grid h-10 w-10 shrink-0 touch-manipulation place-items-center rounded-full p-[2px] transition active:scale-[.94] disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #555861 13%, #f3f4f6 25%, #777a83 39%, #ffffff 52%, #50535c 66%, #e1e3e7 80%, #858891 92%, #ffffff 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.78), 0 2px 8px rgba(0,0,0,.22)"
                  }}
                  aria-label={copy.send}
                  title={copy.send}
                >
                  <span className="grid h-full w-full place-items-center rounded-full bg-[var(--apex-surface-strong)] text-[var(--apex-text)]">
                    <Send size={16} strokeWidth={2} aria-hidden="true" />
                  </span>
                </button>
              </div>
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: launcherExpanded ? 226 : 56 }}
        transition={{ type: "spring", stiffness: 310, damping: 31, mass: 0.85 }}
        onMouseEnter={() => {
          if (supportsHover && !hoverDismissed) setLauncherExpanded(true);
        }}
        onMouseLeave={() => {
          if (supportsHover) {
            setLauncherExpanded(false);
            setHoverDismissed(false);
          }
        }}
        className={
          "fixed right-4 z-50 flex h-14 max-w-[calc(100vw-32px)] touch-manipulation items-center overflow-hidden rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-text)] shadow-[0_12px_36px_rgba(0,0,0,.14)] lg:bottom-6 lg:right-6 " +
          (raiseOnMobile
            ? "bottom-[calc(158px+env(safe-area-inset-bottom,0px))]"
            : "bottom-[calc(88px+env(safe-area-inset-bottom,0px))]")
        }
      >
        <button
          type="button"
          onClick={activateLauncher}
          aria-label={launcherExpanded ? copy.title : (language === "es" ? "Desplegar Global Intelligence" : "Expand Global Intelligence")}
          aria-expanded={launcherExpanded}
          className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-full pl-[9px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--apex-accent)]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--apex-accent)] text-white">
            <Sparkles size={16} aria-hidden="true" />
          </span>
          <AnimatePresence initial={false}>
            {launcherExpanded && (
              <motion.span
                key="global-intelligence-label"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18 }}
                className="whitespace-nowrap text-[12px] font-semibold"
              >
                {copy.title}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <AnimatePresence initial={false}>
          {launcherExpanded && (
            <motion.button
              key="collapse-launcher"
              type="button"
              aria-label={language === "es" ? "Ocultar nombre de Global Intelligence" : "Collapse Global Intelligence"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.14 }}
              onClick={() => {
                setLauncherExpanded(false);
                setAutoRevealCancelled(true);
                if (supportsHover) setHoverDismissed(true);
              }}
              className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--apex-muted)] transition-colors hover:bg-[var(--apex-bg)] hover:text-[var(--apex-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--apex-accent)]"
            >
              <X size={15} aria-hidden="true"/>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}

function InsightChip({
  icon,
  value,
  label,
  accentColor
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accentColor: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2.5">
      <div className="flex items-center gap-1.5" style={{ color: accentColor }}>
        {icon}
        <span className="text-xs font-bold">{value}</span>
      </div>
      <div className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
        {label}
      </div>
    </div>
  );
}
