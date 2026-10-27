"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

// These three interactive panels live far below the 3D hero. Their event
// handlers and animation modules must not compete with initial mobile
// hydration. SEO-friendly headings remain in the static placeholder HTML.
// A 2600px prefetch radius caused several below-the-fold animations to
// hydrate during initial mobile paint; 650px keeps smooth scrolling without
// competing with the cinematic hero for the main thread.
const EcosystemHub = dynamic(
  () => import("./DownloadEcosystemHub").then((mod) => mod.DownloadEcosystemHub),
  { ssr: false }
);
const SectorShowcase = dynamic(
  () => import("./DownloadSectorShowcase").then((mod) => mod.DownloadSectorShowcase),
  { ssr: false }
);
const FaqPanel = dynamic(
  () => import("./DownloadFAQ").then((mod) => mod.DownloadFAQ),
  { ssr: false }
);

function LazyPanel({
  children,
  fallback
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const markerRef = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = markerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(frame);
    }

    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      setNear(true);
      observer.disconnect();
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
    };
    const checkPosition = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 650 && rect.bottom > -650) activate();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) activate();
      },
      { rootMargin: "650px 0px", threshold: 0 }
    );
    observer.observe(el);
    // A geometry-based fallback covers browser engines where IO can miss a
    // large placeholder after programmatic scrollIntoView during lazy hydration.
    window.addEventListener("scroll", checkPosition, { passive: true });
    window.addEventListener("resize", checkPosition);
    checkPosition();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
    };
  }, []);

  // Keep a real wrapper rect so observers work in every browser engine.
  return (
    <div ref={markerRef} className="w-full">
      {near ? children : fallback}
    </div>
  );
}

export function DeferredEcosystemHub() {
  return (
    <LazyPanel
      fallback={
        <section id="download-network" data-download-section
          className="scroll-mt-20 border-t border-white/[0.045] bg-[#0a0a0c] text-white">
          <div className="mx-auto min-h-[720px] max-w-[1240px] px-5 py-20 sm:px-8">
            <p className="gs-download-kicker text-xs font-bold uppercase text-[#8F0000]">Ecosistema conectado</p>
            <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Todo tu negocio. En un mismo sistema.
            </h2>
            <p className="mt-5 max-w-2xl text-base text-white/85">
              Facturación, contabilidad, clientes, proyectos, inventario, ventas y Global Intelligence conectados.
            </p>
            <div aria-hidden="true" className="mt-12 h-[360px] rounded-[32px] border border-white/5 bg-white/[0.025]"/>
          </div>
        </section>
      }
    >
      <EcosystemHub />
    </LazyPanel>
  );
}

export function DeferredSectorShowcase() {
  return (
    <LazyPanel
      fallback={
        <section className="border-t border-white/[0.045] bg-[#0a0a0c] text-white">
          <div className="mx-auto min-h-[500px] max-w-[1240px] px-5 py-20 sm:px-8">
            <p className="gs-download-kicker text-xs font-bold uppercase text-[#8F0000]">Para quién es</p>
            <h2 className="mt-5 text-4xl font-semibold sm:text-6xl">Global Stock para tu negocio.</h2>
            <p className="mt-5 max-w-2xl text-base text-white/85">
              Comercios, gastronomía, ecommerce, distribución, industria, autónomos y pymes.
            </p>
            <div aria-hidden="true" className="mt-10 h-[230px] rounded-[32px] border border-white/5 bg-white/[0.025]"/>
          </div>
        </section>
      }
    >
      <SectorShowcase />
    </LazyPanel>
  );
}

export function DeferredFAQ() {
  return (
    <LazyPanel
      fallback={
        <section className="border-t border-white/[0.045] bg-[#08090b] text-white">
          <div className="mx-auto min-h-[480px] max-w-[980px] px-5 py-20 text-center sm:px-8">
            <p className="gs-download-kicker text-xs font-bold uppercase text-[#8F0000]">Preguntas frecuentes</p>
            <h2 className="mt-5 text-4xl font-semibold sm:text-6xl">Todo lo que necesitás saber.</h2>
            <p className="mt-5 text-base text-white/85">Instalación, ventas, inventario, integraciones y seguridad.</p>
            <div aria-hidden="true" className="mt-12 h-[200px] rounded-[32px] border border-white/5 bg-white/[0.025]"/>
          </div>
        </section>
      }
    >
      <FaqPanel />
    </LazyPanel>
  );
}
