import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  Check,
  Cloud,
  Download,
  Globe2,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Sparkles
} from "lucide-react";

import {
  DownloadInstallShowcase,
  DownloadPlatformQuickTabs
} from "@/components/DownloadInstallShowcase";
import { DownloadMetricStrip } from "@/components/DownloadMetricStrip";
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

const productCards = [
  {
    icon: ShoppingCart,
    eyebrow: "Punto de venta",
    title: "Vendé y descontá stock en la misma operación.",
    body:
      "Carrito, medio de pago, cantidades y total sin saltar entre pantallas.",
    accent: "#ff4650",
    surface: "rgba(255,70,80,.10)",
    metric: "Caja + stock",
    detail: "Una sola acción"
  },
  {
    icon: Boxes,
    eyebrow: "Inventario",
    title: "Sabé qué tenés y qué falta antes de quedarte sin stock.",
    body:
      "Existencias, mínimos, códigos, costos, precios y productos críticos en una sola vista.",
    accent: "#4fd39a",
    surface: "rgba(79,211,154,.10)",
    metric: "Stock crítico",
    detail: "Alertas claras"
  },
  {
    icon: BrainCircuit,
    eyebrow: "Global Intelligence",
    title: "Preguntale a tu negocio, no a una demo genérica.",
    body:
      "La IA trabaja con el contexto de inventario, ventas, actividad, notas y métricas reales.",
    accent: "#a78bfa",
    surface: "rgba(167,139,250,.11)",
    metric: "Contexto real",
    detail: "Respuestas útiles"
  },
  {
    icon: Cloud,
    eyebrow: "Tienda online",
    title: "Conectá ecommerce sin confundir datos públicos con acceso privado.",
    body:
      "Catálogo público para detectar y autorización adicional para sincronizar stock o datos sensibles.",
    accent: "#6ea8ff",
    surface: "rgba(110,168,255,.10)",
    metric: "Conexiones",
    detail: "Con permisos"
  },
  {
    icon: PackageSearch,
    eyebrow: "Reposición",
    title: "Comprá primero lo que más riesgo tiene de faltar.",
    body:
      "Cobertura, mínimos y prioridad de reposición para decidir qué mover antes.",
    accent: "#f7b955",
    surface: "rgba(247,185,85,.10)",
    metric: "Prioridad",
    detail: "Menos quiebres"
  },
  {
    icon: ShieldCheck,
    eyebrow: "Permisos",
    title: "Cada persona ve lo que necesita para trabajar.",
    body:
      "Dueño, administración, caja, depósito y control con accesos distintos y datos sensibles protegidos.",
    accent: "#ff7c9c",
    surface: "rgba(255,124,156,.10)",
    metric: "Roles",
    detail: "Menos ruido"
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
          className="scroll-mt-20 bg-[#f2f0ec] text-[#101012]"
        >
          <DownloadMetricStrip />
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a80000]">
                Producto
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Cada módulo tiene que explicar solo lo que importa.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-black/55 sm:text-lg">
                Menos botones compitiendo entre sí, números que se leen de un
                vistazo y una jerarquía visual clara para trabajar sin buscar
                funciones escondidas.
              </p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-2">
              {productCards.map(
                ({ icon: Icon, eyebrow, title, body, accent, surface, metric, detail }, index) => (
                  <article
                    key={title}
                    className={
                      "relative overflow-hidden rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_18px_55px_rgba(24,24,27,.06)] sm:p-8 " +
                      (index === 0 || index === 2 ? "lg:min-h-[360px]" : "")
                    }
                  >
                    <div
                      className="absolute right-[-8%] top-[-16%] h-48 w-48 rounded-full blur-3xl"
                      style={{ background: surface }}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-5">
                        <span
                          className="grid h-12 w-12 place-items-center rounded-2xl"
                          style={{ background: surface, color: accent }}
                        >
                          <Icon size={21} />
                        </span>

                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-black/32">
                            {metric}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-black/72">
                            {detail}
                          </p>
                        </div>
                      </div>

                      <p
                        className="mt-7 text-xs font-bold uppercase tracking-[.14em]"
                        style={{ color: accent }}
                      >
                        {eyebrow}
                      </p>
                      <h3 className="mt-3 max-w-xl text-2xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-3xl">
                        {title}
                      </h3>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-black/52">
                        {body}
                      </p>

                      <div className="mt-7 rounded-[22px] border border-black/8 bg-[#f8f7f4] p-4">
                        {eyebrow === "Punto de venta" && (
                          <div className="grid grid-cols-[1fr_auto] gap-3">
                            <div className="space-y-2">
                              <div className="h-2.5 w-28 rounded-full bg-black/12" />
                              <div className="h-2.5 w-20 rounded-full bg-black/8" />
                            </div>
                            <div className="rounded-xl bg-[#8F0000] px-4 py-2 text-xs font-semibold text-white">
                              Cobrar
                            </div>
                          </div>
                        )}

                        {eyebrow === "Inventario" && (
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              ["1.248", "unidades"],
                              ["12", "alertas"],
                              ["31%", "margen"]
                            ].map(([value, label]) => (
                              <div key={label} className="rounded-xl bg-white p-3">
                                <p className="text-lg font-semibold">{value}</p>
                                <p className="mt-1 text-[10px] text-black/38">{label}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {eyebrow === "Global Intelligence" && (
                          <div className="space-y-2">
                            <div className="max-w-[78%] rounded-2xl bg-white px-3 py-2 text-xs text-black/54">
                              ¿Qué debería reponer esta semana?
                            </div>
                            <div className="ml-auto max-w-[86%] rounded-2xl bg-[#8F0000] px-3 py-2 text-xs text-white">
                              Priorizaría los productos con menor cobertura y mayor rotación.
                            </div>
                          </div>
                        )}

                        {eyebrow === "Tienda online" && (
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold">Sitio detectado</p>
                              <p className="mt-1 text-[10px] text-black/38">
                                Datos públicos
                              </p>
                            </div>
                            <span className="rounded-full bg-blue-500/10 px-3 py-1.5 text-[10px] font-semibold text-blue-600">
                              Verificar conexión
                            </span>
                          </div>
                        )}

                        {eyebrow === "Reposición" && (
                          <div className="space-y-2">
                            {[84, 61, 38].map((width, row) => (
                              <div key={row} className="flex items-center gap-3">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/6">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: width + "%", background: accent }}
                                  />
                                </div>
                                <span className="text-[10px] font-semibold text-black/38">
                                  {width}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {eyebrow === "Permisos" && (
                          <div className="grid grid-cols-3 gap-2">
                            {["Dueño", "Caja", "Depósito"].map((role, roleIndex) => (
                              <div
                                key={role}
                                className="rounded-xl bg-white px-3 py-3 text-center"
                              >
                                <span
                                  className="mx-auto grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold"
                                  style={{ background: surface, color: accent }}
                                >
                                  {roleIndex + 1}
                                </span>
                                <p className="mt-2 text-[10px] font-semibold">{role}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

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
      </main>
    </PublicPage>
  );
}
