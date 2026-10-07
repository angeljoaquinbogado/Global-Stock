"use client";

import Link from "next/link";
import { ArrowRight, Boxes, BrainCircuit, Check, CircleDollarSign, TrendingUp } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll
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
      "radial-gradient(circle at 72% 28%, rgba(143,0,0,.24), transparent 27%), radial-gradient(circle at 20% 88%, rgba(59,130,246,.10), transparent 30%), radial-gradient(circle at 52% 56%, rgba(255,255,255,.96), transparent 43%), linear-gradient(135deg,#fffefe 0%,#f2f5fa 100%)",
    darkBackground:
      "radial-gradient(circle at 72% 28%, rgba(143,0,0,.42), transparent 29%), radial-gradient(circle at 18% 86%, rgba(37,99,235,.16), transparent 31%), radial-gradient(circle at 52% 56%, rgba(255,255,255,.025), transparent 43%), linear-gradient(135deg,#050506 0%,#0b0c10 100%)",
    side: "left",
    pose: { x: 6, y: -2, rotateX: 2.2, rotateY: -10, rotateZ: 1.1, scale: .94 },
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
    pose: { x: -6, y: 4, rotateX: -2.8, rotateY: 13, rotateZ: -1.8, scale: .95 },
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
    pose: { x: 6, y: -4, rotateX: 3.5, rotateY: -14, rotateZ: 1.8, scale: .94 },
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
    pose: { x: -5, y: -3, rotateX: -3.3, rotateY: 11, rotateZ: -1.2, scale: .95 },
    stats: [
      { label: "Margen", value: "31,0%" },
      { label: "Alertas", value: "12 críticas" }
    ]
  }
];

