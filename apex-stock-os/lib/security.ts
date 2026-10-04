import { NextResponse } from "next/server";

type RateBucket = {
  count: number;
  resetAt: number;
};

type SecurityGlobal = typeof globalThis & {
  __globalStockRateBuckets?: Map<string, RateBucket>;
};

const securityGlobal = globalThis as SecurityGlobal;
const rateBuckets =
  securityGlobal.__globalStockRateBuckets ??
  (securityGlobal.__globalStockRateBuckets = new Map<string, RateBucket>());

const MAX_RATE_BUCKETS = 12_000;

export class ApiSecurityError extends Error {
  status: number;
  code: string;
  retryAfter?: number;

  constructor(
    code: string,
    status: number,
    message = code,
    retryAfter?: number
  ) {
    super(message);
    this.name = "ApiSecurityError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function requestOrigin(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

export function assertSameOriginRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();

  if (fetchSite === "cross-site") {
    throw new ApiSecurityError("CROSS_SITE_REQUEST_BLOCKED", 403);
  }

  const origin = request.headers.get("origin")?.trim();
  const expected = requestOrigin(request);

  if (origin && expected && origin !== expected) {
    throw new ApiSecurityError("ORIGIN_MISMATCH", 403);
  }
}

function clientIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const vercelForwarded = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return (vercelForwarded || forwarded || realIp || "unknown").slice(0, 128);
}

function pruneRateBuckets(now: number) {
  if (rateBuckets.size < MAX_RATE_BUCKETS) return;

  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }

  if (rateBuckets.size <= MAX_RATE_BUCKETS) return;

  const overflow = rateBuckets.size - MAX_RATE_BUCKETS;
  let removed = 0;
  for (const key of rateBuckets.keys()) {
    rateBuckets.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
}

export function enforceRateLimit(
  request: Request,
  {
    scope,
    limit,
    windowMs,
    identity
  }: {
    scope: string;
    limit: number;
    windowMs: number;
    identity?: string;
  }
) {
  const now = Date.now();
  pruneRateBuckets(now);

  const actor = (identity || clientIdentity(request)).slice(0, 160);
  const key = `${scope}:${actor}`;
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    );
    throw new ApiSecurityError(
      "RATE_LIMITED",
      429,
      "Too many requests.",
      retryAfter
    );
  }

  current.count += 1;
}

export function guardApiRequest(
  request: Request,
  options: {
    scope: string;
    limit: number;
    windowMs?: number;
    identity?: string;
    sameOrigin?: boolean;
  }
) {
  if (options.sameOrigin !== false) {
    assertSameOriginRequest(request);
  }

  enforceRateLimit(request, {
    scope: options.scope,
    limit: options.limit,
    windowMs: options.windowMs ?? 60_000,
    identity: options.identity
  });
}

export async function readJsonBody<T>(
  request: Request,
  maxBytes: number
): Promise<T> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new ApiSecurityError("UNSUPPORTED_CONTENT_TYPE", 415);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > 0 &&
    declaredLength > maxBytes
  ) {
    throw new ApiSecurityError("REQUEST_TOO_LARGE", 413);
  }

  const body = request.body;
  if (!body) {
    throw new ApiSecurityError("INVALID_JSON", 400);
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel("REQUEST_TOO_LARGE").catch(() => {});
        throw new ApiSecurityError("REQUEST_TOO_LARGE", 413);
      }

      raw += decoder.decode(value, { stream: true });
    }

    raw += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  if (!raw.trim()) {
    throw new ApiSecurityError("INVALID_JSON", 400);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiSecurityError("INVALID_JSON", 400);
  }
}

export function securityErrorResponse(error: unknown) {
  if (!(error instanceof ApiSecurityError)) return null;

  const headers: Record<string, string> = {
    "Cache-Control": "no-store"
  };

  if (error.retryAfter) {
    headers["Retry-After"] = String(error.retryAfter);
  }

  return NextResponse.json(
    { code: error.code },
    {
      status: error.status,
      headers
    }
  );
}

export function noStoreHeaders() {
  return {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    Expires: "0"
  };
}
