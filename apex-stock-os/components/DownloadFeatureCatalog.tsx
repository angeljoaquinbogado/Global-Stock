import {
  BarChart3,
  Boxes,
  BrainCircuit,
  CircleDollarSign,
  FileText,
  PackagePlus,
  ShieldCheck,
  ShoppingCart,
  Target,
  Truck,
  UsersRound
} from "lucide-react";
import Link from "next/link";

const groups = [
  {
    number: "01",
    title: "Ventas e inventario",
    body:
      "Vendé, cobrá y actualizá existencias sin duplicar movimientos ni saltar entre herramientas.",
    icon: ShoppingCart,
    accent: "#ff5b67",
    surface: "rgba(255,91,103,.11)",
    items: ["Punto de venta", "Stock y códigos", "Historial de actividad"]
  },
  {
    number: "02",
    title: "Compras y abastecimiento",
    body:
      "Detectá faltantes, ordená reposición y mantené proveedores y compras conectados con el inventario.",
    icon: PackagePlus,
    accent: "#f5b84b",
    surface: "rgba(245,184,75,.11)",
    items: ["Reposición", "Proveedores", "Compras y ubicaciones"]
  },
  {
    number: "03",
    title: "Gestión del negocio",
    body:
      "Clientes, documentos, finanzas, proyectos y equipo trabajan sobre la misma operación.",
    icon: CircleDollarSign,
    accent: "#5fa7ff",
    surface: "rgba(95,167,255,.11)",
    items: ["CRM y clientes", "Finanzas y documentos", "Equipo y sucursales"]
  },
  {
    number: "04",
    title: "Análisis e inteligencia",
    body:
      "Leé márgenes, tendencias y salud del stock con una IA que entiende el contexto disponible del negocio.",
    icon: BrainCircuit,
    accent: "#b886ff",
    surface: "rgba(184,134,255,.11)",
    items: ["Gráficos", "Global Intelligence", "Roles y control"]
  }
];

const supportingIcons = [Boxes, Truck, Target, FileText, BarChart3, UsersRound, ShieldCheck];

export function DownloadFeatureCatalog() {
  return (
    <section className="border-t border-[#211417] bg-[#080809] text-white">
      <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ed4c5c]">
            Funcionalidades
          </p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Todo el negocio.
            <span className="block text-white/34">Bien agrupado.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/46">
            Las herramientas se organizan por trabajo real: vender, abastecer,
            gestionar y decidir. Sin llenar la pantalla de módulos que compiten
            por atención.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/72 transition hover:text-white"
          >
            Explorar la aplicación
            <span aria-hidden="true">→</span>
          </Link>

          <div className="mt-10 flex max-w-sm flex-wrap gap-2">
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
          {groups.map(({ number, title, body, icon: Icon, accent, surface, items }, index) => (
            <article
              key={title}
              className={
                "grid gap-5 py-8 sm:grid-cols-[56px_1fr] sm:gap-6 " +
                (index === 0 ? "pt-0" : "border-t border-[#211417]")
              }
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl"
                style={{ background: surface, color: accent }}
              >
                <Icon size={20} />
              </span>

              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-bold tracking-[.16em]"
                    style={{ color: accent }}
                  >
                    {number}
                  </span>
                  <h3 className="text-2xl font-semibold tracking-[-.04em] sm:text-3xl">
                    {title}
                  </h3>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/44 sm:text-base sm:leading-7">
                  {body}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                  {items.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 text-xs font-medium text-white/54"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
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
