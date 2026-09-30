import { NextResponse } from "next/server";

import { answerBusinessQuestion } from "@/lib/intelligence";
import type { BusinessSnapshot } from "@/lib/types";

type IntelligenceRequest = {
  message?: string;
  snapshot?: BusinessSnapshot;
};

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

  if (message.length > 1500) {
    return NextResponse.json(
      { error: "message is too long" },
      { status: 413 }
    );
  }

  const answer = answerBusinessQuestion(snapshot, message);

  return NextResponse.json({ answer });
}
