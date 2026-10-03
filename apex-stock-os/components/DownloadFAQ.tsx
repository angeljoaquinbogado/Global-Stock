"use client";

import {
  Boxes,
  ChevronDown,
  Link2,
  MonitorSmartphone,
  ShieldCheck
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

type CategoryId = "start" | "operation" | "connections" | "security";

const categories: Array<{
  id: CategoryId;
  label: string;
  icon: typeof MonitorSmartphone;
  accent: string;
}> = [
  { id: "start", label: "Empezar", icon: MonitorSmartphone, accent: "#6ea8ff" },
  { id: "operation", label: "Operación", icon: Boxes, accent: "#34d399" },
  { id: "connections", label: "Conexiones", icon: Link2, accent: "#f6b95b" },
  { id: "security", label: "Seguridad", icon: ShieldCheck, accent: "#b989ff" }
];

const faqs: Array<{
  category: CategoryId;
  q: string;
  a: string;
}> = [
  {
    category: "start",
    q: "¿En qué dispositivos puedo usar Global Stock?",
    a:
      "Podés usarlo desde el navegador y también instalar la versión PWA. En iPhone y iPad se agrega desde Safari; en Android desde Chrome; y en Windows desde Chrome o Edge."
  },
  {
    category: "start",
    q: "¿Sirve para distintos tipos de negocio?",
    a:
      "Sí. La estructura contempla comercios, gastronomía, ecommerce, distribución, industria, servicios, pymes, autónomos y asesorías. El perfil del negocio permite adaptar la forma de presentar la operación."
  },
  {
    category: "start",
    q: "¿Tengo que configurar todo antes de empezar?",
    a:
      "No. Podés empezar con lo esencial y sumar funciones a medida que las necesitás. La aplicación crece con la operación, sin obligarte a activar módulos que todavía no usás."
  },
  {
    category: "operation",
    q: "¿El punto de venta actualiza el inventario?",
    a:
      "Sí. El flujo está pensado para que una venta pueda actualizar existencias dentro de la misma operación y dejar registro en la actividad correspondiente."
  },
  {
    category: "operation",
    q: "¿Puedo usar la cámara para leer códigos de barras?",
    a:
      "Sí. Global Stock incluye escaneo con cámara y herramientas para trabajar con códigos de barras y etiquetas. También puede convivir con lectores físicos que funcionen como entrada de teclado."
  },
  {
    category: "operation",
    q: "¿Qué áreas del negocio puedo gestionar?",
    a:
      "Además de ventas e inventario, la plataforma contempla caja, clientes, gastos, compras, proveedores, ubicaciones, documentos, proyectos, equipo, agenda y análisis."
  },
  {
    category: "connections",
    q: "¿Puedo conectar una tienda online?",
    a:
      "Cuando exista una integración compatible, sí. Global Stock puede reconocer información pública de una tienda, pero la sincronización privada de stock o datos sensibles requiere autorización adicional."
  },
  {
    category: "connections",
    q: "¿Qué contexto usa Global Intelligence?",
    a:
      "Está diseñada para trabajar con la información disponible dentro de Global Stock a la que tu cuenta tenga acceso, como inventario, ventas, costos, márgenes, actividad y notas."
  },
  {
    category: "security",
    q: "¿Una URL alcanza para acceder a datos privados?",
    a:
      "No. Detectar una web o leer información pública no otorga permisos para administrar ese negocio. Las acciones privadas requieren una conexión autorizada."
  },
  {
    category: "security",
    q: "¿Puedo limitar lo que ve cada persona?",
    a:
      "Sí. La aplicación contempla perfiles como dueño, administrador, gerente, caja, depósito, ventas, contador y solo lectura, con accesos distintos según el rol."
  }
];

export function DownloadFAQ() {
  const [category, setCategory] = useState<CategoryId>("start");
  const [openQuestion, setOpenQuestion] = useState<string>(
    faqs.find((item) => item.category === "start")?.q ?? ""
  );
  const reduceMotion = useReducedMotion();

  const visible = useMemo(
    () => faqs.filter((item) => item.category === category),
    [category]
  );

  const currentCategory =
    categories.find((item) => item.id === category) ?? categories[0];

  function chooseCategory(next: CategoryId) {
    setCategory(next);
    setOpenQuestion(faqs.find((item) => item.category === next)?.q ?? "");
  }

  return (
    <section className="border-t border-white/[0.045] bg-[#08090b] text-white">
      <div className="mx-auto w-full max-w-[980px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b989ff]">
            Preguntas frecuentes
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Lo importante, claro.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#a8a8b0]">
            Respuestas rápidas sobre instalación, operación, conexiones y seguridad.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {categories.map(({ id, label, icon: Icon, accent }) => {
            const selected = category === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => chooseCategory(id)}
                className={
                  "flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-[#111216] px-3 text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform] duration-150 [transition-timing-function:var(--ease-out)] " +
                  (selected
                    ? "text-white shadow-[0_8px_24px_rgba(0,0,0,.22)]"
                    : "text-white/42 hover:bg-[#16171c] hover:text-white/72")
                }
                style={
                  selected
                    ? { boxShadow: "inset 0 0 0 1px " + accent + "42, 0 8px 24px rgba(0,0,0,.22)" }
                    : undefined
                }
                aria-pressed={selected}
              >
                <Icon size={15} style={{ color: selected ? accent : undefined }} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {visible.map((item, index) => {
            const open = openQuestion === item.q;

            return (
              <div
                key={item.q}
                className={index > 0 ? "border-t border-white/[0.05]" : ""}
              >
                <button
                  type="button"
                  onClick={() => setOpenQuestion(open ? "" : item.q)}
                  className="flex min-h-16 w-full items-center justify-between gap-6 py-5 text-left outline-none"
                  aria-expanded={open}
                >
                  <span className="text-base font-semibold leading-6 text-white/84 sm:text-lg">
                    {item.q}
                  </span>
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.035] text-white/38 transition-[transform,color,background-color] duration-200 [transition-timing-function:var(--ease-out)]"
                    style={{
                      color: open ? currentCategory.accent : undefined,
                      transform: open ? "rotate(180deg)" : "rotate(0deg)"
                    }}
                  >
                    <ChevronDown size={16} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: reduceMotion ? 0.12 : 0.22,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-3xl pb-6 pr-10 text-sm leading-7 text-[#9f9fa8] sm:text-base">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
