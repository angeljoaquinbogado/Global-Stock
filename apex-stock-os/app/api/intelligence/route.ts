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

  // Native mobile requests require valid business membership and a
  // server-verified, revocable per-business AI context authorization.
  // This does not alter the existing web chat authorization flow.
  if (body.runtime?.appContext?.platform === "Global Stock React Native") {
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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const bearer = request.headers.get("authorization")?.trim();
    if (!url || !key || !bearer?.startsWith("Bearer ")) {
      return NextResponse.json(
        { code: "AUTH_NOT_CONFIGURED" }, { status: 503, headers: noStoreHeaders() }
      );
    }
    const merchantClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: bearer } }
    });
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
