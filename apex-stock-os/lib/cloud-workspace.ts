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
  businessSuite?: unknown;
  smartDocuments?: unknown;
  internalDocuments?: unknown;
  freeNotes?: unknown;
  supplierProfiles?: unknown;
  onlineConnections?: unknown;
  onlineOrders?: unknown;
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

  await supabase.rpc("global_stock_accept_pending_invites");

  const { data: memberships, error: membershipError } = await supabase
    .from("global_stock_members")
    .select("business_id,role,created_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(100);

  // Never create another business if membership lookup is unavailable.
  if (membershipError) return null;
  const savedBusinessId = typeof window === "undefined" ? null :
    window.localStorage.getItem("global-stock-active-business-id");
  const membership = memberships?.find(item =>
    item.business_id === savedBusinessId
  ) ?? memberships?.[0];

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

  const { error } = await supabase.rpc(
    "global_stock_merge_workspace_state",
    {
      target_business_id: businessId,
      state_patch: state
    }
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

/** Canonical inventory rows are shared by native Expo, desktop and web.
 * Read the entire authorized business inventory, never Supabase's first
 * 1000 records only. The shared table takes precedence over stale snapshots.
 * A failed fetch returns null rather than an empty inventory.
 */
export async function loadCanonicalProducts(
  businessId: string
): Promise<Product[] | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const collected: Product[] = [];
  const pageSize = 400;
  for (let offset = 0; offset < 100000; offset += pageSize) {
    const { data, error } = await supabase
      .from("global_stock_products")
      .select("id,client_key,barcode,name,category,supplier,stock,min_stock,cost,price,source,external_id,description,brand,active,metadata,updated_at")
      .eq("business_id", businessId)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.warn("[Global Stock] Canonical inventory could not be loaded", error.code);
      return null;
    }
    for (const item of data ?? []) {
      const meta = item.metadata && typeof item.metadata === "object" &&
        !Array.isArray(item.metadata) ? item.metadata as Record<string, unknown> : {};
      const images = Array.isArray(meta.images)
        ? meta.images.filter((value): value is string => typeof value === "string").slice(0, 10)
        : [];
      collected.push({
        id: String(item.client_key || item.id),
        name: String(item.name || ""),
        barcode: String(item.barcode || ""),
        category: String(item.category || ""),
        supplier: String(item.supplier || ""),
        stock: Number(item.stock) || 0,
        minStock: Number(item.min_stock) || 0,
        cost: item.cost == null ? 0 : Number(item.cost) || 0,
        costKnown: item.cost != null,
        price: Number(item.price) || 0,
        sold30d: Number(meta.sold30d) || 0,
        source: item.source === "connected" ? "connected" : "local",
        externalId: item.external_id || undefined,
        description: item.description || undefined,
        brand: item.brand || undefined,
        active: item.active !== false,
        image: typeof meta.image === "string" ? meta.image : undefined,
        images,
        originalPrice: typeof meta.originalPrice === "number" ? meta.originalPrice : undefined,
        discountPercent: typeof meta.discountPercent === "number" ? meta.discountPercent : undefined,
        updatedAt: item.updated_at || null
      });
    }
    if ((data?.length ?? 0) < pageSize) return collected;
  }
  // Prevent a silently truncated inventory from becoming the new truth.
  console.error("[Global Stock] Inventory exceeded the 100000-item read guard");
  return null;
}

/** Preserve local-only, unsynchronized products while using the authoritative
 * table for records that exist in Supabase. Never drop a draft due to a
 * transient network error. */
export function mergeCanonicalProducts(
  saved: Product[],
  canonical: Product[]
): Product[] {
  const byId = new Map(saved.map(product => [product.id, product]));
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const cloud of canonical) {
    const local = byId.get(cloud.id);
    seen.add(cloud.id);
    result.push(local ? { ...local, ...cloud } : cloud);
  }
  for (const local of saved) {
    if (!seen.has(local.id)) result.push(local);
  }
  return result;
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
    stock: product.stock,
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

  if (error) return false;

  await supabase.rpc("global_stock_seed_inventory_levels", {
    target_business_id: businessId
  });

  return true;
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

