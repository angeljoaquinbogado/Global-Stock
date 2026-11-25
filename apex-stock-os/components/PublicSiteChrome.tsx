import Link from "next/link";
import type { ReactNode } from "react";

import { DownloadLogo } from "./DownloadLogo";
import { DownloadThemeRoot, DownloadThemeToggle } from "./DownloadTheme";
import { Logo } from "./Logo";
import { PublicMobileNav } from "./PublicMobileNav";

function PublicBrand({
  compact = false,
  downloadBrand = false
}: {
  compact?: boolean;
  downloadBrand?: boolean;
}) {
  if (downloadBrand) {
    if (compact) {
      return <DownloadLogo className="h-8 w-8 shrink-0" />;
    }

    return (
      <div className="gs-download-brand flex items-center gap-2.5 text-white">
        <span className="grid h-8 w-8 shrink-0 place-items-center">
          <DownloadLogo className="h-7 w-7" alt="" />
        </span>
        <span className="text-[16px] font-bold tracking-[-0.025em]">
          Global Stock
        </span>
      </div>
    );
  }

  if (compact) {
    return <Logo className="h-9 w-9 shrink-0" />;
  }

  return <Logo withWordmark className="text-white" />;
}

export function PublicHeader({
  downloadBrand = false
}: {
  downloadBrand?: boolean;
}) {
  return (
    <header className="gs-public-header sticky top-0 z-50 border-b border-white/[0.045] bg-[#070708]/[0.98]">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1180px] items-center justify-between gap-6 px-[clamp(1.125rem,4vw,2.5rem)]">
        <Link href="/download" aria-label="Global Stock" className="shrink-0">
          <span className="sm:hidden">
            <PublicBrand compact downloadBrand={downloadBrand} />
          </span>
          <span className="hidden sm:block">
            <PublicBrand downloadBrand={downloadBrand} />
          </span>
        </Link>

        <nav className="gs-download-nav hidden items-center gap-7 text-[13px] font-medium text-white/52 lg:flex">
          <Link className="transition-colors duration-150 hover:text-white" href="/download">
            Inicio
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/download#comparativa">
            Ventajas
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/download#funciones">
            Funciones
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/download#rubros">
            Rubros
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/download#instalar">
            Instalar
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/support">
            Soporte
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {downloadBrand ? <DownloadThemeToggle /> : null}

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/"
              className="gs-download-login-action inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold text-white/58 transition-colors duration-150 hover:bg-white/[0.045] hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/"
              className="gs-download-primary-action inline-flex min-h-10 items-center justify-center rounded-xl bg-[#8F0000] px-4 text-xs font-semibold text-white shadow-[0_10px_28px_rgba(143,0,0,.24)] transition-[background-color,transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-[#a60000]"
            >
              Abrir Global Stock
            </Link>
          </div>

          <PublicMobileNav />
        </div>
      </div>
    </header>
  );
}

export function PublicFooter({
  downloadBrand = false
}: {
  downloadBrand?: boolean;
}) {
  return (
    <footer className="gs-public-footer border-t border-white/[0.08] bg-[#08090c] text-white">
      <div className="mx-auto w-full max-w-[1180px] px-[clamp(1.125rem,4vw,2.5rem)] py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <PublicBrand downloadBrand={downloadBrand} />
            <p className="gs-footer-muted mt-3.5 max-w-sm text-sm leading-6 text-white/68">
              Sistema de gestión comercial para conectar inventario, punto de venta,
              caja diaria, compras y reportes desde el celular o la computadora.
            </p>
          </div>

          <div>
            <p className="gs-footer-heading text-xs font-bold uppercase tracking-[0.14em] text-white/45">
              Secciones
            </p>
            <div className="gs-footer-links mt-3.5 grid gap-2 text-sm text-white/70">
              <Link href="/download#inicio" className="transition-colors hover:text-white">
                Inicio
              </Link>
              <Link href="/download#comparativa" className="transition-colors hover:text-white">
                Ventajas
              </Link>
              <Link href="/download#funciones" className="transition-colors hover:text-white">
                Funciones
              </Link>
              <Link href="/download#rubros" className="transition-colors hover:text-white">
                Rubros
              </Link>
              <Link href="/download#instalar" className="transition-colors hover:text-white">
                Instalar
              </Link>
              <Link href="/download#preguntas" className="transition-colors hover:text-white">
                Preguntas frecuentes
              </Link>
            </div>
          </div>

          <div>
            <p className="gs-footer-heading text-xs font-bold uppercase tracking-[0.14em] text-white/45">
              Plataforma
            </p>
            <div className="gs-footer-links mt-3.5 grid gap-2 text-sm text-white/70">
              <Link href="/" className="transition-colors hover:text-white">
                Crear cuenta gratis
              </Link>
              <Link href="/" className="transition-colors hover:text-white">
                Iniciar sesión
              </Link>
              <Link href="/about" className="transition-colors hover:text-white">
                Quiénes somos
              </Link>
              <Link href="/support" className="transition-colors hover:text-white">
                Soporte
              </Link>
            </div>
          </div>

          <div>
            <p className="gs-footer-heading text-xs font-bold uppercase tracking-[0.14em] text-white/45">
              Seguridad y legal
            </p>
            <div className="gs-footer-links mt-3.5 grid gap-2 text-sm text-white/70">
              <Link href="/legal/security" className="transition-colors hover:text-white">
                Seguridad
              </Link>
              <Link href="/legal/privacy" className="transition-colors hover:text-white">
                Privacidad
              </Link>
              <Link href="/legal/terms" className="transition-colors hover:text-white">
                Términos de uso
              </Link>
              <Link href="/legal/cookies" className="transition-colors hover:text-white">
                Cookies
              </Link>
            </div>
          </div>
        </div>

        <div className="gs-footer-bottom mt-10 flex flex-col gap-2 border-t border-white/[0.08] pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Global Stock. Todos los derechos reservados.</p>
          <p>Buenos Aires, Argentina</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicPage({
  children,
  downloadBrand = false
}: {
  children: ReactNode;
  downloadBrand?: boolean;
}) {
  if (downloadBrand) {
    return (
      <DownloadThemeRoot>
        {children}
        <PublicFooter downloadBrand />
      </DownloadThemeRoot>
    );
  }

  return (
    <div className="gs-public-shell min-h-[100dvh] min-w-0 overflow-x-clip bg-[#070708] text-white">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}

export function LegalArticle({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <PublicPage>
      <main className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8F0000]">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-full text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.055em]">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-white/62">
          {intro}
        </p>
        <p className="mt-4 text-xs text-white/38">
          Última revisión de los documentos: 12 de octubre de 2026.
        </p>

        <article className="mt-12 space-y-10 text-sm leading-7 text-white/72 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h2]:text-white [&_strong]:font-semibold [&_strong]:text-white">
          {children}
        </article>
      </main>
    </PublicPage>
  );
}