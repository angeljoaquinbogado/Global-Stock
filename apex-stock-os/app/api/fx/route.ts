import { NextRequest, NextResponse } from "next/server";

import {
  guardApiRequest,
  noStoreHeaders,
  securityErrorResponse
} from "@/lib/security";

const currencies = [
  "ARS",
  "USD",
  "EUR",
  "BRL",
  "MXN",
  "GBP",
  "JPY"
] as const;

type Currency = (typeof currencies)[number];

const supported = new Set<string>(currencies);

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

type GlobalRatesPayload = {
  result?: string;
  base_code?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
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
    const needle = label.toLocaleLowerCase("es");
    let from = 0;

    while (from < lower.length) {
      const index = lower.indexOf(needle, from);
      if (index < 0) break;

      const segment = text.slice(index, index + 1100);
      if (/\$\s*[0-9]/.test(segment)) return segment;
      from = index + needle.length;
    }
  }

  return "";
}

function extractPrices(segment: string) {
  const prices: number[] = [];
  const regex =
    /\$\s*([0-9][0-9.]*?(?:,[0-9]+)?)(?=\s|%|Compra|Venta|$)/g;

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

async function getDolarHoyQuote(
  market: Market
): Promise<DolarQuote> {
  // Public market page: revalidate centrally instead of fetching on every user request.
  // The deadline also bounds provider outages (two providers per cross-rate).
  const response = await fetch("https://dolarhoy.com/", {
    next: { revalidate: 120 },
    signal: AbortSignal.timeout(7000),
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; GlobalStock/1.0; +https://github.com/angeljoaquinbogado/Global-Stock)"
    }
  });

  if (!response.ok) {
    throw new Error(
      `DolarHoy returned HTTP ${response.status}`
    );
  }

  const text = decodeHtml(await response.text());
  const segment = findSegment(text, marketLabels[market]);
  if (!segment) throw new Error("Market quote not found");

  const prices = extractPrices(segment);
  if (!prices.length) throw new Error("Market prices not found");

  const buy =
    market === "tarjeta" ? null : prices[0] ?? null;
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

async function getGlobalRates(base: Currency) {
  const response = await fetch(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
    {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(7000),
      headers: { Accept: "application/json" }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Global FX provider returned HTTP ${response.status}`
    );
  }

  const payload = (await response.json()) as GlobalRatesPayload;

  if (!payload.rates || typeof payload.rates !== "object") {
    throw new Error("Global FX provider returned invalid rates");
  }

  return {
    rates: payload.rates,
    sourceUpdatedAt: payload.time_last_update_utc ?? null
  };
}

function asCurrency(value: string | null, fallback: Currency) {
  const normalized = (value || fallback).toUpperCase().trim();
  return supported.has(normalized)
    ? (normalized as Currency)
    : null;
}

export async function GET(request: NextRequest) {
  try {
    guardApiRequest(request, {
      scope: "fx",
      limit: 90
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { error: "REQUEST_BLOCKED" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  const base = asCurrency(
    request.nextUrl.searchParams.get("base"),
    "ARS"
  );
  const target = asCurrency(
    request.nextUrl.searchParams.get("target"),
    "USD"
  );

  if (!base || !target) {
    return NextResponse.json(
      { error: "Unsupported currency" },
      { status: 400 }
    );
  }

  const marketRaw = (
    request.nextUrl.searchParams.get("market") || "oficial"
  )
    .toLowerCase()
    .trim();

  const market: Market =
    marketRaw in marketLabels
      ? (marketRaw as Market)
      : "oficial";

  const checkedAt = new Date().toISOString();

  if (base === target) {
    return NextResponse.json(
      {
        base,
        target,
        rate: 1,
        market,
        provider: "identity",
        checkedAt
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const includesArs = base === "ARS" || target === "ARS";

    if (!includesArs) {
      const global = await getGlobalRates(base);
      const rate = Number(global.rates[target]);

      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error("Invalid global pair rate");
      }

      return NextResponse.json(
        {
          base,
          target,
          rate,
          provider: "open.er-api.com",
          market: null,
          quote: null,
          sourceUpdatedAt: global.sourceUpdatedAt,
          checkedAt
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const quote = await getDolarHoyQuote(market);

    let rate: number;

    if (base === "USD" && target === "ARS") {
      rate = quote.sell;
    } else if (base === "ARS" && target === "USD") {
      rate = 1 / quote.sell;
    } else if (base === "ARS") {
      const global = await getGlobalRates("USD");
      const usdToTarget = Number(global.rates[target]);
      if (!Number.isFinite(usdToTarget) || usdToTarget <= 0) {
        throw new Error("Invalid USD cross rate");
      }
      rate = (1 / quote.sell) * usdToTarget;
    } else {
      const global = await getGlobalRates("USD");
      const usdToBase = Number(global.rates[base]);
      if (!Number.isFinite(usdToBase) || usdToBase <= 0) {
        throw new Error("Invalid base cross rate");
      }
      rate = quote.sell / usdToBase;
    }

    return NextResponse.json(
      {
        base,
        target,
        rate,
        provider: "dolarhoy.com",
        market,
        quote: {
          buy: quote.buy,
          sell: quote.sell,
          currency: "ARS",
          reference: "USD/ARS"
        },
        sourceUpdatedAt: quote.sourceUpdatedAt,
        checkedAt
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        error: "Live exchange rate temporarily unavailable",
        base,
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
