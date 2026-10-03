"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

const sectionIds = [
  "download-hero",
  "download-features",
  "download-install",
  "download-security"
];

function getSections() {
  if (typeof document === "undefined") return [];

  return sectionIds
    .map((id) => document.getElementById(id))
    .filter((item): item is HTMLElement => Boolean(item));
}

export function DownloadScrollNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [availableCount, setAvailableCount] = useState(sectionIds.length);

  useEffect(() => {
    const update = () => {
      const sections = getSections();
      setAvailableCount(sections.length || sectionIds.length);
      if (!sections.length) return;

      const viewportCenter = window.innerHeight * 0.45;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - viewportCenter);

        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });

      setActiveIndex(best);
    };

    document.documentElement.classList.add("gs-download-arrow-scroll");
    document.body.classList.add("gs-download-arrow-scroll");

    const frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      document.documentElement.classList.remove("gs-download-arrow-scroll");
      document.body.classList.remove("gs-download-arrow-scroll");
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const goTo = (index: number) => {
    const sections = getSections();
    const target = sections[index];
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  return (
    <div className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-2 lg:flex">
      <button
        type="button"
        onClick={() => goTo(Math.max(0, activeIndex - 1))}
        disabled={activeIndex <= 0}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/70 text-white/70 shadow-xl backdrop-blur transition enabled:hover:bg-black enabled:hover:text-white disabled:cursor-default disabled:opacity-25"
        aria-label="Subir a la sección anterior"
      >
        <ChevronUp size={16} />
      </button>

      <div className="flex flex-col items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2 py-3 backdrop-blur">
        {sectionIds.slice(0, availableCount).map((id, index) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(index)}
            className={
              "rounded-full transition-all duration-200 " +
              (index === activeIndex
                ? "h-5 w-1.5 bg-red-500"
                : "h-1.5 w-1.5 bg-white/25 hover:bg-white/50")
            }
            aria-label={"Ir a sección " + (index + 1)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          goTo(Math.min(availableCount - 1, activeIndex + 1))
        }
        disabled={activeIndex >= availableCount - 1}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/70 text-white/70 shadow-xl backdrop-blur transition enabled:hover:bg-black enabled:hover:text-white disabled:cursor-default disabled:opacity-25"
        aria-label="Bajar a la sección siguiente"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
