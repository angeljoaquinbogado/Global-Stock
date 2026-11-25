"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { InstallAppButton } from "../InstallAppButton";
import { DeviceButtons } from "./DeviceButtons";
import { Anchor, Audience, Faq, Features, HowTo } from "./DownloadInfo";
import type { DemoScreen } from "../GlobalStockPhonePreview";

/* La app real (no una captura) dentro del teléfono; se carga aparte para no frenar el primer render. */
const Phone = dynamic(
  () => import("../GlobalStockPhonePreview").then((m) => m.GlobalStockPhonePreview),
  { ssr: false, loading: () => <div className="dx-phone__skeleton" aria-hidden="true" /> }
);

type Stores = { appStore: string; playStore: string; microsoftStore: string };

const ease = [0.16, 1, 0.3, 1] as const;
const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;
const idx = (i: number) => ({ "--i": i }) as CSSProperties;

function useMedia(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", notify);
      return () => m.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/* Sin animación atada al scroll: movimiento reducido o pantallas bajas (celular horizontal, ventanas chicas). */
function useStill() {
  const reduced = useReducedMotion();
  const short = useMedia("(max-height: 640px)");
  return Boolean(reduced) || short;
}

function LivePhone({ screen }: { screen?: DemoScreen }) {
  return (
    <div className="dx-phone" aria-hidden="true">
      <Phone cinematic autoPlay={!screen} controlledScreen={screen} />
    </div>
  );
}

/* ─────────────── 1 · Recorrido: un solo teléfono que vuela del inicio a las tres palabras ───────────────
   Un único mundo continuo (sin cortes): el scroll solo mueve el tiempo. El fondo pasa de papel a tinta,
   el titular se retira y el mismo teléfono cambia de pantalla en cada capítulo. */
const WORDS: { word: string; screen: DemoScreen; line: string }[] = [
  { word: "Stock", screen: "inventory", line: "Cada producto, siempre a la vista." },
  { word: "Ventas", screen: "pos", line: "Cobrá desde el celular o la PC." },
  { word: "Caja", screen: "dashboard", line: "Lo que entra y lo que sale, claro." }
];

/* Interpolación lineal por tramos: mix(v, [[progreso, valor], …]) */
const mix = (v: number, s: [number, number][]) => {
  if (v <= s[0][0]) return s[0][1];
  for (let k = 1; k < s.length; k++) {
    if (v <= s[k][0]) {
      const [x0, y0] = s[k - 1];
      const [x1, y1] = s[k];
      return y0 + (y1 - y0) * ((v - x0) / (x1 - x0));
    }
  }
  return s[s.length - 1][1];
};

function Journey() {
  const ref = useRef<HTMLElement>(null);
  const still = useStill();
  const wide = useMedia("(min-width: 900px)");
  // El ancho entra al cálculo como un valor más: si se gira o se redimensiona a mitad del recorrido, todo se recalcula
  const wideMV = useMotionValue(wide ? 1 : 0);
  useEffect(() => wideMV.set(wide ? 1 : 0), [wide, wideMV]);
  const [i, setI] = useState(-1);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(p, "change", (v) =>
    setI(v < 0.46 ? -1 : Math.min(WORDS.length - 1, Math.floor(((v - 0.46) / 0.54) * WORDS.length)))
  );

  const phoneY = useTransform(p, (v) => `${mix(v, [[0, 52], [0.12, 52], [0.3, 0], [1, 0]])}vh`);
  const phoneX = useTransform([p, wideMV], ([v, w]: number[]) => `${w ? mix(v, [[0, 0], [0.36, 0], [0.5, 25], [1, 25]]) : 0}vw`);
  const phoneScale = useTransform([p, wideMV], ([v, w]: number[]) =>
    w
      ? mix(v, [[0, 0.88], [0.3, 1], [0.36, 1], [0.5, 0.95], [1, 0.95]])
      : mix(v, [[0, 0.88], [0.3, 1], [0.36, 1], [0.5, 0.6], [1, 0.6]])
  );
  const copyY = useTransform(p, (v) => `${mix(v, [[0, 0], [0.16, -16]])}vh`);
  const copyOpacity = useTransform(p, (v) => mix(v, [[0.04, 1], [0.16, 0]]));
  // Oculto del todo cuando se desvanece: ni se puede tocar ni recibir foco con el teclado
  const copyVisibility = useTransform(p, (v): "visible" | "hidden" => (v > 0.16 ? "hidden" : "visible"));
  // La tinta se abre como un círculo desde el teléfono (sin pasar por un gris intermedio)
  const inkClip = useTransform(p, (v) => `circle(${mix(v, [[0.24, 0], [0.46, 110]])}% at 50% 66%)`);
  const wordsOpacity = useTransform(p, (v) => mix(v, [[0.4, 0], [0.5, 1]]));
  const glowScale = useTransform(p, (v) => mix(v, [[0, 0.75], [1, 1.5]]));
  const glowOpacity = useTransform(p, (v) => mix(v, [[0, 0.55], [0.3, 1], [1, 1]]));
  const cur = i < 0 || still ? null : WORDS[i];

  return (
    <section ref={ref} id="dx-journey" aria-labelledby="dx-h1" className="dx-scene dx-scene--paper dx-journey">
      <Anchor id="download-features" className="dx-anchor dx-anchor--words" />
      <div className="dx-journey__stage">
        <motion.div className="dx-journey__ink" aria-hidden="true" style={still ? undefined : { clipPath: inkClip }} />
        <motion.div className="dx-glow" aria-hidden="true" style={still ? undefined : { x: phoneX, scale: glowScale, opacity: glowOpacity }} />

        <motion.div className="dx-hero__copy" style={still ? undefined : { y: copyY, opacity: copyOpacity, visibility: copyVisibility }}>
          <p className="dx-eyebrow dx-fade" style={delay(0.1)}>
            <i aria-hidden="true" /> Global Stock · Beta gratuita
          </p>
          <h1 id="dx-h1" className="dx-h1">
            <span className="sr-only">Global Stock — </span>
            <span className="dx-line"><span style={idx(0)}>Control</span></span>{" "}
            <span className="dx-line"><span style={idx(1)}>total.</span></span>
          </h1>
          <p className="dx-sub dx-fade" style={delay(0.35)}>Stock, ventas y caja en una sola app.</p>
          <div className="dx-actions dx-fade" style={delay(0.45)}>
            <Link href="/" className="dx-key">
              Abrir Global Stock <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <div className="dx-install"><InstallAppButton language="es" /></div>
          </div>
        </motion.div>

        <motion.div className="dx-journey__phone" style={still ? undefined : { x: phoneX, y: phoneY, scale: phoneScale }}>
          <LivePhone screen={cur?.screen} />
        </motion.div>

        <motion.div className="dx-journey__words dx-words" role="group" aria-label="Qué hace Global Stock" style={still ? undefined : { opacity: wordsOpacity }}>
          <div>
            <ul>
              {WORDS.map((w, k) => (
                <li key={w.word} className={k === i || still ? "is-on" : undefined}>
                  <span className="dx-words__n" aria-hidden="true">0{k + 1}</span>
                  <span className="dx-words__w">{w.word}</span>
                </li>
              ))}
            </ul>
            {cur && (
              <AnimatePresence mode="wait">
                <motion.p
                  key={cur.word}
                  className="dx-words__line"
                  initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(2px)", transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, ease }}
                >
                  {cur.line}
                </motion.p>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── 2 · Escena a pantalla completa: el marco se abre al entrar ─────────────── */
function Showcase() {
  const frame = useRef<HTMLDivElement>(null);
  const still = useStill();
  const { scrollYProgress: p } = useScroll({ target: frame, offset: ["start end", "start 15%"] });
  const clip = useTransform(p, [0, 1], ["inset(14% 7% 14% 7% round 44px)", "inset(0% 0% 0% 0% round 0px)"]);
  const scale = useTransform(p, [0, 1], [1.16, 1]);

  return (
    <section id="dx-showcase" className="dx-scene dx-scene--paper dx-showcase">
      <div className="dx-showcase__head">
        <h2 className="dx-h2">
          Una app.<br />
          <em>Cada pantalla.</em>
        </h2>
      </div>
      <motion.div ref={frame} className="dx-showcase__frame" style={still ? undefined : { clipPath: clip }}>
        <motion.img
          src="/download/global-stock-product.webp"
          alt="Global Stock en notebook y celular: panel de ventas, inventario y caja."
          width={1672}
          height={941}
          loading="lazy"
          decoding="async"
          className="dx-showcase__img"
          style={still ? undefined : { scale }}
        />
      </motion.div>
    </section>
  );
}

/* ─────────────── Un botón por dispositivo ─────────────── */
function Platforms({ stores }: { stores: Stores }) {
  return (
    <section id="dx-platforms" className="dx-scene dx-scene--paper dx-platforms">
      <Anchor id="download-install" />
      <div className="dx-platforms__inner">
        <h2 className="dx-h2">
          Llevalo<br />
          <em>con vos.</em>
        </h2>
        <DeviceButtons stores={stores} />
      </div>
    </section>
  );
}

/* ─────────────── Cierre con la marca a todo el ancho ─────────────── */
function Closing() {
  return (
    <section id="dx-closing" className="dx-scene dx-scene--ink dx-closing">
      <div className="dx-closing__top">
        <h2 className="dx-h2">
          Empezá<br />
          <em>hoy.</em>
        </h2>
        <div className="dx-closing__cta">
          <Link href="/" className="dx-key">
            Abrir Global Stock <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p>Acceso protegido por usuario y negocio.</p>
        </div>
      </div>
      <div className="dx-wordmark" role="img" aria-label="Global Stock">
        <div className="dx-wordmark__text" aria-hidden="true">
          {"GLOBAL STOCK".split("").map((ch, n) =>
            ch === " " ? (
              <span key={n} className="dx-sp" />
            ) : (
              <span key={n} className="dx-ch">
                <motion.span
                  style={{ display: "inline-block" }}
                  initial={{ y: "105%" }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 1, ease, delay: n * 0.035 }}
                >
                  {ch}
                </motion.span>
              </span>
            )
          )}
        </div>
      </div>
      <nav className="dx-legal" aria-label="Información legal">
        <span className="dx-mono">Legal</span>
        <Link href="/legal/terms">Términos</Link>
        <Link href="/legal/privacy">Privacidad</Link>
        <Link href="/legal/cookies">Cookies y almacenamiento</Link>
        <Link href="/legal/security">Seguridad</Link>
      </nav>
    </section>
  );
}

export function DownloadExperience({ stores }: { stores: Stores }) {
  return (
    <>
      <Journey />
      <Showcase />
      <Features />
      <HowTo />
      <Audience />
      <Platforms stores={stores} />
      <Faq />
      <Closing />
    </>
  );
}
