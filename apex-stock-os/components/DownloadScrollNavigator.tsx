"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const sectionIds = [
  "download-hero",
  "download-features",
  "download-feature-catalog",
  "download-sectors",
  "download-install",
  "download-security",
  "download-faq"
];

const HERO_SCENE_COUNT = 4;
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
  const height =
    header?.getBoundingClientRect().height ?? FALLBACK_HEADER_HEIGHT;

  return Math.ceil(height) + SECTION_GAP;
}

function getDocumentTop(element: HTMLElement) {
  return window.scrollY + element.getBoundingClientRect().top;
}

function getHeroMetrics(hero: HTMLElement) {
  const headerOffset = getHeaderOffset();
  const stickyHeight = Math.max(1, window.innerHeight - FALLBACK_HEADER_HEIGHT);
  const top = Math.max(0, getDocumentTop(hero) - headerOffset);
  const travel = Math.max(
    window.innerHeight * 0.75,
    hero.offsetHeight - stickyHeight
  );

  return {
    top,
    travel,
    end: top + travel
  };
}

function isInsideHero(hero: HTMLElement) {
  const { top, end } = getHeroMetrics(hero);
  const y = window.scrollY;

  return y >= top - 8 && y <= end + 8;
}

function getHeroSceneIndex(hero: HTMLElement) {
  const { top, travel } = getHeroMetrics(hero);
  const progress = Math.min(
    0.999,
    Math.max(0, (window.scrollY - top) / travel)
  );

  return Math.min(
    HERO_SCENE_COUNT - 1,
    Math.floor(progress * HERO_SCENE_COUNT)
  );
}

