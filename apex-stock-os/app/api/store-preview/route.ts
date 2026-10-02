import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductSample = {
  name: string;
  price: string | null;
  currency: string | null;
};

function cleanText(value: string | null | undefined) {
  if (!value) return null;
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function resolvePublicAsset(
  value: string | null,
  base: URL
) {
  if (!value) return null;

  try {
    const resolved = new URL(value, base);
    if (!["http:", "https:"].includes(resolved.protocol)) {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

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

  return url;
}

async function safeFetch(
  initial: URL,
  accept: string,
  maxBytes = 2_500_000
) {
  let current = initial;

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
          Accept: accept,
          "User-Agent":
            "Mozilla/5.0 (compatible; GlobalStockStoreInspector/1.0; +https://globalstock.app)"
        }
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("INVALID_REDIRECT");
        current = new URL(location, current);
        continue;
      }

      const size = Number(response.headers.get("content-length") || 0);
      if (size > maxBytes) throw new Error("RESPONSE_TOO_LARGE");

      return { response, finalUrl: current };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("TOO_MANY_REDIRECTS");
}

function parseAttributes(tag: string) {
  const attributes = new Map<string, string>();
  for (const match of tag.matchAll(
    /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  )) {
    attributes.set(
      match[1].toLowerCase(),
      match[2] ?? match[3] ?? match[4] ?? ""
    );
  }
  return attributes;
}

function readMeta(html: string, names: string[]) {
  const wanted = new Set(names.map((item) => item.toLowerCase()));
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttributes(match[0]);
    const key = (
      attrs.get("property") ??
      attrs.get("name") ??
      ""
    ).toLowerCase();
    if (wanted.has(key)) return cleanText(attrs.get("content"));
  }
  return null;
}

function readLink(html: string, relName: string) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = parseAttributes(match[0]);
    const rel = (attrs.get("rel") ?? "").toLowerCase();
    if (rel.split(/\s+/).includes(relName.toLowerCase())) {
      return attrs.get("href") ?? null;
    }
  }
  return null;
}

function detectPlatform(html: string, url: URL) {
  const haystack = `${url.hostname}\n${html.slice(0, 750_000)}`.toLowerCase();

  if (
    haystack.includes("cdn.shopify.com") ||
    haystack.includes("shopify.theme") ||
    haystack.includes("shopify-section")
  ) {
    return "Shopify";
  }

  if (
    haystack.includes("tiendanube") ||
    haystack.includes("nuvemshop") ||
    haystack.includes("nuvem.com")
  ) {
    return "Tiendanube";
  }

  if (
    haystack.includes("woocommerce") ||
    haystack.includes("wc-block") ||
    haystack.includes("wp-content/plugins/woocommerce")
  ) {
    return "WooCommerce";
  }

  if (
    url.hostname.includes("mercadolibre.") ||
    url.hostname.includes("mercadolivre.")
  ) {
    return "Mercado Libre";
  }

  return "Sitio web";
}

function walkJsonLd(node: unknown, output: ProductSample[]) {
  if (!node || output.length >= 12) return;

  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, output);
    return;
  }

  if (typeof node !== "object") return;
  const object = node as Record<string, unknown>;
  const rawType = object["@type"];
  const types = Array.isArray(rawType) ? rawType : [rawType];

  if (types.some((type) => String(type).toLowerCase() === "product")) {
    const offers = Array.isArray(object.offers)
      ? object.offers[0]
      : object.offers;
    const offer =
      offers && typeof offers === "object"
        ? (offers as Record<string, unknown>)
        : {};

    output.push({
      name: cleanText(String(object.name ?? "")) ?? "Producto",
      price:
        offer.price !== undefined && offer.price !== null
          ? String(offer.price)
          : null,
      currency:
        offer.priceCurrency !== undefined && offer.priceCurrency !== null
          ? String(offer.priceCurrency)
          : null
    });
  }

  if (object["@graph"]) walkJsonLd(object["@graph"], output);

  for (const value of Object.values(object)) {
    if (value !== object["@graph"] && typeof value === "object") {
      walkJsonLd(value, output);
    }
  }
}

