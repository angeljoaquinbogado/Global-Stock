import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
  guardApiRequest,
  noStoreHeaders,
  securityErrorResponse
} from "@/lib/security";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

function validBarcode(value: string) {
  return (
    value.length >= 3 &&
    value.length <= 80 &&
    /^[A-Za-z0-9._:+\-]+$/.test(value)
  );
}

async function lookupAuthorizedProduct(
  request: Request,
  barcode: string
): Promise<Product | null> {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization.startsWith("Bearer ")) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: { Authorization: authorization }
    }
  });

  const { data: userResult } = await supabase.auth.getUser(
    authorization.slice(7).trim()
  );
  if (!userResult?.user?.id) return null;

  const { data, error } = await supabase
    .from("global_stock_products")
    .select(
      "id,barcode,name,category,supplier,stock,min_stock,cost,price,metadata"
    )
    .eq("barcode", barcode)
    .eq("active", true)
    .limit(1);

  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return null;

  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    id: String(row.id),
    barcode: String(row.barcode ?? barcode),
    name: String(row.name),
    category: String(row.category ?? "Sin categoría"),
    supplier: String(row.supplier ?? "Sin proveedor"),
    stock: Math.max(0, Number(row.stock ?? 0)),
    minStock: Math.max(0, Number(row.min_stock ?? 0)),
    cost: Math.max(0, Number(row.cost ?? 0)),
    price: Math.max(0, Number(row.price ?? 0)),
    sold30d: Math.max(0, Number(metadata.sold30d ?? 0))
  };
}

export async function GET(request: NextRequest) {
  try {
    guardApiRequest(request, {
      scope: "product-lookup",
      limit: 90
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { error: "REQUEST_BLOCKED" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  const barcode = request.nextUrl.searchParams.get("barcode")?.trim() ?? "";

  if (!validBarcode(barcode)) {
    return NextResponse.json(
      { error: "INVALID_BARCODE" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  try {
    const product = await lookupAuthorizedProduct(request, barcode);
    if (product) {
      return NextResponse.json(
        { product, source: "supabase" },
        { headers: noStoreHeaders() }
      );
    }
  } catch {
    // Internal lookup is optional; RLS remains authoritative.
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
          barcode
        )}.json`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "GlobalStock/1.0"
          },
          next: { revalidate: 86400 }
        }
      );

      if (response.ok) {
        const payload = await response.json();
        const external = payload?.product;

        if (external?.product_name) {
          const product: Product = {
            id: `external-${barcode}`,
            barcode,
            name: String(external.product_name).slice(0, 180),
            category: String(
              external.categories?.split(",")?.[0]?.trim() || "Sin categoría"
            ).slice(0, 180),
            supplier: String(external.brands || "Sin proveedor").slice(0, 180),
            stock: 0,
            minStock: 0,
            cost: 0,
            price: 0,
            sold30d: 0
          };

          return NextResponse.json(
            {
              product,
              source: "openfoodfacts",
              needsCommercialData: true
            },
            { headers: noStoreHeaders() }
          );
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // External enrichment is optional.
  }

  return NextResponse.json(
    { error: "Product not found", barcode },
    { status: 404, headers: noStoreHeaders() }
  );
}
