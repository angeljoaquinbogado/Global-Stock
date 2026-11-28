"use client";

import { motion } from "framer-motion";
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
  const displayName = useMemo(() => {
    const clean = userSegment.replace(/^,\s*/, "").trim();
    if (clean) return clean;
    return demoFallbackName.trim();
  }, [userSegment, demoFallbackName]);

  const firstLine = useMemo(
    () => (displayName ? `${greetingWord}, ${displayName}!` : `${greetingWord}!`),
    [greetingWord, displayName]
  );

  const [line1Count, setLine1Count] = useState(0);
  const [line2Count, setLine2Count] = useState(0);
  const [phase, setPhase] = useState<"line1" | "line2" | "done">("line1");

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const clearIntervalIfNeeded = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const startCycle = () => {
      if (cancelled) return;
      let index1 = 0;
      let index2 = 0;
      setLine1Count(0);
      setLine2Count(0);
      setPhase("line1");

      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        intervalId = window.setInterval(() => {
          if (cancelled) return;
          index1 += 1;
          setLine1Count(index1);
          if (index1 >= firstLine.length) {
            clearIntervalIfNeeded();
            timeoutId = window.setTimeout(() => {
              if (cancelled) return;
              setPhase("line2");
              intervalId = window.setInterval(() => {
                if (cancelled) return;
                index2 += 1;
                setLine2Count(index2);
                if (index2 >= secondLine.length) {
                  clearIntervalIfNeeded();
                  setPhase("done");
                }
              }, 28);
            }, 240);
          }
        }, 34);
      }, 220);
    };

    startCycle();
    return () => {
      cancelled = true;
      clearIntervalIfNeeded();
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [firstLine, secondLine]);

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
      <div className="min-h-[2.85em] font-sans text-[13px] leading-[1.5] tracking-[-0.015em] sm:text-[14.5px]">
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