"use client";

import { Moon, Sun } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type DownloadTheme = "light" | "dark";

type DownloadThemeContextValue = {
  theme: DownloadTheme;
  toggleTheme: () => void;
};

const STORAGE_KEY = "global-stock-download-theme";

const DownloadThemeContext =
  createContext<DownloadThemeContextValue | null>(null);

export function DownloadThemeRoot({
  children
}: {
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<DownloadTheme>("light");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    window.localStorage.setItem(STORAGE_KEY, theme);

    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => {
        meta.content = theme === "light" ? "#F6F7F9" : "#070708";
      });
  }, [initialized, theme]);

  const value = useMemo<DownloadThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((current) => (current === "light" ? "dark" : "light"))
    }),
    [theme]
  );

  return (
    <DownloadThemeContext.Provider value={value}>
      <div
        className="gs-public-shell gs-download-theme min-h-[100dvh] min-w-0 overflow-x-clip"
        data-download-theme={theme}
      >
        {children}
      </div>
    </DownloadThemeContext.Provider>
  );
}

export function DownloadThemeToggle() {
  const context = useContext(DownloadThemeContext);

  if (!context) return null;

  const isDark = context.theme === "dark";

  return (
    <button
      type="button"
      onClick={context.toggleTheme}
      aria-label={isDark ? "Usar tema claro" : "Usar tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
      className="gs-download-theme-toggle grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-[background-color,border-color,color,transform] duration-150"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}