"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { LanguageCode } from "./GlobalPreferences";

const locales: { code: LanguageCode; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" }
];

const titles: Record<LanguageCode, string> = {
  es: "Seleccionar idioma",
  en: "Choose language",
  pt: "Escolher idioma",
  fr: "Choisir la langue",
  de: "Sprache auswählen"
};

/**
 * A real, accessible popover rather than the OS-native select which rendered
 * as a very narrow, full-height menu on Windows and clipped against the
 * auth diagonal. The picker never changes the page's scroll position.
 */
export function AuthLanguagePicker({
  language,
  dark,
  onChange
}: {
  language: LanguageCode;
  dark: boolean;
  onChange: (language: LanguageCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();
  const currentIndex = Math.max(0, locales.findIndex(item => item.code === language));

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[focusedIndex]?.focus();
  }, [open, focusedIndex]);

  function close(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  function toggle() {
    if (open) close(true);
    else {
      setFocusedIndex(currentIndex);
      setOpen(true);
    }
  }

  function pick(code: LanguageCode) {
    onChange(code);
    close(true);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      if (event.key === "Enter" || event.key === " ") return; // native button click
      event.preventDefault();
      setFocusedIndex(event.key === "ArrowDown" ? currentIndex : (currentIndex + locales.length - 1) % locales.length);
      setOpen(true);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex(index => (index + (event.key === "ArrowDown" ? 1 : locales.length - 1)) % locales.length);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setFocusedIndex(event.key === "Home" ? 0 : locales.length - 1);
    }
  }

  return (
    <div ref={root} className="relative z-[70] shrink-0" data-testid="auth-language-picker">
      <button
        ref={trigger}
        type="button"
        aria-label={titles[language]}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? "gs-auth-language-options" : undefined}
        onClick={toggle}
        onKeyDown={onTriggerKeyDown}
        data-testid="auth-language-trigger"
        className={
          "flex h-9 min-w-[70px] items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[12px] font-semibold " +
          "transition-[border-color,background-color] hover:border-[#8F0000]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8F0000] " +
          (dark
            ? "border-white/20 bg-white/[.07] text-white hover:bg-white/[.11]"
            : "border-[#E4DDDA] bg-white/70 text-[#312629] hover:bg-white")
        }
      >
        <Globe2 size={14} aria-hidden="true" className="shrink-0 text-[#8F0000]" />
        <span>{language.toUpperCase()}</span>
        <ChevronDown size={13} aria-hidden="true" className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="gs-auth-language-options"
            role="listbox"
            aria-label={titles[language]}
            data-testid="auth-language-menu"
            key="auth-language-menu"
            initial={reduceMotion ? false : { opacity: 0, y: -5, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: .98 }}
            transition={{ duration: reduceMotion ? 0 : .17, ease: [0.22, 1, .36, 1] }}
            onKeyDown={onMenuKeyDown}
            className={
              "absolute right-0 top-[calc(100%+9px)] z-[80] w-[204px] origin-top-right overflow-hidden " +
              "rounded-2xl border p-1.5 shadow-[0_18px_55px_rgba(0,0,0,.23)] " +
              (dark ? "border-white/15 bg-[#252027] text-white" : "border-[#E8DFDC] bg-[#FFFCFA] text-[#241A1D]")
            }
          >
            {locales.map((item, index) => (
              <button
                key={item.code}
                ref={node => { optionRefs.current[index] = node; }}
                type="button"
                role="option"
                aria-selected={language === item.code}
                onClick={() => pick(item.code)}
                onMouseEnter={() => setFocusedIndex(index)}
                data-testid={`auth-language-option-${item.code}`}
                className={
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] " +
                  "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8F0000] " +
                  (language === item.code
                    ? dark ? "bg-[#8F0000]/35 text-white" : "bg-[#8F0000]/10 text-[#790010]"
                    : dark ? "hover:bg-white/10" : "hover:bg-[#F5EAE8]")
                }
              >
                <span className="w-[24px] shrink-0 text-[11px] font-bold opacity-70">{item.code.toUpperCase()}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {language === item.code && <Check size={16} aria-hidden="true" className="shrink-0 text-[#D43A47]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
