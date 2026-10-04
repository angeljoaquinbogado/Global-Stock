import { NextResponse } from "next/server";

import {
  guardApiRequest,
  noStoreHeaders,
  securityErrorResponse
} from "@/lib/security";

export const dynamic = "force-dynamic";

function configured(...keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export async function GET(request: Request) {
  try {
    guardApiRequest(request, {
      scope: "integrations-status",
      limit: 60
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { custom: true },
      { status: 403, headers: noStoreHeaders() }
    );
  }

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
      headers: noStoreHeaders()
    }
  );
}
