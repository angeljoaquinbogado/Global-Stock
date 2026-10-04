import { NextResponse } from "next/server";

import {
  guardApiRequest,
  noStoreHeaders,
  securityErrorResponse
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    guardApiRequest(request, {
      scope: "fiscal-status",
      limit: 60
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { configured: false, authority: "ARCA", country: "AR", mode: "locked" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  const configured = Boolean(
    process.env.ARCA_FISCAL_PROVIDER_URL?.trim() &&
      process.env.ARCA_FISCAL_PROVIDER_API_KEY?.trim()
  );

  return NextResponse.json(
    {
      configured,
      authority: "ARCA",
      country: "AR",
      mode: configured ? "provider" : "locked"
    },
    {
      headers: noStoreHeaders()
    }
  );
}
