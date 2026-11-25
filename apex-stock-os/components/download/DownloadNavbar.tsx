"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Compass,
  Download,
  HelpCircle,
  Home,
  Info,
  Layers,
  LifeBuoy,
  Menu,
  Scale,
  ShieldCheck,
  Store,
  X
} from "lucide-react";
import { DownloadThemeToggle } from "@/components/DownloadTheme";
import { NAV_LINKS } from "./content";
const DOCK_ICONS = {
  home: Home,
  compare: Scale,
  layers: Layers,
  store: Store,
  download: Download,
  help: HelpCircle
} as const;

function DefaultBrandMark() {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "linear-gradient(135deg, #ab0000 0%, #8f0000 100%)",
          boxShadow: "0 4px 12px -2px rgba(143, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
          flexShrink: 0
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 16.5L9.5 11L13 14.5L20 7.5"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 7.5H20V12"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>Global Stock</span>
    </>
  );
}

export function DownloadNavbar({
  brand,
  themeToggle
}: {
  brand?: ReactNode;
  themeToggle?: ReactNode;
}) {
  const pathname = usePathname() || "/download";
  const isDownloadPage = pathname === "/download";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>(isDownloadPage ? "#inicio" : "");
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDownloadPage) {
      setActiveHref("");
      return;
    }

    setActiveHref("#inicio");
    const ids = NAV_LINKS.map((l) => l.href.replace("#", ""));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const updateActiveSection = () => {
      const scrollMarker = window.scrollY + window.innerHeight * 0.34;
      let currentId = ids[0];

      for (const el of elements) {
        if (el.offsetTop <= scrollMarker) {
          currentId = el.id;
        }
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) {
        currentId = ids[ids.length - 1];
      }

      setActiveHref(`#${currentId}`);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [isDownloadPage]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function resolveHref(hashHref: string) {
    return isDownloadPage ? hashHref : `/download${hashHref}`;
  }

  const brandContent = brand ?? <DefaultBrandMark />;
  const themeControl = themeToggle ?? <DownloadThemeToggle />;

  return (
    <div className="dl-nav-wrap">
      <header className="dl-nav-pill">
        <Link
          href={isDownloadPage ? "#inicio" : "/download"}
          className="dl-nav-brand"
          aria-label="Global Stock - Inicio"
        >
          {brandContent}
        </Link>

        <nav
          className="dl-dock-nav"
          aria-label="Secciones de la página"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {NAV_LINKS.map((item) => {
            const Icon = DOCK_ICONS[item.icon];
            const isActive = isDownloadPage && activeHref === item.href;
            const isExpanded = hoveredHref === item.href;
            const targetHref = resolveHref(item.href);

            return (
              <Link
                key={item.href}
                href={targetHref}
                aria-label={item.label}
                aria-current={isActive ? "location" : undefined}
                onMouseEnter={() => setHoveredHref(item.href)}
                onFocus={() => setHoveredHref(item.href)}
                onBlur={() => setHoveredHref(null)}
                onClick={() => {
                  if (isDownloadPage) setActiveHref(item.href);
                }}
                className={`dl-dock-item ${isActive ? "is-active" : ""} ${
                  isExpanded ? "is-expanded" : ""
                }`}
              >
                <span className="dl-dock-icon-box" aria-hidden="true">
                  <Icon size={17} strokeWidth={2.1} />
                </span>
                <span className="dl-dock-label-clip">
                  <span className="dl-dock-expand-label">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="dl-nav-actions">
          {themeControl}

          <Link href="/" className="dl-btn-primary dl-nav-cta">
            Abrir app
            <ArrowRight size={15} aria-hidden="true" />
          </Link>

          <button
            type="button"
            className="dl-icon-btn dl-nav-burger"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            aria-controls="dl-mobile-menu"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="dl-mobile-backdrop"
            aria-label="Cerrar menú lateral"
            onClick={() => setMobileOpen(false)}
          />
          <aside id="dl-mobile-menu" className="dl-mobile-drawer" aria-label="Menú de navegación">
            <div className="dl-mobile-drawer-head">
              <Link
                href={isDownloadPage ? "#inicio" : "/download"}
                className="dl-nav-brand"
                onClick={() => setMobileOpen(false)}
              >
                {brandContent}
              </Link>
              <button
                type="button"
                className="dl-icon-btn"
                aria-label="Cerrar menú"
                onClick={() => setMobileOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav className="dl-mobile-links" aria-label="Secciones">
              {NAV_LINKS.map((item) => {
                const Icon = DOCK_ICONS[item.icon];
                const isActive = isDownloadPage && activeHref === item.href;
                const targetHref = resolveHref(item.href);

                return (
                  <Link
                    key={item.href}
                    href={targetHref}
                    className={`dl-mobile-link ${isActive ? "is-active" : ""}`}
                    onClick={() => {
                      if (isDownloadPage) setActiveHref(item.href);
                      setMobileOpen(false);
                    }}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="dl-mobile-drawer-footer">
              <div className="dl-mobile-quick-links">
                <Link
                  href="/about"
                  className="dl-mobile-sublink"
                  onClick={() => setMobileOpen(false)}
                >
                  <Info size={16} aria-hidden="true" />
                  <span>Quiénes somos</span>
                </Link>
                <Link
                  href="/support"
                  className="dl-mobile-sublink"
                  onClick={() => setMobileOpen(false)}
                >
                  <LifeBuoy size={16} aria-hidden="true" />
                  <span>Soporte</span>
                </Link>
                <Link
                  href="/legal/security"
                  className="dl-mobile-sublink"
                  onClick={() => setMobileOpen(false)}
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>Seguridad y legal</span>
                </Link>
                <Link
                  href="/download"
                  className="dl-mobile-sublink"
                  onClick={() => setMobileOpen(false)}
                >
                  <Compass size={16} aria-hidden="true" />
                  <span>Inicio / Descargar</span>
                </Link>
              </div>

              <Link href="/" className="dl-btn-primary dl-btn-full">
                Crear cuenta o iniciar sesión
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}