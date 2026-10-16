"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, CheckCircle2,
  Layers3, Package,
  ShieldAlert, Sparkles, TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { DashboardMetrics } from "@/lib/types";
import type { WorkspaceAccent } from "@/lib/workspace-accent";
import type { LanguageCode } from "./GlobalPreferences";
import "./animated-home-dashboard.css";

type TrendRow = { label: string; revenue: number; cost: number; profit: number };
type HomeLabels = {
  title: string;
  subtitle: string;
  revenue: string;
  inventoryCost: string;
  grossProfit: string;
  stock: string;
  criticalStock: string;
  units: string;
  alerts: string;
  salesFlow: string;
  recentActivity: string;
  todayNotes: string;
  noActivities: string;
  noNotes: string;
  charts: string;
  open: string;
};
type Props = {
  dark: boolean;
  language: LanguageCode;
  accent: WorkspaceAccent;
  onAccentChange: (accent: WorkspaceAccent) => void;
  labels: HomeLabels;
  metrics: DashboardMetrics;
  chartData: TrendRow[];
  money: (value: number) => string;
  showFinancials: boolean;
  recentActivities: string[];
  todayNotes: string[];
  canOpenCharts: boolean;
  canOpenActivities: boolean;
  canOpenNotes: boolean;
  openCharts: () => void;
  openActivities: () => void;
  openNotes: () => void;
};

const words: Record<LanguageCode, {
  period: string; snapshot: string; financial: string; today: string;
  last: string; margin: string; chart: string; tasks: string; noData: string;
  view: string; palette: string; updates: string; inventory: string;
}> = {
  es: {
    period: "Datos registrados", snapshot: "Resumen en tiempo real",
    financial: "Estado financiero", today: "Tu negocio, de un vistazo",
    last: "Actividad del negocio", margin: "Margen bruto", chart: "Movimiento de ventas",
    tasks: "Notas y recordatorios", noData: "Todavía no hay datos para mostrar",
    view: "Ver detalles", palette: "Color del panel", updates: "Movimientos recientes",
    inventory: "Inventario"
  },
  en: {
    period: "Recorded data", snapshot: "Live overview",
    financial: "Financial snapshot", today: "Your business at a glance",
    last: "Business activity", margin: "Gross margin", chart: "Sales trend",
    tasks: "Notes and reminders", noData: "No data available yet",
    view: "View details", palette: "Dashboard accent", updates: "Recent updates",
    inventory: "Inventory"
  },
  pt: {
    period: "Dados registrados", snapshot: "Visão geral em tempo real",
    financial: "Resumo financeiro", today: "Seu negócio em um olhar",
    last: "Atividade do negócio", margin: "Margem bruta", chart: "Fluxo de vendas",
    tasks: "Notas e lembretes", noData: "Ainda não há dados",
    view: "Ver detalhes", palette: "Cor do painel", updates: "Atividade recente",
    inventory: "Estoque"
  },
  fr: {
    period: "Données enregistrées", snapshot: "Vue générale en temps réel",
    financial: "Bilan financier", today: "Votre activité en un coup d'œil",
    last: "Activité", margin: "Marge brute", chart: "Évolution des ventes",
    tasks: "Notes et rappels", noData: "Pas encore de données",
    view: "Voir les détails", palette: "Couleur du tableau", updates: "Activité récente",
    inventory: "Stock"
  },
  de: {
    period: "Erfasste Daten", snapshot: "Live-Übersicht",
    financial: "Finanzübersicht", today: "Dein Geschäft auf einen Blick",
    last: "Geschäftsaktivität", margin: "Bruttomarge", chart: "Verkaufsverlauf",
    tasks: "Notizen und Erinnerungen", noData: "Noch keine Daten vorhanden",
    view: "Details ansehen", palette: "Akzentfarbe", updates: "Letzte Aktivitäten",
    inventory: "Bestand"
  }
};

