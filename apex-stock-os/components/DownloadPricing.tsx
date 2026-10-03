"use client";

import {
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useState } from "react";

import { InstallAppButton } from "@/components/InstallAppButton";

type SegmentId = "solo" | "small" | "medium" | "advisory";

const segments: Array<{ id: SegmentId; label: string }> = [
  { id: "solo", label: "Autónomos" },
  { id: "small", label: "Empresas pequeñas" },
  { id: "medium", label: "Empresas medianas" },
  { id: "advisory", label: "Asesorías" }
];

const segmentCopy: Record<
  SegmentId,
  { title: string; body: string }
> = {
  solo: {
    title: "Planes para trabajar solo sin perder control.",
    body:
      "Ventas, stock, caja, agenda y analítica en una base simple que puede crecer después."
  },
  small: {
    title: "Planes para equipos chicos que necesitan todo conectado.",
    body:
      "Caja, inventario, ecommerce, proveedores, clientes, documentos y equipo en una sola operación."
  },
  medium: {
    title: "Más control para operaciones con varios responsables.",
    body:
      "Permisos por rol, finanzas, proyectos, múltiples ubicaciones, analítica e inteligencia operativa."
  },
  advisory: {
    title: "Una estructura pensada también para asesorías y estudios.",
    body:
      "Clientes, comprobantes, finanzas, agenda, CRM, documentos y seguimiento organizados por operación."
  }
};

const comparisonRows = [
  { feature: "Punto de venta", base: true, pro: true, business: true },
  { feature: "Inventario y mínimos", base: true, pro: true, business: true },
  { feature: "Códigos de barras y escáner", base: true, pro: true, business: true },
  { feature: "Agenda y actividad", base: true, pro: true, business: true },
  { feature: "Tienda online conectada", base: false, pro: true, business: true },
  { feature: "Reposición inteligente", base: false, pro: true, business: true },
  { feature: "Proveedores y compras", base: false, pro: true, business: true },
  { feature: "Comprobantes y documentos", base: false, pro: true, business: true },
  { feature: "Sucursales y caja avanzada", base: false, pro: true, business: true },
  { feature: "Finanzas y conciliación", base: false, pro: false, business: true },
  { feature: "CRM y oportunidades", base: false, pro: false, business: true },
  { feature: "Proyectos y equipo", base: false, pro: false, business: true },
  { feature: "Roles y permisos", base: false, pro: false, business: true },
  { feature: "Global Intelligence", base: false, pro: false, business: true }
];

const plans = [
  {
    name: "Base",
    tag: "Para empezar",
    description: "Operación diaria sin complejidad.",
    features: [
      "Punto de venta",
      "Inventario y stock mínimo",
      "Códigos de barras",
      "Agenda y actividad",
      "Gráficos principales"
    ]
  },
  {
    name: "Pro",
    tag: "Más completo",
    description: "Para conectar compras, proveedores y canales.",
    popular: true,
    features: [
      "Todo lo de Base",
      "Tienda online conectada",
      "Reposición inteligente",
      "Proveedores y compras",
      "Comprobantes y documentos",
      "Sucursales y caja avanzada"
    ]
  },
  {
    name: "Business",
    tag: "Operación avanzada",
    description: "Para equipos y gestión integral.",
    features: [
      "Todo lo de Pro",
      "Finanzas y conciliación",
      "CRM y oportunidades",
      "Proyectos y equipo",
      "Roles y permisos",
      "Global Intelligence"
    ]
  }
];

