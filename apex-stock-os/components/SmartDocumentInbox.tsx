"use client";

import {
  FileUp,
  Loader2,
  ScanLine,
  Sparkles,
  Trash2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { DocumentsHub } from "./BusinessOperations";
import { FiscalDocumentsCenter } from "./FiscalDocumentsCenter";
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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setDocuments(parsed as SmartDocument[]);
        }
      }
    } catch {
      setDocuments([]);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(documents.slice(0, 250))
    );
  }, [documents, loaded]);

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
      setMessage(
        label(
          language,
          "El escaneo con IA está desactivado en la cuenta demo para no consumir servicios externos. Iniciá sesión con una cuenta real para analizar comprobantes.",
          "AI scanning is disabled in demo mode. Sign in with a real account to analyze documents."
        )
      );
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
        createdAt: new Date().toISOString()
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

  function updateDocument(
    id: string,
    patch: Partial<SmartDocument>
  ) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === id
          ? { ...document, ...patch }
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
              Document Intelligence
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
              {label(
                language,
                "Escaneá tickets y facturas sin cargar datos a mano",
                "Scan receipts and invoices without retyping data"
              )}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
              {label(
                language,
                "Subí una foto o PDF. Global Stock lee proveedor, fecha, número, subtotal, impuestos, total, moneda e ítems. La información queda para revisión antes de afectar la operación.",
                "Upload a photo or PDF. Global Stock reads supplier, date, number, subtotal, tax, total, currency and line items. Data stays in review before affecting operations."
              )}
            </p>
          </div>

          <div>
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
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-5 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(143,0,0,.25)] disabled:opacity-60"
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
          <span className="text-xs font-semibold text-[var(--apex-muted)]">
            {documents.length}
          </span>
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
                        value={document.date}
                        onChange={(event) =>
                          updateDocument(document.id, {
                            date: event.target.value
                          })
                        }
                      />
                    </div>

                    <p className="mt-2 truncate text-[11px] text-[var(--apex-muted)]">
                      {document.filename}
                      {document.confidence !== null
                        ? ` · ${Math.round(document.confidence * 100)}%`
                        : ""}
                    </p>

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

                  <button
                    type="button"
                    onClick={() =>
                      setDocuments((current) =>
                        current.filter((item) => item.id !== document.id)
                      )
                    }
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--apex-border)] text-[var(--apex-muted)] hover:text-red-500"
                    aria-label={label(language, "Eliminar", "Delete")}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <FiscalDocumentsCenter
        language={language}
        currency={currency}
        locale={locale}
        businessId={businessId}
        demoMode={demoMode}
      />

      <DocumentsHub
        language={language}
        currency={currency}
        locale={locale}
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
