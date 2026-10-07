"use client";

import Link from "next/link";
import { ArrowRight, Boxes, BrainCircuit, Check, CircleDollarSign, TrendingUp } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";

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
      "radial-gradient(circle at 72% 28%, rgba(143,0,0,.24), transparent 27%), radial-gradient(circle at 20% 88%, rgba(59,130,246,.10), transparent 30%), radial-gradient(circle at 52% 56%, rgba(255,255,255,.96), transparent 43%), linear-gradient(135deg,#fffefe 0%,#f2f5fa 100%)",
    darkBackground:
      "radial-gradient(circle at 72% 28%, rgba(143,0,0,.42), transparent 29%), radial-gradient(circle at 18% 86%, rgba(37,99,235,.16), transparent 31%), radial-gradient(circle at 52% 56%, rgba(255,255,255,.025), transparent 43%), linear-gradient(135deg,#050506 0%,#0b0c10 100%)",
    side: "left",
    pose: { x: 7, y: -2, rotateX: 2.4, rotateY: -10, rotateZ: 1.2, scale: .88 },
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
      "radial-gradient(circle at 25% 30%, rgba(245,158,11,.30), transparent 29%), radial-gradient(circle at 77% 80%, rgba(143,0,0,.14), transparent 31%), radial-gradient(circle at 56% 48%, rgba(255,255,255,.96), transparent 43%), linear-gradient(135deg,#fffdf8 0%,#f7f5f2 100%)",
    darkBackground:
      "radial-gradient(circle at 25% 30%, rgba(245,158,11,.26), transparent 30%), radial-gradient(circle at 76% 80%, rgba(143,0,0,.30), transparent 33%), radial-gradient(circle at 56% 48%, rgba(255,255,255,.02), transparent 43%), linear-gradient(135deg,#080705 0%,#0d0908 100%)",
    side: "right",
    pose: { x: -7, y: 5, rotateX: -3.2, rotateY: 14, rotateZ: -2.1, scale: .9 },
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
      "radial-gradient(circle at 78% 28%, rgba(16,185,129,.27), transparent 28%), radial-gradient(circle at 18% 84%, rgba(14,165,233,.13), transparent 30%), radial-gradient(circle at 54% 52%, rgba(255,255,255,.96), transparent 43%), linear-gradient(135deg,#fafffd 0%,#f2f7f7 100%)",
    darkBackground:
      "radial-gradient(circle at 78% 28%, rgba(16,185,129,.25), transparent 29%), radial-gradient(circle at 18% 84%, rgba(14,165,233,.16), transparent 31%), radial-gradient(circle at 54% 52%, rgba(255,255,255,.018), transparent 43%), linear-gradient(135deg,#04100b 0%,#07100f 100%)",
    side: "left",
    pose: { x: 8, y: -5, rotateX: 4.2, rotateY: -16, rotateZ: 2.2, scale: .88 },
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
      "radial-gradient(circle at 28% 28%, rgba(124,58,237,.30), transparent 29%), radial-gradient(circle at 80% 78%, rgba(37,99,235,.16), transparent 31%), radial-gradient(circle at 54% 52%, rgba(255,255,255,.96), transparent 43%), linear-gradient(135deg,#fdfaff 0%,#f3f5fb 100%)",
    darkBackground:
      "radial-gradient(circle at 28% 28%, rgba(124,58,237,.34), transparent 29%), radial-gradient(circle at 80% 78%, rgba(37,99,235,.20), transparent 31%), radial-gradient(circle at 54% 52%, rgba(255,255,255,.02), transparent 43%), linear-gradient(135deg,#08050e 0%,#070a11 100%)",
    side: "right",
    pose: { x: -6, y: -4, rotateX: -4, rotateY: 12, rotateZ: -1.4, scale: .9 },
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

function SceneGlyph({ screen }: { screen: DemoScreen }) {
  if (screen === "pos") return <CircleDollarSign size={16} />;
  if (screen === "inventory") return <Boxes size={16} />;
  if (screen === "ai") return <BrainCircuit size={16} />;
  return <TrendingUp size={16} />;
}

