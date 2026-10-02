"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  PackageX,
  TrendingUp
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart
} from "recharts";

import {
  formatMoney,
  getStockStatus
} from "@/lib/analytics";
import type { Product } from "@/lib/types";
import type { LanguageCode } from "./GlobalPreferences";

type TrendRow = {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
};

type Props = {
  language: LanguageCode;
  products: Product[];
  data: TrendRow[];
  currency: string;
  locale: string;
  revenue: number;
  cost: number;
  profit: number;
  losses: number;
  money: (value: number) => string;
};

const copy: Record<
  LanguageCode,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    revenue: string;
    cost: string;
    profit: string;
    losses: string;
    revenueCostProfit: string;
    stockByProduct: string;
    marginByProduct: string;
    stockHealth: string;
    normal: string;
    low: string;
    out: string;
    units: string;
    products: string;
    inventoryValue: string;
    retailValue: string;
    potentialGross: string;
    avgMargin: string;
    bestDay: string;
    weakestDay: string;
    availablePeriod: string;
  }
> = {
  es: {
    eyebrow: "Analítica avanzada",
    title: "Gráficos",
    subtitle:
      "Ventas, costos, ganancia, inventario y margen en una vista ejecutiva.",
    revenue: "Ingresos",
    cost: "Costos",
    profit: "Ganancia bruta",
    losses: "Pérdidas",
    revenueCostProfit: "Ingresos, costos y ganancia",
    stockByProduct: "Stock por producto",
    marginByProduct: "Margen por producto",
    stockHealth: "Salud del inventario",
    normal: "Normal",
    low: "Bajo",
    out: "Agotado",
    units: "unidades",
    products: "productos",
    inventoryValue: "Costo del inventario",
    retailValue: "Valor potencial de venta",
    potentialGross: "Ganancia bruta potencial",
    avgMargin: "Margen promedio",
    bestDay: "Mejor día",
    weakestDay: "Día más débil",
    availablePeriod: "Período disponible"
  },
  en: {
    eyebrow: "Advanced analytics",
    title: "Charts",
    subtitle:
      "Sales, costs, profit, inventory and margin in an executive view.",
    revenue: "Revenue",
    cost: "Costs",
    profit: "Gross profit",
    losses: "Losses",
    revenueCostProfit: "Revenue, costs and profit",
    stockByProduct: "Stock by product",
    marginByProduct: "Margin by product",
    stockHealth: "Inventory health",
    normal: "Normal",
    low: "Low",
    out: "Out of stock",
    units: "units",
    products: "products",
    inventoryValue: "Inventory cost",
    retailValue: "Potential retail value",
    potentialGross: "Potential gross profit",
    avgMargin: "Average margin",
    bestDay: "Best day",
    weakestDay: "Weakest day",
    availablePeriod: "Available period"
  },
  pt: {
    eyebrow: "Análise avançada",
    title: "Gráficos",
    subtitle:
      "Vendas, custos, lucro, estoque e margem em uma visão executiva.",
    revenue: "Receita",
    cost: "Custos",
    profit: "Lucro bruto",
    losses: "Perdas",
    revenueCostProfit: "Receita, custos e lucro",
    stockByProduct: "Estoque por produto",
    marginByProduct: "Margem por produto",
    stockHealth: "Saúde do estoque",
    normal: "Normal",
    low: "Baixo",
    out: "Esgotado",
    units: "unidades",
    products: "produtos",
    inventoryValue: "Custo do estoque",
    retailValue: "Valor potencial de venda",
    potentialGross: "Lucro bruto potencial",
    avgMargin: "Margem média",
    bestDay: "Melhor dia",
    weakestDay: "Dia mais fraco",
    availablePeriod: "Período disponível"
  },
  fr: {
    eyebrow: "Analyse avancée",
    title: "Graphiques",
    subtitle:
      "Ventes, coûts, bénéfice, stock et marge dans une vue exécutive.",
    revenue: "Revenus",
    cost: "Coûts",
    profit: "Bénéfice brut",
    losses: "Pertes",
    revenueCostProfit: "Revenus, coûts et bénéfice",
    stockByProduct: "Stock par produit",
    marginByProduct: "Marge par produit",
    stockHealth: "Santé du stock",
    normal: "Normal",
    low: "Faible",
    out: "Épuisé",
    units: "unités",
    products: "produits",
    inventoryValue: "Coût du stock",
    retailValue: "Valeur potentielle de vente",
    potentialGross: "Bénéfice brut potentiel",
    avgMargin: "Marge moyenne",
    bestDay: "Meilleur jour",
    weakestDay: "Jour le plus faible",
    availablePeriod: "Période disponible"
  },
  de: {
    eyebrow: "Erweiterte Analyse",
    title: "Diagramme",
    subtitle:
      "Verkäufe, Kosten, Gewinn, Bestand und Marge in einer Managementansicht.",
    revenue: "Umsatz",
    cost: "Kosten",
    profit: "Bruttogewinn",
    losses: "Verluste",
    revenueCostProfit: "Umsatz, Kosten und Gewinn",
    stockByProduct: "Bestand pro Produkt",
    marginByProduct: "Marge pro Produkt",
    stockHealth: "Bestandsstatus",
    normal: "Normal",
    low: "Niedrig",
    out: "Ausverkauft",
    units: "Einheiten",
    products: "Produkte",
    inventoryValue: "Lagerkosten",
    retailValue: "Potenzieller Verkaufswert",
    potentialGross: "Potenzieller Bruttogewinn",
    avgMargin: "Durchschnittsmarge",
    bestDay: "Bester Tag",
    weakestDay: "Schwächster Tag",
    availablePeriod: "Verfügbarer Zeitraum"
  }
};

