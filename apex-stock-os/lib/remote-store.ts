import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

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
  const value = address.toLowerCase();
  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb") ||
    value.startsWith("::ffff:127.") ||
    value.startsWith("::ffff:10.") ||
    value.startsWith("::ffff:192.168.") ||
    value.startsWith("::ffff:172.")
  );
}

export async function assertPublicStoreUrl(raw: string) {
  let normalized = raw.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  const url = new URL(normalized);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("UNSUPPORTED_PROTOCOL");
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

  url.username = "";
  url.password = "";
  url.hash = "";
  return url;
}

export async function connectorFetch({
  storeUrl,
  token,
  resource,
  method = "GET",
  body
}: {
  storeUrl: string;
  token: string;
  resource: "store" | "products" | "product";
  method?: "GET" | "PATCH" | "DELETE";
  body?: unknown;
}) {
  const store = await assertPublicStoreUrl(storeUrl);
  const origin = store.origin;
  let current = new URL(
    `/api/global-stock-connector?resource=${encodeURIComponent(resource)}`,
    origin
  );

  for (let redirect = 0; redirect <= 2; redirect += 1) {
    await assertPublicStoreUrl(current.toString());

    if (current.origin !== origin) {
      throw new Error("CROSS_ORIGIN_REDIRECT");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(current, {
        method,
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
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

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("TOO_MANY_REDIRECTS");
}
