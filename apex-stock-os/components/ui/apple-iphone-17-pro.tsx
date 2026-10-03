"use client";

import type { CSSProperties, ReactNode } from "react";

export type DynamicIslandSize =
  | "default"
  | "expanded"
  | "large"
  | "ultra";

export type IPhone17ProMaxFrameColor =
  | "graphite"
  | "silver"
  | "gold"
  | "blue";

type Props = {
  children?: ReactNode;
  batteryLevel?: number;
  dynamicIslandSize?: DynamicIslandSize;
  frameColor?: IPhone17ProMaxFrameColor;
  onDynamicIslandTap?: () => void;
  signalStrength?: 0 | 1 | 2 | 3 | 4;
  time?: string;
  className?: string;
};

const FRAME: Record<
  IPhone17ProMaxFrameColor,
  { shell: string; edge: string; highlight: string }
> = {
  graphite: {
    shell: "#343637",
    edge: "#111213",
    highlight: "#686b6c"
  },
  silver: {
    shell: "#d8d8d3",
    edge: "#8f918f",
    highlight: "#f4f4ef"
  },
  gold: {
    shell: "#d96b4d",
    edge: "#7d3124",
    highlight: "#f3a386"
  },
  blue: {
    shell: "#1769b2",
    edge: "#083863",
    highlight: "#62a8e5"
  }
};

const ISLAND_SCALE: Record<DynamicIslandSize, number> = {
  default: 0.41,
  expanded: 0.57,
  large: 0.76,
  ultra: 1
};

