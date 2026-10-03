import type { Metadata } from "next";
import Link from "next/link";
import {
  AppWindow,
  BrainCircuit,
  Boxes,
  CheckCircle2,
  Cloud,
  Download,
  Globe2,
  Laptop,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store
} from "lucide-react";

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

const features = [
  {
    icon: ShoppingCart,
    title: "Punto de venta",
    body: "Vendé desde mostrador, armá el carrito y actualizá stock en la misma operación."
  },
  {
    icon: Boxes,
    title: "Almacén",
    body: "Existencias, costos, precios, mínimos, códigos de barras y productos críticos."
  },
  {
    icon: Cloud,
    title: "Tienda online",
    body: "Conectá un ecommerce verificado y sincronizá catálogo, stock y precios con permisos controlados."
  },
  {
    icon: PackageSearch,
    title: "Reposición",
    body: "Priorizá qué comprar según cobertura, rotación, stock disponible y capital necesario."
  },
  {
    icon: BrainCircuit,
    title: "Global Intelligence",
    body: "Una IA contextual que puede trabajar con inventario, ventas, notas, pedidos y métricas reales del negocio."
  },
  {
    icon: ShieldCheck,
    title: "Permisos y seguridad",
    body: "Las conexiones privadas requieren autorización. Los secretos sensibles no se guardan como texto en el navegador."
  }
];

function StoreButton({
  title,
  subtitle,
  href,
  icon
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}) {
  if (!href) {
    return (
      <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left opacity-60">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.12em] text-white/38">
            Próximamente
          </span>
          <span className="block truncate text-sm font-semibold text-white">
            {title}
          </span>
          <span className="block truncate text-[10px] text-white/42">
            {subtitle}
          </span>
        </span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-[0.12em] text-white/42">
          Descargar en
        </span>
        <span className="block truncate text-sm font-semibold text-white">
          {title}
        </span>
        <span className="block truncate text-[10px] text-white/48">
          {subtitle}
        </span>
      </span>
    </a>
  );
}

export default function DownloadPage() {
  return (
    <PublicPage>
      <DownloadScrollNavigator />
      <main>
        <section id="download-hero" data-download-section className="relative scroll-mt-20 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(143,0,0,.24),transparent_28%),radial-gradient(circle_at_22%_18%,rgba(38,68,128,.18),transparent_26%)]" />
          <div className="relative mx-auto grid min-h-[76vh] w-full max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-xs font-semibold text-red-400">
                <Globe2 size={14} />
                Una operación, todos tus canales
              </span>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[.96] tracking-[-0.065em] sm:text-7xl">
                Tu negocio completo.
                <span className="block text-white/46">
                  En una sola app.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                Global Stock reúne ventas, almacén, ecommerce, reposición,
                proveedores, códigos de barras, comprobantes, agenda,
                cotizaciones e inteligencia operativa.
              </p>

              <div className="mt-8 flex flex-wrap gap-3" id="instalar">
                <InstallAppButton language="es" />
                <Link
                  href="/"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] px-5 text-sm font-semibold text-white"
                >
                  Abrir versión web
                </Link>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/40">
                La versión web instalable funciona como PWA. Las tiendas
                nativas se habilitarán cuando cada publicación esté aprobada.
              </p>
            </div>

            <div className="relative mx-auto flex w-full items-center justify-center py-4 lg:py-0">
              <GlobalStockPhonePreview />
            </div>
          </div>
        </section>

        <section id="download-features" data-download-section className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">
              Diseñado para operar
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              De un local chico a una operación multicanal.
            </h2>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10 text-red-500">
                  <Icon size={19} />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/52">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="download-install" data-download-section className="scroll-mt-20 border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">
                  Instalación
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                  Usala como app en casi cualquier dispositivo.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/56">
                  Global Stock ya funciona como aplicación web instalable.
                  Las publicaciones de tiendas nativas pueden convivir con
                  esta misma versión cuando estén aprobadas.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StoreButton
                  title="App Store"
                  subtitle="iPhone y iPad"
                  href={storeLinks.appStore}
                  icon={<Smartphone size={18} />}
                />
                <StoreButton
                  title="Google Play"
                  subtitle="Android"
                  href={storeLinks.playStore}
                  icon={<Smartphone size={18} />}
                />
                <StoreButton
                  title="Microsoft Store"
                  subtitle="Windows"
                  href={storeLinks.microsoftStore}
                  icon={<Laptop size={18} />}
                />
                <StoreButton
                  title="Huawei AppGallery"
                  subtitle="Huawei"
                  href={storeLinks.appGallery}
                  icon={<Smartphone size={18} />}
                />
                <StoreButton
                  title="Galaxy Store"
                  subtitle="Samsung Galaxy"
                  href={storeLinks.galaxyStore}
                  icon={<Smartphone size={18} />}
                />
                <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.055] px-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-400">
                    <Download size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Instalar desde la web</p>
                    <p className="text-[10px] text-white/45">
                      Disponible ahora como PWA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "iPhone / iPad",
                  body: "Abrí Global Stock en Safari, tocá Compartir y elegí “Agregar a pantalla de inicio”."
                },
                {
                  title: "Android",
                  body: "Abrí la app en Chrome. Usá “Instalar app” o “Agregar a pantalla principal” cuando aparezca."
                },
                {
                  title: "Windows 10 / 11",
                  body: "En Edge o Chrome usá el ícono Instalar de la barra de direcciones. Queda como una app independiente."
                },
                {
                  title: "Mac y otros equipos",
                  body: "Los navegadores compatibles pueden instalar la PWA. Si no ofrecen instalación, Global Stock sigue funcionando desde la web."
                }
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[22px] border border-white/10 p-4"
                >
                  <CheckCircle2 size={16} className="text-red-500" />
                  <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/50">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="download-security" data-download-section className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8">
          <div className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_85%_15%,rgba(143,0,0,.22),transparent_32%),#0B0B0D] p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">
                  Antes de operar
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                  Datos reales, permisos explícitos.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/56">
                  Una URL pública solo sirve para reconocer una tienda. Global
                  Stock exige una autorización adicional antes de leer datos
                  privados o modificar stock. Nunca usa datos demo para
                  presentarlos como información real de una tienda conectada.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/legal/security"
                  className="inline-flex min-h-11 items-center rounded-2xl border border-white/12 px-4 text-sm font-semibold"
                >
                  Seguridad
                </Link>
                <Link
                  href="/legal/privacy"
                  className="inline-flex min-h-11 items-center rounded-2xl border border-white/12 px-4 text-sm font-semibold"
                >
                  Privacidad
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
