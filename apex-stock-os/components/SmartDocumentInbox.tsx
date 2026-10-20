"use client";

import {
  BadgeCheck,
  CircleCheck,
  FileUp,
  Loader2,
  ScanLine,
  Sparkles,
  Trash2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  loadCloudWorkspace,
  saveCloudWorkspace
} from "@/lib/cloud-workspace";
import { businessStorageKey } from "@/lib/business-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { DocumentsHub } from "./BusinessOperations";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  language: LanguageCode;
  currency: string;
  locale: string;
  businessId: string | null;
  demoMode: boolean;
};

type SmartItem = {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  total: number | null;
};

type SmartDocument = {
  id: string;
  filename: string;
  supplier: string;
  documentNumber: string;
  date: string;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  currency: string;
  category: string;
  confidence: number | null;
  items: SmartItem[];
  createdAt: string;
  approvedAt?: string | null;
  expenseId?: string | null;
};

type ScanResponse = {
  document?: {
    supplier?: string;
    documentNumber?: string;
    date?: string;
    subtotal?: number | null;
    tax?: number | null;
    total?: number | null;
    currency?: string;
    category?: string;
    confidence?: number | null;
    items?: SmartItem[];
  };
  code?: string;
};

const STORAGE_KEY = "global-stock-smart-documents-v1";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function label(language: LanguageCode, es: string, en: string) {
  return language === "en" ? en : es;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const value = String(reader.result ?? "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };

    reader.onerror = () => reject(new Error("FILE_READ_ERROR"));
    reader.readAsDataURL(file);
  });
}

