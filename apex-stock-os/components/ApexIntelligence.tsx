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
  now,
  demoMode = false
}: {
  message: string;
  snapshot: BusinessSnapshot;
  now: Date;
  demoMode?: boolean;
}): string | null {
  const language = languageFromLocale(snapshot.locale);
  const text = normalizeIntent(message);
  const metrics = calculateMetrics(snapshot);
  const money = (value: number) =>
    formatMoney(value, snapshot.currency, snapshot.locale);

  const products = snapshot.products ?? [];
  const formattedDate = new Intl.DateTimeFormat(snapshot.locale, {
    dateStyle: "full"
  }).format(now);

  // 1. Saludos y charla inicial
  if (/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hello|hi|hey|ola|bonjour|hallo)\b/.test(text) && text.split(/\s+/).length <= 5) {
    if (language === "es") {
      return `¡Hola! Soy **Global Intelligence**, tu copiloto operativo.\n\nHoy tenés **${products.length} productos** cargados (${metrics.inventoryUnits} unidades), **${money(metrics.revenue)}** en ingresos y un margen bruto de **${metrics.marginPct.toFixed(1)}%**.\n\nPodés preguntarme sobre tus números, qué comprar, precios de un producto específico, cómo usar cualquier módulo de la app (Caja, ARCA, Almacén, Tienda Online) o pedir ideas para mejorar tus ventas. ¿Con qué arrancamos?`;
    }
    return "Hello! I am Global Intelligence, your business copilot. Ask me anything about your stock, sales, margins, pricing, or how to use any module in Global Stock.";
  }

  // 2. Plan de compra / reposicion
  if (/\b(comprar|compra|compras|pedir|pedido|reponer|reposicion|abastecer|cuanto debo|cuantos productos)\b/.test(text)) {
    const candidates = products
      .map((p) => {
        const stock = Number(p.stock ?? 0);
        const minStock = Number(p.minStock ?? 0);
        const cost = Number(p.cost ?? 0);
        const targetStock = Math.max(minStock * 2, minStock + 5);
        const suggestedQty = stock <= minStock ? Math.max(1, targetStock - stock) : 0;
        return { name: p.name, stock, minStock, cost, suggestedQty, estCost: suggestedQty * cost };
      })
      .filter((item) => item.suggestedQty > 0)
      .sort((a, b) => b.suggestedQty - a.suggestedQty);

    if (!candidates.length) {
      return language === "es"
        ? "Hoy no tenés productos por debajo del stock mínimo. Si querés que armemos una compra preventiva para temporada alta o un proveedor puntual, decime qué categoría o rubro querés reforzar y lo calculamos."
        : "No products are below minimum stock right now. Let me know if you want to plan a preventive restock.";
    }

    const totalUnits = candidates.reduce((acc, item) => acc + item.suggestedQty, 0);
    const totalEstCost = candidates.reduce((acc, item) => acc + item.estCost, 0);
    const lines = candidates.slice(0, 8).map(
      (item) =>
        `• **${item.name}**: pedir **${item.suggestedQty} u.** (actual: ${item.stock} u. / mín: ${item.minStock} u.${item.estCost > 0 ? ` · est. ${money(item.estCost)}` : ""})`
    );

    return language === "es"
      ? `Plan de compra sugerido (**${candidates.length} productos**, **${totalUnits} unidades**${totalEstCost > 0 ? `, inversión estimada: **${money(totalEstCost)}**` : ""}):\n${lines.join("\n")}\n\n¿Querés que prioricemos los que dejan mayor margen o armemos el pedido desde el módulo **Reposición**?`
      : `Suggested purchase plan (${candidates.length} products, ${totalUnits} units):\n${lines.join("\n")}`;
  }

  // 3. Mejor o peor dia (priorizado antes de fecha)
  if ((/\b(mejor|best|melhor|meilleur|beste)\b/.test(text) || /\b(peor|debil|worst|weakest|pior|faible|schwach)\b/.test(text)) && snapshot.trend.length) {
    const wantsWorst = /\b(peor|debil|worst|weakest|pior|faible|schwach)\b/.test(text);
    const point = [...snapshot.trend].sort((a, b) =>
      wantsWorst ? a.profit - b.profit : b.profit - a.profit
    )[0];
    if (language === "es") {
      return `El **${wantsWorst ? "día más débil" : "mejor día"}** del período cargado es **${point.label}**, con **${money(point.profit)}** de ganancia bruta (ingresos: ${money(point.revenue)} | costos: ${money(point.cost)}).\n\n${wantsWorst ? "Para levantar días flojos como ese, conviene lanzar un combo rápido o promo por tiempo limitado en **Caja**." : "Podés replicar lo que funcionó ese día revisando los productos más vendidos en **Gráficos**."}`;
    }
    return `The ${wantsWorst ? "weakest" : "best"} day is ${point.label} with ${money(point.profit)} gross profit.`;
  }

  // 4. Alertas / resumen / estado general
  if (/\b(alerta|alertas|critico|criticos|faltante|faltantes|bajo|agotado|agotados|resumen|estado|como estoy|como vamos|panorama)\b/.test(text)) {
    const lowOrOut = products.filter(
      (p) => typeof p.stock === "number" && typeof p.minStock === "number" && p.stock <= p.minStock
    );
    const topAlerts = lowOrOut.slice(0, 6).map(
      (p) => `• **${p.name}**: ${p.stock} u. (mínimo ${p.minStock} u.)`
    );
    const alertsText = topAlerts.length
      ? `Productos a revisar:\n${topAlerts.join("\n")}`
      : "No hay productos por debajo del stock mínimo.";

    if (language === "es") {
      return `Estado general del negocio:\n• **Ingresos:** ${money(metrics.revenue)} | **Ganancia bruta:** ${money(metrics.grossProfit)} (**${metrics.marginPct.toFixed(1)}%** margen)\n• **Inventario:** ${metrics.inventoryUnits} unidades (${metrics.lowStockCount} stock bajo, ${metrics.outOfStockCount} agotados)\n${alertsText}\n\n¿Querés que analicemos cómo subir el margen o cómo reponer los faltantes?`;
    }
  }

  // 5. Consulta por producto especifico cargado en inventario
  const matchedProduct = products.find((p) => {
    const cleanName = normalizeIntent(p.name || "");
    return cleanName.length >= 3 && text.includes(cleanName);
  });

  if (matchedProduct && language === "es") {
    const price = Number(matchedProduct.price ?? 0);
    const cost = Number(matchedProduct.cost ?? 0);
    const unitProfit = price - cost;
    const unitMargin = price > 0 ? ((unitProfit / price) * 100).toFixed(1) : "0.0";
    const statusLabel =
      matchedProduct.stock <= 0
        ? "Agotado"
        : matchedProduct.stock <= matchedProduct.minStock
          ? "Stock bajo"
          : "Stock saludable";

    return `Ficha rápida de **${matchedProduct.name}**:\n• **Stock actual:** ${matchedProduct.stock} u. (mínimo: ${matchedProduct.minStock} u. · ${statusLabel})\n• **Precio de venta:** ${money(price)} | **Costo:** ${money(cost)}\n• **Ganancia por unidad:** ${money(unitProfit)} (**${unitMargin}%** margen)\n\n¿Querés calcular cuánto ganarías vendiendo un lote de este producto o ajustar su precio?`;
  }

  // 6. Guias de uso de la app (como hacer X en Global Stock)
  if (language === "es") {
    if (/\b(arca|afip|factura|facturar|facturacion|monotributo|responsable inscripto|comprobante fiscal|cae)\b/.test(text)) {
      return "Para emitir facturas electrónicas en **ARCA**:\n1. Abrí el módulo **ARCA** desde el menú lateral.\n2. Verificá que tu CUIT, punto de venta y condición fiscal estén cargados en **Configuración / ARCA**.\n3. Elegí tipo de comprobante (Factura A, B o C), cargá los ítems o traelos desde una venta y revisá el borrador antes de confirmar.\n\n¿Necesitás ayuda con una factura B, A o nota de crédito?";
    }
    if (/\b(caja|pos|vender|venta|cobrar|ticket|carrito|efectivo|transferencia|qr)\b/.test(text)) {
      return "Para cobrar rápido en **Caja / POS**:\n1. Entrá a **Caja** y buscá por nombre, código o escaneá con la cámara/lector remoto.\n2. Ajustá cantidades o descuentos y elegí el medio de cobro (Efectivo, Transferencia, Débito o Crédito).\n3. Al confirmar, el stock se descuenta automáticamente y queda registrado en **Actividad** y **Gráficos**.\n\n¿Querés que veamos cómo emparejar el celular como escáner remoto para la caja?";
    }
    if (/\b(almacen|agregar producto|cargar producto|nuevo producto|codigo de barras|editar precio|stock)\b/.test(text) && !/\b(cuanto|unidades|tengo)\b/.test(text)) {
      return "Para gestionar tus productos en **Almacén**:\n1. Abrí **Almacén** y tocá **Nuevo producto** (podés escanear el código de barras para autocompletar datos).\n2. Definí costo, precio de venta, stock actual y stock mínimo para recibir alertas automáticas.\n3. Podés editar cantidades directo desde la tabla o registrar ingresos de mercadería en **Reposición**.\n\n¿Cuántos productos aproximados vas a cargar o qué rubro trabajás?";
    }
    if (/\b(tienda online|ecommerce|mercado libre|tiendanube|shopify|sincronizar)\b/.test(text)) {
      return "Desde **Tienda Online** podés vincular tus canales digitales para centralizar catálogo, pedidos y stock en un solo lugar sin vender productos sin existencias.\n\n¿Qué plataforma de venta online usás o pensás conectar?";
    }
    if (/\b(sucursal|sucursales|empleado|empleados|rol|roles|permiso|permisos|kiosco|empresa|perfil)\b/.test(text)) {
      return "Global Stock se adapta al tamaño de tu operación:\n• En **Configuración -> Perfil operativo del negocio** podés elegir entre **Emprendedor / Kiosco**, **Comercio / Tienda** o **Empresa / Multi-sucursal**.\n• En **Negocios** podés administrar sucursales, transferencias de stock y roles de equipo (Dueño, Encargado, Cajero, Depósito).\n\n¿Qué tamaño de equipo o cantidad de locales manejás hoy?";
    }
    if (/\b(dolar|cotizacion|moneda|peso|euro|real|fx|cambio)\b/.test(text)) {
      return "Podés consultar cotizaciones actualizadas y cambiar la moneda de visualización desde **Cotizaciones** (o en **Configuración -> Centro cambiario FX**), manteniendo precisión interna en todos los cálculos.\n\n¿Necesitás convertir un monto o fijar precios de referencia en dólares?";
    }
    if (/\b(vender mas|aumentar ventas|mejorar margen|estrategia|consejo|recomenda|idea|ideas|promocion|promo)\b/.test(text)) {
      const topMargin = [...products]
        .filter((p) => p.price > 0)
        .sort((a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price)[0];
      const highlight = topMargin
        ? `Tu producto con mejor margen hoy es **${topMargin.name}** (${(((topMargin.price - topMargin.cost) / topMargin.price) * 100).toFixed(1)}%).`
        : "";
      return `3 acciones concretas para mejorar tu resultado esta semana:\n1. **Combos con productos estrella:** agrupá un producto de alta rotación con uno de alto margen ${highlight}\n2. **Reposición inteligente:** evitá perder ventas reponiendo los ${metrics.lowStockCount + metrics.outOfStockCount} productos en alerta antes del pico semanal.\n3. **Revisión de costos:** chequeá en **Gráficos** si algún producto quedó con margen menor al 20% tras aumentos de proveedor.\n\n¿Querés que analicemos algún producto o categoría en particular?`;
    }
  }

  // 7. Metricas puntuales (fecha, ganancia, ingresos, margen, stock)
  if (/\b(hoy|fecha|today|date|hoje|heute)\b/.test(text) && !/\b(ganancia|ventas|ingresos|profit|revenue)\b/.test(text)) {
    return language === "es"
      ? `Hoy es **${formattedDate}**. ¿Querés que revisemos cómo vienen las ventas, el stock crítico o algún pendiente de hoy?`
      : `Today is ${formattedDate}.`;
  }

  if (/\b(gane|ganancia|ganancias|beneficio|beneficios|profit|lucro|gewinn)\b/.test(text)) {
    return language === "es"
      ? `La **ganancia bruta acumulada** es **${money(metrics.grossProfit)}** sobre ingresos de **${money(metrics.revenue)}** (margen bruto promedio: **${metrics.marginPct.toFixed(1)}%**).\n\n*Nota:* Como los gastos fijos externos (alquiler, servicios, sueldos) pueden no estar cargados en Comprobantes, si me decís cuánto tenés de gastos fijos mensuales te calculo tu **ganancia neta real** ahora mismo.`
      : `Gross profit is ${money(metrics.grossProfit)} (${metrics.marginPct.toFixed(1)}% margin).`;
  }

  if (/\b(ingreso|ingresos|ventas|facturacion|revenue|sales|receita|umsatz)\b/.test(text)) {
    return language === "es"
      ? `Los **ingresos acumulados** son **${money(metrics.revenue)}** con una ganancia bruta de **${money(metrics.grossProfit)}**.\n\n¿Querés que veamos cuál fue el mejor día o cuánto necesitás vender para alcanzar una meta específica?`
      : `Total revenue is ${money(metrics.revenue)}.`;
  }

  if (/\b(margen|margin|margem|marge)\b/.test(text)) {
    return language === "es"
      ? `Tu **margen bruto promedio** es **${metrics.marginPct.toFixed(1)}%**. Si me decís el costo y precio de un producto nuevo (o el margen objetivo que buscás), te ayudo a calcular el precio de venta ideal.`
      : `Your gross margin is ${metrics.marginPct.toFixed(1)}%.`;
  }

  if (/\b(stock|inventario|unidades|inventory|estoque|bestand)\b/.test(text)) {
    const alerts = metrics.lowStockCount + metrics.outOfStockCount;
    return language === "es"
      ? `Tenés **${metrics.inventoryUnits} unidades** distribuidas en **${products.length} productos**, con **${alerts} alertas** (${metrics.lowStockCount} con stock bajo y ${metrics.outOfStockCount} sin stock).\n\n¿Querés que te arme el listado exacto de cuánto comprar de cada uno?`
      : `You have ${metrics.inventoryUnits} units across ${products.length} products (${alerts} alerts).`;
  }

  // 8. Fallback conversacional inteligente en demo (nunca deja al cliente sin respuesta ni solucion)
  if (demoMode && language === "es") {
    return `Entiendo tu consulta sobre **"${message.trim()}"**.\n\nCon los datos que tengo cargados ahora mismo en el sistema veo **${products.length} productos** (${metrics.inventoryUnits} unidades), ingresos por **${money(metrics.revenue)}** y margen de **${metrics.marginPct.toFixed(1)}%**, pero ese dato puntual todavía no está registrado en la base.\n\nPara darte una respuesta exacta:\n• Contame acá mismo los datos o el escenario que querés evaluar y lo calculamos juntos paso a paso.\n• O cargalo en **Almacén**, **Caja** o **Comprobantes** para que quede guardado en tu operación.\n\n¿Qué información tenés a mano sobre esto para que lo resolvamos?`;
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
  const lastSentRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

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

      const { error } = await client.from("global_stock_ai_data_consents").upsert({
        user_id: verified.user.id,
        business_id: targetBusinessId,
        approved: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,business_id" });

      if (error) throw error;
      if (targetBusinessId !== aiBusinessId) setRecoveredBusinessId(targetBusinessId);
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
    if (!text || pending || text.length > 1500) return;
    const nowTs = Date.now();
    if (nowTs - lastSentRef.current.at < 2000) return;
    if (lastSentRef.current.text.toLowerCase() === text.toLowerCase() && nowTs - lastSentRef.current.at < 15000) return;
    lastSentRef.current = { text, at: nowTs };
    if (!demoMode && aiConsentLoading) {
      setAiConsentError("Todavía estamos comprobando el permiso. Probá de nuevo en un momento.");
      return;
    }
    if (!demoMode && !aiConsent) {
      setAiConsentError("Para enviar, primero autorizá el uso de datos del negocio desde el aviso breve del chat.");
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
        now,
        demoMode
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
              <div className="shrink-0 border-b border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2">
                {aiConsentLoading ? (
                  <p role="status" className="text-xs text-[var(--apex-muted)]">Comprobando permiso de Global Intelligence…</p>
                ) : !aiConsent ? (
                  <div className="flex items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: accentColors.main + "70", backgroundColor: "var(--apex-bg)" }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-4">Autorizar análisis del negocio</p>
                      <details className="mt-0.5">
                        <summary className="cursor-pointer text-[11px] leading-4 text-[var(--apex-muted)]">Qué datos se comparten</summary>
                        <p className="mt-1 max-w-prose text-[11px] leading-4 text-[var(--apex-muted)]">
                          Al autorizar, la consulta y los datos necesarios de inventario, ventas, costos, márgenes y actividad se podrán enviar al proveedor de IA para responder. Es opcional y podés revocar el permiso.
                        </p>
                      </details>
                      {aiConsentError && <p role="alert" className="mt-1 text-[11px] leading-4 text-red-500">{aiConsentError}</p>}
                    </div>
                    <button type="button" onClick={() => void approveAiConsent()}
                      disabled={aiConsentSaving}
                      className="min-h-9 shrink-0 rounded-lg px-3 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-55"
                      style={{ backgroundColor: accentColors.main }}>
                      {aiConsentSaving ? "Guardando…" : "Autorizar"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--apex-muted)]">
                    <span>Datos autorizados para este negocio</span>
                    <button type="button" className="shrink-0 underline" onClick={() => void revokeAiConsent()}>Revocar permiso</button>
                  </div>
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
                            <div className="mb-2 flex flex-wrap gap-1.5 px-0.5">
                {(language === "es"
                  ? [
                      { label: "Resumen", q: "Resumen del negocio" },
                      { label: "Stock y alertas", q: "Qué alertas de stock tengo?" },
                      { label: "¿Cuánto comprar?", q: "Cuántos productos debo comprar?" },
                      { label: "Ganancia y margen", q: "Cuál es mi ganancia y margen?" },
                      { label: "Mejor día", q: "Cuál fue el mejor día?" }
                    ]
                  : [
                      { label: "Summary", q: "Business summary" },
                      { label: "Stock alerts", q: "What stock alerts do I have?" },
                      { label: "Profit & margin", q: "What is my profit and margin?" },
                      { label: "Best day", q: "What was the best day?" }
                    ]
                ).map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={pending}
                    onClick={() => void ask(chip.q)}
                    className="rounded-full border border-[var(--apex-border)] bg-[var(--apex-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--apex-text)] transition hover:border-[var(--apex-accent)] hover:text-[var(--apex-accent)] disabled:opacity-45"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="mb-2 px-1 text-[10px] leading-4 text-[var(--apex-muted)]">
                {copy.contextHint}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={1500}
                  rows={1}
                  enterKeyHint="send"
                  placeholder={copy.placeholder}
                  className="apex-input max-h-28 min-h-12 flex-1 resize-none px-4 py-3 text-[16px] sm:text-sm"
                  aria-label={copy.placeholder}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || pending}
                  className="grid h-10 w-10 shrink-0 cursor-pointer touch-manipulation place-items-center rounded-full p-[3px] transition active:scale-[.94] disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #252830 9%, #777c86 17%, #e9ebef 26%, #444852 36%, #ffffff 48%, #282c34 59%, #a9aeb8 69%, #3b3f49 80%, #f7f8fa 91%, #555a64 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.96), 0 0 0 1px rgba(45,48,55,.58), 0 2px 9px rgba(0,0,0,.25)"
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
