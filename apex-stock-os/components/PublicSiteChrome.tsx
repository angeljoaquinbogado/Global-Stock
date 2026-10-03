import Link from "next/link";
import type { ReactNode } from "react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-lg">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/download"
          className="flex items-center gap-3 font-semibold text-white"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8F0000] text-xs font-black text-white shadow-[0_10px_30px_rgba(143,0,0,.28)]">
            GS
          </span>
          <span>Global Stock</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-white/64 md:flex">
          <Link className="transition-colors duration-150 hover:text-white" href="/download#download-feature-catalog">
            Funcionalidades
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/download#download-sectors">
            Sectores
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/download#download-pricing">
            Precios
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/download#download-install">
            Instalar
          </Link>
          <Link className="transition-colors duration-150 hover:text-white" href="/support">
            Soporte
          </Link>
        </nav>

        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-black transition-colors duration-150 hover:bg-white/90"
        >
          Abrir app
        </Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 text-sm text-white/58 sm:px-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-semibold text-white">Global Stock</p>
          <p className="mt-2 max-w-xl leading-6">
            Plataforma para stock, punto de venta, ecommerce, reposición,
            proveedores, códigos de barras e inteligencia operativa.
          </p>
          <p className="mt-3 text-xs text-white/38">
            Operado por Angel Joaquin Bogado · Provincia de Buenos Aires, Argentina.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
          <Link href="/about" className="hover:text-white">
            Quiénes somos
          </Link>
          <Link href="/legal" className="hover:text-white">
            Centro legal
          </Link>
          <Link href="/legal/privacy" className="hover:text-white">
            Privacidad
          </Link>
          <Link href="/legal/terms" className="hover:text-white">
            Términos
          </Link>
          <Link href="/legal/security" className="hover:text-white">
            Seguridad
          </Link>
          <Link href="/download" className="hover:text-white">
            Descargas
          </Link>
          <Link href="/support" className="hover:text-white">
            Soporte
          </Link>
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
    <div className="min-h-[100dvh] bg-black text-white">
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
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
