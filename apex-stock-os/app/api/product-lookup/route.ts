import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get("barcode")?.trim();

  if (!barcode) {
    return NextResponse.json(
      { error: "barcode is required" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRole) {
    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, barcode, name, category, supplier_name, stock, min_stock, cost, price, sold_30d"
      )
      .eq("barcode", barcode)
      .maybeSingle();

    if (!error && data) {
      const product: Product = {
        id: String(data.id),
        barcode: String(data.barcode),
        name: String(data.name),
        category: String(data.category ?? "Sin categoría"),
        supplier: String(data.supplier_name ?? "Sin proveedor"),
        stock: Number(data.stock ?? 0),
        minStock: Number(data.min_stock ?? 0),
        cost: Number(data.cost ?? 0),
        price: Number(data.price ?? 0),
        sold30d: Number(data.sold_30d ?? 0)
      };

      return NextResponse.json({ product, source: "supabase" });
    }
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      {
        headers: {
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
          name: String(external.product_name),
          category: String(
            external.categories?.split(",")?.[0]?.trim() || "Sin categoría"
          ),
          supplier: String(external.brands || "Sin proveedor"),
          stock: 0,
          minStock: 0,
          cost: 0,
          price: 0,
          sold30d: 0
        };

        return NextResponse.json({
          product,
          source: "openfoodfacts",
          needsCommercialData: true
        });
      }
    }
  } catch {
    // External enrichment is optional; a clean 404 is returned below.
  }

  return NextResponse.json(
    { error: "Product not found", barcode },
    { status: 404 }
  );
}
