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
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const sectors = [
  {
    id: "retail",
    icon: Store,
    label: "Comercios",
    group: "Sector",
    title: "Vendé y controlá stock sin separar caja e inventario.",
    body: "Punto de venta, códigos, clientes, sucursales y stock conectados.",
    accent: "#8F0000",
    surface: "rgba(143,0,0,.12)"
  },
  {
    id: "gastronomy",
    icon: UtensilsCrossed,
    label: "Gastronomía",
    group: "Sector",
    title: "Compras, costos y caja con una operación más ordenada.",
    body: "Proveedores, gastos, equipo y movimientos diarios en el mismo lugar.",
    accent: "#f6b95b",
    surface: "rgba(246,185,91,.10)"
  },
  {
    id: "ecommerce",
    icon: ShoppingBag,
    label: "Ecommerce",
    group: "Sector",
    title: "Prepará tu tienda online para trabajar con el stock del negocio.",
    body: "Catálogo, pedidos y existencias en una misma vista. La sincronización real requiere integrar cada canal con autorización.",
    accent: "#6ea8ff",
    surface: "rgba(110,168,255,.10)"
  },
  {
    id: "wholesale",
    icon: Warehouse,
    label: "Distribución",
    group: "Sector",
    title: "Manejá volumen, compras y ubicaciones sin perder trazabilidad.",
    body: "Reposición, proveedores, stock y sucursales pensados para movimiento constante.",
    accent: "#b989ff",
    surface: "rgba(185,137,255,.10)"
  },
  {
    id: "industry",
    icon: Factory,
    label: "Industria",
    group: "Sector",
    title: "Seguí insumos, costos y existencias desde una misma base.",
    body: "Una estructura preparada para controlar inventario y abastecimiento.",
    accent: "#50c7d9",
    surface: "rgba(80,199,217,.10)"
  },
  {
    id: "solo",
    icon: BriefcaseBusiness,
    label: "Autónomos",
    group: "Tipo de negocio",
    title: "Una operación simple que puede crecer cuando la necesites.",
    body: "Ventas, stock, agenda y control sin cargar la pantalla de herramientas innecesarias.",
    accent: "#34d399",
    surface: "rgba(52,211,153,.10)"
  },
  {
    id: "smb",
    icon: Building2,
    label: "Pymes",
    group: "Tipo de negocio",
    title: "Más responsables, roles y procesos trabajando sobre los mismos datos.",
    body: "Equipo, finanzas, compras y sucursales conectados en una sola operación.",
    accent: "#fb7185",
    surface: "rgba(251,113,133,.10)"
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
  const reduceMotion = useReducedMotion();
  const current = sectors.find((item) => item.id === active) ?? sectors[0];
  const CurrentIcon = current.icon;

  const activate = (id: string) => {
    setActive((currentId) => (currentId === id ? currentId : id));
  };

  return (
    <section className="border-t border-white/[0.045] bg-[#0a0a0c] text-white">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[.74fr_1.26fr] lg:items-start">
          <div>
            <p className="gs-download-kicker text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
              Para quién es
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
              Para negocios que
              <span className="block text-white/34">necesitan control.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#a8a8b0]">
              Comercios, gastronomía, ecommerce, distribución, industria, autónomos,
              pymes y asesorías pueden adaptar Global Stock a su forma de trabajar.
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
                    onMouseEnter={() => activate(id)}
                    onFocus={() => activate(id)}
                    onClick={() => activate(id)}
                    className={
                      "gs-sector-card group flex min-h-[86px] flex-col items-start justify-between rounded-[20px] bg-[#111216] px-3.5 py-3 text-left outline-none transition-[background-color,box-shadow,color] duration-160 [transition-timing-function:var(--ease-out)] " +
                      (selected
                        ? "text-white shadow-[0_14px_38px_rgba(0,0,0,.22)]"
                        : "text-white/58 hover:bg-[#15161b] hover:text-white")
                    }
                    style={
                      selected
                        ? {
                            boxShadow:
                              "inset 0 0 0 1px " +
                              accent +
                              "45, 0 14px 38px rgba(0,0,0,.22)"
                          }
                        : undefined
                    }
                    aria-pressed={selected}
                  >
                    <span
                      className="gs-sector-icon grid h-8 w-8 place-items-center rounded-xl"
                      style={{ background: surface, color: accent }}
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
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0.1 : 0.2,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="mt-4 overflow-hidden rounded-[30px] bg-[#111217] p-6 shadow-[0_24px_64px_rgba(0,0,0,.22)] sm:p-7"
              style={{
                boxShadow:
                  "inset 0 0 0 1px " +
                  current.accent +
                  "24, 0 24px 64px rgba(0,0,0,.22)"
              }}
            >
              <div className="grid gap-5 sm:grid-cols-[56px_1fr] sm:items-start">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: current.surface, color: current.accent }}
                >
                  <CurrentIcon size={21} />
                </span>

                <div>
                  <p
                    className="gs-download-kicker text-[10px] font-bold uppercase tracking-[.14em] text-[#8F0000]"
                    style={{ color: "#8F0000" }}
                  >
                    {current.group}
                  </p>
                  <h3 className="mt-2 max-w-2xl text-2xl font-semibold leading-[1.04] tracking-[-.04em] sm:text-3xl">
                    {current.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a0a0a9]">
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