import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDollarSign,
  Cloud,
  Download,
  Globe2,
  ShieldCheck,
  ShoppingCart,
  Sparkles
} from "lucide-react";

import {
  DownloadInstallShowcase,
  DownloadPlatformQuickTabs
} from "@/components/DownloadInstallShowcase";
import { DownloadMetricStrip } from "@/components/DownloadMetricStrip";
import { DownloadFeatureCatalog } from "@/components/DownloadFeatureCatalog";
import { DownloadFAQ } from "@/components/DownloadFAQ";
import { DownloadSectorShowcase } from "@/components/DownloadSectorShowcase";
import { GlobalStockPhonePreview } from "@/components/GlobalStockPhonePreview";
import { InstallAppButton } from "@/components/InstallAppButton";
import { Logo } from "@/components/Logo";
import { PublicPage } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Global Stock — Ventas, inventario y gestión en un solo lugar",
  description:
    "Punto de venta, inventario, compras, proveedores, ecommerce, finanzas e inteligencia operativa desde una sola plataforma."
};

const storeLinks = {
  appStore: process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "",
  playStore: process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || "",
  microsoftStore:
    process.env.NEXT_PUBLIC_MICROSOFT_STORE_URL?.trim() || "",
  appGallery: process.env.NEXT_PUBLIC_APP_GALLERY_URL?.trim() || "",
  galaxyStore:
    process.env.NEXT_PUBLIC_GALAXY_STORE_URL?.trim() || ""
};

const flowItems = [
  {
    icon: ShoppingCart,
    title: "Venta",
    body: "La operación entra una sola vez.",
    accent: "#ff5b67",
    surface: "rgba(255,91,103,.10)"
  },
  {
    icon: Boxes,
    title: "Stock",
    body: "Las existencias se actualizan en el mismo flujo.",
    accent: "#34d399",
    surface: "rgba(52,211,153,.10)"
  },
  {
    icon: CircleDollarSign,
    title: "Caja",
    body: "Cobros y movimientos quedan vinculados.",
    accent: "#f6b95b",
    surface: "rgba(246,185,91,.10)"
  },
  {
    icon: Sparkles,
    title: "Inteligencia",
    body: "Los datos quedan listos para analizar y consultar.",
    accent: "#b989ff",
    surface: "rgba(185,137,255,.10)"
  }
];

const heroSignals = [
  { label: "Venta registrada", accent: "#ff5b67" },
  { label: "Stock sincronizado", accent: "#34d399" },
  { label: "Caja actualizada", accent: "#f6b95b" },
  { label: "IA con contexto", accent: "#b989ff" }
];

