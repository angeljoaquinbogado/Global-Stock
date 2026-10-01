"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";

import {
  getSupabaseBrowserClient,
  isSupabaseConfigured
} from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";
import { AuthScreen } from "./AuthScreen";
import { BusinessWorkspace } from "./BusinessWorkspace";

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

export function ApexShell() {
  const [dark, setDark] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("es");
  const [currency, setCurrency] = useState("ARS");
  const [ready, setReady] = useState(false);

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
      setReady(true);
    });

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthenticated(Boolean(session));
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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

  function handleAuthenticated() {
    if (!isSupabaseConfigured()) {
      window.localStorage.setItem("global-stock-demo-auth", "1");
    }
    setAuthenticated(true);
  }

  async function handleSignOut() {
    window.localStorage.removeItem("global-stock-demo-auth");

    const client = getSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
    }

    setAuthenticated(false);
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

  return (
    <MotionConfig reducedMotion="user">
      <BusinessWorkspace
        dark={dark}
        language={language}
        currency={currency}
        onLanguageChange={setLanguage}
        onCurrencyChange={setCurrency}
        onToggleTheme={() => setDark((value) => !value)}
        onSignOut={() => {
          void handleSignOut();
        }}
      />
    </MotionConfig>
  );
}
