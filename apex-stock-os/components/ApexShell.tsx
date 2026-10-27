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
import { BusinessOnboardingGate } from "./BusinessOnboardingGate";
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
  const [dark, setDark] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("es");
  const [currency, setCurrency] = useState("ARS");
  const [ready, setReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [legalApprovedUserId, setLegalApprovedUserId] = useState<string | null>(null);
  const [onboardedUserId, setOnboardedUserId] = useState<string | null>(null);
  const [hackathonPaymentNotice, setHackathonPaymentNotice] = useState("");
  const [hackathonDemo, setHackathonDemo] = useState(false);
  const [paypalSandboxConfigured, setPaypalSandboxConfigured] = useState(false);
  const [paypalSandboxBusy, setPaypalSandboxBusy] = useState(false);
  const [paypalSandboxError, setPaypalSandboxError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("paypal");
    const orderId = params.get("token");
    setHackathonDemo(params.get("hackathon-demo") === "1");
    if (params.get("hackathon-demo") === "1") {
      void fetch("/api/paypal/sandbox/orders", { cache: "no-store" })
        .then(response => response.ok ? response.json() : null)
        .then(data => setPaypalSandboxConfigured(data?.configured === true))
        .catch(() => setPaypalSandboxConfigured(false));
    }
    if (status === "cancelled") {
      setHackathonPaymentNotice("Compra de prueba cancelada. No se realizó ningún cobro real.");
      window.history.replaceState({}, "", "/?hackathon-demo=1");
      return;
    }
    if (status !== "success" || !orderId) return;
    let active = true;
    setHackathonPaymentNotice("Confirmando el resultado de PayPal Sandbox…");
    void fetch("/api/paypal/sandbox/orders/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId })
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error("capture-failed");
      if (active) setHackathonPaymentNotice(`Pago de prueba confirmado en PayPal Sandbox: ${data.currency} ${data.amount}. ID: ${data.id}`);
    }).catch(() => {
      if (active) setHackathonPaymentNotice("No se pudo confirmar el resultado en Sandbox. Revisá el estado del pedido antes de volver a intentar.");
    }).finally(() => {
      window.history.replaceState({}, "", "/?hackathon-demo=1");
    });
    return () => { active = false; };
  }, []);

  async function startHackathonSandboxCheckout() {
    if (paypalSandboxBusy || !paypalSandboxConfigured) return;
    setPaypalSandboxBusy(true);
    setPaypalSandboxError("");
    try {
      const response = await fetch("/api/paypal/sandbox/orders", { method: "POST" });
      const data = await response.json();
      if (!response.ok || typeof data.approvalUrl !== "string" ||
          !data.approvalUrl.startsWith("https://www.sandbox.paypal.com/")) {
        throw new Error("sandbox-unavailable");
      }
      window.location.assign(data.approvalUrl);
    } catch {
      setPaypalSandboxError("PayPal Sandbox no está disponible. No se realizó ningún cobro.");
      setPaypalSandboxBusy(false);
    }
  }

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

    // Migrate the old automatic dark default once. Explicit choices made
    // after this migration continue to persist normally across reloads.
    const themeDefaultKey = "global-stock-default-light-v1";
    if (!window.localStorage.getItem(themeDefaultKey)) {
      window.localStorage.setItem("global-stock-theme", "light");
      window.localStorage.setItem(themeDefaultKey, "1");
    }
    const storedTheme = window.localStorage.getItem("global-stock-theme");
    const storedLanguage = window.localStorage.getItem(
      "global-stock-demo-language"
    ) as LanguageCode | null;
    const storedCurrency = window.localStorage.getItem(
      "global-stock-demo-currency"
    );

    const nextDark = storedTheme === "dark";

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

    const requestedHackathonDemo = new URLSearchParams(window.location.search).get("hackathon-demo") === "1";
    const demoActive =
      window.localStorage.getItem(DEMO_ACTIVE_KEY) === "1";

    if (requestedHackathonDemo && !demoActive) {
      window.localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(captureGlobalStockStorage()));
      clearGlobalStockStorage();
      window.localStorage.setItem(DEMO_ACTIVE_KEY, "1");
      setDemoMode(true);
      setAuthenticated(true);
      setReady(true);
      if (!new URLSearchParams(window.location.search).has("paypal")) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }

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
    setOnboardedUserId(null);
    const bridge = (window as typeof window & { ReactNativeWebView?: { postMessage: (value: string) => void } }).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify({ type: "session_cleared" }));
  }

  if (!ready) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="grid min-h-[100dvh] place-items-center bg-[#F5F5F7]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D8D8E0] border-t-[#8F0000]" />
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
    const client = getSupabaseBrowserClient();
    if (!client) return <p role="alert">No se pudo establecer la conexión de sesión.</p>;
    if (onboardedUserId !== authUserId) {
      return (
        <BusinessOnboardingGate client={client} userId={authUserId}
          dark={dark} language={language} currency={currency}
          onToggleTheme={() => setDark(value => !value)}
          onReady={(legalAccepted) => {
            setOnboardedUserId(authUserId);
            if (legalAccepted) setLegalApprovedUserId(authUserId);
          }}
          onSignOut={() => void handleSignOut()} />
      );
    }
    if (legalApprovedUserId !== authUserId) {
      return (
        <UnifiedLegalGate client={client} userId={authUserId}
          onReady={() => setLegalApprovedUserId(authUserId)}
          onSignOut={() => void handleSignOut()} />
      );
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      {hackathonDemo && <div className={`fixed bottom-4 left-4 z-[190] w-[min(92vw,390px)] rounded-2xl border p-4 shadow-2xl ${dark ? "border-white/15 bg-[#18181b] text-white" : "border-[#dedee4] bg-white text-[#1d1d1f]"}`}>
        <p className="text-sm font-semibold">PayPal Sandbox · demo del hackathon</p>
        <p className={`mt-1 text-xs leading-5 ${dark ? "text-white/65" : "text-[#666670]"}`}>Compra ficticia de US$ 19,99. No afecta ventas, inventario ni arqueo de caja.</p>
        <button type="button" onClick={() => void startHackathonSandboxCheckout()}
          disabled={!paypalSandboxConfigured || paypalSandboxBusy}
          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#8f0000] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {paypalSandboxBusy ? "Conectando…" : paypalSandboxConfigured ? "Probar pago Sandbox" : "Sandbox no configurado"}
        </button>
        {paypalSandboxError && <p role="alert" className="mt-2 text-xs">{paypalSandboxError}</p>}
        <button type="button" onClick={() => { setHackathonDemo(false); window.history.replaceState({}, "", window.location.pathname); }}
          className={`ml-2 rounded-lg px-3 py-2 text-xs font-medium ${dark ? "text-white/70" : "text-[#666670]"}`}>Ocultar</button>
      </div>}
      {hackathonPaymentNotice && <div role="status" className={`fixed bottom-4 right-4 z-[200] max-w-[min(92vw,440px)] rounded-2xl border px-4 py-3 text-sm shadow-2xl ${dark ? "border-white/15 bg-[#18181b] text-white" : "border-[#dedee4] bg-white text-[#1d1d1f]"}`}>{hackathonPaymentNotice}<button type="button" onClick={() => setHackathonPaymentNotice("")} className="ml-3 rounded-lg px-2 py-1 text-xs font-semibold text-[#8f0000]">Cerrar</button></div>}
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
