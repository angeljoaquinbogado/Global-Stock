"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DownloadNavbar } from "@/components/download/DownloadNavbar";
import "@/app/download/download.css";
import "./public-chrome.css";

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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="6" fill="#8F0000" />
              <path
                d="M7 15.5L10.5 12L13 14.5L17 9.5"
                stroke="#FFFFFF"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.2 9.5H17V12.3"
                stroke="#FFFFFF"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
                <Link href="/" className="gs-pub-footer-link">
                  Crear cuenta gratis
                </Link>
              </li>
              <li>
                <Link href="/" className="gs-pub-footer-link">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/about" className="gs-pub-footer-link">
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link href="/support" className="gs-pub-footer-link">
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
                <Link href="/legal/security" className="gs-pub-footer-link">
                  Seguridad
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="gs-pub-footer-link">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="gs-pub-footer-link">
                  Términos de uso
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="gs-pub-footer-link">
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
      <DownloadNavbar />
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
          <span>← {backLabel}</span>
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