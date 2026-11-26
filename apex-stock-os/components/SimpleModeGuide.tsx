"use client";

import {
  BookOpenCheck,
  CheckCircle2,
  Eye,
  Package,
  ShoppingCart,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { useEffect, useState } from "react";

import { calculateMetrics, formatMoney } from "@/lib/analytics";
import type { BusinessSnapshot } from "@/lib/types";
import { WORKSPACE_ACCENTS, type WorkspaceAccent } from "@/lib/workspace-accent";

const SIMPLE_MODE_KEY = "global-stock-simple-mode-v1";

type SimpleModeGuideProps = {
  snapshot: BusinessSnapshot;
  onNavigateModule: (moduleId: string) => void;
  onOpenCreditLedger?: () => void;
  accent?: WorkspaceAccent;
};

export function SimpleModeGuide({
  snapshot,
  onNavigateModule,
  onOpenCreditLedger,
  accent = "red"
}: SimpleModeGuideProps) {
  const accentColors = WORKSPACE_ACCENTS[accent];
  const [simpleMode, setSimpleMode] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIMPLE_MODE_KEY);
      if (saved === "true") {
        setSimpleMode(true);
        document.documentElement.dataset.simpleMode = "true";
      }
    } catch {}
  }, []);

  function toggleSimpleMode(next: boolean) {
    setSimpleMode(next);
    if (next) {
      document.documentElement.dataset.simpleMode = "true";
    } else {
      delete document.documentElement.dataset.simpleMode;
    }
    try {
      window.localStorage.setItem(SIMPLE_MODE_KEY, String(next));
    } catch {}
  }

  const metrics = calculateMetrics(snapshot);
  const money = (val: number) => formatMoney(val, snapshot.currency, snapshot.locale);
  const alertsCount = metrics.lowStockCount + metrics.outOfStockCount;

  if (!simpleMode) {
    return (
      <button
        type="button"
        onClick={() => toggleSimpleMode(true)}
        title="Activar vista con letra grande y botones simples"
        className="fixed bottom-[calc(206px+env(safe-area-inset-bottom,0px))] right-4 z-40 flex h-11 items-center gap-2 rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3.5 text-xs font-semibold text-[var(--apex-text)] shadow-[0_10px_28px_rgba(0,0,0,.14)] backdrop-blur-xl transition hover:border-[var(--apex-accent)] lg:bottom-[142px] lg:right-6"
      >
        <Eye size={15} style={{ color: accentColors.main }} />
        <span className="hidden sm:inline">Modo fácil</span>
      </button>
    );
  }

  return (
    <section
      aria-label="Guía de operación simple"
      className="mx-auto mb-6 w-full max-w-6xl rounded-[28px] border-2 border-[var(--apex-accent)] bg-[var(--apex-surface-strong)] p-5 text-[var(--apex-text)] shadow-[0_18px_48px_rgba(0,0,0,.14)] sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--apex-border)] pb-4">
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"
            style={{ backgroundColor: accentColors.main }}
          >
            <BookOpenCheck size={24} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Modo Fácil activado (letra grande y pasos claros)
            </h2>
            <p className="text-sm text-[var(--apex-muted)] sm:text-base">
              Elegí una de las 4 tareas principales. No podés romper nada: todo queda guardado solo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleSimpleMode(false)}
          className="min-h-12 rounded-2xl border-2 border-[var(--apex-border)] bg-[var(--apex-bg)] px-5 py-2.5 text-sm font-bold text-[var(--apex-text)] transition hover:border-[var(--apex-accent)]"
        >
          Volver a vista normal
        </button>
      </div>

      {/* Resumen en palabras simples */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
          <div className="text-sm font-semibold text-[var(--apex-muted)]">Plata que entró en ventas</div>
          <div className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">{money(metrics.revenue)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
          <div className="text-sm font-semibold text-[var(--apex-muted)]">Ganancia limpia estimada</div>
          <div className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">{money(metrics.grossProfit)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
          <div className="text-sm font-semibold text-[var(--apex-muted)]">Productos para reponer</div>
          <div className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">
            {alertsCount === 0 ? "Todo completo" : `${alertsCount} producto(s)`}
          </div>
        </div>
      </div>

      {/* 4 botones gigantes con explicacion paso a paso */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigateModule("cash")}
          className="flex items-start gap-4 rounded-2xl border-2 border-[var(--apex-border)] bg-[var(--apex-bg)] p-5 text-left transition hover:border-[var(--apex-accent)]"
        >
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"
            style={{ backgroundColor: accentColors.main }}
          >
            <ShoppingCart size={24} />
          </span>
          <div>
            <div className="text-lg font-extrabold">1. Cobrar una venta</div>
            <p className="mt-1 text-sm leading-6 text-[var(--apex-muted)]">
              Tocá acá para buscar o escanear lo que lleva el cliente y apretar <strong>Confirmar venta</strong>.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule("inventory")}
          className="flex items-start gap-4 rounded-2xl border-2 border-[var(--apex-border)] bg-[var(--apex-bg)] p-5 text-left transition hover:border-[var(--apex-accent)]"
        >
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"
            style={{ backgroundColor: accentColors.main }}
          >
            <Package size={24} />
          </span>
          <div>
            <div className="text-lg font-extrabold">2. Ver o cambiar precios y stock</div>
            <p className="mt-1 text-sm leading-6 text-[var(--apex-muted)]">
              Revisá cuánta mercadería queda ({snapshot.products.length} productos) o agregá un artículo nuevo.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenCreditLedger) {
              onOpenCreditLedger();
            } else {
              window.dispatchEvent(new CustomEvent("global-stock:open-credit"));
            }
          }}
          className="flex items-start gap-4 rounded-2xl border-2 border-[var(--apex-border)] bg-[var(--apex-bg)] p-5 text-left transition hover:border-[var(--apex-accent)]"
        >
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"
            style={{ backgroundColor: accentColors.main }}
          >
            <UserCheck size={24} />
          </span>
          <div>
            <div className="text-lg font-extrabold">3. Anotar fiado o cobrar deuda</div>
            <p className="mt-1 text-sm leading-6 text-[var(--apex-muted)]">
              Anotá lo que debe un cliente, descontá cuando paga y mandale el saldo por WhatsApp.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule("restock")}
          className="flex items-start gap-4 rounded-2xl border-2 border-[var(--apex-border)] bg-[var(--apex-bg)] p-5 text-left transition hover:border-[var(--apex-accent)]"
        >
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"
            style={{ backgroundColor: accentColors.main }}
          >
            <TrendingUp size={24} />
          </span>
          <div>
            <div className="text-lg font-extrabold">4. Ver qué falta comprar</div>
            <p className="mt-1 text-sm leading-6 text-[var(--apex-muted)]">
              Mirá la lista de productos que se están terminando para pedirle al proveedor a tiempo.
            </p>
          </div>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--apex-muted)]">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
        <span>
          Consejo: si tenés alguna duda, tocá el botón redondo de abajo a la derecha y preguntale con tus palabras.
        </span>
      </div>
    </section>
  );
}