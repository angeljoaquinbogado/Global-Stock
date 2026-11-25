"use client";

import Link from "next/link";
import { useId, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Plus } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;
const inView = { once: true, margin: "-8%" } as const;

/* Destinos del menú del sitio (#download-…). Van en un punto sin estilo propio porque globals.css
   pinta de forma forzada las secciones con esos ids en el tema claro. */
export function Anchor({ id, className = "dx-anchor" }: { id: string; className?: string }) {
  return <span id={id} className={className} aria-hidden="true" />;
}

/* ─────────────── Todo lo que incluye: índice editorial ─────────────── */
const FEATURES: [string, string][] = [
  ["Inventario", "El stock de cada producto al día, con aviso cuando queda poco."],
  ["Productos", "Tu catálogo con precios. Cargalo a mano o con el lector de códigos de barras."],
  ["Ventas", "Cobrá y registrá cada venta desde el celular o la PC."],
  ["Caja", "Ingresos y movimientos del día, claros."],
  ["Compras", "Anotá lo que comprás y reponé el stock."],
  ["Proveedores", "Quién te vende qué, en un solo lugar."],
  ["Clientes", "Tus clientes ordenados, sin planillas."],
  ["Reportes", "Ventas, ganancias y productos más vendidos."],
  ["Multimoneda", "ARS, USD, EUR, BRL, MXN, GBP y JPY."],
  ["Idiomas", "Español, inglés y portugués."],
  ["Inteligencia", "Preguntale a la app por tus ventas y tu stock."],
  ["Roles", "Cada persona ve solo lo que necesita."]
];

export function Features() {
  return (
    <section id="dx-features" aria-labelledby="dx-features-h" className="dx-scene dx-scene--ink dx-features">
      <Anchor id="download-feature-catalog" />
      <div className="dx-wrap">
        <p className="dx-mono dx-label">Funciones</p>
        <h2 id="dx-features-h" className="dx-h2">
          Todo lo que<br />
          <em>incluye.</em>
        </h2>
        <ul className="dx-index">
          {FEATURES.map(([name, desc], i) => (
            <motion.li
              key={name}
              className="dx-row"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={inView}
              transition={{ duration: 0.7, ease }}
            >
              <motion.span
                className="dx-row__line"
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={inView}
                transition={{ duration: 1, ease }}
              />
              <span className="dx-mono dx-row__n">{String(i + 1).padStart(2, "0")}</span>
              <span className="dx-row__name">{name}</span>
              <span className="dx-row__desc">{desc}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────── Cómo empezar ─────────────── */
const STEPS: [string, string][] = [
  ["Creá tu cuenta", "Entrá con tu usuario y armá tu negocio."],
  ["Cargá tus productos", "A mano, o escaneando el código de barras."],
  ["Vendé y mirá tus números", "Ventas, caja y reportes se actualizan con cada operación."]
];

export function HowTo() {
  return (
    <section id="dx-how" aria-labelledby="dx-how-h" className="dx-scene dx-scene--paper dx-how">
      <div className="dx-wrap">
        <p className="dx-mono dx-label">Cómo empezar</p>
        <h2 id="dx-how-h" className="dx-h2">
          Tres pasos,<br />
          <em>sin vueltas.</em>
        </h2>
        <ol className="dx-how__list">
          {STEPS.map(([title, text], i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={inView}
              transition={{ duration: 0.8, ease, delay: i * 0.07 }}
            >
              <motion.span
                className="dx-how__line"
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={inView}
                transition={{ duration: 1.1, ease, delay: i * 0.07 }}
              />
              <span className="dx-how__n" aria-hidden="true">{i + 1}</span>
              <strong>{title}</strong>
              <p>{text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────── Para quién: el texto se enciende palabra por palabra al hacer scroll ─────────────── */
const AUDIENCE: { text: string; serif?: boolean }[] = [
  {
    text:
      "Para almacenes y kioscos, indumentaria, carnicerías, verdulerías, panaderías, farmacias, librerías, ferreterías, electrónica, dietéticas, estética, ópticas, veterinarias, joyerías, peluquerías, restaurantes, mayoristas y depósitos, talleres y fábricas, tiendas online y servicios."
  },
  { text: "Y para cualquier otro negocio que venda.", serif: true }
];

function Word({ progress, from, to, serif, children }: { progress: MotionValue<number>; from: number; to: number; serif?: boolean; children: ReactNode }) {
  const opacity = useTransform(progress, [from, to], [0.18, 1]);
  return (
    <motion.span className={serif ? "dx-w is-serif" : "dx-w"} style={{ opacity }}>
      {children}
    </motion.span>
  );
}

export function Audience() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  const words = AUDIENCE.flatMap((s) => s.text.split(" ").map((w) => ({ w, serif: s.serif })));
  return (
    <section ref={ref} id="dx-audience" aria-labelledby="dx-audience-h" className="dx-scene dx-scene--ink dx-audience">
      <Anchor id="download-sectors" />
      <div className="dx-wrap">
        <h2 id="dx-audience-h" className="dx-mono dx-label">Para quién</h2>
        <p>
          {words.map(({ w, serif }, i) => {
            const from = (i / words.length) * 0.8;
            return (
              <Word key={i} progress={scrollYProgress} from={from} to={from + 0.2} serif={serif}>
                {w}
              </Word>
            );
          })}
        </p>
      </div>
    </section>
  );
}

/* ─────────────── Preguntas frecuentes ─────────────── */
const FAQ: { q: string; a: ReactNode }[] = [
  { q: "¿Cuánto cuesta?", a: "Hoy no necesitás un plan para empezar: abrís la app y usás las herramientas disponibles, sin suscripción." },
  { q: "¿Sirve para mi tipo de negocio?", a: "Sí. Está pensada para cualquier rubro y para que la usen varios negocios y locales." },
  { q: "¿En qué dispositivos funciona?", a: "En celular, tablet y computadora: desde el navegador o instalada como app en iPhone, iPad, Android, Windows y Mac." },
  { q: "¿En qué idiomas y monedas?", a: "Español, inglés y portugués, con ARS, USD, EUR, BRL, MXN, GBP y JPY." },
  {
    q: "¿Cómo se protegen mis datos?",
    a: (
      <>
        Cada persona entra con su usuario y ve solo lo que su rol permite. Los detalles están en{" "}
        <Link href="/legal/security">Seguridad</Link> y <Link href="/legal/privacy">Privacidad</Link>.
      </>
    )
  },
  { q: "¿Tengo que instalar algo?", a: "No. Podés usarla desde el navegador, o instalarla desde esta página con un toque en tu dispositivo." }
];

export function Faq() {
  const uid = useId();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="dx-faq" aria-labelledby="dx-faq-h" className="dx-scene dx-scene--paper dx-faq">
      <div className="dx-wrap">
        <p className="dx-mono dx-label">Preguntas</p>
        <h2 id="dx-faq-h" className="dx-h2">
          Lo que<br />
          <em>nos preguntan.</em>
        </h2>
        <ul className="dx-faq__list">
          {FAQ.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <li key={q}>
                <button type="button" className="dx-faq__q" aria-expanded={isOpen} aria-controls={`${uid}-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                  {q}
                  <Plus size={22} aria-hidden="true" />
                </button>
                <div id={`${uid}-${i}`} className={isOpen ? "dx-faq__a is-open" : "dx-faq__a"}>
                  <div>
                    <p>{a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
