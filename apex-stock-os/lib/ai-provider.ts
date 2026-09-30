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

const MAX_HISTORY_MESSAGES = 20;
const MAX_CONTEXT_PRODUCTS = 300;
const MODEL_TIMEOUT_MS = 60000;

export class IntelligenceNotConfiguredError extends Error {
  constructor() {
    super("Global Intelligence has no model provider configured.");
    this.name = "IntelligenceNotConfiguredError";
  }
}

export function isIntelligenceConfigured() {
  return Boolean(
    process.env.AI_API_URL?.trim() &&
      process.env.AI_MODEL?.trim()
  );
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
  const endpoint = process.env.AI_API_URL?.trim();
  const model = process.env.AI_MODEL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();

  if (!endpoint || !model) {
    throw new IntelligenceNotConfiguredError();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

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

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({
        model,
        temperature: 0.35,
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
      cost: product.cost,
      price: product.price
    })),
    slowMovingProducts30d: slowMovers.slice(0, 16).map((product) => ({
      id: product.id,
      name: product.name,
      sold30d: product.sold30d,
      stock: product.stock,
      inventoryCost: product.stock * product.cost
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
        estimatedPurchaseCost: suggestedUnits * product.cost,
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
      cost: product.cost,
      price: product.price,
      sold30d: product.sold30d,
      stockStatus: getStockStatus(product),
      unitGrossProfit: product.price - product.cost,
      unitGrossMarginPct:
        product.price > 0
          ? ((product.price - product.cost) / product.price) * 100
          : 0,
      inventoryCost: product.stock * product.cost,
      inventoryRetailValue: product.stock * product.price
    })),
    appContext: runtime.appContext ?? {}
  };

  return [
    "You are Global Intelligence, the real conversational AI inside Global Stock.",
    "You are a general conversational assistant specialized in business operations, inventory, sales, purchasing and profitability. You are not a canned FAQ, intent router or template engine.",
    "Use the full conversation plus LIVE BUSINESS CONTEXT to reason. Answer natural questions even if the wording was never anticipated by the application.",
    "The app context may contain business name, recent activity, notes, reminders and foreign-exchange history. Use that information when relevant.",
    "When asked what day/date/time it is, use currentLocalDateTime and clientTimeZone. Never answer from model training time.",
    "When the user asks about this business, use only supplied business data for factual numeric claims. Derive calculations explicitly when useful.",
    "You may analyze inventory, pricing, gross margins, hypothetical price changes, stock coverage, restocking, purchasing budget, tied-up capital, product rotation, suppliers, sales trends, best/worst periods, cash implications, scenarios, risks, notes and operational priorities.",
    "If a requested calculation needs data that is not available, identify exactly what is missing instead of inventing it.",
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
