"use client";

import {
  Boxes,
  MonitorSmartphone,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const metrics = [
  {
    value: "12",
    label: "módulos conectados",
    icon: Boxes,
    accent: "#00833e",
    iconBg: "#eaf7ef"
  },
  {
    value: "1",
    label: "stock físico + online",
    icon: RefreshCw,
    accent: "#c85a00",
    iconBg: "#fff1e6"
  },
  {
    value: "3",
    label: "entornos instalables",
    icon: MonitorSmartphone,
    accent: "#00833e",
    iconBg: "#eaf7ef"
  }
];

export function DownloadMetricStrip() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="border-y border-black/[0.07] bg-white/72">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center overflow-x-auto px-4 py-4 sm:px-8">
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
                    className="mx-2 h-6 w-px bg-[#d9dde3] sm:mx-3"
                    animate={{
                      opacity: expanded || active === index - 1 ? 0.38 : 1,
                      scaleY: expanded || active === index - 1 ? 0.7 : 1
                    }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}

                <motion.button
                  type="button"
                  layout
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive((current) => current === index ? null : index)}
                  className="group relative flex h-12 items-center overflow-hidden rounded-[11px] px-3 text-left outline-none sm:px-4"
                  animate={{
                    backgroundColor: expanded
                      ? "rgba(235,239,243,0.96)"
                      : "rgba(255,255,255,0)",
                    boxShadow: expanded
                      ? "0 8px 22px rgba(15,23,42,0.055)"
                      : "0 0 0 rgba(15,23,42,0)"
                  }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  aria-pressed={expanded}
                >
                  <motion.span
                    className="mr-0 grid shrink-0 place-items-center overflow-hidden rounded-full"
                    animate={{
                      width: expanded ? 22 : 0,
                      height: expanded ? 22 : 0,
                      marginRight: expanded ? 9 : 0,
                      opacity: expanded ? 1 : 0,
                      scale: expanded ? 1 : 0.7
                    }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    style={{ background: iconBg, color: accent }}
                    aria-hidden="true"
                  >
                    <Icon size={12} strokeWidth={2} />
                  </motion.span>

                  <motion.span
                    className="text-[22px] font-semibold leading-none tracking-[-0.045em] sm:text-[24px]"
                    animate={{ color: expanded ? accent : "#0f172a" }}
                    transition={{ duration: 0.18 }}
                  >
                    {value}
                  </motion.span>

                  <span className="ml-1.5 whitespace-nowrap text-[12px] font-medium text-[#596273] sm:text-[13px]">
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
