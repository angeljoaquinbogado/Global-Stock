"use client";

import {
  ArrowUp,
  BarChart3,
  BellRing,
  Boxes,
  BrainCircuit,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Menu,
  Minus,
  PackageSearch,
  Plus,
  ScanLine,
  Search,
  ShoppingCart,
  Store,
  TrendingUp
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/Logo";

import {
  IPhone17ProMax,
  type DynamicIslandSize,
  type IPhone17ProMaxFrameColor
} from "@/components/ui/apple-iphone-17-pro";

const FRAME_SWATCH: Record<IPhone17ProMaxFrameColor, string> = {
  graphite: "#363839",
  silver: "#D7D7D2",
  gold: "#E96A45",
  blue: "#1769B2"
};

const frameColors: IPhone17ProMaxFrameColor[] = [
  "graphite",
  "silver",
  "gold",
  "blue"
];

type DemoScreen = "dashboard" | "pos" | "inventory" | "ai";
type PhoneNavAction = "overview" | "pos" | "scan" | "charts" | "more";
type PhoneOverlay = "scan" | "charts" | "more" | null;

const screens: Array<{ id: DemoScreen; label: string }> = [
  { id: "dashboard", label: "Inicio" },
  { id: "pos", label: "Punto de venta" },
  { id: "inventory", label: "Almacén" },
  { id: "ai", label: "Intelligence" }
];

export function GlobalStockPhonePreview() {
  const [dynamicIslandSize, setDynamicIslandSize] =
    useState<DynamicIslandSize>("default");
  const [frameColor, setFrameColor] =
    useState<IPhone17ProMaxFrameColor>("graphite");
  const [screenIndex, setScreenIndex] = useState(0);
  const [overlay, setOverlay] = useState<PhoneOverlay>(null);
  const [paused, setPaused] = useState(false);

  const manualPauseTimerRef = useRef<number | null>(null);
  const navLockRef = useRef(false);

  const screen = screens[screenIndex]?.id ?? "dashboard";

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setScreenIndex((current) => (current + 1) % screens.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(
    () => () => {
      if (manualPauseTimerRef.current !== null) {
        window.clearTimeout(manualPauseTimerRef.current);
      }
    },
    []
  );

  const pauseForManualNavigation = () => {
    setPaused(true);

    if (manualPauseTimerRef.current !== null) {
      window.clearTimeout(manualPauseTimerRef.current);
    }

    manualPauseTimerRef.current = window.setTimeout(() => {
      setPaused(false);
      manualPauseTimerRef.current = null;
    }, 7000);
  };

  const moveScreen = (direction: -1 | 1) => {
    if (navLockRef.current) return;

    navLockRef.current = true;
    pauseForManualNavigation();
    setOverlay(null);

    setScreenIndex(
      (current) =>
        (current + direction + screens.length) % screens.length
    );

    window.setTimeout(() => {
      navLockRef.current = false;
    }, 180);
  };

  const chooseScreen = (next: DemoScreen) => {
    pauseForManualNavigation();
    setOverlay(null);
    const index = screens.findIndex((item) => item.id === next);
    if (index >= 0) setScreenIndex(index);
  };

  const handlePhoneNav = (action: PhoneNavAction) => {
    pauseForManualNavigation();

    if (action === "overview") {
      setOverlay(null);
      setScreenIndex(0);
      return;
    }

    if (action === "pos") {
      setOverlay(null);
      setScreenIndex(1);
      return;
    }

    if (action === "charts") {
      setOverlay("charts");
      return;
    }

    if (action === "more") {
      setOverlay("more");
      return;
    }

    setOverlay("scan");
  };

  const cycleDynamicIsland = () => {
    pauseForManualNavigation();

    const sizes: DynamicIslandSize[] = [
      "default",
      "expanded",
      "large",
      "ultra"
    ];
    const index = sizes.indexOf(dynamicIslandSize);
    setDynamicIslandSize(sizes[(index + 1) % sizes.length]);
  };

  return (
    <div
      className="relative mx-auto flex w-full max-w-[520px] flex-col items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (manualPauseTimerRef.current === null) setPaused(false);
      }}
    >
      <div className="pointer-events-none absolute inset-x-[8%] top-[5%] h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(143,0,0,.18),rgba(143,0,0,.07)_42%,transparent_72%)]" />

      <div
        className="gs-phone-preview-stage"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="gs-phone-preview-device pointer-events-auto">
          <IPhone17ProMax
            batteryLevel={94}
            dynamicIslandSize={dynamicIslandSize}
            frameColor={frameColor}
            onDynamicIslandTap={cycleDynamicIsland}
            signalStrength={4}
            time="9:41"
            className="relative"
          >
            <div className="h-full min-h-0 overflow-hidden bg-[#050506] text-white">
              {overlay === "charts" ? (
                <ChartsDemo onNavigate={handlePhoneNav} />
              ) : overlay === "more" ? (
                <MoreDemo
                  onNavigate={handlePhoneNav}
                  onOpenScreen={chooseScreen}
                />
              ) : overlay === "scan" ? (
                <ScannerPreview onNavigate={handlePhoneNav} />
              ) : (
                <>
                  {screen === "dashboard" && (
                    <DashboardDemo onNavigate={handlePhoneNav} />
                  )}
                  {screen === "pos" && (
                    <PosDemo onNavigate={handlePhoneNav} />
                  )}
                  {screen === "inventory" && (
                    <InventoryDemo onNavigate={handlePhoneNav} />
                  )}
                  {screen === "ai" && (
                    <IntelligenceDemo onNavigate={handlePhoneNav} />
                  )}
                </>
              )}
            </div>
          </IPhone17ProMax>
        </div>

        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            moveScreen(-1);
          }}
          className="gs-phone-preview-arrow gs-phone-preview-arrow-left pointer-events-auto select-none touch-manipulation"
          aria-label="Vista anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            moveScreen(1);
          }}
          className="gs-phone-preview-arrow gs-phone-preview-arrow-right pointer-events-auto select-none touch-manipulation"
          aria-label="Vista siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          {screens.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseScreen(item.id)}
              className={
                "h-1.5 rounded-full transition-all duration-300 " +
                (screen === item.id
                  ? "w-7 bg-red-500"
                  : "w-1.5 bg-white/20 hover:bg-white/40")
              }
              aria-label={"Mostrar " + item.label}
            />
          ))}
        </div>

        <span className="hidden h-4 w-px bg-white/10 sm:block" />

        <div className="flex items-center gap-1.5">
          {frameColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                pauseForManualNavigation();
                setFrameColor(color);
              }}
              className={
                "h-6 w-6 rounded-full border-2 transition-[transform,border-color] duration-150 ease-out " +
                (frameColor === color
                  ? "scale-110 border-white"
                  : "border-white/10")
              }
              style={{ background: FRAME_SWATCH[color] }}
              aria-label={"Marco " + color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneAppBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/8 px-3.5 pb-2.5 pt-2">
      <div className="flex items-center gap-2">
        <Logo className="h-7 w-7 shrink-0 object-contain" alt="" aria-hidden="true" />
        <span className="text-[10.5px] font-semibold tracking-[-0.02em]">
          Global Stock
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="grid h-7 w-7 place-items-center rounded-[9px] border border-white/10 bg-white/[0.035] text-[9px]">
          ◐
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-[9px] border border-white/10 bg-white/[0.035]">
          <Menu size={12} />
        </span>
      </div>
    </header>
  );
}

