"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { LanguageCode } from "./GlobalPreferences";

type Mode = "signin" | "signup";
const words: Record<LanguageCode, {
  welcome: string; start: string; welcomeBody: string; startBody: string;
}> = {
  es: {
    welcome: "Tu negocio, a mano.", start: "Empezá por lo importante.",
    welcomeBody: "Ingresá para consultar las ventas, el inventario y la caja.",
    startBody: "Creá tu cuenta y organizá productos, ventas y stock en un solo sistema."
  },
  en: {
    welcome: "Your business, at hand.", start: "Start with what matters.",
    welcomeBody: "Sign in to review sales, inventory and cash.",
    startBody: "Create an account to organize products, sales and stock."
  },
  pt: {
    welcome: "Seu negócio, à mão.", start: "Comece pelo essencial.",
    welcomeBody: "Entre para consultar vendas, estoque e caixa.",
    startBody: "Crie sua conta para organizar produtos, vendas e estoque."
  },
  fr: {
    welcome: "Votre activité à portée de main.", start: "Commencez par l'essentiel.",
    welcomeBody: "Retrouvez vos ventes, stocks et caisse.",
    startBody: "Créez votre compte pour organiser votre activité."
  },
  de: {
    welcome: "Dein Geschäft im Blick.", start: "Starte mit dem Wesentlichen.",
    welcomeBody: "Melde dich an, um Verkäufe, Lager und Kasse zu sehen.",
    startBody: "Erstelle ein Konto für Produkte, Verkäufe und Lager."
  }
};
const ease = [0.22, 1, 0.36, 1] as const;

/** The panels stay inside independent grid cells, and swap places smoothly.
 * The previous diagonal mask hid part of the form and its buttons.
 */
export function AuthSplitMotion({
  mode, language, dark, children
}: {
  mode: Mode; language: LanguageCode; dark: boolean;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const phrases = words[language];
  const layout = { duration: reduce ? 0 : 0.54, ease };

  return (
    <div
      data-testid="auth-split-stage"
      className={`relative mx-auto my-auto grid w-full max-w-[1080px] grid-cols-1 overflow-hidden rounded-[26px] border shadow-[0_24px_80px_rgba(0,0,0,.10)] lg:h-[min(820px,calc(100dvh-36px))] lg:grid-cols-2 lg:grid-rows-1 ${
        dark ? "border-white/15 bg-[#151419]" : "border-[#E0E0E6] bg-white"
      }`}
    >
      <motion.aside
        layout="position"
        data-testid="auth-diagonal-panel"
        transition={{ layout }}
        className={`relative hidden h-full min-h-0 min-w-0 overflow-hidden bg-gradient-to-br from-[#390715] via-[#220913] to-[#101017] px-8 py-8 text-white lg:row-start-1 lg:flex lg:flex-col lg:justify-center lg:px-[clamp(32px,4vw,64px)] ${
          mode === "signin" ? "lg:col-start-2" : "lg:col-start-1"
        }`}
        aria-label={language === "es" ? "Información de Global Stock" : "Global Stock"}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#C31531]/20 blur-[80px]"/>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-4 h-56 w-56 rounded-full bg-[#780F25]/20 blur-[70px]"/>
        <div className="relative z-10 max-w-[380px]">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.19em] text-[#FF9AA5]">GLOBAL STOCK</p>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={mode + language}
              initial={reduce ? false : { opacity: 0, y: 9, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -7, filter: "blur(4px)" }}
              transition={{ duration: reduce ? 0 : 0.22 }}
            >
              <h2 className="max-w-[16ch] text-[clamp(1.8rem,3vw,3rem)] font-semibold leading-[1.12] tracking-[-.045em]">
                {mode === "signin" ? phrases.welcome : phrases.start}
              </h2>
              <p className="mt-4 max-w-[38ch] text-sm leading-6 text-white/75">
                {mode === "signin" ? phrases.welcomeBody : phrases.startBody}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.aside>
      <motion.div
        layout="position"
        data-testid="auth-form-panel"
        transition={{ layout }}
        className={`relative z-0 min-w-0 overflow-visible lg:row-start-1 lg:h-full lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain ${
          mode === "signin" ? "lg:col-start-1" : "lg:col-start-2"
        } ${dark ? "bg-[#151419]" : "bg-white"}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
