"use client";

import { BriefcaseBusiness, Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { LanguageCode } from "./GlobalPreferences";

export type BusinessTypeValue =
  | "retail"
  | "restaurant"
  | "services"
  | "wholesale"
  | "ecommerce"
  | "industry"
  | "other";

const labels: Record<LanguageCode, Record<BusinessTypeValue, string>> = {
  es: {
    retail: "Comercio / retail",
    restaurant: "Restaurante / gastronomía",
    services: "Servicios",
    wholesale: "Mayorista / distribución",
    ecommerce: "Ecommerce",
    industry: "Industria / fabricación",
    other: "Otro"
  },
  en: {
    retail: "Retail",
    restaurant: "Restaurant / hospitality",
    services: "Services",
    wholesale: "Wholesale / distribution",
    ecommerce: "Ecommerce",
    industry: "Industry / manufacturing",
    other: "Other"
  },
  pt: {
    retail: "Comércio / varejo",
    restaurant: "Restaurante / gastronomia",
    services: "Serviços",
    wholesale: "Atacado / distribuição",
    ecommerce: "Ecommerce",
    industry: "Indústria / fabricação",
    other: "Outro"
  },
  fr: {
    retail: "Commerce",
    restaurant: "Restaurant / restauration",
    services: "Services",
    wholesale: "Grossiste / distribution",
    ecommerce: "Ecommerce",
    industry: "Industrie / fabrication",
    other: "Autre"
  },
  de: {
    retail: "Einzelhandel",
    restaurant: "Restaurant / Gastronomie",
    services: "Dienstleistungen",
    wholesale: "Großhandel / Vertrieb",
    ecommerce: "Ecommerce",
    industry: "Industrie / Fertigung",
    other: "Andere"
  }
};

const values: BusinessTypeValue[] = [
  "retail",
  "restaurant",
  "services",
  "wholesale",
  "ecommerce",
  "industry",
  "other"
];

export function BusinessTypePicker({
  language,
  value,
  onChange,
  className = ""
}: {
  language: LanguageCode;
  value: BusinessTypeValue;
  onChange: (value: BusinessTypeValue) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = useMemo(
    () => values.map((id) => ({ id, label: labels[language][id] })),
    [language]
  );
  const selected = options.find((option) => option.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="global-stock-business-type-options"
        onClick={() => setOpen((current) => !current)}
        className="apex-input flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm outline-none transition focus:border-[#8F0000] focus:ring-4 focus:ring-[#8F0000]/10"
      >
        <BriefcaseBusiness size={16} className="shrink-0 text-[#8F0000]" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {selected?.label}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-[var(--apex-muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id="global-stock-business-type-options"
          role="listbox"
          className="apex-scrollbar absolute inset-x-0 top-[calc(100%+8px)] z-[350] max-h-72 overflow-y-auto rounded-[20px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-1.5 shadow-[0_24px_80px_rgba(0,0,0,.34)] backdrop-blur-xl"
        >
          {options.map((option) => {
            const active = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={
                  "flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition " +
                  (active
                    ? "bg-[#8F0000] text-white"
                    : "text-[var(--apex-text)] hover:bg-[var(--apex-bg)]")
                }
              >
                <span className="min-w-0 flex-1">{option.label}</span>
                {active && <Check size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
