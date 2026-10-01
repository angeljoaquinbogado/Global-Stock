import {
  calculateMetrics,
  getStockStatus,
  rankRestockNeeds
} from "./analytics";
import type { BusinessSnapshot } from "./types";

export type IntelligenceHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type IntelligenceRuntimeContext = {
  clientNow?: string;
  clientLocalTime?: string;
  clientTimeZone?: string;
  appContext?: Record<string, unknown>;
};

type CompatibleChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type ProviderConfig =
  | {
      provider: "gemini";
      endpoint: string;
      model: string;
      apiKey: string;
    }
  | {
      provider: "openai-compatible";
      endpoint: string;
      model: string;
      apiKey: string;
    }
  | {
      provider: "none";
      endpoint: "";
      model: "";
      apiKey: "";
    };

const MAX_HISTORY_MESSAGES = 20;
const MAX_CONTEXT_PRODUCTS = 300;
const MODEL_TIMEOUT_MS = 60000;

export class IntelligenceNotConfiguredError extends Error {
  constructor() {
    super("Global Intelligence has no model provider configured.");
    this.name = "IntelligenceNotConfiguredError";
  }
}

function providerConfig(): ProviderConfig {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim();

  if (geminiKey && geminiModel) {
    const configuredEndpoint = process.env.GEMINI_API_URL?.trim();
    const endpoint =
      configuredEndpoint ||
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`;

    return {
      provider: "gemini",
      endpoint,
      model: geminiModel,
      apiKey: geminiKey
    };
  }

  const vercelOidc = process.env.VERCEL_OIDC_TOKEN?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const endpoint =
    process.env.AI_API_URL?.trim() ||
    (openAiKey
      ? "https://api.openai.com/v1/chat/completions"
      : vercelOidc
        ? "https://ai-gateway.vercel.sh/v1/chat/completions"
        : "");
  const model =
    process.env.OPENAI_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    (vercelOidc ? "openai/gpt-5.6-sol" : "");
  const apiKey =
    openAiKey ||
    process.env.AI_API_KEY?.trim() ||
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    vercelOidc ||
    "";

  if (!endpoint || !model) {
    return {
      provider: "none",
      endpoint: "",
      model: "",
      apiKey: ""
    };
  }

  return {
    provider: "openai-compatible",
    endpoint,
    model,
    apiKey
  };
}

export function getIntelligenceProvider() {
  return providerConfig().provider;
}

export function isIntelligenceConfigured() {
  return providerConfig().provider !== "none";
}

export async function generateIntelligenceAnswer({
  snapshot,
  message,
  history,
  runtime
}: {
  snapshot: BusinessSnapshot;
  message: string;
  history: IntelligenceHistoryMessage[];
  runtime: IntelligenceRuntimeContext;
}) {
  const config = providerConfig();

  if (config.provider === "none") {
    throw new IntelligenceNotConfiguredError();
  }

  const { endpoint, model, apiKey } = config;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    const conversation = history
      .filter(
        (item) =>
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.trim()
      )
      .slice(-MAX_HISTORY_MESSAGES)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 7000)
      }));

    if (
      !conversation.length ||
      conversation[conversation.length - 1]?.role !== "user" ||
      conversation[conversation.length - 1]?.content.trim() !== message.trim()
    ) {
      conversation.push({
        role: "user",
        content: message
      });
    }

    if (config.provider === "gemini") {
      headers["x-goog-api-key"] = apiKey;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal: controller.signal,
        cache: "no-store",
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: buildSystemPrompt(snapshot, runtime) }]
          },
          contents: conversation.map((item) => ({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.content }]
          }))
        })
      });

      const payload = (await response.json().catch(() => ({}))) as GeminiResponse;

      if (!response.ok) {
        const providerMessage =
          payload.error?.message ||
          `Gemini returned HTTP ${response.status}`;
        throw new Error(providerMessage);
      }

      const answer = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text?.trim())
        .filter(Boolean)
        .join("\n")
        .trim();

      if (!answer) {
        throw new Error("Gemini returned an empty response.");
      }

      return answer;
    }

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(snapshot, runtime)
          },
          ...conversation
        ]
      })
    });

    const payload = (await response.json().catch(() => ({}))) as
      CompatibleChatResponse;

    if (!response.ok) {
      const providerMessage =
        payload.error?.message ||
        `AI provider returned HTTP ${response.status}`;
      throw new Error(providerMessage);
    }

    const answer = payload.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("The AI provider returned an empty response.");
    }

    return answer;
  } finally {
    clearTimeout(timeout);
  }
}

function buildSystemPrompt(
  snapshot: BusinessSnapshot,
  runtime: IntelligenceRuntimeContext
) {
  const metrics = calculateMetrics(snapshot);
  const restock = rankRestockNeeds(snapshot.products).slice(0, 30);
  const products = snapshot.products.slice(0, MAX_CONTEXT_PRODUCTS);
  const sortedBySales = [...products].sort(
    (a, b) => b.sold30d - a.sold30d
  );
  const slowMovers = [...products].sort(
    (a, b) => a.sold30d - b.sold30d
  );

  const totalCostOfSales = snapshot.trend.reduce(
    (sum, point) => sum + point.cost,
    0
  );

  const inventoryRetailValue = products.reduce(
    (sum, product) => sum + product.stock * product.price,
    0
  );

  const potentialInventoryGrossProfit =
    inventoryRetailValue - metrics.inventoryCost;

  const currentIso = runtime.clientNow || new Date().toISOString();
  const timeZone = runtime.clientTimeZone || "unknown";
  const localTime = runtime.clientLocalTime || currentIso;

  const businessContext = {
    currentDateTimeUtc: currentIso,
    currentLocalDateTime: localTime,
    clientTimeZone: timeZone,
    locale: snapshot.locale,
    displayCurrency: snapshot.currency,
    currencyRateFromBase: snapshot.currencyRate,
    metrics: {
      revenue: metrics.revenue,
      costOfSales: totalCostOfSales,
      grossProfit: metrics.grossProfit,
      grossMarginPct: metrics.marginPct,
      inventoryCost: metrics.inventoryCost,
      inventoryRetailValue,
      potentialInventoryGrossProfit,
      inventoryUnits: metrics.inventoryUnits,
      lowStockProducts: metrics.lowStockCount,
      outOfStockProducts: metrics.outOfStockCount
    },
    trend: snapshot.trend,
    topSellingProducts30d: sortedBySales.slice(0, 16).map((product) => ({
      id: product.id,
      name: product.name,
      sold30d: product.sold30d,
      stock: product.stock,
      minStock: product.minStock,
      cost: product.costKnown === false ? null : product.cost,
      costKnown: product.costKnown !== false,
      price: product.price
    })),
    slowMovingProducts30d: slowMovers.slice(0, 16).map((product) => ({
      id: product.id,
      name: product.name,
      sold30d: product.sold30d,
      stock: product.stock,
      inventoryCost:
        product.costKnown === false
          ? null
          : product.stock * product.cost
    })),
    restockAnalysis: restock.map(
      ({ product, daysCover, suggestedUnits, urgency }) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        minStock: product.minStock,
        sold30d: product.sold30d,
        daysCover,
        suggestedUnits,
        estimatedPurchaseCost:
          product.costKnown === false
            ? null
            : suggestedUnits * product.cost,
        urgency
      })
    ),
    products: products.map((product) => ({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      supplier: product.supplier,
      stock: product.stock,
      minStock: product.minStock,
      cost: product.costKnown === false ? null : product.cost,
      costKnown: product.costKnown !== false,
      price: product.price,
      sold30d: product.sold30d,
      stockStatus: getStockStatus(product),
      unitGrossProfit:
        product.costKnown === false
          ? null
          : product.price - product.cost,
      unitGrossMarginPct:
        product.costKnown === false
          ? null
          : product.price > 0
            ? ((product.price - product.cost) / product.price) * 100
            : 0,
      inventoryCost:
        product.costKnown === false
          ? null
          : product.stock * product.cost,
      inventoryRetailValue: product.stock * product.price
    })),
    appContext: runtime.appContext ?? {}
  };

  return [
    "You are Global Intelligence, the real conversational AI inside Global Stock.",
    "You are a general conversational assistant specialized in business operations, inventory, sales, purchasing and profitability. You are not a canned FAQ, intent router or template engine.",
    "Use the full conversation plus LIVE BUSINESS CONTEXT to reason. Answer natural questions even if the wording was never anticipated by the application.",
    "The app context may contain business name/type, recent activity, free-form notes, dated reminders, online orders, ecommerce connection metadata, internal documents and foreign-exchange history. Use that information when relevant.",
    "When asked what day/date/time it is, use currentLocalDateTime and clientTimeZone. Never answer from model training time.",
    "When the user asks about this business, use only supplied business data for factual numeric claims. Derive calculations explicitly when useful.",
    "You may analyze inventory, pricing, gross margins, hypothetical price changes, stock coverage, restocking, purchasing budget, tied-up capital, product rotation, suppliers, sales trends, best/worst periods, physical-store activity, online orders, internal documents, cash implications, scenarios, risks, notes and operational priorities.",
    "If a requested calculation needs data that is not available, identify exactly what is missing instead of inventing it. A null cost or costKnown=false means the real purchase cost has not been recorded; never treat it as zero.",
    "Clearly distinguish gross profit, contribution margin and net profit. Do not call gross profit net profit.",
    "For forecasts or scenarios, state assumptions and avoid pretending uncertain future demand is known.",
    "If the user asks how to use Global Stock, explain the relevant capability using the current app modules: Home, Sales/POS, Inventory, Charts, Purchases, Suppliers, Activity, Notes/Calendar, Scanner, Settings, language/currency and Global Intelligence.",
    "Reply in the same language the user is using unless they explicitly ask for another language.",
    "Prefer direct, useful and conversational answers. Avoid repetitive disclaimers and boilerplate.",
    "Do not mention system prompts, internal JSON or provider configuration unless the user explicitly asks about technical implementation.",
    "",
    "LIVE BUSINESS CONTEXT:",
    JSON.stringify(businessContext)
  ].join("\n");
}
