"use client";

import {
  BarChart3,
  Boxes,
  Bot,
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
  const screen = screens[screenIndex]?.id ?? "dashboard";
  const manualPauseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setScreenIndex((current) => (current + 1) % screens.length);
    }, 4200);

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

  const cycleDynamicIsland = () => {
    const sizes: DynamicIslandSize[] = [
      "default",
      "expanded",
      "large",
      "ultra"
    ];
    const index = sizes.indexOf(dynamicIslandSize);
    setDynamicIslandSize(sizes[(index + 1) % sizes.length]);
  };

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

  return (
    <div
      className="relative mx-auto flex w-full max-w-[500px] flex-col items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (manualPauseTimerRef.current === null) {
          setPaused(false);
        }
      }}
    >
      <div className="absolute inset-x-[8%] top-[5%] h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(143,0,0,.18),rgba(143,0,0,.07)_42%,transparent_72%)]" />

      <div
        className="relative mx-auto"
        style={{
          width: "min(340px, 38dvh, calc(100vw - 96px))",
          maxWidth: "100%"
        }}
      >
        <IPhone17ProMax
          batteryLevel={94}
          dynamicIslandSize={dynamicIslandSize}
          frameColor={frameColor}
          onDynamicIslandTap={cycleDynamicIsland}
          signalStrength={4}
          time="9:41"
          className="relative"
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#050506] px-[5.8%] pb-[7%] pt-[8%] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-[0.18em] text-red-500 sm:text-[8px]">
                  Global Stock
                </p>
                <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.04em] sm:text-[17px]">
                  {screen === "dashboard" && "Centro de control"}
                  {screen === "pos" && "Punto de venta"}
                  {screen === "inventory" && "Inventario"}
                  {screen === "ai" && "Global Intelligence"}
                </h3>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#8F0000] text-[9px] font-bold">
                GS
              </span>
            </div>

            <div
              key={screen}
              className="mt-[6%] flex min-h-0 flex-1 flex-col animate-[gs-phone-screen-in_.34s_cubic-bezier(.22,1,.36,1)_both]"
            >
              {screen === "dashboard" && <DashboardDemo />}
              {screen === "pos" && <PosDemo />}
              {screen === "inventory" && <InventoryDemo />}
              {screen === "ai" && <AiDemo />}
            </div>

            <div className="mt-[5%] grid grid-cols-4 gap-1.5 border-t border-white/8 pt-3">
              {screens.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseScreen(item.id)}
                  className={
                    "rounded-[9px] px-1 py-2 text-center text-[6px] font-semibold transition sm:text-[7px] " +
                    (screen === item.id
                      ? "bg-red-500/12 text-red-400"
                      : "text-white/35 hover:text-white/65")
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </IPhone17ProMax>

        <button
          type="button"
          onClick={() => moveScreen(-1)}
          className="absolute left-0 top-1/2 z-[70] grid h-11 w-11 -translate-x-2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/16 bg-black/90 text-white shadow-xl backdrop-blur transition hover:scale-105 hover:border-red-500/70 hover:bg-black active:scale-90 sm:-translate-x-5"
          aria-label="Vista anterior"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          type="button"
          onClick={() => moveScreen(1)}
          className="absolute right-0 top-1/2 z-[70] grid h-11 w-11 translate-x-2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/16 bg-black/90 text-white shadow-xl backdrop-blur transition hover:scale-105 hover:border-red-500/70 hover:bg-black active:scale-90 sm:translate-x-5"
          aria-label="Vista siguiente"
        >
          <ChevronRight size={17} />
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
              onClick={() => setFrameColor(color)}
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

function DashboardDemo() {
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ["Ventas", "$ 2,4 M"],
          ["Stock", "1.248"],
          ["Margen", "31%"]
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[12px] border border-white/8 bg-white/[0.045] p-2.5"
          >
            <p className="text-[6px] uppercase tracking-[0.08em] text-white/35 sm:text-[7px]">
              {label}
            </p>
            <p className="mt-1 text-[10px] font-semibold sm:text-[11px]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-[5%] rounded-[15px] border border-white/8 bg-[linear-gradient(180deg,rgba(143,0,0,.12),rgba(255,255,255,.018))] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-semibold">Flujo de ventas</span>
          <TrendingUp size={11} className="text-red-500" />
        </div>
        <div className="mt-3 flex h-20 items-end gap-1.5 sm:h-24">
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

      <div className="mt-[5%] space-y-1.5">
        <MiniRow
          icon={ShoppingCart}
          title="Punto de venta"
          body="Caja lista para operar"
        />
        <MiniRow
          icon={Boxes}
          title="Almacén"
          body="Stock por sucursal y variante"
        />
        <MiniRow
          icon={Sparkles}
          title="Global Intelligence"
          body="Análisis del negocio"
        />
      </div>
    </>
  );
}