const easeOut = [0.23, 1, 0.32, 1] as const;

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
        "gs-cinematic-copy absolute bottom-[9%] left-1/2 z-30 w-[min(90vw,540px)] -translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:w-[400px] lg:-translate-y-1/2 xl:w-[430px] " +
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
            <div className="mt-6 flex flex-col items-start">
              <Link
                href="/"
                className="gs-download-primary-action inline-flex h-11 items-center gap-2 rounded-xl bg-[#8F0000] px-4 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(143,0,0,.22)] transition-[transform,box-shadow] duration-150 active:scale-[.97]"
              >
                Abrir Global Stock
                <ArrowRight size={14} />
              </Link>
              <div className="mt-3.5">
                <InstallAppButton language="es" />
              </div>
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
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {scene.stats.map((stat, index) => {
          const enterTransform =
            index === 0
              ? "translate3d(0,-14px,0) scale(.96) rotate(-.6deg)"
              : "translate3d(0,14px,0) scale(.96) rotate(.6deg)";

          return (
            <motion.div
              key={stat.label}
              className={
                "gs-cinematic-stat-card absolute " +
                (scene.side === "left"
                  ? index === 0
                    ? "right-[11%] top-[16%]"
                    : "bottom-[15%] right-[10%]"
                  : index === 0
                    ? "left-[11%] top-[16%]"
                    : "bottom-[15%] left-[10%]")
              }
              style={
                {
                  "--gs-stat-accent": scene.accent
                } as CSSProperties
              }
              variants={{
                hidden: {
                  opacity: 0,
                  transform: enterTransform
                },
                visible: {
                  opacity: 1,
                  transform: "translate3d(0,0,0) scale(1) rotate(0deg)",
                  transition: {
                    type: "spring",
                    duration: .5,
                    bounce: .2,
                    delay: .06 + index * .06
                  }
                },
                exit: {
                  opacity: 0,
                  transform: enterTransform,
                  transition: {
                    duration: .18,
                    ease: easeOut
                  }
                }
              }}
            >
              <div className="gs-cinematic-stat-card__surface">
                <span className="gs-cinematic-stat-card__edge" />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="gs-cinematic-stat-card__label">
                      {stat.label}
                    </p>
                    <p className="gs-cinematic-stat-card__value">
                      {stat.value}
                    </p>
                  </div>

                  <span
                    className="gs-cinematic-stat-card__signal"
                    aria-hidden="true"
                  >
                    <span />
                  </span>
                </div>

                <div className="gs-cinematic-stat-card__footer" aria-hidden="true">
                  <span className="gs-cinematic-stat-card__trace">
                    <span />
                  </span>
                  <span className="gs-cinematic-stat-card__icon">
                    <SceneGlyph screen={scene.screen} />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

export function DownloadCinematicHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragSceneIndex, setDragSceneIndex] = useState<number | null>(null);
  const sceneDotsRef = useRef<HTMLDivElement | null>(null);
  const liquidLensRef = useRef<HTMLSpanElement | null>(null);
  const pointerRef = useRef({
    id: -1,
    lastX: 0,
    lastTime: 0,
    currentX: 0,
    dragging: false
  });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(
      scenes.length - 1,
      Math.max(0, Math.floor(value * scenes.length))
    );
    setActiveIndex((current) => (current === next ? current : next));
  });

  const goToScene = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;

    const safeIndex = Math.max(0, Math.min(scenes.length - 1, index));
    const stickyHeight = Math.max(1, window.innerHeight - 68);
    const travel = Math.max(1, section.offsetHeight - stickyHeight);
    const sectionTop =
      window.scrollY + section.getBoundingClientRect().top - 68;
    const progress = (safeIndex + 0.5) / scenes.length;

    window.scrollTo({
      top: sectionTop + travel * progress,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  };

  const scene = scenes[activeIndex];
  const visualSceneIndex = dragSceneIndex ?? activeIndex;

  const getSceneButtons = () => {
    const rail = sceneDotsRef.current;
    if (!rail) return [] as HTMLButtonElement[];

    return Array.from(
      rail.querySelectorAll<HTMLButtonElement>("[data-scene-dot-button]")
    );
  };

  const getSceneCenter = (index: number) => {
    const rail = sceneDotsRef.current;
    const buttons = getSceneButtons();
    const button = buttons[index];

    if (!rail || !button) return 0;

    return button.offsetLeft + button.offsetWidth / 2;
  };

  const getSceneIndexFromPointer = (clientX: number) => {
    const rail = sceneDotsRef.current;
    const buttons = getSceneButtons();
    if (!rail || !buttons.length) return activeIndex;

    const rect = rail.getBoundingClientRect();
    const localX = clientX - rect.left;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    buttons.forEach((button, index) => {
      const center = button.offsetLeft + button.offsetWidth / 2;
      const distance = Math.abs(localX - center);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  const setLensTransform = (
    centerX: number,
    stretch = 1,
    compressY = 1
  ) => {
    const lens = liquidLensRef.current;
    if (!lens) return;

    const halfWidth = lens.offsetWidth / 2;
    lens.style.transform =
      `translate3d(${centerX - halfWidth}px,-50%,0) scaleX(${stretch}) scaleY(${compressY})`;
  };

  const snapLensToScene = (
    index: number,
    direction = 0,
    immediate = false
  ) => {
    const lens = liquidLensRef.current;
    const rail = sceneDotsRef.current;
    if (!lens || !rail) return;

    const targetCenter = getSceneCenter(index);
    const halfWidth = lens.offsetWidth / 2;
    const targetX = targetCenter - halfWidth;
    const current = getComputedStyle(lens).transform;

    lens.getAnimations().forEach((animation) => animation.cancel());

    if (immediate || reduceMotion) {
      lens.style.transform =
        `translate3d(${targetX}px,-50%,0) scaleX(.86) scaleY(1)`;
      return;
    }

    const overshoot = direction === 0 ? 0 : direction * 2.5;
    const animation = lens.animate(
      [
        { transform: current === "none"
            ? `translate3d(${targetX}px,-50%,0) scaleX(.98) scaleY(.96)`
            : current },
        {
          transform:
            `translate3d(${targetX + overshoot}px,-50%,0) scaleX(.82) scaleY(1.035)`,
          offset: .72
        },
        {
          transform:
            `translate3d(${targetX}px,-50%,0) scaleX(.86) scaleY(1)`
        }
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
        fill: "forwards"
      }
    );

    animation.onfinish = () => {
      lens.style.transform =
        `translate3d(${targetX}px,-50%,0) scaleX(.86) scaleY(1)`;
      animation.cancel();
    };
  };

  useEffect(() => {
    if (pointerRef.current.dragging) return;

    const frame = window.requestAnimationFrame(() => {
      snapLensToScene(activeIndex, 0, true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex]);

  useEffect(() => {
    const onResize = () => {
      if (pointerRef.current.dragging) return;
      snapLensToScene(activeIndex, 0, true);
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  const pose = reduceMotion
    ? { x: 0, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: .9 }
    : scene.pose;

  const accentStyle = {
    "--gs-cinematic-accent": scene.accent
  } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      id="download-hero"
      data-download-section
      className="gs-cinematic-hero relative h-[285svh] scroll-mt-20 lg:h-[330vh] xl:h-[340vh]"
      style={accentStyle}
    >
      <div className="sticky top-[68px] h-[calc(100svh-68px)] min-h-[560px] overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={scene.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .52, ease: easeOut }}
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

        <div className="gs-cinematic-ambient pointer-events-none absolute left-[48%] top-[-18%] h-[72%] w-[64%] rounded-full" />
        <div className="gs-cinematic-grid pointer-events-none absolute inset-0" />
        <div className="gs-cinematic-vignette pointer-events-none absolute inset-0" />

        <div className="relative mx-auto h-full w-full max-w-[1440px]">
          <AnimatePresence mode="wait" initial={false}>
            <StoryCopy key={scene.id} scene={scene} index={activeIndex} />
          </AnimatePresence>

          <SceneStats scene={scene} />

          <div
            className="pointer-events-none absolute left-1/2 top-[37%] z-10 -translate-x-1/2 -translate-y-1/2 lg:top-[48%]"
          >
            <div className="gs-cinematic-aura absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full lg:h-[580px] lg:w-[580px]" />

            <div className="gs-cinematic-perspective">
              <motion.div
                className="gs-cinematic-phone-shell relative"
                initial={
                  reduceMotion
                    ? false
                    : {
                        rotateY: -14,
                        rotateX: 5,
                        rotateZ: -1,
                        scale: .88,
                        opacity: 0,
                        y: 18
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
                  duration: reduceMotion ? .01 : .72,
                  delay: .04,
                  ease: easeOut
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  className="gs-cinematic-phone-motion absolute inset-0"
                  animate={pose}
                  transition={{
                    duration: reduceMotion ? .01 : .48,
                    ease: easeOut
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
                </motion.div>
              </motion.div>
            </div>
          </div>

          <div
            ref={sceneDotsRef}
            className="gs-cinematic-scene-dots absolute bottom-[6px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 px-3 py-2"
            data-dragging={dragSceneIndex !== null ? "true" : "false"}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse" && event.button !== 0) return;

              const rail = event.currentTarget;
              const lens = liquidLensRef.current;
              if (!lens) return;

              lens.getAnimations().forEach((animation) => animation.cancel());
              rail.setPointerCapture(event.pointerId);

              const rect = rail.getBoundingClientRect();
              const halfWidth = lens.offsetWidth / 2;
              const minCenter = getSceneCenter(0);
              const maxCenter = getSceneCenter(scenes.length - 1);
              const centerX = Math.max(
                minCenter,
                Math.min(maxCenter, event.clientX - rect.left)
              );

              pointerRef.current = {
                id: event.pointerId,
                lastX: event.clientX,
                lastTime: performance.now(),
                currentX: centerX,
                dragging: true
              };

              const nextIndex = getSceneIndexFromPointer(event.clientX);
              setDragSceneIndex(nextIndex);

              lens.style.transformOrigin = "50% 50%";
              lens.style.transform =
                `translate3d(${centerX - halfWidth}px,-50%,0) scaleX(1.18) scaleY(.94)`;
            }}
            onPointerMove={(event) => {
              const rail = event.currentTarget;
              const lens = liquidLensRef.current;
              const pointer = pointerRef.current;

              if (
                !lens ||
                !pointer.dragging ||
                pointer.id !== event.pointerId ||
                !rail.hasPointerCapture(event.pointerId)
              ) {
                return;
              }

              const rect = rail.getBoundingClientRect();
              const minCenter = getSceneCenter(0);
              const maxCenter = getSceneCenter(scenes.length - 1);
              const centerX = Math.max(
                minCenter,
                Math.min(maxCenter, event.clientX - rect.left)
              );

              const now = performance.now();
              const elapsed = Math.max(8, now - pointer.lastTime);
              const velocity = (event.clientX - pointer.lastX) / elapsed;
              const stretch = Math.min(
                1.34,
                1.16 + Math.abs(velocity) * .22
              );
              const direction = Math.sign(velocity);
              const skew = direction * Math.min(1.8, Math.abs(velocity) * 2.2);
              const halfWidth = lens.offsetWidth / 2;

              lens.style.transform =
                `translate3d(${centerX - halfWidth}px,-50%,0) scaleX(${stretch}) scaleY(.94) skewX(${skew}deg)`;

              pointer.lastX = event.clientX;
              pointer.lastTime = now;
              pointer.currentX = centerX;

              const nextIndex = getSceneIndexFromPointer(event.clientX);
              setDragSceneIndex((current) =>
                current === nextIndex ? current : nextIndex
              );
            }}
            onPointerUp={(event) => {
              const rail = event.currentTarget;
              const pointer = pointerRef.current;

              if (
                !pointer.dragging ||
                pointer.id !== event.pointerId ||
                !rail.hasPointerCapture(event.pointerId)
              ) {
                return;
              }

              const nextIndex = getSceneIndexFromPointer(event.clientX);
              const direction = Math.sign(event.clientX - pointer.lastX);

              rail.releasePointerCapture(event.pointerId);
              pointerRef.current.dragging = false;
              setDragSceneIndex(null);
              snapLensToScene(nextIndex, direction);
              goToScene(nextIndex);
            }}
            onPointerCancel={(event) => {
              const rail = event.currentTarget;
              if (rail.hasPointerCapture(event.pointerId)) {
                rail.releasePointerCapture(event.pointerId);
              }

              pointerRef.current.dragging = false;
              setDragSceneIndex(null);
              snapLensToScene(activeIndex, 0);
            }}
          >
            <span
              ref={liquidLensRef}
              className="gs-cinematic-liquid-lens pointer-events-none absolute left-0 top-1/2 z-0"
              aria-hidden="true"
            />

            {scenes.map((item, index) => {
              const selected = index === visualSceneIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-scene-dot-button
                  onClick={() => goToScene(index)}
                  className="gs-cinematic-scene-dot-button relative z-10 grid h-7 w-7 place-items-center rounded-full"
                  aria-label={`Ir a ${item.kicker}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                >
                  <span
                    className="gs-cinematic-scene-dot relative z-10 block rounded-full"
                    data-active={selected ? "true" : "false"}
                    style={{
                      width: selected ? 14 : 5,
                      height: 5,
                      backgroundColor: selected
                        ? item.accent
                        : "color-mix(in srgb, var(--gs-download-muted) 46%, transparent)"
                    }}
                  />
                </button>
              );
            })}
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