export function DownloadPricing() {
  const [segment, setSegment] = useState<SegmentId>("small");
  const current = segmentCopy[segment];

  return (
    <section className="bg-[#f6f4f0] text-[#101012]">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a80000]">
            Planes
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Elegí la estructura que encaja con tu negocio.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-black/52">
            La arquitectura de planes ya queda preparada. Los precios finales
            todavía no están publicados para no mostrar valores inventados.
          </p>
        </div>

        <div className="mt-9 flex justify-center overflow-x-auto">
          <div className="inline-flex min-w-max items-center gap-1 rounded-full border border-black/8 bg-white/72 p-1 shadow-[0_10px_28px_rgba(24,24,27,.06)]">
            {segments.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSegment(item.id)}
                className={
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition " +
                  (segment === item.id
                    ? "bg-[#161619] text-white shadow-[0_6px_16px_rgba(0,0,0,.14)]"
                    : "text-black/48 hover:bg-white hover:text-black")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-7 max-w-3xl text-center">
          <h3 className="text-2xl font-semibold tracking-[-.035em]">
            {current.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-black/46">
            {current.body}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={
                "relative overflow-hidden rounded-[30px] border p-6 sm:p-7 " +
                (plan.popular
                  ? "border-[#8F0000]/35 bg-[#171719] text-white shadow-[0_24px_70px_rgba(143,0,0,.12)]"
                  : "border-black/7 bg-white text-black shadow-[0_18px_50px_rgba(24,24,27,.05)]")
              }
            >
              {plan.popular && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#8F0000] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-white">
                  <Sparkles size={11} />
                  Popular
                </span>
              )}

              <p
                className={
                  "text-[10px] font-bold uppercase tracking-[.14em] " +
                  (plan.popular ? "text-red-300" : "text-black/32")
                }
              >
                {plan.tag}
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
                {plan.name}
              </h3>
              <p
                className={
                  "mt-2 text-sm leading-6 " +
                  (plan.popular ? "text-white/48" : "text-black/46")
                }
              >
                {plan.description}
              </p>

              <div className="mt-6">
                <p
                  className={
                    "text-[10px] font-bold uppercase tracking-[.12em] " +
                    (plan.popular ? "text-white/30" : "text-black/30")
                  }
                >
                  Precio
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[-.04em]">
                  Próximamente
                </p>
              </div>

              <div
                className={
                  "my-6 h-px " +
                  (plan.popular ? "bg-white/10" : "bg-black/7")
                }
              />

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <span
                      className={
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full " +
                        (plan.popular
                          ? "bg-red-500/12 text-red-300"
                          : "bg-emerald-500/10 text-emerald-700")
                      }
                    >
                      <Check size={11} />
                    </span>
                    <span
                      className={
                        "text-sm leading-5 " +
                        (plan.popular ? "text-white/72" : "text-black/62")
                      }
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href="#instalar"
                className={
                  "mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold transition " +
                  (plan.popular
                    ? "bg-[#8F0000] text-white hover:bg-[#a10a0a]"
                    : "bg-[#161619] text-white hover:bg-black")
                }
              >
                Probar Global Stock
                <ChevronRight size={14} />
              </a>
            </article>
          ))}
        </div>

        <div className="mt-14 overflow-hidden rounded-[30px] border border-black/7 bg-white shadow-[0_18px_55px_rgba(24,24,27,.05)]">
          <div className="border-b border-black/7 px-5 py-5 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#a80000]">
              Comparativa
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-.035em]">
              Compará las funcionalidades principales.
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/46">
              Esta distribución es una vista previa de la estructura de planes.
              Los límites y precios finales todavía no están publicados.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/7 bg-[#faf9f7]">
                  <th className="px-5 py-4 text-xs font-semibold text-black/50 sm:px-6">
                    Funcionalidad
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold">Base</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold">Pro</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold">Business</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-black/[0.055] last:border-b-0">
                    <td className="px-5 py-3.5 text-sm font-medium text-black/68 sm:px-6">
                      {row.feature}
                    </td>
                    {[row.base, row.pro, row.business].map((included, index) => (
                      <td key={index} className="px-4 py-3.5 text-center">
                        {included ? (
                          <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-emerald-500/10 text-emerald-700">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="text-black/18">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <InstallAppButton language="es" />
        </div>
      </div>
    </section>
  );
}
