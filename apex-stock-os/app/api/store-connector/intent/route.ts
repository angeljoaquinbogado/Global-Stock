import { NextResponse } from "next/server";

import { setConnectorIntent } from "@/lib/connector-session";
import { assertPublicStoreUrl } from "@/lib/remote-store";
import { authorizeApiRequest } from "@/lib/server-auth";
import {
  guardApiRequest,
  noStoreHeaders,
  readJsonBody,
  securityErrorResponse
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IntentPayload = {
  storeUrl?: string;
};

export async function POST(request: Request) {
  try {
    guardApiRequest(request, {
      scope: "connector-intent-ip",
      limit: 20
    });
  } catch (error) {
    return (
      securityErrorResponse(error) ??
      NextResponse.json(
        { error: "REQUEST_BLOCKED" },
        { status: 403, headers: noStoreHeaders() }
      )
    );
  }

  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.code },
      { status: authorization.status, headers: noStoreHeaders() }
    );
  }

  try {
    guardApiRequest(request, {
      scope: "connector-intent-user",
      limit: 10,
      identity: authorization.userId
    });
  } catch (error) {
    return (
      securityErrorResponse(error) ??
      NextResponse.json(
        { error: "REQUEST_BLOCKED" },
        { status: 403, headers: noStoreHeaders() }
      )
    );
  }

  let body: IntentPayload;
  try {
    body = await readJsonBody<IntentPayload>(request, 4_000);
  } catch (error) {
    return (
      securityErrorResponse(error) ??
      NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400, headers: noStoreHeaders() }
      )
    );
  }

  const storeRaw = body.storeUrl?.trim() ?? "";
  if (!storeRaw || storeRaw.length > 2_000) {
    return NextResponse.json(
      { error: "INVALID_STORE" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  try {
    const storeUrl = await assertPublicStoreUrl(storeRaw);
    await setConnectorIntent(storeUrl.origin);

    return NextResponse.json(
      { ok: true, storeOrigin: storeUrl.origin },
      { headers: noStoreHeaders() }
    );
  } catch {
    return NextResponse.json(
      { error: "INVALID_STORE" },
      { status: 400, headers: noStoreHeaders() }
    );
  }
}