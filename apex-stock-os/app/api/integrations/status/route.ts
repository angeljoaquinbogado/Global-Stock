import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function configured(...keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export async function GET() {
  return NextResponse.json(
    {
      shopify: configured(
        "SHOPIFY_CLIENT_ID",
        "SHOPIFY_CLIENT_SECRET"
      ),
      tiendanube: configured(
        "TIENDANUBE_APP_ID",
        "TIENDANUBE_CLIENT_SECRET"
      ),
      mercadolibre: configured(
        "MERCADOLIBRE_CLIENT_ID",
        "MERCADOLIBRE_CLIENT_SECRET"
      ),
      woocommerce:
        process.env.WOOCOMMERCE_INTEGRATION_ENABLED?.trim() === "true",
      custom: true
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
