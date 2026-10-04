import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDollarSign,
  Cloud,
  Globe2,
  ShieldCheck,
  ShoppingCart
} from "lucide-react";

import {
  DownloadInstallShowcase,
  DownloadPlatformQuickTabs
} from "@/components/DownloadInstallShowcase";
import { DownloadMetricStrip } from "@/components/DownloadMetricStrip";
import { DownloadFeatureCatalog } from "@/components/DownloadFeatureCatalog";
import { DownloadFAQ } from "@/components/DownloadFAQ";
import { DownloadSectorShowcase } from "@/components/DownloadSectorShowcase";
import { DownloadScrollNavigator } from "@/components/DownloadScrollNavigator";
import { GlobalStockPhonePreview } from "@/components/GlobalStockPhonePreview";
import { InstallAppButton } from "@/components/InstallAppButton";
import { DownloadLogo } from "@/components/DownloadLogo";
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

const flowItems = [
  {
    icon: Boxes,
    title: "Stock",
    value: "12 → 11 unidades",
    body: "La unidad vendida se descuenta automáticamente.",
    accent: "#34d399",
    surface: "rgba(52,211,153,.10)"
  },
  {
    icon: CircleDollarSign,
    title: "Caja",
    value: "+ $48.900 en efectivo",
    body: "El cobro queda registrado con la misma venta.",
    accent: "#f6b95b",
    surface: "rgba(246,185,91,.10)"
  },
  {
    icon: Check,
    title: "Historial",
    value: "Movimiento guardado",
    body: "Quedan fecha, usuario, producto y medio de pago.",
    accent: "#6ea8ff",
    surface: "rgba(110,168,255,.10)"
  },
  {
    icon: Cloud,
    title: "Tienda online",
    value: "11 unidades disponibles",
    body: "Si la integración está activa, el stock también se sincroniza.",
    accent: "#b989ff",
    surface: "rgba(185,137,255,.10)"
  }
];


export default function DownloadPage() {
  return (
    <PublicPage downloadBrand>
      <DownloadScrollNavigator />

      <main className="gs-storefront overflow-x-clip bg-[#070708]">
        <section
          id="download-hero"
          data-download-section
          className="relative scroll-mt-20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#070708_0%,#08090b_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[.11] [background-image:linear-gradient(rgba(255,255,255,.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.028)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />

          <div className="relative mx-auto grid min-h-[calc(100svh-68px)] w-full max-w-[1240px] items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.04fr_.96fr] lg:gap-16 lg:py-16">
            <div className="gs-hero-copy max-w-[680px]">
              <div className="flex items-center gap-4">
                <DownloadLogo className="h-[68px] w-[68px] shrink-0 sm:h-[74px] sm:w-[74px]" />
                <div>
                  <p className="text-sm font-semibold tracking-[-.02em] text-white/90">
                    Global Stock
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/38">
                    Ventas, stock, caja y gestión en un solo lugar
                  </p>
                </div>
              </div>

              <div className="mt-8 inline-flex min-h-8 items-center gap-2.5 rounded-full bg-white/[0.035] px-3 text-[11px] font-semibold text-white/48 ring-1 ring-white/[0.045]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.42)]" />
                Global Stock es gratis
              </div>

              <h1 className="mt-7 text-[clamp(3.4rem,6vw,6.8rem)] font-semibold leading-[.9] tracking-[-0.07em] text-white">
                Controlá tu negocio
                <span className="mt-2 block text-white/38">
                  desde un solo lugar.
                </span>
              </h1>

              <p className="mt-7 max-w-[620px] text-base leading-7 text-[#b4b4bc] sm:text-xl sm:leading-8">
                Global Stock reúne ventas, inventario, caja, compras, clientes,
                proveedores y análisis para que trabajes con menos pasos y más control.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3" id="instalar">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#8F0000] px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(143,0,0,.30)] transition-[background-color,transform,box-shadow] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-[#8F0000] hover:shadow-[0_18px_44px_rgba(143,0,0,.38)]"
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

            <div className="gs-hero-product relative mx-auto flex w-full min-w-0 items-center justify-center py-2 lg:py-0">
              <div className="absolute inset-x-[15%] bottom-[8%] h-24 rounded-full bg-red-600/10 blur-3xl" />
              <GlobalStockPhonePreview />
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
            <div className="grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
                  Cómo funciona
                </p>
                <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                  Una venta actualiza
                  <span className="block text-white/36">
                    stock, caja e historial.
                  </span>
                </h2>
              </div>

              <p className="max-w-2xl text-base leading-7 text-[#a8a8b0] sm:text-lg">
                Registrás el producto y el medio de pago una sola vez. Al confirmar,
                Global Stock descuenta la unidad, registra el cobro y guarda el movimiento.
                Si tu tienda online está conectada, también mantiene las existencias alineadas.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-[30px] bg-[#111217] shadow-[0_28px_76px_rgba(0,0,0,.24)]">
              <div className="grid lg:grid-cols-[1.03fr_.97fr]">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/30">
                        Ejemplo de venta
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-.04em]">
                        Venta #1048
                      </h3>
                    </div>

                    <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-emerald-500/10 px-3 text-[11px] font-semibold text-emerald-300">
                      <Check size={13} />
                      Confirmada
                    </span>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center justify-between gap-5 border-b border-white/[0.055] pb-5">
                      <div>
                        <p className="text-base font-semibold text-white/88">
                          Reel Shimano Sedona
                        </p>
                        <p className="mt-1 text-sm text-white/38">
                          1 unidad · SKU RS-2500
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-semibold text-white/88">
                        $ 48.900
                      </p>
                    </div>

                    <div className="grid gap-4 py-5 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/28">
                          Medio de pago
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white/76">
                          Efectivo
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/28">
                          Punto de venta
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white/76">
                          Caja principal
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-white/[0.055] pt-5">
                      <span className="text-sm text-white/42">Total cobrado</span>
                      <span className="text-2xl font-semibold tracking-[-.04em] text-white">
                        $ 48.900
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d0e12] p-6 sm:p-8 lg:border-l lg:border-white/[0.045]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/30">
                        Resultado de la venta
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-.035em] text-white/88">
                        Todo queda actualizado.
                      </h3>
                    </div>
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgba(143,0,0,.14)] text-[#8F0000]">
                      <ShoppingCart size={19} />
                    </span>
                  </div>

                  <div className="mt-5">
                    {flowItems.map(({ icon: Icon, title, value, body, accent, surface }, index) => (
                      <div
                        key={title}
                        className={
                          "grid grid-cols-[44px_1fr] gap-4 py-4 " +
                          (index > 0 ? "border-t border-white/[0.05]" : "")
                        }
                      >
                        <span
                          className="grid h-10 w-10 place-items-center rounded-xl"
                          style={{ background: surface, color: accent }}
                        >
                          <Icon size={17} />
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <h4 className="text-sm font-semibold text-white/82">
                              {title}
                            </h4>
                            <span className="text-xs font-semibold" style={{ color: accent }}>
                              {value}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-white/40">
                            {body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 border-t border-white/[0.05] pt-5 text-sm leading-6 text-white/38">
                    No tenés que volver a cargar la misma venta en cada módulo.
                  </p>
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
          <div className="relative mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6ea8ff]">
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#34d399]">
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
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/32">
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
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#8F0000] px-4 text-xs font-semibold text-white transition-[background-color,transform] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-[#8F0000]"
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
