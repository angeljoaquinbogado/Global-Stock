"use client";

import { Clock3, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";

const metrics = [
  {
    value: "40h",
    label: "ahorradas/mes",
    icon: Clock3,
    accent: "#34d399",
    iconBg: "rgba(52,211,153,.11)"
  },
  {
    value: "160x",
    label: "más rápido facturando",
    icon: Zap,
    accent: "#f6b95b",
    iconBg: "rgba(246,185,91,.11)"
  },
  {
    value: "80%",
    label: "cobros más rápidos",
    icon: TrendingUp,
    accent: "#6ea8ff",
    iconBg: "rgba(110,168,255,.11)"
  }
];

export function DownloadMetricStrip() {
  const [active, setActive] = useState<number | null>(null);

  const activate = (index: number) => {
    setActive((current) => (current === index ? current : index));
  };

  return (
    <div className="border-y border-white/[0.045] bg-[#09090b]">
      <div className="gs-storefront-scroll mx-auto flex w-full max-w-[1240px] items-center justify-start overflow-x-auto px-5 py-6 sm:justify-center sm:px-8 sm:py-7">
        <div
          className="flex min-w-max items-center"
          onMouseLeave={() => setActive(null)}
        >
          {metrics.map(({ value, label, icon: Icon, accent, iconBg }, index) => {
            const expanded = active === index;

            return (
              <div key={label} className="flex items-center">
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-2 h-7 w-px bg-white/[0.055] sm:mx-4"
                  />
                )}

                <button
                  type="button"
                  onMouseEnter={() => activate(index)}
                  onFocus={() => activate(index)}
                  onBlur={() => setActive(null)}
                  onClick={() =>
                    setActive((current) =>
                      current === index ? null : index
                    )
                  }
                  className="relative flex h-14 min-w-[248px] items-center rounded-xl px-4 text-left outline-none sm:min-w-[270px]"
                  style={{
                    backgroundColor: expanded
                      ? "rgba(255,255,255,.045)"
                      : "transparent",
                    transition:
                      "background-color 160ms var(--ease-out)"
                  }}
                  aria-pressed={expanded}
                >
                  <span
                    className="absolute left-4 grid h-8 w-8 place-items-center rounded-full"
                    style={{
                      background: iconBg,
                      color: accent,
                      opacity: expanded ? 1 : 0,
                      transform: expanded
                        ? "translate3d(0,0,0) scale(1)"
                        : "translate3d(-6px,0,0) scale(.96)",
                      transition:
                        "transform 160ms var(--ease-out), opacity 140ms ease"
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>

                  <span
                    className="flex items-baseline whitespace-nowrap"
                    style={{
                      transform: expanded
                        ? "translate3d(38px,0,0)"
                        : "translate3d(0,0,0)",
                      transition:
                        "transform 160ms var(--ease-out)"
                    }}
                  >
                    <span
                      className="text-[24px] font-semibold leading-none tracking-[-0.05em] sm:text-[27px]"
                      style={{
                        color: expanded ? accent : "#f5f5f7",
                        transition: "color 140ms ease"
                      }}
                    >
                      {value}
                    </span>

                    <span className="ml-2 text-[12px] font-medium text-[#9b9ba4] sm:text-[13px]">
                      {label}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
