import { NextResponse } from "next/server";

import {
  extractBusinessDocument,
  IntelligenceNotConfiguredError,
  isIntelligenceConfigured
} from "@/lib/ai-provider";
import {
  authorizeApiRequest,
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
  const language = body.language?.trim() || "es";
  const currency = body.currency?.trim().toUpperCase() || "ARS";

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

  try {
    const document = await extractBusinessDocument({
      base64,
      mimeType,
      filename: filename.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 180),
      language: language.slice(0, 12),
      currency: currency.slice(0, 3)
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