function tooltipStyle() {
  return {
    borderRadius: 18,
    border: "1px solid var(--apex-border)",
    background: "var(--apex-surface-strong)",
    color: "var(--apex-text)",
    boxShadow: "0 18px 55px rgba(0,0,0,.22)"
  };
}

export function PremiumCharts({
  language,
  products,
  data,
  currency,
  locale,
  revenue,
  cost,
  profit,
  losses,
  money
}: Props) {
  const t = copy[language];

  const stockData = products
    .map((product) => ({
      name: product.name.split(" ").slice(0, 2).join(" "),
      stock: product.stock,
      min: product.minStock
    }))
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 12);

  const costedProducts = products.filter(
    (product) => product.costKnown !== false
  );

  const marginData = costedProducts
    .map((product) => ({
      name: product.name.split(" ").slice(0, 2).join(" "),
      margin:
        product.price > 0
          ? ((product.price - product.cost) / product.price) * 100
          : 0
    }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 12);

  const normal = products.filter(
    (product) => getStockStatus(product) === "normal"
  ).length;
  const low = products.filter(
    (product) => getStockStatus(product) === "low"
  ).length;
  const out = products.filter(
    (product) => getStockStatus(product) === "out"
  ).length;

  const inventoryCost = costedProducts.reduce(
    (sum, product) => sum + product.stock * product.cost,
    0
  );
  const retailValue = products.reduce(
    (sum, product) => sum + product.stock * product.price,
    0
  );
  const costedRetailValue = costedProducts.reduce(
    (sum, product) => sum + product.stock * product.price,
    0
  );
  const potentialGross = costedRetailValue - inventoryCost;
  const totalUnits = products.reduce(
    (sum, product) => sum + product.stock,
    0
  );
  const avgMargin =
    costedProducts.length > 0
      ? costedProducts.reduce((sum, product) => {
          const margin =
            product.price > 0
              ? ((product.price - product.cost) / product.price) * 100
              : 0;
          return sum + margin;
        }, 0) / costedProducts.length
      : 0;

  const bestDay =
    [...data].sort((a, b) => b.profit - a.profit)[0] ?? null;
  const weakestDay =
    [...data].sort((a, b) => a.profit - b.profit)[0] ?? null;

  const donutData = [
    { name: t.normal, value: normal, fill: "#5B5B63" },
    { name: t.low, value: low, fill: "#B10000" },
    { name: t.out, value: out, fill: "#E32626" }
  ];

  const latestPoint = data.at(-1) ?? null;
  const previousPoint = data.at(-2) ?? null;

  const periodDelta = (current?: number, previous?: number) => {
    if (
      current === undefined ||
      previous === undefined ||
      !Number.isFinite(current) ||
      !Number.isFinite(previous) ||
      previous === 0
    ) {
      return null;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const noData =
    language === "es"
      ? "Todavía no hay ventas registradas para graficar."
      : language === "pt"
        ? "Ainda não há vendas registradas para exibir no gráfico."
        : language === "fr"
          ? "Aucune vente enregistrée à afficher pour le moment."
          : language === "de"
            ? "Es sind noch keine Verkäufe für das Diagramm erfasst."
            : "No sales have been recorded for this chart yet.";

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
          {t.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          {t.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
          {t.subtitle}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          icon={<CircleDollarSign size={17} />}
          label={t.revenue}
          value={money(revenue)}
          positive
        />
        <Metric
          icon={<Boxes size={17} />}
          label={t.cost}
          value={money(cost)}
        />
        <Metric
          icon={<TrendingUp size={17} />}
          label={t.profit}
          value={money(profit)}
          positive={profit >= 0}
        />
        <Metric
          icon={<ArrowDownRight size={17} />}
          label={t.losses}
          value={money(losses)}
          positive={losses === 0}
        />
      </section>

      <section className="apex-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
              {t.availablePeriod}
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              {t.revenueCostProfit}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <SmallStat label={t.bestDay} value={bestDay?.label ?? "—"} />
            <SmallStat label={t.weakestDay} value={weakestDay?.label ?? "—"} />
            <SmallStat
              label={t.avgMargin}
              value={costedProducts.length ? `${avgMargin.toFixed(1)}%` : "—"}
            />
            <SmallStat label={t.units} value={products.length ? String(totalUnits) : "—"} />
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <SeriesStat
            label={t.revenue}
            value={latestPoint ? formatMoney(latestPoint.revenue, currency, locale) : "—"}
            change={periodDelta(latestPoint?.revenue, previousPoint?.revenue)}
            markerClass="bg-[#D10A0A]"
          />
          <SeriesStat
            label={t.cost}
            value={latestPoint ? formatMoney(latestPoint.cost, currency, locale) : "—"}
            change={periodDelta(latestPoint?.cost, previousPoint?.cost)}
            markerClass="bg-[#8C8C94]"
          />
          <SeriesStat
            label={t.profit}
            value={latestPoint ? formatMoney(latestPoint.profit, currency, locale) : "—"}
            change={periodDelta(latestPoint?.profit, previousPoint?.profit)}
            markerClass="bg-[var(--apex-text)]"
          />
        </div>

        {data.length ? (
          <div className="mt-4 h-[390px] rounded-[24px] border border-[var(--apex-border)] bg-[linear-gradient(180deg,var(--apex-surface-strong),var(--apex-bg))] p-2 sm:h-[450px] sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ left: 6, right: 12, top: 16, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="premiumRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D10A0A" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#D10A0A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--apex-border)"
                  strokeDasharray="2 9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  stroke="var(--apex-muted)"
                  fontSize={11}
                  tickMargin={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  stroke="var(--apex-muted)"
                  fontSize={9}
                  width={58}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(locale, {
                      notation: "compact",
                      maximumFractionDigits: 1
                    }).format(Number(value))
                  }
                />
                <Tooltip
                  cursor={{
                    stroke: "var(--apex-muted)",
                    strokeOpacity: 0.32,
                    strokeDasharray: "3 6"
                  }}
                  contentStyle={tooltipStyle()}
                  formatter={(value) =>
                    formatMoney(Number(value), currency, locale)
                  }
                  labelStyle={{
                    color: "var(--apex-muted)",
                    fontSize: 11,
                    marginBottom: 6
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="var(--apex-border)"
                  strokeDasharray="3 6"
                />
                <Area
                  type="linear"
                  dataKey="revenue"
                  stroke="none"
                  fill="url(#premiumRevenueFill)"
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="revenue"
                  name={t.revenue}
                  stroke="#D10A0A"
                  strokeWidth={2.6}
                  dot={false}
                  activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--apex-surface-strong)" }}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="cost"
                  name={t.cost}
                  stroke="#8C8C94"
                  strokeWidth={1.55}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 2, stroke: "var(--apex-surface-strong)" }}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="profit"
                  name={t.profit}
                  stroke="var(--apex-text)"
                  strokeWidth={1.9}
                  dot={false}
                  activeDot={{ r: 3.8, strokeWidth: 2, stroke: "var(--apex-surface-strong)" }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 grid min-h-[260px] place-items-center rounded-[24px] border border-dashed border-[var(--apex-border)] bg-[var(--apex-bg)] px-6 text-center text-sm text-[var(--apex-muted)]">
            {noData}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title={t.stockByProduct}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData} margin={{ top: 12 }}>
              <CartesianGrid
                stroke="var(--apex-border)"
                strokeDasharray="2 8"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                stroke="var(--apex-muted)"
                fontSize={9}
              />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle()} />
              <Bar
                dataKey="stock"
                name={t.stockByProduct}
                fill="#8F0000"
                radius={[9, 9, 3, 3]}

                isAnimationActive={false}
              />
              <Bar
                dataKey="min"
                name="Min"
                fill="#55555D"
                radius={[9, 9, 3, 3]}

                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={t.marginByProduct}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marginData} layout="vertical">
              <CartesianGrid
                stroke="var(--apex-border)"
                strokeDasharray="2 8"
                horizontal={false}
              />
              <XAxis hide type="number" />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                width={88}
                stroke="var(--apex-muted)"
                fontSize={9}
              />
              <Tooltip
                contentStyle={tooltipStyle()}
                formatter={(value) => `${Number(value).toFixed(1)}%`}
              />
              <Bar
                dataKey="margin"
                fill="#A50000"
                radius={[0, 9, 9, 0]}

                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <div className="apex-card p-5 sm:p-6">
          <h3 className="text-sm font-semibold">{t.stockHealth}</h3>
          <div className="relative mt-3 h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={88}
                  outerRadius={122}
                  paddingAngle={3}
                  stroke="var(--apex-surface-strong)"
                  strokeWidth={4}
                  cornerRadius={9}
                  isAnimationActive={false}
                >
                  {donutData.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-3xl font-semibold tracking-[-0.05em]">
                  {totalUnits}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--apex-muted)]">
                  {t.units}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {donutData.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: item.fill }}
                />
                <p className="mt-2 text-lg font-semibold">{item.value}</p>
                <p className="mt-0.5 text-[10px] text-[var(--apex-muted)]">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ValueCard
            icon={<Boxes size={18} />}
            label={t.inventoryValue}
            value={money(inventoryCost)}
          />
          <ValueCard
            icon={<PackageCheck size={18} />}
            label={t.retailValue}
            value={money(retailValue)}
          />
          <ValueCard
            icon={<TrendingUp size={18} />}
            label={t.potentialGross}
            value={money(potentialGross)}
          />
          <ValueCard
            icon={<PackageX size={18} />}
            label={t.products}
            value={String(products.length)}
          />
        </div>
      </section>
    </div>
  );
}

