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

export async function GET() {
  return NextResponse.json(
    {
      configured: isIntelligenceConfigured() && isApiAuthAvailable()
    },
    {
      headers: { "Cache-Control": "no-store" }
    }
  );
}

export async function POST(request: Request) {
  if (!isIntelligenceConfigured()) {
    return NextResponse.json(
      { code: "AI_NOT_CONNECTED" },
      { status: 503 }
    );
  }

  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { code: authorization.code },
      { status: authorization.status }
    );
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { code: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  const filename = body.filename?.trim() || "document";
  const mimeType = body.mimeType?.trim() || "";
  const base64 = body.base64?.trim() || "";
  const language = body.language?.trim() || "es";
  const currency = body.currency?.trim().toUpperCase() || "ARS";

  if (
    !base64 ||
    base64.length > MAX_BASE64_LENGTH ||
    (!mimeType.startsWith("image/") && mimeType !== "application/pdf")
  ) {
    return NextResponse.json(
      { code: "INVALID_DOCUMENT" },
      { status: 400 }
    );
  }

  try {
    const document = await extractBusinessDocument({
      base64,
      mimeType,
      filename: filename.slice(0, 180),
      language: language.slice(0, 12),
      currency: currency.slice(0, 3)
    });

    return NextResponse.json(
      { document },
      {
        headers: { "Cache-Control": "no-store" }
      }
    );
  } catch (error) {
    if (error instanceof IntelligenceNotConfiguredError) {
      return NextResponse.json(
        { code: "AI_NOT_CONNECTED" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { code: "DOCUMENT_PROVIDER_ERROR" },
      { status: 502 }
    );
  }
}