export type PosPayment = {
  method: string;
  amount: number;
};

type SaleQueuePayload = {
  businessId: string;
  currency: string;
  receivedAmount?: number;
  customerId?: string;
  total: number;
  costTotal: number;
  payments: PosPayment[];
  lines: Array<{
    productKey: string;
    productName: string;
    variantId?: string;
    variantLabel?: string;
    locationId?: string;
    unitPrice: number;
    unitCost: number;
    quantity: number;
  }>;
};

type StockQueuePayload = {
  businessId: string;
  productKey: string;
  previousStock: number;
  nextStock: number;
  reason: string;
};

type OfflineOperation =
  | {
      id: string;
      kind: "sale";
      createdAt: string;
      payload: SaleQueuePayload;
    }
  | {
      id: string;
      kind: "stock";
      createdAt: string;
      payload: StockQueuePayload;
    };

const OFFLINE_QUEUE_KEY = "global-stock-offline-operations-v1";

function offlineQueueKey(businessId: string) {
  return `${OFFLINE_QUEUE_KEY}:business:${businessId}`;
}

function readOfflineQueue(businessId: string): OfflineOperation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(
      offlineQueueKey(businessId)
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineOperation[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (operation) => operation.payload.businessId === businessId
        )
      : [];
  } catch {
    return [];
  }
}

function writeOfflineQueue(
  businessId: string,
  queue: OfflineOperation[]
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    offlineQueueKey(businessId),
    JSON.stringify(
      queue
        .filter(
          (operation) => operation.payload.businessId === businessId
        )
        .slice(-1000)
    )
  );
}

function enqueueOffline(operation: OfflineOperation) {
  const businessId = operation.payload.businessId;
  const queue = readOfflineQueue(businessId);
  if (queue.some((item) => item.id === operation.id)) return;
  queue.push(operation);
  writeOfflineQueue(businessId, queue);
}

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function executeQueuedSale(
  operationId: string,
  payload: SaleQueuePayload
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("SUPABASE_UNAVAILABLE");

  const { data, error } = await supabase.rpc(
    "global_stock_record_pos_sale",
    {
      target_business_id: payload.businessId,
      operation_id: operationId,
      sale_currency: payload.currency,
      sale_total: payload.total,
      sale_cost_total: payload.costTotal,
      target_customer_id: payload.customerId || null,
      sale_lines: payload.lines,
      sale_payments: payload.payments,
      received_amount: payload.receivedAmount ?? null
    }
  );

  if (error || !data) {
    throw new Error(error?.message || "SALE_SYNC_FAILED");
  }

  return String(data);
}

async function executeQueuedStock(
  operationId: string,
  payload: StockQueuePayload
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("SUPABASE_UNAVAILABLE");

  const { error } = await supabase.rpc(
    "global_stock_record_stock_adjustment",
    {
      target_business_id: payload.businessId,
      operation_id: operationId,
      product_key_value: payload.productKey,
      previous_stock: payload.previousStock,
      next_stock: payload.nextStock,
      adjustment_reason: payload.reason
    }
  );

  if (error) {
    throw new Error(error.message || "STOCK_SYNC_FAILED");
  }
}

