"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type WelcomeTypewriterBannerProps = {
  message: string;
  badgeText?: string;
};

export function WelcomeTypewriterBanner({
  message,
  badgeText
}: WelcomeTypewriterBannerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    prefersReducedMotion ? message.length : 0
  );
  const [done, setDone] = useState<boolean>(() => Boolean(prefersReducedMotion));

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCount(message.length);
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
        if (index >= message.length) {
          if (intervalId !== undefined) window.clearInterval(intervalId);
          setDone(true);
        }
      }, 30);
    }, 120);

    return () => {
      window.clearTimeout(startDelay);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [message, prefersReducedMotion]);

  const typedText = message.slice(0, visibleCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="liquid-glass-pill mt-2 inline-flex max-w-full items-center gap-2.5 rounded-full px-3.5 py-1.5"
      aria-label={message}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>

      <span className="truncate text-xs font-bold tracking-tight text-[var(--apex-text)] sm:text-[13px]">
        <span>{typedText}</span>
        <span
          aria-hidden="true"
          className={`ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] rounded-full bg-[var(--apex-accent)] transition-opacity duration-500 ${
            done ? "opacity-0" : "animate-pulse opacity-100"
          }`}
        />
      </span>

      {badgeText && (
        <>
          <span className="h-3.5 w-px shrink-0 bg-[var(--apex-border)]" />
          <span className="shrink-0 rounded-full border border-[var(--apex-border)] bg-[var(--apex-bg)]/85 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--apex-muted)]">
            {badgeText}
          </span>
        </>
      )}
    </motion.div>
  );
}