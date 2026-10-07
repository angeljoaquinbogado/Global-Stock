"use client";

import Link from "next/link";
import { ArrowRight, Boxes, BrainCircuit, Check, CircleDollarSign, TrendingUp } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion
} from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import {
  GlobalStockPhonePreview,
  type DemoScreen
} from "@/components/GlobalStockPhonePreview";
import { DownloadLogo } from "@/components/DownloadLogo";
import { InstallAppButton } from "@/components/InstallAppButton";

type StoryScene = {
  id: string;
  screen: DemoScreen;
  kicker: string;
  title: string;
  body: string;
  tags: string[];
  accent: string;
  lightBackground: string;
  darkBackground: string;
  side: "left" | "right";
  pose: {
    x: number;
    y: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    scale: number;
  };
  stats: Array<{
    label: string;
    value: string;
  }>;
};

const scenes: StoryScene[] = [
  {
    id: "control",
    screen: "dashboard",
    kicker: "Global Stock",
    title: "Controlá tu negocio. Desde un solo lugar.",
    body:
      "Ventas, stock, caja, compras, clientes y actividad se conectan en una misma operación para que tengas una vista clara de lo que pasa.",
    tags: ["Ventas", "Caja", "Inventario"],
    accent: "#8F0000",
    lightBackground:
      "radial-gradient(circle at 72% 36%, rgba(143,0,0,.18), transparent 28%), radial-gradient(circle at 78% 76%, rgba(227,38,54,.08), transparent 31%), linear-gradient(180deg,#ffffff 0%,#f7f8fa 100%)",
    darkBackground:
      "radial-gradient(circle at 72% 36%, rgba(143,0,0,.34), transparent 30%), radial-gradient(circle at 78% 76%, rgba(227,38,54,.12), transparent 31%), linear-gradient(180deg,#070708 0%,#0b0b0d 100%)",
    side: "left",
    pose: { x: 16, y: 0, rotateX: 2, rotateY: -7, rotateZ: 1.1, scale: .96 },
    stats: [
      { label: "Ventas hoy", value: "$ 248.900" },
      { label: "Inventario", value: "1.248 uds" }
    ]
  },
  {
    id: "venta",
    screen: "pos",
    kicker: "Ventas y caja",
    title: "Vendé una vez. El resto se sincroniza.",
    body:
      "Registrás la operación y Global Stock actualiza caja, stock e historial sin repetir datos ni saltar entre pantallas.",
    tags: ["Punto de venta", "Cobros", "Historial"],
    accent: "#D97706",
    lightBackground:
      "radial-gradient(circle at 28% 38%, rgba(245,158,11,.24), transparent 30%), radial-gradient(circle at 70% 76%, rgba(143,0,0,.08), transparent 32%), linear-gradient(180deg,#fffdf8 0%,#f8fafc 100%)",
    darkBackground:
      "radial-gradient(circle at 28% 38%, rgba(245,158,11,.19), transparent 30%), radial-gradient(circle at 70% 76%, rgba(143,0,0,.20), transparent 34%), linear-gradient(180deg,#090806 0%,#0d0b09 100%)",
    side: "right",
    pose: { x: -20, y: 8, rotateX: -3, rotateY: 11, rotateZ: -2.2, scale: .99 },
    stats: [
      { label: "Venta", value: "$ 48.900" },
      { label: "Caja", value: "Registrada" }
    ]
  },
  {
    id: "stock",
    screen: "inventory",
    kicker: "Stock inteligente",
    title: "Sabé qué tenés, dónde está y cuándo reponer.",
    body:
      "Mínimos, ubicaciones, códigos y alertas trabajan juntos para que el inventario físico y online no se separen.",
    tags: ["Alertas", "Ubicaciones", "Reposición"],
    accent: "#079455",
    lightBackground:
      "radial-gradient(circle at 76% 34%, rgba(16,185,129,.20), transparent 29%), radial-gradient(circle at 22% 80%, rgba(37,99,235,.07), transparent 28%), linear-gradient(180deg,#fbfffd 0%,#f6f8fa 100%)",
    darkBackground:
      "radial-gradient(circle at 76% 34%, rgba(16,185,129,.18), transparent 29%), radial-gradient(circle at 22% 80%, rgba(37,99,235,.10), transparent 30%), linear-gradient(180deg,#06100c 0%,#090b0a 100%)",
    side: "left",
    pose: { x: 18, y: -8, rotateX: 4, rotateY: -12, rotateZ: 1.8, scale: .97 },
    stats: [
      { label: "Alertas", value: "12" },
      { label: "Disponibles", value: "1.248" }
    ]
  },
  {
    id: "intelligence",
    screen: "ai",
    kicker: "Global Intelligence",
    title: "Entendé el negocio antes de que el problema aparezca.",
    body:
      "La IA usa el contexto disponible de ventas, costos, margen, inventario y actividad para ayudarte a decidir con información real.",
    tags: ["IA contextual", "Márgenes", "Escenarios"],
    accent: "#7C3AED",
    lightBackground:
      "radial-gradient(circle at 30% 34%, rgba(124,58,237,.20), transparent 29%), radial-gradient(circle at 78% 72%, rgba(37,99,235,.10), transparent 31%), linear-gradient(180deg,#fdfbff 0%,#f7f8fb 100%)",
    darkBackground:
      "radial-gradient(circle at 30% 34%, rgba(124,58,237,.24), transparent 29%), radial-gradient(circle at 78% 72%, rgba(37,99,235,.14), transparent 31%), linear-gradient(180deg,#09070d 0%,#08090c 100%)",
    side: "right",
    pose: { x: -10, y: -2, rotateX: -4, rotateY: 8, rotateZ: -.8, scale: 1.01 },
    stats: [
      { label: "Margen", value: "31,0%" },
      { label: "Alertas", value: "12 críticas" }
    ]
  }
];

