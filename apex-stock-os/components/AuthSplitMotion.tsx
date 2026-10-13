"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { LanguageCode } from "./GlobalPreferences";

type Mode = "signin" | "signup";

const messages: Record<LanguageCode, {
  welcome: [string, string]; start: [string, string];
  welcomeBody: string; startBody: string;
}> = {
  es: {
    welcome: ["Qué bueno verte", "de nuevo."],
    start: ["Empezá una", "nueva etapa."],
    welcomeBody: "Todo lo que necesitás para gestionar tu negocio, en un solo lugar.",
    startBody: "Tu negocio empieza acá. Organizá tus ventas, productos y stock.",
  },
  en: {
    welcome: ["Welcome", "back."],
    start: ["Start your", "first page."],
    welcomeBody: "Everything you need to run your business, all in one place.",
    startBody: "Your business starts here. Organize sales, products and stock.",
  },
  pt: {
    welcome: ["Que bom ter você", "de volta."],
    start: ["Comece uma", "nova etapa."],
    welcomeBody: "Tudo para administrar sua empresa, em um só lugar.",
    startBody: "Seu negócio começa aqui. Organize vendas, produtos e estoque.",
  },
  fr: {
    welcome: ["Heureux de vous", "revoir."],
    start: ["Commencez une", "nouvelle étape."],
    welcomeBody: "Tout pour gérer votre activité en un seul endroit.",
    startBody: "Votre activité commence ici. Gérez ventes, produits et stocks.",
  },
  de: {
    welcome: ["Schön, dich", "wiederzusehen."],
    start: ["Beginne ein", "neues Kapitel."],
    welcomeBody: "Alles für dein Geschäft an einem Ort.",
    startBody: "Starte hier. Verwalte Verkäufe, Produkte und Lagerbestand.",
  },
};

const easing = [0.76, 0, 0.24, 1] as const;

/**
 * Reference-style diagonal curtain: a single coloured surface sweeps across
 * the page while the form slides to the other side. The mask never covers
 * the form's interactive controls. On mobile the entire form remains visible.
 */
export function AuthSplitMotion({
  mode, language, dark, children,
}: {
  mode: Mode;
  language: LanguageCode;
  dark: boolean;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const copy = messages[language];
  const isSignIn = mode === "signin";
  const lines = isSignIn ? copy.welcome : copy.start;
  const description = isSignIn ? copy.welcomeBody : copy.startBody;
  const duration = reducedMotion ? 0 : 0.76;

  return (
    <div
      data-testid="auth-split-stage"
      className={
        "relative isolate mx-auto w-full min-w-0 overflow-hidden rounded-[22px] border shadow-[0_32px_90px_rgba(0,0,0,.28)] sm:rounded-[28px] " +
        "min-h-[calc(100dvh-24px)] lg:h-[calc(100dvh-28px)] lg:min-h-[560px] " +
        (dark
          ? "border-white/10 bg-[#171318]"
          : "border-[#E8E2DF] bg-[#F9F6F2]")
      }
    >
      <motion.aside
        data-testid="auth-diagonal-panel"
        aria-label={language === "es" ? "Bienvenida de Global Stock" : "Global Stock welcome"}
        className={
          "pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[58%] overflow-hidden text-white lg:flex lg:items-center " +
          "bg-[linear-gradient(145deg,#420A14_0%,#23080F_48%,#0E0C12_100%)]"
        }
        initial={false}
        animate={{
          x: isSignIn ? "72.413793%" : "0%",
          clipPath: isSignIn
            ? "polygon(10% 0%, 100% 0%, 100% 100%, 22% 100%)"
            : "polygon(0% 0%, 90% 0%, 80% 100%, 0% 100%)",
        }}
        transition={{ duration, ease: easing }}
      >
        <div aria-hidden="true" className="absolute -right-24 -top-40 h-[560px] w-[560px] rounded-full bg-[#A3152B]/25 blur-[110px]" />
        <div aria-hidden="true" className="absolute -bottom-48 left-0 h-[440px] w-[440px] rounded-full bg-[#570714]/25 blur-[100px]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(115deg,transparent_40%,rgba(255,255,255,.055)_50%,transparent_60%)]" />
        <div
          className={
            "relative z-10 w-full max-w-[620px] " +
            (isSignIn ? "pb-4 pl-[25%] pr-[12%]" : "pb-4 pl-[9%] pr-[23%]")
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode + language}
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.31em] text-[#ED9DAB]">
                GLOBAL STOCK
              </p>
              <h2
                className="max-w-[14ch] text-[clamp(2.25rem,4.25vw,5rem)] font-normal leading-[1.08] tracking-[-.045em]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {lines[0]}
                <span className="block italic text-[#F7E9E8]">{lines[1]}</span>
              </h2>
              <p className="mt-6 max-w-[31ch] text-[clamp(.85rem,1.12vw,1.05rem)] leading-[1.8] text-[#DCC9CD]">
                {description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.aside>

      <div
        data-testid="auth-form-panel"
        className={
          "relative z-20 flex min-h-[calc(100dvh-24px)] w-full min-w-0 flex-col " +
          "lg:absolute lg:inset-y-0 lg:left-0 lg:min-h-0 lg:w-1/2 lg:overflow-x-hidden " +
          "lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:thin] " +
          (isSignIn ? "lg:translate-x-0" : "lg:translate-x-full") +
          (reducedMotion
            ? ""
            : " lg:transition-transform lg:duration-[760ms] lg:ease-[cubic-bezier(0.76,0,0.24,1)]")
        }
      >
        <div className="mx-auto flex w-full max-w-[570px] flex-1 flex-col justify-center px-0 py-2 sm:px-3 lg:max-w-[530px] lg:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
