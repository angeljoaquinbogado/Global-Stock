"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Command,
  Download,
  FileSpreadsheet,
  MessageCircle,
  PauseCircle,
  Percent,
  PlayCircle,
  Printer,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatMoney } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { WORKSPACE_ACCENTS, type WorkspaceAccent } from "@/lib/workspace-accent";

type HubTab = "search" | "parked" | "credit" | "labels" | "bulk-price" | "csv-import";

type ParkedTicket = {
  id: string;
  label: string;
  createdAt: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number }>;
  total: number;
};

type CreditAccount = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  limit: number;
  updatedAt: string;
};

type OperationsCommandHubProps = {
  products: Product[];
  onUpdateProducts: (updater: (current: Product[]) => Product[]) => void;
  onNavigateModule: (moduleId: string) => void;
  activeCart?: Record<string, number>;
  onReplaceCart?: (nextCart: Record<string, number>) => void;
  currency: string;
  locale: string;
  accent?: WorkspaceAccent;
};

const QUICK_NAV_ITEMS = [
  { id: "overview", label: "Inicio / Tablero general", hint: "KPIs, alertas y resumen del negocio" },
  { id: "cash", label: "Caja / Punto de venta (POS)", hint: "Cobrar en mostrador y escanear" },
  { id: "inventory", label: "Almacén / Catálogo", hint: "Productos, stock, costos y mínimos" },
  { id: "restock", label: "Reposición", hint: "Pedidos a proveedores y faltantes" },
  { id: "suppliers", label: "Proveedores", hint: "Directorio, costos y entregas" },
  { id: "analytics", label: "Gráficos y rentabilidad", hint: "Ventas, costos y márgenes" },
  { id: "fiscal", label: "ARCA / Facturación electrónica", hint: "Comprobantes fiscales A, B, C" },
  { id: "online", label: "Tienda Online", hint: "Sincronización de canales y pedidos" },
  { id: "documents", label: "Comprobantes y gastos", hint: "Boletas, remitos y egresos" },
  { id: "fx", label: "Cotizaciones FX", hint: "Tipos de cambio y monedas" },
  { id: "settings", label: "Configuración y perfil operativo", hint: "Kiosco / Comercio / Empresa" }
];

const PARKED_STORAGE_KEY = "global-stock-parked-tickets-v1";
const CREDIT_STORAGE_KEY = "global-stock-fiado-ledger-v1";

function applyRounding(value: number, step: number): number {
  if (step <= 0) return Math.round(value * 100) / 100;
  return Math.round(value / step) * step;
}

