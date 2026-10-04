import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { NextRequest, NextResponse } from "next/server";

import { verifySignedAssetUrl } from "@/lib/asset-signing";
import {
  guardApiRequest,
  noStoreHeaders,
  securityErrorResponse
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 2_500_000;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon"
]);

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:172.")
  );
}

async function assertPublicUrl(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("UNSUPPORTED_PROTOCOL");
  }

  if (url.username || url.password) {
    throw new Error("URL_CREDENTIALS_NOT_ALLOWED");
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("HTTPS_REQUIRED");
  }

  if (
    process.env.NODE_ENV === "production" &&
    url.port &&
    url.port !== "443"
  ) {
    throw new Error("NON_STANDARD_PORT");
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("PRIVATE_HOST");
  }

  const directIp = isIP(host);

  if (process.env.NODE_ENV === "production" && directIp) {
    throw new Error("DIRECT_IP_NOT_ALLOWED");
  }

  if (directIp === 4 && isPrivateIpv4(host)) {
    throw new Error("PRIVATE_HOST");
  }

  if (directIp === 6 && isPrivateIpv6(host)) {
    throw new Error("PRIVATE_HOST");
  }

  if (!directIp) {
    const addresses = await lookup(host, { all: true, verbatim: true });

    if (!addresses.length) throw new Error("HOST_NOT_FOUND");

    for (const item of addresses) {
      if (
        (item.family === 4 && isPrivateIpv4(item.address)) ||
        (item.family === 6 && isPrivateIpv6(item.address))
      ) {
        throw new Error("PRIVATE_HOST");
      }
    }
  }

  return url;
}

export async function GET(request: NextRequest) {
  try {
    guardApiRequest(request, {
      scope: "store-asset",
      limit: 120
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { error: "REQUEST_BLOCKED" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  const raw = request.nextUrl.searchParams.get("url")?.trim();

  if (!raw) {
    return NextResponse.json({ error: "MISSING_URL" }, { status: 400 });
  }

  const expires = request.nextUrl.searchParams.get("expires");
  const signature = request.nextUrl.searchParams.get("signature");

  if (!verifySignedAssetUrl(raw, expires, signature)) {
    return NextResponse.json(
      { error: "INVALID_ASSET_TOKEN" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  let current: URL;

  try {
    current = await assertPublicUrl(raw);
  } catch {
    return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
  }

  try {
    for (let redirect = 0; redirect <= 3; redirect += 1) {
      await assertPublicUrl(current.toString());

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(current, {
          redirect: "manual",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept:
              "image/avif,image/webp,image/png,image/jpeg,image/gif,image/x-icon,*/*;q=0.5",
            "User-Agent":
              "Mozilla/5.0 (compatible; GlobalStockStoreInspector/1.0; +https://globalstock.app)",
            Referer: current.origin + "/"
          }
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (!location) {
            return NextResponse.json(
              { error: "INVALID_REDIRECT" },
              { status: 422 }
            );
          }

          current = new URL(location, current);
          continue;
        }

        if (!response.ok) {
          return NextResponse.json(
            { error: "ASSET_UNREACHABLE" },
            { status: 422 }
          );
        }

        const contentType = (
          response.headers.get("content-type") ?? ""
        )
          .split(";")[0]
          .trim()
          .toLowerCase();

        if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
          return NextResponse.json(
            { error: "NOT_SUPPORTED_IMAGE" },
            { status: 415 }
          );
        }

        const contentLength = Number(
          response.headers.get("content-length") || 0
        );

        if (contentLength > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { error: "IMAGE_TOO_LARGE" },
            { status: 413 }
          );
        }

        const bytes = await response.arrayBuffer();

        if (bytes.byteLength > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { error: "IMAGE_TOO_LARGE" },
            { status: 413 }
          );
        }

        return new NextResponse(bytes, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "X-Content-Type-Options": "nosniff"
          }
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    return NextResponse.json(
      { error: "TOO_MANY_REDIRECTS" },
      { status: 422 }
    );
  } catch {
    return NextResponse.json(
      { error: "ASSET_FETCH_FAILED" },
      { status: 422 }
    );
  }
}