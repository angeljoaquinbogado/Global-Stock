import { NextRequest, NextResponse } from "next/server";

const supported = new Set(["ARS", "USD", "EUR", "BRL", "MXN", "GBP", "JPY"]);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const target = (request.nextUrl.searchParams.get("target") || "ARS")
    .toUpperCase()
    .trim();

  if (!supported.has(target)) {
    return NextResponse.json(
      { error: "Unsupported currency" },
      { status: 400 }
    );
  }

  const checkedAt = new Date().toISOString();

  if (target === "ARS") {
    return NextResponse.json({
      base: "ARS",
      target,
      rate: 1,
      source: "identity",
      checkedAt
    });
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/ARS", {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`FX provider returned ${response.status}`);
    }

    const payload = await response.json();
    const rate = Number(payload?.rates?.[target]);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid FX rate");
    }

    return NextResponse.json({
      base: "ARS",
      target,
      rate,
      source: "live",
      provider: "open.er-api.com",
      providerUpdatedAt:
        payload?.time_last_update_utc ??
        payload?.time_last_update_unix ??
        null,
      checkedAt
    });
  } catch {
    return NextResponse.json(
      {
        error: "Live exchange rate temporarily unavailable",
        base: "ARS",
        target,
        checkedAt
      },
      { status: 503 }
    );
  }
}