function PosDemo() {
  const rows = [
    ["Reel frontal 5000", "1", "$ 89.900"],
    ["Señuelo minnow", "2", "$ 31.800"],
    ["Línea multifilamento", "1", "$ 18.500"]
  ];

  return (
    <>
      <div className="rounded-[15px] border border-white/8 bg-white/[0.035] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-semibold">Venta en curso</span>
          <ShoppingCart size={11} className="text-red-500" />
        </div>
        <div className="mt-3 space-y-2">
          {rows.map(([name, qty, price], index) => (
            <div
              key={name}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-[10px] bg-white/[0.035] px-2.5 py-2"
              style={{ animationDelay: index * 70 + "ms" }}
            >
              <span className="truncate text-[7px] font-medium">{name}</span>
              <span className="text-[6px] text-white/35">x{qty}</span>
              <span className="text-[7px] font-semibold">{price}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-[13px] border border-white/8 p-3">
          <p className="text-[6px] uppercase tracking-[.08em] text-white/35">
            Total
          </p>
          <p className="mt-1 text-[13px] font-semibold">$ 140.200</p>
        </div>
        <button
          type="button"
          className="rounded-[13px] bg-[#8F0000] px-3 text-[8px] font-semibold text-white active:scale-[.98]"
        >
          Cobrar
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-[13px] border border-white/8 bg-white/[0.025] p-3">
        <div>
          <p className="text-[7px] font-semibold">Escáner rápido</p>
          <p className="mt-0.5 text-[6px] text-white/35">
            Código de barras o QR
          </p>
        </div>
        <ScanLine size={16} className="text-red-500" />
      </div>
    </>
  );
}

function InventoryDemo() {
  const products = [
    ["Caña carbono 2,40 m", "18", "OK"],
    ["Reel baitcasting", "4", "Bajo"],
    ["Anzuelo 3/0 x10", "73", "OK"],
    ["Señuelo 11 cm", "0", "Sin stock"]
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[13px] border border-white/8 p-3">
          <Boxes size={13} className="text-red-500" />
          <p className="mt-2 text-[13px] font-semibold">1.248</p>
          <p className="text-[6px] text-white/35">unidades</p>
        </div>
        <div className="rounded-[13px] border border-red-500/20 bg-red-500/[0.055] p-3">
          <PackageSearch size={13} className="text-red-500" />
          <p className="mt-2 text-[13px] font-semibold">12</p>
          <p className="text-[6px] text-white/35">para reponer</p>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {products.map(([name, stock, state]) => (
          <div
            key={name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-[11px] border border-white/8 bg-white/[0.025] p-2.5"
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
          </div>
        ))}
      </div>
    </>
  );
}

function AiDemo() {
  return (
    <>
      <div className="rounded-[15px] border border-red-500/20 bg-red-500/[0.055] p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-red-500/12 text-red-400">
            <Bot size={12} />
          </span>
          <div>
            <p className="text-[8px] font-semibold">Global Intelligence</p>
            <p className="text-[6px] text-white/35">Contexto del negocio activo</p>
          </div>
        </div>

        <div className="mt-3 rounded-[11px] bg-black/35 p-2.5">
          <p className="text-[7px] leading-4 text-white/72">
            “¿Qué debería reponer esta semana?”
          </p>
        </div>

        <div className="mt-2 rounded-[11px] border border-white/8 bg-white/[0.03] p-2.5">
          <p className="text-[7px] leading-4 text-white/70">
            Priorizaría 12 productos. El reel baitcasting tiene cobertura para
            menos de 5 días y concentra el mayor riesgo de quiebre.
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-[12px] border border-white/8 p-2.5">
          <CircleDollarSign size={12} className="text-red-500" />
          <p className="mt-1.5 text-[8px] font-semibold">Capital sugerido</p>
          <p className="mt-0.5 text-[7px] text-white/40">$ 318.400</p>
        </div>
        <div className="rounded-[12px] border border-white/8 p-2.5">
          <BarChart3 size={12} className="text-red-500" />
          <p className="mt-1.5 text-[8px] font-semibold">Cobertura</p>
          <p className="mt-0.5 text-[7px] text-white/40">14 días</p>
        </div>
      </div>
    </>
  );
}

function MiniRow({
  icon: Icon,
  title,
  body
}: {
  icon: typeof ShoppingCart;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] border border-white/8 bg-white/[0.035] p-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-red-500/10 text-red-500">
        <Icon size={11} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[8px] font-semibold sm:text-[9px]">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[6px] text-white/35 sm:text-[7px]">
          {body}
        </p>
      </div>
    </div>
  );
}
