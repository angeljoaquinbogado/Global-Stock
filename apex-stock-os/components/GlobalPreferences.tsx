"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Coins, Globe2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type LanguageCode = "es" | "en" | "pt" | "fr" | "de";

type GlobalPreferencesProps = {
  language: LanguageCode;
  currency: string;
  onLanguageChange: (language: LanguageCode) => void;
  onCurrencyChange: (currency: string) => void;
};

const languages: Array<{
  code: LanguageCode;
  short: string;
  native: string;
}> = [
  { code: "es", short: "ES", native: "Español" },
  { code: "en", short: "EN", native: "English" },
  { code: "pt", short: "PT", native: "Português" },
  { code: "fr", short: "FR", native: "Français" },
  { code: "de", short: "DE", native: "Deutsch" }
];

const currencyLabels: Record<
  string,
  {
    symbol: string;
    labels: Record<LanguageCode, string>;
  }
> = {
  ARS: {
    symbol: "$",
    labels: {
      es: "Peso argentino",
      en: "Argentine peso",
      pt: "Peso argentino",
      fr: "Peso argentin",
      de: "Argentinischer Peso"
    }
  },
  USD: {
    symbol: "US$",
    labels: {
      es: "Dólar estadounidense",
      en: "US dollar",
      pt: "Dólar americano",
      fr: "Dollar américain",
      de: "US-Dollar"
    }
  },
  EUR: {
    symbol: "€",
    labels: {
      es: "Euro",
      en: "Euro",
      pt: "Euro",
      fr: "Euro",
      de: "Euro"
    }
  },
  BRL: {
    symbol: "R$",
    labels: {
      es: "Real brasileño",
      en: "Brazilian real",
      pt: "Real brasileiro",
      fr: "Réal brésilien",
      de: "Brasilianischer Real"
    }
  },
  MXN: {
    symbol: "MX$",
    labels: {
      es: "Peso mexicano",
      en: "Mexican peso",
      pt: "Peso mexicano",
      fr: "Peso mexicain",
      de: "Mexikanischer Peso"
    }
  },
  GBP: {
    symbol: "£",
    labels: {
      es: "Libra esterlina",
      en: "British pound",
      pt: "Libra esterlina",
      fr: "Livre sterling",
      de: "Britisches Pfund"
    }
  },
  JPY: {
    symbol: "¥",
    labels: {
      es: "Yen japonés",
      en: "Japanese yen",
      pt: "Iene japonês",
      fr: "Yen japonais",
      de: "Japanischer Yen"
    }
  }
};

const ui: Record<
  LanguageCode,
  {
    eyebrow: string;
    language: string;
    currency: string;
    close: string;
    changeLanguage: string;
    changeCurrency: string;
  }
> = {
  es: {
    eyebrow: "Preferencias globales",
    language: "Idioma",
    currency: "Moneda",
    close: "Cerrar",
    changeLanguage: "Cambiar idioma",
    changeCurrency: "Cambiar moneda"
  },
  en: {
    eyebrow: "Global preferences",
    language: "Language",
    currency: "Currency",
    close: "Close",
    changeLanguage: "Change language",
    changeCurrency: "Change currency"
  },
  pt: {
    eyebrow: "Preferências globais",
    language: "Idioma",
    currency: "Moeda",
    close: "Fechar",
    changeLanguage: "Alterar idioma",
    changeCurrency: "Alterar moeda"
  },
  fr: {
    eyebrow: "Préférences globales",
    language: "Langue",
    currency: "Devise",
    close: "Fermer",
    changeLanguage: "Changer de langue",
    changeCurrency: "Changer de devise"
  },
  de: {
    eyebrow: "Globale Einstellungen",
    language: "Sprache",
    currency: "Währung",
    close: "Schließen",
    changeLanguage: "Sprache ändern",
    changeCurrency: "Währung ändern"
  }
};

const currencies = Object.keys(currencyLabels);
const spring = { type: "spring", bounce: 0, duration: 0.34 } as const;

