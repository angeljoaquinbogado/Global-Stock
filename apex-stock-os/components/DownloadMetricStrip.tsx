"use client";

import {
  Clock3,
  TrendingUp,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const metrics = [
  {
    value: "40h",
    label: "ahorradas/mes",
    icon: Clock3,
    accent: "#42d17f",
    iconBg: "rgba(66,209,127,.12)"
  },
  {
    value: "160x",
    label: "más rápido facturando",
    icon: Zap,
    accent: "#ff9f43",
    iconBg: "rgba(255,159,67,.12)"
  },
  {
    value: "80%",
    label: "cobros más rápidos",
    icon: TrendingUp,
    accent: "#42d17f",
    iconBg: "rgba(66,209,127,.12)"
  }
];

export function DownloadMetricStrip() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="border-y border-white/[0.07] bg-[#09090b]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center overflow-x-auto px-4 py-6 sm:px-8 sm:py-7">
        <div
          className="flex min-w-max items-center"
          onMouseLeave={() => setActive(null)}
        >
          {metrics.map(({ value, label, icon: Icon, accent, iconBg }, index) => {
            const expanded = active === index;

            return (
              <div key={label} className="flex items-center">
                {index > 0 && (
                  <motion.span
                    aria-hidden="true"
                    className="mx-3 h-7 w-px bg-white/12 sm:mx-5"
                    animate={{
                      opacity: expanded || active === index - 1 ? 0.35 : 1,
                      scaleY: expanded || active === index - 1 ? 0.72 : 1
                    }}
                    transition={{
                      duration: 0.2,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                  />
                )}

                <motion.button
                  type="button"
                  layout
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  onClick={() =>
                    setActive((current) =>
                      current === index ? null : index
                    )
                  }
                  className="relative flex h-14 items-center overflow-hidden rounded-[13px] px-4 text-left outline-none sm:px-5"
                  animate={{
                    backgroundColor: expanded
                      ? "rgba(255,255,255,0.075)"
                      : "rgba(255,255,255,0)",
                    boxShadow: expanded
                      ? "0 10px 30px rgba(0,0,0,.22)"
                      : "0 0 0 rgba(0,0,0,0)"
                  }}
                  transition={{
                    duration: 0.22,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  aria-pressed={expanded}
                >
                  <motion.span
                    className="grid shrink-0 place-items-center overflow-hidden rounded-full"
                    animate={{
                      width: expanded ? 30 : 0,
                      height: expanded ? 30 : 0,
                      marginRight: expanded ? 10 : 0,
                      opacity: expanded ? 1 : 0,
                      scale: expanded ? 1 : 0.72
                    }}
                    transition={{
                      duration: 0.22,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    style={{
                      background: iconBg,
                      color: accent
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={16} strokeWidth={2.1} />
                  </motion.span>

                  <motion.span
                    className="text-[22px] font-semibold leading-none tracking-[-0.045em] sm:text-[24px]"
                    animate={{
                      color: expanded ? accent : "#ffffff"
                    }}
                    transition={{ duration: 0.18 }}
                  >
                    {value}
                  </motion.span>

                  <span className="ml-1.5 whitespace-nowrap text-[12px] font-medium text-white/50 sm:text-[13px]">
                    {label}
                  </span>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
