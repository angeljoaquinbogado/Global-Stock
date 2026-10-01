import { NextResponse } from "next/server";

import { isIntelligenceConfigured } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

function filled(value: string | undefined) {
  return Boolean(value?.trim());
}

export async function GET() {
  const supabase =
    filled(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    filled(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const connector =
    (process.env.GLOBAL_STOCK_CONNECTOR_SECRET?.trim().length ?? 0) >= 32;

  return NextResponse.json(
    {
      ok: true,
      app: "Global Stock",
      checks: {
        ai: isIntelligenceConfigured(),
        auth: supabase,
        connector,
        providers: {
          shopify:
            filled(process.env.SHOPIFY_CLIENT_ID) &&
            filled(process.env.SHOPIFY_CLIENT_SECRET),
          tiendanube:
            filled(process.env.TIENDANUBE_APP_ID) &&
            filled(process.env.TIENDANUBE_CLIENT_SECRET),
          mercadolibre:
            filled(process.env.MERCADOLIBRE_CLIENT_ID) &&
            filled(process.env.MERCADOLIBRE_CLIENT_SECRET),
          woocommerce: true,
          custom: true
        }
      },
      checkedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