function StoryCopy({ scene, index }: { scene: StoryScene; index: number }) {
  const enterX = scene.side === "left" ? -44 : 44;

  return (
    <div
      className={
        "gs-cinematic-copy absolute bottom-[9%] left-1/2 z-30 w-[min(90vw,540px)] -translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:w-[440px] lg:-translate-y-1/2 " +
        (scene.side === "left"
          ? "lg:left-[5.2%] lg:translate-x-0"
          : "lg:left-auto lg:right-[5.2%] lg:translate-x-0")
      }
    >
      <motion.div
        initial={{ opacity: 0, x: enterX, y: 18, scale: .985 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -enterX * .55, y: -10, scale: .99 }}
        transition={{ duration: .52, ease: easeOut }}
      >
        <div className="gs-cinematic-copy-surface rounded-[28px] border p-5 sm:p-6 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="gs-cinematic-kicker-row flex items-center gap-3.5">
            <span
              className="gs-cinematic-glyph grid h-10 w-10 shrink-0 place-items-center rounded-2xl border"
              style={{ color: scene.accent }}
            >
              <SceneGlyph screen={scene.screen} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-px w-7 shrink-0"
                  style={{ backgroundColor: scene.accent }}
                />
                <p className="gs-download-kicker truncate text-[10px] font-extrabold uppercase tracking-[.19em] text-[#8F0000]">
                  {scene.kicker}
                </p>
              </div>
              <p className="gs-cinematic-eyebrow mt-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-[var(--gs-download-subtle)]">
                Escena 0{index + 1} · experiencia conectada
              </p>
            </div>
          </div>

          {index === 0 ? (
            <h1 className="gs-cinematic-title mt-5 text-[clamp(2.45rem,4.15vw,4rem)] font-semibold leading-[.94] tracking-[-0.06em]">
              {scene.title}
            </h1>
          ) : (
            <h2 className="gs-cinematic-title mt-5 text-[clamp(2.2rem,3.9vw,3.75rem)] font-semibold leading-[.96] tracking-[-0.058em]">
              {scene.title}
            </h2>
          )}

          <div className="gs-cinematic-title-rail mt-5 h-px w-full max-w-[340px] overflow-hidden">
            <motion.span
              key={scene.id + "-rail"}
              className="block h-full origin-left"
              style={{ backgroundColor: scene.accent }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: .68, delay: .12, ease: easeOut }}
            />
          </div>

          <p className="gs-cinematic-body mt-5 max-w-[38rem] text-[14px] font-medium leading-6 text-[var(--gs-download-muted)] sm:text-[16px] sm:leading-7">
            {scene.body}
          </p>

          <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
            {scene.tags.map((tag) => (
              <span
                key={tag}
                className="gs-cinematic-tag inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold"
              >
                <Check size={10} style={{ color: scene.accent }} />
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
    </div>
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
              (scene.side === "left"
                ? index === 0
                  ? "right-[12%] top-[18%]"
                  : "bottom-[16%] right-[12%]"
                : index === 0
                  ? "left-[12%] top-[18%]"
                  : "bottom-[16%] left-[12%]")
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
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: .24
  });
  const phoneLift = useTransform(smoothProgress, [0, 1], [10, -10]);
  const ambientShift = useTransform(smoothProgress, [0, 1], [30, -30]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(
      scenes.length - 1,
      Math.max(0, Math.floor(value * scenes.length))
    );
    setActiveIndex((current) => (current === next ? current : next));
  });

  const scene = scenes[activeIndex];
  const pose = reduceMotion
    ? { x: 0, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: .9 }
    : scene.pose;

  const accentStyle = {
    "--gs-cinematic-accent": scene.accent
  } as CSSProperties;

  function goToScene(index: number) {
    const section = sectionRef.current;
    if (!section) {
      setActiveIndex(index);
      return;
    }

    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const stickyHeight = Math.max(1, window.innerHeight - 68);
    const scrollable = Math.max(1, section.offsetHeight - stickyHeight);
    const ratio = scenes.length <= 1 ? 0 : index / (scenes.length - 1);

    window.scrollTo({
      top: sectionTop + scrollable * ratio,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  return (
    <section
      ref={sectionRef}
      id="download-hero"
      data-download-section
      className="gs-cinematic-hero relative h-[250svh] scroll-mt-20 lg:h-[285vh] xl:h-[300vh]"
      style={accentStyle}
    >
      <div className="sticky top-[68px] h-[calc(100svh-68px)] min-h-[560px] overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={scene.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .82, ease: easeOut }}
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

        <motion.div
          className="gs-cinematic-ambient pointer-events-none absolute left-[48%] top-[-18%] h-[72%] w-[64%] rounded-full"
          style={{ y: reduceMotion ? 0 : ambientShift }}
        />
        <div className="gs-cinematic-grid pointer-events-none absolute inset-0" />
        <div className="gs-cinematic-grain pointer-events-none absolute inset-0" />
        <div className="gs-cinematic-vignette pointer-events-none absolute inset-0" />

        <div className="relative mx-auto h-full w-full max-w-[1440px]">
          <AnimatePresence mode="wait" initial={false}>
            <StoryCopy key={scene.id} scene={scene} index={activeIndex} />
          </AnimatePresence>

          <SceneStats scene={scene} />

          <motion.div
            className="pointer-events-none absolute left-1/2 top-[38%] z-10 -translate-x-1/2 -translate-y-1/2 lg:top-1/2"
            style={{ y: reduceMotion ? 0 : phoneLift }}
          >
            <motion.div
              className="gs-cinematic-aura absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full lg:h-[620px] lg:w-[620px]"
              animate={{
                scale: reduceMotion ? 1 : [1, 1.035, 1],
                opacity: reduceMotion ? .76 : [.64, .88, .64]
              }}
              transition={{
                duration: 6.2,
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
                    : {
                        rotateY: -24,
                        rotateX: 7,
                        rotateZ: -1.5,
                        scale: .76,
                        opacity: 0,
                        y: 26
                      }
                }
                animate={{
                  rotateY: 0,
                  rotateX: 0,
                  rotateZ: 0,
                  scale: 1,
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  duration: reduceMotion ? .01 : 1.08,
                  delay: .08,
                  ease: easeOut
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={pose}
                  transition={{
                    type: "spring",
                    stiffness: 115,
                    damping: 20,
                    mass: .72
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
          </motion.div>

          <div className="gs-cinematic-progress absolute bottom-[2.2%] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-[var(--gs-download-border)] bg-[var(--gs-download-surface)]/82 px-3 py-2.5 shadow-[0_16px_44px_rgba(15,23,42,.12)] backdrop-blur-xl lg:bottom-auto lg:left-auto lg:right-[2.2%] lg:top-1/2 lg:-translate-x-0 lg:-translate-y-1/2 lg:flex-col lg:rounded-[22px] lg:px-2.5 lg:py-3">
            <span className="hidden text-[9px] font-bold tabular-nums tracking-[.16em] text-[var(--gs-download-subtle)] lg:block">
              0{activeIndex + 1}
            </span>
            <div className="hidden h-12 w-px overflow-hidden rounded-full bg-[var(--gs-download-border)] lg:block">
              <motion.span
                className="block h-full w-full origin-top bg-[var(--gs-cinematic-accent)]"
                style={{ scaleY: smoothProgress }}
              />
            </div>
            {scenes.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToScene(index)}
                className="group grid h-5 place-items-center rounded-full px-1 lg:h-7 lg:w-7 lg:px-0"
                aria-label={`Mostrar ${item.kicker}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span
                  className="block rounded-full transition-[width,height,background-color,box-shadow] duration-300"
                  style={{
                    width: index === activeIndex ? 24 : 6,
                    height: index === activeIndex ? 6 : 6,
                    backgroundColor:
                      index === activeIndex
                        ? item.accent
                        : "color-mix(in srgb, var(--gs-download-muted) 28%, transparent)",
                    boxShadow:
                      index === activeIndex
                        ? `0 0 18px color-mix(in srgb, ${item.accent} 52%, transparent)`
                        : "none"
                  }}
                />
              </button>
            ))}
            <span className="hidden text-[9px] font-bold tabular-nums tracking-[.16em] text-[var(--gs-download-subtle)] lg:block">
              0{scenes.length}
            </span>
          </div>

          <div className="gs-cinematic-scroll-note absolute bottom-[3.1%] left-[4%] hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--gs-download-subtle)] lg:flex">
            <span className="relative grid h-6 w-4 place-items-start rounded-full border border-[var(--gs-download-border)] p-[3px]">
              <motion.span
                className="mx-auto block h-1.5 w-1 rounded-full bg-[var(--gs-cinematic-accent)]"
                animate={reduceMotion ? undefined : { y: [0, 9, 0], opacity: [1, .35, 1] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            Deslizá para recorrer la experiencia
          </div>
        </div>
      </div>
    </section>
  );
}
