"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type WelcomeTypewriterBannerProps = {
  greetingWord: string;
  userSegment: string;
  demoFallbackName?: string;
  secondLine: string;
  badgeText?: string;
};

export function WelcomeTypewriterBanner({
  greetingWord,
  userSegment,
  demoFallbackName = "",
  secondLine,
  badgeText
}: WelcomeTypewriterBannerProps) {
  const prefersReducedMotion = useReducedMotion();

  const displayName = useMemo(() => {
    const clean = userSegment.replace(/^,\s*/, "").trim();
    if (clean) return clean;
    return demoFallbackName.trim();
  }, [userSegment, demoFallbackName]);

  const firstLine = useMemo(
    () => (displayName ? `${greetingWord}, ${displayName}!` : `${greetingWord}!`),
    [greetingWord, displayName]
  );

  const [line1Count, setLine1Count] = useState<number>(() =>
    prefersReducedMotion ? firstLine.length : 0
  );
  const [line2Count, setLine2Count] = useState<number>(() =>
    prefersReducedMotion ? secondLine.length : 0
  );
  const [phase, setPhase] = useState<"line1" | "line2" | "done">(() =>
    prefersReducedMotion ? "done" : "line1"
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setLine1Count(firstLine.length);
      setLine2Count(secondLine.length);
      setPhase("done");
      return;
    }

    setLine1Count(0);
    setLine2Count(0);
    setPhase("line1");

    let cancelled = false;
    let timerId: number | undefined;
    let idx1 = 0;
    let idx2 = 0;

    const typeLine2 = () => {
      if (cancelled) return;
      setPhase("line2");
      timerId = window.setInterval(() => {
        if (cancelled) return;
        idx2 += 1;
        setLine2Count(idx2);
        if (idx2 >= secondLine.length) {
          if (timerId !== undefined) window.clearInterval(timerId);
          setPhase("done");
        }
      }, 32);
    };

    const startTimeout = window.setTimeout(() => {
      if (cancelled) return;
      timerId = window.setInterval(() => {
        if (cancelled) return;
        idx1 += 1;
        setLine1Count(idx1);
        if (idx1 >= firstLine.length) {
          if (timerId !== undefined) window.clearInterval(timerId);
          timerId = window.setTimeout(typeLine2, 240);
        }
      }, 38);
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimeout);
      if (timerId !== undefined) {
        window.clearInterval(timerId);
        window.clearTimeout(timerId);
      }
    };
  }, [firstLine, secondLine, prefersReducedMotion]);

  const prefixPart = displayName ? `${greetingWord}, ` : `${greetingWord}!`;
  const typedPrefix = firstLine.slice(0, Math.min(line1Count, prefixPart.length));
  const typedNameAndBang =
    displayName && line1Count > prefixPart.length
      ? firstLine.slice(prefixPart.length, line1Count)
      : "";
  const typedSecondLine = secondLine.slice(0, line2Count);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-4 flex flex-wrap items-center justify-between gap-3 border-l-2 pl-3.5 py-0.5 transition-colors duration-300"
      style={{ borderColor: "var(--apex-accent)" }}
      aria-label={`${firstLine} ${secondLine}`}
    >
      <div className="min-h-[2.85em] font-mono text-[13px] leading-[1.45] tracking-[-0.01em] sm:text-[14.5px]">
        <div className="font-semibold text-[var(--apex-text)]">
          <span>{typedPrefix}</span>
          {typedNameAndBang && (
            <span
              className="font-bold transition-colors duration-300"
              style={{ color: "var(--apex-accent)" }}
            >
              {typedNameAndBang}
            </span>
          )}
          {phase === "line1" && (
            <span
              aria-hidden="true"
              className="ml-[1px] inline-block h-[1.05em] w-[1.5px] translate-y-[2px] animate-pulse"
              style={{ backgroundColor: "var(--apex-accent)" }}
            />
          )}
        </div>

        <div className="font-medium text-[var(--apex-muted)]">
          <span>{typedSecondLine}</span>
          {phase !== "line1" && (
            <span
              aria-hidden="true"
              className={`ml-[1px] inline-block h-[1.05em] w-[1.5px] translate-y-[2px] transition-opacity duration-700 ${
                phase === "done" ? "opacity-0" : "animate-pulse opacity-100"
              }`}
              style={{ backgroundColor: "var(--apex-accent)" }}
            />
          )}
        </div>
      </div>

      {badgeText && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--apex-muted)] backdrop-blur-md">
          <span
            className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
            style={{ backgroundColor: "var(--apex-accent)" }}
          />
          {badgeText}
        </span>
      )}
    </motion.div>
  );
}