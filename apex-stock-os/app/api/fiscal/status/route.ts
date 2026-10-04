import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
      headers: { "Cache-Control": "no-store" }
    }
  );
}
