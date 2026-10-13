"use client";

import { useEffect, useRef, useState } from "react";
import { PackagePlus } from "lucide-react";

type Props = {
  productId: string;
  stock: number;
  onSetStock: (id: string, stock: number) => void;
  onAddStock: (id: string, quantity: number, operationId: string) => Promise<number>;
};
const quantityPattern = /^\d+(?:[.,]\d{1,3})?$/;
function quantityFrom(value: string) {
  const input = value.trim();
  if (!quantityPattern.test(input)) return null;
  const n = Number(input.replace(",", "."));
  return Number.isFinite(n) && n > 0 && n <= 1_000_000 ? n : null;
}
function operationId() {
  return "web-restock-" + Date.now().toString(36) + "-" +
    Math.random().toString(36).slice(2, 13);
}

export function StockQuantityCell({ productId, stock, onSetStock, onAddStock }: Props) {
  const [draft, setDraft] = useState(String(stock));
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<{ amount: number; key: string } | null>(null);

  useEffect(() => {
    setDraft(String(stock));
  }, [stock, productId]);

  function commitStock() {
    if (busy) return;
    const target = Number(draft.replace(",", "."));
    if (!Number.isFinite(target) || target < 0 || target > 1_000_000_000 ||
        Math.abs(target - Math.round(target * 1000) / 1000) > 1e-9) {
      setDraft(String(stock));
      setError("Ingresá un stock válido.");
      return;
    }
    if (target !== stock) onSetStock(productId, target);
  }

  async function restock() {
    const quantity = quantityFrom(amount);
    if (busy || quantity === null) return;
    if (pending.current && pending.current.amount !== quantity) {
      setError("Reintentá primero el ingreso anterior con la misma cantidad.");
      return;
    }
    if (!pending.current) pending.current = { amount: quantity, key: operationId() };
    setBusy(true);
    setError("");
    try {
      await onAddStock(productId, quantity, pending.current.key);
      pending.current = null;
      setAmount("");
      setOpen(false);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "";
      const connection = /network|fetch|timeout|socket|connection|abort/i.test(detail);
      if (!connection) pending.current = null;
      setError(connection
        ? "No se confirmó la conexión. Reintentá la misma cantidad para evitar duplicados."
        : detail || "No pudimos agregar stock. Volvé a intentar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-[124px] flex-col gap-2">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.001"
        aria-label="Stock actual"
        value={draft}
        disabled={busy}
        onChange={event => setDraft(event.target.value)}
        onBlur={commitStock}
        onKeyDown={event => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") { setDraft(String(stock)); event.currentTarget.blur(); }
        }}
        className="apex-input w-28 rounded-xl px-3 py-2 text-xs"
      />
      <button
        type="button"
        aria-label="Sumar stock a este producto"
        aria-expanded={open}
        className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--apex-border)] px-2 text-[11px] font-semibold hover:border-[#8F0000]/50"
        onClick={() => { setOpen(value => !value); setError(""); }}
      ><PackagePlus size={14}/> + Stock</button>
      {open && (
        <div className="flex flex-col gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-2">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            maxLength={14}
            disabled={busy}
            placeholder="Unidades"
            aria-label="Cantidad de stock para sumar"
            onChange={event => { setAmount(event.target.value); setError(""); }}
            onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void restock(); } }}
            className="apex-input w-28 px-2 py-2 text-xs"
          />
          <button type="button" disabled={busy || quantityFrom(amount) === null}
            onClick={() => void restock()}
            className="min-h-9 rounded-lg bg-[#8F0000] px-2 text-[11px] font-semibold text-white disabled:opacity-40">
            {busy ? "Guardando…" : "Sumar unidades"}
          </button>
          {error && <p role="alert" className="max-w-40 text-[11px] leading-4 text-red-500">{error}</p>}
        </div>
      )}
      {!open && error && <p role="alert" className="max-w-40 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
