import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  extractBusinessDocument,
  IntelligenceNotConfiguredError,
  isIntelligenceConfigured
} from "@/lib/ai-provider";
import {
  authorizeApiRequest,
  authorizeBusinessRequest,
  isApiAuthAvailable
} from "@/lib/server-auth";
import {
  guardApiRequest,
  noStoreHeaders,
  readJsonBody,
  securityErrorResponse
} from "@/lib/security";

type RequestBody = {
  filename?: string;
  mimeType?: string;
  base64?: string;
  language?: string;
  currency?: string;
  businessId?: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BASE64_LENGTH = 11_500_000;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf"
]);

export async function GET(request: Request) {
  try {
    guardApiRequest(request, {
      scope: "document-intelligence-status",
      limit: 60
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { configured: false },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  return NextResponse.json(
    {
      configured: isIntelligenceConfigured() && isApiAuthAvailable()
    },
    {
      headers: noStoreHeaders()
    }
  );
}

export async function POST(request: Request) {
  if (!isIntelligenceConfigured()) {
    return NextResponse.json(
      { code: "AI_NOT_CONNECTED" },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { code: authorization.code },
      { status: authorization.status, headers: noStoreHeaders() }
    );
  }

  try {
    guardApiRequest(request, {
      scope: "document-intelligence",
      limit: 12,
      identity: authorization.userId
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { code: "REQUEST_BLOCKED" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  let body: RequestBody;

  try {
    body = await readJsonBody<RequestBody>(request, 16_000_000);
  } catch (error) {
    return (
      securityErrorResponse(error) ??
      NextResponse.json(
        { code: "INVALID_REQUEST" },
        { status: 400, headers: noStoreHeaders() }
      )
    );
  }

  const filename = body.filename?.trim() || "document";
  const mimeType = body.mimeType?.trim().toLowerCase() || "";
  const base64 = body.base64?.trim() || "";
  const languageRaw = body.language?.trim() || "es";
  const currencyRaw = body.currency?.trim().toUpperCase() || "ARS";
  const businessId =
    typeof body.businessId === "string" ? body.businessId.trim() : "";

  if (
    !base64 ||
    base64.length > MAX_BASE64_LENGTH ||
    !ALLOWED_DOCUMENT_TYPES.has(mimeType) ||
    !/^[A-Za-z0-9+/=\r\n]+$/.test(base64)
  ) {
    return NextResponse.json(
      { code: "INVALID_DOCUMENT" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  if (businessId) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        businessId
      )
    ) {
      return NextResponse.json(
        { code: "INVALID_BUSINESS" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const businessAuth = await authorizeBusinessRequest(request, businessId);
    if (!businessAuth.ok) {
      return NextResponse.json(
        { code: businessAuth.code },
        { status: businessAuth.status, headers: noStoreHeaders() }
      );
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const bearerToken = request.headers.get("authorization")?.trim();
  if (!supabaseUrl || !publishableKey || !bearerToken?.startsWith("Bearer ")) {
    return NextResponse.json(
      { code: "AUTH_NOT_CONFIGURED" },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const merchantClient = createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: { headers: { Authorization: bearerToken } }
  });

  const { data: quota, error: quotaError } = await merchantClient.rpc(
    "global_stock_ai_allow_request"
  );
  if (quotaError || !quota || typeof quota !== "object") {
    return NextResponse.json(
      { code: "AI_USAGE_PROTECTION_UNAVAILABLE" },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const quotaState = quota as { allowed?: boolean; retryAfter?: number };
  if (quotaState.allowed !== true) {
    const retryAfter = Math.max(
      1,
      Math.min(86400, Math.trunc(Number(quotaState.retryAfter) || 60))
    );
    return NextResponse.json(
      { code: "AI_RATE_LIMIT", retryAfter },
      {
        status: 429,
        headers: { ...noStoreHeaders(), "Retry-After": String(retryAfter) }
      }
    );
  }

  const language = /^[a-z]{2,8}(?:-[A-Za-z0-9]{2,8})?$/.test(languageRaw)
    ? languageRaw
    : "es";
  const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : "ARS";

  try {
    const document = await extractBusinessDocument({
      base64,
      mimeType,
      filename: filename.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 180),
      language,
      currency
    });

    return NextResponse.json(
      { document },
      {
        headers: noStoreHeaders()
      }
    );
  } catch (error) {
    if (error instanceof IntelligenceNotConfiguredError) {
      return NextResponse.json(
        { code: "AI_NOT_CONNECTED" },
        { status: 503, headers: noStoreHeaders() }
      );
    }

    return NextResponse.json(
      { code: "DOCUMENT_PROVIDER_ERROR" },
      { status: 502, headers: noStoreHeaders() }
    );
  }
}