function CountUp({
  value, format, compact = false, delay = 0
}: {
  value: number; format: (value: number) => string;
  compact?: boolean; delay?: number
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let start: number | null = null;
    const ms = 820;
    function tick(now: number) {
      if (start === null) start = now;
      const raw = Math.min(1, Math.max(0, (now - start - delay) / ms));
      const eased = 1 - Math.pow(1 - raw, 3);
      setShown(value * eased);
      if (raw < 1) raf = window.requestAnimationFrame(tick);
    }
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [value, reduced, delay]);
  return <span className={compact ? "gs-exec-figure gs-exec-figure--compact" : "gs-exec-figure"}>{format(shown)}</span>;
}

function FadeIn({ children, delay = 0, className = "" }: {
  children: ReactNode; delay?: number; className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className}
      initial={reduced ? false : { opacity: 0, y: 20, scale: .985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduced ? 0 : .52, delay: reduced ? 0 : delay, ease: [0.22, 1, .36, 1] }}>
      {children}
    </motion.div>
  );
}

function KpiCard({ label, value, format, icon, tint, active = false, delay }: {
  label: string; value: number; format: (n:number)=>string;
  icon: ReactNode; tint?: string; active?: boolean; delay: number
}) {
  return <FadeIn delay={delay}>
    <article className={"gs-exec-kpi " + (active ? "gs-exec-kpi--hero" : "")} data-testid="exec-kpi">
      <div className="gs-exec-kpi__top">
        <div className="gs-exec-kpi__icon" style={tint ? {color:tint} : undefined}>{icon}</div>
        <ArrowUpRight size={15} className="gs-exec-kpi__corner" aria-hidden="true" />
      </div>
      <p className="gs-exec-kpi__label">{label}</p>
      <CountUp value={value} format={format} delay={delay*500} />
    </article>
  </FadeIn>;
}

