"use client";

import {
  Boxes,
  ChevronDown,
  CircleHelp,
  Link2,
  MonitorSmartphone,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

type CategoryId = "start" | "operation" | "connections" | "security";

const categories: Array<{
  id: CategoryId;
  label: string;
  icon: typeof CircleHelp;
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
      "Podés abrirlo desde el navegador y también instalar la versión PWA. En iPhone y iPad se agrega desde Safari; en Android desde Chrome; y en Windows desde Chrome o Edge. Las tiendas nativas se mostrarán como disponibles únicamente cuando exista una publicación aprobada."
  },
  {
    category: "start",
    q: "¿Sirve solo para comercios?",
    a:
      "No. Global Stock está pensado para comercios, gastronomía, ecommerce, distribución, industria, servicios, pymes, autónomos y también asesorías o estudios que trabajen con clientes, documentos, finanzas y agenda."
  },
  {
    category: "start",
    q: "¿Tengo que configurar todo antes de empezar?",
    a:
      "No. Podés empezar con lo esencial y sumar funciones después. El perfil del negocio permite adaptar la operación, el análisis y el contexto de Global Intelligence a cómo trabaja cada empresa."
  },
  {
    category: "operation",
    q: "¿El punto de venta descuenta stock automáticamente?",
    a:
      "Sí. Al registrar una venta, el flujo de caja y el inventario quedan conectados para actualizar existencias dentro de la misma operación."
  },
  {
    category: "operation",
    q: "¿Puedo usar códigos de barras sin comprar una pistola?",
    a:
      "Sí. Global Stock incluye escaneo con cámara y herramientas para asignar y generar etiquetas de códigos de barras. También puede convivir con lectores físicos que funcionen como entrada de teclado."
  },
  {
    category: "operation",
    q: "¿Puedo manejar caja, clientes, gastos, compras y sucursales?",
    a:
      "Sí. La gestión incluye caja, movimientos, clientes, gastos, compras, proveedores, ubicaciones y equipo, además del inventario y el punto de venta."
  },
  {
    category: "connections",
    q: "¿Puedo conectar una tienda online?",
    a:
      "Sí, cuando exista una integración compatible. Global Stock puede reconocer información pública de una tienda, pero la sincronización privada de stock o datos sensibles requiere una autorización adicional."
  },
  {
    category: "connections",
    q: "¿Global Intelligence usa los datos de mi negocio?",
    a:
      "Está diseñada para trabajar con el contexto disponible dentro de Global Stock, como inventario, ventas, costos, márgenes, actividad, notas y otros datos operativos a los que tu cuenta tenga acceso."
  },
  {
    category: "security",
    q: "¿Una URL alcanza para acceder a los datos de una tienda?",
    a:
      "No. Detectar una web o leer información pública no otorga permisos para administrar el negocio. Las acciones privadas requieren una conexión autorizada."
  },
  {
    category: "security",
    q: "¿Puedo limitar lo que ve cada persona?",
    a:
      "Sí. La aplicación contempla perfiles como dueño, administrador, gerente, caja, depósito, ventas, contador y solo lectura, con acceso diferente según el rol."
  }
];

const quickFacts = [
  {
    icon: ScanLine,
    title: "Escáner incluido",
    text: "Cámara o lector físico"
  },
  {
    icon: UsersRound,
    title: "Acceso por rol",
    text: "Cada persona ve lo necesario"
  },
  {
    icon: Sparkles,
    title: "IA con contexto",
    text: "Trabaja sobre la operación"
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
    <section className="border-t border-[#24171a] bg-[#0b0b0c] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
              Preguntas frecuentes
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
              Antes de empezar.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/50">
              Respuestas cortas sobre instalación, operación, conexiones y
              seguridad. Sin letra chica escondida.
            </p>

            <div className="mt-8 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {quickFacts.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="grid grid-cols-[38px_1fr] items-center gap-3 rounded-2xl bg-white/[0.03] px-3.5 py-3"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/8 text-red-300">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white/78">{title}</p>
                    <p className="mt-0.5 text-[11px] text-white/34">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <p className="text-xs text-white/32">¿No encontraste tu duda?</p>
              <Link
                href="/support"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-red-300 transition hover:text-red-200"
              >
                Ir a soporte →
              </Link>
            </div>
          </div>

          <div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(({ id, label, icon: Icon }) => {
                const selected = category === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => chooseCategory(id)}
                    className={
                      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition " +
                      (selected
                        ? "bg-white text-black shadow-[0_10px_28px_rgba(0,0,0,.22)]"
                        : "bg-white/[0.035] text-white/48 hover:bg-white/[0.07] hover:text-white")
                    }
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-2">
              {visible.map((item) => {
                const open = openQuestion === item.q;

                return (
                  <div
                    key={item.q}
                    className={
                      "overflow-hidden rounded-[20px] transition " +
                      (open
                        ? "bg-[#141416] shadow-[0_18px_45px_rgba(0,0,0,.20)]"
                        : "bg-white/[0.025] hover:bg-white/[0.045]")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setOpenQuestion(open ? "" : item.q)}
                      className="flex min-h-16 w-full items-center justify-between gap-5 px-4 py-4 text-left sm:px-5"
                      aria-expanded={open}
                    >
                      <span className="text-sm font-semibold leading-5 text-white/82 sm:text-base">
                        {item.q}
                      </span>
                      <span
                        className={
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.045] text-white/42 transition-transform " +
                          (open ? "rotate-180 text-red-300" : "")
                        }
                      >
                        <ChevronDown size={15} />
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
                          <p className="px-4 pb-5 text-sm leading-7 text-white/48 sm:px-5">
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
      </div>
    </section>
  );
}
