"use client";

import {
  Boxes,
  ChevronDown,
  Link2,
  MonitorSmartphone,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

type CategoryId = "start" | "operation" | "connections" | "security";

const categories: Array<{
  id: CategoryId;
  label: string;
  icon: typeof MonitorSmartphone;
}> = [
  { id: "start", label: "Empezar", icon: MonitorSmartphone },
  { id: "operation", label: "Operación", icon: Boxes },
  { id: "connections", label: "Conexiones", icon: Link2 },
  { id: "security", label: "Seguridad", icon: ShieldCheck }
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
      "No. Podés empezar con lo esencial y sumar funciones a medida que las necesitás. La idea es que la aplicación crezca con la operación, no que te obligue a configurar módulos que todavía no usás."
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

  const visible = useMemo(
    () => faqs.filter((item) => item.category === category),
    [category]
  );

  function chooseCategory(next: CategoryId) {
    setCategory(next);
    setOpenQuestion(faqs.find((item) => item.category === next)?.q ?? "");
  }

  return (
    <section className="border-t border-[#211417] bg-[#080809] text-white">
      <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ed4c5c]">
            Ayuda
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            Antes de empezar.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/46">
            Respuestas concretas sobre instalación, operación, conexiones y
            acceso. Si necesitás algo más específico, podés ir directo a soporte.
          </p>

          <Link
            href="/support"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            Ir a soporte
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div>
          <div className="flex gap-6 overflow-x-auto border-b border-[#211417]">
            {categories.map(({ id, label, icon: Icon }) => {
              const selected = category === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseCategory(id)}
                  className={
                    "relative inline-flex min-h-12 shrink-0 items-center gap-2 pb-3 text-sm font-semibold transition " +
                    (selected ? "text-white" : "text-white/34 hover:text-white/62")
                  }
                >
                  <Icon size={15} />
                  {label}
                  {selected && (
                    <motion.span
                      layoutId="faq-category"
                      className="absolute inset-x-0 bottom-[-1px] h-px bg-[#ed4c5c]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div>
            {visible.map((item, index) => {
              const open = openQuestion === item.q;

              return (
                <div
                  key={item.q}
                  className={index > 0 ? "border-t border-[#211417]" : ""}
                >
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(open ? "" : item.q)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-base font-semibold leading-6 text-white/82 sm:text-lg">
                      {item.q}
                    </span>
                    <span
                      className={
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.035] text-white/38 transition " +
                        (open ? "rotate-180 text-[#ed4c5c]" : "")
                      }
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
                        transition={{ duration: .22, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-3xl pb-6 pr-10 text-sm leading-7 text-white/44 sm:text-base">
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
      </div>
    </section>
  );
}
