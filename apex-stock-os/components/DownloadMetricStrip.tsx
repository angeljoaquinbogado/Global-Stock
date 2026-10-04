"use client";

import { Clock3, TrendingUp, Zap } from "lucide-react";

const metrics = [
  {
    value: "40h",
    label: "ahorradas/mes",
    icon: Clock3,
    accent: "#34d399",
    iconBg: "rgba(52,211,153,.10)"
  },
  {
    value: "160x",
    label: "más rápido facturando",
    icon: Zap,
    accent: "#f6b95b",
    iconBg: "rgba(246,185,91,.10)"
  },
  {
    value: "80%",
    label: "cobros más rápidos",
    icon: TrendingUp,
    accent: "#6ea8ff",
    iconBg: "rgba(110,168,255,.10)"
  }
];

export function DownloadMetricStrip() {
  return (
    <section className="border-y border-white/[0.045] bg-[#09090b]">
      <div className="mx-auto grid w-full max-w-[1240px] sm:grid-cols-3">
        {metrics.map(({ value, label, icon: Icon, accent, iconBg }, index) => (
          <div
            key={label}
            className={
              "group relative flex min-h-[104px] items-center gap-4 px-5 py-5 transition-colors duration-150 hover:bg-white/[0.025] sm:px-7 " +
              (index > 0 ? "border-t border-white/[0.045] sm:border-l sm:border-t-0" : "")
            }
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px]"
              style={{ background: iconBg, color: accent }}
              aria-hidden="true"
            >
              <Icon size={18} strokeWidth={2} />
            </span>

            <div className="min-w-0">
              <div
                className="text-[28px] font-semibold leading-none tracking-[-0.055em] transition-[filter,transform] duration-150 group-hover:brightness-110 sm:text-[30px]"
                style={{ color: accent }}
              >
                {value}
              </div>
              <p className="mt-2 whitespace-nowrap text-[12px] font-medium text-[#9b9ba4] sm:text-[13px]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
