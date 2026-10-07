"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const sectionIds = [
  "download-hero",
  "download-features",
  "download-feature-catalog",
  "download-sectors",
  "download-install",
  "download-security",
  "download-faq"
];

const FALLBACK_HEADER_HEIGHT = 68;
const SECTION_GAP = 14;

function getSections() {
  if (typeof document === "undefined") return [];

  return sectionIds
    .map((id) => document.getElementById(id))
    .filter((item): item is HTMLElement => Boolean(item));
}

function getHeaderOffset() {
  if (typeof document === "undefined") {
    return FALLBACK_HEADER_HEIGHT + SECTION_GAP;
  }

  const header = document.querySelector<HTMLElement>(".gs-public-header");
  const height = header?.getBoundingClientRect().height ?? FALLBACK_HEADER_HEIGHT;

  return Math.ceil(height) + SECTION_GAP;
}

function getDocumentTop(element: HTMLElement) {
  return window.scrollY + element.getBoundingClientRect().top;
}

function getActiveSectionIndex(sections: HTMLElement[]) {
  if (!sections.length) return 0;

  const marker = window.scrollY + getHeaderOffset() + 2;
  let current = 0;

  sections.forEach((section, index) => {
    if (getDocumentTop(section) <= marker) {
      current = index;
    }
  });

  return current;
}

export function DownloadScrollNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [availableCount, setAvailableCount] = useState(sectionIds.length);

  const updatePosition = useCallback(() => {
    const sections = getSections();
    setAvailableCount(sections.length || sectionIds.length);

    if (!sections.length) return;

    setActiveIndex(getActiveSectionIndex(sections));
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("gs-download-arrow-scroll");
    document.body.classList.add("gs-download-arrow-scroll");

    let frame = window.requestAnimationFrame(updatePosition);

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePosition);
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      document.documentElement.classList.remove("gs-download-arrow-scroll");
      document.body.classList.remove("gs-download-arrow-scroll");
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [updatePosition]);

  const goTo = useCallback((index: number) => {
    const sections = getSections();
    const safeIndex = Math.max(0, Math.min(sections.length - 1, index));
    const target = sections[safeIndex];

    if (!target) return;

    const top = Math.max(0, getDocumentTop(target) - getHeaderOffset());

    window.scrollTo({
      top,
      behavior: "smooth"
    });

    window.setTimeout(() => {
      setActiveIndex(safeIndex);
    }, 180);
  }, []);

  const goPrevious = () => {
    const sections = getSections();
    if (!sections.length) return;

    const current = getActiveSectionIndex(sections);
    const offset = getHeaderOffset();
    const currentTop = Math.max(0, getDocumentTop(sections[current]) - offset);

    // If the user is already inside a long section (especially the cinematic
    // hero), the first "up" press returns to that section's real beginning.
    if (window.scrollY - currentTop > 96) {
      goTo(current);
      return;
    }

    goTo(current - 1);
  };

  const goNext = () => {
    const sections = getSections();
    if (!sections.length) return;

    const current = getActiveSectionIndex(sections);
    goTo(current + 1);
  };

  return (
    <div className="gs-download-scroll-nav fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-2 md:flex">
      <button
        type="button"
        onClick={goPrevious}
        disabled={activeIndex <= 0 && windowScrollNearTop()}
        className="grid h-9 w-9 place-items-center rounded-full border border-[#342025] bg-black/70 text-white/70 shadow-xl backdrop-blur transition enabled:hover:bg-black enabled:hover:text-white disabled:cursor-default disabled:opacity-25"
        aria-label="Subir a la sección anterior"
      >
        <ChevronUp size={16} />
      </button>

      <div className="flex flex-col items-center gap-1.5 rounded-full border border-[#342025] bg-black/55 px-2 py-3 backdrop-blur">
        {sectionIds.slice(0, availableCount).map((id, index) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(index)}
            className={
              "rounded-full transition-all duration-200 " +
              (index === activeIndex
                ? "h-5 w-1.5 bg-[#8F0000]"
                : "h-1.5 w-1.5 bg-white/25 hover:bg-white/50")
            }
            aria-current={index === activeIndex ? "true" : undefined}
            aria-label={"Ir a sección " + (index + 1)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={goNext}
        disabled={activeIndex >= availableCount - 1}
        className="grid h-9 w-9 place-items-center rounded-full border border-[#342025] bg-black/70 text-white/70 shadow-xl backdrop-blur transition enabled:hover:bg-black enabled:hover:text-white disabled:cursor-default disabled:opacity-25"
        aria-label="Bajar a la sección siguiente"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}

function windowScrollNearTop() {
  if (typeof window === "undefined") return true;
  return window.scrollY < 8;
}
