"use client";

import { useEffect, useState } from "react";

import { AuthScreen } from "./AuthScreen";
import { Dashboard } from "./Dashboard";

export function ApexShell() {
  const [dark, setDark] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("apex-theme");
    const nextDark =
      storedTheme === "light"
        ? false
        : storedTheme === "dark"
          ? true
          : window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDark(nextDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("apex-theme", dark ? "dark" : "light");
  }, [dark]);

  if (!authenticated) {
    return (
      <AuthScreen
        dark={dark}
        onToggleTheme={() => setDark((value) => !value)}
        onAuthenticated={() => setAuthenticated(true)}
      />
    );
  }

  return (
    <Dashboard
      dark={dark}
      onToggleTheme={() => setDark((value) => !value)}
      onSignOut={() => setAuthenticated(false)}
    />
  );
}
