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
import { useEffect, useMemo, useState } from "react";

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
    accent: "#F2A93B",
    soft: "rgba(242,169,59,.13)",
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
    accent: "#39C98A",
    soft: "rgba(57,201,138,.13)",
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
    accent: "#6EA8FF",
    soft: "rgba(110,168,255,.13)",
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
    <motion.div
      className={
        "absolute z-20 flex min-w-0 items-center gap-3 rounded-[18px] border bg-white px-3.5 py-3 text-[#101114] shadow-[0_16px_40px_rgba(2,6,23,.22)] sm:px-4 " +
        (isTop
          ? "left-[4%] top-[7%] w-[58%] max-w-[280px]"
          : "left-[10%] top-[22%] w-[64%] max-w-[310px]")
      }
      animate={{
        y: isTop ? [0, -5, 0] : [0, 5, 0],
        x: isTop ? [0, 3, 0] : [0, -3, 0]
      }}
      transition={{
        duration: isTop ? 5.8 : 6.4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{
        borderColor: isTop ? "rgba(15,23,42,.08)" : state.accent
      }}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
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
        <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-[11px]">
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
  );
}

function ReceiptMockup({
  state,
  index,
  reducedMotion
}: {
  state: ShowcaseState;
  index: number;
  reducedMotion: boolean | null;
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
    <motion.div
      className="relative z-10 mx-auto mt-8 w-[78%] max-w-[410px] overflow-hidden rounded-[12px] bg-white text-[#111318] shadow-[0_28px_60px_rgba(2,6,23,.30)] sm:mt-10"
      animate={
        reducedMotion
          ? undefined
          : {
              y: [0, -5, 0],
              rotate: [0, index % 2 === 0 ? 0.25 : -0.25, 0]
            }
      }
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut"
      }}
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
                className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400"
              >
                {state.invoiceLabel}
              </motion.p>
            </AnimatePresence>
            <p className="mt-1 text-[22px] font-semibold tracking-[-.045em] sm:text-[27px]">
              Global Stock
            </p>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">
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
            <p className="mt-2 text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">
              Fecha
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-700">
              05/10/2026
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1.6fr_.5fr_.65fr_.75fr] gap-2 border-b border-slate-200 pb-2 text-[8px] font-bold uppercase tracking-[.13em] text-slate-400 sm:text-[9px]">
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
                <p className="mt-0.5 truncate text-[8px] text-slate-400 sm:text-[9px]">
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
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-400">
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
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-400">
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
    </motion.div>
  );
}

export function DownloadSalesFlow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const state = showcaseStates[activeIndex];

  useEffect(() => {
    if (reducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseStates.length);
    }, 2850);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
      <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14 xl:gap-18">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#E32636]">
            Cómo funciona
          </p>

          <h2 className="mt-4 max-w-[620px] text-[clamp(2.4rem,4.3vw,4rem)] font-semibold leading-[.96] tracking-[-0.06em] text-white">
            Vendé una vez.
            <span className="block text-white/38">
              Global Stock ordena todo lo demás.
            </span>
          </h2>

          <p className="mt-6 max-w-[600px] text-[15px] leading-7 text-[#a8a8b0] sm:text-[17px]">
            Registrás la venta como lo harías en cualquier caja. Mientras vos seguís
            atendiendo, Global Stock actualiza el cobro, descuenta el stock y guarda
            el movimiento en segundo plano.
          </p>

          <div className="mt-9 space-y-7">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="grid grid-cols-[28px_minmax(0,1fr)] gap-3"
              >
                <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-[#E32636]/10 text-[#ff727d]">
                  <Check size={14} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold leading-6 text-white/92">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-[540px] text-sm leading-6 text-white/46">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition-[background-color,transform] duration-150 [transition-timing-function:var(--ease-out)] hover:bg-white/90"
          >
            Abrir punto de venta
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="min-w-0">
          <div className="relative min-h-[470px] overflow-hidden rounded-[30px] border border-white/[0.055] bg-[radial-gradient(circle_at_20%_100%,rgba(143,0,0,.28),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(227,38,54,.08),transparent_30%),linear-gradient(145deg,#161923_0%,#10131b_58%,#0b0d12_100%)] p-4 shadow-[0_30px_80px_rgba(0,0,0,.30)] sm:min-h-[520px] sm:p-6">
            <div className="pointer-events-none absolute inset-0 opacity-[.18] [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:48px_48px]" />

            <FloatingCard state={state} variant="top" />
            <FloatingCard state={state} variant="bottom" />

            <ReceiptMockup
              state={state}
              index={activeIndex}
              reducedMotion={reducedMotion}
            />

            <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/24 px-2 py-1.5 backdrop-blur-md sm:bottom-6 sm:right-6">
              {showcaseStates.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Mostrar estado ${item.eyebrow}`}
                  onClick={() => setActiveIndex(index)}
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

            <div className="absolute bottom-5 left-5 z-20 hidden items-center gap-2 rounded-full border border-white/[0.07] bg-black/20 px-3 py-2 text-[10px] font-semibold text-white/48 backdrop-blur-md sm:flex sm:bottom-6 sm:left-6">
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

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { icon: ReceiptText, label: "Venta" },
              { icon: CircleDollarSign, label: "Caja" },
              { icon: Boxes, label: "Stock" },
              { icon: Cloud, label: "Online" }
            ].map(({ icon: Icon, label }, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={
                  "flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-[11px] font-semibold transition-colors " +
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
