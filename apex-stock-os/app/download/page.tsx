import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDollarSign,
  Download,
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
    title: "Vendé",
    body: "Registrá la venta desde el punto de venta."
  },
  {
    icon: Boxes,
    title: "Actualizá",
    body: "El inventario se mueve en la misma operación."
  },
  {
    icon: CircleDollarSign,
    title: "Controlá",
    body: "Caja, actividad y márgenes quedan conectados."
  }
];

export default function DownloadPage() {
  return (
    <PublicPage>
      <DownloadScrollNavigator />

      <main className="overflow-x-clip bg-[#070708]">
        <section
          id="download-hero"
          data-download-section
          className="relative scroll-mt-20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(185,20,38,.22),transparent_26%),radial-gradient(circle_at_86%_62%,rgba(88,23,31,.16),transparent_31%),linear-gradient(180deg,#070708_0%,#09090a_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6d2530]/40 to-transparent" />
          <div className="pointer-events-none absolute inset-0 opacity-[.14] [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />

          <div className="relative mx-auto grid min-h-[calc(100svh-72px)] w-full max-w-[1240px] items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:py-16">
            <div className="max-w-[670px]">
              <div className="inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[.14em] text-white/38">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.45)]" />
                Disponible como aplicación web instalable
              </div>

              <h1 className="mt-7 text-[clamp(3.4rem,6vw,6.7rem)] font-semibold leading-[.9] tracking-[-0.07em] text-white">
                Gestioná el negocio.
                <span className="mt-2 block text-white/38">
                  No las planillas.
                </span>
              </h1>

              <p className="mt-7 max-w-[620px] text-base leading-7 text-white/54 sm:text-xl sm:leading-8">
                Global Stock conecta ventas, inventario, compras, proveedores,
                ecommerce, finanzas y gestión del equipo en una sola operación.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3" id="instalar">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#c91527] px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(201,21,39,.24)] transition hover:bg-[#df2033]"
                >
                  Abrir Global Stock
                  <ArrowRight size={15} />
                </Link>

                <InstallAppButton language="es" />
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/36">
                {[
                  "Punto de venta",
                  "Inventario conectado",
                  "Acceso por roles"
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-[#c91527]/12 text-[#f56b78]">
                      <Check size={10} />
                    </span>
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-9">
                <DownloadPlatformQuickTabs />
              </div>
            </div>

            <div className="relative mx-auto flex w-full min-w-0 items-center justify-center">
              <div className="absolute left-1/2 top-1/2 h-[78%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b51323]/12 blur-[90px]" />
              <div className="relative rounded-[44px] bg-[linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.008))] p-4 shadow-[0_40px_120px_rgba(0,0,0,.48)] ring-1 ring-[#3a1d22] sm:p-5">
                <GlobalStockPhonePreview />
              </div>
            </div>
          </div>
        </section>

        <section
          id="download-features"
          data-download-section
          className="scroll-mt-20 border-t border-[#211417] bg-[#09090a] text-white"
        >
          <DownloadMetricStrip />

          <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ed4c5c]">
                  Cómo funciona
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                  Una venta.
                  <span className="block text-white/34">
                    Todo se actualiza.
                  </span>
                </h2>
              </div>

              <p className="max-w-2xl text-base leading-7 text-white/48 sm:text-lg">
                El punto de venta no vive aislado. Cada movimiento puede quedar
                conectado con stock, caja, actividad y análisis para que no
                tengas que repetir información.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-[34px] bg-[#111113] shadow-[0_30px_80px_rgba(0,0,0,.30)] ring-1 ring-[#27171a]">
              <div className="grid lg:grid-cols-[1.12fr_.88fr]">
                <div className="relative min-h-[420px] overflow-hidden p-6 sm:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(201,21,39,.13),transparent_32%),linear-gradient(145deg,#111113,#0c0c0d)]" />

                  <div className="relative mx-auto max-w-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/28">
                          Punto de venta
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-.04em]">
                          Venta conectada
                        </h3>
                      </div>
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c91527]/12 text-[#f75c6b]">
                        <ShoppingCart size={20} />
                      </span>
                    </div>

                    <div className="mt-8 rounded-[26px] bg-[#09090a] p-5 ring-1 ring-[#25171a]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-white/78">
                          Producto agregado
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                          Stock disponible
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between rounded-2xl bg-white/[0.035] px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-white/78">
                              Venta registrada
                            </p>
                            <p className="mt-1 text-xs text-white/32">
                              Caja y actividad
                            </p>
                          </div>
                          <Check size={16} className="text-emerald-300" />
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-white/[0.035] px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-white/78">
                              Inventario actualizado
                            </p>
                            <p className="mt-1 text-xs text-white/32">
                              Sin carga duplicada
                            </p>
                          </div>
                          <Check size={16} className="text-emerald-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#211417] bg-[#0d0d0f] p-6 sm:p-8 lg:border-l lg:border-t-0">
                  <div className="space-y-7">
                    {flowItems.map(({ icon: Icon, title, body }, index) => (
                      <div key={title} className="grid grid-cols-[44px_1fr] gap-4">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.045] text-white/62">
                          <Icon size={18} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#ed4c5c]">
                              0{index + 1}
                            </span>
                            <h3 className="text-base font-semibold">{title}</h3>
                          </div>
                          <p className="mt-1.5 text-sm leading-6 text-white/42">
                            {body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/"
                    className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-white/72 transition hover:text-white"
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
          className="relative scroll-mt-20 overflow-hidden border-y border-[#211417] bg-[#080809]"
        >
          <div className="absolute right-[4%] top-[10%] h-72 w-72 rounded-full bg-[#c91527]/10 blur-[100px]" />

          <div className="relative mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ed4c5c]">
                Instalación
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Abrilo como una app.
                <span className="block text-white/34">
                  Sin cambiar cómo trabajás.
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/48">
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
                  className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-2 text-[10px] font-semibold text-white/34"
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
          className="scroll-mt-20 bg-[#0a0708]"
        >
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ed4c5c]">
                Seguridad y acceso
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Ver una tienda no es administrar una tienda.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/48">
                Global Stock separa información pública de conexiones privadas.
                Los datos sensibles y las acciones de administración requieren
                permisos explícitos.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/legal/security"
                  className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-white/90"
                >
                  Ver seguridad
                </Link>
                <Link
                  href="/legal/privacy"
                  className="inline-flex h-11 items-center rounded-xl bg-white/[0.045] px-4 text-xs font-semibold text-white/72 transition hover:bg-white/[0.07]"
                >
                  Privacidad
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] bg-[#111113] ring-1 ring-[#2a171b]">
              {[
                {
                  icon: Globe2,
                  title: "Información pública",
                  body: "Sirve para reconocer una tienda o catálogo."
                },
                {
                  icon: ShieldCheck,
                  title: "Conexión autorizada",
                  body: "Sincronizar o modificar datos privados requiere permiso."
                },
                {
                  icon: Boxes,
                  title: "Acceso por rol",
                  body: "Cada persona ve solo las herramientas que necesita."
                }
              ].map(({ icon: Icon, title, body }, index) => (
                <div
                  key={title}
                  className={
                    "grid grid-cols-[46px_1fr] gap-4 px-5 py-5 sm:px-6 " +
                    (index < 2 ? "border-b border-[#211417]" : "")
                  }
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c91527]/10 text-[#f05b69]">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/40">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div id="download-faq" data-download-section className="scroll-mt-20">
          <DownloadFAQ />
        </div>
      </main>
    </PublicPage>
  );
}