function extractJsonLdProducts(html: string) {
  const output: ProductSample[] = [];

  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const parsed = JSON.parse(match[1]);
      walkJsonLd(parsed, output);
    } catch {
      // Ignore malformed structured data from the storefront.
    }

    if (output.length >= 12) break;
  }

  return output;
}

async function inspectShopify(base: URL) {
  const url = new URL("/products.json?limit=50", base);
  try {
    const { response } = await safeFetch(
      url,
      "application/json,text/plain;q=0.9,*/*;q=0.5",
      2_500_000
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      products?: Array<{
        title?: string;
        variants?: Array<{ price?: string }>;
      }>;
    };

    const products = Array.isArray(payload.products)
      ? payload.products
      : [];

    return {
      productCount: products.length,
      samples: products.slice(0, 12).map((product) => ({
        name: cleanText(product.title) ?? "Producto",
        price: product.variants?.[0]?.price ?? null,
        currency: null
      }))
    };
  } catch {
    return null;
  }
}

async function inspectWooCommerce(base: URL) {
  const url = new URL("/wp-json/wc/store/v1/products?per_page=20", base);
  try {
    const { response } = await safeFetch(
      url,
      "application/json,text/plain;q=0.9,*/*;q=0.5",
      2_500_000
    );
    if (!response.ok) return null;

    const products = (await response.json()) as Array<{
      name?: string;
      prices?: { price?: string; currency_code?: string; currency_minor_unit?: number };
    }>;

    if (!Array.isArray(products)) return null;

    return {
      productCount: products.length,
      samples: products.slice(0, 12).map((product) => {
        const minor = product.prices?.currency_minor_unit ?? 2;
        const raw = Number(product.prices?.price);
        return {
          name: cleanText(product.name) ?? "Producto",
          price: Number.isFinite(raw)
            ? String(raw / Math.pow(10, minor))
            : null,
          currency: product.prices?.currency_code ?? null
        };
      })
    };
  } catch {
    return null;
  }
}

function normalizeCatalogProduct(
  product: Record<string, unknown>
): ProductSample {
  const variants = Array.isArray(product.variants)
    ? (product.variants as Array<Record<string, unknown>>)
    : [];

  const firstVariant = variants[0];
  const rawPrice =
    product.price ??
    firstVariant?.price ??
    product.sale_price ??
    product.regular_price ??
    null;

  const rawCurrency =
    product.currency ??
    product.currency_code ??
    (product.prices &&
    typeof product.prices === "object" &&
    !Array.isArray(product.prices)
      ? (product.prices as Record<string, unknown>).currency_code
      : null);

  return {
    name:
      cleanText(
        String(
          product.name ??
            product.title ??
            product.product_name ??
            "Producto"
        )
      ) ?? "Producto",
    price:
      rawPrice === null || rawPrice === undefined
        ? null
        : String(rawPrice),
    currency:
      rawCurrency === null || rawCurrency === undefined
        ? null
        : String(rawCurrency)
  };
}

async function inspectGenericCatalog(base: URL) {
  const candidates = [
    "/products.json?limit=50",
    "/api/products",
    "/api/catalog",
    "/api/store/products"
  ];

  for (const path of candidates) {
    try {
      const { response } = await safeFetch(
        new URL(path, base),
        "application/json,text/plain;q=0.9,*/*;q=0.5",
        2_500_000
      );

      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") ?? "";
      if (
        !contentType.includes("json") &&
        !contentType.includes("text/plain")
      ) {
        continue;
      }

      const payload = (await response.json()) as unknown;
      let products: Array<Record<string, unknown>> = [];

      if (Array.isArray(payload)) {
        products = payload.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item)
        );
      } else if (payload && typeof payload === "object") {
        const object = payload as Record<string, unknown>;
        const candidate =
          object.products ??
          object.items ??
          object.data ??
          object.catalog;

        if (Array.isArray(candidate)) {
          products = candidate.filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) &&
              typeof item === "object" &&
              !Array.isArray(item)
          );
        }
      }

      if (!products.length) continue;

      return {
        productCount: products.length,
        samples: products.slice(0, 12).map(normalizeCatalogProduct)
      };
    } catch {
      // Try the next common public storefront endpoint.
    }
  }

  return null;
}