function SeriesStat({
  label,
  value,
  change,
  markerClass
}: {
  label: string;
  value: string;
  change: number | null;
  markerClass: string;
}) {
  const positive = change !== null && change > 0;
  const negative = change !== null && change < 0;

  return (
    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-5 rounded-full ${markerClass}`} />
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
          {label}
        </p>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="truncate text-sm font-semibold">{value}</p>
        {change !== null && (
          <span
            className={
              "flex shrink-0 items-center gap-1 text-[10px] font-semibold " +
              (positive
                ? "text-emerald-600"
                : negative
                  ? "text-red-500"
                  : "text-[var(--apex-muted)]")
            }
          >
            {positive ? (
              <ArrowUpRight size={12} />
            ) : negative ? (
              <ArrowDownRight size={12} />
            ) : null}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  positive
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <article className="apex-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
          {icon}
        </span>
        {positive !== undefined && (
          <span
            className={
              "inline-flex items-center gap-1 text-[10px] font-semibold " +
              (positive ? "text-emerald-600" : "text-red-500")
            }
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-semibold text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
        {value}
      </p>
    </article>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--apex-border)] px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold">{value}</p>
    </div>
  );
}

function ChartPanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="apex-card p-5 sm:p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-5 h-[330px]">{children}</div>
    </section>
  );
}

function ValueCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="apex-card flex min-h-[150px] flex-col justify-between p-5">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
        {icon}
      </span>
      <div className="mt-5">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--apex-muted)]">
          {label}
        </p>
        <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
          {value}
        </p>
      </div>
    </article>
  );
}
