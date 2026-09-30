import { NextResponse } from "next/server";

import {
  generateIntelligenceAnswer,
  IntelligenceNotConfiguredError,
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

export async function POST(request: Request) {
  let body: IntelligenceRequest;

  try {
    body = (await request.json()) as IntelligenceRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  const snapshot = body.snapshot;

  if (!message || !snapshot) {
    return NextResponse.json(
      { error: "message and snapshot are required" },
      { status: 400 }
    );
  }

  if (message.length > 4000) {
    return NextResponse.json(
      { error: "message is too long" },
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

    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof IntelligenceNotConfiguredError) {
      return NextResponse.json(
        {
          error:
            "Global Intelligence todavía no tiene un modelo real conectado. Configurá AI_API_URL y AI_MODEL en el servidor; AI_API_KEY es opcional para proveedores locales."
        },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "El modelo tardó demasiado en responder."
          : error.message
        : "No se pudo consultar el modelo de IA.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
