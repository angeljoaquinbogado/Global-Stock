"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDollarSign,
  Cloud,
  ReceiptText
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type ShowcaseState = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  soft: string;
  total: string;
  badge: string;
  secondaryLabel: string;
  secondaryValue: string;
  invoiceLabel: string;
  invoiceNumber: string;
};

const showcaseStates: ShowcaseState[] = [
  {
    id: "venta",
    eyebrow: "Venta confirmada",
    title: "Venta #1048",
    body: "El cobro, el stock y el historial nacen del mismo movimiento.",
    accent: "#E32636",
    soft: "rgba(227,38,54,.12)",
    total: "$ 48.900",
    badge: "Confirmada",
    secondaryLabel: "Caja principal",
    secondaryValue: "Cobro registrado",
    invoiceLabel: "Comprobante",
    invoiceNumber: "GS-1048"
  },
  {
    id: "caja",
    eyebrow: "Caja actualizada",
    title: "Cobro registrado",
    body: "El importe queda asociado a la venta sin volver a cargar datos.",
    accent: "#F59E0B",
    soft: "rgba(245,158,11,.14)",
    total: "$ 48.900",
    badge: "Pagada",
    secondaryLabel: "Medio de pago",
    secondaryValue: "Efectivo",
    invoiceLabel: "Movimiento",
    invoiceNumber: "CJ-1048"
  },
  {
    id: "stock",
    eyebrow: "Stock sincronizado",
    title: "12 → 11 unidades",
    body: "La unidad vendida se descuenta y queda lista para tienda y sucursales.",
    accent: "#22C55E",
    soft: "rgba(34,197,94,.14)",
    total: "11 disponibles",
    badge: "Sincronizado",
    secondaryLabel: "Producto",
    secondaryValue: "Reel Shimano Sedona",
    invoiceLabel: "Inventario",
    invoiceNumber: "ST-2500"
  },
  {
    id: "historial",
    eyebrow: "Historial guardado",
    title: "Todo queda trazado",
    body: "Fecha, usuario, producto y medio de pago quedan vinculados a la operación.",
    accent: "#3B82F6",
    soft: "rgba(59,130,246,.14)",
    total: "Guardado",
    badge: "Registrado",
    secondaryLabel: "Usuario",
    secondaryValue: "Caja principal",
    invoiceLabel: "Registro",
    invoiceNumber: "HI-1048"
  }
];

const benefits = [
  {
    title: "Vendés una sola vez",
    body:
      "Elegís el producto, la cantidad y el medio de pago. Global Stock se ocupa de actualizar el resto."
  },
  {
    title: "Todo queda conectado",
    body:
      "Stock, caja, historial y tienda online reciben el mismo movimiento sin repetir información."
  }
];

