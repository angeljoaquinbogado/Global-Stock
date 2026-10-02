"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Product, TrendPoint } from "@/lib/types";

export type CloudBusiness = {
  id: string;
  owner_user_id: string;
  name: string;
  business_type: string;
  country: string | null;
  base_currency: string;
  locale: string;
  timezone: string;
};

export type CloudWorkspaceState = {
  products?: Product[];
  trend?: TrendPoint[];
  businessName?: string;
  businessType?: string;
  businessCountry?: string;
  businessDescription?: string;
  activities?: unknown[];
  notes?: unknown[];
  fxHistory?: unknown[];
  fxMarket?: string;
};

type EnsureBusinessInput = {
  name?: string;
  businessType?: string;
  country?: string;
  currency?: string;
  locale?: string;
};

function timezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function ensureCloudBusiness(
  input: EnsureBusinessInput
): Promise<CloudBusiness | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user?.id) return null;

  const { data: memberships } = await supabase
    .from("global_stock_members")
    .select("business_id,role,created_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  const membership = memberships?.[0] as
    | { business_id?: string }
    | undefined;

  if (membership?.business_id) {
    const { data: business } = await supabase
      .from("global_stock_businesses")
      .select(
        "id,owner_user_id,name,business_type,country,base_currency,locale,timezone"
      )
      .eq("id", membership.business_id)
      .maybeSingle();

    if (business) return business as CloudBusiness;
  }

  const metadata = user.user_metadata ?? {};
  const name =
    input.name?.trim() ||
    (typeof metadata.business_name === "string"
      ? metadata.business_name.trim()
      : "") ||
    "Mi negocio";

  const businessType =
    input.businessType?.trim() ||
    (typeof metadata.industry === "string" ? metadata.industry.trim() : "") ||
    "retail";

  const country =
    input.country?.trim() ||
    (typeof metadata.country === "string" ? metadata.country.trim() : "") ||
    null;

  const { data: business, error } = await supabase
    .from("global_stock_businesses")
    .insert({
      owner_user_id: user.id,
      name,
      business_type: businessType,
      country,
      base_currency: input.currency || "ARS",
      locale: input.locale || "es-AR",
      timezone: timezone()
    })
    .select(
      "id,owner_user_id,name,business_type,country,base_currency,locale,timezone"
    )
    .single();

  if (error || !business) return null;

  await supabase.from("global_stock_locations").insert({
    business_id: business.id,
    name: "Principal",
    kind: "store",
    active: true
  });

  return business as CloudBusiness;
}

export async function loadCloudWorkspace(businessId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("global_stock_workspaces")
    .select("state,revision,updated_at")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    state: (data.state ?? {}) as CloudWorkspaceState,
    revision: Number(data.revision || 0),
    updatedAt: String(data.updated_at || "")
  };
}

export async function saveCloudWorkspace(
  businessId: string,
  state: CloudWorkspaceState
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.id) return false;

  const now = Date.now();

  const { error } = await supabase.from("global_stock_workspaces").upsert(
    {
      business_id: businessId,
      state,
      revision: now,
      updated_by: session.user.id,
      updated_at: new Date(now).toISOString()
    },
    { onConflict: "business_id" }
  );

  return !error;
}

export async function updateCloudBusiness(
  businessId: string,
  patch: {
    name?: string;
    businessType?: string;
    country?: string;
    currency?: string;
    locale?: string;
  }
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const payload: Record<string, string | null> = {};
  if (patch.name !== undefined) payload.name = patch.name.trim() || "Mi negocio";
  if (patch.businessType !== undefined) {
    payload.business_type = patch.businessType || "retail";
  }
  if (patch.country !== undefined) payload.country = patch.country.trim() || null;
  if (patch.currency !== undefined) payload.base_currency = patch.currency;
  if (patch.locale !== undefined) payload.locale = patch.locale;

  const { error } = await supabase
    .from("global_stock_businesses")
    .update(payload)
    .eq("id", businessId);

  return !error;
}

export async function mirrorProductsToCloud(
  businessId: string,
  products: Product[]
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const rows = products.map((product) => ({
    business_id: businessId,
    client_key: product.id,
    barcode: product.barcode || null,
    name: product.name,
    description: product.description || null,
    category: product.category || null,
    brand: product.brand || null,
    supplier: product.supplier || null,
    cost: product.costKnown === false ? null : product.cost,
    price: product.price,
    min_stock: product.minStock,
    active: product.active !== false,
    source: product.source || "local",
    external_id: product.externalId || null,
    metadata: {
      sold30d: product.sold30d,
      images: product.images ?? [],
      image: product.image ?? "",
      originalPrice: product.originalPrice ?? null,
      discountPercent: product.discountPercent ?? null
    }
  }));

  if (!rows.length) return true;

  const { error } = await supabase
    .from("global_stock_products")
    .upsert(rows, { onConflict: "business_id,client_key" });

  return !error;
}

export async function writeAuditEvent(
  businessId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  await supabase.from("global_stock_audit_events").insert({
    business_id: businessId,
    user_id: session?.user?.id ?? null,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata
  });
}
