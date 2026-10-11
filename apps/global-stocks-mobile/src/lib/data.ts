import type { SupabaseClient } from "@supabase/supabase-js";

export type Business = {
  id: string;
  name: string;
  base_currency: string;
  locale: string;
};

export type Product = {
  id: string;
  business_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  price: number;
  stock: number;
  min_stock: number;
  active: boolean;
};

export type SaleLine = {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
};

export type SaleDraft = {
  id: string;
  business_id: string;
  created_at: string;
  total: number;
  items: SaleLine[];
};

export async function loadBusinesses(client: SupabaseClient, userId: string): Promise<Business[]> {
  const [membership, owned] = await Promise.all([
    client.from("global_stock_members").select("business_id").eq("user_id", userId).eq("active", true),
    client.from("global_stock_businesses").select("id").eq("owner_user_id", userId).eq("active", true)
  ]);
  if (membership.error) throw membership.error;
  if (owned.error) throw owned.error;
  const ids = [...new Set([
    ...(membership.data ?? []).map((m) => m.business_id as string),
    ...(owned.data ?? []).map((b) => b.id as string)
  ])];
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from("global_stock_businesses")
    .select("id,name,base_currency,locale")
    .in("id", ids)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function loadProducts(client: SupabaseClient, businessId: string): Promise<Product[]> {
  // Paginate rather than silently showing only Supabase's default 1,000 rows.
  const result: Product[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("global_stock_products")
      .select("id,business_id,name,sku,barcode,category,price,stock,min_stock,active")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("name")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as Product[];
    result.push(...page.map((p) => ({
      ...p,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      min_stock: Number(p.min_stock) || 0
    })));
    if (page.length < pageSize) return result;
  }
}
