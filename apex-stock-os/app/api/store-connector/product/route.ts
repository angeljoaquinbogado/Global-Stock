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
  readJsonBody,
  securityErrorResponse
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = new Set([
  "externalId",
  "stock",
  "price",
  "cost",
  "minStock",
  "supplier",
  "barcode"
]);

function safeNumber(
  value: unknown,
  {
    nullable = false,
    integer = false
  }: { nullable?: boolean; integer?: boolean } = {}
) {
  if (nullable && value === null) return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000_000_000) {
    throw new Error("INVALID_NUMBER");
  }

  return integer ? Math.round(parsed) : parsed;
}

function safeText(value: unknown, max = 300) {
  if (typeof value !== "string") throw new Error("INVALID_TEXT");
  return value.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, max);
}

export async function PATCH(request: NextRequest) {
  const session = await readConnectorSession();

  if (!session) {
    return NextResponse.json(
      { error: "STORE_NOT_VERIFIED" },
      { status: 401, headers: noStoreHeaders() }
    );
  }

  if (!session.scopes.includes("inventory:write")) {
    return NextResponse.json(
      { error: "MISSING_WRITE_SCOPE" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody<Record<string, unknown>>(request, 24_000);
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  const businessId =
    typeof body.businessId === "string" ? body.businessId.trim() : "";

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
      scope: "connector-product-write",
      limit: 120,
      identity: authorization.userId
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { error: "REQUEST_BLOCKED" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  for (const key of Object.keys(body)) {
    if (key !== "businessId" && !ALLOWED_FIELDS.has(key)) {
      return NextResponse.json(
        { error: "UNSUPPORTED_FIELD" },
        { status: 400, headers: noStoreHeaders() }
      );
    }
  }

  let remoteBody: Record<string, unknown>;

  try {
    const externalId = safeText(body.externalId, 240);
    if (!externalId) throw new Error("INVALID_EXTERNAL_ID");

    remoteBody = { externalId };

    if ("stock" in body) remoteBody.stock = safeNumber(body.stock);
    if ("price" in body) remoteBody.price = safeNumber(body.price);
    if ("cost" in body) {
      remoteBody.cost = safeNumber(body.cost, { nullable: true });
    }
    if ("minStock" in body) {
      remoteBody.minStock = safeNumber(body.minStock, { integer: true });
    }
    if ("supplier" in body) {
      remoteBody.supplier = safeText(body.supplier, 220);
    }
    if ("barcode" in body) {
      remoteBody.barcode = safeText(body.barcode, 100);
    }
  } catch {
    return NextResponse.json(
      { error: "INVALID_PRODUCT_PATCH" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  try {
    const response = await connectorFetch({
      storeUrl: session.storeUrl,
      token: session.token,
      resource: "product",
      method: "PATCH",
      body: remoteBody
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      await clearConnectorSession();
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "REMOTE_UPDATE_ERROR",
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
      { error: "REMOTE_UPDATE_UNAVAILABLE" },
      { status: 502, headers: noStoreHeaders() }
    );
  }
}