function FloatingCard({
  state,
  variant
}: {
  state: ShowcaseState;
  variant: "top" | "bottom";
}) {
  const isTop = variant === "top";

  return (
    <div
      className={
        "absolute z-20 flex min-w-0 transform-gpu items-center gap-2.5 rounded-[16px] border bg-white px-3 py-2.5 text-[#101114] shadow-[0_12px_30px_rgba(2,6,23,.18)] will-change-transform sm:px-3.5 " +
        (isTop
          ? "gs-sales-float-top left-[6%] top-[7%] w-[52%] max-w-[245px]"
          : "gs-sales-float-bottom left-[11%] top-[20%] w-[56%] max-w-[265px]")
      }
      style={{
        borderColor: isTop ? "rgba(15,23,42,.08)" : state.accent,
        backfaceVisibility: "hidden"
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isTop ? "sale" : state.id}
          className="flex min-w-0 w-full items-center gap-2.5"
          initial={isTop ? false : { opacity: 0, x: 10, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={isTop ? undefined : { opacity: 0, x: -8, scale: 0.99 }}
          transition={{ duration: 0.34, ease: [0.23, 1, 0.32, 1] }}
        >
          <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
        style={{
          background: isTop ? "#F3F4F6" : state.soft,
          color: isTop ? "#64748B" : state.accent
        }}
      >
        {isTop ? <ReceiptText size={16} /> : <Boxes size={16} />}
      </span>

      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold sm:text-[13px]">
          {isTop ? "Venta #1048" : state.title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-slate-600 sm:text-[11px]">
          {isTop ? "Caja principal" : state.secondaryLabel}
        </p>
      </div>

          <span
            className="ml-auto shrink-0 text-[11px] font-semibold sm:text-xs"
            style={{ color: isTop ? "#111827" : state.accent }}
          >
            {isTop ? "$ 48.900" : state.total}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ReceiptMockup({
  state
}: {
  state: ShowcaseState;
}) {
  const lineItems = useMemo(
    () => [
      {
        label: "Reel Shimano Sedona",
        sub: "SKU RS-2500",
        qty: "1",
        price: "48.900",
        total: "48.900"
      },
      {
        label: "Medio de pago",
        sub: "Efectivo",
        qty: "—",
        price: "—",
        total: "Registrado"
      }
    ],
    []
  );

  return (
    <div
      className="gs-sales-receipt-float relative z-10 mx-auto mt-8 w-[min(88%,370px)] sm:mt-10 sm:w-[72%] max-w-[370px] transform-gpu overflow-hidden rounded-[12px] bg-white text-[#111318] shadow-[0_24px_48px_rgba(2,6,23,.24)] will-change-transform sm:mt-11"
      style={{ backfaceVisibility: "hidden" }}
    >
      <motion.div
        className="h-1.5 w-full"
        animate={{ backgroundColor: state.accent }}
        transition={{ duration: 0.5 }}
      />

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <AnimatePresence mode="wait">
              <motion.p
                key={state.invoiceLabel}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.28 }}
                className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-600"
              >
                {state.invoiceLabel}
              </motion.p>
            </AnimatePresence>
            <p className="mt-1 text-[22px] font-semibold tracking-[-.045em] sm:text-[27px]">
              Global Stock
            </p>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-600">
              Número
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={state.invoiceNumber}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.28 }}
                className="mt-1 text-[11px] font-semibold text-slate-700"
              >
                {state.invoiceNumber}
              </motion.p>
            </AnimatePresence>
            <p className="mt-2 text-[9px] font-bold uppercase tracking-[.14em] text-slate-600">
              Fecha
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-700">
              05/10/2026
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1.6fr_.5fr_.65fr_.75fr] gap-2 border-b border-slate-200 pb-2 text-[8px] font-bold uppercase tracking-[.13em] text-slate-600 sm:text-[9px]">
          <span>Descripción</span>
          <span>Cant.</span>
          <span>Precio</span>
          <span className="text-right">Total</span>
        </div>

        <div className="py-3">
          {lineItems.map((item, itemIndex) => (
            <motion.div
              key={item.label}
              className="grid grid-cols-[1.6fr_.5fr_.65fr_.75fr] items-center gap-2 rounded-xl px-2.5 py-2.5"
              animate={{
                backgroundColor:
                  itemIndex === 0 ? state.soft : "rgba(248,250,252,.86)"
              }}
              transition={{ duration: 0.45 }}
            >
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold text-slate-800 sm:text-[11px]">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-[8px] text-slate-600 sm:text-[9px]">
                  {item.sub}
                </p>
              </div>
              <span className="text-[9px] font-medium text-slate-600 sm:text-[10px]">
                {item.qty}
              </span>
              <span className="text-[9px] font-medium text-slate-600 sm:text-[10px]">
                {item.price}
              </span>
              <span className="truncate text-right text-[9px] font-semibold text-slate-800 sm:text-[10px]">
                {item.total}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 border-t border-slate-200 pt-4">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-600">
                Estado
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={state.badge}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28 }}
                  className="mt-1 text-[11px] font-semibold"
                  style={{ color: state.accent }}
                >
                  {state.badge}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-600">
                Total
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={state.total}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="mt-1 text-xl font-semibold tracking-[-.045em] sm:text-2xl"
                  style={{ color: state.accent }}
                >
                  {state.total}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DownloadSalesFlow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const manualHoldUntilRef = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const state = showcaseStates[activeIndex];

  useEffect(() => {
    if (reducedMotion || !isInView) return;

    const timer = window.setInterval(() => {
      // Respect a manual tab choice. Without this pause the automatic demo
      // could immediately replace the section the user is trying to read.
      if (performance.now() < manualHoldUntilRef.current) return;
      setActiveIndex((current) => (current + 1) % showcaseStates.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [reducedMotion, isInView]);

  return (
    <div
      ref={sectionRef}
      className={
        "mx-auto w-full max-w-[1240px] px-5 py-12 sm:px-8 sm:py-14 lg:py-16 " +
        (!isInView ? "gs-sales-paused" : "")
      }
    >
      <style jsx global>{`
        @keyframes gs-sales-float-top {
          0%, 100% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(2px, -4px, 0); }
          50% { transform: translate3d(4px, -8px, 0); }
          75% { transform: translate3d(1px, -4px, 0); }
        }

        @keyframes gs-sales-float-bottom {
          0%, 100% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(-2px, 4px, 0); }
          50% { transform: translate3d(-4px, 8px, 0); }
          75% { transform: translate3d(-1px, 4px, 0); }
        }

        @keyframes gs-sales-receipt-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotateZ(0deg); }
          50% { transform: translate3d(0, -6px, 0) rotateZ(.12deg); }
        }

        .gs-sales-float-top {
          animation: gs-sales-float-top 6.8s ease-in-out infinite;
        }

        .gs-sales-float-bottom {
          animation: gs-sales-float-bottom 7.4s ease-in-out infinite;
        }

        .gs-sales-receipt-float {
          animation: gs-sales-receipt-float 8.2s ease-in-out infinite;
        }

        .gs-sales-paused .gs-sales-float-top,
        .gs-sales-paused .gs-sales-float-bottom,
        .gs-sales-paused .gs-sales-receipt-float {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .gs-sales-float-top,
          .gs-sales-float-bottom,
          .gs-sales-receipt-float {
            animation: none;
          }
        }
      `}</style>

      <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,.94fr)_minmax(0,1.06fr)] lg:items-center lg:gap-12 xl:gap-14">
        <div className="min-w-0">
          <p className="gs-download-kicker gs-download-sales-eyebrow text-[10px] font-bold uppercase tracking-[0.17em] text-[#8F0000]">
            Cómo funciona
          </p>

          <h2 className="gs-download-sales-title mt-3.5 max-w-[560px] text-[clamp(2.05rem,3.55vw,3.4rem)] font-semibold leading-[.98] tracking-[-0.055em] text-white">
            Vendé una vez.
            <span className="gs-download-sales-title-muted block text-white/38">
              Global Stock ordena todo lo demás.
            </span>
          </h2>

          <p className="gs-download-sales-copy mt-5 max-w-[560px] text-[14px] leading-6 text-[#a8a8b0] sm:text-[15px]">
            Registrás la venta como lo harías en cualquier caja. Mientras vos seguís
            atendiendo, Global Stock actualiza el cobro, descuenta el stock y guarda
            el movimiento en segundo plano.
          </p>

          <div className="mt-7 space-y-5">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="grid grid-cols-[26px_minmax(0,1fr)] gap-3"
              >
                <span className="gs-download-sales-check mt-0.5 grid h-[26px] w-[26px] place-items-center rounded-full bg-[#E32636]/10 text-[#ff727d]">
                  <Check size={14} />
                </span>
                <div className="min-w-0">
                  <h3 className="gs-download-sales-benefit-title text-[14px] font-semibold leading-5 text-white/92 sm:text-[15px]">
                    {item.title}
                  </h3>
                  <p className="gs-download-sales-benefit-copy mt-1.5 max-w-[500px] text-[13px] leading-5 text-white/46 sm:text-[13.5px]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="gs-download-sales-cta mt-7 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition-[background-color,transform,box-shadow,border-color] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-white/90"
          >
            Abrir punto de venta
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="min-w-0">
          <div className="gs-theme-fixed-dark relative min-h-[420px] overflow-hidden rounded-[28px] border border-[#6ea8ff]/15 bg-[radial-gradient(circle_at_78%_88%,rgba(96,165,250,.86),transparent_22%),radial-gradient(circle_at_60%_82%,rgba(37,99,235,.92),transparent_35%),radial-gradient(circle_at_12%_12%,rgba(30,64,175,.30),transparent_34%),linear-gradient(145deg,#11182b_0%,#162a4c_46%,#1d4ea8_74%,#2f72e8_100%)] p-4 shadow-[0_28px_70px_rgba(13,33,76,.36)] sm:min-h-[465px] sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.035),transparent_34%),radial-gradient(circle_at_50%_110%,rgba(255,255,255,.16),transparent_36%)]" />

            <FloatingCard state={state} variant="top" />
            <FloatingCard state={state} variant="bottom" />

            <ReceiptMockup state={state} />

            <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/24 px-2 py-1.5 backdrop-blur-md sm:bottom-6 sm:right-6">
              {showcaseStates.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Mostrar estado ${item.eyebrow}`}
                  onClick={(event) => {
                  manualHoldUntilRef.current = event.timeStamp + 12000;
                  setActiveIndex(index);
                }}
                  className="grid h-5 w-5 place-items-center rounded-full"
                >
                  <motion.span
                    className="block rounded-full"
                    animate={{
                      width: index === activeIndex ? 11 : 6,
                      height: index === activeIndex ? 11 : 6,
                      backgroundColor:
                        index === activeIndex ? item.accent : "rgba(255,255,255,.28)"
                    }}
                    transition={{ duration: 0.25 }}
                  />
                </button>
              ))}
            </div>

            <div className="gs-sales-status-pill absolute bottom-5 left-5 z-20 hidden items-center gap-2 rounded-full border border-white/[0.14] bg-black/35 px-3 py-2 text-[10px] font-semibold text-white/[0.82] shadow-[0_8px_24px_rgba(0,0,0,.18)] backdrop-blur-md sm:flex sm:bottom-6 sm:left-6">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: state.accent,
                  boxShadow: `0 0 14px ${state.accent}`
                }}
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={state.eyebrow}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.24 }}
                >
                  {state.eyebrow}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="gs-download-sales-tabs mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { icon: ReceiptText, label: "Venta" },
              { icon: CircleDollarSign, label: "Caja" },
              { icon: Boxes, label: "Stock" },
              { icon: Cloud, label: "Online" }
            ].map(({ icon: Icon, label }, index) => (
              <button
                key={label}
                type="button"
                data-active={activeIndex === index ? "true" : "false"}
                onClick={(event) => {
                  // Respect a manually selected tab for 12 seconds, just
                  // like the scene navigation dots. Autoplay must not
                  // override what someone is currently reading.
                  manualHoldUntilRef.current = event.timeStamp + 12000;
                  setActiveIndex(index);
                }}
                className={
                  "gs-download-sales-tab flex min-h-9 items-center justify-center gap-2 rounded-xl border px-3 text-[10px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 " +
                  (activeIndex === index
                    ? "border-white/12 bg-white/[0.07] text-white"
                    : "border-white/[0.045] bg-white/[0.025] text-white/38 hover:bg-white/[0.05]")
                }
              >
                <Icon
                  size={13}
                  style={{
                    color:
                      activeIndex === index
                        ? showcaseStates[index].accent
                        : undefined
                  }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}