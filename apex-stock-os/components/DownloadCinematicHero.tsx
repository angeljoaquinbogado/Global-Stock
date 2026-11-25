import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { InstallAppButton } from "./InstallAppButton";

const PLATFORMS = ["iPhone", "Android", "Windows", "Mac", "Web"];

// Retraso de entrada escalonado (CSS puro: no depende de hidratación ni afecta al LCP)
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * Hero de /download. Titular como texto real (nítido, traducible, accesible) sobre
 * una aurora roja lenta; el producto va enmarcado debajo. Estilos en app/download/redesign.css.
 */
export function DownloadCinematicHero() {
  return (
    <section
      id="download-hero"
      data-download-section
      data-testid="download-product-hero"
      aria-labelledby="download-product-hero-heading"
      className="gsd-hero relative scroll-mt-[68px] overflow-hidden"
    >
      <div className="gsd-aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="gsd-grid" aria-hidden="true" />

      <div className="gsd-hero__inner relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <p className="gsd-pill gsd-in" style={d(0)}>
          <span className="gsd-dot" aria-hidden="true" />
          Beta gratuita en Argentina
        </p>

        <h1 id="download-product-hero-heading" className="gsd-h1 gsd-in" style={d(80)}>
          <span className="sr-only">Global Stock — </span>
          <span className="gsd-h1__main">Control total.</span>{" "}
          <span className="gsd-h1__sub">Stock, ventas y caja en una sola app.</span>
        </h1>

        <p className="gsd-lead gsd-in" style={d(160)}>
          Controlá tus productos, las ventas y la caja desde el celular o la computadora.
        </p>

        <div className="gsd-actions gsd-in" style={d(240)}>
          <Link href="/" className="gsd-key">
            Abrir Global Stock
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <div className="gsd-install">
            <InstallAppButton language="es" />
          </div>
        </div>

        <ul className="gsd-platforms gsd-in" style={d(320)} aria-label="Disponible en">
          {PLATFORMS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <div className="gsd-stage">
          <img
            src="/download/global-stock-control-total.avif"
            alt="Global Stock en notebook y celular: panel de ventas, inventario y caja."
            width={1672}
            height={941}
            fetchPriority="high"
            sizes="(max-width: 767px) 100vw, 1100px"
            decoding="async"
            className="block h-auto w-full object-contain"
            data-testid="download-product-visual"
          />
        </div>

        <p className="gsd-trust">
          <ShieldCheck aria-hidden="true" size={14} />
          Acceso protegido por usuario y negocio · Interfaz ilustrativa, valores de ejemplo
        </p>
      </div>
    </section>
  );
}