export function IPhone17ProMax({
  children,
  batteryLevel = 94,
  dynamicIslandSize = "default",
  frameColor = "graphite",
  onDynamicIslandTap,
  signalStrength = 4,
  time = "9:41",
  className = ""
}: Props) {
  const frame = FRAME[frameColor];
  const safeBattery = Math.max(0, Math.min(100, batteryLevel));

  const style = {
    "--iphone-frame": frame.shell,
    "--iphone-edge": frame.edge,
    "--iphone-highlight": frame.highlight
  } as CSSProperties;

  return (
    <div
      className={
        "relative mx-auto w-full max-w-[370px] select-none " + className
      }
      style={style}
      aria-label="iPhone 17 Pro Max preview"
    >
      <div
        className="relative aspect-[0.474/1] rounded-[15%/7.3%] p-[2.4%] shadow-[0_45px_110px_rgba(0,0,0,.5),0_0_0_1px_var(--iphone-edge),inset_0_0_0_1px_rgba(255,255,255,.34)] transition-[background,box-shadow] duration-300"
        style={{
          background:
            "linear-gradient(128deg,var(--iphone-edge)_0%,var(--iphone-frame)_15%,var(--iphone-highlight)_39%,var(--iphone-frame)_58%,var(--iphone-edge)_100%)",
          boxShadow:
            "0 45px 110px rgba(0,0,0,.5), 0 0 0 1px var(--iphone-edge), inset 0 0 0 1px rgba(255,255,255,.34), inset 0 0 28px color-mix(in srgb, var(--iphone-highlight) 28%, transparent)"
        }}
      >
        <span
          className="pointer-events-none absolute inset-[.75%] rounded-[14.4%/7%] border transition-colors duration-300"
          style={{ borderColor: "var(--iphone-highlight)" }}
        />
        <span className="absolute -left-[1.2%] top-[18%] h-[8.5%] w-[1.5%] rounded-l-full bg-[var(--iphone-frame)] shadow-[inset_0_0_0_1px_var(--iphone-highlight)] transition-colors duration-300" />
        <span className="absolute -left-[1.2%] top-[30%] h-[13%] w-[1.5%] rounded-l-full bg-[var(--iphone-frame)] shadow-[inset_0_0_0_1px_var(--iphone-highlight)] transition-colors duration-300" />
        <span className="absolute -right-[1.2%] top-[27%] h-[17%] w-[1.5%] rounded-r-full bg-[var(--iphone-frame)] shadow-[inset_0_0_0_1px_var(--iphone-highlight)] transition-colors duration-300" />

        <div
          className="relative h-full overflow-hidden rounded-[13.7%/6.7%] border bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)] transition-colors duration-300"
          style={{ borderColor: "var(--iphone-edge)" }}
        >
          <div className="absolute inset-[1.4%] overflow-hidden rounded-[12.7%/6.1%] bg-[#050505]">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[4.9%] items-center justify-between px-[7.2%] text-[10px] font-semibold tracking-[-0.02em] text-white sm:text-[11px]">
              <span className="tabular-nums">{time}</span>

              <div className="flex items-center gap-[5px]" aria-label="Estado del iPhone">
                <svg
                  viewBox="0 0 18 11"
                  className="h-[10px] w-[17px]"
                  aria-label="Señal celular"
                >
                  {[0, 1, 2, 3].map((bar) => {
                    const heights = [4, 6, 8, 10];
                    const height = heights[bar];
                    return (
                      <rect
                        key={bar}
                        x={bar * 4.2}
                        y={10 - height}
                        width="2.6"
                        height={height}
                        rx="1.15"
                        fill={
                          bar < signalStrength
                            ? "currentColor"
                            : "rgba(255,255,255,.24)"
                        }
                      />
                    );
                  })}
                </svg>

                <svg
                  viewBox="0 0 18 13"
                  className="h-[11px] w-[16px]"
                  aria-label="Wi-Fi"
                  fill="none"
                >
                  <path
                    d="M1.4 4.4C5.55.95 12.45.95 16.6 4.4"
                    stroke="currentColor"
                    strokeWidth="1.65"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4.1 7.2c2.72-2.2 7.08-2.2 9.8 0"
                    stroke="currentColor"
                    strokeWidth="1.65"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7.1 10c1.05-.82 2.75-.82 3.8 0"
                    stroke="currentColor"
                    strokeWidth="1.65"
                    strokeLinecap="round"
                  />
                  <circle cx="9" cy="11.8" r=".9" fill="currentColor" />
                </svg>

                <span
                  className="relative block h-[10px] w-[22px] rounded-[3px] border border-white/90"
                  aria-label={"Batería " + Math.round(safeBattery) + "%"}
                >
                  <span
                    className="absolute bottom-[1px] left-[1px] top-[1px] rounded-[1.5px] bg-white"
                    style={{
                      width:
                        "calc((" +
                        safeBattery +
                        " / 100) * (100% - 2px))"
                    }}
                  />
                  <span className="absolute -right-[2.7px] top-[2.6px] h-[4px] w-[1.8px] rounded-r-[1px] bg-white/70" />
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onDynamicIslandTap}
              className={
                "absolute left-1/2 top-[1.35%] z-40 h-[3.7%] w-[76%] rounded-full bg-black shadow-[0_1px_0_rgba(255,255,255,.08)] transition-transform duration-200 ease-out " +
                (onDynamicIslandTap
                  ? " cursor-pointer active:scale-[.98]"
                  : " cursor-default")
              }
              style={{
                transform:
                  "translateX(-50%) scaleX(" +
                  ISLAND_SCALE[dynamicIslandSize] +
                  ")"
              }}
              aria-label={
                onDynamicIslandTap
                  ? "Change Dynamic Island size"
                  : "Dynamic Island"
              }
            >
              <span className="absolute right-[9%] top-1/2 h-[26%] aspect-square -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#233954,#050607_62%)] opacity-80" />
            </button>

            <div className="absolute inset-0 flex min-h-0 flex-col pt-[5.4%]">
              {children}
            </div>

            <span className="pointer-events-none absolute bottom-[1.2%] left-1/2 z-40 h-[0.55%] w-[34%] -translate-x-1/2 rounded-full bg-white/85" />
          </div>
        </div>
      </div>
    </div>
  );
}