export function GlobalPreferences({
  language,
  currency,
  onLanguageChange,
  onCurrencyChange
}: GlobalPreferencesProps) {
  const [open, setOpen] = useState<"language" | "currency" | null>(null);
  const [mounted, setMounted] = useState(false);
  const labels = ui[language];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const activeLanguage = useMemo(
    () => languages.find((item) => item.code === language) ?? languages[0],
    [language]
  );

  const activeCurrency = currencyLabels[currency] ?? currencyLabels.ARS;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4 sm:backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(null);
          }}
        >
          <motion.section
            initial={{ opacity: 0, y: 38, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.99 }}
            transition={spring}
            className="apex-glass flex max-h-[calc(100dvh-16px)] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[30px] border-x-0 border-b-0 sm:max-h-[calc(100dvh-32px)] sm:rounded-[30px] sm:border"
          >
            <div className="flex shrink-0 items-center justify-between p-5 pb-3">
              <div>
                <motion.p
                  key={labels.eyebrow}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8F0000]"
                >
                  {labels.eyebrow}
                </motion.p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.035em]">
                  {open === "language"
                    ? labels.language
                    : labels.currency}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]"
                aria-label={labels.close}
              >
                <X size={16} />
              </button>
            </div>

            <div className="apex-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-2 sm:pb-5">
              <div className="grid gap-2">
                {open === "language"
                  ? languages.map((item) => {
                      const selected = item.code === language;
                      return (
                        <ChoiceButton
                          key={item.code}
                          selected={selected}
                          badge={item.short}
                          title={item.native}
                          subtitle={item.code.toUpperCase()}
                          onClick={() => {
                            onLanguageChange(item.code);
                            setOpen(null);
                          }}
                        />
                      );
                    })
                  : currencies.map((code) => {
                      const item = currencyLabels[code];
                      const selected = code === currency;
                      return (
                        <ChoiceButton
                          key={code}
                          selected={selected}
                          badge={item.symbol}
                          title={code}
                          subtitle={item.labels[language]}
                          onClick={() => {
                            onCurrencyChange(code);
                            setOpen(null);
                          }}
                        />
                      );
                    })}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <PreferenceButton
          icon={<Globe2 size={15} />}
          primary={activeLanguage.short}
          secondary={activeLanguage.native}
          onClick={() => setOpen("language")}
          ariaLabel={labels.changeLanguage}
        />
        <PreferenceButton
          icon={<Coins size={15} />}
          primary={currency}
          secondary={activeCurrency.symbol}
          onClick={() => setOpen("currency")}
          ariaLabel={labels.changeCurrency}
        />
      </div>

      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}

function ChoiceButton({
  selected,
  badge,
  title,
  subtitle,
  onClick
}: {
  selected: boolean;
  badge: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={
        "flex min-h-[62px] touch-manipulation items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition " +
        (selected
          ? "border-[#8F0000]/35 bg-[#8F0000]/10"
          : "border-[var(--apex-border)] bg-[var(--apex-surface-strong)]")
      }
    >
      <span
        className={
          "grid h-10 min-w-10 place-items-center rounded-[14px] px-2 text-xs font-bold " +
          (selected
            ? "bg-[#8F0000] text-white"
            : "bg-[var(--apex-bg)] text-[var(--apex-muted)]")
        }
      >
        {badge}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-[var(--apex-muted)]">
          {subtitle}
        </span>
      </span>
      {selected && (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring}
          className="grid h-7 w-7 place-items-center rounded-full bg-[#8F0000] text-white"
        >
          <Check size={14} />
        </motion.span>
      )}
    </motion.button>
  );
}

function PreferenceButton({
  icon,
  primary,
  secondary,
  onClick,
  ariaLabel
}: {
  icon: React.ReactNode;
  primary: string;
  secondary: string;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-11 min-w-0 touch-manipulation items-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 shadow-sm transition-colors hover:bg-[var(--apex-bg)]"
    >
      <span className="text-[#8F0000]">{icon}</span>
      <span className="text-xs font-bold">{primary}</span>
      <span className="hidden text-[10px] text-[var(--apex-muted)] lg:inline">
        {secondary}
      </span>
      <ChevronDown size={13} className="text-[var(--apex-muted)]" />
    </motion.button>
  );
}
