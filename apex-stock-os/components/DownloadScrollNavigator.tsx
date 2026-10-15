"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const sectionIds = [
  "download-hero",
  "download-features",
  "download-feature-catalog",
  "download-network",
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
  // The visual rail has exactly three stable stops, regardless of how many
  // content sections or cinematic scenes are loaded in the page.
  const [activeStage, setActiveStage] = useState<0 | 1 | 2>(0);
  const [canGoUp, setCanGoUp] = useState(false);
  const [canGoDown, setCanGoDown] = useState(true);
  const layoutRef = useRef<CachedLayout>({ sections: [], tops: [] });

  const updatePosition = useCallback(() => {
    if (!layoutRef.current.tops.length) return;

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const progress = maxScroll ? Math.max(0, Math.min(1, window.scrollY / maxScroll)) : 0;
    const stage: 0 | 1 | 2 = progress < 1 / 3 ? 0 : progress < 2 / 3 ? 1 : 2;

    setActiveStage((previous) => previous === stage ? previous : stage);
    setCanGoUp((previous) => previous === (window.scrollY > 8) ? previous : window.scrollY > 8);
    setCanGoDown((previous) => previous === (window.scrollY < maxScroll - 8) ? previous : window.scrollY < maxScroll - 8);
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

    if (window.innerWidth >= 1024 && hero && isInsideHero(hero)) {
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

    if (window.innerWidth >= 1024 && hero && isInsideHero(hero)) {
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

    if (current >= sections.length - 1) {
      scrollToTop(document.documentElement.scrollHeight - window.innerHeight);
    } else {
      goToSection(current + 1);
    }
  }, [goToSection, scrollToTop]);

  const goToRailStage = useCallback((stage: 0 | 1 | 2) => {
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const destination = stage === 0 ? 0 : stage === 1 ? maxScroll / 2 : maxScroll;
    // Update the intent immediately, then scroll to the corresponding stop.
    // This prevents a second arrow click from reusing the prior stage while
    // the browser is still painting/smoothing the first scroll.
    setActiveStage(stage);
    setCanGoUp(stage !== 0);
    setCanGoDown(stage !== 2);
    scrollToTop(destination);
  }, [scrollToTop]);

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

      // The arrow-key slideshow belongs to the cinematic hero only.
      // Elsewhere users must retain normal browser scrolling and controls.
      const isOnControl = Boolean(
        target?.closest('button, a, [role="slider"], [role="tab"], [role="menu"], [role="dialog"]')
      );
      const hero = document.getElementById("download-hero");
      if (
        isOnControl ||
        document.querySelector('[aria-modal="true"]') ||
        !hero ||
        window.innerWidth < 1024 ||
        !isInsideHero(hero)
      ) {
        return;
      }

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

  return (
    <div className="gs-download-scroll-nav fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-2 md:flex">
      <button
        type="button"
        onClick={() => goToRailStage(Math.max(0, activeStage - 1) as 0 | 1 | 2)}
        disabled={!canGoUp}
        className="grid h-9 w-9 place-items-center rounded-full border border-[#342025] bg-black/70 text-white/70 shadow-xl backdrop-blur transition enabled:hover:bg-black enabled:hover:text-white disabled:cursor-default disabled:opacity-25"
        aria-label="Subir"
      >
        <ChevronUp size={16} />
      </button>

      <div data-testid="download-scroll-rail"
        className="gs-download-scroll-rail relative h-[108px] w-[28px] shrink-0 overflow-hidden rounded-full border border-[#342025] bg-black/55 shadow-sm backdrop-blur">
        <span aria-hidden="true"
          data-testid="download-scroll-indicator"
          data-stage={activeStage}
          className="pointer-events-none absolute left-1/2 z-10 h-[22px] w-[5px] -translate-x-1/2 rounded-full bg-[#8F0000] shadow-[0_0_8px_rgba(143,0,0,.22)] transition-[top] duration-200 ease-out motion-reduce:transition-none"
          style={{ top: 7 + activeStage * 36 }}
        />
        <div className="relative z-20 grid h-full grid-rows-3">
          {([
            { stage: 0 as const, name: "Arriba" },
            { stage: 1 as const, name: "Medio" },
            { stage: 2 as const, name: "Abajo" }
          ]).map(({ stage, name }) => (
            <button key={stage} type="button"
              data-testid={`download-scroll-stage-${stage}`}
              aria-label={`Ir ${name.toLowerCase()}`}
              aria-current={stage === activeStage ? "location" : undefined}
              title={name}
              onClick={() => goToRailStage(stage)}
              className="h-9 w-full cursor-pointer bg-transparent hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#8F0000]"
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => goToRailStage(Math.min(2, activeStage + 1) as 0 | 1 | 2)}
        disabled={!canGoDown}
        className="grid h-9 w-9 place-items-center rounded-full border border-[#342025] bg-black/70 text-white/70 shadow-xl backdrop-blur transition enabled:hover:bg-black enabled:hover:text-white disabled:cursor-default disabled:opacity-25"
        aria-label="Bajar"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
