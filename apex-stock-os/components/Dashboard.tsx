"use client";

import { motion } from "framer-motion";
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
import { BarcodeScanner } from "./BarcodeScanner";
import { Logo } from "./Logo";

type DashboardProps = {
  dark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
};

type Language = "es" | "en" | "pt" | "fr" | "de";
type Period = "daily" | "weekly" | "monthly" | "annual";
type StatusFilter = "all" | StockStatus;

const currencies = ["ARS", "USD", "EUR", "BRL", "MXN", "GBP", "JPY"];

const copy: Record<
  Language,
  {
    overview: string;
    revenue: string;
    inventoryCost: string;
    profit: string;
    margin: string;
    inventory: string;
    analytics: string;
    stock: string;
    search: string;
    scanner: string;
  }
> = {
  es: {
    overview: "Centro de control",
    revenue: "Ingresos",
    inventoryCost: "Costo de inventario",
    profit: "Ganancia bruta",
    margin: "Margen",
    inventory: "Inventario",
    analytics: "Pérdidas y ganancias",
    stock: "Stock operativo",
    search: "Buscar producto, categoría o proveedor",
    scanner: "Captura de inventario"
  },
  en: {
    overview: "Control center",
    revenue: "Revenue",
    inventoryCost: "Inventory cost",
    profit: "Gross profit",
    margin: "Margin",
    inventory: "Inventory",
    analytics: "Profit & loss",
    stock: "Operational stock",
    search: "Search product, category or supplier",
    scanner: "Inventory capture"
  },
  pt: {
    overview: "Centro de controle",
    revenue: "Receita",
    inventoryCost: "Custo do estoque",
    profit: "Lucro bruto",
    margin: "Margem",
    inventory: "Estoque",
    analytics: "Perdas e ganhos",
    stock: "Estoque operacional",
    search: "Buscar produto, categoria ou fornecedor",
    scanner: "Captura de estoque"
  },
  fr: {
    overview: "Centre de contrôle",
    revenue: "Revenus",
    inventoryCost: "Coût du stock",
    profit: "Marge brute",
    margin: "Marge",
    inventory: "Inventaire",
    analytics: "Pertes et profits",
    stock: "Stock opérationnel",
    search: "Rechercher produit, catégorie ou fournisseur",
    scanner: "Capture d'inventaire"
  },
  de: {
    overview: "Kontrollzentrum",
    revenue: "Umsatz",
    inventoryCost: "Lagerkosten",
    profit: "Bruttogewinn",
    margin: "Marge",
    inventory: "Bestand",
    analytics: "Gewinn und Verlust",
    stock: "Operativer Bestand",
    search: "Produkt, Kategorie oder Lieferant suchen",
    scanner: "Bestandserfassung"
  }
};

const localeByLanguage: Record<Language, string> = {
  es: "es-AR",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE"
};

const periodLabels: Record<Period, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  annual: "Anual"
};

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;

export function Dashboard({
  dark,
  onToggleTheme,
  onSignOut
}: DashboardProps) {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [currency, setCurrency] = useState("ARS");
  const [currencyRate, setCurrencyRate] = useState(1);
  const [language, setLanguage] = useState<Language>("es");
  const [period, setPeriod] = useState<Period>("daily");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const labels = copy[language];
  const locale = localeByLanguage[language];

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
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Logo withWordmark />

          <div className="flex items-center gap-2">
            <select
              aria-label="Idioma"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2 text-xs font-semibold outline-none"
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
              <option value="pt">PT</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
            </select>

            <select
              aria-label="Moneda"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2 text-xs font-semibold outline-none"
            >
              {currencies.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

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
              Apex Stock OS
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {labels.overview}
            </h1>
            <p className="mt-2 text-sm text-[var(--apex-muted)]">
              Inventario, P&amp;L y decisiones operativas sincronizadas.
            </p>
          </div>

          <div className="inline-flex self-start rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-1 sm:self-auto">
            {(Object.keys(periodLabels) as Period[]).map((item) => (
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
                  {periodLabels[item]}
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
            detail="Serie visible"
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
                {periodLabels[period]}
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
                <option value="all">Todos</option>
                <option value="normal">Normal</option>
                <option value="low">Bajo</option>
                <option value="out">Agotado</option>
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
