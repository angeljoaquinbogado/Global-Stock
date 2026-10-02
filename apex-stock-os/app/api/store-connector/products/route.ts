import { NextRequest, NextResponse } from "next/server";

import {
  clearConnectorSession,
  readConnectorSession
} from "@/lib/connector-session";
import { connectorFetch } from "@/lib/remote-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await readConnectorSession();

  if (!session) {
    return NextResponse.json(
      { error: "STORE_NOT_VERIFIED" },
      { status: 401 }
    );
  }

  const businessId =
    request.nextUrl.searchParams.get("businessId")?.trim() ?? "";

  if (
    !businessId ||
    !session.businessId ||
    session.businessId !== businessId
  ) {
    return NextResponse.json(
      { error: "STORE_BUSINESS_MISMATCH" },
      { status: 403 }
    );
  }

  try {
    const response = await connectorFetch({
      storeUrl: session.storeUrl,
      token: session.token,
      resource: "products"
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      await clearConnectorSession();
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "REMOTE_CATALOG_ERROR",
          remoteStatus: response.status
        },
        { status: response.status === 401 ? 401 : 502 }
      );
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json(
      { error: "REMOTE_CATALOG_UNAVAILABLE" },
      { status: 502 }
    );
  }
}
