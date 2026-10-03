import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./Logo";
import { PublicMobileNav } from "./PublicMobileNav";

function PublicBrand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <Logo className="h-9 w-auto shrink-0 sm:h-10" />;
  }

  return <Logo withWordmark className="text-white" />;
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#211417] bg-[#070708]/88 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/download" aria-label="Global Stock">
          <span className="sm:hidden">
            <PublicBrand compact />
          </span>
          <span className="hidden sm:block">
            <PublicBrand />
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] font-medium text-white/48 lg:flex">
          <Link className="transition hover:text-white" href="/download#download-features">
            Producto
          </Link>
          <Link className="transition hover:text-white" href="/download#download-feature-catalog">
            Funcionalidades
          </Link>
          <Link className="transition hover:text-white" href="/download#download-sectors">
            Para quién
          </Link>
          <Link className="transition hover:text-white" href="/download#download-install">
            Instalar
          </Link>
          <Link className="transition hover:text-white" href="/support">
            Soporte
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold text-white/58 transition hover:bg-white/[0.05] hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#c91527] px-4 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(201,21,39,.22)] transition hover:bg-[#dd1e32]"
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

export function PublicFooter() {
  return (
    <footer className="border-t border-[#211417] bg-[#060607]">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr_.7fr_.7fr]">
          <div>
            <PublicBrand />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/42">
              Ventas, inventario, compras, proveedores, finanzas y gestión del
              negocio conectados desde una sola plataforma.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/[0.035] px-3 py-2 text-[11px] font-medium text-white/38">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Aplicación web disponible
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/28">
              Producto
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/48">
              <Link href="/download#download-features" className="hover:text-white">Producto</Link>
              <Link href="/download#download-feature-catalog" className="hover:text-white">Funcionalidades</Link>
              <Link href="/download#download-install" className="hover:text-white">Instalar</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/28">
              Compañía
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/48">
              <Link href="/about" className="hover:text-white">Quiénes somos</Link>
              <Link href="/support" className="hover:text-white">Soporte</Link>
              <Link href="/download#download-sectors" className="hover:text-white">Sectores</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/28">
              Legal
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/48">
              <Link href="/legal/privacy" className="hover:text-white">Privacidad</Link>
              <Link href="/legal/terms" className="hover:text-white">Términos</Link>
              <Link href="/legal/security" className="hover:text-white">Seguridad</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#211417] pt-6 text-[11px] text-white/26 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Global Stock. Todos los derechos reservados.</p>
          <p>Buenos Aires, Argentina</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicPage({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#070708] text-white">
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e63a4a]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
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
