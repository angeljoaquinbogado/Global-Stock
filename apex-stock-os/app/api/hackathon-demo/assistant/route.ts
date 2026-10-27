import { NextResponse } from "next/server";
import {
  generateIntelligenceAnswer,
  IntelligenceNotConfiguredError,
  IntelligenceProviderError,
  isIntelligenceConfigured
} from "@/lib/ai-provider";
import { demoProducts, demoTrend } from "@/lib/demo-data";
import { guardApiRequest, noStoreHeaders, readJsonBody, securityErrorResponse } from "@/lib/security";
import type { BusinessSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DemoAssistantRequest = { message?: string };

const demoSnapshot: BusinessSnapshot = {
  products: demoProducts,
  trend: demoTrend,
  currency: "ARS",
  currencyRate: 1,
  locale: "es-AR"
};

export async function POST(request: Request) {
  try {
    guardApiRequest(request, { scope: "public-hackathon-demo-ai", limit: 8 });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json({ code: "REQUEST_BLOCKED" }, { status: 403, headers: noStoreHeaders() });
  }
  if (!isIntelligenceConfigured()) {
    return NextResponse.json({ code: "AI_NOT_CONNECTED", configured: false }, { status: 503, headers: noStoreHeaders() });
  }
  let body: DemoAssistantRequest;
  try {
    body = await readJsonBody<DemoAssistantRequest>(request, 4096);
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400, headers: noStoreHeaders() });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 500) {
    return NextResponse.json({ code: "INVALID_MESSAGE" }, { status: 400, headers: noStoreHeaders() });
  }

  try {
    const answer = await generateIntelligenceAnswer({
      snapshot: demoSnapshot,
      message,
      history: [],
      runtime: {
        clientNow: new Date().toISOString(),
        clientLocalTime: "demo",
        clientTimeZone: "America/Argentina/Buenos_Aires",
        appContext: {
          mode: "public-hackathon-demo",
          dataClassification: "fictional sample data only",
          allowedActions: ["read_sample_inventory", "explain_sample_stock_alerts"],
          prohibitedActions: ["modify_inventory", "create_purchase_order", "capture_payment", "issue_invoice"]
        }
      }
    });
    return NextResponse.json({ answer, configured: true, data: "sample" }, { headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof IntelligenceProviderError ? error.status : undefined;
    const code = error instanceof IntelligenceNotConfiguredError ? "AI_NOT_CONNECTED"
      : status === 429 ? "AI_PROVIDER_RATE_LIMIT"
      : status === 401 || status === 403 ? "AI_PROVIDER_AUTH"
      : status === 404 ? "AI_PROVIDER_MODEL_UNAVAILABLE"
      : status !== undefined && status >= 500 ? "AI_PROVIDER_UPSTREAM"
      : "AI_PROVIDER_ERROR";
    return NextResponse.json({ code, configured: true }, { status: 502, headers: noStoreHeaders() });
  }
}
