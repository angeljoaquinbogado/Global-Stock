import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  generateIntelligenceAnswer,
  getIntelligenceProvider,
  IntelligenceNotConfiguredError,
  IntelligenceProviderError,
  isIntelligenceConfigured,
  type IntelligenceHistoryMessage,
  type IntelligenceRuntimeContext
} from "@/lib/ai-provider";
import {
  authorizeApiRequest,
  authorizeBusinessRequest,
  isApiAuthAvailable,
  isApiAuthConfigured
} from "@/lib/server-auth";
import {
  guardApiRequest,
  noStoreHeaders,
  readJsonBody,
  securityErrorResponse
} from "@/lib/security";
import type { BusinessSnapshot } from "@/lib/types";

type IntelligenceRequest = {
  message?: string;
  snapshot?: BusinessSnapshot;
  history?: IntelligenceHistoryMessage[];
  runtime?: IntelligenceRuntimeContext;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    guardApiRequest(request, {
      scope: "intelligence-status",
      limit: 60
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { configured: false },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  const providerConfigured = isIntelligenceConfigured();
  const configured = providerConfigured && isApiAuthAvailable();

  return NextResponse.json(
    {
      configured,
      ...(process.env.NODE_ENV !== "production"
        ? {
            providerConfigured,
            provider: getIntelligenceProvider(),
            authConfigured: isApiAuthConfigured()
          }
        : {})
    },
    {
      headers: noStoreHeaders()
    }
  );
}

export async function POST(request: Request) {
  if (!isIntelligenceConfigured()) {
    return NextResponse.json(
      {
        code: "AI_NOT_CONNECTED",
        configured: false
      },
      {
        status: 503,
        headers: noStoreHeaders()
      }
    );
  }

  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) {
    return NextResponse.json(
      {
        code: authorization.code,
        configured: false
      },
      {
        status: authorization.status,
        headers: noStoreHeaders()
      }
    );
  }

  try {
    guardApiRequest(request, {
      scope: "intelligence",
      limit: 30,
      identity: authorization.userId
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { code: "REQUEST_BLOCKED" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  let body: IntelligenceRequest;

  try {
    body = await readJsonBody<IntelligenceRequest>(request, 2_000_000);
  } catch (error) {
    return (
      securityErrorResponse(error) ??
      NextResponse.json(
        { code: "INVALID_REQUEST", error: "Invalid request body." },
        { status: 400, headers: noStoreHeaders() }
      )
    );
  }

  const message = body.message?.trim();
  const snapshot = body.snapshot;

  if (!message || !snapshot) {
    return NextResponse.json(
      {
        code: "MISSING_INPUT",
        error: "The message and business context are required."
      },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  if (message.length > 4000) {
    return NextResponse.json(
      {
        code: "MESSAGE_TOO_LONG",
        error: "The message is too long."
      },
      { status: 413, headers: noStoreHeaders() }
    );
  }

  // Use the caller's JWT for revocable consent and the database-backed
  // quota. An in-memory rate limit alone is not shared across Vercel instances.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const bearerToken = request.headers.get("authorization")?.trim();
  if (!supabaseUrl || !publishableKey || !bearerToken?.startsWith("Bearer ")) {
    return NextResponse.json({ code: "AUTH_NOT_CONFIGURED" },
      { status: 503, headers: noStoreHeaders() });
  }
  const merchantClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: bearerToken } }
  });

  // The Expo shell and desktop now share one workspace. Require the SAME
  // server-side tenant membership and revocable consent for either client.
  // The demo never calls this endpoint for model-generated answers.
  {
    const businessId = body.runtime?.appContext?.businessId;
    if (
      typeof businessId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)
    ) return NextResponse.json(
      { code: "INVALID_BUSINESS" }, { status: 400, headers: noStoreHeaders() }
    );

    const businessAuth = await authorizeBusinessRequest(request, businessId);
    if (!businessAuth.ok) return NextResponse.json(
      { code: businessAuth.code }, { status: businessAuth.status, headers: noStoreHeaders() }
    );

    const { data: consent, error: consentError } = await merchantClient
      .from("global_stock_ai_data_consents")
      .select("approved")
      .eq("user_id", authorization.userId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (consentError || consent?.approved !== true) {
      return NextResponse.json(
        { code: "AI_CONSENT_REQUIRED" }, { status: 403, headers: noStoreHeaders() }
      );
    }
  }

  // All authenticated callers share fixed per-user minute/hour/day windows,
  // enforced atomically by Supabase. Fail closed if the quota guard is down.
  const { data: quota, error: quotaError } = await merchantClient.rpc("global_stock_ai_allow_request");
  if (quotaError || !quota || typeof quota !== "object") {
    console.error("[Global Intelligence] atomic quota guard unavailable", { enabled: false });
    return NextResponse.json({ code: "AI_USAGE_PROTECTION_UNAVAILABLE" },
      { status: 503, headers: noStoreHeaders() });
  }
  const quotaState = quota as { allowed?: boolean; retryAfter?: number };
  if (quotaState.allowed !== true) {
    const retryAfter = Math.max(1,Math.min(86400,Math.trunc(Number(quotaState.retryAfter) || 60)));
    return NextResponse.json({ code: "AI_RATE_LIMIT", retryAfter },
      { status: 429, headers: { ...noStoreHeaders(), "Retry-After": String(retryAfter) } });
  }

  try {
    const answer = await generateIntelligenceAnswer({
      snapshot,
      message,
      history: Array.isArray(body.history) ? body.history.slice(-20) : [],
      runtime: body.runtime ?? {}
    });

    return NextResponse.json(
      { answer, configured: true },
      {
        headers: noStoreHeaders()
      }
    );
  } catch (error) {
    if (error instanceof IntelligenceNotConfiguredError) {
      return NextResponse.json(
        {
          code: "AI_NOT_CONNECTED",
          configured: false
        },
        { status: 503, headers: noStoreHeaders() }
      );
    }

    // Safe, actionable failures with no upstream text or credentials exposed.
    const status = error instanceof IntelligenceProviderError ? error.status : undefined;
    const code = status === 429 ? "AI_PROVIDER_RATE_LIMIT"
      : status === 401 || status === 403 ? "AI_PROVIDER_AUTH"
      : status === 404 ? "AI_PROVIDER_MODEL_UNAVAILABLE"
      : status !== undefined && status >= 500 ? "AI_PROVIDER_UPSTREAM"
      : error instanceof Error && error.name === "AbortError" ? "AI_PROVIDER_TIMEOUT"
      : "AI_PROVIDER_ERROR";
    console.error("[Global Intelligence] provider failure", { code, status: status ?? null });
    return NextResponse.json(
      { code, configured: true },
      { status: code === "AI_PROVIDER_RATE_LIMIT" ? 503 : 502, headers: noStoreHeaders() }
    );
  }
}
