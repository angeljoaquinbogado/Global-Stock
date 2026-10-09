"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  BriefcaseBusiness,
  Calculator,
  FileText,
  ShoppingCart,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { DownloadLogo } from "./DownloadLogo";

type HubModule = {
  id: string;
  label: string;
  category: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  accent: string;
  icon: LucideIcon;
  x: number;
  y: number;
};

const modules: HubModule[] = [
  {
    id: "facturacion",
    label: "Facturación",
    category: "Documentos",
    title: "Documentos que pasan de papel a información.",
    description:
      "Subí facturas y comprobantes, extraé datos con IA y revisalos antes de incorporarlos a tu gestión.",
    href: "#download-ai-workflow",
    linkLabel: "Conocer Document Intelligence",
    accent: "#65A4FF",
    icon: FileText,
    x: 500,
    y: 75
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    category: "Finanzas",
    title: "Tus números conectados con la operación.",
    description:
      "Reuní documentos y movimientos financieros con las ventas y compras para entender mejor tu negocio.",
    href: "#download-feature-business",
    linkLabel: "Explorar finanzas y gestión",
    accent: "#43C9A5",
    icon: Calculator,
    x: 746,
    y: 146
  },
  {
    id: "crm",
    label: "CRM",
    category: "Relaciones",
    title: "Clientes y oportunidades en contexto.",
    description:
      "Organizá contactos y oportunidades sin perder de vista las ventas, actividades y demás áreas.",
    href: "#download-feature-business",
    linkLabel: "Conocer la gestión del negocio",
    accent: "#FF7D92",
    icon: BriefcaseBusiness,
    x: 828,
    y: 320
  },
  {
    id: "proyectos",
    label: "Proyectos",
    category: "Organización",
    title: "Del trabajo pendiente a la acción.",
    description:
      "Coordiná proyectos y tareas con la información de la operación en un mismo espacio.",
    href: "#download-feature-business",
    linkLabel: "Explorar proyectos",
    accent: "#FFAF60",
    icon: BarChart3,
    x: 746,
    y: 494
  },
  {
    id: "equipo",
    label: "Equipo",
    category: "Personas",
    title: "Cada persona, con el acceso que necesita.",
    description:
      "Mantené personas, roles y tareas organizados para que cada área trabaje con claridad.",
    href: "#download-security",
    linkLabel: "Ver roles y seguridad",
    accent: "#F39B77",
    icon: UsersRound,
    x: 500,
    y: 568
  },
  {
    id: "inventario",
    label: "Inventario",
    category: "Stock",
    title: "Sabé qué tenés y cuándo reponer.",
    description:
      "Conectá productos, existencias, códigos y compras para evitar errores entre el stock y las ventas.",
    href: "#download-feature-sales",
    linkLabel: "Ver inventario y ventas",
    accent: "#50BBEF",
    icon: Boxes,
    x: 254,
    y: 494
  },
  {
    id: "ventas",
    label: "Ventas",
    category: "Caja",
    title: "Cada venta cuenta en toda tu gestión.",
    description:
      "Registrá operaciones y mantené los movimientos de caja e inventario conectados.",
    href: "#download-features",
    linkLabel: "Ver cómo funcionan las ventas",
    accent: "#EF6C78",
    icon: ShoppingCart,
    x: 172,
    y: 320
  },
  {
    id: "ia",
    label: "IA",
    category: "Global Intelligence",
    title: "Una IA que entiende el contexto del negocio.",
    description:
      "Consultá ventas, márgenes, reposición y documentos para recibir análisis y sugerencias basadas en tus datos.",
    href: "#download-feature-intelligence",
    linkLabel: "Conocer Global Intelligence",
    accent: "#B68BFF",
    icon: BrainCircuit,
    x: 254,
    y: 146
  }
];

const center = { x: 500, y: 320 };

