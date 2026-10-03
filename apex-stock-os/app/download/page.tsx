import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  Check,
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
import { DownloadPricing } from "@/components/DownloadPricing";
import { DownloadSectorShowcase } from "@/components/DownloadSectorShowcase";
import { DownloadScrollNavigator } from "@/components/DownloadScrollNavigator";
import { GlobalStockPhonePreview } from "@/components/GlobalStockPhonePreview";
import { InstallAppButton } from "@/components/InstallAppButton";
import { PublicPage } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "Global Stock — Gestión conectada para cualquier negocio",
  description:
    "Stock, ventas, tienda online, reposición, proveedores, códigos de barras e inteligencia operativa desde una sola plataforma."
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

const coreStories = [
  {
    icon: ShoppingCart,
    eyebrow: "Vendé",
    title: "Cobrá y actualizá stock en la misma operación.",
    body:
      "Punto de venta, medios de pago y movimientos de inventario conectados.",
    accent: "#ff4d57",
    surface: "rgba(255,77,87,.10)"
  },
  {
    icon: Boxes,
    eyebrow: "Controlá",
    title: "Inventario, compras y proveedores sin perder contexto.",
    body:
      "Stock, mínimos, códigos, reposición y abastecimiento en un mismo flujo.",
    accent: "#4fd39a",
    surface: "rgba(79,211,154,.10)"
  },
  {
    icon: BrainCircuit,
    eyebrow: "Decidí",
    title: "Gráficos, finanzas e IA para entender qué hacer después.",
    body:
      "Márgenes, tendencias, actividad y Global Intelligence con contexto del negocio.",
    accent: "#b28cff",
    surface: "rgba(178,140,255,.10)"
  }
];

