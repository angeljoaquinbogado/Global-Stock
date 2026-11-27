"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type WelcomeTypewriterBannerProps = {
  prefix: string;
  userSegment: string;
  demoFallbackName?: string;
  suffix: string;
  subtitle?: string;
};

export function WelcomeTypewriterBanner({
  prefix,
  userSegment,
  demoFallbackName = "",
  suffix,
  subtitle
}: WelcomeTypewriterBannerProps) {
  const prefersReducedMotion = useReducedMotion();

  const resolvedUserSegment = useMemo(() => {
    if (userSegment.trim()) return userSegment;
    return demoFallbackName.trim() ? `, ${demoFallbackName.trim()}` : "";
  }, [userSegment, demoFallbackName]);

  const fullText = useMemo(
    () => `${prefix}${resolvedUserSegment}${suffix}`,
    [prefix, resolvedUserSegment, suffix]
  );

  const [visibleCount, setVisibleCount] = useState<number>(() =>
    prefersReducedMotion ? fullText.length : 0
  );
  const [done, setDone] = useState<boolean>(() => Boolean(prefersReducedMotion));

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCount(fullText.length);
      setDone(true);
      return;
    }

    setVisibleCount(0);
    setDone(false);

    let index = 0;
    let intervalId: number | undefined;

    const startDelay = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setVisibleCount(index);
        if (index >= fullText.length) {
          if (intervalId !== undefined) window.clearInterval(intervalId);
          setDone(true);
        }
      }, 24);
    }, 80);

    return () => {
      window.clearTimeout(startDelay);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [fullText, prefersReducedMotion]);

  const nameOnly = resolvedUserSegment.replace(/^,\s*/, "");
  const nameStart = nameOnly ? prefix.length + 2 : -1;
  const nameEnd = nameOnly ? nameStart + nameOnly.length : -1;

  const beforeName =
    nameStart >= 0
      ? fullText.slice(0, Math.min(visibleCount, nameStart))
      : fullText.slice(0, visibleCount);
  const typedName =
    nameStart >= 0 && visibleCount > nameStart
      ? fullText.slice(nameStart, Math.min(visibleCount, nameEnd))
      : "";
  const afterName =
    nameEnd >= 0 && visibleCount > nameEnd ? fullText.slice(nameEnd, visibleCount) : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5 flex flex-col gap-1.5 px-1"
      aria-label={fullText}
    >
      {subtitle && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--apex-accent)]">
            {subtitle}
          </span>
        </div>
      )}

      <h2 className="text-xl font-extrabold tracking-[-0.03em] text-[var(--apex-text)] sm:text-2xl md:text-[28px] md:leading-[1.15]">
        <span>{beforeName}</span>
        {typedName && (
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--apex-accent) 0%, color-mix(in srgb, var(--apex-accent) 62%, #f59e0b) 100%)"
            }}
          >
            {typedName}
          </span>
        )}
        <span>{afterName}</span>
        <span
          aria-hidden="true"
          className={`ml-1 inline-block h-[0.9em] w-[2.5px] translate-y-[2px] rounded-full bg-[var(--apex-accent)] transition-opacity duration-500 ${
            done ? "opacity-0" : "animate-pulse opacity-100"
          }`}
        />
      </h2>
    </motion.div>
  );
}