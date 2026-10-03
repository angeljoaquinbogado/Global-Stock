"use client";

import { Check, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

import { InstallAppButton } from "@/components/InstallAppButton";

type SegmentId = "solo" | "small" | "medium" | "advisory";

const segments: Array<{ id: SegmentId; label: string }> = [
  { id: "solo", label: "Autónomos" },
  { id: "small", label: "Empresas pequeñas" },
  { id: "medium", label: "Empresas medianas" },
  { id: "advisory", label: "Asesorías" }
];

const segmentCopy: Record<SegmentId, { title: string; body: string }> = {
  solo: {
    title: "Para trabajar solo sin perder control.",
    body: "Ventas, stock, caja, agenda y analítica en una base simple."
  },
  small: {
    title: "Para equipos chicos que necesitan todo conectado.",
    body: "Operación, compras, clientes y equipo sin separar información."
  },
  medium: {
    title: "Para operaciones con más responsables y procesos.",
    body: "Roles, finanzas, proyectos, sucursales e inteligencia operativa."
  },
  advisory: {
    title: "Para asesorías y estudios que trabajan con muchos clientes.",
    body: "Documentos, finanzas, agenda, CRM y seguimiento en un mismo lugar."
  }
};

const plans = [
  {
    name: "Base",
    tag: "Esencial",
    body: "Para empezar a ordenar la operación.",
    features: ["Punto de venta", "Inventario", "Códigos de barras", "Agenda"]
  },
  {
    name: "Pro",
    tag: "Más completo",
    body: "Para conectar compras, proveedores y canales.",
    popular: true,
    features: ["Todo Base", "Tienda online", "Reposición", "Proveedores"]
  },
  {
    name: "Business",
    tag: "Avanzado",
    body: "Para equipos que necesitan gestión integral.",
    features: ["Todo Pro", "Finanzas", "CRM y proyectos", "Roles + IA"]
  }
];

const comparisonRows = [
  ["Punto de venta", true, true, true],
  ["Inventario", true, true, true],
  ["Tienda online", false, true, true],
  ["Reposición", false, true, true],
  ["Proveedores", false, true, true],
  ["Finanzas", false, false, true],
  ["CRM y proyectos", false, false, true],
  ["Roles e IA", false, false, true]
] as const;

export function DownloadPricing() {
  const [segment, setSegment] = useState<SegmentId>("small");
  const current = segmentCopy[segment];

  return (
    <section className="border-t border-white/[0.06] bg-[#0b0b0d] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
            Planes
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Elegí según cómo trabajás.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/50">
            La estructura ya está preparada. Los precios se publicarán cuando
            estén definidos para Global Stock.
          </p>
        </div>

        <div className="mt-9 flex justify-center overflow-x-auto">
          <div className="inline-flex min-w-max items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] p-1">
            {segments.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSegment(item.id)}
                className={
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition " +
                  (segment === item.id
                    ? "bg-white text-black"
                    : "text-white/48 hover:bg-white/[0.07] hover:text-white")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-7 max-w-2xl text-center">
          <h3 className="text-2xl font-semibold tracking-[-.035em]">
            {current.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/42">
            {current.body}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={
                "relative rounded-[28px] border p-6 sm:p-7 " +
                (plan.popular
                  ? "border-[#8F0000]/45 bg-[#171719] shadow-[0_24px_70px_rgba(143,0,0,.14)]"
                  : "border-white/8 bg-[#111114]")
              }
            >
              {plan.popular && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#8F0000] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em]">
                  <Sparkles size={11} />
                  Popular
                </span>
              )}

              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">
                {plan.tag}
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/46">{plan.body}</p>

              <div className="my-6 h-px bg-white/8" />

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-300">
                      <Check size={11} />
                    </span>
                    <span className="text-sm text-white/68">{feature}</span>
                  </div>
                ))}
              </div>

              <p className="mt-7 text-xs font-semibold text-white/28">
                Precio · Próximamente
              </p>
            </article>
          ))}
        </div>

        <details className="group mx-auto mt-8 max-w-4xl rounded-[24px] border border-white/8 bg-white/[0.025]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white/68">
            Comparar funcionalidades
            <ChevronDown
              size={16}
              className="transition-transform group-open:rotate-180"
            />
          </summary>

          <div className="overflow-x-auto border-t border-white/8">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.025]">
                  <th className="px-5 py-3 text-xs font-semibold text-white/42">
                    Funcionalidad
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold">Base</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold">Pro</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold">Business</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([feature, base, pro, business]) => (
                  <tr key={feature} className="border-b border-white/[0.055] last:border-b-0">
                    <td className="px-5 py-3 text-sm text-white/60">{feature}</td>
                    {[base, pro, business].map((included, index) => (
                      <td key={index} className="px-3 py-3 text-center">
                        {included ? (
                          <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-emerald-500/10 text-emerald-300">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="text-white/16">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <div className="mt-8 flex justify-center">
          <InstallAppButton language="es" />
        </div>
      </div>
    </section>
  );
}
