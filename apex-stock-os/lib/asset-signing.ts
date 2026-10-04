import crypto from "node:crypto";

const ASSET_TOKEN_TTL_MS = 15 * 60 * 1000;
const ASSET_TOKEN_MAX_FUTURE_MS = 20 * 60 * 1000;
const MAX_SIGNED_URL_LENGTH = 4096;

function signingKey() {
  const configured =
    process.env.GLOBAL_STOCK_ASSET_SIGNING_SECRET?.trim() ||
    process.env.GLOBAL_STOCK_CONNECTOR_SECRET?.trim();

  if (configured && configured.length >= 32) {
    return crypto.createHash("sha256").update(configured).digest();
  }

  if (process.env.NODE_ENV !== "production") {
    return crypto
      .createHash("sha256")
      .update(
        "global-stock-local-development-asset-signing-secret-2026-change-in-production"
      )
      .digest();
  }

  throw new Error("ASSET_SIGNING_SECRET_NOT_CONFIGURED");
}

function signatureFor(url: string, expiresAt: number) {
  return crypto
    .createHmac("sha256", signingKey())
    .update(`${expiresAt}\n${url}`)
    .digest("base64url");
}

export function createSignedAssetPath(url: string) {
  if (!url || url.length > MAX_SIGNED_URL_LENGTH) {
    throw new Error("INVALID_ASSET_URL");
  }

  const expiresAt = Date.now() + ASSET_TOKEN_TTL_MS;
  const params = new URLSearchParams({
    url,
    expires: String(expiresAt),
    signature: signatureFor(url, expiresAt)
  });

  return `/api/store-asset?${params.toString()}`;
}

export function verifySignedAssetUrl(
  url: string,
  expiresRaw: string | null,
  signature: string | null
) {
  if (
    !url ||
    url.length > MAX_SIGNED_URL_LENGTH ||
    !expiresRaw ||
    !signature
  ) {
    return false;
  }

  const expiresAt = Number(expiresRaw);
  const now = Date.now();

  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + ASSET_TOKEN_MAX_FUTURE_MS
  ) {
    return false;
  }

  const expected = signatureFor(url, expiresAt);

  try {
    const actualBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expected, "base64url");

    return (
      actualBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}
