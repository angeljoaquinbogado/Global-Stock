import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { secureSessionStorage } from "./secure-session";

/**
 * Expo Go can retrieve the public Supabase client configuration from the
 * existing Global Stock web app. The Expo bundle never contains private keys.
 * A local .env can override this for independent development.
 */
const EXPECTED_SUPABASE_HOST = "yckimhbtvijmmkxukxgd.supabase.co";
const WEB_PUBLIC_CONFIG_ENDPOINT = "https://globalstocks.vercel.app/api/mobile-config";
let clientPromise: Promise<SupabaseClient> | null = null;

type PublicConfig = { supabaseUrl: string; supabasePublishableKey: string };

function validateConfig(config: PublicConfig) {
  const url = new URL(config.supabaseUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname !== EXPECTED_SUPABASE_HOST ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "")
  ) throw new Error("El servidor Supabase de Global Stock no coincide.");

  const key = config.supabasePublishableKey;
  if (!key || !(key.startsWith("sb_publishable_") || (key.startsWith("eyJ") && key.length > 100))) {
    throw new Error("La configuración pública de Supabase no es válida.");
  }
}

async function fetchPublicConfig(): Promise<PublicConfig> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(WEB_PUBLIC_CONFIG_ENDPOINT, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`El servidor todavía no publicó la conexión móvil (HTTP ${response.status}).`);
    const data = (await response.json()) as Partial<PublicConfig>;
    if (typeof data.supabaseUrl !== "string" || typeof data.supabasePublishableKey !== "string") {
      throw new Error("El servidor devolvió una configuración incompleta.");
    }
    return data as PublicConfig;
  } finally {
    clearTimeout(timeout);
  }
}

export function loadMobileSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const config: PublicConfig =
        envUrl && envKey
          ? { supabaseUrl: envUrl, supabasePublishableKey: envKey }
          : await fetchPublicConfig();

      validateConfig(config);
      return createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: {
          storage: secureSessionStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      });
    })().catch((error: unknown) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}
