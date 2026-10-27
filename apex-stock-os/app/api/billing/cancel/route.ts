import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { guardApiRequest, noStoreHeaders, securityErrorResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function paypalApiBase() {
  return process.env.PAYPAL_ENVIRONMENT?.trim().toLowerCase() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) throw new Error("PAYPAL_NOT_CONFIGURED");
  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials", cache: "no-store", signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("PAYPAL_AUTH_FAILED");
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("PAYPAL_AUTH_FAILED");
  return data.access_token;
}

export async function POST(request: Request) {
  try { guardApiRequest(request, { scope: "billing-cancel-subscription", limit: 4 }); }
  catch (error) { return securityErrorResponse(error) ?? NextResponse.json({ code: "REQUEST_BLOCKED" }, { status: 403, headers: noStoreHeaders() }); }

  const authorization = request.headers.get("authorization") ?? "";
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!accessToken || !url || !anonKey) return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401, headers: noStoreHeaders() });

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401, headers: noStoreHeaders() });
  if (!serviceKey) return NextResponse.json({ code: "BILLING_ADMIN_NOT_CONFIGURED" }, { status: 503, headers: noStoreHeaders() });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: subscription, error: readError } = await admin.from("global_stock_subscriptions")
    .select("user_id,status,provider,provider_subscription_id")
    .eq("user_id", authData.user.id).maybeSingle();
  if (readError) return NextResponse.json({ code: "SUBSCRIPTION_READ_FAILED" }, { status: 500, headers: noStoreHeaders() });
  if (!subscription) return NextResponse.json({ code: "SUBSCRIPTION_NOT_FOUND" }, { status: 404, headers: noStoreHeaders() });
  if (subscription.provider !== "paypal" || !subscription.provider_subscription_id) {
    return NextResponse.json({ code: "NO_EXTERNAL_SUBSCRIPTION" }, { status: 409, headers: noStoreHeaders() });
  }
  if (!/^I-[A-Z0-9-]{6,80}$/i.test(subscription.provider_subscription_id)) {
    return NextResponse.json({ code: "INVALID_PROVIDER_SUBSCRIPTION" }, { status: 409, headers: noStoreHeaders() });
  }
  if (subscription.status === "cancelled") return NextResponse.json({ ok: true, status: "cancelled" }, { headers: noStoreHeaders() });

  try {
    const token = await getPayPalAccessToken();
    const response = await fetch(`${paypalApiBase()}/v1/billing/subscriptions/${encodeURIComponent(subscription.provider_subscription_id)}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Cancelled by the subscriber in Global Stock" }),
      cache: "no-store", signal: AbortSignal.timeout(12000)
    });
    if (!response.ok && response.status !== 204) return NextResponse.json({ code: "PAYPAL_CANCELLATION_FAILED" }, { status: 502, headers: noStoreHeaders() });
    const now = new Date().toISOString();
    const { error: updateError } = await admin.from("global_stock_subscriptions").update({ status: "cancelled", cancel_at_period_end: true, cancelled_at: now, updated_at: now }).eq("user_id", authData.user.id);
    if (updateError) return NextResponse.json({ code: "SUBSCRIPTION_SYNC_FAILED" }, { status: 500, headers: noStoreHeaders() });
    return NextResponse.json({ ok: true, status: "cancelled" }, { headers: noStoreHeaders() });
  } catch (error) {
    const code = error instanceof Error ? error.message : "BILLING_CANCELLATION_FAILED";
    const status = code === "PAYPAL_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ code }, { status, headers: noStoreHeaders() });
  }
}