const easeOut = [0.23, 1, 0.32, 1] as const;

function PhoneBack() {
  return (
    <div className="gs-cinematic-phone-back absolute inset-0 overflow-hidden rounded-[48px]">
      <div className="absolute inset-[2px] rounded-[46px] border border-white/20 bg-[linear-gradient(145deg,#46494b_0%,#232527_38%,#111214_72%,#373a3c_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08),inset_24px_0_44px_rgba(255,255,255,.035),0_36px_90px_rgba(0,0,0,.30)]" />
      <div className="absolute left-[8%] top-[6.5%] h-[29%] w-[48%] rounded-[28px] border border-white/10 bg-[#1a1b1d]/92 shadow-[0_18px_35px_rgba(0,0,0,.24),inset_0_0_0_1px_rgba(255,255,255,.04)]">
        {[
          ["15%", "14%"],
          ["53%", "14%"],
          ["15%", "54%"]
        ].map(([left, top], index) => (
          <span
            key={index}
            className="absolute block h-[31%] aspect-square rounded-full border border-white/10 bg-[radial-gradient(circle_at_40%_36%,#293849_0%,#071019_26%,#020304_52%,#111315_70%,#020304_100%)] shadow-[inset_0_0_0_4px_rgba(255,255,255,.035),0_5px_12px_rgba(0,0,0,.35)]"
            style={{ left, top }}
          >
            <span className="absolute left-[28%] top-[24%] h-[16%] w-[16%] rounded-full bg-sky-300/15 blur-[1px]" />
          </span>
        ))}
        <span className="absolute bottom-[12%] right-[14%] h-[13%] aspect-square rounded-full bg-[#8F0000] shadow-[0_0_18px_rgba(143,0,0,.30)]" />
      </div>

      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">
        <img
          src="/brand/global-stock-mark.png"
          alt=""
          className="h-16 w-16 object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,.32)]"
          draggable={false}
        />
      </div>

      <div className="absolute bottom-[6%] left-1/2 h-[1px] w-[34%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/18 to-transparent" />
    </div>
  );
}

