"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  LogOut,
  Moon,
  PackageCheck,
  Search,
  Sun,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  calculateMetrics,
  formatMoney,
  getStockStatus
} from "@/lib/analytics";
import { demoProducts, demoTrend } from "@/lib/demo-data";
import type { BusinessSnapshot, Product, StockStatus } from "@/lib/types";

import { ApexIntelligence } from "./ApexIntelligence";
import { InstallAppButton } from "./InstallAppButton";
import { BarcodeScanner } from "./BarcodeScanner";
import { Logo } from "./Logo";
import { GlobalPreferences, type LanguageCode } from "./GlobalPreferences";

type DashboardProps = {
  dark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
};

type Language = LanguageCode;
type Period = "daily" | "weekly" | "monthly" | "annual";
type StatusFilter = "all" | StockStatus;

const currencies = ["ARS", "USD", "EUR", "BRL", "MXN", "GBP", "JPY"];

const copy: Record<
  Language,
  {
    overview: string;
    subtitle: string;
    revenue: string;
    inventoryCost: string;
    profit: string;
    margin: string;
    inventory: string;
    analytics: string;
    flow: string;
    comparison: string;
    comparisonTitle: string;
    stock: string;
    liveInventory: string;
    search: string;
    scanner: string;
    series: string;
    units: string;
    all: string;
    normal: string;
    low: string;
    out: string;
  }
> = {
  es: {
    overview: "Centro de control",
    subtitle: "Inventario, rentabilidad y decisiones operativas sincronizadas.",
    revenue: "Ingresos",
    inventoryCost: "Costo de inventario",
    profit: "Ganancia bruta",
    margin: "Margen",
    inventory: "Inventario",
    analytics: "Pérdidas y ganancias",
    flow: "{labels.flow}",
    comparison: "Ingresos vs costos",
    comparisonTitle: "{labels.comparisonTitle}",
    stock: "Stock operativo",
    liveInventory: "{labels.liveInventory}",
    search: "Buscar producto, categoría o proveedor",
    scanner: "Captura de inventario",
    series: "Serie visible",
    units: "unidades",
    all: "Todos",
    normal: "Normal",
    low: "Bajo",
    out: "Agotado"
  },
  en: {
    overview: "Control center",
    subtitle: "Inventory, profitability and operational decisions in sync.",
    revenue: "Revenue",
    inventoryCost: "Inventory cost",
    profit: "Gross profit",
    margin: "Margin",
    inventory: "Inventory",
    analytics: "Profit & loss",
    flow: "Operating flow",
    comparison: "{labels.comparison}s",
    comparisonTitle: "Revenue and costs",
    stock: "Operational stock",
    liveInventory: "Live inventory",
    search: "Search product, category or supplier",
    scanner: "Inventory capture",
    series: "Visible range",
    units: "units",
    all: "All",
    normal: "Normal",
    low: "Low",
    out: "Out of stock"
  },
  pt: {
    overview: "Centro de controle",
    subtitle: "Estoque, rentabilidade e decisões operacionais sincronizadas.",
    revenue: "Receita",
    inventoryCost: "Custo do estoque",
    profit: "Lucro bruto",
    margin: "Margem",
    inventory: "Estoque",
    analytics: "Perdas e ganhos",
    flow: "Fluxo operacional",
    comparison: "Receita vs custos",
    comparisonTitle: "Receita e custos",
    stock: "Estoque operacional",
    liveInventory: "Estoque ao vivo",
    search: "Buscar produto, categoria ou fornecedor",
    scanner: "Captura de estoque",
    series: "Período visível",
    units: "unidades",
    all: "Todos",
    normal: "Normal",
    low: "Baixo",
    out: "Esgotado"
  },
  fr: {
    overview: "Centre de contrôle",
    subtitle: "Inventaire, rentabilité et décisions opérationnelles synchronisées.",
    revenue: "Revenus",
    inventoryCost: "Coût du stock",
    profit: "Marge brute",
    margin: "Marge",
    inventory: "Inventaire",
    analytics: "Pertes et profits",
    flow: "Flux opérationnel",
    comparison: "Revenus vs coûts",
    comparisonTitle: "Revenus et coûts",
    stock: "Stock opérationnel",
    liveInventory: "Inventaire en direct",
    search: "Rechercher produit, catégorie ou fournisseur",
    scanner: "Capture d'inventaire",
    series: "Période visible",
    units: "unités",
    all: "Tous",
    normal: "Normal",
    low: "Faible",
    out: "Épuisé"
  },
  de: {
    overview: "Kontrollzentrum",
    subtitle: "Bestand, Rentabilität und operative Entscheidungen synchronisiert.",
    revenue: "Umsatz",
    inventoryCost: "Lagerkosten",
    profit: "Bruttogewinn",
    margin: "Marge",
    inventory: "Bestand",
    analytics: "Gewinn und Verlust",
    flow: "Operativer Verlauf",
    comparison: "Umsatz vs Kosten",
    comparisonTitle: "Umsatz und Kosten",
    stock: "Operativer Bestand",
    liveInventory: "Live-Bestand",
    search: "Produkt, Kategorie oder Lieferant suchen",
    scanner: "Bestandserfassung",
    series: "Sichtbarer Zeitraum",
    units: "Einheiten",
    all: "Alle",
    normal: "Normal",
    low: "Niedrig",
    out: "Ausverkauft"
  }
};

