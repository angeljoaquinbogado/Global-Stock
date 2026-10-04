import { NextRequest, NextResponse } from "next/server";

import { setConnectorSession } from "@/lib/connector-session";
import {
  assertPublicStoreUrl,
  connectorFetch
} from "@/lib/remote-store";
import {
  guardApiRequest,
  noStoreHeaders,
  securityErrorResponse
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function exchangeGrant(storeOrigin: string, grant: string) {
  const origin = new URL(storeOrigin).origin;
  let current = new URL("/api/global-stock-authorize", origin);

  for (let redirect = 0; redirect <= 2; redirect += 1) {
    await assertPublicStoreUrl(current.toString());

    if (current.origin !== origin) {
      throw new Error("CROSS_ORIGIN_REDIRECT");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(current, {
        method: "POST",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "exchange",
          grant
        })
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("INVALID_REDIRECT");

        const next = new URL(location, current);
        if (next.origin !== origin) {
          throw new Error("CROSS_ORIGIN_REDIRECT");
        }

        current = next;
        continue;
      }

      const payload = (await response.json().catch(() => ({}))) as {
        verified?: boolean;
        token?: string;
      };

      if (
        !response.ok ||
        payload.verified !== true ||
        typeof payload.token !== "string" ||
        payload.token.length < 24
      ) {
        throw new Error("GRANT_EXCHANGE_FAILED");
      }

      return payload.token;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("TOO_MANY_REDIRECTS");
}

export async function GET(request: NextRequest) {
  try {
    guardApiRequest(request, {
      scope: "connector-callback",
      limit: 30,
      sameOrigin: false
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.redirect(
      new URL("/", request.nextUrl.origin),
      303
    );
  }

  const fallback = new URL("/", request.nextUrl.origin);
  fallback.searchParams.set("store_connection", "failed");

  try {
    const storeRaw = request.nextUrl.searchParams.get("store")?.trim() ?? "";
    const grant = request.nextUrl.searchParams.get("grant")?.trim() ?? "";

    if (
      !storeRaw ||
      !/^gs_grant_[A-Za-z0-9_-]{30,120}$/.test(grant)
    ) {
      return NextResponse.redirect(fallback, 303);
    }

    const storeUrl = await assertPublicStoreUrl(storeRaw);
    const token = await exchangeGrant(storeUrl.origin, grant);

    const response = await connectorFetch({
      storeUrl: storeUrl.origin,
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

    const scopes = Array.isArray(payload.scopes) ? payload.scopes : [];
    if (
      !response.ok ||
      payload.verified !== true ||
      !payload.store?.id ||
      !scopes.includes("catalog:read") ||
      !scopes.includes("inventory:read")
    ) {
      return NextResponse.redirect(fallback, 303);
    }

    await setConnectorSession({
      storeUrl: storeUrl.origin,
      token,
      storeId: String(payload.store.id),
      storeName: String(payload.store.name || storeUrl.hostname),
      currency: String(payload.store.currency || "ARS"),
      platform: String(payload.store.platform || "Connected store"),
      scopes,
      verifiedAt: new Date().toISOString()
    });

    const success = new URL("/", request.nextUrl.origin);
    success.searchParams.set("store_connection", "verified");
    return NextResponse.redirect(success, 303);
  } catch {
    return NextResponse.redirect(fallback, 303);
  }
}
