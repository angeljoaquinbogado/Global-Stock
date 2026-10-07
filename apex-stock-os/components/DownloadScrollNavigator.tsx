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

const HERO_SCENE_COUNT = 1;
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

function getHeroMetrics(hero: HTMLElement) {
  const top = Math.max(0, getDocumentTop(hero) - getHeaderOffset());
  const travel = Math.max(
    window.innerHeight,
    hero.offsetHeight - window.innerHeight
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

  // Land just inside each scene so Framer Motion resolves the intended state
  // immediately instead of sitting exactly on a scene boundary.
  const progress = safeScene / HERO_SCENE_COUNT + 0.025;

  return Math.round(top + travel * progress);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function DownloadScrollNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [availableCount, setAvailableCount] = useState(sectionIds.length);
  const [canGoUp, setCanGoUp] = useState(false);

  const updatePosition = useCallback(() => {
    const sections = getSections();
    setAvailableCount(sections.length || sectionIds.length);

    if (!sections.length) return;

    const current = getActiveSectionIndex(sections);
    const currentTop = Math.max(
      0,
      getDocumentTop(sections[current]) - getHeaderOffset()
    );

    setActiveIndex(current);
    setCanGoUp(current > 0 || window.scrollY - currentTop > 8);
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

      // Chrome occasionally ignores a long smooth jump while the cinematic
      // sticky hero is changing state. If no movement started, force the same
      // destination so the control never appears broken.
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
      const sections = getSections();
      const safeIndex = Math.max(0, Math.min(sections.length - 1, index));
      const target = sections[safeIndex];

      if (!target) return;

      const top = Math.max(
        0,
        getDocumentTop(target) - getHeaderOffset()
      );

      scrollToTop(top);
    },
    [scrollToTop]
  );

  const goPrevious = useCallback(() => {
    const sections = getSections();
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

    const current = getActiveSectionIndex(sections);

    // The cinematic hero is now one normal-scroll section; its scenes autoplay
    // independently, so navigation returns to the hero itself.
    if (current === 1 && hero) {
      scrollToTop(getHeroSceneTop(hero, HERO_SCENE_COUNT - 1));
      return;
    }

    const offset = getHeaderOffset();
    const currentTop = Math.max(
      0,
      getDocumentTop(sections[current]) - offset
    );

    if (window.scrollY - currentTop > 96) {
      goToSection(current);
      return;
    }

    goToSection(current - 1);
  }, [goToSection, scrollToTop]);

  const goNext = useCallback(() => {
    const sections = getSections();
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

    const current = getActiveSectionIndex(sections);
    goToSection(current + 1);
  }, [goToSection, scrollToTop]);

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