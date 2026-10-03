"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const sectionIds = [
  "download-hero",
  "download-features",
  "download-install",
  "download-security"
];

export function DownloadScrollNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);

  const sections = useMemo(
    () =>
      sectionIds
        .map((id) => document.getElementById(id))
        .filter((item): item is HTMLElement => Boolean(item)),
    []
  );

  useEffect(() => {
    const update = () => {
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

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  const goTo = (index: number) => {
    const target = sections[index];
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  if (!sections.length) return null;

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
        {sections.map((section, index) => (
          <button
            key={section.id}
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
          goTo(Math.min(sections.length - 1, activeIndex + 1))
        }
        disabled={activeIndex >= sections.length - 1}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/70 text-white/70 shadow-xl backdrop-blur transition enabled:hover:bg-black enabled:hover:text-white disabled:cursor-default disabled:opacity-25"
        aria-label="Bajar a la sección siguiente"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
