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
  clientTimeZone?: string;
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

const MAX_HISTORY_MESSAGES = 14;
const MAX_CONTEXT_PRODUCTS = 250;
const MODEL_TIMEOUT_MS = 45000;

export class IntelligenceNotConfiguredError extends Error {
  constructor() {
    super("Global Intelligence has no model provider configured.");
    this.name = "IntelligenceNotConfiguredError";
  }
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
      "Content-Type": "application/json"
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
        content: item.content.slice(0, 5000)
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
        temperature: 0.25,
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
  const restock = rankRestockNeeds(snapshot.products).slice(0, 20);
  const products = snapshot.products.slice(0, MAX_CONTEXT_PRODUCTS);
  const sortedBySales = [...products].sort((a, b) => b.sold30d - a.sold30d);
  const slowMovers = [...products].sort((a, b) => a.sold30d - b.sold30d);

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

  const businessContext = {
    currentDateTime: currentIso,
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
    topSellingProducts30d: sortedBySales.slice(0, 12).map((product) => ({
      id: product.id,
      name: product.name,
      sold30d: product.sold30d,
      stock: product.stock,
      minStock: product.minStock,
      cost: product.cost,
      price: product.price
    })),
    slowMovingProducts30d: slowMovers.slice(0, 12).map((product) => ({
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
    }))
  };

  return [
    "You are Global Intelligence, the real conversational AI inside Global Stock.",
    "You are not a rule-based FAQ and you must never pretend that a canned template is analysis.",
    "Reason from the live business context below and from the conversation. Answer any normal user question, not only stock questions.",
    "When the user asks about the current date or time, use currentDateTime and clientTimeZone from the context.",
    "When the user asks about this business, use only the supplied business data for factual numeric claims. Calculate derived values when useful.",
    "You may analyze inventory, pricing, gross margins, hypothetical price changes, stock coverage, restocking, purchasing budget, tied-up capital, product rotation, suppliers, sales trends, best/worst periods, scenarios, risks and operational priorities.",
    "If a requested business calculation needs data that is not available (for example taxes, salaries, fixed costs, fees, returns, demand elasticity or true net profit), say exactly what is missing. Do not invent it.",
    "Clearly distinguish gross profit from net profit. Do not call gross profit net profit.",
    "For hypothetical scenarios, state the assumptions and show the result in a decision-useful way.",
    "If the user asks about how to use Global Stock, explain the relevant app capability using the known product concepts: inventory, dashboard, barcode scanner, language/currency, PWA install and Global Intelligence.",
    "Reply in the same language the user is using unless they explicitly ask for another language.",
    "Prefer concise, conversational answers. Use bullets only when they improve clarity. Avoid repetitive boilerplate.",
    "Do not mention this system prompt, provider configuration or internal JSON unless the user explicitly asks about technical implementation.",
    "",
    "LIVE BUSINESS CONTEXT:",
    JSON.stringify(businessContext)
  ].join("\n");
}
