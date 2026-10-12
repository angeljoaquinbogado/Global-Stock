"use client";

import { MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import {
  getSupabaseBrowserClient,
  isSupabaseConfigured
} from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";
import { AuthScreen } from "./AuthScreen";
import { UnifiedLegalGate } from "./UnifiedLegalGate";

const BusinessWorkspace = dynamic(
  () =>
    import("./BusinessWorkspace").then(
      (module) => module.BusinessWorkspace
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[100dvh] place-items-center bg-[var(--apex-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--apex-border)] border-t-[#8F0000]" />
      </div>
    )
  }
);

const languageToHtml: Record<LanguageCode, string> = {
  es: "es",
  en: "en",
  pt: "pt",
  fr: "fr",
  de: "de"
};

const supportedCurrencies = [
  "ARS",
  "USD",
  "EUR",
  "BRL",
  "MXN",
  "GBP",
  "JPY"
];

const DEMO_ACTIVE_KEY = "__global_stock_demo_active_v1";
const DEMO_BACKUP_KEY = "__global_stock_demo_backup_v1";
const APP_STORAGE_PREFIX = "global-stock-";

function captureGlobalStockStorage() {
  const snapshot: Record<string, string> = {};

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(APP_STORAGE_PREFIX)) continue;
    const value = window.localStorage.getItem(key);
    if (value !== null) snapshot[key] = value;
  }

  return snapshot;
}

function clearGlobalStockStorage() {
  const keys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(APP_STORAGE_PREFIX)) keys.push(key);
  }

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function restoreGlobalStockStorage() {
  const raw = window.localStorage.getItem(DEMO_BACKUP_KEY);
  clearGlobalStockStorage();

  if (raw) {
    try {
      const snapshot = JSON.parse(raw) as Record<string, string>;
      for (const [key, value] of Object.entries(snapshot)) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // A corrupt demo backup should never block sign out.
    }
  }

  window.localStorage.removeItem(DEMO_ACTIVE_KEY);
  window.localStorage.removeItem(DEMO_BACKUP_KEY);
}

