"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_EVENT = "gs-theme-change";

function applyThemeSync(nextTheme: "dark" | "light") {
  const root = document.documentElement;
  root.classList.add("gs-theme-switching");
  root.setAttribute("data-download-theme", nextTheme);

  const themedNodes = document.querySelectorAll("[data-download-theme]");
  for (let i = 0; i < themedNodes.length; i++) {
    const el = themedNodes[i];
    if (el !== root && el.getAttribute("data-download-theme") !== nextTheme) {
      el.setAttribute("data-download-theme", nextTheme);
    }
  }

  try {
    window.localStorage.setItem("gs-download-theme", nextTheme);
    window.localStorage.setItem("download-theme", nextTheme);
  } catch {
    // ignorar restricciones de almacenamiento
  }

  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: nextTheme }));

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove("gs-theme-switching");
    });
  });
}

export function DownloadThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const root = document.documentElement;
    let initial: "dark" | "light" = "light";

    try {
      const stored =
        window.localStorage.getItem("gs-download-theme") ||
        window.localStorage.getItem("download-theme");
      if (stored === "light" || stored === "dark") {
        initial = stored;
      } else {
        const attr = root.getAttribute("data-download-theme");
        if (attr === "light" || attr === "dark") initial = attr;
      }
    } catch {
      // ignorar restricciones de almacenamiento
    }

    root.setAttribute("data-download-theme", initial);
    const themedNodes = document.querySelectorAll("[data-download-theme]");
    for (let i = 0; i < themedNodes.length; i++) {
      const el = themedNodes[i];
      if (el !== root) el.setAttribute("data-download-theme", initial);
    }
    setTheme(initial);

    const onThemeEvent = (e: Event) => {
      const detail = (e as CustomEvent<"dark" | "light">).detail;
      if (detail === "light" || detail === "dark") {
        setTheme(detail);
      }
    };

    window.addEventListener(THEME_EVENT, onThemeEvent);
    return () => window.removeEventListener(THEME_EVENT, onThemeEvent);
  }, []);

  function handleToggle() {
    const nextTheme: "dark" | "light" = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyThemeSync(nextTheme);
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