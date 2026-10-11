import { NextResponse } from "next/server";

/**
 * Expo Go bootstrap. Only returns the SAME public client configuration that
 * NEXT_PUBLIC_* already exposes in the browser JavaScript bundle.
 *
 * Never return SUPABASE_SERVICE_ROLE_KEY, provider credentials or tokens.
 * Access to merchant tables remains enforced by Supabase authentication + RLS.
 */
export const dynamic = "force-dynamic";

const GLOBAL_STOCK_SUPABASE_HOST = "yckimhbtvijmmkxukxgd.supabase.co";

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!rawUrl || !publicKey) {
    return NextResponse.json(
      { error: "mobile_config_not_available" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  let validUrl = false;
  try {
    const url = new URL(rawUrl);
    validUrl =
      url.protocol === "https:" &&
      url.hostname === GLOBAL_STOCK_SUPABASE_HOST &&
      url.pathname.replace(/\/$/, "") === "" &&
      !url.username &&
      !url.password;
  } catch {
    validUrl = false;
  }

  // A legacy key must explicitly have role=anon; checking only the JWT
  // prefix could accidentally publish a misconfigured service_role secret.
  let isLegacyAnon = false;
  if (publicKey.startsWith("eyJ") && publicKey.length > 100) {
    try {
      const parts = publicKey.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { role?: unknown };
      isLegacyAnon = parts.length === 3 && payload.role === "anon";
    } catch {
      isLegacyAnon = false;
    }
  }

  if (
    !validUrl ||
    !(publicKey.startsWith("sb_publishable_") || isLegacyAnon)
  ) {
    return NextResponse.json(
      { error: "mobile_config_mismatch" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { supabaseUrl: rawUrl, supabasePublishableKey: publicKey },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    }
  );
}
