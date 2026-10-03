import {
  BriefcaseBusiness,
  Building2,
  Factory,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Warehouse
} from "lucide-react";

const bySector = [
  {
    icon: Store,
    label: "Comercios y retail",
    body: "Caja, stock, códigos, clientes y sucursales.",
    accent: "#ff4d57"
  },
  {
    icon: UtensilsCrossed,
    label: "Gastronomía",
    body: "Compras, costos, caja, proveedores y equipo.",
    accent: "#f7b955"
  },
  {
    icon: ShoppingBag,
    label: "Ecommerce",
    body: "Catálogo, stock sincronizado y operación conectada.",
    accent: "#7aa2ff"
  },
  {
    icon: Warehouse,
    label: "Mayoristas y distribución",
    body: "Volumen, ubicaciones, compras y reposición.",
    accent: "#b28cff"
  },
  {
    icon: Factory,
    label: "Industria y fabricación",
    body: "Insumos, costos, existencias y trazabilidad.",
    accent: "#7dd3fc"
  }
];

const byBusiness = [
  {
    icon: BriefcaseBusiness,
    label: "Autónomos",
    body: "Una operación simple que puede crecer.",
    accent: "#4fd39a"
  },
  {
    icon: Building2,
    label: "Pymes",
    body: "Más responsables, roles y procesos conectados.",
    accent: "#ff7c9c"
  },
  {
    icon: BriefcaseBusiness,
    label: "Asesorías y estudios contables",
    body: "Clientes, documentos, finanzas, agenda y seguimiento.",
    accent: "#67e8f9"
  }
];

function SectorList({
  title,
  items
}: {
  title: string;
  items: typeof bySector;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/34">
        {title}
      </p>

      <div className="mt-4 grid gap-2">
        {items.map(({ icon: Icon, label, body, accent }) => (
          <div
            key={label}
            className="grid grid-cols-[42px_1fr] items-center gap-3 rounded-2xl border border-[#2b1b1e] bg-white/[0.03] px-3.5 py-3.5"
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{
                background: accent + "18",
                color: accent
              }}
            >
              <Icon size={17} />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/84">{label}</p>
              <p className="mt-1 text-xs leading-5 text-white/40">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DownloadSectorShowcase() {
  return (
    <section className="border-t border-[#24171a] bg-[#0b0b0c] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
            Sectores
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Distintos negocios.
            <span className="block text-white/36">La misma base conectada.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/52">
            Global Stock no obliga a trabajar igual a todos. La operación se
            organiza según el tipo de negocio y las funciones que realmente usa.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <SectorList title="Por sector" items={bySector} />
          <SectorList title="Por tipo de negocio" items={byBusiness as typeof bySector} />
        </div>
      </div>
    </section>
  );
}
