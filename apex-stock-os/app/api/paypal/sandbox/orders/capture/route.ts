import { NextResponse } from "next/server";
import { captureSandboxDemoOrder, paypalSandboxConfigured } from "@/lib/paypal-sandbox";
import { guardApiRequest, noStoreHeaders, readJsonBody, securityErrorResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CaptureBody = { orderId?: string };

export async function POST(request: Request) {
  try {
    guardApiRequest(request, { scope: "paypal-sandbox-capture-order", limit: 5 });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json({ code: "REQUEST_BLOCKED" }, { status: 403, headers: noStoreHeaders() });
  }
  if (!paypalSandboxConfigured()) {
    return NextResponse.json({ code: "PAYPAL_SANDBOX_NOT_CONFIGURED" }, { status: 503, headers: noStoreHeaders() });
  }
  let body: CaptureBody;
  try {
    body = await readJsonBody<CaptureBody>(request, 2048);
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400, headers: noStoreHeaders() });
  }
  if (typeof body.orderId !== "string") {
    return NextResponse.json({ code: "PAYPAL_ORDER_ID_REQUIRED" }, { status: 400, headers: noStoreHeaders() });
  }
  try {
    const capture = await captureSandboxDemoOrder(body.orderId);
    return NextResponse.json(capture, { headers: noStoreHeaders() });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYPAL_SANDBOX_ERROR";
    const status = code === "PAYPAL_ORDER_ID_INVALID" ? 400 : code === "PAYPAL_SANDBOX_ORDER_NOT_OURS" ? 403 : 502;
    return NextResponse.json({ code }, { status, headers: noStoreHeaders() });
  }
}
