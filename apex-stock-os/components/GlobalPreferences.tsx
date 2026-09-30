"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Coins, Globe2, X } from "lucide-react";
import { useMemo, useState } from "react";

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
  label: string;
  native: string;
}> = [
  { code: "es", short: "ES", label: "Español", native: "Español" },
  { code: "en", short: "EN", label: "English", native: "English" },
  { code: "pt", short: "PT", label: "Português", native: "Português" },
  { code: "fr", short: "FR", label: "Français", native: "Français" },
  { code: "de", short: "DE", label: "Deutsch", native: "Deutsch" }
];

const currencies = [
  { code: "ARS", symbol: "$", label: "Peso argentino" },
  { code: "USD", symbol: "US$", label: "Dólar estadounidense" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "BRL", symbol: "R$", label: "Real brasileño" },
  { code: "MXN", symbol: "MX$", label: "Peso mexicano" },
  { code: "GBP", symbol: "£", label: "Libra esterlina" },
  { code: "JPY", symbol: "¥", label: "Yen japonés" }
];

const spring = { type: "spring", stiffness: 320, damping: 30 } as const;

export function GlobalPreferences({
  language,
  currency,
  onLanguageChange,
  onCurrencyChange
}: GlobalPreferencesProps) {
  const [open, setOpen] = useState<"language" | "currency" | null>(null);

  const activeLanguage = useMemo(
    () => languages.find((item) => item.code === language) ?? languages[0],
    [language]
  );

  const activeCurrency = useMemo(
    () => currencies.find((item) => item.code === currency) ?? currencies[0],
    [currency]
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <PreferenceButton
          icon={<Globe2 size={15} />}
          primary={activeLanguage.short}
          secondary={activeLanguage.native}
          onClick={() => setOpen("language")}
          ariaLabel="Cambiar idioma"
        />
        <PreferenceButton
          icon={<Coins size={15} />}
          primary={activeCurrency.code}
          secondary={activeCurrency.symbol}
          onClick={() => setOpen("currency")}
          ariaLabel="Cambiar moneda"
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
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
              className="apex-glass w-full max-w-[460px] rounded-t-[30px] border-x-0 border-b-0 p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:rounded-[30px] sm:border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8F0000]">
                    Preferencias globales
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-[-0.035em]">
                    {open === "language" ? "Idioma" : "Moneda"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]"
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 grid gap-2">
                {(open === "language" ? languages : currencies).map((item) => {
                  const selected =
                    open === "language"
                      ? (item as (typeof languages)[number]).code === language
                      : (item as (typeof currencies)[number]).code === currency;

                  const title =
                    open === "language"
                      ? (item as (typeof languages)[number]).native
                      : (item as (typeof currencies)[number]).code;

                  const subtitle =
                    open === "language"
                      ? (item as (typeof languages)[number]).label
                      : (item as (typeof currencies)[number]).label;

                  const badge =
                    open === "language"
                      ? (item as (typeof languages)[number]).short
                      : (item as (typeof currencies)[number]).symbol;

                  return (
                    <motion.button
                      key={title}
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        if (open === "language") {
                          onLanguageChange(
                            (item as (typeof languages)[number]).code
                          );
                        } else {
                          onCurrencyChange(
                            (item as (typeof currencies)[number]).code
                          );
                        }
                        window.setTimeout(() => setOpen(null), 130);
                      }}
                      className={
                        "flex min-h-[62px] items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition " +
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
                        <span className="block text-sm font-semibold">
                          {title}
                        </span>
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
                })}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
      className="flex h-10 items-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3"
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
