import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      shopify: false,
      tiendanube: false,
      mercadolibre: false,
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
