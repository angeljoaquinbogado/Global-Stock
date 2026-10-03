"use client";

import {
  Activity,
  BarChart3,
  Boxes,
  BrainCircuit,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Cloud,
  CreditCard,
  FileText,
  Landmark,
  PackagePlus,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Target,
  Truck,
  UsersRound,
  WalletCards
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const groups = [
  {
    id: "sales",
    label: "Ventas y caja",
    icon: ShoppingCart,
    accent: "#ef4444",
    surface: "rgba(239,68,68,.09)",
    title: "Vendé sin separar caja, stock y cobro.",
    features: [
      "Punto de venta",
      "Carrito y cantidades",
      "Efectivo, débito, crédito, transferencia, QR y cuenta",
      "Pagos divididos",
      "Descuento automático de stock",
      "Historial de ventas"
    ]
  },
  {
    id: "inventory",
    label: "Inventario",
    icon: Boxes,
    accent: "#16a34a",
    surface: "rgba(22,163,74,.09)",
    title: "Todo el stock visible y accionable.",
    features: [
      "Stock actual y mínimo",
      "Costos, precios y márgenes",
      "Proveedores por producto",
      "Códigos de barras y etiquetas",
      "Escáner con cámara",
      "Variantes, recetas y stock por ubicación"
    ]
  },
  {
    id: "commerce",
    label: "Tienda online",
    icon: Cloud,
    accent: "#2563eb",
    surface: "rgba(37,99,235,.09)",
    title: "Conectá la tienda online con la operación física.",
    features: [
      "Detección de ecommerce",
      "Lectura de información pública",
      "Conexión privada con autorización",
      "Catálogo sincronizado",
      "Stock y precios conectados",
      "Permisos controlados"
    ]
  },
  {
    id: "purchases",
    label: "Compras y proveedores",
    icon: PackagePlus,
    accent: "#d97706",
    surface: "rgba(217,119,6,.09)",
    title: "Reponé mejor y sabé de quién depende tu stock.",
    features: [
      "Reposición inteligente",
      "Cobertura y rotación",
      "Costo estimado de compra",
      "Directorio de proveedores",
      "Órdenes de compra",
      "Recepción de mercadería"
    ]
  },
  {
    id: "finance",
    label: "Finanzas",
    icon: CircleDollarSign,
    accent: "#7c3aed",
    surface: "rgba(124,58,237,.09)",
    title: "Caja, gastos y finanzas conectados con la operación.",
    features: [
      "Apertura y cierre de caja",
      "Movimientos e ingresos",
      "Gastos y categorías",
      "Cuentas y saldos",
      "Conciliación",
      "Cash flow y seguimiento financiero"
    ]
  },
  {
    id: "crm",
    label: "Clientes y proyectos",
    icon: Target,
    accent: "#db2777",
    surface: "rgba(219,39,119,.09)",
    title: "Seguimiento comercial y trabajo del equipo en un mismo lugar.",
    features: [
      "Clientes y contactos",
      "CRM y oportunidades",
      "Pipeline comercial",
      "Proyectos",
      "Presupuestos y horas previstas",
      "Equipo y disponibilidad"
    ]
  },
  {
    id: "documents",
    label: "Documentos y agenda",
    icon: FileText,
    accent: "#0891b2",
    surface: "rgba(8,145,178,.09)",
    title: "Documentos, recordatorios y actividad sin salir del sistema.",
    features: [
      "Comprobantes",
      "Bandeja documental",
      "Agenda",
      "Notas y recordatorios",
      "Calendario",
      "Historial de actividad"
    ]
  },
  {
    id: "analytics",
    label: "Analítica",
    icon: BarChart3,
    accent: "#0284c7",
    surface: "rgba(2,132,199,.09)",
    title: "Entendé ventas, costos, stock y margen de un vistazo.",
    features: [
      "Ingresos y costos",
      "Ganancia bruta",
      "Pérdidas",
      "Margen",
      "Salud de stock",
      "Gráficos y tendencias"
    ]
  },
  {
    id: "ai",
    label: "Global Intelligence",
    icon: BrainCircuit,
    accent: "#a855f7",
    surface: "rgba(168,85,247,.09)",
    title: "Una IA con contexto real del negocio.",
    features: [
      "Inventario",
      "Ventas",
      "Costos y márgenes",
      "Actividad",
      "Notas",
      "Escenarios y preguntas operativas"
    ]
  },
  {
    id: "security",
    label: "Equipo y permisos",
    icon: ShieldCheck,
    accent: "#475569",
    surface: "rgba(71,85,105,.10)",
    title: "Cada persona accede solo a lo que necesita.",
    features: [
      "Dueño",
      "Administrador",
      "Gerencia",
      "Caja",
      "Depósito",
      "Ventas, contador y solo lectura"
    ]
  }
];

const overview = [
  { icon: ShoppingCart, label: "Punto de venta" },
  { icon: ScanLine, label: "Escáner" },
  { icon: Truck, label: "Proveedores" },
  { icon: Landmark, label: "Finanzas" },
  { icon: UsersRound, label: "Equipo" },
  { icon: WalletCards, label: "Proyectos" },
  { icon: ClipboardList, label: "Agenda" },
  { icon: Activity, label: "Actividad" },
  { icon: Building2, label: "Sucursales" },
  { icon: CreditCard, label: "Cobros" }
];

export function DownloadFeatureCatalog() {
  const [active, setActive] = useState("sales");
  const current = groups.find((group) => group.id === active) ?? groups[0];
  const CurrentIcon = current.icon;

  return (
    <section className="border-t border-white/[0.06] bg-[#08080a] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
              Todas las funcionalidades
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
              Mucho más que stock.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/52">
              Global Stock reúne operación, ventas, caja, inventario, proveedores,
              finanzas, clientes, proyectos, documentos, agenda, analítica e IA
              en la misma plataforma.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
              {overview.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3 text-center"
                >
                  <Icon size={16} className="mx-auto text-white/42" />
                  <p className="mt-2 text-[11px] font-semibold text-white/52">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {groups.map(({ id, label, icon: Icon, accent, surface }) => {
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
                        ? "border-white/14 bg-white text-black shadow-[0_12px_34px_rgba(0,0,0,.26)]"
                        : "border-white/8 bg-white/[0.035] text-white/56 hover:border-white/14 hover:bg-white/[0.075] hover:text-white")
                    }
                  >
                    <span
                      className="grid h-7 w-7 place-items-center rounded-full"
                      style={{ background: surface, color: accent }}
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
              initial={{ opacity: 0, y: 8, scale: .995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .24, ease: [0.23, 1, 0.32, 1] }}
              className="relative mt-5 overflow-hidden rounded-[34px] border border-white/9 bg-[#101013] p-6 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-8"
            >
              <div
                className="absolute right-[-8%] top-[-16%] h-52 w-52 rounded-full blur-3xl"
                style={{ background: current.surface }}
              />

              <div className="relative">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: current.surface, color: current.accent }}
                >
                  <CurrentIcon size={21} />
                </span>
                <h3 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.03] tracking-[-.045em] sm:text-4xl">
                  {current.title}
                </h3>

                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  {current.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex min-h-14 items-center rounded-2xl border border-white/8 bg-black/20 px-4 text-sm font-semibold text-white/72"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