const localeByLanguage: Record<Language, string> = {
  es: "es-AR",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE"
};

const periodLabels: Record<Language, Record<Period, string>> = {
  es: { daily: "Diario", weekly: "Semanal", monthly: "Mensual", annual: "Anual" },
  en: { daily: "Daily", weekly: "Weekly", monthly: "Monthly", annual: "Annual" },
  pt: { daily: "Diário", weekly: "Semanal", monthly: "Mensal", annual: "Anual" },
  fr: { daily: "Quotidien", weekly: "Hebdo", monthly: "Mensuel", annual: "Annuel" },
  de: { daily: "Täglich", weekly: "Wöchentlich", monthly: "Monatlich", annual: "Jährlich" }
};

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;

export function Dashboard({
  dark,
  onToggleTheme,
  onSignOut
}: DashboardProps) {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [storageReady, setStorageReady] = useState(false);
  const [currency, setCurrency] = useState("ARS");
  const [currencyRate, setCurrencyRate] = useState(1);
  const [language, setLanguage] = useState<Language>("es");
  const [period, setPeriod] = useState<Period>("daily");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const labels = copy[language];
  const locale = localeByLanguage[language];

  useEffect(() => {
    try {
      const savedProducts = window.localStorage.getItem(
        "global-stock-demo-products-v1"
      );
      const savedCurrency = window.localStorage.getItem(
        "global-stock-demo-currency"
      );
      const savedLanguage = window.localStorage.getItem(
        "global-stock-demo-language"
      );

      if (savedProducts) {
        const parsed = JSON.parse(savedProducts) as Product[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      }

      if (savedCurrency && currencies.includes(savedCurrency)) {
        setCurrency(savedCurrency);
      }

      if (
        savedLanguage &&
        ["es", "en", "pt", "fr", "de"].includes(savedLanguage)
      ) {
        setLanguage(savedLanguage as Language);
      }
    } catch {
      // Invalid local demo data is ignored and the bundled sample is retained.
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(
      "global-stock-demo-products-v1",
      JSON.stringify(products)
    );
  }, [products, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("global-stock-demo-currency", currency);
    window.localStorage.setItem("global-stock-demo-language", language);
  }, [currency, language, storageReady]);

  useEffect(() => {
    let cancelled = false;

    async function loadRate() {
      try {
        const response = await fetch(
          `/api/fx?target=${encodeURIComponent(currency)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as { rate?: number };
        const rate = Number(payload.rate);
        if (!cancelled && Number.isFinite(rate) && rate > 0) {
          setCurrencyRate(rate);
        }
      } catch {
        if (!cancelled && currency === "ARS") setCurrencyRate(1);
      }
    }

    void loadRate();
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const snapshot: BusinessSnapshot = useMemo(
    () => ({
      products,
      trend: demoTrend,
      currency,
      currencyRate,
      locale
    }),
    [products, currency, currencyRate, locale]
  );

  const metrics = useMemo(() => calculateMetrics(snapshot), [snapshot]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return products.filter((product) => {
      const status = getStockStatus(product);
      const matchesStatus =
        statusFilter === "all" || statusFilter === status;
      const matchesQuery =
        !normalized ||
        [product.name, product.category, product.supplier, product.barcode]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchesStatus && matchesQuery;
    });
  }, [products, query, statusFilter]);

  const chartData = useMemo(
    () =>
      demoTrend.map((point) => ({
        ...point,
        revenue: point.revenue * currencyRate,
        cost: point.cost * currencyRate,
        profit: point.profit * currencyRate
      })),
    [currencyRate]
  );

  const money = (value: number) =>
    formatMoney(value * currencyRate, currency, locale);

  function updateStock(productId: string, nextStock: number) {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, Math.round(nextStock)) }
          : product
      )
    );
  }

  function integrateScannedProduct(scanned: Product) {
    setProducts((current) => {
      const exists = current.some(
        (product) => product.barcode === scanned.barcode
      );
      if (exists) {
        return current.map((product) =>
          product.barcode === scanned.barcode
            ? { ...product, ...scanned }
            : product
        );
      }
      return [scanned, ...current];
    });
  }

  return (
    <main className="min-h-screen bg-[var(--apex-bg)] text-[var(--apex-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--apex-border)] bg-[var(--apex-surface)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Logo withWordmark />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <InstallAppButton />
            <GlobalPreferences
              language={language}
              currency={currency}
              onLanguageChange={setLanguage}
              onCurrencyChange={setCurrency}
            />

            <button
              onClick={onToggleTheme}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] transition hover:scale-[1.02]"
              aria-label="Cambiar tema"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={onSignOut}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-muted)] transition hover:scale-[1.02] hover:text-[var(--apex-text)]"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
              Global Stock
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {labels.overview}
            </h1>
            <p className="mt-2 text-sm text-[var(--apex-muted)]">
              {labels.subtitle}
            </p>
          </div>

          <div className="inline-flex self-start rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-1 sm:self-auto">
            {(Object.keys(periodLabels[language]) as Period[]).map((item) => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className="relative rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {period === item && (
                  <motion.span
                    layoutId="period"
                    transition={spring}
                    className="absolute inset-0 rounded-xl bg-[#8F0000]"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    period === item
                      ? "text-white"
                      : "text-[var(--apex-muted)]"
                  }`}
                >
                  {periodLabels[language][item]}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<CircleDollarSign size={19} />}
            label={labels.revenue}
            value={money(metrics.revenue)}
            detail={labels.series}
          />
          <MetricCard
            icon={<WalletCards size={19} />}
            label={labels.inventoryCost}
            value={money(metrics.inventoryCost)}
            detail={`${metrics.inventoryUnits} unidades`}
          />
          <MetricCard
            icon={<TrendingUp size={19} />}
            label={labels.profit}
            value={money(metrics.grossProfit)}
            detail={`${metrics.marginPct.toFixed(1)}% ${labels.margin.toLowerCase()}`}
          />
          <MetricCard
            icon={<AlertTriangle size={19} />}
            label={labels.inventory}
            value={String(metrics.lowStockCount + metrics.outOfStockCount)}
            detail={`${metrics.lowStockCount} bajos · ${metrics.outOfStockCount} agotados`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <div className="apex-card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8F0000]">
                  {labels.analytics}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                  Flujo operativo
                </h2>
              </div>
              <span className="rounded-full border border-[var(--apex-border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--apex-muted)]">
                {periodLabels[language][period]}
              </span>
            </div>

            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8F0000" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#8F0000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--apex-border)"
                    strokeDasharray="4 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--apex-muted)"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    width={46}
                    stroke="var(--apex-muted)"
                    tickFormatter={(value) =>
                      new Intl.NumberFormat(locale, {
                        notation: "compact",
                        maximumFractionDigits: 1
                      }).format(Number(value))
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid var(--apex-border)",
                      background: "var(--apex-surface-strong)",
                      color: "var(--apex-text)"
                    }}
                    formatter={(value) =>
                      formatMoney(Number(value), currency, locale)
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#8F0000"
                    strokeWidth={2.5}
                    fill="url(#profitFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="apex-card p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8F0000]">
                Revenue vs cost
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                Ingresos y costos
              </h2>
            </div>

            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    stroke="var(--apex-border)"
                    strokeDasharray="4 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--apex-muted)"
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid var(--apex-border)",
                      background: "var(--apex-surface-strong)",
                      color: "var(--apex-text)"
                    }}
                    formatter={(value) =>
                      formatMoney(Number(value), currency, locale)
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#8F0000"
                    radius={[8, 8, 3, 3]}
                  />
                  <Bar
                    dataKey="cost"
                    fill={dark ? "#55555A" : "#C7C7CC"}
                    radius={[8, 8, 3, 3]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="apex-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[var(--apex-border)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8F0000]">
                {labels.stock}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                Inventario en vivo
              </h2>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-[260px]">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--apex-muted)]"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="apex-input py-2.5 pl-10 pr-3 text-xs"
                  placeholder={labels.search}
                />
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2.5 text-xs font-semibold outline-none"
              >
                <option value="all">{labels.all}</option>
                <option value="normal">{labels.normal}</option>
                <option value="low">{labels.low}</option>
                <option value="out">{labels.out}</option>
              </select>
            </div>
          </div>

          <div className="apex-scrollbar overflow-x-auto">
            <table className="min-w-[880px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--apex-border)] text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--apex-muted)]">
                  <th className="px-5 py-3.5 sm:px-6">Producto</th>
                  <th className="px-4 py-3.5">Categoría</th>
                  <th className="px-4 py-3.5">Proveedor</th>
                  <th className="px-4 py-3.5">Costo</th>
                  <th className="px-4 py-3.5">Precio</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-[var(--apex-border)] last:border-0"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]">
                            <Boxes size={16} />
                          </span>
                          <div>
                            <div className="text-sm font-semibold">
                              {product.name}
                            </div>
                            <div className="mt-1 text-[10px] text-[var(--apex-muted)]">
                              {product.barcode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-[var(--apex-muted)]">
                        {product.category}
                      </td>
                      <td className="px-4 py-4 text-xs text-[var(--apex-muted)]">
                        {product.supplier}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold">
                        {money(product.cost)}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold">
                        {money(product.price)}
                      </td>
                      <td className="px-4 py-4">
                        <input
                          aria-label={`Stock de ${product.name}`}
                          type="number"
                          min={0}
                          value={product.stock}
                          onChange={(event) =>
                            updateStock(product.id, Number(event.target.value))
                          }
                          className="apex-input w-20 px-3 py-2 text-xs font-semibold"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <StockBadge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8F0000]">
            <PackageCheck size={15} />
            {labels.scanner}
          </div>
          <BarcodeScanner onProduct={integrateScannedProduct} />
        </div>
      </div>

      <ApexIntelligence snapshot={snapshot} />
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <motion.article
      whileHover={{ y: -2, scale: 1.01 }}
      transition={spring}
      className="apex-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
          {icon}
        </span>
        <span className="text-[10px] font-semibold text-[var(--apex-muted)]">
          LIVE
        </span>
      </div>
      <p className="mt-5 text-xs font-semibold text-[var(--apex-muted)]">
        {label}
      </p>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {value}
      </div>
      <p className="mt-2 text-[11px] text-[var(--apex-muted)]">{detail}</p>
    </motion.article>
  );
}

function StockBadge({ status }: { status: StockStatus }) {
  const config = {
    normal: {
      label: "Normal",
      className: "bg-emerald-500/10 text-emerald-600"
    },
    low: {
      label: "Bajo",
      className: "bg-amber-500/10 text-amber-600"
    },
    out: {
      label: "Agotado",
      className: "bg-red-500/10 text-red-600"
    }
  }[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
