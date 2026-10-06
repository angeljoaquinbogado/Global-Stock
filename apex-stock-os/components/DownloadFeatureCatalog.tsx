import {
  BarChart3,
  Boxes,
  BrainCircuit,
  CircleDollarSign,
  FileText,
  PackagePlus,
  ShoppingCart,
  Target,
  Truck,
  UsersRound
} from "lucide-react";
import Link from "next/link";

const groups = [
  {
    title: "Ventas e inventario",
    kicker: "Operación diaria",
    body:
      "Vendé, cobrá y actualizá existencias sin duplicar movimientos ni saltar entre herramientas.",
    icon: ShoppingCart,
    accent: "#8F0000",
    surface: "rgba(143,0,0,.12)",
    items: ["Punto de venta", "Stock y códigos", "Historial de actividad"]
  },
  {
    title: "Compras y abastecimiento",
    kicker: "Reposición",
    body:
      "Detectá faltantes, ordená reposición y mantené proveedores y compras conectados con el inventario.",
    icon: PackagePlus,
    accent: "#f6b95b",
    surface: "rgba(246,185,91,.10)",
    items: ["Reposición inteligente", "Proveedores", "Compras y ubicaciones"]
  },
  {
    title: "Gestión del negocio",
    kicker: "Administración",
    body:
      "Clientes, documentos, finanzas, proyectos y equipo trabajan sobre la misma operación.",
    icon: CircleDollarSign,
    accent: "#6ea8ff",
    surface: "rgba(110,168,255,.10)",
    items: ["CRM y clientes", "Finanzas y documentos", "Equipo y sucursales"]
  },
  {
    title: "Análisis e inteligencia",
    kicker: "Decisiones",
    body:
      "Leé márgenes, tendencias y salud del stock con una IA que entiende el contexto disponible del negocio.",
    icon: BrainCircuit,
    accent: "#b989ff",
    surface: "rgba(185,137,255,.10)",
    items: ["Gráficos", "Global Intelligence", "Roles y control"]
  }
];

const supportingIcons = [
  Boxes,
  Truck,
  Target,
  FileText,
  BarChart3,
  UsersRound
];

export function DownloadFeatureCatalog() {
  return (
    <section className="border-t border-white/[0.045] bg-[#08090b] text-white">
      <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="gs-download-kicker text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
            Qué incluye
          </p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Todo para operar.
            <span className="block text-white/34">Sin saltar entre sistemas.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#a8a8b0]">
            Global Stock concentra ventas, stock, compras, clientes, finanzas,
            equipo e inteligencia para que la operación quede conectada en un solo lugar.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/72 transition-colors duration-150 hover:text-white"
          >
            Explorar la aplicación
            <span aria-hidden="true">→</span>
          </Link>

          <div className="mt-9 flex max-w-sm flex-wrap gap-2">
            {supportingIcons.map((Icon, index) => (
              <span
                key={index}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.035] text-white/30"
              >
                <Icon size={15} />
              </span>
            ))}
          </div>
        </div>

        <div>
          {groups.map(({ title, kicker, body, icon: Icon, accent, surface, items }, index) => (
            <article
              key={title}
              data-feature-group={title === "Análisis e inteligencia" ? "intelligence" : undefined}
              className={
                "gs-download-feature-group grid gap-5 py-9 sm:grid-cols-[58px_1fr] sm:gap-7 " +
                (index === 0 ? "pt-0" : "border-t border-white/[0.045]")
              }
            >
              <span
                className="gs-download-feature-icon grid h-12 w-12 place-items-center rounded-2xl"
                style={{ background: surface, color: accent }}
              >
                <Icon size={20} />
              </span>

              <div>
                <p
                  className="gs-download-kicker gs-download-feature-kicker text-[10px] font-bold uppercase tracking-[.15em] text-[#8F0000]"
                  style={{ color: "#8F0000" }}
                >
                  {kicker}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-.04em] sm:text-3xl">
                  {title}
                </h3>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a0a0a9] sm:text-base sm:leading-7">
                  {body}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                  {items.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 text-xs font-medium text-white/58"
                    >
                      <span
                        className="gs-download-feature-dot h-1.5 w-1.5 rounded-full"
                        style={{ background: accent }}
                      />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}