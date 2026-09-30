"use client";

import { useEffect, useState } from "react";

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

export function ApexShell() {
  const [dark, setDark] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("es");
  const [currency, setCurrency] = useState("ARS");
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
      ["ARS", "USD", "EUR", "BRL", "MXN", "GBP", "JPY"].includes(
        storedCurrency
      )
    ) {
      setCurrency(storedCurrency);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem(
      "global-stock-theme",
      dark ? "dark" : "light"
    );
  }, [dark, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = languageToHtml[language];
    window.localStorage.setItem("global-stock-demo-language", language);
  }, [language, ready]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem("global-stock-demo-currency", currency);
  }, [currency, ready]);

  if (!authenticated) {
    return (
      <AuthScreen
        dark={dark}
        language={language}
        currency={currency}
        onToggleTheme={() => setDark((value) => !value)}
        onLanguageChange={setLanguage}
        onCurrencyChange={setCurrency}
        onAuthenticated={() => setAuthenticated(true)}
      />
    );
  }

  return (
    <BusinessWorkspace
      dark={dark}
      language={language}
      currency={currency}
      onLanguageChange={setLanguage}
      onCurrencyChange={setCurrency}
      onToggleTheme={() => setDark((value) => !value)}
      onSignOut={() => setAuthenticated(false)}
    />
  );
}
