"use client";

import { Clock3, TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";

// Filled geometric bolt stays recognizable at small sizes and at a glance.
function SolidLightning({ size = 17 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.6 1.8 4.4 13h6.8l-1.1 9.2L20 10.3h-6.9l.5-8.5Z"
        fill="currentColor" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

const COUNT_DURATION_MS = 1100;

const metrics = [
  {
    target: 40,
    suffix: "h",
    label: "ahorradas/mes",
    icon: Clock3,
    accent: "#34d399",
    iconBg: "rgba(52,211,153,.11)"
  },
  {
    target: 160,
    suffix: "x",
    label: "más rápido facturando",
    icon: SolidLightning,
    accent: "#f6b95b",
    iconBg: "rgba(246,185,91,.11)"
  },
  {
    target: 80,
    suffix: "%",
    label: "cobros más rápidos",
    icon: TrendingUp,
    accent: "#6ea8ff",
    iconBg: "rgba(110,168,255,.11)"
  }
];

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function writeMetricValues(nodes: Array<HTMLSpanElement | null>, progress: number) {
  const easedProgress = easeOutQuart(progress);
  metrics.forEach(({ target, suffix }, index) => {
    const node = nodes[index];
    if (!node) return;
    const next = String(Math.round(target * easedProgress)) + suffix;
    if (node.textContent !== next) node.textContent = next;
  });
}

export function DownloadMetricStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const valueNodesRef = useRef<Array<HTMLSpanElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      writeMetricValues(valueNodesRef.current, 1);
      startedRef.current = true;
      return;
    }

    const startCount = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const startedAt = performance.now();

      const tick = (now: number) => {
        const rawProgress = Math.min(
          1,
          (now - startedAt) / COUNT_DURATION_MS
        );

        // Animate only three text nodes, not the entire React subtree.
        writeMetricValues(valueNodesRef.current, rawProgress);

        if (rawProgress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          writeMetricValues(valueNodesRef.current, 1);
          frameRef.current = null;
        }
      };

      frameRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        startCount();
        observer.disconnect();
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="gs-download-metric-strip bg-[#09090b]">
      <div className="gs-storefront-scroll mx-auto flex w-full max-w-[1240px] items-center justify-start overflow-x-auto px-5 py-5 sm:justify-center sm:px-8 sm:py-6">
        <div className="flex min-w-max items-center">
          {metrics.map(
            ({ suffix, label, icon: Icon, accent, iconBg }, index) => {

              return (
                <div key={label} className="gs-download-metric-item flex min-w-0 items-center px-3 sm:px-5">
                  <div className="group relative min-w-0 w-full">
                    <div className="gs-download-metric-card flex h-14 min-w-0 items-center overflow-hidden rounded-[13px] px-4 transition-[background-color,box-shadow] duration-200 [transition-timing-function:var(--ease-out)] hover:bg-white/[0.045] hover:shadow-[0_8px_24px_rgba(0,0,0,.18)] focus-within:bg-white/[0.045] sm:min-w-[254px]">
                      <span
                        className="absolute left-4 grid h-8 w-8 place-items-center rounded-full opacity-0 transition-[opacity,transform] duration-200 [transform:translate3d(-6px,0,0)_scale(.94)] [transition-timing-function:var(--ease-out)] group-hover:opacity-100 group-hover:[transform:translate3d(0,0,0)_scale(1)] group-focus-within:opacity-100 group-focus-within:[transform:translate3d(0,0,0)_scale(1)]"
                        style={{ background: iconBg, color: accent }}
                        aria-hidden="true"
                      >
                        <Icon size={17} strokeWidth={2} />
                      </span>

                      <div className="gs-download-metric-content flex min-w-0 items-baseline gap-1.5">
                        <span
                          className="gs-download-metric-value inline-flex min-w-[4ch] tabular-nums text-[27px] font-semibold leading-none tracking-[-0.055em] sm:text-[29px]"
                          style={{
                            color: accent,
                            textShadow: `0 0 18px ${accent}1a`
                          }}
                        >
                          <span ref={(node) => { valueNodesRef.current[index] = node; }}>
                            0{suffix}
                          </span>
                        </span>

                        <span className="gs-download-metric-label min-w-0 text-[12px] font-medium text-[#9b9ba4] sm:text-[13px]">
                          {label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}