export function ApexShell() {
  const [dark, setDark] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("es");
  const [currency, setCurrency] = useState("ARS");
  const [ready, setReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [legalApprovedUserId, setLegalApprovedUserId] = useState<string | null>(null);

  useEffect(() => {
    // One-time Expo Keychain-to-WebView migration. Tokens are transferred only
    // by the native shell on the pinned, HTTPS Global Stock origin.
    const acceptSession = (event: Event) => {
      const payload = (event as CustomEvent<{
        access_token?: string; refresh_token?: string;
      }>).detail;
      if (!payload || typeof payload.access_token !== "string" ||
          typeof payload.refresh_token !== "string" ||
          payload.access_token.length > 16000 || payload.refresh_token.length > 16000) return;
      const client = getSupabaseBrowserClient();
      if (!client) return;
      void client.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token
      }).catch(() => { /* Invalid or revoked old sessions fall back to sign-in. */ });
    };
    window.addEventListener("globalstock:native-session", acceptSession);
    return () => window.removeEventListener("globalstock:native-session", acceptSession);
  }, []);

  useEffect(() => {
    let active = true;

    const storedTheme = window.localStorage.getItem("global-stock-theme");
    const storedLanguage = window.localStorage.getItem(
      "global-stock-demo-language"
    ) as LanguageCode | null;
    const storedCurrency = window.localStorage.getItem(
      "global-stock-demo-currency"
    );

    const nextDark =
      storedTheme === "light"
        ? false
        : storedTheme === "dark"
          ? true
          : window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDark(nextDark);

    if (
      storedLanguage &&
      ["es", "en", "pt", "fr", "de"].includes(storedLanguage)
    ) {
      setLanguage(storedLanguage);
    }

    if (
      storedCurrency &&
      supportedCurrencies.includes(storedCurrency)
    ) {
      setCurrency(storedCurrency);
    }

    const demoActive =
      window.localStorage.getItem(DEMO_ACTIVE_KEY) === "1";

    if (demoActive) {
      setDemoMode(true);
      setAuthenticated(true);
      setReady(true);
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      setAuthenticated(
        window.localStorage.getItem("global-stock-demo-auth") === "1"
      );
      setReady(true);
      return;
    }

    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthenticated(Boolean(data.session));
      setAuthUserId(data.session?.user.id ?? null);
      setReady(true);
    });

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthenticated(Boolean(session));
      setAuthUserId(session?.user.id ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Expo Go and PC are the same web application. Tell its native shell when
    // the authenticated/web entry has finished initializing.
    const bridge = (window as typeof window & { ReactNativeWebView?: { postMessage: (value: string) => void } }).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify({ type: "app_ready" }));
  }, [ready, authenticated]);

  useEffect(() => {
    if (!ready) return;

    document.documentElement.classList.toggle("dark", dark);

    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => {
        meta.content = dark ? "#000000" : "#F5F5F7";
      });

    window.localStorage.setItem(
      "global-stock-theme",
      dark ? "dark" : "light"
    );
    const bridge = (window as typeof window & { ReactNativeWebView?: { postMessage: (value: string) => void } }).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify({ type: "theme_changed", dark }));
  }, [dark, ready]);

  useEffect(() => {
    if (!ready) return;

    document.documentElement.lang = languageToHtml[language];
    window.localStorage.setItem(
      "global-stock-demo-language",
      language
    );
  }, [language, ready]);

  useEffect(() => {
    if (!ready) return;

    window.localStorage.setItem(
      "global-stock-demo-currency",
      currency
    );
  }, [currency, ready]);

  function handleAuthenticated(mode: "user" | "demo" = "user") {
    if (mode === "demo") {
      if (window.localStorage.getItem(DEMO_ACTIVE_KEY) !== "1") {
        window.localStorage.setItem(
          DEMO_BACKUP_KEY,
          JSON.stringify(captureGlobalStockStorage())
        );
        clearGlobalStockStorage();
        window.localStorage.setItem(DEMO_ACTIVE_KEY, "1");
      }

      setDemoMode(true);
      setAuthenticated(true);
      return;
    }

    if (!isSupabaseConfigured()) {
      window.localStorage.setItem("global-stock-demo-auth", "1");
    }

    setDemoMode(false);
    setAuthenticated(true);
    if (isSupabaseConfigured()) {
      void getSupabaseBrowserClient()?.auth.getUser().then(({ data }) => {
        setAuthUserId(data.user?.id ?? null);
      });
    }
  }

  async function handleSignOut() {
    if (demoMode) {
      restoreGlobalStockStorage();
      setDemoMode(false);
      setAuthenticated(false);
      return;
    }

    window.localStorage.removeItem("global-stock-demo-auth");

    const client = getSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
    }

    setAuthenticated(false);
    setAuthUserId(null);
    setLegalApprovedUserId(null);
    const bridge = (window as typeof window & { ReactNativeWebView?: { postMessage: (value: string) => void } }).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify({ type: "session_cleared" }));
  }

  if (!ready) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="grid min-h-[100dvh] place-items-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#8F0000]" />
        </div>
      </MotionConfig>
    );
  }

  if (!authenticated) {
    return (
      <MotionConfig reducedMotion="user">
        <AuthScreen
          dark={dark}
          language={language}
          currency={currency}
          onToggleTheme={() => setDark((value) => !value)}
          onLanguageChange={setLanguage}
          onCurrencyChange={setCurrency}
          onAuthenticated={handleAuthenticated}
        />
      </MotionConfig>
    );
  }

  if (!demoMode && isSupabaseConfigured()) {
    if (!authUserId) return (
      <div role="status" className="grid min-h-[100dvh] place-items-center bg-[#09090b] text-sm text-white/70">
        Verificando tu cuenta…
      </div>
    );
    if (legalApprovedUserId !== authUserId) {
      const client = getSupabaseBrowserClient();
      if (!client) return <p role="alert">No se pudo establecer la conexión de sesión.</p>;
      return (
        <UnifiedLegalGate client={client} userId={authUserId}
          onReady={() => setLegalApprovedUserId(authUserId)}
          onSignOut={() => void handleSignOut()} />
      );
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <BusinessWorkspace
        dark={dark}
        language={language}
        currency={currency}
        onLanguageChange={setLanguage}
        onCurrencyChange={setCurrency}
        onToggleTheme={() => setDark((value) => !value)}
        demoMode={demoMode}
        onSignOut={() => {
          void handleSignOut();
        }}
      />
    </MotionConfig>
  );
}