function StoryCopy({ scene, index }: { scene: StoryScene; index: number }) {
  const enterX = scene.side === "left" ? -72 : 72;

  return (
    <motion.div
      key={scene.id}
      className={
        "gs-cinematic-copy absolute bottom-[5%] left-1/2 z-30 w-[min(90vw,520px)] -translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:w-[390px] lg:-translate-y-1/2 " +
        (scene.side === "left"
          ? "lg:left-[5%] lg:translate-x-0"
          : "lg:left-auto lg:right-[5%] lg:translate-x-0")
      }
      initial={{ opacity: 0, x: enterX, y: 18 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -enterX * .7, y: -8 }}
      transition={{ duration: .58, ease: easeOut }}
    >
      <div className="gs-cinematic-copy-surface rounded-[26px] border p-5 sm:p-6 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="flex items-center gap-3">
          {index === 0 ? <DownloadLogo className="h-10 w-10 shrink-0" /> : null}
          <p className="gs-download-kicker text-[10px] font-bold uppercase tracking-[.17em] text-[#8F0000]">
            {scene.kicker}
          </p>
        </div>

        {index === 0 ? (
          <h1 className="mt-4 text-[clamp(2.55rem,5vw,4.8rem)] font-semibold leading-[.92] tracking-[-0.065em]">
            {scene.title}
          </h1>
        ) : (
          <h2 className="mt-4 text-[clamp(2.2rem,4vw,4rem)] font-semibold leading-[.94] tracking-[-0.058em]">
            {scene.title}
          </h2>
        )}

        <p className="mt-5 max-w-[38rem] text-[14px] leading-6 text-[var(--gs-download-muted)] sm:text-[16px] sm:leading-7">
          {scene.body}
        </p>

        <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
          {scene.tags.map((tag) => (
            <span
              key={tag}
              className="gs-cinematic-tag inline-flex min-h-8 items-center rounded-full border px-3 text-[11px] font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>

        {index === 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="gs-download-primary-action inline-flex h-11 items-center gap-2 rounded-xl bg-[#8F0000] px-4 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(143,0,0,.22)] transition-[transform,box-shadow] duration-150 active:scale-[.97]"
            >
              Abrir Global Stock
              <ArrowRight size={14} />
            </Link>
            <InstallAppButton language="es" />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function SceneStats({ scene }: { scene: StoryScene }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={scene.id}
        className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: .3 }}
      >
        {scene.stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className={
              "gs-cinematic-stat absolute rounded-2xl border px-4 py-3 shadow-[0_14px_40px_rgba(15,23,42,.12)] " +
              (index === 0
                ? "left-[17%] top-[21%]"
                : "bottom-[18%] right-[16%]")
            }
            initial={{ opacity: 0, y: index === 0 ? -14 : 14, scale: .96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: index === 0 ? 8 : -8, scale: .98 }}
            transition={{ duration: .46, delay: .08 + index * .06, ease: easeOut }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--gs-download-subtle)]">
              {stat.label}
            </p>
            <p className="mt-1 text-sm font-semibold tracking-[-.02em]">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export function DownloadCinematicHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(Boolean(entry?.isIntersecting)),
      {
        threshold: 0.18,
        rootMargin: "-8% 0px -8% 0px"
      }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || reduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % scenes.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [isVisible, reduceMotion]);

  const scene = scenes[activeIndex];
  const pose = reduceMotion
    ? { x: 0, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: .96 }
    : scene.pose;

  const accentStyle = {
    "--gs-cinematic-accent": scene.accent
  } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      id="download-hero"
      data-download-section
      className="gs-cinematic-hero relative min-h-[calc(100svh-68px)] scroll-mt-20"
      style={accentStyle}
    >
      <div className="relative h-[calc(100svh-68px)] min-h-[640px] overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={scene.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .72, ease: easeOut }}
          >
            <div
              className="gs-cinematic-bg-light absolute inset-0"
              style={{ background: scene.lightBackground }}
            />
            <div
              className="gs-cinematic-bg-dark absolute inset-0"
              style={{ background: scene.darkBackground }}
            />
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 opacity-[.14] [background-image:linear-gradient(rgba(127,127,127,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(127,127,127,.08)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(circle_at_center,black,transparent_76%)]" />

        <div className="relative mx-auto h-full w-full max-w-[1440px]">
          <AnimatePresence mode="wait" initial={false}>
            <StoryCopy scene={scene} index={activeIndex} />
          </AnimatePresence>

          <SceneStats scene={scene} />

          <div className="pointer-events-none absolute left-1/2 top-[40%] z-10 -translate-x-1/2 -translate-y-1/2 lg:top-1/2">
            <motion.div
              className="gs-cinematic-aura absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              animate={{
                scale: reduceMotion ? 1 : [1, 1.035, 1],
                opacity: reduceMotion ? .8 : [.72, .9, .72]
              }}
              transition={{
                duration: 5.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            <div className="gs-cinematic-perspective">
              <motion.div
                className="gs-cinematic-phone-shell relative"
                initial={
                  reduceMotion
                    ? false
                    : { rotateY: 180, rotateX: -5, scale: .86, opacity: 0 }
                }
                animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
                transition={{ duration: reduceMotion ? .01 : 1.15, delay: .12, ease: easeOut }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={pose}
                  transition={{
                    type: "spring",
                    duration: reduceMotion ? .01 : .88,
                    bounce: .08
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="gs-cinematic-phone-front absolute inset-0">
                    <GlobalStockPhonePreview
                      cinematic
                      autoPlay={false}
                      controlledScreen={scene.screen}
                      initialFrameColor="graphite"
                    />
                  </div>

                  <PhoneBack />
                </motion.div>
              </motion.div>
            </div>
          </div>

          <div className="absolute bottom-[2.2%] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--gs-download-border)] bg-[var(--gs-download-surface)]/80 px-2.5 py-2 shadow-[0_12px_36px_rgba(15,23,42,.10)] backdrop-blur-xl">
            {scenes.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="grid h-5 place-items-center rounded-full px-1"
                aria-label={`Mostrar ${item.kicker}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span
                  className="block h-1.5 rounded-full transition-[width,background-color] duration-300"
                  style={{
                    width: index === activeIndex ? 26 : 6,
                    backgroundColor:
                      index === activeIndex
                        ? item.accent
                        : "color-mix(in srgb, var(--gs-download-muted) 28%, transparent)"
                  }}
                />
              </button>
            ))}
          </div>

          <div className="absolute bottom-[2.6%] left-[4%] hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--gs-download-subtle)] lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gs-cinematic-accent)] shadow-[0_0_14px_var(--gs-cinematic-accent)]" />
            Explorá Global Stock · podés seguir desplazándote
          </div>
        </div>
      </div>
    </section>
  );
}