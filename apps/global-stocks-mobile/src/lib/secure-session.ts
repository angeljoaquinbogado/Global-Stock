import * as SecureStore from "expo-secure-store";
import type { SupportedStorage } from "@supabase/supabase-js";

/**
 * Encrypted Supabase session storage. SecureStore values are split into small
 * chunks for devices with older iOS Keychain size limits.
 * A new set is written before the manifest is replaced.
 */
const PREFIX = "gs.mobile.auth.";
const CHUNK_SIZE = 1400;
const MAX_CHUNKS = 64;

function slot(key: string) {
  // Supabase emits a fixed known storage key; normalise it for SecureStore.
  return PREFIX + key.replace(/[^A-Za-z0-9._-]/g, "_");
}

async function clearChunks(base: string, count: number, version: string) {
  await Promise.all(
    Array.from({ length: count }, (_, i) =>
      SecureStore.deleteItemAsync(`${base}.${version}.${i}`)
    )
  );
}

type Manifest = { v: string; count: number };
async function readManifest(base: string): Promise<Manifest | null> {
  const raw = await SecureStore.getItemAsync(base);
  if (!raw) return null;
  try {
    const m = JSON.parse(raw) as Manifest;
    if (typeof m.v !== "string" || !Number.isInteger(m.count) || m.count < 0 || m.count > MAX_CHUNKS) return null;
    return m;
  } catch {
    return null;
  }
}

export const secureSessionStorage: SupportedStorage = {
  getItem: async (key) => {
    const base = slot(key);
    const manifest = await readManifest(base);
    if (!manifest) return null;
    const pieces = await Promise.all(
      Array.from({ length: manifest.count }, (_, i) =>
        SecureStore.getItemAsync(`${base}.${manifest.v}.${i}`)
      )
    );
    return pieces.some((piece) => piece == null) ? null : pieces.join("");
  },
  setItem: async (key, value) => {
    const base = slot(key);
    const prior = await readManifest(base);
    const pieces = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "gs")) ?? [""];
    if (pieces.length > MAX_CHUNKS) throw new Error("Session too large for secure storage");
    const version = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    for (let i = 0; i < pieces.length; i += 1) {
      await SecureStore.setItemAsync(`${base}.${version}.${i}`, pieces[i]);
    }
    await SecureStore.setItemAsync(base, JSON.stringify({ v: version, count: pieces.length }));
    if (prior) await clearChunks(base, prior.count, prior.v);
  },
  removeItem: async (key) => {
    const base = slot(key);
    const prior = await readManifest(base);
    await SecureStore.deleteItemAsync(base);
    if (prior) await clearChunks(base, prior.count, prior.v);
  }
};
