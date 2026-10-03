"use client";

import {
  BarChart3,
  Boxes,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  PackageSearch,
  ScanLine,
  ShoppingCart,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const screens: Array<{
  id: DemoScreen;
  label: string;
}> = [
  { id: "dashboard", label: "Inicio" },
  { id: "pos", label: "Caja" },
  { id: "inventory", label: "Stock" },
  { id: "ai", label: "IA" }
];

export function GlobalStockPhonePreview() {
  const [dynamicIslandSize, setDynamicIslandSize] =
    useState<DynamicIslandSize>("default");
  const [frameColor, setFrameColor] =
    useState<IPhone17ProMaxFrameColor>("graphite");
  const [screenIndex, setScreenIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const manualPauseTimerRef = useRef<number | null>(null);

  const screen = screens[screenIndex]?.id ?? "dashboard";

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setScreenIndex((current) => (current + 1) % screens.length);
    }, 4400);

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
    }, 6500);
  };

  const moveScreen = (direction: -1 | 1) => {
    pauseForManualNavigation();
    setScreenIndex(
      (current) =>
        (current + direction + screens.length) % screens.length
    );
  };

  const chooseScreen = (next: DemoScreen) => {
    pauseForManualNavigation();
    const nextIndex = screens.findIndex((item) => item.id === next);
    if (nextIndex >= 0) setScreenIndex(nextIndex);
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
        if (manualPauseTimerRef.current === null) {
          setPaused(false);
        }
      }}
    >
      <div className="pointer-events-none absolute inset-x-[8%] top-[5%] h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(143,0,0,.18),rgba(143,0,0,.07)_42%,transparent_72%)]" />

      <div className="gs-phone-preview-stage">
        <div className="gs-phone-preview-device">
          <IPhone17ProMax
            batteryLevel={94}
            dynamicIslandSize={dynamicIslandSize}
            frameColor={frameColor}
            onDynamicIslandTap={cycleDynamicIsland}
            signalStrength={4}
            time="9:41"
            className="relative"
          >
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#050506] px-[5.6%] pb-[6.5%] pt-[7.2%] text-white">
              <header className="flex shrink-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[7px] font-bold uppercase tracking-[0.18em] text-red-500">
                    Global Stock
                  </p>
                  <h3 className="mt-1 truncate text-[16px] font-semibold leading-tight tracking-[-0.04em]">
                    {screen === "dashboard" && "Centro de control"}
                    {screen === "pos" && "Punto de venta"}
                    {screen === "inventory" && "Inventario"}
                    {screen === "ai" && "Global Intelligence"}
                  </h3>
                </div>

                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-[#8F0000] text-[9px] font-bold">
                  GS
                </span>
              </header>

              <main
                key={screen}
                className="mt-[4.5%] min-h-0 flex-1 overflow-hidden animate-[gs-phone-screen-in_.34s_cubic-bezier(.22,1,.36,1)_both]"
              >
                {screen === "dashboard" && (
                  <DashboardDemo onNavigate={chooseScreen} />
                )}
                {screen === "pos" && <PosDemo />}
                {screen === "inventory" && <InventoryDemo />}
                {screen === "ai" && <AiDemo />}
              </main>

              <nav className="mt-[3.8%] grid shrink-0 grid-cols-4 gap-1 border-t border-white/10 pt-2.5">
                {screens.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseScreen(item.id)}
                    className={
                      "min-h-8 rounded-[9px] px-1 text-center text-[6px] font-semibold transition " +
                      (screen === item.id
                        ? "bg-red-500/12 text-red-400"
                        : "text-white/34 hover:bg-white/[0.03] hover:text-white/70")
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </IPhone17ProMax>
        </div>

        <button
          type="button"
          onClick={() => moveScreen(-1)}
          className="gs-phone-preview-arrow gs-phone-preview-arrow-left"
          aria-label="Vista anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onClick={() => moveScreen(1)}
          className="gs-phone-preview-arrow gs-phone-preview-arrow-right"
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

function DashboardDemo({
  onNavigate
}: {
  onNavigate: (screen: DemoScreen) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ["Ventas", "$ 2,4 M"],
          ["Stock", "1.248"],
          ["Margen", "31%"]
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[11px] border border-white/8 bg-white/[0.045] px-2.5 py-2"
          >
            <p className="text-[6px] uppercase tracking-[0.08em] text-white/35">
              {label}
            </p>
            <p className="mt-1 text-[10px] font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(143,0,0,.12),rgba(255,255,255,.018))] p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-semibold">Flujo de ventas</span>
          <TrendingUp size={11} className="text-red-500" />
        </div>
        <div className="mt-2 flex h-[72px] items-end gap-1.5">
          {[28, 44, 35, 57, 49, 68, 58].map((height, index) => (
            <span
              key={index}
              className="flex-1 origin-bottom animate-[gs-phone-bar_.65s_cubic-bezier(.22,1,.36,1)_both] rounded-t-[3px] bg-gradient-to-t from-red-950 to-red-600"
              style={{
                height: height + "%",
                animationDelay: index * 55 + "ms"
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-2.5 grid gap-1.5">
        <MiniRow
          icon={ShoppingCart}
          title="Punto de venta"
          body="Caja lista para operar"
          onClick={() => onNavigate("pos")}
        />
        <MiniRow
          icon={Boxes}
          title="Inventario"
          body="Stock por sucursal y variante"
          onClick={() => onNavigate("inventory")}
        />
        <MiniRow
          icon={Sparkles}
          title="Global Intelligence"
          body="Análisis del negocio"
          onClick={() => onNavigate("ai")}
        />
      </div>
    </div>
  );
}

function PosDemo() {
  const [paid, setPaid] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const rows = [
    ["Reel frontal 5000", "1", "$ 89.900"],
    ["Señuelo minnow", "2", "$ 31.800"],
    ["Línea multifilamento", "1", "$ 18.500"]
  ];

  const charge = () => {
    setPaid(true);
    window.setTimeout(() => setPaid(false), 1600);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="rounded-[14px] border border-white/8 bg-white/[0.035] p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-semibold">Venta en curso</span>
          <ShoppingCart size={11} className="text-red-500" />
        </div>

        <div className="mt-2 grid gap-1.5">
          {rows.map(([name, qty, price]) => (
            <div
              key={name}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[9px] bg-white/[0.035] px-2.5 py-1.5"
            >
              <span className="truncate text-[7px] font-medium">{name}</span>
              <span className="text-[6px] text-white/35">x{qty}</span>
              <span className="text-[7px] font-semibold">{price}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-2 grid grid-cols-[.92fr_1.08fr] gap-2">
        <div className="rounded-[12px] border border-white/8 px-3 py-2.5">
          <p className="text-[6px] uppercase tracking-[.08em] text-white/35">
            Total
          </p>
          <p className="mt-1 text-[13px] font-semibold">$ 140.200</p>
        </div>

        <button
          type="button"
          onClick={charge}
          className={
            "rounded-[12px] px-3 text-[8px] font-semibold text-white transition " +
            (paid
              ? "bg-emerald-600"
              : "bg-[#8F0000] hover:bg-[#a40000]")
          }
        >
          <span className="inline-flex items-center gap-1.5">
            {paid && <Check size={11} />}
            {paid ? "Cobrado" : "Cobrar"}
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setScannerActive((value) => !value)}
        className={
          "mt-2 flex items-center justify-between rounded-[12px] border p-2.5 text-left transition " +
          (scannerActive
            ? "border-red-500/35 bg-red-500/[0.08]"
            : "border-white/8 bg-white/[0.025]")
        }
      >
        <div>
          <p className="text-[7px] font-semibold">
            {scannerActive ? "Escáner activo" : "Escáner rápido"}
          </p>
          <p className="mt-0.5 text-[6px] text-white/35">
            {scannerActive
              ? "Listo para leer un código"
              : "Código de barras o QR"}
          </p>
        </div>
        <ScanLine
          size={15}
          className={
            scannerActive ? "animate-pulse text-red-400" : "text-red-500"
          }
        />
      </button>
    </div>
  );
}

function InventoryDemo() {
  const [selected, setSelected] = useState("Reel baitcasting");

  const products = [
    ["Caña carbono 2,40 m", "18", "OK"],
    ["Reel baitcasting", "4", "Bajo"],
    ["Anzuelo 3/0 x10", "73", "OK"],
    ["Señuelo 11 cm", "0", "Sin stock"]
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[12px] border border-white/8 p-2.5">
          <Boxes size={12} className="text-red-500" />
          <p className="mt-1.5 text-[12px] font-semibold">1.248</p>
          <p className="text-[6px] text-white/35">unidades</p>
        </div>

        <div className="rounded-[12px] border border-red-500/20 bg-red-500/[0.055] p-2.5">
          <PackageSearch size={12} className="text-red-500" />
          <p className="mt-1.5 text-[12px] font-semibold">12</p>
          <p className="text-[6px] text-white/35">para reponer</p>
        </div>
      </div>

      <div className="mt-2 grid gap-1.5">
        {products.map(([name, stock, state]) => {
          const active = selected === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setSelected(name)}
              className={
                "grid min-h-9 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-left transition " +
                (active
                  ? "border-red-500/35 bg-red-500/[0.07]"
                  : "border-white/8 bg-white/[0.025]")
              }
            >
              <span className="truncate text-[7px] font-semibold">{name}</span>
              <span className="text-[7px]">{stock}</span>
              <span
                className={
                  "rounded-full px-1.5 py-1 text-[5px] font-bold uppercase " +
                  (state === "OK"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400")
                }
              >
                {state}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AiDemo() {
  const [refreshed, setRefreshed] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="rounded-[14px] border border-red-500/20 bg-red-500/[0.055] p-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-red-500/12 text-red-400">
            <Bot size={12} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[8px] font-semibold">
              Global Intelligence
            </p>
            <p className="truncate text-[6px] text-white/35">
              Contexto del negocio activo
            </p>
          </div>
        </div>

        <div className="mt-2 rounded-[10px] bg-black/35 px-2.5 py-2">
          <p className="text-[7px] leading-4 text-white/72">
            “¿Qué debería reponer esta semana?”
          </p>
        </div>

        <div className="mt-1.5 rounded-[10px] border border-white/8 bg-white/[0.03] px-2.5 py-2">
          <p className="text-[7px] leading-[1.45] text-white/70">
            {refreshed
              ? "El reel baitcasting sigue primero. También revisaría líneas 0,30 mm por aumento de rotación."
              : "Priorizaría 12 productos. El reel baitcasting tiene menos de 5 días de cobertura."}
          </p>
        </div>
      </section>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-[11px] border border-white/8 p-2.5">
          <CircleDollarSign size={11} className="text-red-500" />
          <p className="mt-1 text-[7px] font-semibold">Capital sugerido</p>
          <p className="mt-0.5 text-[7px] text-white/40">$ 318.400</p>
        </div>

        <div className="rounded-[11px] border border-white/8 p-2.5">
          <BarChart3 size={11} className="text-red-500" />
          <p className="mt-1 text-[7px] font-semibold">Cobertura</p>
          <p className="mt-0.5 text-[7px] text-white/40">14 días</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setRefreshed((value) => !value)}
        className="mt-2 min-h-8 rounded-[10px] border border-white/10 bg-white/[0.035] px-3 text-[7px] font-semibold text-white/72 transition hover:bg-white/[0.06] hover:text-white"
      >
        {refreshed ? "Ver análisis inicial" : "Actualizar análisis"}
      </button>
    </div>
  );
}

function MiniRow({
  icon: Icon,
  title,
  body,
  onClick
}: {
  icon: typeof ShoppingCart;
  title: string;
  body: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 items-center gap-2.5 rounded-[11px] border border-white/8 bg-white/[0.035] px-2.5 py-2 text-left transition hover:bg-white/[0.06]"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-red-500/10 text-red-500">
        <Icon size={11} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[8px] font-semibold">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[6px] text-white/35">
          {body}
        </span>
      </span>
    </button>
  );
}
