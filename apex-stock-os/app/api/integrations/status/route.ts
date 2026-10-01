import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function configured(...values: Array<string | undefined>) {
  return values.every((value) => Boolean(value?.trim()));
}

export async function GET() {
  return NextResponse.json(
    {
      shopify: configured(
        process.env.SHOPIFY_CLIENT_ID,
        process.env.SHOPIFY_CLIENT_SECRET
      ),
      tiendanube: configured(
        process.env.TIENDANUBE_APP_ID,
        process.env.TIENDANUBE_CLIENT_SECRET
      ),
      mercadolibre: configured(
        process.env.MERCADOLIBRE_CLIENT_ID,
        process.env.MERCADOLIBRE_CLIENT_SECRET
      ),
      woocommerce: false,
      custom: true
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
