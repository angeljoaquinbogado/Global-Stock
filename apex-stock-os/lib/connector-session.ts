import crypto from "node:crypto";
import { cookies } from "next/headers";

export type ConnectorSession = {
  businessId?: string;
  storeUrl: string;
  token: string;
  storeId: string;
  storeName: string;
  currency: string;
  platform: string;
  scopes: string[];
  verifiedAt: string;
};

const COOKIE_NAME = "global-stock-store-connection-v1";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function secretKey() {
  const configured = process.env.GLOBAL_STOCK_CONNECTOR_SECRET?.trim();

  if (configured && configured.length >= 32) {
    return crypto.createHash("sha256").update(configured).digest();
  }

  if (process.env.NODE_ENV !== "production") {
    return crypto
      .createHash("sha256")
      .update(
        "global-stock-local-development-connector-secret-2026-change-in-production"
      )
      .digest();
  }

  throw new Error("GLOBAL_STOCK_CONNECTOR_SECRET_NOT_CONFIGURED");
}

function encode(buffer: Buffer) {
  return buffer.toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url");
}

function encrypt(payload: ConnectorSession) {
  const key = secretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return ["v1", encode(iv), encode(ciphertext), encode(tag)].join(".");
}

function decrypt(value: string): ConnectorSession | null {
  try {
    const [version, ivRaw, cipherRaw, tagRaw] = value.split(".");
    if (version !== "v1" || !ivRaw || !cipherRaw || !tagRaw) {
      return null;
    }

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      secretKey(),
      decode(ivRaw)
    );
    decipher.setAuthTag(decode(tagRaw));

    const plaintext = Buffer.concat([
      decipher.update(decode(cipherRaw)),
      decipher.final()
    ]).toString("utf8");

    const parsed = JSON.parse(plaintext) as ConnectorSession;

    if (
      !parsed?.storeUrl ||
      !parsed?.token ||
      !Array.isArray(parsed.scopes)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function setConnectorSession(session: ConnectorSession) {
  const store = await cookies();
  store.set(COOKIE_NAME, encrypt(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE
  });
}

export async function readConnectorSession() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  return raw ? decrypt(raw) : null;
}

export async function clearConnectorSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });
}
