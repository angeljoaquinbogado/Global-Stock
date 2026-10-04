"use client";

import { Clock3, TrendingUp, Zap } from "lucide-react";

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
  return (
    <section className="bg-[#09090b]">
      <div className="gs-storefront-scroll mx-auto flex w-full max-w-[1240px] items-center justify-start overflow-x-auto px-5 py-5 sm:justify-center sm:px-8 sm:py-6">
        <div className="flex min-w-max items-center">
          {metrics.map(({ value, label, icon: Icon, accent, iconBg }) => (
            <div key={label} className="flex items-center px-3 sm:px-5">
              <div className="group relative">
                <div className="flex h-14 min-w-[236px] items-center rounded-[13px] px-4 transition-[background-color,box-shadow] duration-200 [transition-timing-function:var(--ease-out)] hover:bg-white/[0.045] hover:shadow-[0_8px_24px_rgba(0,0,0,.18)] focus-within:bg-white/[0.045] sm:min-w-[254px]">
                  <span
                    className="absolute left-4 grid h-8 w-8 place-items-center rounded-full opacity-0 transition-[opacity,transform] duration-200 [transform:translate3d(-6px,0,0)_scale(.94)] [transition-timing-function:var(--ease-out)] group-hover:opacity-100 group-hover:[transform:translate3d(0,0,0)_scale(1)] group-focus-within:opacity-100 group-focus-within:[transform:translate3d(0,0,0)_scale(1)]"
                    style={{ background: iconBg, color: accent }}
                    aria-hidden="true"
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>

                  <div className="flex items-baseline whitespace-nowrap transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-hover:translate-x-[40px] group-focus-within:translate-x-[40px]">
                    <span
                      className="text-[27px] font-semibold leading-none tracking-[-0.055em] sm:text-[29px]"
                      style={{
                        color: accent,
                        textShadow: `0 0 18px ${accent}1a`
                      }}
                    >
                      {value}
                    </span>

                    <span className="ml-2 text-[12px] font-medium text-[#9b9ba4] sm:text-[13px]">
                      {label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