function getHeroSceneTop(hero: HTMLElement, sceneIndex: number) {
  const { top, travel } = getHeroMetrics(hero);
  const safeScene = Math.max(
    0,
    Math.min(HERO_SCENE_COUNT - 1, sceneIndex)
  );

  const progress = (safeScene + 0.5) / HERO_SCENE_COUNT;
  return Math.round(top + travel * progress);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type CachedLayout = {
  sections: HTMLElement[];
  tops: number[];
};

export function DownloadScrollNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [availableCount, setAvailableCount] = useState(sectionIds.length);
  const [canGoUp, setCanGoUp] = useState(false);
  const layoutRef = useRef<CachedLayout>({ sections: [], tops: [] });
  const wheelAccumulatorRef = useRef(0);
  const wheelLockUntilRef = useRef(0);

  const updatePosition = useCallback(() => {
    const { tops } = layoutRef.current;
    if (!tops.length) return;

    const marker = window.scrollY + 2;
    let current = 0;

    for (let index = 0; index < tops.length; index += 1) {
      if (tops[index] <= marker) current = index;
      else break;
    }

    const currentTop = tops[current] ?? 0;

    setActiveIndex((value) => (value === current ? value : current));
    setCanGoUp((value) => {
      const next = current > 0 || window.scrollY - currentTop > 8;
      return value === next ? value : next;
    });
  }, []);

  const measureLayout = useCallback(() => {
    const sections = getSections();
    const offset = getHeaderOffset();

    layoutRef.current = {
      sections,
      tops: sections.map((section) =>
        Math.max(0, getDocumentTop(section) - offset)
      )
    };

    setAvailableCount((value) => {
      const next = sections.length || sectionIds.length;
      return value === next ? value : next;
    });

    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    document.documentElement.classList.add("gs-download-arrow-scroll");
    document.body.classList.add("gs-download-arrow-scroll");

    let frame = window.requestAnimationFrame(measureLayout);

    const schedulePositionUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePosition);
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureLayout);
    };

    window.addEventListener("scroll", schedulePositionUpdate, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleMeasure)
        : null;

    const storefront = document.querySelector<HTMLElement>(".gs-storefront");
    const header = document.querySelector<HTMLElement>(".gs-public-header");

    if (storefront) resizeObserver?.observe(storefront);
    if (header) resizeObserver?.observe(header);

    return () => {
      document.documentElement.classList.remove("gs-download-arrow-scroll");
      document.body.classList.remove("gs-download-arrow-scroll");
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedulePositionUpdate);
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [measureLayout, updatePosition]);

  const scrollToTop = useCallback(
    (top: number) => {
      const maxTop = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const targetTop = Math.max(0, Math.min(maxTop, Math.round(top)));
      const startTop = window.scrollY;
      const behavior: ScrollBehavior = prefersReducedMotion()
        ? "auto"
        : "smooth";

      window.scrollTo({
        top: targetTop,
        behavior
      });

      if (behavior === "smooth") {
        window.setTimeout(() => {
          const didNotStart =
            Math.abs(window.scrollY - startTop) < 3 &&
            Math.abs(targetTop - startTop) > 24;

          if (didNotStart) {
            window.scrollTo({
              top: targetTop,
              behavior: "auto"
            });
          }

          updatePosition();
        }, 180);
      } else {
        window.requestAnimationFrame(updatePosition);
      }
    },
    [updatePosition]
  );

  const goToSection = useCallback(
    (index: number) => {
      const { sections, tops } = layoutRef.current;
      const safeIndex = Math.max(0, Math.min(sections.length - 1, index));
      const targetTop = tops[safeIndex];

      if (targetTop === undefined) {
        measureLayout();
        return;
      }

      scrollToTop(targetTop);
    },
    [measureLayout, scrollToTop]
  );

  const goPrevious = useCallback(() => {
    const { sections, tops } = layoutRef.current;
    if (!sections.length) return;

    const hero = document.getElementById("download-hero");

    if (hero && isInsideHero(hero)) {
      const currentScene = getHeroSceneIndex(hero);

      if (currentScene > 0) {
        scrollToTop(getHeroSceneTop(hero, currentScene - 1));
      } else {
        scrollToTop(getHeroMetrics(hero).top);
      }
      return;
    }

    const marker = window.scrollY + 2;
    let current = 0;

    for (let index = 0; index < tops.length; index += 1) {
      if (tops[index] <= marker) current = index;
      else break;
    }

    const currentTop = tops[current] ?? 0;

    if (window.scrollY - currentTop > 96) {
      goToSection(current);
      return;
    }

    goToSection(current - 1);
  }, [goToSection, scrollToTop]);

  const goNext = useCallback(() => {
    const { sections, tops } = layoutRef.current;
    if (!sections.length) return;

    const hero = document.getElementById("download-hero");

    if (hero && isInsideHero(hero)) {
      const currentScene = getHeroSceneIndex(hero);

      if (currentScene < HERO_SCENE_COUNT - 1) {
        scrollToTop(getHeroSceneTop(hero, currentScene + 1));
      } else {
        goToSection(1);
      }
      return;
    }

    const marker = window.scrollY + 2;
    let current = 0;

    for (let index = 0; index < tops.length; index += 1) {
      if (tops[index] <= marker) current = index;
      else break;
    }

    goToSection(current + 1);
  }, [goToSection, scrollToTop]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (isEditing || event.repeat) return;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goNext, goPrevious]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) < 1) return;

      const hero = document.getElementById("download-hero");
      if (!hero || !isInsideHero(hero)) {
        wheelAccumulatorRef.current = 0;
        return;
      }

      event.preventDefault();

      const now = performance.now();
      if (now < wheelLockUntilRef.current) return;

      wheelAccumulatorRef.current += event.deltaY;

      if (Math.abs(wheelAccumulatorRef.current) < 46) return;

      const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
      wheelAccumulatorRef.current = 0;
      wheelLockUntilRef.current = now + 620;

      if (direction > 0) goNext();
      else goPrevious();
    };

    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, [goNext, goPrevious]);

  return (
    <div className="gs-download-scroll-nav fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-2 md:flex">
      <button
        type="button"
        onClick={goPrevious}
        disabled={!canGoUp}
        className="grid h-9 w-9 place-items-center rounded-full border border-[#342025] bg-black/70 text-white/70 shadow-xl backdrop-blur transition enabled:hover:bg-black enabled:hover:text-white disabled:cursor-default disabled:opacity-25"
        aria-label="Subir"
      >
        <ChevronUp size={16} />
      </button>

      <div className="flex flex-col items-center gap-1.5 rounded-full border border-[#342025] bg-black/55 px-2 py-3 backdrop-blur">
        {sectionIds.slice(0, availableCount).map((id, index) => (
          <button
            key={id}
            type="button"
            onClick={() => goToSection(index)}
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
        aria-label="Bajar"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
