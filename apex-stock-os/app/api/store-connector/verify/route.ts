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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyPayload = {
  url?: string;
  token?: string;
};

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
        verifiedAt
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

export async function GET() {
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
        verifiedAt: session.verifiedAt
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

export async function DELETE() {
  const session = await readConnectorSession();

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
