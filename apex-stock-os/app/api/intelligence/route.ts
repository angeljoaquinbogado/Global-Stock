import { NextResponse } from "next/server";

import {
  generateIntelligenceAnswer,
  IntelligenceNotConfiguredError,
  isIntelligenceConfigured,
  type IntelligenceHistoryMessage,
  type IntelligenceRuntimeContext
} from "@/lib/ai-provider";
import type { BusinessSnapshot } from "@/lib/types";

type IntelligenceRequest = {
  message?: string;
  snapshot?: BusinessSnapshot;
  history?: IntelligenceHistoryMessage[];
  runtime?: IntelligenceRuntimeContext;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      configured: isIntelligenceConfigured()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function POST(request: Request) {
  let body: IntelligenceRequest;

  try {
    body = (await request.json()) as IntelligenceRequest;
  } catch {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "Invalid request body." },
      { status: 400 }
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
      { status: 400 }
    );
  }

  if (message.length > 4000) {
    return NextResponse.json(
      {
        code: "MESSAGE_TOO_LONG",
        error: "The message is too long."
      },
      { status: 413 }
    );
  }

  try {
    const answer = await generateIntelligenceAnswer({
      snapshot,
      message,
      history: Array.isArray(body.history) ? body.history : [],
      runtime: body.runtime ?? {}
    });

    return NextResponse.json(
      { answer, configured: true },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    if (error instanceof IntelligenceNotConfiguredError) {
      return NextResponse.json(
        {
          code: "AI_NOT_CONNECTED",
          configured: false
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        code: "AI_PROVIDER_ERROR",
        configured: true
      },
      { status: 502 }
    );
  }
}
