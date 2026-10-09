import type { Metadata } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Globe2,
  ShieldCheck,
} from "lucide-react";

import {
  DownloadInstallShowcase,
  DownloadPlatformQuickTabs
} from "@/components/DownloadInstallShowcase";
import { DownloadMetricStrip } from "@/components/DownloadMetricStrip";
import { DownloadCinematicHero } from "@/components/DownloadCinematicHero";
import { DownloadAIAutomationFlow } from "@/components/DownloadAIAutomationFlow";
import { DownloadFeatureCatalog } from "@/components/DownloadFeatureCatalog";
import { DownloadEcosystemHub } from "@/components/DownloadEcosystemHub";
import { DownloadFAQ } from "@/components/DownloadFAQ";
import { DownloadSectorShowcase } from "@/components/DownloadSectorShowcase";
import { DownloadScrollNavigator } from "@/components/DownloadScrollNavigator";
import { DownloadSalesFlow } from "@/components/DownloadSalesFlow";
import { PublicPage } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Global Stock — Ventas, stock, caja y gestión gratis",
  description:
    "Gestioná ventas, stock, caja, compras, proveedores, ecommerce y más desde una sola plataforma gratuita."
};

const storeLinks = {
  appStore: process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "",
  playStore: process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || "",
  microsoftStore:
    process.env.NEXT_PUBLIC_MICROSOFT_STORE_URL?.trim() || ""
};


export const metadata: Metadata = {
  title: "Gestión de stock, ventas y caja",
  description: "Conocé Global Stock: inventario, punto de venta, caja, documentos, estadísticas e inteligencia para gestionar tu negocio desde el celular o la PC.",
  alternates: { canonical: "/download" },
  openGraph: {
    title: "Global Stock — Stock, ventas e inteligencia conectados",
    description: "Controlá stock, registrá ventas y analizá tu negocio en una aplicación que crece con vos.",
    url: "/download"
  }
};

export default function DownloadPage() {
  return (
    <PublicPage downloadBrand>
      <DownloadScrollNavigator />

      <main className="gs-storefront overflow-x-clip bg-[#070708]">
        <DownloadCinematicHero />

        <div className="relative mx-auto flex w-full max-w-[1240px] justify-center px-5 py-8 sm:px-8 sm:py-10">
          <DownloadPlatformQuickTabs />
        </div>

        <section
          id="download-features"
          data-download-section
          className="scroll-mt-20 border-t border-white/[0.045] bg-[#09090b] text-white"
        >
          <DownloadMetricStrip />
          <DownloadSalesFlow />
          <DownloadAIAutomationFlow />
        </section>

        <div id="download-feature-catalog" data-download-section className="scroll-mt-20">
          <DownloadFeatureCatalog />
        </div>

        <DownloadEcosystemHub />

        <div id="download-sectors" data-download-section className="scroll-mt-20">
          <DownloadSectorShowcase />
        </div>

        <section
          id="download-install"
          data-download-section
          className="relative scroll-mt-20 overflow-hidden border-y border-white/[0.045] bg-[#08090b]"
        >
          <div className="relative mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-3xl">
              <p className="gs-download-kicker text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
                Cómo lo usás
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Usalo en el navegador.
                <span className="block text-white/34">
                  O instalalo como app.
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#a8a8b0]">
                Entrá desde la web o instalá la versión PWA en dispositivos compatibles.
                Tu operación sigue siendo la misma estés donde estés.
              </p>
            </div>

            <div className="mt-12">
              <DownloadInstallShowcase
                appStoreUrl={storeLinks.appStore}
                playStoreUrl={storeLinks.playStore}
                microsoftStoreUrl={storeLinks.microsoftStore}
              />
            </div>
          </div>
        </section>

        <section
          id="download-security"
          data-download-section
          className="scroll-mt-20 bg-[#0a090b]"
        >
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
            <div>
              <p className="gs-download-kicker text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
                Tus datos
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Cada persona ve lo que necesita.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#a8a8b0]">
                Los permisos por rol ayudan a separar accesos, proteger información
                sensible y mantener cada área bajo control.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/legal/security"
                  className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-xs font-semibold text-black transition-[background-color,transform] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-white/90"
                >
                  Ver seguridad
                </Link>
                <Link
                  href="/legal/privacy"
                  className="inline-flex h-11 items-center rounded-xl bg-white/[0.045] px-4 text-xs font-semibold text-white/72 transition-colors duration-150 hover:bg-white/[0.075]"
                >
                  Privacidad
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] bg-[#111217] shadow-[0_24px_70px_rgba(0,0,0,.22)]">
              {[
                {
                  icon: Globe2,
                  title: "Información pública",
                  body: "Sirve para reconocer una tienda o catálogo.",
                  accent: "#6ea8ff",
                  surface: "rgba(110,168,255,.10)"
                },
                {
                  icon: ShieldCheck,
                  title: "Conexión autorizada",
                  body: "Sincronizar o modificar datos privados requiere permiso.",
                  accent: "#34d399",
                  surface: "rgba(52,211,153,.10)"
                },
                {
                  icon: Boxes,
                  title: "Acceso por rol",
                  body: "Cada persona ve solo las herramientas que necesita.",
                  accent: "#f6b95b",
                  surface: "rgba(246,185,91,.10)"
                }
              ].map(({ icon: Icon, title, body, accent, surface }, index) => (
                <div
                  key={title}
                  className={
                    "grid grid-cols-[48px_1fr] gap-4 px-5 py-5 sm:px-6 " +
                    (index < 2 ? "border-b border-white/[0.045]" : "")
                  }
                >
                  <span
                    className="grid h-11 w-11 place-items-center rounded-2xl"
                    style={{ background: surface, color: accent }}
                  >
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white/84">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/42">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div id="download-faq" data-download-section className="scroll-mt-20">
          <DownloadFAQ />
        </div>

        <section className="border-t border-white/[0.045] bg-[#070708] px-5 py-16 sm:px-8 sm:py-20">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#121318,#0d0d10)] px-6 py-10 shadow-[0_30px_90px_rgba(0,0,0,.30)] sm:px-10 sm:py-12">
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="gs-download-kicker text-[10px] font-bold uppercase tracking-[.16em] text-[#8F0000]">
                  Precio
                </p>
                <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-4xl">
                  Todo esto, gratis.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/44">
                  Global Stock no necesita un plan para empezar: abrí la aplicación
                  y usá las herramientas disponibles sin pagar una suscripción.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/"
                  className="gs-download-primary-action inline-flex h-11 items-center gap-2 rounded-xl bg-[#8F0000] px-4 text-xs font-semibold text-white transition-[background-color,transform] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-[#8F0000]"
                >
                  Abrir Global Stock
                  <ArrowRight size={14} />
                </Link>
                <a
                  href="#download-install"
                  className="inline-flex h-11 items-center rounded-xl bg-white/[0.045] px-4 text-xs font-semibold text-white/72 transition-colors duration-150 hover:bg-white/[0.075]"
                >
                  Ver instalación
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}