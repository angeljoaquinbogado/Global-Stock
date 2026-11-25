"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_EVENT = "gs-theme-change";

function getSystemTheme(): "dark" | "light" {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function getStoredTheme(): "dark" | "light" | null {
  try {
    const stored =
      window.localStorage.getItem("gs-download-theme") ||
      window.localStorage.getItem("download-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignorar restricciones de almacenamiento
  }
  return null;
}

function setDomTheme(nextTheme: "dark" | "light", withTransitionFreeze: boolean) {
  const root = document.documentElement;
  if (withTransitionFreeze) {
    root.classList.add("gs-theme-switching");
  }

  root.setAttribute("data-download-theme", nextTheme);

  const themedNodes = document.querySelectorAll("[data-download-theme]");
  for (let i = 0; i < themedNodes.length; i++) {
    const el = themedNodes[i];
    if (el !== root && el.getAttribute("data-download-theme") !== nextTheme) {
      el.setAttribute("data-download-theme", nextTheme);
    }
  }

  if (withTransitionFreeze) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove("gs-theme-switching");
      });
    });
  }
}

export function DownloadThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = getStoredTheme();
    const initial = stored ?? getSystemTheme();

    setDomTheme(initial, false);
    setTheme(initial);

    const onThemeEvent = (e: Event) => {
      const detail = (e as CustomEvent<"dark" | "light">).detail;
      if (detail === "light" || detail === "dark") {
        setTheme(detail);
      }
    };

    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    const onSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        const sysTheme: "dark" | "light" = e.matches ? "dark" : "light";
        setDomTheme(sysTheme, true);
        setTheme(sysTheme);
      }
    };

    window.addEventListener(THEME_EVENT, onThemeEvent);
    mediaQuery?.addEventListener("change", onSystemThemeChange);

    return () => {
      window.removeEventListener(THEME_EVENT, onThemeEvent);
      mediaQuery?.removeEventListener("change", onSystemThemeChange);
    };
  }, []);

  function handleToggle() {
    const nextTheme: "dark" | "light" = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setDomTheme(nextTheme, true);

    try {
      window.localStorage.setItem("gs-download-theme", nextTheme);
      window.localStorage.setItem("download-theme", nextTheme);
    } catch {
      // ignorar restricciones de almacenamiento
    }

    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: nextTheme }));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="dl-icon-btn dl-theme-btn"
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}