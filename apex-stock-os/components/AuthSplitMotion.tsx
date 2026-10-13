"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { LanguageCode } from "./GlobalPreferences";

type Mode = "signin" | "signup";
const words: Record<LanguageCode, {
  welcome: string; start: string; welcomeBody: string; startBody: string;
  login: string; register: string;
}> = {
  es: {
    welcome: "Tu negocio, a mano.", start: "Empezá por lo importante.",
    welcomeBody: "Ingresá para consultar las ventas, el inventario y la caja.",
    startBody: "Creá tu cuenta y organizá productos, ventas y stock en un solo sistema.",
    login: "Iniciar sesión", register: "Crear cuenta"
  },
  en: {
    welcome: "Your business, at hand.", start: "Start with what matters.",
    welcomeBody: "Sign in to review sales, inventory and cash.",
    startBody: "Create an account to organize products, sales and stock.",
    login: "Sign in", register: "Create account"
  },
  pt: {
    welcome: "Seu negócio, à mão.", start: "Comece pelo essencial.",
    welcomeBody: "Entre para consultar vendas, estoque e caixa.",
    startBody: "Crie sua conta para organizar produtos, vendas e estoque.",
    login: "Entrar", register: "Criar conta"
  },
  fr: {
    welcome: "Votre activité à portée de main.", start: "Commencez par l'essentiel.",
    welcomeBody: "Retrouvez vos ventes, stocks et caisse.",
    startBody: "Créez votre compte pour organiser votre activité.",
    login: "Se connecter", register: "Créer un compte"
  },
  de: {
    welcome: "Dein Geschäft im Blick.", start: "Starte mit dem Wesentlichen.",
    welcomeBody: "Melde dich an, um Verkäufe, Lager und Kasse zu sehen.",
    startBody: "Erstelle ein Konto für Produkte, Verkäufe und Lager.",
    login: "Anmelden", register: "Konto erstellen"
  }
};
const ease = [0.76, 0, 0.24, 1] as const;

/** Same two-panel diagonal swap as the reference, with a vertical layout
 * on narrow screens. Auth form remains owned by AuthScreen, never remounted
 * by the mode transition (important for passwords and accessibility).
 */
export function AuthSplitMotion({
  mode, language, dark, onSwitch, children
}: {
  mode: Mode; language: LanguageCode; dark: boolean;
  onSwitch: (next: Mode) => void; children: ReactNode;
}) {
  const [wide, setWide] = useState(false);
  const reduce = useReducedMotion();
  const phrases = words[language];

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const slide = { duration: reduce ? 0 : .76, ease };
  const mask = wide
    ? (mode === "signin"
      ? "polygon(12% 0%,100% 0%,100% 100%,0% 100%)"
      : "polygon(0% 0%,100% 0%,88% 100%,0% 100%)")
    : "polygon(0% 0%,100% 0%,100% 100%,0% 100%)";

  return (
    <div className={`relative mx-auto my-auto flex w-full max-w-[1110px] flex-col overflow-hidden rounded-[27px] border shadow-[0_34px_110px_rgba(0,0,0,.48)] lg:block lg:h-[min(840px,93dvh)] lg:min-h-[570px] ${dark ? "border-white/15 bg-[#131116]" : "border-black/10 bg-[#FFFDFB]"}`}>
      <motion.aside
        initial={false}
        animate={{ x: wide && mode === "signin" ? "86%" : "0%", clipPath: mask }}
        transition={slide}
        className="relative z-10 flex min-h-[160px] w-full shrink-0 flex-col justify-center overflow-hidden bg-gradient-to-br from-[#37020D] via-[#1D0B14] to-[#090A10] px-6 py-5 text-white sm:min-h-[200px] sm:px-9 lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-[54%] lg:px-[clamp(36px,4vw,70px)]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full bg-[#C31531]/30 blur-[80px]"/>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-3 h-56 w-56 rounded-full bg-[#780F25]/25 blur-[70px]"/>
        <div className="relative z-10 max-w-[350px]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.23em] text-[#FF9AA5]">
            GLOBAL STOCK
          </p>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={mode + language}
              initial={reduce ? false : { opacity: 0, x: mode === "signup" ? -18 : 18, filter: "blur(5px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: mode === "signup" ? 12 : -12, filter: "blur(5px)" }}
              transition={{ duration: reduce ? 0 : .26, delay: reduce ? 0 : .23 }}
            >
              <h2 className="max-w-[15ch] text-[clamp(1.7rem,3vw,3.3rem)] font-semibold leading-[1.07] tracking-[-.05em]">
                {mode === "signin" ? phrases.welcome : phrases.start}
              </h2>
              <p className="mt-3 max-w-[35ch] text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">
                {mode === "signin" ? phrases.welcomeBody : phrases.startBody}
              </p>
            </motion.div>
          </AnimatePresence>
          <button
            type="button"
            onClick={() => onSwitch(mode === "signin" ? "signup" : "signin")}
            className="mt-6 hidden min-h-11 items-center rounded-full border border-white/40 px-5 text-xs font-semibold text-white transition-colors hover:border-[#FF8795] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF8795] lg:inline-flex"
          >
            {mode === "signin" ? phrases.register : phrases.login}
            <ArrowRight size={14} className="ml-2"/>
          </button>
        </div>
      </motion.aside>
      <motion.div
        initial={false}
        animate={{ x: wide && mode === "signup" ? "86%" : "0%" }}
        transition={slide}
        className={`relative z-0 w-full shrink-0 lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-[54%] lg:overflow-y-auto lg:overscroll-contain ${dark ? "bg-[#131116]" : "bg-[#FFFDFB]"}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
