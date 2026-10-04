import Link from "next/link";
import type { ReactNode } from "react";

import { DownloadLogo } from "./DownloadLogo";
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
      return <DownloadLogo className="h-9 w-9 shrink-0" />;
    }

    return (
      <div className="flex items-center gap-3 text-white">
        <DownloadLogo className="h-10 w-10 shrink-0" />
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-[-0.03em]">
            Global Stock
          </div>
        </div>
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
    <header className="sticky top-0 z-50 border-b border-white/[0.045] bg-[#070708]/[0.98]">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/download" aria-label="Global Stock" className="shrink-0">
          <span className="sm:hidden">
            <PublicBrand compact downloadBrand={downloadBrand} />
          </span>
          <span className="hidden sm:block">
            <PublicBrand downloadBrand={downloadBrand} />
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] font-medium text-white/52 lg:flex">
          <Link
            className="transition-colors duration-150 hover:text-white"
            href="/download"
          >
            Inicio
          </Link>
          <Link
            className="transition-colors duration-150 hover:text-white"
            href="/download#download-features"
          >
            Producto
          </Link>
          <Link
            className="transition-colors duration-150 hover:text-white"
            href="/download#download-feature-catalog"
          >
            Funcionalidades
          </Link>
          <Link
            className="transition-colors duration-150 hover:text-white"
            href="/download#download-sectors"
          >
            Para quién
          </Link>
          <Link
            className="transition-colors duration-150 hover:text-white"
            href="/download#download-install"
          >
            Instalar
          </Link>
          <Link
            className="transition-colors duration-150 hover:text-white"
            href="/support"
          >
            Soporte
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold text-white/58 transition-colors duration-150 hover:bg-white/[0.045] hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#8F0000] px-4 text-xs font-semibold text-white shadow-[0_10px_28px_rgba(143,0,0,.24)] transition-[background-color,transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-[#8F0000] hover:shadow-[0_14px_34px_rgba(143,0,0,.32)]"
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
    <footer className="border-t border-white/[0.045] bg-[#060607]">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_.75fr_.75fr_.75fr]">
          <div>
            <PublicBrand downloadBrand={downloadBrand} />
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#96969f]">
              Plataforma gratuita para conectar ventas, stock, caja, compras,
              proveedores, finanzas y gestión.
            </p>
            <div className="mt-6 inline-flex min-h-9 items-center gap-2 rounded-full bg-white/[0.035] px-3 text-[11px] font-medium text-white/42">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Gratis · Aplicación web disponible
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/30">
              Producto
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/52">
              <Link href="/download#download-features" className="transition-colors hover:text-white">
                Producto
              </Link>
              <Link href="/download#download-feature-catalog" className="transition-colors hover:text-white">
                Funcionalidades
              </Link>
              <Link href="/download#download-install" className="transition-colors hover:text-white">
                Instalar
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/30">
              Compañía
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/52">
              <Link href="/about" className="transition-colors hover:text-white">
                Quiénes somos
              </Link>
              <Link href="/support" className="transition-colors hover:text-white">
                Soporte
              </Link>
              <Link href="/download#download-sectors" className="transition-colors hover:text-white">
                Sectores
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/30">
              Legal
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/52">
              <Link href="/legal/privacy" className="transition-colors hover:text-white">
                Privacidad
              </Link>
              <Link href="/legal/terms" className="transition-colors hover:text-white">
                Términos
              </Link>
              <Link href="/legal/security" className="transition-colors hover:text-white">
                Seguridad
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.045] pt-6 text-[11px] text-white/28 sm:flex-row sm:items-center sm:justify-between">
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
  return (
    <div className="gs-public-shell min-h-[100dvh] min-w-0 overflow-x-clip bg-[#070708] text-white">
      <PublicHeader downloadBrand={downloadBrand} />
      {children}
      <PublicFooter downloadBrand={downloadBrand} />
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
          Última actualización: 1 de octubre de 2026.
        </p>

        <article className="mt-12 space-y-10 text-sm leading-7 text-white/72 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h2]:text-white [&_strong]:font-semibold [&_strong]:text-white">
          {children}
        </article>
      </main>
    </PublicPage>
  );
}
