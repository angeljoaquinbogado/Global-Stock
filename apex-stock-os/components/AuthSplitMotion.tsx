"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import type { LanguageCode } from "./GlobalPreferences";

type Mode = "signin" | "signup";
const words: Record<LanguageCode, {
  welcome: [string, string]; start: [string, string];
  welcomeBody: string; startBody: string;
}> = {
  es: {
    welcome: ["Bienvenido", "de nuevo."],
    start: ["Empezá tu", "primera página."],
    welcomeBody: "Tu negocio, tus ventas y tus ideas, exactamente donde las dejaste.",
    startBody: "Una cuenta para gestionar tu negocio, tus ventas y tu inventario a tu manera."
  },
  en: {
    welcome: ["Welcome", "back."],
    start: ["Start the", "first page."],
    welcomeBody: "Your business, your sales and your ideas, right where you left them.",
    startBody: "One account to run your business, sales and inventory your way."
  },
  pt: {
    welcome: ["Boas-vindas", "de volta."],
    start: ["Comece sua", "primeira página."],
    welcomeBody: "Seu negócio, suas vendas e suas ideias, exatamente como você deixou.",
    startBody: "Uma conta para organizar seu negócio e seu estoque."
  },
  fr: {
    welcome: ["Heureux de vous", "revoir."],
    start: ["Écrivez la", "première page."],
    welcomeBody: "Votre activité, vos ventes et vos idées, là où vous les avez laissées.",
    startBody: "Un seul compte pour votre activité et votre stock."
  },
  de: {
    welcome: ["Willkommen", "zurück."],
    start: ["Beginne die", "erste Seite."],
    welcomeBody: "Dein Geschäft, deine Verkäufe und Ideen, genau wie du sie verlassen hast.",
    startBody: "Ein Konto, um Geschäft und Lager auf deine Art zu verwalten."
  }
};

const signInShape = "polygon(36% 0%, 100% 0%, 100% 100%, 53% 100%)";
const signUpShape = "polygon(0% 0%, 44% 0%, 63% 100%, 0% 100%)";
const coverShape = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
const easing = [0.76, 0, 0.24, 1] as const;

/**
 * One seamless, dark diagonal curtain instead of two overlapping panels.
 * During the switch it briefly covers the full card, then reveals the other
 * fixed form. No stray red separator line and no page/form scrolling.
 */
export function AuthSplitMotion({
  mode, language, dark, children, scrollable = false
}: {
  mode: Mode;
  language: LanguageCode;
  dark: boolean;
  children: ReactNode;
  /** For the separate business onboarding screen; not for login or signup. */
  scrollable?: boolean;
}) {
  const reduce = useReducedMotion();
  const isSignIn = mode === "signin";
  const wordsForLocale = words[language];
  const lines = isSignIn ? wordsForLocale.welcome : wordsForLocale.start;
  const description = isSignIn ? wordsForLocale.welcomeBody : wordsForLocale.startBody;
  const formRef = useRef<HTMLDivElement>(null);
  const panelMotion = reduce ? 0 : 0.82;

  useEffect(() => {
    if (!scrollable) return;
    formRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [mode, scrollable]);

  return (
    <div
      data-testid="auth-split-stage"
      className={
        "gs-reference-auth relative isolate mx-auto h-full min-h-0 w-full overflow-hidden " +
        "rounded-[20px] border shadow-[0_24px_85px_rgba(0,0,0,.23)] sm:rounded-[28px] " +
        (dark
          ? "border-white/10 bg-[#191519] text-white"
          : "border-[#E7DFDB] bg-[#FBF8F4] text-[#241C1D]")
      }
    >
      <motion.aside
        data-testid="auth-diagonal-panel"
        aria-label={language === "es" ? "Bienvenida de Global Stock" : "Global Stock welcome"}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 hidden overflow-hidden bg-[linear-gradient(150deg,#410913_0%,#200B13_55%,#0E1012_100%)] lg:block"
        initial={false}
        animate={{
          clipPath: reduce
            ? (isSignIn ? signInShape : signUpShape)
            : (isSignIn
                ? [signUpShape, coverShape, signInShape]
                : [signInShape, coverShape, signUpShape])
        }}
        transition={{ duration: panelMotion, ease: easing, times: [0, .46, 1] }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_15%,rgba(170,17,43,.34),transparent_55%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(115,11,32,.3),transparent_55%)]" />
      </motion.aside>

      <div
        className={
          "pointer-events-none absolute inset-y-0 z-20 hidden items-center lg:flex " +
          (isSignIn ? "left-[61%] right-[4.5%]" : "left-[6%] right-[57%]")
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode + language}
            initial={reduce ? false : { opacity: 0, y: 13 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: reduce ? 0 : .28, delay: reduce ? 0 : .36 }}
            className="w-full min-w-0"
          >
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[.3em] text-[#F4ABB3]">GLOBAL STOCK</p>
            <h2 className="text-[clamp(2.4rem,4.5vw,5.5rem)] leading-[1.02] tracking-[-.055em] text-[#FFF5F1]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {lines[0]}
              <span className="block italic text-[#EEC2C7]">{lines[1]}</span>
            </h2>
            <p className="mt-6 max-w-[32ch] text-[clamp(.83rem,1.05vw,1rem)] leading-[1.75] text-[#E5C9CD]">{description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        ref={formRef}
        data-testid="auth-form-panel"
        className={
          "relative z-30 flex h-full min-h-0 w-full min-w-0 flex-col " +
          "lg:absolute lg:inset-y-0 lg:left-0 lg:w-1/2 " +
          (scrollable
            ? "gs-auth-panel-scroll overflow-y-auto overscroll-contain "
            : "gs-auth-panel-fixed overflow-hidden ") +
          (isSignIn ? "lg:translate-x-0" : "lg:translate-x-full") +
          (reduce ? "" : " lg:transition-transform lg:duration-[820ms] lg:ease-[cubic-bezier(0.76,0,0.24,1)]")
        }
      >
        <div className={
          "mx-auto flex w-full max-w-[570px] min-h-full shrink-0 flex-col justify-center " +
          (scrollable ? "py-4 lg:py-6" : "py-0")
        }>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
