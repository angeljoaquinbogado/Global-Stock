import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public, non-sensitive readiness signal used by Expo Go and native builds. */
export async function GET() {
  return NextResponse.json(
    { enabled: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()) },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
