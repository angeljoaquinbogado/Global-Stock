"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { WorkspaceAccent } from "@/lib/workspace-accent";
import "./animated-home-dashboard.css";
import "./premium-charts.css";

import {
  Sparkles,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  PackageX,
  TrendingUp
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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
  dark: boolean;
  accent: WorkspaceAccent;
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
  money,
  dark,
  accent
}: Props) {
  const reduced = useReducedMotion();
  const t = copy[language];
  const [visibleSeries, setVisibleSeries] = useState({ revenue: true, cost: true, profit: true });
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

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
    { name: t.normal, value: normal, fill: "var(--home-accent)" },
    { name: t.low, value: low, fill: "#d9a34c" },
    { name: t.out, value: out, fill: "#df5555" }
  ];

  const totalRevenueInPeriod = data.reduce((sum, row) => sum + row.revenue, 0);
  const totalProfitInPeriod = data.reduce((sum, row) => sum + row.profit, 0);
  const activeDays = data.filter(row => row.revenue > 0).length;
  const dailyAverage = activeDays ? totalRevenueInPeriod / activeDays : 0;
  const periodMargin = totalRevenueInPeriod > 0 ? totalProfitInPeriod / totalRevenueInPeriod * 100 : 0;
  const countReorder = low + out;
  const pct = (n: number) => new Intl.NumberFormat(locale, {maximumFractionDigits: 1}).format(n) + "%";

  const latestPoint = data.at(-1) ?? null;
  const previousPoint = data.at(-2) ?? null;
  const focused = data[focusIndex ?? -1] ?? latestPoint;
  const focusedIndex = focusIndex !== null && data[focusIndex] ? focusIndex : Math.max(0, data.length - 1);
  const focusMargin = focused && focused.revenue > 0 ? focused.profit / focused.revenue * 100 : null;

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

  const focusChange = focusedIndex > 0 ? periodDelta(data[focusedIndex]?.revenue, data[focusedIndex - 1]?.revenue) : null;

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
    <section className="gs-exec-dashboard gs-an-premium" data-testid="premium-charts" data-theme={dark ? "dark" : "light"} data-accent={accent}>
      <motion.header className="gs-exec-header gs-an-header" initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .5, ease: [.22, 1, .36, 1] }}>
        <div className="gs-exec-header__copy">
        <p className="gs-exec-overline"><Sparkles size={13} aria-hidden="true" />
          {t.eyebrow}
        </p>
        <h2>{t.title}<span className="gs-exec-heading-mark">.</span></h2>
        <p>{t.subtitle}</p>
        </div>
        <span className="gs-exec-period"><BarChart3 size={14} />{t.availablePeriod}</span>
      </motion.header>

      <div className="gs-exec-metrics gs-an-metrics">
        <Metric icon={<CircleDollarSign size={17} />}
          label={language === "es" ? "Ingreso diario promedio" : language === "pt" ? "Receita média diária" : "Average daily revenue"}
          amount={dailyAverage} format={money} positive />
        <Metric icon={<TrendingUp size={17} />}
          label={language === "es" ? "Margen del período" : language === "pt" ? "Margem do período" : "Period margin"}
          amount={periodMargin} format={pct} positive={periodMargin >= 0} />
        <Metric icon={<Boxes size={17} />}
          label={t.inventoryValue}
          amount={inventoryCost} format={money} />
        <Metric icon={<PackageX size={17} />}
          label={language === "es" ? "Productos por reponer" : language === "pt" ? "Produtos a repor" : "Products to restock"}
          amount={countReorder} format={(v:number) => new Intl.NumberFormat(locale,{maximumFractionDigits:0}).format(Math.round(v))} positive={countReorder===0} />
      </div>

      <motion.section className="gs-exec-panel gs-an-finance" initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .52, delay: reduced ? 0 : .19, ease: [.22, 1, .36, 1] }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="gs-exec-overline">
              {t.availablePeriod}
            </p>
            <h3 className="gs-an-title">
              {t.revenueCostProfit}
            </h3>
          </div>
          <div className="gs-an-small-stats">
            <SmallStat label={t.bestDay} value={bestDay?.label ?? "—"} />
            <SmallStat label={t.weakestDay} value={weakestDay?.label ?? "—"} />
            <SmallStat
              label={t.avgMargin}
              value={costedProducts.length ? `${avgMargin.toFixed(1)}%` : "—"}
            />
            <SmallStat label={t.units} value={products.length ? String(totalUnits) : "—"} />
          </div>
        </div>

        <div className="gs-an-series-stats">
          <SeriesStat
            label={t.revenue}
            value={latestPoint ? formatMoney(latestPoint.revenue, currency, locale) : "—"}
            change={periodDelta(latestPoint?.revenue, previousPoint?.revenue)}
            markerClass="gs-an-marker--accent"
          />
          <SeriesStat
            label={t.cost}
            value={latestPoint ? formatMoney(latestPoint.cost, currency, locale) : "—"}
            change={periodDelta(latestPoint?.cost, previousPoint?.cost)}
            markerClass="gs-an-marker--muted"
          />
          <SeriesStat
            label={t.profit}
            value={latestPoint ? formatMoney(latestPoint.profit, currency, locale) : "—"}
            change={periodDelta(latestPoint?.profit, previousPoint?.profit)}
            markerClass="gs-an-marker--text"
          />
        </div>

        <div className="gs-an-legend" role="group" aria-label={language === "es" ? "Mostrar u ocultar series del gráfico" : "Show or hide chart series"}>
          {([
            {key:"revenue" as const,label:t.revenue},
            {key:"cost" as const,label:t.cost},
            {key:"profit" as const,label:t.profit}
          ]).map(series => (
            <button key={series.key} type="button"
              aria-pressed={visibleSeries[series.key]}
              onClick={() => setVisibleSeries(current => {
                if(current[series.key] && Object.values(current).filter(Boolean).length === 1) return current;
                return {...current, [series.key]: !current[series.key]};
              })}
              className={"gs-an-legend__item gs-an-legend__item--" + series.key + (visibleSeries[series.key] ? " is-visible" : "")}>
              <span className="gs-an-legend__mark" aria-hidden="true" />
              {series.label}
            </button>
          ))}
        </div>

        {data.length ? (
          <div className="gs-an-chart-dashboard">
            <div className="gs-an-chart-toolbar">
              <div className="gs-an-chart-toolbar__copy">
                <strong>{language === "es" ? "Comparación diaria" : language === "pt" ? "Comparação diária" : language === "fr" ? "Comparaison quotidienne" : language === "de" ? "Tagesvergleich" : "Daily comparison"}</strong>
                <span>{language === "es" ? "Dos columnas para ingresos y costos; una línea para la ganancia." : language === "pt" ? "Duas colunas para receitas e custos; uma linha para o lucro." : language === "fr" ? "Deux colonnes pour revenus et coûts ; une ligne pour le bénéfice." : language === "de" ? "Zwei Säulen für Einnahmen und Kosten, eine Linie für den Gewinn." : "Revenue and cost columns with a profit line."}</span>
              </div>
            </div>
            <div className="gs-an-chart-spotlight">
              <div className="gs-an-chart-spotlight__hero">
                <span>{focused?.label ?? "—"} · {t.revenue}</span>
                <strong>{focused ? money(focused.revenue) : "—"}</strong>
                {focusChange !== null && <em className={focusChange >= 0 ? "is-positive" : "is-negative"}>{focusChange >= 0 ? "+" : ""}{focusChange.toFixed(1)}% {language === "es" ? "vs. período anterior" : "vs previous point"}</em>}
              </div>
              <div><span>{t.cost}</span><strong>{focused ? money(focused.cost) : "—"}</strong></div>
              <div><span>{t.profit}</span><strong>{focused ? money(focused.profit) : "—"}</strong></div>
              <div><span>{t.avgMargin}</span><strong>{focusMargin === null ? "—" : pct(focusMargin)}</strong></div>
            </div>
          <div className="gs-an-chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                barGap={5}
                barCategoryGap="28%"
                onMouseMove={(state: {activeTooltipIndex?: number | string}) => { const i = Number(state?.activeTooltipIndex); if (Number.isInteger(i) && i >= 0 && i < data.length) setFocusIndex(i); }}
                onClick={(state: {activeTooltipIndex?: number | string}) => { const i = Number(state?.activeTooltipIndex); if (Number.isInteger(i) && i >= 0 && i < data.length) setFocusIndex(i); }}
                margin={{ left: 6, right: 12, top: 16, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="var(--home-border)"
                  strokeOpacity={0.6}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  stroke="var(--home-muted)"
                  fontSize={11}
                  tickMargin={16}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  stroke="var(--home-muted)"
                  fontSize={10}
                  width={58}
                  tickMargin={9}
                  tickCount={5}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(locale, {
                      notation: "compact",
                      maximumFractionDigits: 1
                    }).format(Number(value))
                  }
                />
                <Tooltip
                  animationDuration={130}
                  cursor={{
                    stroke: "var(--home-border)",
                    strokeOpacity: 0.8,
                    strokeWidth: 1
                  }}
                  content={({active,label})=>{
                    const point=active ? data.find(row=>row.label===label) : null;
                    if(!point)return null;
                    const margin=point.revenue>0?point.profit/point.revenue*100:null;
                    return <div className="gs-an-finance-tooltip">
                      <span className="gs-an-finance-tooltip__day">{point.label}</span>
                      <div><i className="gs-an-finance-tooltip__dot gs-an-finance-tooltip__dot--revenue"/><span>{t.revenue}</span><strong>{money(point.revenue)}</strong></div>
                      <div><i className="gs-an-finance-tooltip__dot gs-an-finance-tooltip__dot--cost"/><span>{t.cost}</span><strong>{money(point.cost)}</strong></div>
                      <div><i className="gs-an-finance-tooltip__dot gs-an-finance-tooltip__dot--profit"/><span>{t.profit}</span><strong>{money(point.profit)}</strong></div>
                      <div className="gs-an-finance-tooltip__margin"><span>{t.avgMargin}</span><strong>{margin===null?"—":pct(margin)}</strong></div>
                    </div>;
                  }}
                />
                {visibleSeries.revenue && (
                  <Bar
                    dataKey="revenue"
                    name={t.revenue}
                    fill="var(--home-accent)"
                    maxBarSize={31}
                    radius={[3,3,0,0]}
                    isAnimationActive={!reduced}
                    animationDuration={720}
                  />
                )}
                {visibleSeries.cost && (
                  <Bar
                    dataKey="cost"
                    name={t.cost}
                    fill="var(--home-text)"
                    fillOpacity={.85}
                    maxBarSize={31}
                    radius={[3,3,0,0]}
                    isAnimationActive={!reduced}
                    animationDuration={790}
                  />
                )}
                {visibleSeries.profit && (
                  <Line
                    type="linear"
                    dataKey="profit"
                    name={t.profit}
                    stroke="var(--gs-an-profit-ink)"
                    strokeWidth={2.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    activeDot={{
                      r:5.5,
                      stroke:"var(--home-card)",
                      strokeWidth:2.5,
                      fill:"var(--gs-an-profit-ink)"
                    }}
                    isAnimationActive={!reduced}
                    animationDuration={880}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          </div>
        ) : (
          <div className="mt-4 grid min-h-[260px] place-items-center rounded-[24px] border border-dashed border-[var(--apex-border)] bg-[var(--apex-bg)] px-6 text-center text-sm text-[var(--apex-muted)]">
            {noData}
          </div>
        )}
      </motion.section>

      <div className="gs-an-split-grid">
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
                fill="var(--home-accent)"
                radius={[9, 9, 3, 3]}

                isAnimationActive={!reduced}
                animationDuration={850}
              />
              <Bar
                dataKey="min"
                name="Min"
                fill="var(--home-muted)"
                radius={[9, 9, 3, 3]}

                isAnimationActive={!reduced}
                animationDuration={850}
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
                fill="var(--home-accent)"
                radius={[0, 9, 9, 0]}

                isAnimationActive={!reduced}
                animationDuration={850}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="gs-an-bottom-grid">
        <motion.div className="gs-exec-panel gs-an-health" initial={{opacity:0,y:15}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.15}} transition={{duration:.48}}>
          <div className="gs-exec-panel__heading"><h3>{t.stockHealth}</h3></div>
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
                  isAnimationActive={!reduced}
                animationDuration={850}
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
        </motion.div>

        <div className="gs-an-values">
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
      </div>
    </section>
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
    <div className="gs-an-series-stat">
      <div className="flex items-center gap-2">
        <span className={`gs-an-marker ${markerClass}`} />
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

function CountUp({amount,format}:{
  amount:number;format:(value:number)=>string;
}) {
  const reduced=useReducedMotion();
  const [display,setDisplay]=useState(reduced?amount:0);
  useEffect(()=>{
    if(reduced)return;
    let request=0;
    let start:number|null=null;
    function frame(now:number) {
      if(start===null)start=now;
      const progress=Math.min(1,(now-start)/820);
      setDisplay(amount*(1-Math.pow(1-progress,3)));
      if(progress<1)request=window.requestAnimationFrame(frame);
    }
    request=window.requestAnimationFrame(frame);
    return ()=>window.cancelAnimationFrame(request);
  },[amount,reduced]);
  return <span className="gs-exec-figure">{format(reduced?amount:display)}</span>;
}

function Metric({icon,label,amount,format,positive}:{
  icon:React.ReactNode;label:string;amount:number;
  format:(value:number)=>string;positive?:boolean;
}) {
  const reduced=useReducedMotion();
  return <motion.div initial={reduced?false:{opacity:0,y:19,scale:.985}}
    animate={{opacity:1,y:0,scale:1}}
    transition={{duration:reduced?0:.52,ease:[.22,1,.36,1]}}>
    <article className="gs-exec-kpi gs-an-kpi">
      <div className="gs-exec-kpi__top">
        <span className="gs-exec-kpi__icon">{icon}</span>
        {positive===false?<ArrowDownRight size={15} className="gs-exec-kpi__corner" aria-hidden="true"/>:
          <ArrowUpRight size={15} className="gs-exec-kpi__corner" aria-hidden="true"/>}
      </div>
      <p className="gs-exec-kpi__label">{label}</p>
      <CountUp amount={amount} format={format}/>
    </article>
  </motion.div>;
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="gs-an-small-stat">
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
    <motion.section className="gs-exec-panel gs-an-plot" initial={{opacity:0,y:15}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{duration:.48,ease:[.22,1,.36,1]}}>
      <div className="gs-exec-panel__heading"><h3>{title}</h3></div>
      <div className="gs-an-plot__chart">{children}</div>
    </motion.section>
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
    <motion.article className="gs-an-value gs-exec-kpi" initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.15}} transition={{duration:.44}}>
      <span className="gs-exec-kpi__icon">
        {icon}
      </span>
      <div className="mt-4">
        <p className="gs-exec-kpi__label">
          {label}
        </p>
        <p className="gs-an-value__figure">
          {value}
        </p>
      </div>
    </motion.article>
  );
}