function PageHeading({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h3 className="text-[15.5px] font-semibold tracking-[-0.035em]">
        {title}
      </h3>
      <p className="mt-1 text-[8.5px] leading-[1.4] text-white/45">
        {subtitle}
      </p>
    </div>
  );
}

function PhoneBottomNav({
  active,
  onNavigate
}: {
  active: PhoneNavAction;
  onNavigate: (action: PhoneNavAction) => void;
}) {
  return (
    <nav className="grid shrink-0 grid-cols-5 items-end gap-1 border-t border-white/10 bg-black/92 px-1.5 pb-1 pt-1.5">
      <PhoneNavButton
        active={active === "overview"}
        icon={<Store size={12} />}
        label="Inicio"
        onClick={() => onNavigate("overview")}
      />
      <PhoneNavButton
        active={active === "pos"}
        icon={<ShoppingCart size={12} />}
        label="P. venta"
        onClick={() => onNavigate("pos")}
      />

      <button
        type="button"
        onClick={() => onNavigate("scan")}
        className="-mt-5 flex flex-col items-center justify-end gap-0.5 text-[6.5px] font-semibold text-red-400"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-[#050506] bg-[#8F0000] text-white shadow-[0_7px_20px_rgba(143,0,0,.35)]">
          <ScanLine size={15} />
        </span>
        <span>Escanear</span>
      </button>

      <PhoneNavButton
        active={active === "charts"}
        icon={<BarChart3 size={12} />}
        label="Gráficos"
        onClick={() => onNavigate("charts")}
      />
      <PhoneNavButton
        active={active === "more"}
        icon={<Menu size={12} />}
        label="Más"
        onClick={() => onNavigate("more")}
      />
    </nav>
  );
}

function PhoneNavButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-[8px] text-[6.5px] font-semibold transition " +
        (active ? "text-red-400" : "text-white/38")
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DashboardDemo({
  onNavigate
}: {
  onNavigate: (action: PhoneNavAction) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PhoneAppBar />

      <div className="min-h-0 flex-1 overflow-hidden px-3.5 py-3">
        <PageHeading
          title="Centro de control"
          subtitle="Una vista completa de la operación de tu negocio."
        />

        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <KpiCard
            icon={<CircleDollarSign size={11} />}
            label="Ingresos"
            value="$ 2,4 M"
          />
          <KpiCard
            icon={<Boxes size={11} />}
            label="Costo de inventario"
            value="$ 1,18 M"
          />
          <KpiCard
            icon={<TrendingUp size={11} />}
            label="Ganancia bruta"
            value="$ 742 mil"
          />
          <KpiCard
            icon={<BellRing size={11} />}
            label="Stock crítico"
            value="12 alertas"
          />
        </div>

        <section className="mt-2 rounded-[12px] border border-white/10 bg-white/[0.025] p-2.5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[7px] font-bold uppercase tracking-[0.11em] text-red-400">
                Flujo de ventas
              </p>
              <p className="mt-0.5 text-[9px] font-semibold">
                Ganancia bruta
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[6px] text-white/45">
              Gráficos
            </span>
          </div>

          <div className="relative mt-2 h-[68px] overflow-hidden rounded-[8px] bg-black/30">
            <svg
              viewBox="0 0 220 70"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="phone-profit-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8F0000" stopOpacity=".34" />
                  <stop offset="100%" stopColor="#8F0000" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 56 L28 48 L58 51 L88 36 L118 42 L150 22 L182 31 L220 16 L220 70 L0 70 Z"
                fill="url(#phone-profit-fill)"
              />
              <path
                d="M0 56 L28 48 L58 51 L88 36 L118 42 L150 22 L182 31 L220 16"
                fill="none"
                stroke="#C10A0A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute bottom-1 inset-x-2 flex justify-between text-[5.5px] text-white/28">
              <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span>
              <span>Vie</span><span>Sáb</span><span>Dom</span>
            </div>
          </div>
        </section>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <section className="rounded-[11px] border border-white/10 bg-white/[0.025] p-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-semibold">Actividad reciente</p>
              <span className="text-[6px] font-semibold text-red-400">Abrir</span>
            </div>
            <div className="mt-2 space-y-1.5">
              <ActivityLine text="Venta registrada · 4 unidades" />
              <ActivityLine text="Reposición recibida · 12 unidades" />
            </div>
          </section>

          <section className="rounded-[11px] border border-white/10 bg-white/[0.025] p-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-semibold">Notas de hoy</p>
              <span className="text-[6px] font-semibold text-red-400">Abrir</span>
            </div>
            <div className="mt-2 rounded-[8px] border border-white/8 bg-black/25 px-2 py-1.5 text-[6.5px] leading-3 text-white/58">
              Revisar reposición de reels antes de las 18:00.
            </div>
          </section>
        </div>
      </div>

      <PhoneBottomNav active="overview" onNavigate={onNavigate} />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[11px] border border-white/10 bg-white/[0.025] p-2.5">
      <div className="flex items-center gap-1.5 text-red-400">
        {icon}
        <span className="truncate text-[6.5px] font-bold uppercase tracking-[0.08em] text-white/42">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] font-semibold">{value}</p>
    </div>
  );
}

function ActivityLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-[4px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8F0000]" />
      <p className="text-[6.5px] leading-3 text-white/52">{text}</p>
    </div>
  );
}

function PosDemo({
  onNavigate
}: {
  onNavigate: (action: PhoneNavAction) => void;
}) {
  const products = [
    { name: "Reel frontal 5000", category: "Reels", stock: 8, price: 89900 },
    { name: "Señuelo minnow", category: "Señuelos", stock: 23, price: 15900 }
  ];
  const money = (value: number) =>
    "$ " + new Intl.NumberFormat("es-AR").format(value);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PhoneAppBar />

      <div className="gs-phone-readonly min-h-0 flex-1 overflow-hidden px-3.5 py-3">
        <PageHeading
          title="Punto de venta"
          subtitle="Elegí productos, armá el carrito, registrá el cobro y descontá stock."
        />

        <div className="relative mt-2.5 flex h-8 items-center rounded-[10px] border border-white/10 bg-white/[0.035] pl-7 pr-2 text-[8px] text-white/30">
          <Search
            size={11}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          Buscar producto
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {products.map((product) => (
            <article
              key={product.name}
              className="rounded-[11px] border border-white/10 bg-white/[0.025] p-2.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="grid h-6 w-6 place-items-center rounded-[8px] bg-red-500/10 text-red-400">
                  <Store size={10} />
                </span>
                <span className="rounded-full border border-white/10 px-1.5 py-1 text-[5.5px] text-white/42">
                  {product.stock} stock
                </span>
              </div>
              <p className="mt-2 truncate text-[8px] font-semibold">
                {product.name}
              </p>
              <p className="mt-0.5 text-[6.5px] text-white/38">
                {product.category}
              </p>
              <p className="mt-1.5 text-[9px] font-semibold">
                {money(product.price)}
              </p>
              <div className="mt-2 flex min-h-8 w-full items-center justify-center rounded-[9px] bg-[#8F0000] px-2 text-[7px] font-semibold text-white">
                <Plus size={9} className="mr-1" />
                Agregar
              </div>
            </article>
          ))}
        </div>

        <section className="mt-2 rounded-[11px] border border-white/10 bg-white/[0.025] p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold">Carrito</p>
            <span className="text-[7px] text-white/38">1 u.</span>
          </div>

          <div className="mt-1.5 rounded-[8px] border border-white/8 bg-black/25 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[7px] font-semibold">
                  Reel frontal 5000
                </p>
                <p className="text-[6px] text-white/38">$ 89.900</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="grid h-6 w-6 place-items-center rounded-[7px] border border-white/10">
                  <Minus size={9} />
                </span>
                <span className="w-3 text-center text-[7px] font-semibold">1</span>
                <span className="grid h-6 w-6 place-items-center rounded-[7px] border border-white/10">
                  <Plus size={9} />
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-2">
            <span className="text-[7px] text-white/45">Total</span>
            <strong className="text-[10px]">$ 89.900</strong>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="flex h-8 items-center justify-between rounded-[9px] border border-white/10 bg-[#111] px-2 text-[7px] text-white">
              <span>Efectivo</span>
              <span className="text-white/35">⌄</span>
            </div>
            <div className="flex h-8 items-center justify-center rounded-[9px] bg-[#8F0000] px-2 text-[7px] font-semibold text-white">
              Confirmar venta
            </div>
          </div>
        </section>
      </div>

      <PhoneBottomNav active="pos" onNavigate={onNavigate} />
    </div>
  );
}

