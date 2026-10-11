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
  // Accept invitations similarly to the existing Next.js application.
  // An invitation error must not block existing authorized businesses.
  await client.rpc("global_stock_accept_pending_invites");

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

export async function createBusiness(client: SupabaseClient, userId: string, rawName: string): Promise<Business> {
  const name = rawName.trim();
  if (name.length < 2 || name.length > 100) throw new Error("Escribí un nombre de negocio de 2 a 100 caracteres.");

  const { data, error } = await client
    .from("global_stock_businesses")
    .insert({
      owner_user_id: userId,
      name,
      business_type: "retail",
      country: "AR",
      base_currency: "ARS",
      locale: "es-AR",
      timezone: "America/Argentina/Buenos_Aires"
    })
    .select("id,name,base_currency,locale")
    .single();

  if (error) throw error;
  const business = data as Business;
  // Mirror the existing Next.js onboarding: create the main stock location.
  const { error: locationError } = await client.from("global_stock_locations").insert({
    business_id: business.id,
    name: "Principal",
    kind: "store",
    active: true
  });

  // RLS still prevents unauthorized writes; the business exists even if
  // optional setup fails. Report the problem instead of hiding it.
  if (locationError) {
    throw new Error(`Se creó el negocio, pero falló el depósito principal: ${locationError.message}. Actualizá para recuperarlo.`);
  }

  return business;
}

export async function createProduct(
  client: SupabaseClient,
  businessId: string,
  form: {
    name: string;
    barcode: string;
    category: string;
    price: number;
    stock: number;
    minStock: number;
  },
  operationKey: string
): Promise<string> {
  if (form.name.trim().length < 2 || form.name.trim().length > 160)
    throw new Error("El nombre debe tener entre 2 y 160 caracteres.");
  if (!Number.isFinite(form.price) || form.price < 0 || form.price > 1_000_000_000)
    throw new Error("Ingresá un precio válido.");
  if (!Number.isFinite(form.stock) || form.stock < 0 || form.stock > 1_000_000_000)
    throw new Error("Ingresá un stock válido.");
  if (!Number.isFinite(form.minStock) || form.minStock < 0 || form.minStock > 1_000_000_000)
    throw new Error("Ingresá un stock mínimo válido.");

  const { data, error } = await client.rpc("global_stock_create_mobile_product", {
    target_business_id: businessId,
    product_name: form.name.trim(),
    product_price: form.price,
    product_stock: form.stock,
    product_barcode: form.barcode.trim() || null,
    product_category: form.category.trim() || null,
    product_min_stock: form.minStock,
    client_operation_key: operationKey
  });
  if (error) throw error;
  return String(data);
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
