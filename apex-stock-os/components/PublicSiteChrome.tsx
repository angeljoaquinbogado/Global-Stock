"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Home, Info, LifeBuoy, Menu, ShieldCheck, X } from "lucide-react";
import { DownloadThemeToggle } from "@/components/DownloadTheme";
import "./public-chrome.css";
const PUBLIC_NAV_ITEMS = [
  { label: "Inicio", href: "/download", icon: Home },
  { label: "Quiénes somos", href: "/about", icon: Info },
  { label: "Soporte", href: "/support", icon: LifeBuoy },
  { label: "Seguridad y legal", href: "/legal/security", icon: ShieldCheck }
] as const;

const LEGAL_NAV_LINKS = [
  { label: "Seguridad", href: "/legal/security" },
  { label: "Privacidad", href: "/legal/privacy" },
  { label: "Términos de uso", href: "/legal/terms" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Soporte", href: "/support" }
] as const;

function PublicFooter() {
  return (
    <footer
      className="gs-public-footer"
      style={{
        marginTop: "auto",
        borderTop: "1px solid var(--gs-pub-border)",
        backgroundColor: "var(--gs-pub-bg-subtle)",
        color: "var(--gs-pub-fg)",
        padding: "2.5rem 1.25rem 2rem"
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "2rem"
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <Link
            href="/download"
            className="gs-download-brand"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              textDecoration: "none",
              color: "var(--gs-pub-fg)",
              fontWeight: 700
            }}
          >
            <img
              src="/brand/global-stock-mark.svg"
              alt=""
              width={24}
              height={24}
              aria-hidden="true"
            />
            <span>Global Stock</span>
          </Link>
          <p
            className="gs-footer-muted"
            style={{
              marginTop: "0.65rem",
              fontSize: "0.875rem",
              color: "var(--gs-pub-fg-muted)",
              lineHeight: 1.55
            }}
          >
            Gestión comercial de stock, ventas y caja en computadora y celular.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem" }}>
          <div>
            <p
              className="gs-footer-heading"
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--gs-pub-fg-muted)",
                margin: 0
              }}
            >
              Plataforma
            </p>
            <ul
              className="gs-footer-links"
              style={{
                listStyle: "none",
                margin: "0.75rem 0 0",
                padding: 0,
                display: "grid",
                gap: "0.5rem",
                fontSize: "0.9rem"
              }}
            >
              <li>
                <Link href="/" style={{ textDecoration: "none", color: "var(--gs-pub-fg-secondary)" }}>
                  Crear cuenta gratis
                </Link>
              </li>
              <li>
                <Link href="/" style={{ textDecoration: "none", color: "var(--gs-pub-fg-secondary)" }}>
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/about" style={{ textDecoration: "none", color: "var(--gs-pub-fg-secondary)" }}>
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link href="/support" style={{ textDecoration: "none", color: "var(--gs-pub-fg-secondary)" }}>
                  Soporte
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p
              className="gs-footer-heading"
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--gs-pub-fg-muted)",
                margin: 0
              }}
            >
              Seguridad y legal
            </p>
            <ul
              className="gs-footer-links"
              style={{
                listStyle: "none",
                margin: "0.75rem 0 0",
                padding: 0,
                display: "grid",
                gap: "0.5rem",
                fontSize: "0.9rem"
              }}
            >
              <li>
                <Link href="/legal/security" style={{ textDecoration: "none", color: "var(--gs-pub-fg-secondary)" }}>
                  Seguridad
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" style={{ textDecoration: "none", color: "var(--gs-pub-fg-secondary)" }}>
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" style={{ textDecoration: "none", color: "var(--gs-pub-fg-secondary)" }}>
                  Términos de uso
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" style={{ textDecoration: "none", color: "var(--gs-pub-fg-secondary)" }}>
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        className="gs-footer-bottom"
        style={{
          maxWidth: 1180,
          margin: "2rem auto 0",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--gs-pub-border)",
          fontSize: "0.8125rem",
          color: "var(--gs-pub-fg-muted)"
        }}
      >
        © {new Date().getFullYear()} Global Stock · Todos los derechos reservados.
      </div>
    </footer>
  );
}