export function OperationsCommandHub({
  products,
  onUpdateProducts,
  onNavigateModule,
  activeCart = {},
  onReplaceCart,
  currency,
  locale,
  accent = "red"
}: OperationsCommandHubProps) {
  const accentColors = WORKSPACE_ACCENTS[accent];
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<HubTab>("search");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");

  // Ventas en espera
  const [parkedTickets, setParkedTickets] = useState<ParkedTicket[]>([]);
  const [parkLabel, setParkLabel] = useState("");

  // Cuenta corriente / Fiado
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAmount, setClientAmount] = useState("");
  const [clientLimit, setClientLimit] = useState("100000");

  // Etiquetas de gondola
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Actualizacion masiva de precios
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [adjustMode, setAdjustMode] = useState<"percent" | "fixed">("percent");
  const [adjustValue, setAdjustValue] = useState("10");
  const [roundStep, setRoundStep] = useState<number>(10);

  // Importacion CSV
  const [csvText, setCsvText] = useState(
    "Nombre,Categoria,Costo,Precio,Stock,Minimo\nYerba Mate 1kg,Almacen,2400,3600,24,8\nCafe Molido 500g,Almacen,4100,6200,14,5"
  );

  useEffect(() => {
    try {
      const savedParked = window.localStorage.getItem(PARKED_STORAGE_KEY);
      if (savedParked) setParkedTickets(JSON.parse(savedParked));
      const savedCredit = window.localStorage.getItem(CREDIT_STORAGE_KEY);
      if (savedCredit) setCreditAccounts(JSON.parse(savedCredit));
    } catch {
      // Ignora almacenamiento corrupto
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      } else if (event.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const onOpenCredit = () => {
      setTab("credit");
      setFeedback("");
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("global-stock:open-credit", onOpenCredit);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("global-stock:open-credit", onOpenCredit);
    };
  }, [open]);

  function saveParked(next: ParkedTicket[]) {
    setParkedTickets(next);
    try {
      window.localStorage.setItem(PARKED_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function saveCredits(next: CreditAccount[]) {
    setCreditAccounts(next);
    try {
      window.localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const activeCartSummary = useMemo(() => {
    const entries = Object.entries(activeCart).filter(([, qty]) => qty > 0);
    const items = entries
      .map(([key, qty]) => {
        const productId = key.split("::")[0];
        const prod = products.find((p) => p.id === productId);
        if (!prod) return null;
        return { productId: prod.id, name: prod.name, quantity: qty, price: prod.price };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return { items, total };
  }, [activeCart, products]);

  function handleParkCurrentCart() {
    if (!activeCartSummary.items.length) {
      setFeedback("No hay productos cargados en el carrito actual de Caja para pausar.");
      return;
    }
    const ticket: ParkedTicket = {
      id: crypto.randomUUID(),
      label: parkLabel.trim() || `Cliente en espera #${parkedTickets.length + 1}`,
      createdAt: new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
      items: activeCartSummary.items,
      total: activeCartSummary.total
    };
    saveParked([ticket, ...parkedTickets]);
    setParkLabel("");
    if (onReplaceCart) onReplaceCart({});
    setFeedback(`Venta "${ticket.label}" guardada en espera y carrito liberado para el siguiente cliente.`);
  }

  function handleResumeParked(ticket: ParkedTicket) {
    if (!onReplaceCart) return;
    const nextCart: Record<string, number> = {};
    for (const item of ticket.items) {
      nextCart[item.productId] = (nextCart[item.productId] || 0) + item.quantity;
    }
    onReplaceCart(nextCart);
    saveParked(parkedTickets.filter((t) => t.id !== ticket.id));
    onNavigateModule("cash");
    setOpen(false);
  }

  function handleAddCreditMovement(type: "charge" | "payment") {
    const name = clientName.trim();
    const amount = Number(clientAmount.replace(",", "."));
    if (!name || !Number.isFinite(amount) || amount <= 0) {
      setFeedback("Ingresá nombre del cliente y un monto válido mayor a 0.");
      return;
    }
    const existing = creditAccounts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      const nextBalance = Math.max(0, existing.balance + (type === "charge" ? amount : -amount));
      const updated = creditAccounts.map((c) =>
        c.id === existing.id
          ? {
              ...c,
              phone: clientPhone.trim() || c.phone,
              balance: nextBalance,
              updatedAt: new Date().toLocaleDateString(locale)
            }
          : c
      );
      saveCredits(updated);
      setFeedback(
        type === "charge"
          ? `Se sumaron ${formatMoney(amount, currency, locale)} al fiado de ${existing.name}. Saldo: ${formatMoney(nextBalance, currency, locale)}.`
          : `Pago registrado para ${existing.name}. Saldo restante: ${formatMoney(nextBalance, currency, locale)}.`
      );
    } else {
      const created: CreditAccount = {
        id: crypto.randomUUID(),
        name,
        phone: clientPhone.trim(),
        balance: type === "charge" ? amount : 0,
        limit: Math.max(0, Number(clientLimit) || 100000),
        updatedAt: new Date().toLocaleDateString(locale)
      };
      saveCredits([created, ...creditAccounts]);
      setFeedback(`Cliente "${name}" agregado a Cuenta Corriente con saldo ${formatMoney(created.balance, currency, locale)}.`);
    }
    setClientAmount("");
  }

  function handleSendWhatsappReminder(account: CreditAccount) {
    const cleanPhone = account.phone.replace(/[^\d]/g, "");
    const text = encodeURIComponent(
      `Hola ${account.name}! Te compartimos el resumen de tu cuenta corriente: saldo pendiente actual de ${formatMoney(account.balance, currency, locale)}. ¡Muchas gracias!`
    );
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handlePrintShelfLabels() {
    const chosen = products.filter((p) =>
      selectedLabelIds.length ? selectedLabelIds.includes(p.id) : true
    ).slice(0, 24);
    if (!chosen.length) {
      setFeedback("No hay productos para generar etiquetas.");
      return;
    }
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      setFeedback("Permití ventanas emergentes para imprimir las etiquetas.");
      return;
    }
    const cardsHtml = chosen
      .map(
        (p) => `
        <div style="border:1.5px solid #111;border-radius:10px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;page-break-inside:avoid;">
          <div style="font-size:11px;text-transform:uppercase;color:#555;font-weight:700;">${p.category || "General"}</div>
          <div style="font-size:15px;font-weight:800;margin:4px 0 8px;line-height:1.2;">${p.name}</div>
          <div style="font-size:24px;font-weight:900;letter-spacing:-0.02em;">${formatMoney(p.price, currency, locale)}</div>
          <div style="margin-top:8px;padding-top:6px;border-top:1px dashed #999;font-family:monospace;font-size:12px;letter-spacing:2px;">*${p.barcode || p.id.slice(0, 10)}*</div>
        </div>`
      )
      .join("");

    win.document.write(`<!doctype html><html><head><title>Etiquetas de Góndola - Global Stock</title></head>
      <body style="font-family:system-ui,-apple-system,sans-serif;padding:20px;">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">${cardsHtml}</div>
        <script>window.onload = () => { window.print(); };</script>
      </body></html>`);
    win.document.close();
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category?.trim()) set.add(p.category.trim());
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 6);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.barcode || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, query]);

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_NAV_ITEMS.slice(0, 6);
    return QUICK_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q)
    );
  }, [query]);

  const affectedCount = useMemo(() => {
    return products.filter(
      (p) => selectedCategory === "ALL" || (p.category || "").trim() === selectedCategory
    ).length;
  }, [products, selectedCategory]);

  function handleBulkPriceApply() {
    const numeric = Number(adjustValue.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric === 0) {
      setFeedback("Ingresá un valor distinto de 0 para aplicar el ajuste.");
      return;
    }

    onUpdateProducts((current) =>
      current.map((p) => {
        if (selectedCategory !== "ALL" && (p.category || "").trim() !== selectedCategory) {
          return p;
        }
        const rawNext =
          adjustMode === "percent"
            ? p.price * (1 + numeric / 100)
            : p.price + numeric;
        const nextPrice = Math.max(0, applyRounding(rawNext, roundStep));
        return {
          ...p,
          price: nextPrice,
          updatedAt: new Date().toISOString()
        };
      })
    );

    setFeedback(
      `Precios actualizados en ${affectedCount} producto(s) (${adjustMode === "percent" ? `${numeric > 0 ? "+" : ""}${numeric}%` : `${numeric > 0 ? "+" : ""}${formatMoney(numeric, currency, locale)}`}).`
    );
  }

  function handleCsvImport() {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) {
      setFeedback("Pegá o subí al menos una fila de productos.");
      return;
    }

    const startIdx = lines[0].toLowerCase().startsWith("nombre") ? 1 : 0;
    const dataLines = lines.slice(startIdx);
    if (!dataLines.length) {
      setFeedback("No se encontraron filas de datos debajo del encabezado.");
      return;
    }

    let created = 0;
    let updated = 0;

    onUpdateProducts((current) => {
      const next = [...current];
      for (const line of dataLines) {
        const sep = line.includes(";") ? ";" : ",";
        const cols = line.split(sep).map((c) => c.trim());
        const name = cols[0];
        if (!name) continue;
        const category = cols[1] || "General";
        const cost = Math.max(0, Number((cols[2] || "0").replace(",", ".")) || 0);
        const price = Math.max(0, Number((cols[3] || "0").replace(",", ".")) || 0);
        const stock = Math.max(0, Math.round(Number(cols[4] || "0") || 0));
        const minStock = Math.max(0, Math.round(Number(cols[5] || "5") || 5));

        const existingIndex = next.findIndex(
          (item) => item.name.trim().toLowerCase() === name.toLowerCase()
        );

        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            category,
            cost: cost > 0 ? cost : next[existingIndex].cost,
            price: price > 0 ? price : next[existingIndex].price,
            stock: next[existingIndex].stock + stock,
            minStock,
            updatedAt: new Date().toISOString()
          };
          updated++;
        } else {
          next.unshift({
            id: `csv-${crypto.randomUUID()}`,
            barcode: String(Math.floor(7790000000000 + Math.random() * 899999999)),
            name,
            category,
            supplier: "Importación CSV",
            stock,
            minStock,
            cost,
            price,
            sold30d: 0,
            source: "local",
            active: true,
            updatedAt: new Date().toISOString()
          });
          created++;
        }
      }
      return next;
    });

    setFeedback(`Importación lista: ${created} producto(s) nuevos y ${updated} actualizado(s).`);
  }

  function handleExportAccountantPack() {
    const header = [
      "Producto",
      "Codigo de barras",
      "Categoria",
      "Proveedor",
      "Stock actual",
      "Stock minimo",
      "Costo unitario",
      "Precio venta",
      "Margen %",
      "Valuacion costo",
      "Valuacion venta"
    ].join(";");

    const rows = products.map((p) => {
      const margin = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(1) : "0.0";
      return [
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${p.barcode || ""}"`,
        `"${(p.category || "").replace(/"/g, '""')}"`,
        `"${(p.supplier || "").replace(/"/g, '""')}"`,
        p.stock,
        p.minStock,
        p.cost.toFixed(2),
        p.price.toFixed(2),
        margin,
        (p.stock * p.cost).toFixed(2),
        (p.stock * p.price).toFixed(2)
      ].join(";");
    });

    const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `global-stock-pack-contador-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback("Pack Contador descargado en formato CSV compatible con Excel.");
  }

  function handleCsvFileUpload(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCsvText(reader.result);
        setFeedback(`Archivo "${file.name}" cargado. Revisá las filas y tocá Importar.`);
      }
    };
    reader.readAsText(file, "utf-8");
  }

  const tabs: Array<{ id: HubTab; label: string; icon: React.ReactNode }> = [
    { id: "search", label: "Buscar", icon: <Search size={13} /> },
    { id: "parked", label: `En espera (${parkedTickets.length})`, icon: <PauseCircle size={13} /> },
    { id: "credit", label: `Fiado (${creditAccounts.length})`, icon: <UserCheck size={13} /> },
    { id: "labels", label: "Etiquetas", icon: <Printer size={13} /> },
    { id: "bulk-price", label: "Precios", icon: <Percent size={13} /> },
    { id: "csv-import", label: "CSV", icon: <FileSpreadsheet size={13} /> }
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback("");
          setOpen(true);
        }}
        title="Centro de operaciones rápidas (Ctrl + K)"
        className="fixed bottom-[calc(154px+env(safe-area-inset-bottom,0px))] right-4 z-40 flex h-11 items-center gap-2 rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3.5 text-xs font-semibold text-[var(--apex-text)] shadow-[0_10px_28px_rgba(0,0,0,.14)] backdrop-blur-xl transition hover:border-[var(--apex-accent)] lg:bottom-[88px] lg:right-6"
      >
        <Command size={14} style={{ color: accentColors.main }} />
        <span className="hidden sm:inline">Acciones rápidas</span>
        <kbd className="rounded bg-[var(--apex-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--apex-muted)]">
          Ctrl+K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[230] flex items-start justify-center bg-black/55 p-3 pt-[max(20px,6vh)] backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-h-[86dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-text)] shadow-[0_32px_90px_rgba(0,0,0,.38)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--apex-border)] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: accentColors.main }}
                  >
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold">Centro de Operaciones Rápidas</h2>
                    <p className="text-[11px] text-[var(--apex-muted)]">
                      Ventas en espera, fiado/WhatsApp, etiquetas de góndola, precios masivos y CSV
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar centro de operaciones"
                  className="grid h-9 w-9 place-items-center rounded-full border border-[var(--apex-border)] bg-[var(--apex-bg)] text-[var(--apex-muted)] hover:text-[var(--apex-text)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--apex-border)] bg-[var(--apex-bg)] px-4 py-2.5">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setFeedback("");
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      tab === item.id
                        ? "text-white"
                        : "border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-text)]"
                    }`}
                    style={tab === item.id ? { backgroundColor: accentColors.main } : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleExportAccountantPack}
                  className="ml-auto flex items-center gap-1.5 rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--apex-text)] transition hover:border-[var(--apex-accent)]"
                >
                  <Download size={13} />
                  Pack Contador CSV
                </button>
              </div>

              {feedback && (
                <div className="border-b border-[var(--apex-border)] bg-emerald-500/10 px-5 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {feedback}
                </div>
              )}

              <div className="apex-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
                {tab === "search" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--apex-muted)]"
                      />
                      <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscá un módulo (ej. ARCA, Caja) o un producto por nombre/código…"
                        className="apex-input w-full py-2.5 pl-10 pr-4 text-sm"
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--apex-muted)]">
                        Módulos y accesos directos
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {filteredModules.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onNavigateModule(item.id);
                              setOpen(false);
                            }}
                            className="flex items-center justify-between rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-3.5 py-2.5 text-left transition hover:border-[var(--apex-accent)]"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="truncate text-xs font-bold">{item.label}</div>
                              <div className="truncate text-[11px] text-[var(--apex-muted)]">
                                {item.hint}
                              </div>
                            </div>
                            <ArrowRight size={14} className="shrink-0 text-[var(--apex-muted)]" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--apex-muted)]">
                        Productos en inventario ({products.length})
                      </p>
                      <div className="space-y-1.5">
                        {filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              onNavigateModule("inventory");
                              setOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-3.5 py-2 text-left text-xs transition hover:border-[var(--apex-accent)]"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold">{p.name}</span>
                              <span className="ml-2 text-[11px] text-[var(--apex-muted)]">
                                {p.category} · Stock: {p.stock} u.
                              </span>
                            </div>
                            <span className="shrink-0 font-bold tabular-nums">
                              {formatMoney(p.price, currency, locale)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab === "parked" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold">Carrito activo en Caja</p>
                          <p className="text-[11px] text-[var(--apex-muted)]">
                            {activeCartSummary.items.length
                              ? `${activeCartSummary.items.length} ítem(s) · Total: ${formatMoney(activeCartSummary.total, currency, locale)}`
                              : "El carrito de Caja está vacío en este momento."}
                          </p>
                        </div>
                        <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
                          <input
                            type="text"
                            value={parkLabel}
                            onChange={(e) => setParkLabel(e.target.value)}
                            placeholder="Ej. Mesa 3 / Juan..."
                            className="apex-input w-full px-3 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleParkCurrentCart}
                            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
                            style={{ backgroundColor: accentColors.main }}
                          >
                            Pausar venta
                          </button>
                        </div>
                      </div>
                    </div>

                    {parkedTickets.length === 0 ? (
                      <p className="py-6 text-center text-xs text-[var(--apex-muted)]">
                        No hay ventas pausadas. Cuando un cliente se olvide algo en mostrador, pausá su carrito acá para seguir cobrando sin perder los ítems.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {parkedTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-4 py-3"
                          >
                            <div>
                              <div className="text-xs font-bold">
                                {ticket.label}{" "}
                                <span className="ml-1.5 text-[11px] font-normal text-[var(--apex-muted)]">
                                  ({ticket.createdAt})
                                </span>
                              </div>
                              <div className="mt-0.5 text-[11px] text-[var(--apex-muted)]">
                                {ticket.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold tabular-nums">
                                {formatMoney(ticket.total, currency, locale)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResumeParked(ticket)}
                                className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                                style={{ backgroundColor: accentColors.main }}
                              >
                                <PlayCircle size={13} />
                                Retomar
                              </button>
                              <button
                                type="button"
                                onClick={() => saveParked(parkedTickets.filter((t) => t.id !== ticket.id))}
                                aria-label="Eliminar ticket en espera"
                                className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--apex-border)] text-[var(--apex-muted)] hover:text-red-500"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "credit" && (
                  <div className="space-y-4">
                    <div className="grid gap-2.5 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4 sm:grid-cols-4">
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Cliente (ej. Carlos Pérez)"
                        className="apex-input px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="WhatsApp (ej. 54911...)"
                        className="apex-input px-3 py-2 text-xs"
                      />
                      <input
                        type="number"
                        value={clientAmount}
                        onChange={(e) => setClientAmount(e.target.value)}
                        placeholder="Monto ($)"
                        className="apex-input px-3 py-2 text-xs tabular-nums"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddCreditMovement("charge")}
                          className="flex-1 rounded-xl px-2.5 py-2 text-[11px] font-bold text-white"
                          style={{ backgroundColor: accentColors.main }}
                        >
                          + Fiar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddCreditMovement("payment")}
                          className="flex-1 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-2.5 py-2 text-[11px] font-bold"
                        >
                          - Pago
                        </button>
                      </div>
                    </div>

                    {creditAccounts.length === 0 ? (
                      <p className="py-5 text-center text-xs text-[var(--apex-muted)]">
                        Registrá saldos fiados o pagos parciales de tus clientes y enviá el resumen por WhatsApp en un clic.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {creditAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-4 py-3"
                          >
                            <div>
                              <div className="text-xs font-bold">{acc.name}</div>
                              <div className="text-[11px] text-[var(--apex-muted)]">
                                {acc.phone || "Sin teléfono"} · Actualizado: {acc.updatedAt}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold tabular-nums">
                                Saldo: {formatMoney(acc.balance, currency, locale)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSendWhatsappReminder(acc)}
                                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                              >
                                <MessageCircle size={13} />
                                WhatsApp
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "labels" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-[var(--apex-muted)]">
                        Seleccioná los productos que querés imprimir (si no marcás ninguno, se imprimen hasta los primeros 24).
                      </p>
                      <button
                        type="button"
                        onClick={handlePrintShelfLabels}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white"
                        style={{ backgroundColor: accentColors.main }}
                      >
                        <Printer size={14} />
                        Imprimir etiquetas ({selectedLabelIds.length || Math.min(24, products.length)})
                      </button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {products.slice(0, 30).map((p) => {
                        const checked = selectedLabelIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-3 py-2 text-xs"
                          >
                            <span className="flex items-center gap-2 truncate pr-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setSelectedLabelIds((prev) =>
                                    prev.includes(p.id)
                                      ? prev.filter((id) => id !== p.id)
                                      : [...prev, p.id]
                                  )
                                }
                              />
                              <span className="truncate font-semibold">{p.name}</span>
                            </span>
                            <span className="shrink-0 font-bold tabular-nums">
                              {formatMoney(p.price, currency, locale)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tab === "bulk-price" && (
                  <div className="space-y-4">
                    <p className="text-xs leading-5 text-[var(--apex-muted)]">
                      Aplicá actualizaciones masivas por inflación o cambio de lista de proveedor sobre todo el catálogo o una categoría específica, con redondeo automático.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-semibold">
                        Categoría objetivo
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="apex-input mt-1 w-full px-3 py-2 text-xs"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat === "ALL" ? `Todo el catálogo (${products.length})` : cat}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-xs font-semibold">
                        Tipo de ajuste
                        <select
                          value={adjustMode}
                          onChange={(e) => setAdjustMode(e.target.value as "percent" | "fixed")}
                          className="apex-input mt-1 w-full px-3 py-2 text-xs"
                        >
                          <option value="percent">Porcentaje (%)</option>
                          <option value="fixed">Monto fijo ({currency})</option>
                        </select>
                      </label>

                      <label className="block text-xs font-semibold">
                        Valor ({adjustMode === "percent" ? "ej. 15 o -5" : "ej. 500 o -200"})
                        <input
                          type="number"
                          step="any"
                          value={adjustValue}
                          onChange={(e) => setAdjustValue(e.target.value)}
                          className="apex-input mt-1 w-full px-3 py-2 text-xs tabular-nums"
                        />
                      </label>

                      <label className="block text-xs font-semibold">
                        Redondeo automático
                        <select
                          value={String(roundStep)}
                          onChange={(e) => setRoundStep(Number(e.target.value))}
                          className="apex-input mt-1 w-full px-3 py-2 text-xs"
                        >
                          <option value="0">Sin redondeo (centavos exactos)</option>
                          <option value="10">Redondear a $10</option>
                          <option value="50">Redondear a $50</option>
                          <option value="100">Redondear a $100</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-4 py-3">
                      <span className="text-xs text-[var(--apex-muted)]">
                        Productos alcanzados: <strong className="text-[var(--apex-text)]">{affectedCount}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleBulkPriceApply}
                        className="rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
                        style={{ backgroundColor: accentColors.main }}
                      >
                        Aplicar actualización
                      </button>
                    </div>
                  </div>
                )}

                {tab === "csv-import" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-[var(--apex-muted)]">
                        Formato: <strong>Nombre, Categoría, Costo, Precio, Stock, Mínimo</strong>. Si el nombre ya existe, suma el stock y actualiza precios.
                      </p>
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--apex-accent)]">
                        <Upload size={13} />
                        Subir archivo .CSV
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => handleCsvFileUpload(e.target.files?.[0])}
                        />
                      </label>
                    </div>

                    <textarea
                      rows={6}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      className="apex-input w-full p-3 font-mono text-xs"
                      placeholder="Nombre,Categoria,Costo,Precio,Stock,Minimo"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleCsvImport}
                        className="rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
                        style={{ backgroundColor: accentColors.main }}
                      >
                        Importar productos al inventario
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}