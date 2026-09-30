import { NextRequest, NextResponse } from "next/server";

const fallbackFromArs: Record<string, number> = {
  ARS: 1,
  USD: 0.00068,
  EUR: 0.00058,
  BRL: 0.00365,
  MXN: 0.0124,
  GBP: 0.00050,
  JPY: 0.101
};

export async function GET(request: NextRequest) {
  const target = (request.nextUrl.searchParams.get("target") || "ARS")
    .toUpperCase()
    .trim();

  if (!(target in fallbackFromArs)) {
    return NextResponse.json(
      { error: "Unsupported currency" },
      { status: 400 }
    );
  }

  if (target === "ARS") {
    return NextResponse.json({
      base: "ARS",
      target,
      rate: 1,
      source: "identity"
    });
  }

  try {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/ARS",
      { next: { revalidate: 3600 } }
    );

    if (response.ok) {
      const payload = await response.json();
      const rate = Number(payload?.rates?.[target]);

      if (Number.isFinite(rate) && rate > 0) {
        return NextResponse.json({
          base: "ARS",
          target,
          rate,
          source: "live"
        });
      }
    }
  } catch {
    // Offline deployments use the conservative bundled fallback below.
  }

  return NextResponse.json({
    base: "ARS",
    target,
    rate: fallbackFromArs[target],
    source: "fallback"
  });
}
