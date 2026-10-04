import { NextRequest, NextResponse } from "next/server";

import {
  clearConnectorSession,
  readConnectorSession
} from "@/lib/connector-session";
import { connectorFetch } from "@/lib/remote-store";
import { authorizeBusinessRequest } from "@/lib/server-auth";
import {
  guardApiRequest,
  noStoreHeaders,
  securityErrorResponse
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await readConnectorSession();

  if (!session) {
    return NextResponse.json(
      { error: "STORE_NOT_VERIFIED" },
      { status: 401, headers: noStoreHeaders() }
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
      { status: 403, headers: noStoreHeaders() }
    );
  }

  const authorization = await authorizeBusinessRequest(
    request,
    businessId
  );
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.code },
      { status: authorization.status, headers: noStoreHeaders() }
    );
  }

  try {
    guardApiRequest(request, {
      scope: "connector-products-read",
      limit: 60,
      identity: authorization.userId
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { error: "REQUEST_BLOCKED" },
      { status: 403, headers: noStoreHeaders() }
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
        {
          status: response.status === 401 ? 401 : 502,
          headers: noStoreHeaders()
        }
      );
    }

    return NextResponse.json(payload, {
      headers: noStoreHeaders()
    });
  } catch {
    return NextResponse.json(
      { error: "REMOTE_CATALOG_UNAVAILABLE" },
      { status: 502, headers: noStoreHeaders() }
    );
  }
}
