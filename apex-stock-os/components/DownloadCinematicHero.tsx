import Link from "next/link";
import { ArrowRight, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { InstallAppButton } from "./InstallAppButton";

/**
 * Single product photograph approved for Global Stock's download landing.
 *
 * This intentionally replaces the old four-scene scroll storytelling,
 * animated floating metrics, rotating phone and scene-dot slider.
 * The hero is a normal document section so scrolling, anchors, mobile
 * controls and the rest of the public site behave predictably.
 */
export function DownloadCinematicHero() {
  return (
    <section
      id="download-hero"
      data-download-section
      data-testid="download-product-hero"
      className="gs-product-hero relative scroll-mt-[68px] overflow-hidden"
      aria-labelledby="download-product-hero-heading"
    >
      <div className="gs-product-hero__inner mx-auto w-full max-w-none px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-5 lg:px-8 lg:pb-12">
        <h1 id="download-product-hero-heading" className="sr-only">
          Global Stock — Control total. Stock, ventas y caja en una sola app.
        </h1>

        <div className="gs-product-hero__frame relative isolate mx-auto overflow-hidden rounded-[20px] border sm:rounded-[26px]">
          <picture>
            <source
              media="(min-width: 768px)"
              srcSet="/download/global-stock-control-total-4k.webp"
              type="image/webp"
            />
            <source srcSet="/download/global-stock-control-total.avif" type="image/avif" />
            <img
              src="/download/global-stock-control-total.webp"
              alt="Global Stock, Control total: notebook y celular mostrando ejemplos del panel de ventas, inventario y caja de la aplicación."
              width={1672}
              height={941}
              fetchPriority="high"
              sizes="(max-width: 767px) 100vw, calc(100vw - 64px)"
              decoding="async"
              className="gs-product-hero__art block h-auto w-full object-contain"
              data-testid="download-product-visual"
            />
          </picture>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10"
          />
        </div>

        <div className="gs-product-hero__actions mx-auto mt-5 flex flex-col items-center justify-between gap-5 sm:mt-6 sm:flex-row">
          <div className="max-w-xl text-center sm:text-left">
            <p className="mb-4 text-[clamp(1.95rem,8vw,2.75rem)] font-bold leading-[.98] tracking-[-.06em] sm:hidden">
              Global Stock
              <span className="mt-1 block font-normal italic text-[#8F0000]">Control total</span>
            </p>
            <p className="gs-product-hero__eyebrow inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em]">
              <MonitorSmartphone aria-hidden="true" size={15} />
              Global Stock · Aplicación multiplataforma
            </p>
            <p className="gs-product-hero__tagline mt-2 text-sm leading-6 sm:text-[15px]">
              Controlá tus productos, las ventas y la caja desde el celular o la computadora.
            </p>
            <p className="gs-product-hero__demo mt-1 text-[11px]">
              Interfaz ilustrativa · Los valores mostrados son de ejemplo.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end">
            <Link
              href="/"
              className="gs-download-primary-action inline-flex h-12 min-w-[172px] items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-5 text-[13px] font-semibold text-white shadow-[0_14px_32px_rgba(143,0,0,.2)] transition-[transform,background-color] duration-200 hover:bg-[#A30014] active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8F0000]"
            >
              Abrir Global Stock
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <div className="gs-product-hero__install">
              <InstallAppButton language="es" />
            </div>
          </div>
        </div>
        <p className="gs-product-hero__trust mt-5 flex items-center justify-center gap-2 text-center text-[11px]">
          <ShieldCheck aria-hidden="true" size={14} />
          Beta gratuita en Argentina · Acceso protegido por usuario y negocio
        </p>
      </div>
    </section>
  );
}
