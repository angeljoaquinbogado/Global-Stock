"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// The public landing starts with a four-scene 3D hero. Do not hydrate the
// large Framer Motion sales demo while it is several screenfuls offscreen.
// Still pre-warm it before entry so scrolling remains continuous and premium.
const SalesFlow = dynamic(
  () => import("./DownloadSalesFlow").then((module) => module.DownloadSalesFlow),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto min-h-[580px] w-full max-w-[1240px] px-5 py-14 sm:min-h-[680px] sm:px-8"
        aria-hidden="true"
      >
        <div className="h-4 w-28 rounded-full bg-white/[0.035]" />
        <div className="mt-5 h-12 w-full max-w-[420px] rounded-2xl bg-white/[0.035]" />
        <div className="mt-10 h-[320px] rounded-[32px] bg-white/[0.025]" />
      </div>
    )
  }
);

export function DeferredSalesShowcase() {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const target = anchorRef.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      // Progressive enhancement on older browsers: render the real module.
      const frame = window.requestAnimationFrame(() => setNearViewport(true));
      return () => window.cancelAnimationFrame(frame);
    }

    // Trigger before the section enters view to prevent a blank transition.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "1200px 0px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={anchorRef} data-testid="deferred-sales-flow">
      {nearViewport ? (
        <SalesFlow />
      ) : (
        <div
          className="mx-auto min-h-[580px] w-full max-w-[1240px] px-5 py-14 sm:min-h-[680px] sm:px-8"
          aria-hidden="true"
        >
          <div className="h-4 w-28 rounded-full bg-white/[0.035]" />
          <div className="mt-5 h-12 w-full max-w-[420px] rounded-2xl bg-white/[0.035]" />
          <div className="mt-10 h-[320px] rounded-[32px] bg-white/[0.025]" />
        </div>
      )}
    </div>
  );
}
