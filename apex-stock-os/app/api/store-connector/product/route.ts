import { NextRequest, NextResponse } from "next/server";

import { clearConnectorSession, readConnectorSession } from "@/lib/connector-session";
import { connectorFetch } from "@/lib/remote-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const session = await readConnectorSession();

  if (!session) {
    return NextResponse.json(
      { error: "STORE_NOT_VERIFIED" },
      { status: 401 }
    );
  }

  if (!session.scopes.includes("inventory:write")) {
    return NextResponse.json(
      { error: "MISSING_WRITE_SCOPE" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  try {
    const response = await connectorFetch({
      storeUrl: session.storeUrl,
      token: session.token,
      resource: "product",
      method: "PATCH",
      body
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      await clearConnectorSession();
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "REMOTE_UPDATE_ERROR",
          remoteStatus: response.status,
          detail:
            typeof payload === "object" && payload && "error" in payload
              ? String((payload as { error?: unknown }).error ?? "")
              : ""
        },
        { status: response.status === 401 ? 401 : response.status }
      );
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json(
      { error: "REMOTE_UPDATE_UNAVAILABLE" },
      { status: 502 }
    );
  }
}