export function PublicSiteChrome({
  children,
  hideHeader = false,
  downloadBrand = false
}: {
  children: ReactNode;
  hideHeader?: boolean;
  downloadBrand?: boolean;
  language?: string;
}) {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDownloadRoute = hideHeader || downloadBrand || pathname === "/download";

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem("gs-download-theme") ||
        window.localStorage.getItem("download-theme") ||
        document.documentElement.getAttribute("data-download-theme");
      if (saved === "light" || saved === "dark") {
        document.documentElement.setAttribute("data-download-theme", saved);
      } else if (!document.documentElement.getAttribute("data-download-theme")) {
        document.documentElement.setAttribute("data-download-theme", "dark");
      }
    } catch {
      // ignore storage restrictions
    }
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isDownloadRoute) {
    return (
      <>
        {children}
        <PublicFooter />
      </>
    );
  }

  return (
    <div className="gs-pub-shell">
      <div className="gs-pub-nav-wrap">
        <header className="gs-pub-nav-pill">
          <Link href="/download" className="gs-pub-brand" aria-label="Global Stock - Inicio">
            <img
              src="/brand/global-stock-mark.svg"
              alt=""
              width={26}
              height={26}
              aria-hidden="true"
            />
            <span>Global Stock</span>
          </Link>

          <nav className="gs-pub-links" aria-label="Secciones públicas">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/legal/security"
                  ? pathname.startsWith("/legal")
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`gs-pub-link ${active ? "is-active" : ""}`}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="gs-pub-actions">
            <DownloadThemeToggle />

            <Link href="/" className="gs-pub-cta">
              Abrir app
              <ArrowRight size={15} aria-hidden="true" />
            </Link>

            <button
              type="button"
              className="gs-pub-burger"
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
              className="gs-pub-backdrop"
              aria-label="Cerrar menú lateral"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="gs-pub-drawer" aria-label="Menú de navegación">
              <div className="gs-pub-drawer-head">
                <Link href="/download" className="gs-pub-brand" onClick={() => setMobileOpen(false)}>
                  <img
                    src="/brand/global-stock-mark.svg"
                    alt=""
                    width={24}
                    height={24}
                    aria-hidden="true"
                  />
                  <span>Global Stock</span>
                </Link>
                <button
                  type="button"
                  className="gs-pub-burger"
                  aria-label="Cerrar menú"
                  onClick={() => setMobileOpen(false)}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <nav className="gs-pub-drawer-links" aria-label="Páginas">
                {PUBLIC_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/legal/security"
                      ? pathname.startsWith("/legal")
                      : pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`gs-pub-drawer-link ${active ? "is-active" : ""}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="gs-pub-drawer-theme">
                <span>Apariencia (Claro / Oscuro)</span>
                <DownloadThemeToggle />
              </div>

              <Link href="/" className="gs-pub-cta" style={{ display: "inline-flex", width: "100%" }}>
                Crear cuenta o iniciar sesión
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </aside>
          </>
        )}
      </div>

      <div style={{ flex: 1 }}>{children}</div>

      <PublicFooter />
    </div>
  );
}

export function PublicPage({
  children,
  hideHeader = false,
  downloadBrand = false,
  language,
  className
}: {
  children: ReactNode;
  hideHeader?: boolean;
  downloadBrand?: boolean;
  language?: string;
  className?: string;
}) {
  return (
    <PublicSiteChrome hideHeader={hideHeader} downloadBrand={downloadBrand} language={language}>
      {className ? <div className={className}>{children}</div> : children}
    </PublicSiteChrome>
  );
}

export function LegalArticle({
  title,
  eyebrow,
  kicker,
  badge,
  updated,
  updatedAt,
  lastUpdated,
  intro,
  summary,
  description,
  lead,
  backHref = "/legal",
  backLabel = "Volver al centro legal",
  language,
  children
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  kicker?: ReactNode;
  badge?: ReactNode;
  updated?: ReactNode;
  updatedAt?: ReactNode;
  lastUpdated?: ReactNode;
  intro?: ReactNode;
  summary?: ReactNode;
  description?: ReactNode;
  lead?: ReactNode;
  backHref?: string;
  backLabel?: string;
  language?: string;
  children?: ReactNode;
}) {
  const topKicker = eyebrow ?? kicker ?? badge ?? "Seguridad y legal";
  const updatedText = updated ?? updatedAt ?? lastUpdated;
  const leadText = intro ?? summary ?? description ?? lead;

  return (
    <PublicSiteChrome language={language}>
      <main className="gs-legal-wrap">
        <Link href={backHref} className="gs-legal-back">
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>

        <article className="gs-legal-card">
          <header className="gs-legal-header">
            <div className="gs-legal-meta-row">
              <span className="gs-sup-kicker">{topKicker}</span>
              {updatedText && <span className="gs-legal-updated">{updatedText}</span>}
            </div>
            {title && <h1 className="gs-legal-title">{title}</h1>}
            {leadText && <p className="gs-legal-summary">{leadText}</p>}
          </header>

          <div className="gs-legal-body">{children}</div>

          <nav className="gs-legal-related" aria-label="Documentos legales relacionados">
            {LEGAL_NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </article>
      </main>
    </PublicSiteChrome>
  );
}