export default function DownloadPage() {
  return (
    <PublicPage>
      <main className="gs-storefront overflow-x-clip bg-[#070708]">
        <section
          id="download-hero"
          data-download-section
          className="relative scroll-mt-20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(201,21,39,.18),transparent_25%),radial-gradient(circle_at_82%_70%,rgba(110,168,255,.08),transparent_28%),linear-gradient(180deg,#070708_0%,#09090b_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[.11] [background-image:linear-gradient(rgba(255,255,255,.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.028)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />

          <div className="relative mx-auto grid min-h-[calc(100svh-68px)] w-full max-w-[1240px] items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.04fr_.96fr] lg:gap-16 lg:py-16">
            <div className="gs-hero-copy max-w-[680px]">
              <div className="flex items-center gap-4">
                <Logo className="h-[68px] w-auto shrink-0 object-contain sm:h-[74px]" />
                <div>
                  <p className="text-sm font-semibold tracking-[-.02em] text-white/90">
                    Global Stock
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/38">
                    Una operación conectada, de punta a punta
                  </p>
                </div>
              </div>

              <div className="mt-8 inline-flex min-h-8 items-center gap-2.5 rounded-full bg-white/[0.035] px-3 text-[11px] font-semibold text-white/48 ring-1 ring-white/[0.045]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.42)]" />
                Aplicación web instalable disponible
              </div>

              <h1 className="mt-7 text-[clamp(3.4rem,6vw,6.8rem)] font-semibold leading-[.9] tracking-[-0.07em] text-white">
                Tu negocio,
                <span className="mt-2 block text-white/38">
                  en una sola señal.
                </span>
              </h1>

              <p className="mt-7 max-w-[620px] text-base leading-7 text-[#b4b4bc] sm:text-xl sm:leading-8">
                Vendé, mové stock, comprá, controlá caja y seguí la operación
                sin repetir datos entre sistemas.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3" id="instalar">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#c91527] px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(201,21,39,.22)] transition-[background-color,transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-[#df2033] hover:shadow-[0_18px_44px_rgba(201,21,39,.28)]"
                >
                  Abrir Global Stock
                  <ArrowRight size={15} />
                </Link>

                <InstallAppButton language="es" />
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/40">
                {[
                  "Punto de venta",
                  "Inventario conectado",
                  "Roles y permisos"
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-white/[0.045] text-white/55">
                      <Check size={10} />
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="gs-hero-product relative mx-auto flex w-full min-w-0 items-center justify-center">
              <div className="absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c91527]/10 blur-[96px]" />

              <div className="relative">
                <div className="relative rounded-[46px] bg-[linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.008))] p-4 shadow-[0_42px_120px_rgba(0,0,0,.50)] ring-1 ring-white/[0.055] sm:p-5">
                  <GlobalStockPhonePreview />
                </div>

                <div className="pointer-events-none absolute -right-16 top-20 hidden w-44 space-y-2 xl:block">
                  {heroSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className="flex items-center gap-2.5 rounded-2xl bg-[#111218]/88 px-3 py-2.5 text-[11px] font-semibold text-white/66 shadow-[0_14px_36px_rgba(0,0,0,.30)] ring-1 ring-white/[0.055] backdrop-blur-xl"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: signal.accent }}
                      />
                      {signal.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[1240px] justify-center px-5 pb-10 sm:px-8">
            <DownloadPlatformQuickTabs />
          </div>
        </section>

        <section
          id="download-features"
          data-download-section
          className="scroll-mt-20 border-t border-white/[0.045] bg-[#09090b] text-white"
        >
          <DownloadMetricStrip />

          <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff6773]">
                  Flujo conectado
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                  Una acción entra.
                  <span className="block text-white/34">
                    El resto se acomoda.
                  </span>
                </h2>
              </div>

              <p className="max-w-2xl text-base leading-7 text-[#a8a8b0] sm:text-lg">
                El producto está pensado como una cadena: cada dato nace una vez
                y después alimenta las áreas que lo necesitan.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-[34px] bg-[#111217] shadow-[0_34px_90px_rgba(0,0,0,.30)]">
              <div className="grid lg:grid-cols-[1.08fr_.92fr]">
                <div className="relative min-h-[430px] overflow-hidden p-6 sm:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(201,21,39,.12),transparent_34%),radial-gradient(circle_at_78%_74%,rgba(110,168,255,.08),transparent_34%)]" />

                  <div className="relative mx-auto max-w-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/32">
                          Operación en vivo
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-.04em]">
                          Venta conectada
                        </h3>
                      </div>
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff5b67]/10 text-[#ff6f7b]">
                        <ShoppingCart size={20} />
                      </span>
                    </div>

                    <div className="mt-8 rounded-[28px] bg-[#090a0d] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,.045)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white/82">
                            Reel Shimano Sedona
                          </p>
                          <p className="mt-1 text-xs text-white/34">
                            1 unidad · caja principal
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                          Disponible
                        </span>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/[0.035] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/28">
                            Venta
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white/82">
                            $ 48.900
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/[0.035] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/28">
                            Stock
                          </p>
                          <p className="mt-2 text-lg font-semibold text-emerald-300">
                            12 → 11
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#6ea8ff]/[0.07] px-4 py-3 text-xs font-medium text-[#9dc2ff]">
                        <Cloud size={14} />
                        Tienda online sincronizada
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d0e12] p-6 sm:p-8 lg:border-l lg:border-white/[0.045]">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/28">
                    Qué pasa después
                  </p>

                  <div className="mt-3">
                    {flowItems.map(({ icon: Icon, title, body, accent, surface }, index) => (
                      <div
                        key={title}
                        className={
                          "grid grid-cols-[46px_1fr] gap-4 py-5 " +
                          (index > 0 ? "border-t border-white/[0.045]" : "")
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

                  <Link
                    href="/"
                    className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/72 transition-colors duration-150 hover:text-white"
                  >
                    Probar la aplicación
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div id="download-feature-catalog" data-download-section className="scroll-mt-20">
          <DownloadFeatureCatalog />
        </div>

        <div id="download-sectors" data-download-section className="scroll-mt-20">
          <DownloadSectorShowcase />
        </div>

        <section
          id="download-install"
          data-download-section
          className="relative scroll-mt-20 overflow-hidden border-y border-white/[0.045] bg-[#08090b]"
        >
          <div className="absolute right-[5%] top-[10%] h-72 w-72 rounded-full bg-[#6ea8ff]/[0.07] blur-[100px]" />
          <div className="absolute left-[3%] bottom-[3%] h-64 w-64 rounded-full bg-[#c91527]/[0.07] blur-[100px]" />

          <div className="relative mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6ea8ff]">
                Instalación
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Abrilo como una app.
                <span className="block text-white/34">
                  Seguí trabajando igual.
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#a8a8b0]">
                La versión web instalable funciona desde navegadores compatibles.
                Las publicaciones nativas se muestran únicamente cuando estén disponibles.
              </p>
            </div>

            <div className="mt-12">
              <DownloadInstallShowcase
                appStoreUrl={storeLinks.appStore}
                playStoreUrl={storeLinks.playStore}
                microsoftStoreUrl={storeLinks.microsoftStore}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ["Huawei AppGallery", Boolean(storeLinks.appGallery)],
                ["Galaxy Store", Boolean(storeLinks.galaxyStore)]
              ].map(([name, active]) => (
                <span
                  key={String(name)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/[0.03] px-3 text-[10px] font-semibold text-white/36"
                >
                  <Download size={12} />
                  {String(name)} · {active ? "Disponible" : "Próximamente"}
                </span>
              ))}
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#34d399]">
                Seguridad y acceso
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Cada dato tiene un límite.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#a8a8b0]">
                Global Stock separa información pública de conexiones privadas
                y controla qué puede ver o hacer cada rol.
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
            <div className="absolute right-[-6%] top-[-80%] h-80 w-80 rounded-full bg-[#b989ff]/[0.08] blur-[100px]" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/32">
                  Global Stock
                </p>
                <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-4xl">
                  Menos herramientas sueltas. Más control sobre el negocio.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/44">
                  Probá la aplicación y conectá primero las partes de la operación
                  que más tiempo te quitan hoy.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#c91527] px-4 text-xs font-semibold text-white transition-[background-color,transform] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-[#df2033]"
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
