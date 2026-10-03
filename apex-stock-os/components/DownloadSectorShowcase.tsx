"use client";

import {
  BriefcaseBusiness,
  Building2,
  Factory,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Warehouse
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const sectors = [
  {
    id: "retail",
    icon: Store,
    label: "Comercios",
    group: "Sector",
    title: "Vendé y controlá stock sin separar caja e inventario.",
    body: "Punto de venta, códigos, clientes, sucursales y stock conectados.",
    accent: "#ff4d57",
    surface: "rgba(255,77,87,.10)"
  },
  {
    id: "gastronomy",
    icon: UtensilsCrossed,
    label: "Gastronomía",
    group: "Sector",
    title: "Compras, costos y caja con una operación más ordenada.",
    body: "Proveedores, gastos, equipo y movimientos diarios en el mismo lugar.",
    accent: "#f7b955",
    surface: "rgba(247,185,85,.10)"
  },
  {
    id: "ecommerce",
    icon: ShoppingBag,
    label: "Ecommerce",
    group: "Sector",
    title: "Conectá la tienda online con el stock del negocio.",
    body: "Catálogo, existencias y actividad sincronizados con permisos claros.",
    accent: "#7aa2ff",
    surface: "rgba(122,162,255,.10)"
  },
  {
    id: "wholesale",
    icon: Warehouse,
    label: "Distribución",
    group: "Sector",
    title: "Manejá volumen, compras y ubicaciones sin perder trazabilidad.",
    body: "Reposición, proveedores, stock y sucursales pensados para movimiento constante.",
    accent: "#b28cff",
    surface: "rgba(178,140,255,.10)"
  },
  {
    id: "industry",
    icon: Factory,
    label: "Industria",
    group: "Sector",
    title: "Seguí insumos, costos y existencias desde una misma base.",
    body: "Una estructura preparada para controlar inventario y abastecimiento.",
    accent: "#7dd3fc",
    surface: "rgba(125,211,252,.10)"
  },
  {
    id: "solo",
    icon: BriefcaseBusiness,
    label: "Autónomos",
    group: "Tipo de negocio",
    title: "Una operación simple que puede crecer cuando la necesites.",
    body: "Ventas, stock, agenda y control sin cargar la pantalla de herramientas innecesarias.",
    accent: "#4fd39a",
    surface: "rgba(79,211,154,.10)"
  },
  {
    id: "smb",
    icon: Building2,
    label: "Pymes",
    group: "Tipo de negocio",
    title: "Más responsables, roles y procesos trabajando sobre los mismos datos.",
    body: "Equipo, finanzas, compras y sucursales conectados en una sola operación.",
    accent: "#ff7c9c",
    surface: "rgba(255,124,156,.10)"
  },
  {
    id: "advisory",
    icon: BriefcaseBusiness,
    label: "Asesorías",
    group: "Tipo de negocio",
    title: "Clientes, documentos y seguimiento organizados por operación.",
    body: "Comprobantes, finanzas, agenda y CRM sin convertir la pantalla en una lista interminable.",
    accent: "#67e8f9",
    surface: "rgba(103,232,249,.10)"
  }
];

export function DownloadSectorShowcase() {
  const [active, setActive] = useState("retail");
  const current = sectors.find((item) => item.id === active) ?? sectors[0];
  const CurrentIcon = current.icon;

  return (
    <section className="border-t border-[#24171a] bg-[#0b0b0c] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
              Sectores
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
              Elegí cómo trabajás.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/50">
              No hace falta mostrar todo al mismo tiempo. Tocá un sector y te
              mostramos solo lo relevante para ese tipo de negocio.
            </p>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sectors.map(({ id, icon: Icon, label, accent, surface }) => {
                const selected = active === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onMouseEnter={() => setActive(id)}
                    onFocus={() => setActive(id)}
                    onClick={() => setActive(id)}
                    className={
                      "flex min-h-20 flex-col items-start justify-between rounded-[18px] px-3.5 py-3 text-left transition duration-200 " +
                      (selected
                        ? "bg-white text-black shadow-[0_12px_30px_rgba(0,0,0,.22)]"
                        : "bg-white/[0.035] text-white/58 hover:bg-white/[0.07] hover:text-white")
                    }
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-xl"
                      style={{
                        background: selected ? surface : "rgba(255,255,255,.055)",
                        color: accent
                      }}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="mt-3 text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>

            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .22, ease: [0.23, 1, 0.32, 1] }}
              className="relative mt-4 overflow-hidden rounded-[28px] bg-[#121214] p-6 sm:p-7"
            >
              <div
                className="absolute right-[-10%] top-[-35%] h-56 w-56 rounded-full blur-3xl"
                style={{ background: current.surface }}
              />

              <div className="relative grid gap-5 sm:grid-cols-[54px_1fr] sm:items-start">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: current.surface, color: current.accent }}
                >
                  <CurrentIcon size={21} />
                </span>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">
                    {current.group}
                  </p>
                  <h3 className="mt-2 max-w-2xl text-2xl font-semibold leading-[1.04] tracking-[-.04em] sm:text-3xl">
                    {current.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/46">
                    {current.body}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