export function SmartDocumentInbox({
  language,
  currency,
  locale,
  businessId,
  demoMode
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "local" | "saving" | "saved" | "error">("idle");
  const [retryToken, setRetryToken] = useState(0);
  const [postingId, setPostingId] = useState<string | null>(null);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const revisionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let next: SmartDocument[] = [];
      const storageKey = businessStorageKey(
        STORAGE_KEY,
        businessId,
        demoMode
      );

      let pendingLocal: SmartDocument[] | null = null;
      try {
        const pendingRaw = storageKey && !demoMode
          ? window.localStorage.getItem(storageKey + ":pending")
          : null;
        if (pendingRaw) {
          const parsed: unknown = JSON.parse(pendingRaw);
          if (Array.isArray(parsed)) pendingLocal = parsed as SmartDocument[];
        }
        const raw = storageKey
          ? window.localStorage.getItem(storageKey)
          : null;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            next = parsed as SmartDocument[];
          }
        }
      } catch {
        next = [];
      }

      if (!demoMode && businessId) {
        const cloud = await loadCloudWorkspace(businessId);
        if (Array.isArray(cloud?.state.smartDocuments)) {
          next = cloud.state.smartDocuments as SmartDocument[];
        }
      }

      // Unsent local edits win over an older cloud snapshot.
      if (pendingLocal) next = pendingLocal;
      if (!cancelled) {
        setDocuments(next);
        setSaveState(pendingLocal ? "error" : demoMode ? "local" : "idle");
        setLoaded(true);
      }
    }

    setLoaded(false);
    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [businessId, demoMode]);

  useEffect(() => {
    if (!loaded) return;
    const storageKey = businessStorageKey(STORAGE_KEY, businessId, demoMode);
    const snapshot = documents.slice(0, 250);
    const revision = ++revisionRef.current;

    try {
      if (storageKey) {
        window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
        if (!demoMode && businessId) {
          window.localStorage.setItem(storageKey + ":pending", JSON.stringify(snapshot));
        }
      }
    } catch {
      setSaveState("error");
      return;
    }

    if (demoMode || !businessId) {
      setSaveState("local");
      return;
    }

    setSaveState("saving");
    let cancelled = false;
    const timer = window.setTimeout(() => {
      // Serialize requests so stale responses cannot overwrite newer edits.
      syncQueueRef.current = syncQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (cancelled || revision !== revisionRef.current) return;
          let success = false;
          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              success = await saveCloudWorkspace(businessId, { smartDocuments: snapshot });
            } catch {
              success = false;
            }
            if (success || cancelled || revision !== revisionRef.current) break;
            await new Promise<void>((resolve) =>
              window.setTimeout(resolve, (attempt + 1) * 650)
            );
          }
          if (cancelled || revision !== revisionRef.current) return;
          if (success) {
            try {
              if (storageKey) window.localStorage.removeItem(storageKey + ":pending");
            } catch { /* Local copy remains as backup. */ }
            setSaveState("saved");
          } else {
            setSaveState("error");
          }
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [businessId, demoMode, documents, loaded, retryToken]);

  useEffect(() => {
    if (saveState !== "error") return;
    const onReconnect = () => setRetryToken((value) => value + 1);
    window.addEventListener("online", onReconnect);
    return () => window.removeEventListener("online", onReconnect);
  }, [saveState]);

  async function scan(file: File) {
    setMessage("");

    if (file.size > MAX_FILE_BYTES) {
      setMessage(
        label(
          language,
          "El archivo supera el límite de 8 MB.",
          "The file exceeds the 8 MB limit."
        )
      );
      return;
    }

    if (
      !file.type.startsWith("image/") &&
      file.type !== "application/pdf"
    ) {
      setMessage(
        label(
          language,
          "Usá una imagen o un PDF.",
          "Use an image or PDF."
        )
      );
      return;
    }

    if (demoMode) {
      setMessage(label(language,
        "El escaneo real requiere una cuenta. Probá el comprobante ficticio de ejemplo.",
        "Real AI scanning requires an account. Try the fictional sample document."
      ));
      return;
    }

    setScanning(true);

    try {
      const base64 = await readAsBase64(file);
      const supabase = getSupabaseBrowserClient();
      const session = supabase
        ? (await supabase.auth.getSession()).data.session
        : null;

      const response = await fetch("/api/document-intelligence", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {})
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          base64,
          language,
          currency
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ScanResponse;
      const result = payload.document;

      if (!response.ok || !result) {
        throw new Error(payload.code || "SCAN_FAILED");
      }

      const next: SmartDocument = {
        id: crypto.randomUUID(),
        filename: file.name,
        supplier: result.supplier ?? "",
        documentNumber: result.documentNumber ?? "",
        date: result.date ?? "",
        subtotal: result.subtotal ?? null,
        tax: result.tax ?? null,
        total: result.total ?? null,
        currency: result.currency || currency,
        category: result.category ?? "",
        confidence: result.confidence ?? null,
        items: Array.isArray(result.items) ? result.items : [],
        createdAt: new Date().toISOString(),
        approvedAt: null
      };

      setDocuments((current) => [next, ...current]);
      setMessage(
        label(
          language,
          "Comprobante leído. Revisá los datos antes de usarlo.",
          "Document read. Review the data before using it."
        )
      );
    } catch {
      setMessage(
        label(
          language,
          "No pude leer ese comprobante. Volvé a intentarlo o cargalo manualmente debajo.",
          "I could not read that document. Try again or enter it manually below."
        )
      );
    } finally {
      setScanning(false);
    }
  }

  function loadDemoSample() {
    const now = new Date().toISOString();
    setDocuments((current) => [{
      id: crypto.randomUUID(),
      filename: "EJEMPLO · comprobante ficticio",
      supplier: "Proveedor de prueba",
      documentNumber: "DEMO-0001",
      date: now.slice(0, 10),
      subtotal: 15000,
      tax: 3150,
      total: 18150,
      currency,
      category: "Mercadería",
      confidence: null,
      items: [{ description: "Producto de ejemplo", quantity: 3, unitPrice: 5000, total: 15000 }],
      createdAt: now,
      approvedAt: null,
      expenseId: null
    }, ...current]);
    setMessage(label(language,
      "Ejemplo cargado con datos simulados; no fueron extraídos por IA.",
      "Sample loaded with simulated data, not extracted by AI."
    ));
  }

  async function registerApprovedExpense(document: SmartDocument) {
    if (demoMode || !businessId || !document.approvedAt || document.expenseId) return;
    if (typeof document.total !== "number" || !Number.isFinite(document.total) || document.total <= 0) {
      setMessage(label(language, "Revisá el importe total antes de registrar el gasto.", "Check the total before recording the expense."));
      return;
    }
    if (!window.confirm(label(language,
      "¿Registrar este comprobante como gasto real del negocio? No modifica caja ni stock automáticamente.",
      "Record this document as a real expense? It does not modify cash or stock automatically."
    ))) return;

    setPostingId(document.id);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("AUTH");
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user.id) throw new Error("AUTH");
      const { error } = await supabase.from("global_stock_expenses").insert({
        id: document.id,
        business_id: businessId,
        user_id: data.session.user.id,
        category: document.category.trim() || "Comprobantes",
        description: [document.supplier, document.documentNumber].filter(Boolean).join(" · ") || document.filename,
        amount: document.total,
        currency: document.currency,
        payment_method: null
      });
      // Identical UUID prevents a duplicate if a successful response was lost.
      if (error && error.code !== "23505") throw error;
      updateDocument(document.id, { expenseId: document.id });
      setMessage(label(language,
        "Gasto registrado; caja, stock y emisión fiscal no se modificaron.",
        "Expense recorded; cash, stock and fiscal issuance were not changed."
      ));
    } catch {
      setMessage(label(language,
        "No se pudo registrar el gasto. Verificá conexión y permisos e intentá de nuevo.",
        "Expense could not be recorded. Check connection and permissions and retry."
      ));
    } finally {
      setPostingId(null);
    }
  }

  function updateDocument(
    id: string,
    patch: Partial<SmartDocument>
  ) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === id
          ? {
              ...document,
              ...patch,
              ...(document.approvedAt && patch.approvedAt === undefined && !document.expenseId
                ? { approvedAt: null }
                : {})
            }
          : document
      )
    );
  }

  function money(value: number | null, code: string) {
    if (value === null) return "—";

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code || currency,
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return String(value);
    }
  }

  return (
    <div className="space-y-5">
      <section className="apex-card overflow-hidden">
        <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8F0000]">
              <Sparkles size={13} />
              {label(language, "Gestión documental", "Document management")}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
              {label(
                language,
                "Comprobantes de compras y gastos",
                "Purchase and expense documents"
              )}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
              {label(
                language,
                "Escaneá tickets y facturas que recibiste, revisá sus datos y registrá gastos cuando corresponda. Aquí también administrás comprobantes internos; la emisión de facturas oficiales se realiza únicamente en ARCA Facturación.",
                "Scan receipts and supplier invoices, review their details, and record expenses when appropriate. Manage internal documents here; official fiscal issuance belongs exclusively in ARCA Invoicing."
              )}
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 xl:w-[245px]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void scan(file);
              }}
            />
            <button
              type="button"
              disabled={scanning}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--apex-accent)] px-4 text-xs font-semibold text-white shadow-sm transition-[transform,filter] hover:brightness-110 active:scale-[.985] disabled:opacity-60"
            >
              {scanning ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <FileUp size={17} />
              )}
              {scanning
                ? label(language, "Leyendo…", "Reading…")
                : label(language, "Escanear comprobante", "Scan document")}
            </button>
            {demoMode ? (
              <button
                type="button"
                onClick={loadDemoSample}
                className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 text-xs font-semibold text-[var(--apex-text)] transition-colors hover:bg-[var(--apex-bg)]"
              >
                {label(language, "Probar comprobante de ejemplo", "Try sample document")}
              </button>
            ) : null}
          </div>
        </div>

        {message ? (
          <div className="border-t border-[var(--apex-border)] bg-[var(--apex-bg)]/45 px-4 py-3 text-xs text-[var(--apex-muted)] sm:px-5">
            {message}
          </div>
        ) : null}
      </section>

      <section className="apex-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--apex-border)] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <ScanLine size={17} />
            <h3 className="font-semibold">
              {label(language, "Bandeja inteligente", "Smart inbox")}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--apex-muted)]">{documents.length}</span>
            <span role="status" aria-live="polite" className={
              "text-[11px] font-semibold " +
              (saveState === "error" ? "text-amber-500" : "text-[var(--apex-muted)]")
            }>
              {saveState === "error"
                ? label(language, "Cambios pendientes · nube sin sincronizar", "Pending changes · cloud not synced")
                : saveState === "saving"
                  ? label(language, "Guardando…", "Saving…")
                  : saveState === "saved"
                    ? label(language, "Sincronizado", "Synced")
                    : saveState === "local"
                      ? label(language, "Solo en este dispositivo", "Only on this device")
                      : null}
            </span>
            {saveState === "error" && !demoMode && businessId ? (
              <button
                type="button"
                className="rounded-lg border border-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-500"
                onClick={() => setRetryToken((value) => value + 1)}
              >
                {label(language, "Reintentar", "Retry")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="divide-y divide-[var(--apex-border)]">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--apex-muted)]">
              {label(
                language,
                "Todavía no escaneaste comprobantes.",
                "No scanned documents yet."
              )}
            </div>
          ) : (
            documents.map((document) => (
              <article key={document.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        className="apex-input p-2 text-sm font-semibold"
                        disabled={Boolean(document.expenseId)}
                        aria-label={label(language, "Proveedor", "Supplier")}
                        value={document.supplier}
                        placeholder={label(language, "Proveedor", "Supplier")}
                        onChange={(event) =>
                          updateDocument(document.id, {
                            supplier: event.target.value
                          })
                        }
                      />
                      <input
                        className="apex-input p-2 text-sm"
                        disabled={Boolean(document.expenseId)}
                        aria-label={label(language, "Número de comprobante", "Document number")}
                        value={document.documentNumber}
                        placeholder="N°"
                        onChange={(event) =>
                          updateDocument(document.id, {
                            documentNumber: event.target.value
                          })
                        }
                      />
                      <input
                        className="apex-input p-2 text-sm"
                        type="date"
                        disabled={Boolean(document.expenseId)}
                        aria-label={label(language, "Fecha", "Date")}
                        value={document.date}
                        onChange={(event) =>
                          updateDocument(document.id, {
                            date: event.target.value
                          })
                        }
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--apex-muted)]">
                      <span className="truncate">
                        {document.filename}
                        {document.confidence !== null
                          ? ` · ${Math.round(document.confidence * 100)}%`
                          : ""}
                      </span>
                      {document.expenseId ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-500">
                          <CircleCheck size={12} />
                          {label(language, "Gasto registrado", "Expense recorded")}
                        </span>
                      ) : document.approvedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-500">
                          <BadgeCheck size={12} />
                          {label(language, "Aprobado", "Approved")}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/10 px-2 py-1 font-semibold text-amber-500">
                          {label(language, "Pendiente de revisión", "Pending review")}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      <Metric label="Subtotal" value={money(document.subtotal, document.currency)} />
                      <Metric label={label(language, "Impuestos", "Tax")} value={money(document.tax, document.currency)} />
                      <Metric label="Total" value={money(document.total, document.currency)} />
                      <Metric label={label(language, "Categoría", "Category")} value={document.category || "—"} />
                    </div>

                    {document.items.length > 0 ? (
                      <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--apex-border)]">
                        <table className="w-full min-w-[560px] text-left text-xs">
                          <thead className="bg-[var(--apex-bg)]/50 text-[var(--apex-muted)]">
                            <tr>
                              <th className="px-3 py-2">{label(language, "Detalle", "Item")}</th>
                              <th className="px-3 py-2">{label(language, "Cant.", "Qty")}</th>
                              <th className="px-3 py-2">{label(language, "Unitario", "Unit")}</th>
                              <th className="px-3 py-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {document.items.slice(0, 30).map((item, index) => (
                              <tr key={`${document.id}-${index}`} className="border-t border-[var(--apex-border)]">
                                <td className="px-3 py-2">{item.description}</td>
                                <td className="px-3 py-2">{item.quantity ?? "—"}</td>
                                <td className="px-3 py-2">{money(item.unitPrice, document.currency)}</td>
                                <td className="px-3 py-2 font-semibold">{money(item.total, document.currency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {document.approvedAt && !document.expenseId && !demoMode ? (
                      <button
                        type="button"
                        disabled={postingId === document.id || saveState !== "saved"}
                        onClick={() => void registerApprovedExpense(document)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#8F0000] px-3 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        <CircleCheck size={15} />
                        {postingId === document.id
                          ? label(language, "Registrando…", "Registering…")
                          : label(language, "Registrar gasto", "Record expense")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={Boolean(document.expenseId)}
                      onClick={() =>
                        updateDocument(document.id, {
                          approvedAt: document.approvedAt
                            ? null
                            : new Date().toISOString()
                        })
                      }
                      className={
                        "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors " +
                        (document.approvedAt
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                          : "border-[var(--apex-border)] bg-[var(--apex-bg)]/35 text-[var(--apex-muted)] hover:text-[var(--apex-text)]")
                      }
                    >
                      <BadgeCheck size={15} />
                      {document.approvedAt
                        ? label(language, "Aprobado", "Approved")
                        : label(language, "Aprobar", "Approve")}
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(document.expenseId)}
                      onClick={() =>
                        setDocuments((current) =>
                          current.filter((item) => item.id !== document.id)
                        )
                      }
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--apex-border)] text-[var(--apex-muted)] hover:text-red-500"
                      aria-label={label(language, "Eliminar", "Delete")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <DocumentsHub
        language={language}
        currency={currency}
        locale={locale}
        businessId={businessId}
        demoMode={demoMode}
      />
    </div>
  );
}

function Metric({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)]/35 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