function InventoryDemo({
  onNavigate
}: {
  onNavigate: (action: PhoneNavAction) => void;
}) {
  const products = [
    {
      name: "Reel frontal 5000",
      barcode: "779000123401",
      category: "Reels",
      supplier: "Río Sur",
      cost: "$ 52.000",
      price: "$ 89.900",
      stock: 8,
      min: 5
    },
    {
      name: "Señuelo minnow",
      barcode: "779000123402",
      category: "Señuelos",
      supplier: "Delta",
      cost: "$ 8.700",
      price: "$ 15.900",
      stock: 4,
      min: 8
    }
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PhoneAppBar />

      <div className="gs-phone-readonly min-h-0 flex-1 overflow-hidden px-3.5 py-3">
        <PageHeading
          title="Almacén y stock"
          subtitle="Controlá existencias, mínimos, precios, códigos y ajustes desde un solo lugar."
        />

        <div className="mt-2.5 overflow-hidden rounded-[11px] border border-white/10">
          <div className="grid grid-cols-[minmax(0,1.25fr)_.68fr_.7fr] bg-white/[0.04] px-2.5 py-2 text-[6px] font-bold uppercase tracking-[0.08em] text-white/38">
            <span>Producto</span>
            <span>Stock / mín.</span>
            <span>Estado</span>
          </div>

          <div className="divide-y divide-white/8">
            {products.map((product) => {
              const status =
                product.stock <= 0
                  ? "Agotado"
                  : product.stock <= product.min
                    ? "Bajo"
                    : "Normal";

              return (
                <div key={product.name} className="px-2.5 py-2.5">
                  <div className="grid grid-cols-[minmax(0,1.25fr)_.68fr_.7fr] items-center gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[7.5px] font-semibold">
                        {product.name}
                      </p>
                      <p className="mt-0.5 truncate text-[5.8px] text-white/34">
                        {product.barcode}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="grid h-7 w-10 place-items-center rounded-[7px] border border-white/10 bg-black/35 px-1 text-center text-[7px] font-semibold text-white">
                        {product.stock}
                      </span>
                      <span className="text-[6px] text-white/30">
                        / {product.min}
                      </span>
                    </div>

                    <span
                      className={
                        "justify-self-start rounded-full px-1.5 py-1 text-[5.5px] font-bold " +
                        (status === "Normal"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : status === "Bajo"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400")
                      }
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-1.5 grid grid-cols-4 gap-1">
                    <MetaCell label="Categoría" value={product.category} />
                    <MetaCell label="Proveedor" value={product.supplier} />
                    <MetaCell label="Costo" value={product.cost} />
                    <MetaCell label="Precio" value={product.price} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div className="rounded-[10px] border border-white/10 bg-white/[0.025] p-2.5">
            <p className="text-[7.5px] font-semibold">Etiquetas de código</p>
            <p className="mt-1 text-[6px] leading-3 text-white/38">
              Asigná y prepará códigos de barras para productos.
            </p>
          </div>
          <div className="rounded-[10px] border border-white/10 bg-white/[0.025] p-2.5">
            <p className="text-[7.5px] font-semibold">Escáner rápido</p>
            <p className="mt-1 text-[6px] leading-3 text-white/38">
              Leé un código y actualizá el producto.
            </p>
          </div>
        </div>
      </div>

      <PhoneBottomNav active="more" onNavigate={onNavigate} />
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[7px] bg-black/25 px-1.5 py-1.5">
      <p className="truncate text-[5px] uppercase tracking-[0.06em] text-white/30">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[6px] font-semibold text-white/62">
        {value}
      </p>
    </div>
  );
}

function IntelligenceDemo({
  onNavigate
}: {
  onNavigate: (action: PhoneNavAction) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-black/35">
      <section className="flex h-full min-h-0 flex-col bg-[#050506]">
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#8F0000] text-white">
              <BrainCircuit size={14} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[9px] font-semibold">
                  Global Intelligence
                </h3>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-0.5 text-[6.5px] text-white/42">IA conectada</p>
            </div>
          </div>

          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-[12px] text-white/55">
            −
          </span>
        </header>

        <div className="gs-phone-readonly flex min-h-0 flex-1 flex-col">
          <div className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-white/10 px-3 py-2.5">
            <InsightChip icon={<PackageSearch size={10} />} value="12" label="alertas" />
            <InsightChip icon={<TrendingUp size={10} />} value="31,0%" label="margen" />
            <InsightChip icon={<ChartNoAxesCombined size={10} />} value="1.248" label="unidades" />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-3 py-3">
            <div className="mr-5 rounded-[12px] rounded-bl-[4px] border border-white/10 bg-white/[0.035] px-2.5 py-2 text-[7px] leading-[1.45] text-white/72">
              Preguntame lo que quieras. Puedo usar los datos reales de Global Stock para analizar stock, ventas, compras, margen, actividad, notas y escenarios.
            </div>

            <div className="ml-7 rounded-[12px] rounded-br-[4px] bg-[#8F0000] px-2.5 py-2 text-[7px] leading-[1.45] text-white">
              ¿Cómo está mi stock?
            </div>

            <div className="mr-5 rounded-[12px] rounded-bl-[4px] border border-white/10 bg-white/[0.035] px-2.5 py-2 text-[7px] leading-[1.45] text-white/72">
              Tenés 1.248 unidades en inventario y 12 alertas de stock.
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 px-3 pb-3 pt-2">
            <p className="mb-1.5 text-[6px] leading-3 text-white/34">
              Usa inventario, ventas, costos, márgenes, actividad, notas y escenarios.
            </p>
            <div className="flex items-center gap-1.5">
              <div className="flex h-9 min-w-0 flex-1 items-center rounded-[10px] border border-white/10 bg-white/[0.035] px-2.5 text-[7px] text-white/28">
                Preguntá algo sobre tu negocio…
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#8F0000] text-white">
                <ArrowUp size={12} />
              </span>
            </div>
          </div>
        </div>

        <PhoneBottomNav active="more" onNavigate={onNavigate} />
      </section>
    </div>
  );
}

function ChartsDemo({
  onNavigate
}: {
  onNavigate: (action: PhoneNavAction) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PhoneAppBar />
      <div className="gs-phone-readonly min-h-0 flex-1 overflow-hidden px-3.5 py-3">
        <PageHeading
          title="Gráficos"
          subtitle="Seguimiento de ventas, costos, ganancias y pérdidas del negocio."
        />

        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <KpiCard icon={<CircleDollarSign size={11} />} label="Ingresos" value="$ 2,4 M" />
          <KpiCard icon={<TrendingUp size={11} />} label="Ganancia" value="$ 742 mil" />
        </div>

        <section className="mt-2.5 rounded-[12px] border border-white/10 bg-white/[0.025] p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-semibold">Ventas de los últimos días</p>
            <BarChart3 size={12} className="text-red-400" />
          </div>
          <div className="mt-3 flex h-[110px] items-end gap-2">
            {[42, 58, 47, 72, 65, 86, 76].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t-[4px] bg-gradient-to-t from-red-950 to-red-600"
                style={{ height: height + "%" }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[5px] text-white/28">
            <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span>
            <span>Vie</span><span>Sáb</span><span>Dom</span>
          </div>
        </section>

        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <div className="rounded-[11px] border border-white/10 bg-white/[0.025] p-2.5">
            <p className="text-[6px] uppercase tracking-[0.08em] text-white/32">Costos</p>
            <p className="mt-1 text-[10px] font-semibold">$ 1,18 M</p>
          </div>
          <div className="rounded-[11px] border border-white/10 bg-white/[0.025] p-2.5">
            <p className="text-[6px] uppercase tracking-[0.08em] text-white/32">Margen</p>
            <p className="mt-1 text-[10px] font-semibold">31,0%</p>
          </div>
        </div>
      </div>
      <PhoneBottomNav active="charts" onNavigate={onNavigate} />
    </div>
  );
}

function MoreDemo({
  onNavigate,
  onOpenScreen
}: {
  onNavigate: (action: PhoneNavAction) => void;
  onOpenScreen: (screen: DemoScreen) => void;
}) {
  const staticItems = ["Tienda online", "Reposición", "Proveedores", "Actividad"];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PhoneAppBar />
      <div className="min-h-0 flex-1 overflow-hidden px-3.5 py-3">
        <PageHeading
          title="Más"
          subtitle="Accesos adicionales de Global Stock."
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenScreen("inventory")}
            className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-red-500/35 hover:bg-red-500/[0.05]"
          >
            <Boxes size={14} className="text-red-400" />
            <p className="mt-2 text-[8px] font-semibold">Almacén</p>
            <p className="mt-1 text-[6px] leading-3 text-white/36">Stock, mínimos, precios y códigos.</p>
          </button>

          <button
            type="button"
            onClick={() => onOpenScreen("ai")}
            className="rounded-[12px] border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-red-500/35 hover:bg-red-500/[0.05]"
          >
            <BrainCircuit size={14} className="text-red-400" />
            <p className="mt-2 text-[8px] font-semibold">Global Intelligence</p>
            <p className="mt-1 text-[6px] leading-3 text-white/36">Análisis y contexto del negocio.</p>
          </button>

          {staticItems.map((item) => (
            <div
              key={item}
              className="rounded-[12px] border border-white/10 bg-white/[0.025] p-3"
            >
              <Menu size={13} className="text-white/35" />
              <p className="mt-2 text-[7.5px] font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </div>
      <PhoneBottomNav active="more" onNavigate={onNavigate} />
    </div>
  );
}

function ScannerPreview({
  onNavigate
}: {
  onNavigate: (action: PhoneNavAction) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PhoneAppBar />
      <div className="gs-phone-readonly min-h-0 flex-1 overflow-hidden px-3.5 py-3">
        <PageHeading
          title="Escáner"
          subtitle="Vista previa del lector de códigos de barras y QR."
        />
        <div className="mt-4 rounded-[18px] border border-white/10 bg-black/40 p-3">
          <div className="relative aspect-square overflow-hidden rounded-[14px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(143,0,0,.12),rgba(255,255,255,.015)_48%,rgba(0,0,0,.65))]">
            <span className="absolute left-4 top-4 h-7 w-7 border-l-2 border-t-2 border-red-500" />
            <span className="absolute right-4 top-4 h-7 w-7 border-r-2 border-t-2 border-red-500" />
            <span className="absolute bottom-4 left-4 h-7 w-7 border-b-2 border-l-2 border-red-500" />
            <span className="absolute bottom-4 right-4 h-7 w-7 border-b-2 border-r-2 border-red-500" />
            <span className="absolute left-[12%] right-[12%] top-1/2 h-px bg-red-500 shadow-[0_0_12px_rgba(239,68,68,.7)]" />
            <ScanLine size={34} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" />
          </div>
          <p className="mt-3 text-center text-[7px] text-white/38">
            La demo pública no solicita acceso a la cámara.
          </p>
        </div>
      </div>
      <PhoneBottomNav active="scan" onNavigate={onNavigate} />
    </div>
  );
}

function InsightChip({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.025] px-2 py-2">
      <div className="flex items-center gap-1 text-red-400">
        {icon}
        <span className="text-[8px] font-bold">{value}</span>
      </div>
      <p className="mt-1 truncate text-[5.5px] font-semibold uppercase tracking-[0.07em] text-white/36">
        {label}
      </p>
    </div>
  );
}
