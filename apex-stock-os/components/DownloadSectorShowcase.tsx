"use client";

import {
  BriefcaseBusiness,
  Building2,
  Factory,
  ShoppingBag,
  ShoppingCart,
  Store,
  UtensilsCrossed
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const sectors = [
  {
    id: "retail",
    label: "Comercios y retail",
    icon: Store,
    accent: "#ef4444",
    bg: "rgba(239,68,68,.09)",
    title: "Vendé, cobrá y controlá stock sin separar caja e inventario.",
    features: ["Punto de venta", "Stock y mínimos", "Códigos de barras", "Sucursales"]
  },
  {
    id: "gastronomy",
    label: "Gastronomía",
    icon: UtensilsCrossed,
    accent: "#f59e0b",
    bg: "rgba(245,158,11,.10)",
    title: "Centralizá compras, costos, caja, proveedores y operación diaria.",
    features: ["Caja", "Compras", "Proveedores", "Equipo"]
  },
  {
    id: "ecommerce",
    label: "Ecommerce",
    icon: ShoppingBag,
    accent: "#3b82f6",
    bg: "rgba(59,130,246,.10)",
    title: "Conectá tu tienda online con el stock y la operación del negocio.",
    features: ["Tienda online", "Catálogo", "Stock sincronizado", "Actividad"]
  },
  {
    id: "wholesale",
    label: "Mayoristas y distribución",
    icon: Building2,
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,.10)",
    title: "Manejá volumen, proveedores, reposición y múltiples ubicaciones.",
    features: ["Reposición", "Proveedores", "Sucursales", "Compras"]
  },
  {
    id: "advisory",
    label: "Asesorías y estudios contables",
    icon: BriefcaseBusiness,
    accent: "#0f766e",
    bg: "rgba(15,118,110,.10)",
    title: "Organizá clientes, documentos, finanzas, agenda y seguimiento desde un mismo lugar.",
    features: ["Clientes", "Comprobantes", "Finanzas", "Agenda y CRM"]
  },
  {
    id: "services",
    label: "Servicios profesionales",
    icon: ShoppingCart,
    accent: "#ec4899",
    bg: "rgba(236,72,153,.09)",
    title: "Controlá clientes, proyectos, cobros y equipo sin perder contexto.",
    features: ["CRM", "Proyectos", "Cobros", "Equipo"]
  },
  {
    id: "industry",
    label: "Industria y fabricación",
    icon: Factory,
    accent: "#64748b",
    bg: "rgba(100,116,139,.10)",
    title: "Seguí insumos, existencias, costos, reposición y trazabilidad operativa.",
    features: ["Inventario", "Costos", "Reposición", "Actividad"]
  }
];

export function DownloadSectorShowcase() {
  const [active, setActive] = useState("retail");
  const current = sectors.find((sector) => sector.id === active) ?? sectors[0];
  const CurrentIcon = current.icon;

  return (
    <section className="bg-[#0b0b0c] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
            Sectores
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Global Stock se adapta al negocio.
            <span className="block text-white/38">No al revés.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/54">
            Las mismas herramientas se combinan de forma distinta según cómo trabaja cada sector.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {sectors.map(({ id, label, icon: Icon, accent, bg }) => {
            const selected = active === id;
            return (
              <button
                key={id}
                type="button"
                onMouseEnter={() => setActive(id)}
                onFocus={() => setActive(id)}
                onClick={() => setActive(id)}
                className={
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition duration-200 " +
                  (selected
                    ? "border-white/16 bg-white text-black shadow-[0_10px_28px_rgba(0,0,0,.22)]"
                    : "border-white/8 bg-white/[0.035] text-white/62 hover:border-white/14 hover:bg-white/[0.07] hover:text-white")
                }
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-full"
                  style={{ background: selected ? bg : "rgba(255,255,255,.06)", color: accent }}
                >
                  <Icon size={14} />
                </span>
                {label}
              </button>
            );
          })}
        </div>

        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 8, scale: .99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .26, ease: [0.23, 1, 0.32, 1] }}
          className="relative mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.035] p-6 sm:p-8"
        >
          <div
            className="absolute right-[-8%] top-[-30%] h-60 w-60 rounded-full blur-3xl"
            style={{ background: current.bg }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl"
                style={{ background: current.bg, color: current.accent }}
              >
                <CurrentIcon size={21} />
              </span>
              <p className="mt-5 text-sm font-semibold text-white/45">{current.label}</p>
              <h3 className="mt-2 max-w-2xl text-3xl font-semibold leading-[1.03] tracking-[-.045em] sm:text-4xl">
                {current.title}
              </h3>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {current.features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm font-semibold text-white/76"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
