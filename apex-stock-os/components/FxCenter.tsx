"use client";

import { ApexSelect } from "@/components/ui/ApexSelect";
import { ArrowLeftRight, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { LanguageCode } from "./GlobalPreferences";

const currencies = [
  "ARS",
  "USD",
  "EUR",
  "BRL",
  "MXN",
  "GBP",
  "JPY"
] as const;

type Currency = (typeof currencies)[number];
type FxMarket = "oficial" | "blue" | "mep" | "ccl" | "tarjeta";

type QuoteResponse = {
  base: Currency;
  target: Currency;
  rate: number;
  provider?: string;
  market?: FxMarket | null;
  quote?: {
    buy?: number | null;
    sell?: number | null;
    currency?: string;
    reference?: string;
  } | null;
  sourceUpdatedAt?: string | null;
  checkedAt?: string;
};

const currencyNames: Record<
  Currency,
  Record<LanguageCode, string>
> = {
  ARS: {
    es: "Peso argentino",
    en: "Argentine peso",
    pt: "Peso argentino",
    fr: "Peso argentin",
    de: "Argentinischer Peso"
  },
  USD: {
    es: "Dólar estadounidense",
    en: "US dollar",
    pt: "Dólar americano",
    fr: "Dollar américain",
    de: "US-Dollar"
  },
  EUR: {
    es: "Euro",
    en: "Euro",
    pt: "Euro",
    fr: "Euro",
    de: "Euro"
  },
  BRL: {
    es: "Real brasileño",
    en: "Brazilian real",
    pt: "Real brasileiro",
    fr: "Réal brésilien",
    de: "Brasilianischer Real"
  },
  MXN: {
    es: "Peso mexicano",
    en: "Mexican peso",
    pt: "Peso mexicano",
    fr: "Peso mexicain",
    de: "Mexikanischer Peso"
  },
  GBP: {
    es: "Libra esterlina",
    en: "British pound",
    pt: "Libra esterlina",
    fr: "Livre sterling",
    de: "Britisches Pfund"
  },
  JPY: {
    es: "Yen japonés",
    en: "Japanese yen",
    pt: "Iene japonês",
    fr: "Yen japonais",
    de: "Japanischer Yen"
  }
};

const copy: Record<
  LanguageCode,
  {
    title: string;
    subtitle: string;
    from: string;
    to: string;
    amount: string;
    result: string;
    swap: string;
    refresh: string;
    updated: string;
    unavailable: string;
    market: string;
    official: string;
    blue: string;
    mep: string;
    ccl: string;
    card: string;
    dolarHoy: string;
    globalProvider: string;
    referenceBuy: string;
    referenceSell: string;
    liveMatrix: string;
    oneUnit: string;
  }
> = {
  es: {
    title: "Centro de cotizaciones",
    subtitle:
      "Convertí cualquier moneda disponible en ambos sentidos. Cuando interviene ARS, Global Stock usa la referencia seleccionada de DolarHoy.",
    from: "Desde",
    to: "Hacia",
    amount: "Importe",
    result: "Resultado",
    swap: "Invertir monedas",
    refresh: "Actualizar",
    updated: "Actualizado",
    unavailable: "Cotización en vivo no disponible.",
    market: "Mercado ARS",
    official: "Oficial",
    blue: "Blue",
    mep: "MEP",
    ccl: "CCL",
    card: "Tarjeta",
    dolarHoy: "Referencia DolarHoy",
    globalProvider: "Mercado internacional",
    referenceBuy: "Compra USD/ARS",
    referenceSell: "Venta USD/ARS",
    liveMatrix: "Cotizaciones desde la moneda base",
    oneUnit: "1 unidad"
  },
  en: {
    title: "Exchange center",
    subtitle:
      "Convert every supported currency in either direction. When ARS is involved, Global Stock uses the selected DolarHoy market reference.",
    from: "From",
    to: "To",
    amount: "Amount",
    result: "Result",
    swap: "Swap currencies",
    refresh: "Refresh",
    updated: "Updated",
    unavailable: "Live rate unavailable.",
    market: "ARS market",
    official: "Official",
    blue: "Blue",
    mep: "MEP",
    ccl: "CCL",
    card: "Card",
    dolarHoy: "DolarHoy reference",
    globalProvider: "International market",
    referenceBuy: "USD/ARS buy",
    referenceSell: "USD/ARS sell",
    liveMatrix: "Rates from base currency",
    oneUnit: "1 unit"
  },
  pt: {
    title: "Centro de cotações",
    subtitle:
      "Converta qualquer moeda disponível nos dois sentidos. Quando ARS participa, o Global Stock usa a referência selecionada do DolarHoy.",
    from: "De",
    to: "Para",
    amount: "Valor",
    result: "Resultado",
    swap: "Inverter moedas",
    refresh: "Atualizar",
    updated: "Atualizado",
    unavailable: "Cotação ao vivo indisponível.",
    market: "Mercado ARS",
    official: "Oficial",
    blue: "Blue",
    mep: "MEP",
    ccl: "CCL",
    card: "Cartão",
    dolarHoy: "Referência DolarHoy",
    globalProvider: "Mercado internacional",
    referenceBuy: "Compra USD/ARS",
    referenceSell: "Venda USD/ARS",
    liveMatrix: "Cotações desde a moeda base",
    oneUnit: "1 unidade"
  },
  fr: {
    title: "Centre de change",
    subtitle:
      "Convertissez chaque devise disponible dans les deux sens. Quand ARS intervient, Global Stock utilise la référence DolarHoy sélectionnée.",
    from: "De",
    to: "Vers",
    amount: "Montant",
    result: "Résultat",
    swap: "Inverser les devises",
    refresh: "Actualiser",
    updated: "Mis à jour",
    unavailable: "Taux en direct indisponible.",
    market: "Marché ARS",
    official: "Officiel",
    blue: "Blue",
    mep: "MEP",
    ccl: "CCL",
    card: "Carte",
    dolarHoy: "Référence DolarHoy",
    globalProvider: "Marché international",
    referenceBuy: "Achat USD/ARS",
    referenceSell: "Vente USD/ARS",
    liveMatrix: "Taux depuis la devise de base",
    oneUnit: "1 unité"
  },
  de: {
    title: "Wechselkurszentrum",
    subtitle:
      "Konvertiere alle unterstützten Währungen in beide Richtungen. Bei ARS verwendet Global Stock die gewählte DolarHoy-Referenz.",
    from: "Von",
    to: "Nach",
    amount: "Betrag",
    result: "Ergebnis",
    swap: "Währungen tauschen",
    refresh: "Aktualisieren",
    updated: "Aktualisiert",
    unavailable: "Live-Kurs nicht verfügbar.",
    market: "ARS-Markt",
    official: "Offiziell",
    blue: "Blue",
    mep: "MEP",
    ccl: "CCL",
    card: "Karte",
    dolarHoy: "DolarHoy-Referenz",
    globalProvider: "Internationaler Markt",
    referenceBuy: "USD/ARS Kauf",
    referenceSell: "USD/ARS Verkauf",
    liveMatrix: "Kurse ab Basiswährung",
    oneUnit: "1 Einheit"
  }
};

function formatNumber(
  value: number,
  currency: Currency,
  locale: string
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function FxCenter({
  language,
  locale,
  defaultCurrency
}: {
  language: LanguageCode;
  locale: string;
  defaultCurrency: string;
}) {
  const t = copy[language];
  const normalizedDefault = currencies.includes(
    defaultCurrency as Currency
  )
    ? (defaultCurrency as Currency)
    : "ARS";

  const [base, setBase] = useState<Currency>(normalizedDefault);
  const [target, setTarget] = useState<Currency>(
    normalizedDefault === "USD" ? "EUR" : "USD"
  );
  const [amount, setAmount] = useState("1");
  const [market, setMarket] = useState<FxMarket>("oficial");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [matrix, setMatrix] = useState<
    Partial<Record<Currency, number>>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const includesArs = base === "ARS" || target === "ARS";
  // Keep unrounded rates in all calculations. Scale visual quotes when a
  // single unit converts to less than one cent to avoid misleading 0.00.
  const quoteUnits = quote && quote.rate > 0 && quote.rate < 0.005 ? 1000 : 1;
  const matrixUnits = Object.values(matrix).some(rate => typeof rate === "number" && rate > 0 && rate < 0.005)
    ? 1000 : 1;
  const unitsLabel = (units: number) => new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0
  }).format(units);
  const numericAmount = Number(amount.replace(",", "."));
  const converted =
    quote &&
    Number.isFinite(numericAmount) &&
    numericAmount >= 0
      ? numericAmount * quote.rate
      : null;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadPair() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/fx?base=${encodeURIComponent(
            base
          )}&target=${encodeURIComponent(
            target
          )}&market=${encodeURIComponent(
            market
          )}&t=${Date.now()}`,
          {
            cache: "no-store",
            signal: controller.signal
          }
        );

        if (!response.ok) throw new Error("rate unavailable");
        const payload = (await response.json()) as QuoteResponse;

        if (!cancelled) setQuote(payload);
      } catch {
        if (!cancelled) {
          setQuote(null);
          setError(t.unavailable);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPair();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [base, target, market, refreshKey, t.unavailable]);

  useEffect(() => {
    let cancelled = false;

    async function loadMatrix() {
      const entries = await Promise.all(
        currencies
          .filter((currency) => currency !== base)
          .map(async (currency) => {
            try {
              const response = await fetch(
                `/api/fx?base=${base}&target=${currency}&market=${market}&t=${Date.now()}`,
                { cache: "no-store" }
              );
              if (!response.ok) return [currency, null] as const;
              const payload = (await response.json()) as QuoteResponse;
              return [currency, Number(payload.rate)] as const;
            } catch {
              return [currency, null] as const;
            }
          })
      );

      if (cancelled) return;

      const next: Partial<Record<Currency, number>> = {
        [base]: 1
      };
      for (const [currency, rate] of entries) {
        if (rate && Number.isFinite(rate)) next[currency] = rate;
      }
      setMatrix(next);
    }

    void loadMatrix();
    return () => {
      cancelled = true;
    };
  }, [base, market, refreshKey]);

  const marketOptions = useMemo(
    () =>
      [
        ["oficial", t.official],
        ["blue", t.blue],
        ["mep", t.mep],
        ["ccl", t.ccl],
        ["tarjeta", t.card]
      ] as Array<[FxMarket, string]>,
    [t]
  );

  function swap() {
    setBase(target);
    setTarget(base);
  }

  return (
    <section className="apex-card overflow-hidden">
      <div className="border-b border-[var(--apex-border)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={17} className="text-[var(--apex-accent)]" />
              <h3 className="text-sm font-semibold">{t.title}</h3>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--apex-muted)]">
              {t.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
            />
            {t.refresh}
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-[1.2fr_.8fr]">
        <div>
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <CurrencySelect
              label={t.from}
              value={base}
              onChange={setBase}
              language={language}
            />

            <button
              type="button"
              onClick={swap}
              className="mb-0 grid h-11 w-11 place-items-center rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-accent)] transition-colors duration-150 hover:bg-[var(--apex-bg)]"
              aria-label={t.swap}
            >
              <ArrowLeftRight size={16} />
            </button>

            <CurrencySelect
              label={t.to}
              value={target}
              onChange={setTarget}
              language={language}
            />
          </div>

          {includesArs && (
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {t.market}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {marketOptions.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMarket(value)}
                    className={
                      "rounded-full border px-3 py-2 text-[10px] font-semibold transition " +
                      (market === value
                        ? "border-[var(--apex-accent)] bg-[var(--apex-accent)] text-white"
                        : "border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-muted)]")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {t.amount}
              </span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                className="apex-input mt-2 px-4 py-3.5 text-lg font-semibold"
              />
            </label>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {t.result}
              </span>
              <div className="mt-2 min-h-[54px] rounded-2xl border border-[var(--apex-accent)] bg-[var(--apex-accent-soft)] px-4 py-3">
                <p className="text-lg font-semibold tracking-[-0.03em]">
                  {converted === null
                    ? "—"
                    : formatNumber(converted, target, locale)}
                </p>
              </div>
            </div>
          </div>

          {quote && (
            <div className="mt-4 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                    {unitsLabel(quoteUnits)} {base}
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {(quote.rate * quoteUnits).toLocaleString(locale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{" "}
                    {target}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--apex-border)] px-3 py-1.5 text-[9px] font-semibold text-[var(--apex-muted)]">
                  {quote.provider === "dolarhoy.com"
                    ? t.dolarHoy
                    : t.globalProvider}
                </span>
              </div>

              {quote.quote && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <SmallRate
                    label={t.referenceBuy}
                    value={
                      quote.quote.buy == null
                        ? "—"
                        : formatNumber(
                            quote.quote.buy,
                            "ARS",
                            locale
                          )
                    }
                  />
                  <SmallRate
                    label={t.referenceSell}
                    value={
                      quote.quote.sell == null
                        ? "—"
                        : formatNumber(
                            quote.quote.sell,
                            "ARS",
                            locale
                          )
                    }
                  />
                </div>
              )}

              {(quote.sourceUpdatedAt || quote.checkedAt) && (
                <p className="mt-3 text-[10px] text-[var(--apex-muted)]">
                  {t.updated}:{" "}
                  {quote.sourceUpdatedAt ||
                    new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(new Date(quote.checkedAt!))}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs font-semibold text-red-500">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4">
          <p className="text-xs font-semibold">{t.liveMatrix}</p>
          <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
            {unitsLabel(matrixUnits)} · {base}
          </p>

          <div className="mt-4 space-y-2">
            {currencies
              .filter((currency) => currency !== base)
              .map((currency) => (
                <div
                  key={currency}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-semibold">{currency}</p>
                    <p className="text-[9px] text-[var(--apex-muted)]">
                      {currencyNames[currency][language]}
                    </p>
                  </div>
                  <strong className="text-xs">
                    {matrix[currency]
                      ? (Number(matrix[currency]) * matrixUnits).toLocaleString(
                          locale,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )
                      : "—"}
                  </strong>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CurrencySelect({
  label,
  value,
  onChange,
  language
}: {
  label: string;
  value: Currency;
  onChange: (currency: Currency) => void;
  language: LanguageCode;
}) {
  return (
    <label>
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
        {label}
      </span>
      <ApexSelect
        value={value}
        onChange={(event) =>
          onChange(event.target.value as Currency)
        }
        className="apex-input mt-2 px-4 py-3 text-sm font-semibold"
      >
        {currencies.map((currency) => (
          <option key={currency} value={currency}>
            {currency} · {currencyNames[currency][language]}
          </option>
        ))}
      </ApexSelect>
    </label>
  );
}

function SmallRate({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-3">
      <p className="text-[9px] uppercase tracking-[0.08em] text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