export default function DownloadPage() {
  return (
    <PublicPage>
      <DownloadScrollNavigator />

      <main className="overflow-x-clip">
        <section
          id="download-hero"
          data-download-section
          className="relative scroll-mt-20 overflow-hidden border-b border-white/8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(153,27,27,.30),transparent_30%),radial-gradient(circle_at_15%_25%,rgba(52,92,180,.18),transparent_25%),linear-gradient(180deg,#050506_0%,#080708_70%,#050506_100%)]" />
          <div className="absolute left-[7%] top-[22%] h-24 w-24 rounded-full bg-[#4f7dff]/10 blur-3xl" />
          <div className="absolute right-[12%] top-[10%] h-40 w-40 rounded-full bg-red-600/10 blur-3xl" />

          <div className="relative mx-auto grid min-h-[calc(100svh-64px)] w-full max-w-[1380px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-12 lg:py-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-2 text-xs font-semibold text-white/72 shadow-[0_10px_30px_rgba(0,0,0,.18)]">
                <Sparkles size={14} className="text-red-400" />
                Gestión clara para una operación real
              </span>

              <h1 className="mt-6 max-w-4xl text-[clamp(3.4rem,7vw,7.4rem)] font-semibold leading-[.88] tracking-[-0.072em]">
                Todo tu negocio.
                <span className="mt-2 block bg-[linear-gradient(90deg,#ffffff_0%,#d6d6d6_46%,#8d8d92_100%)] bg-clip-text text-transparent">
                  Sin perderte.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-white/62 sm:text-xl sm:leading-8">
                Ventas, stock, ecommerce, reposición, proveedores e
                inteligencia operativa en una interfaz pensada para entender
                rápido qué está pasando y qué hacer después.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3" id="instalar">
                <InstallAppButton language="es" />
                <a
                  href="#download-features"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.055] px-5 text-xs font-semibold text-white transition hover:bg-white/[0.09]"
                >
                  Ver cómo funciona
                </a>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-xl px-3 text-xs font-semibold text-white/52 transition hover:text-white"
                >
                  Abrir versión web →
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/44">
                {[
                  "Instalable ahora como PWA",
                  "Funciona en navegador",
                  "Permisos por rol"
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/12 text-emerald-400">
                      <Check size={10} />
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto flex w-full min-w-0 items-center justify-center py-2 lg:py-0">
              <div className="absolute inset-x-[15%] bottom-[8%] h-24 rounded-full bg-red-600/10 blur-3xl" />
              <GlobalStockPhonePreview />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-5 pb-9 sm:px-8">
            <DownloadPlatformQuickTabs />
          </div>
        </section>

        <section
          id="download-features"
          data-download-section
          className="scroll-mt-20 border-t border-white/[0.06] bg-[#0a0a0c] text-white"
        >
          <DownloadMetricStrip />

          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
                Producto
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Tres cosas. Todo conectado.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
                Primero entendé qué hace Global Stock. Después, si querés,
                bajamos al detalle de cada módulo.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {coreStories.map(({ icon: Icon, eyebrow, title, body, accent, surface }) => (
                <article
                  key={title}
                  className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[#111114] p-6 shadow-[0_20px_60px_rgba(0,0,0,.22)] sm:p-7"
                >
                  <div
                    className="absolute right-[-18%] top-[-20%] h-44 w-44 rounded-full blur-3xl"
                    style={{ background: surface }}
                  />

                  <div className="relative">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-2xl"
                      style={{ background: surface, color: accent }}
                    >
                      <Icon size={20} />
                    </span>

                    <p
                      className="mt-6 text-[11px] font-bold uppercase tracking-[.14em]"
                      style={{ color: accent }}
                    >
                      {eyebrow}
                    </p>

                    <h3 className="mt-3 text-2xl font-semibold leading-[1.04] tracking-[-.04em]">
                      {title}
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-white/46">
                      {body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div id="download-feature-catalog" data-download-section className="scroll-mt-20">
          <DownloadFeatureCatalog />
        </div>

        <div id="download-sectors" data-download-section className="scroll-mt-20">
          <DownloadSectorShowcase />
        </div>

        <div id="download-pricing" data-download-section className="scroll-mt-20">
          <DownloadPricing />
        </div>

        <section
          id="download-install"
          data-download-section
          className="relative scroll-mt-20 overflow-hidden border-y border-white/8 bg-[#080809]"
        >
          <div className="absolute left-[8%] top-[14%] h-64 w-64 rounded-full bg-blue-600/8 blur-3xl" />
          <div className="absolute right-[8%] bottom-[10%] h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />

          <div className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
                Instalar Global Stock
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Elegí tu dispositivo.
                <span className="block text-white/38">
                  El camino cambia, la app no.
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/54">
                Probá la instalación real de la PWA ahora. Las tiendas nativas
                se muestran como disponibles únicamente cuando exista una
                publicación aprobada.
              </p>
            </div>

            <div className="mt-12">
              <DownloadInstallShowcase
                appStoreUrl={storeLinks.appStore}
                playStoreUrl={storeLinks.playStore}
                microsoftStoreUrl={storeLinks.microsoftStore}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                ["Huawei AppGallery", Boolean(storeLinks.appGallery)],
                ["Galaxy Store", Boolean(storeLinks.galaxyStore)]
              ].map(([name, active]) => (
                <span
                  key={String(name)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold text-white/40"
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
          className="scroll-mt-20 bg-[#140808]"
        >
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/8 px-3 py-2 text-xs font-semibold text-red-300">
                  <ShieldCheck size={14} />
                  Permisos explícitos
                </span>
                <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl">
                  Una URL no es una autorización.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/58">
                  Global Stock puede reconocer información pública de una web,
                  pero exige una autorización adicional antes de consultar o
                  modificar datos privados del negocio.
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
                    className="inline-flex h-11 items-center rounded-xl border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold text-white"
                  >
                    Privacidad
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: Globe2,
                    title: "Datos públicos",
                    body: "Sirven para reconocer una tienda, no para administrar su negocio."
                  },
                  {
                    icon: ShieldCheck,
                    title: "Conexión verificada",
                    body: "La sincronización privada requiere permisos adicionales."
                  },
                  {
                    icon: BarChart3,
                    title: "Información clara",
                    body: "Métricas y estados visibles sin llenar cada pantalla de controles."
                  },
                  {
                    icon: Boxes,
                    title: "Acceso por rol",
                    body: "Cada perfil recibe una navegación y un nivel de detalle diferente."
                  }
                ].map(({ icon: Icon, title, body }) => (
                  <article
                    key={title}
                    className="rounded-[24px] border border-red-200/10 bg-white/[0.045] p-5"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-400/10 text-red-300">
                      <Icon size={18} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/48">{body}</p>
                  </article>
                ))}
              </div>
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