function connectorPath(item: HubModule) {
  const dx = item.x - center.x;
  const dy = item.y - center.y;
  const distance = Math.hypot(dx, dy);
  const ux = dx / distance;
  const uy = dy / distance;
  const startX = center.x + ux * 92;
  const startY = center.y + uy * 92;
  const endX = item.x - ux * 47;
  const endY = item.y - uy * 47;
  const bend = item.x < center.x ? -8 : 8;
  const controlX = (startX + endX) / 2 - uy * bend;
  const controlY = (startY + endY) / 2 + ux * bend;

  return (
    "M " + startX.toFixed(1) + " " + startY.toFixed(1) +
    " Q " + controlX.toFixed(1) + " " + controlY.toFixed(1) +
    " " + endX.toFixed(1) + " " + endY.toFixed(1)
  );
}

function ModuleNode({
  item,
  active,
  onSelect,
  compact = false
}: {
  item: HubModule;
  active: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => onSelect(item.id)}
      onFocus={() => onSelect(item.id)}
      aria-pressed={active}
      aria-controls="gs-ecosystem-detail"
      className={
        "gs-ecosystem-node group " +
        (compact ? "gs-ecosystem-node--compact " : "gs-ecosystem-node--orbit ") +
        (active ? "is-active" : "")
      }
      style={
        {
          "--ecosystem-accent": item.accent,
          ...(compact
            ? {}
            : {
                left: (item.x / 1000) * 100 + "%",
                top: (item.y / 640) * 100 + "%"
              })
        } as CSSProperties
      }
    >
      <span className="gs-ecosystem-node-icon">
        <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="gs-ecosystem-node-title">{item.label}</span>
      <span className="gs-ecosystem-node-indicator" aria-hidden="true" />
    </button>
  );
}

