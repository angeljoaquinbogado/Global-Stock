import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
  clearConnectorSession,
  readConnectorSession,
  setConnectorSession
} from "@/lib/connector-session";
import {
  assertPublicStoreUrl,
  connectorFetch
} from "@/lib/remote-store";
import { authorizeApiRequest } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyPayload = {
  url?: string;
  token?: string;
};

type BindPayload = {
  businessId?: string;
};

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function userScopedSupabase(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!url || !anonKey || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: authorization
      }
    }
  });
}

async function validateRemote(url: string, token: string) {
  const publicUrl = await assertPublicStoreUrl(url);
  const response = await connectorFetch({
    storeUrl: publicUrl.toString(),
    token,
    resource: "store"
  });
  const payload = (await response.json().catch(() => ({}))) as {
    verified?: boolean;
    store?: {
      id?: string;
      name?: string;
      url?: string;
      currency?: string;
      platform?: string;
    };
    scopes?: string[];
  };

  if (!response.ok || payload.verified !== true || !payload.store?.id) {
    throw new Error("OWNER_VERIFICATION_FAILED");
  }

  const scopes = Array.isArray(payload.scopes) ? payload.scopes : [];
  if (!scopes.includes("catalog:read") || !scopes.includes("inventory:read")) {
    throw new Error("INSUFFICIENT_SCOPES");
  }

  return {
    storeUrl: publicUrl.origin,
    storeId: String(payload.store.id),
    storeName: String(payload.store.name || publicUrl.hostname),
    currency: String(payload.store.currency || "ARS"),
    platform: String(payload.store.platform || "Connected store"),
    scopes
  };
}

export async function POST(request: NextRequest) {
  let body: VerifyPayload;

  try {
    body = (await request.json()) as VerifyPayload;
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  const url = body.url?.trim() ?? "";
  const token = body.token?.trim() ?? "";

  if (!url || token.length < 24 || token.length > 500) {
    return NextResponse.json(
      { error: "MISSING_CREDENTIALS" },
      { status: 400 }
    );
  }

  try {
    const verified = await validateRemote(url, token);
    const verifiedAt = new Date().toISOString();

    await setConnectorSession({
      ...verified,
      token,
      verifiedAt
    });

    return NextResponse.json(
      {
        verified: true,
        store: {
          id: verified.storeId,
          name: verified.storeName,
          url: verified.storeUrl,
          currency: verified.currency,
          platform: verified.platform
        },
        scopes: verified.scopes,
        verifiedAt,
        bound: false
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "OWNER_VERIFICATION_FAILED";

    const status =
      code === "GLOBAL_STOCK_CONNECTOR_SECRET_NOT_CONFIGURED"
        ? 500
        : 401;

    return NextResponse.json(
      { error: code },
      {
        status,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.code },
      { status: authorization.status }
    );
  }

  let body: BindPayload;
  try {
    body = (await request.json()) as BindPayload;
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  const businessId = body.businessId?.trim() ?? "";
  if (!validUuid(businessId)) {
    return NextResponse.json(
      { error: "INVALID_BUSINESS" },
      { status: 400 }
    );
  }

  const session = await readConnectorSession();
  if (!session) {
    return NextResponse.json(
      { error: "STORE_NOT_VERIFIED" },
      { status: 401 }
    );
  }

  if (session.businessId && session.businessId !== businessId) {
    return NextResponse.json(
      { error: "STORE_BOUND_TO_ANOTHER_BUSINESS" },
      { status: 409 }
    );
  }

  const supabase = userScopedSupabase(request);
  if (!supabase) {
    return NextResponse.json(
      { error: "AUTH_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("global_stock_members")
    .select("role,active")
    .eq("business_id", businessId)
    .eq("user_id", authorization.userId)
    .maybeSingle();

  if (
    membershipError ||
    !membership?.active ||
    !["owner", "admin"].includes(String(membership.role))
  ) {
    return NextResponse.json(
      { error: "BUSINESS_ADMIN_REQUIRED" },
      { status: 403 }
    );
  }

  const verified = await validateRemote(session.storeUrl, session.token);
  const verifiedAt = new Date().toISOString();

  await setConnectorSession({
    ...session,
    ...verified,
    businessId,
    verifiedAt
  });

  const { error: integrationError } = await supabase
    .from("global_stock_integration_accounts")
    .upsert(
      {
        business_id: businessId,
        provider: "custom",
        external_account_id: verified.storeId,
        display_name: verified.storeName,
        status: "connected",
        scopes: verified.scopes,
        last_synced_at: verifiedAt,
        last_error: null,
        metadata: {
          platform: verified.platform,
          storeUrl: verified.storeUrl
        }
      },
      {
        onConflict: "business_id,provider,external_account_id"
      }
    );

  if (integrationError) {
    return NextResponse.json(
      { error: "INTEGRATION_STATE_SAVE_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      verified: true,
      businessId,
      store: {
        id: verified.storeId,
        name: verified.storeName,
        url: verified.storeUrl,
        currency: verified.currency,
        platform: verified.platform
      },
      scopes: verified.scopes,
      verifiedAt,
      bound: true
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: NextRequest) {
  const session = await readConnectorSession();
  if (!session) {
    return NextResponse.json(
      { verified: false },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }

  const requestedBusiness =
    request.nextUrl.searchParams.get("businessId")?.trim() ?? "";

  if (
    requestedBusiness &&
    (!session.businessId || session.businessId !== requestedBusiness)
  ) {
    return NextResponse.json(
      {
        verified: false,
        error: session.businessId
          ? "STORE_BOUND_TO_ANOTHER_BUSINESS"
          : "STORE_BIND_REQUIRED"
      },
      {
        status: 409,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }

  try {
    const verified = await validateRemote(session.storeUrl, session.token);

    return NextResponse.json(
      {
        verified: true,
        store: {
          id: verified.storeId,
          name: verified.storeName,
          url: verified.storeUrl,
          currency: verified.currency,
          platform: verified.platform
        },
        scopes: verified.scopes,
        verifiedAt: session.verifiedAt,
        businessId: session.businessId ?? null,
        bound: Boolean(session.businessId)
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    await clearConnectorSession();
    return NextResponse.json(
      { verified: false },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await readConnectorSession();
  const requestedBusiness =
    request.nextUrl.searchParams.get("businessId")?.trim() ?? "";

  if (
    session?.businessId &&
    requestedBusiness &&
    session.businessId !== requestedBusiness
  ) {
    return NextResponse.json(
      { error: "STORE_BOUND_TO_ANOTHER_BUSINESS" },
      { status: 409 }
    );
  }

  if (session) {
    try {
      await connectorFetch({
        storeUrl: session.storeUrl,
        token: session.token,
        resource: "store",
        method: "DELETE"
      });
    } catch {
      // Local disconnection must still succeed if the remote store is offline.
    }
  }

  await clearConnectorSession();
  return NextResponse.json(
    { ok: true, revokedRemote: Boolean(session) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
