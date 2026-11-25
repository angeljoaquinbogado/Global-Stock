"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Download,
  HelpCircle,
  Home,
  Layers,
  LifeBuoy,
  LogIn,
  Menu,
  Store,
  X
} from "lucide-react";
import { NAV_LINKS } from "./content";

const NAV_ICONS = {
  home: Home,
  compare: ArrowLeftRight,
  layers: Layers,
  store: Store,
  download: Download,
  help: HelpCircle
} as const;

export function DownloadNavbar({
  brand,
  themeToggle
}: {
  brand: ReactNode;
  themeToggle: ReactNode;
}) {
  const [activeHref, setActiveHref] = useState<string>("#inicio");
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.replace("#", ""));

    const updateActiveOnScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 240) {
        setActiveHref("#inicio");
        return;
      }

      const probe = scrollY + 190;
      let current = "#inicio";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= probe) {
          current = `#${id}`;
        }
      }
      setActiveHref(current);
    };

    updateActiveOnScroll();
    window.addEventListener("scroll", updateActiveOnScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveOnScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="dl-nav-wrap">
      <header className="dl-nav-pill">
        <a
          href="#inicio"
          className="dl-nav-brand"
          aria-label="Global Stock - Inicio"
          onClick={() => setActiveHref("#inicio")}
        >
          {brand}
        </a>

        <nav
          className="dl-dock-nav"
          aria-label="Navegación principal"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {NAV_LINKS.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const isActive = activeHref === item.href;
            const isExpanded = hoveredHref === item.href;

            return (
              <a
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`dl-dock-item ${isActive ? "is-active" : ""} ${isExpanded ? "is-expanded" : ""}`}
                onMouseEnter={() => setHoveredHref(item.href)}
                onFocus={() => setHoveredHref(item.href)}
                onBlur={() => setHoveredHref(null)}
                onClick={() => setActiveHref(item.href)}
              >
                <span className="dl-dock-icon-box">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="dl-dock-label-clip">
                  <span className="dl-dock-expand-label">{item.label}</span>
                </span>
              </a>
            );
          })}
        </nav>

        <div className="dl-nav-actions">
          {themeToggle}

          <Link href="/" className="dl-btn-primary dl-nav-cta">
            Abrir app
            <ArrowRight size={15} aria-hidden="true" />
          </Link>

          <button
            type="button"
            className="dl-icon-btn dl-nav-burger"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
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
            aria-label="Cerrar menú lateral"
            className="dl-mobile-backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="dl-mobile-drawer" aria-label="Menú lateral">
            <div className="dl-mobile-drawer-head">
              <a
                href="#inicio"
                className="dl-nav-brand"
                onClick={() => {
                  setActiveHref("#inicio");
                  setMobileOpen(false);
                }}
              >
                {brand}
              </a>
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
                const Icon = NAV_ICONS[item.icon];
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`dl-mobile-link ${activeHref === item.href ? "is-active" : ""}`}
                    onClick={() => {
                      setActiveHref(item.href);
                      setMobileOpen(false);
                    }}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>

            <div className="dl-mobile-drawer-footer">
              <div className="dl-mobile-quick-links">
                <Link
                  href="/"
                  className="dl-mobile-sublink"
                  onClick={() => setMobileOpen(false)}
                >
                  <LogIn size={16} aria-hidden="true" />
                  Iniciar sesión
                </Link>
                <Link
                  href="/support"
                  className="dl-mobile-sublink"
                  onClick={() => setMobileOpen(false)}
                >
                  <LifeBuoy size={16} aria-hidden="true" />
                  Soporte
                </Link>
              </div>

              <Link
                href="/"
                className="dl-btn-primary dl-btn-full"
                onClick={() => setMobileOpen(false)}
              >
                Crear cuenta gratis
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}