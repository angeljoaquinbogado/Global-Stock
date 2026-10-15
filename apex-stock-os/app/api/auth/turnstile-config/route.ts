import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public readiness signal used by Expo Go. A configured site key is not proof that Supabase CAPTCHA is enabled. Keep the requirement OFF until both platforms are verified. */
export async function GET() {
  return NextResponse.json(
    {
      enabled: process.env.NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED === "true" &&
        Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
