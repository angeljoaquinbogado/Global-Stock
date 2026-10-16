"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { WorkspaceAccent } from "@/lib/workspace-accent";
import "./animated-home-dashboard.css";
import "./premium-charts.css";

import {
  Sparkles,
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
        <Metric
          icon={<CircleDollarSign size={17} />}
          label={t.revenue}
          amount={revenue} format={money}
          positive
        />
        <Metric
          icon={<Boxes size={17} />}
          label={t.cost}
          amount={cost} format={money}
        />
        <Metric
          icon={<TrendingUp size={17} />}
          label={t.profit}
          amount={profit} format={money}
          positive={profit >= 0}
        />
        <Metric
          icon={<ArrowDownRight size={17} />}
          label={t.losses}
          amount={losses} format={money}
          positive={losses === 0}
        />
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

        {data.length ? (
          <div className="gs-an-chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ left: 6, right: 12, top: 16, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="premiumRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--home-accent)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--home-accent)" stopOpacity={0} />
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
                  isAnimationActive={!reduced}
                animationDuration={850}
                />
                <Line
                  type="linear"
                  dataKey="revenue"
                  name={t.revenue}
                  stroke="var(--home-accent)"
                  strokeWidth={2.6}
                  dot={false}
                  activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--apex-surface-strong)" }}
                  isAnimationActive={!reduced}
                animationDuration={850}
                />
                <Line
                  type="linear"
                  dataKey="cost"
                  name={t.cost}
                  stroke="var(--home-muted)"
                  strokeWidth={1.55}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 2, stroke: "var(--apex-surface-strong)" }}
                  isAnimationActive={!reduced}
                animationDuration={850}
                />
                <Line
                  type="linear"
                  dataKey="profit"
                  name={t.profit}
                  stroke="var(--apex-text)"
                  strokeWidth={1.9}
                  dot={false}
                  activeDot={{ r: 3.8, strokeWidth: 2, stroke: "var(--apex-surface-strong)" }}
                  isAnimationActive={!reduced}
                animationDuration={850}
                />
              </ComposedChart>
            </ResponsiveContainer>
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