export function DownloadEcosystemHub() {
  const [activeId, setActiveId] = useState("ia");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [diagramScale, setDiagramScale] = useState(0.8);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      if (stage.clientWidth > 0) {
        setDiagramScale((current) => {
          const next = stage.clientWidth / 1000;
          return Math.abs(current - next) > 0.001 ? next : current;
        });
      }
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(stage);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const reducedMotion = useReducedMotion();
  const active = modules.find((item) => item.id === activeId) ?? modules[7];
  const ActiveIcon = active.icon;

  return (
    <section
      id="download-network"
      data-download-section
      className="gs-ecosystem-section relative scroll-mt-20 overflow-hidden border-t"
      aria-labelledby="gs-ecosystem-heading"
    >
      <div className="mx-auto w-full max-w-[1290px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[830px] text-center">
          <p className="gs-download-kicker text-[11px] font-extrabold uppercase tracking-[.18em] text-[#8F0000]">
            Un ecosistema conectado
          </p>
          <h2
            id="gs-ecosystem-heading"
            className="gs-ecosystem-heading mt-4 text-[clamp(2.5rem,5vw,4.7rem)] font-semibold leading-[.99] tracking-[-.06em]"
          >
            Todo funciona mejor
            <span className="block">cuando está conectado.</span>
          </h2>
          <p className="gs-ecosystem-intro mx-auto mt-5 max-w-2xl text-sm leading-7 sm:text-base">
            Un solo lugar para ventas, inventario, documentos, clientes, equipo e inteligencia.
            Elegí un módulo para descubrir cómo se integra con el resto.
          </p>
        </div>

        <div className="gs-ecosystem-surface mt-10 overflow-hidden rounded-[32px] border sm:mt-14 sm:rounded-[38px]">
          <div ref={stageRef} className="gs-ecosystem-stage relative mx-auto hidden lg:block">
          <div
            className="gs-ecosystem-diagram absolute left-0 top-0 h-[640px] w-[1000px]"
            style={{ transform: `scale(${diagramScale})`, transformOrigin: "top left" }}
          >
            <div className="gs-ecosystem-ambient absolute inset-0" aria-hidden="true" />
            <div className="gs-ecosystem-grid absolute inset-0" aria-hidden="true" />

            <svg
              viewBox="0 0 1000 640"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                {modules.map((item) => (
                  <linearGradient
                    key={item.id}
                    id={"gs-hub-gradient-" + item.id}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#8F0000" stopOpacity=".26" />
                    <stop offset="58%" stopColor={item.accent} stopOpacity=".80" />
                    <stop offset="100%" stopColor={item.accent} stopOpacity=".30" />
                  </linearGradient>
                ))}
              </defs>

              <circle cx="500" cy="320" r="139" className="gs-ecosystem-orbit" />
              <circle cx="500" cy="320" r="208" className="gs-ecosystem-orbit gs-ecosystem-orbit--outer" />
              <circle cx="500" cy="320" r="260" className="gs-ecosystem-orbit gs-ecosystem-orbit--dotted" />

              {modules.map((item, index) => (
                <g key={item.id}>
                  <path d={connectorPath(item)} className="gs-ecosystem-line-base" />
                  <path
                    d={connectorPath(item)}
                    className={
                      "gs-ecosystem-line-flow " +
                      (item.id === activeId ? "is-active" : "")
                    }
                    stroke={"url(#gs-hub-gradient-" + item.id + ")"}
                    style={{ animationDelay: -(index * .57) + "s" }}
                  />
                </g>
              ))}

              <AnimatePresence mode="wait" initial={false}>
                <motion.path
                  key={active.id}
                  d={connectorPath(active)}
                  fill="none"
                  stroke={active.accent}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={reducedMotion ? false : { opacity: 0, pathLength: 0 }}
                  animate={{ opacity: .92, pathLength: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : .54, ease: [0.22, 1, .36, 1] }}
                />
              </AnimatePresence>
            </svg>

            <div className="gs-ecosystem-center absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
              <div className="gs-ecosystem-center-logo grid place-items-center">
                <DownloadLogo className="h-[76px] w-[76px] object-contain" alt="Global Stock" />
              </div>
              <strong className="mt-2 text-lg font-semibold tracking-[-.045em]">Global Stock</strong>
              <span className="gs-ecosystem-center-caption mt-1 text-[9px] font-bold uppercase tracking-[.18em]">
                Todo conectado
              </span>
            </div>

            {modules.map((item) => (
              <ModuleNode
                key={item.id}
                item={item}
                active={activeId === item.id}
                onSelect={setActiveId}
              />
            ))}
          </div>
          </div>

          <div className="gs-ecosystem-mobile px-4 pb-4 pt-8 sm:px-6 sm:pb-6 lg:hidden">
            <div className="gs-ecosystem-mobile-center mx-auto flex max-w-[240px] flex-col items-center rounded-[30px] px-5 py-5 text-center">
              <DownloadLogo className="h-[68px] w-[68px]" alt="Global Stock" />
              <strong className="mt-2 text-lg tracking-[-.04em]">Global Stock</strong>
              <span className="gs-ecosystem-center-caption mt-1 text-[9px] font-bold uppercase tracking-[.16em]">
                Ecosistema integrado
              </span>
            </div>
            <div className="gs-ecosystem-mobile-connector mx-auto h-8 w-px" aria-hidden="true" />
            <div className="gs-ecosystem-mobile-grid grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {modules.map((item) => (
                <ModuleNode
                  key={item.id}
                  item={item}
                  active={activeId === item.id}
                  onSelect={setActiveId}
                  compact
                />
              ))}
            </div>
          </div>

          <div className="gs-ecosystem-detail-wrap relative border-t px-5 py-6 sm:px-8 sm:py-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                id="gs-ecosystem-detail"
                key={active.id}
                className="gs-ecosystem-detail mx-auto flex max-w-[1030px] flex-col gap-5 sm:flex-row sm:items-center sm:gap-6"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: reducedMotion ? 0 : .2, ease: [0.22, 1, .36, 1] }}
              >
                <span
                  className="gs-ecosystem-detail-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                  style={{ "--ecosystem-accent": active.accent } as CSSProperties}
                >
                  <ActiveIcon size={21} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="gs-ecosystem-detail-kicker text-[10px] font-bold uppercase tracking-[.14em]">
                    {active.category}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-.03em] sm:text-xl">
                    {active.title}
                  </h3>
                  <p className="gs-ecosystem-detail-description mt-2 max-w-2xl text-sm leading-6">
                    {active.description}
                  </p>
                </div>
                <Link
                  href={active.href}
                  className="gs-ecosystem-detail-link inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition-[transform,background-color] duration-150 active:scale-[.98]"
                >
                  {active.linkLabel}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p className="gs-ecosystem-footnote mt-5 text-center text-[11px] leading-5">
          Seleccioná un módulo para conocer sus funciones. Las conexiones muestran cómo conviven dentro de Global Stock.
        </p>
      </div>
    </section>
  );
}
