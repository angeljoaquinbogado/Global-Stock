"use client";

import { PackagePlus, X } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties
} from "react";
import { createPortal } from "react-dom";

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
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({ visibility: "hidden" });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const pending = useRef<{ amount: number; key: string } | null>(null);
  const panelId = useId();

  useEffect(() => {
    setDraft(String(stock));
  }, [stock, productId]);

  // Keep the confirmation panel outside the table, so opening it never
  // changes row height or gets clipped by the table's horizontal scroller.
  useLayoutEffect(() => {
    if (!open) return;

    function placePanel() {
      const button = triggerRef.current;
      const panel = panelRef.current;
      if (!button || !panel) return;

      const rect = button.getBoundingClientRect();
      const view = window.visualViewport;
      const viewLeft = view?.offsetLeft ?? 0;
      const viewTop = view?.offsetTop ?? 0;
      const width = Math.min(258, (view?.width ?? window.innerWidth) - 24);
      const viewRight = viewLeft + (view?.width ?? window.innerWidth);
      const viewBottom = viewTop + (view?.height ?? window.innerHeight);
      const height = panel.offsetHeight;
      const below = viewBottom - rect.bottom - 8;
      const above = rect.top - viewTop - 8;
      const topSide = below < height && above > below;
      const proposedTop = topSide ? rect.top - height - 8 : rect.bottom + 8;
      const top = Math.max(viewTop + 12, Math.min(proposedTop, viewBottom - 12 - height));
      const left = Math.max(viewLeft + 12, Math.min(rect.right - width, viewRight - 12 - width));
      const computed = window.getComputedStyle(button);

      setPanelStyle({
        position: "fixed",
        top, left, width, maxHeight: Math.max(100, viewBottom - viewTop - 24),
        visibility: "visible",
        zIndex: 10020,
        // The workspace's chosen accent is scoped to its container.
        // Carry the accent into the portal without affecting the rest of the app.
        "--apex-accent": computed.getPropertyValue("--apex-accent").trim() || "#8F0000",
        "--apex-accent-soft": computed.getPropertyValue("--apex-accent-soft").trim() || "#F8EAEA"
      } as CSSProperties);
    }

    placePanel();
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    window.visualViewport?.addEventListener("resize", placePanel);
    window.visualViewport?.addEventListener("scroll", placePanel);
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
      window.visualViewport?.removeEventListener("resize", placePanel);
      window.visualViewport?.removeEventListener("scroll", placePanel);
    };
  }, [open, error]);

  useEffect(() => {
    if (!open) return;
    amountRef.current?.focus();

    function handleOutside(event: PointerEvent) {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || panelRef.current?.contains(node)) return;
      if (!busy) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || busy) return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, busy]);

  function commitStock() {
    if (busy) return;
    const target = Number(draft.replace(",", "."));
    if (!draft.trim() || !Number.isFinite(target) || target < 0 || target > 1_000_000_000 ||
      Math.abs(target - Math.round(target * 1000) / 1000) > 1e-9) {
      setDraft(String(stock));
      setError("Ingresá un stock válido.");
      setOpen(true);
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
      triggerRef.current?.focus();
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
    <div className="gs-stock-cell flex w-[106px] flex-col gap-1.5">
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
        className="apex-input h-[38px] w-full rounded-[10px] px-3 text-xs tabular-nums"
      />
      <button
        ref={triggerRef}
        type="button"
        disabled={busy}
        aria-label="Sumar stock a este producto"
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        className="flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[10px] border border-[var(--apex-border)] px-2 text-[11px] font-semibold transition-colors hover:border-[var(--apex-accent)] hover:bg-[var(--apex-accent-soft)] disabled:opacity-40"
        onClick={() => {
          setOpen(value => !value);
          setError("");
          setPanelStyle({ visibility: "hidden" });
        }}
      >
        <PackagePlus size={14} aria-hidden="true" />
        <span>+ Stock</span>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Agregar stock"
          style={panelStyle}
          className="gs-stock-popover overflow-y-auto rounded-[16px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3.5 text-[var(--apex-text)] shadow-[0_16px_48px_rgba(0,0,0,.19)]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] font-bold">Agregar existencias</p>
              <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                Stock actual: <strong className="tabular-nums text-[var(--apex-text)]">{stock}</strong>
              </p>
            </div>
            <button type="button" disabled={busy} aria-label="Cerrar"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--apex-border)] hover:bg-[var(--apex-bg)] disabled:opacity-40"
              onClick={() => { setOpen(false); triggerRef.current?.focus(); }}>
              <X size={15} />
            </button>
          </div>
          <form className="mt-3 space-y-2" onSubmit={event => { event.preventDefault(); void restock(); }}>
            <label className="block text-[11px] font-semibold text-[var(--apex-muted)]" htmlFor={panelId + "-quantity"}>
              Cantidad a sumar
            </label>
            <input
              ref={amountRef}
              id={panelId + "-quantity"}
              type="text"
              inputMode="decimal"
              value={amount}
              maxLength={14}
              disabled={busy}
              placeholder="Ej. 10"
              onChange={event => { setAmount(event.target.value); setError(""); }}
              className="apex-input h-10 w-full rounded-xl px-3 text-[12px] tabular-nums"
            />
            <button type="submit" disabled={busy || quantityFrom(amount) === null}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-[var(--apex-accent)] px-3 text-[12px] font-bold text-white transition-[filter,transform] hover:brightness-110 active:scale-[.985] disabled:opacity-40">
              {busy ? "Guardando…" : "Confirmar ingreso"}
            </button>
          </form>
          {error && <p role="alert" className="mt-2 text-[11px] leading-4 text-red-500">{error}</p>}
        </div>,
        document.body
      )}
    </div>
  );
}
