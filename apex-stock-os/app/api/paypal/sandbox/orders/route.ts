import { NextResponse } from "next/server";
import { createSandboxDemoOrder, paypalSandboxConfigured } from "@/lib/paypal-sandbox";
import { guardApiRequest, noStoreHeaders, securityErrorResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    guardApiRequest(request, { scope: "paypal-sandbox-status", limit: 30 });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json({ configured: false }, { status: 403, headers: noStoreHeaders() });
  }
  return NextResponse.json(
    { configured: paypalSandboxConfigured(), environment: "sandbox", currency: "USD" },
    { headers: noStoreHeaders() }
  );
}

export async function POST(request: Request) {
  try {
    guardApiRequest(request, { scope: "paypal-sandbox-create-order", limit: 5 });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json({ code: "REQUEST_BLOCKED" }, { status: 403, headers: noStoreHeaders() });
  }
  if (!paypalSandboxConfigured()) {
    return NextResponse.json({ code: "PAYPAL_SANDBOX_NOT_CONFIGURED" }, { status: 503, headers: noStoreHeaders() });
  }
  try {
    const order = await createSandboxDemoOrder();
    return NextResponse.json(order, { headers: noStoreHeaders() });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYPAL_SANDBOX_ERROR";
    const status = code === "PAYPAL_SANDBOX_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ code }, { status, headers: noStoreHeaders() });
  }
}
