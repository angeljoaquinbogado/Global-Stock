"use client";

import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ShoppingCart,
  Sparkles
} from "lucide-react";

import {
  IPhone17ProMax,
  type DynamicIslandSize,
  type IPhone17ProMaxFrameColor
} from "@/components/ui/apple-iphone-17-pro";

const FRAME_SWATCH: Record<
  IPhone17ProMaxFrameColor,
  string
> = {
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

export function GlobalStockPhonePreview() {
  const [dynamicIslandSize, setDynamicIslandSize] =
    useState<DynamicIslandSize>("default");
  const [frameColor, setFrameColor] =
    useState<IPhone17ProMaxFrameColor>("graphite");

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

  return (
    <div className="relative mx-auto flex w-full max-w-[470px] flex-col items-center">
      <div className="absolute inset-x-[8%] top-[5%] h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(143,0,0,.18),rgba(143,0,0,.07)_42%,transparent_72%)]" />

      <IPhone17ProMax
        batteryLevel={94}
        dynamicIslandSize={dynamicIslandSize}
        frameColor={frameColor}
        onDynamicIslandTap={cycleDynamicIsland}
        signalStrength={4}
        time="9:41"
        className="relative"
      >
        <div className="flex h-full min-h-0 flex-col bg-[#050506] px-[5.8%] pb-[7%] pt-[8%] text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[7px] font-bold uppercase tracking-[0.18em] text-red-500 sm:text-[8px]">
                Global Stock
              </p>
              <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.04em] sm:text-[17px]">
                Centro de control
              </h3>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#8F0000] text-[9px] font-bold">
              GS
            </span>
          </div>

          <div className="mt-[7%] grid grid-cols-3 gap-1.5">
            {[
              ["Ventas", "$ 0"],
              ["Stock", "0"],
              ["Margen", "0%"]
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
              <span className="text-[8px] font-semibold">
                Flujo de ventas
              </span>
              <BarChart3 size={11} className="text-red-500" />
            </div>
            <div className="mt-3 flex h-20 items-end gap-1.5 sm:h-24">
              {[22, 34, 28, 45, 38, 52, 42].map((height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t-[3px] bg-gradient-to-t from-red-950 to-red-600"
                  style={{ height: height + "%" }}
                />
              ))}
            </div>
          </div>

          <div className="mt-[5%] space-y-1.5">
            {[
              {
                icon: ShoppingCart,
                title: "Punto de venta",
                body: "Caja lista para operar"
              },
              {
                icon: Boxes,
                title: "Almacén",
                body: "Stock por sucursal y variante"
              },
              {
                icon: Sparkles,
                title: "Global Intelligence",
                body: "Análisis del negocio"
              }
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-center gap-2.5 rounded-[12px] border border-white/8 bg-white/[0.035] p-2.5"
              >
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
            ))}
          </div>

          <div className="mt-auto grid grid-cols-4 gap-1.5 border-t border-white/8 pt-3">
            {["Inicio", "Caja", "Stock", "Más"].map((item, index) => (
              <div
                key={item}
                className={
                  "rounded-[9px] px-1 py-2 text-center text-[6px] font-semibold sm:text-[7px] " +
                  (index === 0
                    ? "bg-red-500/12 text-red-400"
                    : "text-white/35")
                }
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </IPhone17ProMax>

      <div className="relative mt-5 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {frameColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFrameColor(color)}
              className={
                "h-7 w-7 rounded-full border-2 transition-[transform,border-color] duration-150 ease-out " +
                (frameColor === color
                  ? "scale-110 border-white"
                  : "border-white/10")
              }
              style={{ background: FRAME_SWATCH[color] }}
              aria-label={"Marco " + color}
            />
          ))}
        </div>
        <p className="text-[10px] text-white/38">
          Elegí el marco · tocá Dynamic Island
        </p>
      </div>
    </div>
  );
}