async function inspectTiendanube(base: URL) {
  const url = new URL("/products.json?limit=50", base);
  try {
    const { response } = await safeFetch(
      url,
      "application/json,text/plain;q=0.9,*/*;q=0.5",
      2_500_000
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as
      | Array<{ name?: string; price?: string; currency?: string }>
      | { products?: Array<{ name?: string; price?: string; currency?: string }> };

    const products = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.products)
        ? payload.products
        : [];

    return {
      productCount: products.length,
      samples: products.slice(0, 12).map((product) => ({
        name: cleanText(product.name) ?? "Producto",
        price: product.price ?? null,
        currency: product.currency ?? null
      }))
    };
  } catch {
    return null;
  }
}

async function detectGlobalStockConnector(base: URL) {
  const unavailable = {
    available: false,
    authorizationPath: null as string | null
  };

  try {
    const endpoint = new URL(
      "/api/global-stock-connector?resource=store",
      base.origin
    );
    const { response, finalUrl } = await safeFetch(
      endpoint,
      "application/json",
      100_000
    );

    const baseHost = base.hostname.toLowerCase().replace(/^www\./, "");
    const finalHost = finalUrl.hostname.toLowerCase().replace(/^www\./, "");

    if (baseHost !== finalHost) return unavailable;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return unavailable;

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      verified?: boolean;
    };

    const recognized =
      (response.status === 401 &&
        payload.error === "INVALID_INTEGRATION_TOKEN") ||
      payload.verified === true;

    if (!recognized) return unavailable;

    return {
      available: true,
      authorizationPath: "/admin.html"
    };
  } catch {
    return unavailable;
  }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim();

  if (!raw) {
    return NextResponse.json(
      { error: "MISSING_URL" },
      { status: 400 }
    );
  }

  let normalized = raw;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const initial = await assertPublicUrl(normalized);
    const { response, finalUrl } = await safeFetch(
      initial,
      "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5"
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "STORE_UNREACHABLE",
          status: response.status
        },
        { status: 422 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "NOT_HTML" },
        { status: 422 }
      );
    }

    const html = (await response.text()).slice(0, 2_500_000);
    const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const title =
      readMeta(html, ["og:site_name", "og:title", "twitter:title"]) ??
      cleanText(titleMatch?.[1]) ??
      finalUrl.hostname;
    const description =
      readMeta(html, ["og:description", "description", "twitter:description"]);
    const platform = detectPlatform(html, finalUrl);
    const imageRaw = readMeta(html, ["og:image", "twitter:image"]);
    const iconRaw =
      readLink(html, "icon") ??
      readLink(html, "shortcut") ??
      "/favicon.ico";

    let catalog:
      | { productCount: number; samples: ProductSample[] }
      | null = null;

    if (platform === "Shopify") {
      catalog = await inspectShopify(finalUrl);
    } else if (platform === "WooCommerce") {
      catalog = await inspectWooCommerce(finalUrl);
    } else if (platform === "Tiendanube") {
      catalog = await inspectTiendanube(finalUrl);
    }

    if (!catalog) {
      catalog = await inspectGenericCatalog(finalUrl);
    }

    const structuredProducts = extractJsonLdProducts(html);
    if (!catalog && structuredProducts.length) {
      catalog = {
        productCount: structuredProducts.length,
        samples: structuredProducts
      };
    }

    const sampleCurrency =
      catalog?.samples.find((item) => item.currency)?.currency ??
      readMeta(html, ["product:price:currency", "og:price:currency"]);

    const connector = await detectGlobalStockConnector(finalUrl);

    return NextResponse.json({
      reachable: true,
      url: finalUrl.toString(),
      domain: finalUrl.hostname,
      title,
      description,
      platform,
      image: resolvePublicAsset(imageRaw, finalUrl),
      icon: resolvePublicAsset(iconRaw, finalUrl),
      currency: sampleCurrency ?? null,
      productCount: catalog?.productCount ?? null,
      sampleProducts: catalog?.samples ?? structuredProducts,
      inspectedAt: new Date().toISOString(),
      publicDataOnly: true,
      connector
    });
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "INSPECTION_FAILED";

    return NextResponse.json(
      { error: code },
      { status: code === "PRIVATE_HOST" ? 400 : 422 }
    );
  }
}