function RevenueBars({
  rows, money, label
}: {rows:TrendRow[],money:(n:number)=>string,label:string}) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1,...rows.map(row => Math.max(0, row.revenue)));
  const hasData = rows.some(row => row.revenue > 0);
  return (
    <div className="gs-exec-chart" data-testid="exec-revenue-chart">
      {hasData ? (
        <>
          <div className="gs-exec-chart__grid" aria-hidden="true">
            <i/><i/><i/><i/>
          </div>
          <div className="gs-exec-chart__bars" role="group" aria-label={label}>
            {rows.map((row, index) => {
              const chosen = selected === index;
              return (
                <button key={row.label + index} type="button"
                  aria-label={row.label + ": " + money(row.revenue)}
                  onClick={() => setSelected(previous => previous === index ? null : index)}
                  onFocus={() => setSelected(index)}
                  onBlur={() => setSelected(null)}
                  onMouseEnter={() => setSelected(index)}
                  onMouseLeave={() => setSelected(null)}
                  className="gs-exec-chart__column">
                  <span className="gs-exec-chart__plot">
                    <motion.span className={"gs-exec-chart__bar "+(chosen?"gs-exec-chart__bar--active":"")}
                      style={{height:(row.revenue <= 0 ? 0 : Math.max(6,row.revenue / max * 100))+"%", transformOrigin:"bottom"}}
                      initial={reduced ? false : {scaleY:0,opacity:.3}}
                      animate={{scaleY:1,opacity:1}}
                      transition={{duration:reduced?0:.72,delay:reduced?0:.16+index*.065,ease:[.19,1,.22,1]}}
                    />
                    <AnimatePresence>
                      {chosen && (
                        <motion.span className="gs-exec-chart__tip"
                          initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}
                          exit={{opacity:0,y:4}} transition={{duration:.12}}>
                          {money(row.revenue)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="gs-exec-chart__axis-label">{row.label}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : <div className="gs-exec-empty"><BarChart3 size={24}/><span>{label}</span></div>}
    </div>
  );
}

function MarginGauge({ margin, label, noData }: {margin:number|null,label:string,noData:string}) {
  const reduced = useReducedMotion();
  const safePct = Math.max(0,Math.min(100,margin??0));
  return (
    <div className="gs-exec-gauge">
      <svg viewBox="0 0 200 128" role="img"
        aria-label={margin===null?noData:label+": "+margin.toFixed(1)+"%"}>
        <path d="M 20 107 A 80 80 0 0 1 180 107" fill="none" stroke="var(--home-gauge-track)" strokeWidth="14" strokeLinecap="round"/>
        <motion.path d="M 20 107 A 80 80 0 0 1 180 107" fill="none" stroke="var(--home-accent)" strokeWidth="14"
          strokeLinecap="round" pathLength={1} strokeDasharray="1 1"
          initial={reduced ? false : {pathLength:0}}
          animate={{pathLength:safePct/100}}
          transition={{duration:reduced?0:1.1,delay:reduced?0:.3,ease:[.22,1,.36,1]}}/>
        <circle cx="100" cy="107" r="0" strokeWidth="0" />
      </svg>
      <div className="gs-exec-gauge__center">
        <CountUp value={margin??0}
          format={n=>margin===null?"—":new Intl.NumberFormat("es-AR",{maximumFractionDigits:1}).format(n)+"%"}
          compact />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function AnimatedHomeDashboard({
  dark,language,accent,onAccentChange,labels,metrics,chartData,money,showFinancials,
  recentActivities,todayNotes,canOpenCharts,canOpenActivities,canOpenNotes,
  openCharts,openActivities,openNotes
}: Props) {
  const t=words[language];
  const countFormat=useMemo(()=>new Intl.NumberFormat(
    language==="es"?"es-AR":language==="pt"?"pt-BR":language==="fr"?"fr-FR":language==="de"?"de-DE":"en-US",
    {maximumFractionDigits:0}
  ),[language]);
  const numeric=(n:number)=>countFormat.format(Math.round(n));
  const margin=showFinancials&&metrics.revenue>0?metrics.marginPct:null;
  const chartHasData=chartData.some(row=>row.revenue>0);
  const financials=showFinancials? [
    {label:labels.revenue,value:metrics.revenue,format:money,icon:<TrendingUp size={20}/>},
    {label:labels.inventoryCost,value:metrics.inventoryCost,format:money,icon:<Layers3 size={20}/>},
    {label:labels.grossProfit,value:metrics.grossProfit,format:money,icon:<BarChart3 size={20}/>},
    {label:labels.criticalStock,value:metrics.lowStockCount+metrics.outOfStockCount,format:numeric,icon:<ShieldAlert size={20}/>}
  ]:[
    {label:labels.stock,value:metrics.inventoryUnits,format:numeric,icon:<Package size={20}/>},
    {label:labels.criticalStock,value:metrics.lowStockCount+metrics.outOfStockCount,format:numeric,icon:<ShieldAlert size={20}/>}
  ];
  return (
    <section data-testid="animated-home-dashboard" data-theme={dark?"dark":"light"} data-accent={accent}
      className="gs-exec-dashboard">
      <FadeIn className="gs-exec-header">
        <div className="gs-exec-header__copy">
          <span className="gs-exec-overline"><Sparkles size={13}/>{t.snapshot}</span>
          <h2>{labels.title}<span className="gs-exec-heading-mark">.</span></h2>
          <p>{t.today}. {labels.subtitle}</p>
        </div>
        <div className="gs-exec-header__tools">
          <div className="gs-exec-palette" role="group" aria-label={t.palette}>
            <button title="Verde esmeralda" type="button" aria-label="Verde esmeralda"
              aria-pressed={accent==="emerald"} onClick={()=>onAccentChange("emerald")}
              className="gs-exec-palette__emerald"/>
            <button title="Azul" type="button" aria-label="Azul"
              aria-pressed={accent==="blue"} onClick={()=>onAccentChange("blue")}
              className="gs-exec-palette__blue"/>
            <button title="Rojo Global Stock" type="button" aria-label="Rojo Global Stock"
              aria-pressed={accent==="red"} onClick={()=>onAccentChange("red")}
              className="gs-exec-palette__red"/>
          </div>
        </div>
      </FadeIn>

      <div className={"gs-exec-metrics "+(!showFinancials?"gs-exec-metrics--compact":"")}>
        {financials.map((metric,index)=>(
          <KpiCard key={metric.label} label={metric.label} value={metric.value}
            format={metric.format} icon={metric.icon}
            active={index===0} delay={.06+index*.085}/>
        ))}
      </div>
      <div className="gs-exec-content">
        <FadeIn className="gs-exec-panel gs-exec-panel--chart" delay={.27}>
          <div className="gs-exec-panel__heading">
            <div>
              <p className="gs-exec-overline">{showFinancials?t.financial:t.inventory}</p>
              <h3>{showFinancials?t.chart:labels.stock}</h3>
              <span className="gs-exec-panel__sub">{t.period}</span>
            </div>
            {canOpenCharts&&<button type="button" className="gs-exec-link" onClick={openCharts}>
              {t.view}<ArrowRight size={14}/>
            </button>}
          </div>
          <RevenueBars rows={chartData} money={money} label={chartHasData?t.chart:t.noData}/>
          <div className="gs-exec-panel__footer">
            <span className="gs-exec-dot" aria-hidden="true"/>
            <span>{showFinancials?labels.revenue:labels.stock}</span>
            <span className="gs-exec-panel__caption">{t.period}</span>
          </div>
        </FadeIn>

        <FadeIn className="gs-exec-panel gs-exec-panel--gauge" delay={.36}>
          <div className="gs-exec-panel__heading">
            <div>
              <p className="gs-exec-overline">{t.financial}</p>
              <h3>{showFinancials?t.margin:t.inventory}</h3>
            </div>
            <div className="gs-exec-chip"><CheckCircle2 size={13}/>{t.snapshot}</div>
          </div>
          {showFinancials
            ? <MarginGauge margin={margin} label={t.margin} noData={t.noData}/>
            : <div className="gs-exec-inventory-count"><CountUp value={metrics.inventoryUnits} format={numeric}/><span>{labels.units}</span></div>}
          <div className="gs-exec-gauge__foot">
            <div><span>{labels.criticalStock}</span><b>{numeric(metrics.lowStockCount+metrics.outOfStockCount)}</b></div>
            <div><span>{labels.stock}</span><b>{numeric(metrics.inventoryUnits)} {labels.units}</b></div>
          </div>
        </FadeIn>

        <FadeIn className="gs-exec-panel gs-exec-panel--activity" delay={.4}>
          <div className="gs-exec-panel__heading">
            <div>
              <p className="gs-exec-overline">{t.updates}</p>
              <h3>{labels.recentActivity}</h3>
            </div>
            {canOpenActivities&&<button type="button" className="gs-exec-link" onClick={openActivities}>{labels.open}<ArrowRight size={14}/></button>}
          </div>
          <div className="gs-exec-activity-list">
            {recentActivities.length?recentActivities.map((description,index)=>(
              <motion.div key={index} className="gs-exec-activity"
                initial={{opacity:0,x:-7}} animate={{opacity:1,x:0}}
                transition={{duration:.34,delay:.44+index*.07}}>
                <span className="gs-exec-activity__mark"><Activity size={14}/></span>
                <p>{description}</p>
                <CheckCircle2 size={15} className="gs-exec-activity__check"/>
              </motion.div>
            )):<p className="gs-exec-no-data">{labels.noActivities}</p>}
          </div>
        </FadeIn>

        <FadeIn className="gs-exec-panel gs-exec-panel--tasks" delay={.48}>
          <div className="gs-exec-panel__heading">
            <div>
              <p className="gs-exec-overline">{t.tasks}</p>
              <h3>{labels.todayNotes}</h3>
            </div>
            {canOpenNotes&&<button type="button" className="gs-exec-link" onClick={openNotes}>{labels.open}<ArrowRight size={14}/></button>}
          </div>
          <div className="gs-exec-notes">
            {todayNotes.length?todayNotes.slice(0,4).map((note,index)=>(
              <div className="gs-exec-note" key={index}><span className="gs-exec-note__circle"/><p>{note}</p></div>
            )):<p className="gs-exec-no-data">{labels.noNotes}</p>}
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