export async function recordPosSale({
  businessId,
  currency,
  paymentMethod,
  payments,
  receivedAmount,
  customerId,
  locationId,
  lines,
  total,
  costTotal
}: {
  businessId: string;
  currency: string;
  paymentMethod?: string;
  payments?: PosPayment[];
  receivedAmount?: number;
  customerId?: string;
  locationId?: string;
  lines: Array<{
    product: Product;
    quantity: number;
    variant?: {
      id: string;
      name: string;
      price: number | null;
      cost: number | null;
    } | null;
  }>;
  total: number;
  costTotal: number;
}) {
  if (!lines.length) return null;

  const normalizedPayments = (
    payments?.length
      ? payments
      : [{ method: paymentMethod || "cash", amount: total }]
  )
    .map((payment) => ({
      method: payment.method,
      amount: Math.max(0, Number(payment.amount) || 0)
    }))
    .filter((payment) => payment.amount > 0);

  const paymentTotal = normalizedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  if (
    !normalizedPayments.length ||
    Math.abs(paymentTotal - total) > 0.02
  ) {
    return null;
  }

  const payload: SaleQueuePayload = {
    businessId,
    currency,
    receivedAmount,
    customerId,
    total,
    costTotal,
    payments: normalizedPayments,
    lines: lines.map(({ product, quantity, variant }) => ({
      productKey: product.id,
      productName: product.name,
      variantId: variant?.id,
      variantLabel: variant?.name,
      locationId,
      unitPrice: variant?.price ?? product.price,
      unitCost:
        variant?.cost ??
        (product.costKnown === false ? 0 : product.cost),
      quantity
    }))
  };

  const operation: OfflineOperation = {
    id: crypto.randomUUID(),
    kind: "sale",
    createdAt: new Date().toISOString(),
    payload
  };

  if (isOffline()) {
    enqueueOffline(operation);
    return null;
  }

  try {
    return await executeQueuedSale(operation.id, payload);
  } catch {
    enqueueOffline(operation);
    return null;
  }
}

/** Receive units into the shared inventory. Server locks the product, records a
 * stock movement, updates location levels and rejects cross-tenant access.
 * Caller keeps the same operationId while retrying a possibly lost response.
 */
export async function addProductStockToCloud({
  businessId, productKey, quantity, operationId
}: {
  businessId: string;
  productKey: string;
  quantity: number;
  operationId: string;
}): Promise<number> {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000 ||
      Math.abs(quantity - Math.round(quantity * 1000) / 1000) > 1e-9)
    throw new Error("Ingresá una cantidad positiva de hasta tres decimales.");
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Iniciá sesión para agregar stock.");

  const { data: row, error: lookupError } = await supabase.from("global_stock_products")
    .select("id")
    .eq("business_id", businessId)
    .eq("client_key", productKey)
    .eq("active", true)
    .maybeSingle();
  if (lookupError) throw new Error("No se pudo consultar el producto. Actualizá el inventario.");
  if (!row?.id) throw new Error("No encontramos el producto en este negocio.");

  const { data, error } = await supabase.rpc("global_stock_add_product_stock", {
    target_business_id: businessId,
    target_product_id: row.id,
    added_quantity: quantity,
    client_operation_id: operationId
  });
  if (error) throw new Error(error.message || "No se pudo agregar stock.");
  const confirmed = Number(data);
  if (!Number.isFinite(confirmed) || confirmed < 0)
    throw new Error("Supabase no confirmó el nuevo stock.");
  return confirmed;
}

export async function recordStockAdjustment({
  businessId,
  product,
  previousStock,
  nextStock,
  reason = "adjustment"
}: {
  businessId: string;
  product: Product;
  previousStock: number;
  nextStock: number;
  reason?: string;
}) {
  if (nextStock === previousStock) return;

  const operation: OfflineOperation = {
    id: crypto.randomUUID(),
    kind: "stock",
    createdAt: new Date().toISOString(),
    payload: {
      businessId,
      productKey: product.id,
      previousStock,
      nextStock,
      reason
    }
  };

  if (isOffline()) {
    enqueueOffline(operation);
    return;
  }

  try {
    await executeQueuedStock(operation.id, operation.payload);
  } catch {
    enqueueOffline(operation);
  }
}

export async function flushOfflineBusinessOperations(
  businessId: string
) {
  if (typeof window === "undefined" || isOffline()) return 0;

  const queue = readOfflineQueue(businessId);
  if (!queue.length) return 0;

  const remaining: OfflineOperation[] = [];
  let flushed = 0;

  for (const operation of queue) {
    try {
      if (operation.kind === "sale") {
        await executeQueuedSale(operation.id, operation.payload);
      } else {
        await executeQueuedStock(operation.id, operation.payload);
      }
      flushed += 1;
    } catch {
      remaining.push(operation);
    }
  }

  writeOfflineQueue(businessId, remaining);
  return flushed;
}

export function offlineBusinessOperationCount(
  businessId: string
) {
  return readOfflineQueue(businessId).length;
}
