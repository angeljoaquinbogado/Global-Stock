import {
  BarChart3,
  Boxes,
  BrainCircuit,
  CircleDollarSign,
  Cloud,
  FileText,
  PackagePlus,
  ShieldCheck,
  ShoppingCart,
  Target,
  Truck,
  UsersRound
} from "lucide-react";

const groups = [
  {
    eyebrow: "Operación",
    title: "Vendé y mové stock sin cambiar de sistema.",
    body:
      "Todo lo que pasa en el mostrador impacta en inventario, caja y actividad.",
    icon: ShoppingCart,
    accent: "#ff4d57",
    surface: "rgba(255,77,87,.10)",
    features: [
      { icon: ShoppingCart, label: "Punto de venta" },
      { icon: Boxes, label: "Inventario" },
      { icon: ShieldCheck, label: "Pagos y permisos" }
    ]
  },
  {
    eyebrow: "Abastecimiento",
    title: "Compras, proveedores y reposición en una sola vista.",
    body:
      "Detectá faltantes, priorizá compras y seguí de dónde viene cada producto.",
    icon: PackagePlus,
    accent: "#f7b955",
    surface: "rgba(247,185,85,.10)",
    features: [
      { icon: PackagePlus, label: "Reposición inteligente" },
      { icon: Truck, label: "Proveedores" },
      { icon: Cloud, label: "Tienda online" }
    ]
  },
  {
    eyebrow: "Gestión",
    title: "Clientes, documentos, finanzas y equipo conectados.",
    body:
      "La operación no termina en el stock: Global Stock también ordena el trabajo del negocio.",
    icon: CircleDollarSign,
    accent: "#7aa2ff",
    surface: "rgba(122,162,255,.10)",
    features: [
      { icon: Target, label: "CRM y proyectos" },
      { icon: FileText, label: "Comprobantes y agenda" },
      { icon: UsersRound, label: "Equipo y sucursales" }
    ]
  },
  {
    eyebrow: "Decisiones",
    title: "Entendé qué está pasando antes de actuar.",
    body:
      "Gráficos, márgenes, salud de stock e inteligencia operativa con contexto del negocio.",
    icon: BrainCircuit,
    accent: "#b28cff",
    surface: "rgba(178,140,255,.10)",
    features: [
      { icon: BarChart3, label: "Analítica" },
      { icon: BrainCircuit, label: "Global Intelligence" },
      { icon: ShieldCheck, label: "Roles y control" }
    ]
  }
];

export function DownloadFeatureCatalog() {
  return (
    <section className="border-t border-white/[0.06] bg-[#08080a] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
            Funcionalidades
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Mucho más que stock.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/52 sm:text-lg">
            En vez de mostrarte veinte controles juntos, agrupamos todo por el
            trabajo que realmente hacés durante el día.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {groups.map(({ eyebrow, title, body, icon: Icon, accent, surface, features }) => (
            <article
              key={title}
              className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[#111114] p-6 shadow-[0_20px_60px_rgba(0,0,0,.22)] sm:p-8"
            >
              <div
                className="absolute right-[-10%] top-[-22%] h-52 w-52 rounded-full blur-3xl"
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

                <h3 className="mt-3 max-w-xl text-2xl font-semibold leading-[1.04] tracking-[-.04em] sm:text-3xl">
                  {title}
                </h3>

                <p className="mt-4 max-w-xl text-sm leading-6 text-white/48">
                  {body}
                </p>

                <div className="mt-7 grid gap-2 sm:grid-cols-3">
                  {features.map(({ icon: FeatureIcon, label }) => (
                    <div
                      key={label}
                      className="flex min-h-20 flex-col justify-between rounded-2xl border border-white/8 bg-black/20 p-3.5"
                    >
                      <FeatureIcon size={16} className="text-white/38" />
                      <p className="mt-4 text-xs font-semibold leading-5 text-white/70">
                        {label}
                      </p>
                    </div>
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
