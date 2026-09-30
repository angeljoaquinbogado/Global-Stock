import { NextRequest, NextResponse } from "next/server";

const supported = new Set([
  "ARS",
  "USD",
  "EUR",
  "BRL",
  "MXN",
  "GBP",
  "JPY"
]);

const marketLabels = {
  oficial: ["Dólar Oficial", "Dolar Oficial"],
  blue: ["Dólar blue", "Dolar blue"],
  mep: ["Dólar MEP", "Dolar MEP"],
  ccl: ["Contado con liqui", "Dólar CCL", "Dolar CCL"],
  tarjeta: ["Dólar Tarjeta", "Dolar Tarjeta"]
} as const;

type Market = keyof typeof marketLabels;

type DolarQuote = {
  market: Market;
  buy: number | null;
  sell: number;
  source: "dolarhoy.com";
  sourceUpdatedAt: string | null;
};

export const dynamic = "force-dynamic";

function decodeHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseArsNumber(value: string) {
  const normalized = value
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function findSegment(text: string, labels: readonly string[]) {
  const lower = text.toLocaleLowerCase("es");
  for (const label of labels) {
    const index = lower.indexOf(label.toLocaleLowerCase("es"));
    if (index >= 0) return text.slice(index, index + 900);
  }
  return "";
}

function extractPrices(segment: string) {
  const prices: number[] = [];
  const regex = /\$\s*([0-9][0-9.]*?(?:,[0-9]+)?)(?=\s|%|Compra|Venta|$)/g;
  for (const match of segment.matchAll(regex)) {
    const parsed = parseArsNumber(match[1]);
    if (parsed) prices.push(parsed);
    if (prices.length >= 4) break;
  }
  return prices;
}

function extractUpdatedAt(text: string) {
  const match = text.match(
    /Actualizado por última vez:\s*([^|]+?)(?=Dólar|Dolar|Compra|Venta|$)/i
  );
  return match?.[1]?.trim() || null;
}

async function getDolarHoyQuote(market: Market): Promise<DolarQuote> {
  const response = await fetch("https://dolarhoy.com/", {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; GlobalStock/1.0; +https://github.com/angeljoaquinbogado/Global-Stock)"
    }
  });

  if (!response.ok) {
    throw new Error(`DolarHoy returned HTTP ${response.status}`);
  }

  const html = await response.text();
  const text = decodeHtml(html);
  const segment = findSegment(text, marketLabels[market]);
  if (!segment) throw new Error("Market quote not found");

  const prices = extractPrices(segment);
  if (!prices.length) throw new Error("Market prices not found");

  const buy = market === "tarjeta" ? null : prices[0] ?? null;
  const sell =
    market === "tarjeta"
      ? prices[0]
      : prices[1] ?? prices[0];

  if (!sell || !Number.isFinite(sell)) {
    throw new Error("Invalid market sell quote");
  }

  return {
    market,
    buy,
    sell,
    source: "dolarhoy.com",
    sourceUpdatedAt: extractUpdatedAt(text)
  };
}

async function getUsdCrossRate(target: string) {
  if (target === "USD") return 1;

  const response = await fetch(
    "https://open.er-api.com/v6/latest/USD",
    {
      cache: "no-store",
      headers: { Accept: "application/json" }
    }
  );

  if (!response.ok) {
    throw new Error(`Global FX provider returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  const rate = Number(payload?.rates?.[target]);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid global cross rate");
  }

  return rate;
}

export async function GET(request: NextRequest) {
  const target = (
    request.nextUrl.searchParams.get("target") || "ARS"
  )
    .toUpperCase()
    .trim();

  const marketRaw = (
    request.nextUrl.searchParams.get("market") || "oficial"
  )
    .toLowerCase()
    .trim();

  const market: Market =
    marketRaw in marketLabels
      ? (marketRaw as Market)
      : "oficial";

  if (!supported.has(target)) {
    return NextResponse.json(
      { error: "Unsupported currency" },
      { status: 400 }
    );
  }

  const checkedAt = new Date().toISOString();

  if (target === "ARS") {
    return NextResponse.json(
      {
        base: "ARS",
        target,
        rate: 1,
        market,
        source: "identity",
        checkedAt
      },
      {
        headers: { "Cache-Control": "no-store" }
      }
    );
  }

  try {
    const quote = await getDolarHoyQuote(market);
    const usdPerArs = 1 / quote.sell;
    const crossRate = await getUsdCrossRate(target);
    const rate = usdPerArs * crossRate;

    return NextResponse.json(
      {
        base: "ARS",
        target,
        rate,
        market,
        source: quote.source,
        provider: "dolarhoy.com",
        quote: {
          buy: quote.buy,
          sell: quote.sell,
          currency: "ARS"
        },
        crossProvider:
          target === "USD" ? null : "open.er-api.com",
        sourceUpdatedAt: quote.sourceUpdatedAt,
        checkedAt
      },
      {
        headers: { "Cache-Control": "no-store" }
      }
    );
  } catch {
    return NextResponse.json(
      {
        error: "Live exchange rate temporarily unavailable",
        base: "ARS",
        target,
        market,
        checkedAt
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}
