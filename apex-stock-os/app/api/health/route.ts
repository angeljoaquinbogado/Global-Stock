import { NextResponse } from "next/server";

import {
  getIntelligenceProvider,
  isIntelligenceConfigured
} from "@/lib/ai-provider";
import { isApiAuthAvailable, isApiAuthConfigured } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function filled(value: string | undefined) {
  return Boolean(value?.trim());
}

export async function GET() {
  const supabase = isApiAuthConfigured();

  const connector =
    (process.env.GLOBAL_STOCK_CONNECTOR_SECRET?.trim().length ?? 0) >= 32;

  const aiProvider = isIntelligenceConfigured();
  const aiProviderName = getIntelligenceProvider();

  return NextResponse.json(
    {
      ok: true,
      app: "Global Stock",
      checks: {
        ai: aiProvider && isApiAuthAvailable(),
        aiProvider,
        aiProviderName,
        auth: supabase,
        connector,
        providers: {
          shopify: false,
          tiendanube: false,
          mercadolibre: false,
          woocommerce: false,
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
