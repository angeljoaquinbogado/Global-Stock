import { NextResponse } from "next/server";

import {
  generateIntelligenceAnswer,
  getIntelligenceProvider,
  IntelligenceNotConfiguredError,
  isIntelligenceConfigured,
  type IntelligenceHistoryMessage,
  type IntelligenceRuntimeContext
} from "@/lib/ai-provider";
import {
  authorizeApiRequest,
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

    return NextResponse.json(
      {
        code: "AI_PROVIDER_ERROR",
        configured: true
      },
      { status: 502, headers: noStoreHeaders() }
    );
  }
}
