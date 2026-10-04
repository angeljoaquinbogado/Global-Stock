import { NextResponse } from "next/server";

import {
  getIntelligenceProvider,
  isIntelligenceConfigured
} from "@/lib/ai-provider";
import { isApiAuthAvailable, isApiAuthConfigured } from "@/lib/server-auth";
import {
  guardApiRequest,
  noStoreHeaders,
  securityErrorResponse
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    guardApiRequest(request, {
      scope: "health",
      limit: 120
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { ok: false },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: true },
      { headers: noStoreHeaders() }
    );
  }

  const supabase = isApiAuthConfigured();
  const connector =
    (process.env.GLOBAL_STOCK_CONNECTOR_SECRET?.trim().length ?? 0) >= 32;
  const aiProvider = isIntelligenceConfigured();

  return NextResponse.json(
    {
      ok: true,
      app: "Global Stock",
      checks: {
        ai: aiProvider && isApiAuthAvailable(),
        aiProvider,
        aiProviderName: getIntelligenceProvider(),
        auth: supabase,
        connector
      },
      checkedAt: new Date().toISOString()
    },
    {
      headers: noStoreHeaders()
    }
  );
}
