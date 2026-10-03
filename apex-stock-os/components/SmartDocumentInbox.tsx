"use client";

import {
  CheckCircle2,
  FileScan,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";

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

type ExtractedItem = {
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
  items: ExtractedItem[];
  createdAt: string;
};

const STORAGE_KEY = "global-stock-smart-documents-v1";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function tr(
  language: LanguageCode,
  values: Partial<Record<LanguageCode, string>>
) {
  return values[language] ?? values.es ?? values.en ?? "";
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      resolve(value.includes(",") ? value.split(",")[1] ?? "" : value);
    };
    reader.onerror = () => reject(reader.error);
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SmartDocument[];
        if (Array.isArray(parsed)) setDocuments(parsed);
      }
    } catch {
      setDocuments([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents.slice(0, 250)));
  }, [documents, ready]);

  async function scanFile(file: File) {
    setMessage("");

    if (file.size > MAX_FILE_BYTES) {
      setMessage(
        tr(language, {
          es: "El archivo supera el límite de 8 MB.",
          en: "The file exceeds the 8 MB limit."
        })
      );
      return;
    }

    if (
      !file.type.startsWith("image/") &&
      file.type !== "application/pdf"
    ) {
      setMessage(
        tr(language, {
          es: "Usá una imagen o un PDF.",
          en: "Use an image or PDF."
        })
      );
      return;
    }

    if (demoMode) {
      setMessage(
        tr(language, {
          es: "El escaneo con IA está desactivado en la cuenta demo para no consumir servicios externos. Iniciá sesión con una cuenta real para analizar comprobantes.",
          en: "AI document scanning is disabled in demo mode. Sign in with a real account to analyze documents."
        })
      );
      return;
    }

    setScanning(true);

    try {
      const base64 = await fileToBase64(file);
      const supabase = getSupabaseBrowserClient();
      const accessToken = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : null;

      const response = await fetch("/api/document-intelligence", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {})
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          base64,
          language,
          currency,
          businessId
        })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        document?: Omit<SmartDocument, "id" | "filename" | "createdAt">;
        code?: string;
      };

      if (!response.ok || !payload.document) {
        throw new Error(payload.code || "SCAN_FAILED");
      }

      setDocuments((current) => [
        {
          id: crypto.randomUUID(),
          filename: file.name,
          createdAt: new Date().toISOString(),
          supplier: payload.document.supplier || "",
          documentNumber: payload.document.documentNumber || "",
          date: payload.document.date || "",
          subtotal:
            payload.document.subtotal === null
              ? null
              : Number(payload.document.subtotal),
          tax:
            payload.document.tax === null
              ? null
              : Number(payload.document.tax),
          total:
            payload.document.total === null
              ? null
              : Number(payload.document.total),
          currency: payload.document.currency || currency,
          category: payload.document.category || "",
          confidence:
            payload.document.confidence === null
              ? null
              : Number(payload.document.confidence),
          items: Array.isArray(payload.document.items)
            ? payload.document.items
            : []
        },
        ...current
      ]);

      setMessage(
        tr(language, {
          es: "Comprobante leído. Revisá los datos antes de usarlo en la gestión.",
          en: "Document read. Review the extracted data before using it."
        })
      );
    } catch {
      setMessage(
        tr(language, {
          es: "No pude leer ese comprobante. Podés volver a intentarlo o cargarlo manualmente debajo.",
          en: "I could not read that document. Try again or enter it manually below."
        })
      );
    } finally {
      setScanning(false);
    }
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await scanFile(file);
  }

  function updateDocument(
    id: string,
    patch: Partial<SmartDocument>
  ) {
    setDocuments((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  function removeDocument(id: string) {
    setDocuments((current) => current.filter((item) => item.id !== id));
  }

  const money = (value: number | null, documentCurrency: string) => {
    if (value === null || !Number.isFinite(value)) return "—";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: documentCurrency || currency,
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return String(value);
    }
  };

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
              {tr(language, {
                es: "Escaneá tickets y facturas sin cargar datos a mano",
                en: "Scan receipts and invoices without retyping data",
                pt: "Digitalize recibos e faturas sem digitar tudo",
                fr: "Scannez tickets et factures sans ressaisie",
                de: "Belege und Rechnungen automatisch erfassen"
              })}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
              {tr(language, {
                es: "Subí una foto o PDF. Global Stock intenta identificar proveedor, fecha, número, subtotal, impuestos, total, moneda e ítems. Siempre queda en revisión antes de afectar contabilidad o stock.",
                en: "Upload a photo or PDF. Global Stock extracts supplier, date, number, subtotal, tax, total, currency and line items. Nothing affects accounting or inventory until you review it."
              })}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={onFileChange}
            />
            <button
              type="button"
              disabled={scanning}
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-5 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(143,0,0,.25)] disabled:opacity-60"
            >
              {scanning ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <UploadCloud size={17} />
              )}
              {scanning
                ? tr(language, { es: "Leyendo…", en: "Reading…" })
                : tr(language, { es: "Escanear comprobante", en: "Scan document" })}
            </button>
          </div>
        </div>

        {message && (
          <div className="border-t border-[var(--apex-border)] bg-[var(--apex-bg)]/45 px-4 py-3 text-xs text-[var(--apex-muted)] sm:px-5">
            {message}
          </div>
        )}
      </section>

      <section className="apex-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--apex-border)] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <FileScan size={17} />
            <h3 className="font-semibold">
              {tr(language, { es: "Bandeja inteligente", en: "Smart inbox" })}
            </h3>
          </div>
          <span className="text-xs font-semibold text-[var(--apex-muted)]">
            {documents.length}
          </span>
        </div>

        <div className="divide-y divide-[var(--apex-border)]">
          {documents.length ? (
            documents.map((document) => (
              <article key={document.id} className="p-4 sm:p-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <input
                        className="apex-input min-w-[180px] flex-1 p-2 text-sm font-semibold"
                        value={document.supplier}
                        placeholder={tr(language, { es: "Proveedor", en: "Supplier" })}
                        onChange={(event) =>
                          updateDocument(document.id, {
                            supplier: event.target.value
                          })
                        }
                      />
                      <input
                        className="apex-input w-36 p-2 text-xs"
                        value={document.documentNumber}
                        placeholder="N°"
                        onChange={(event) =>
                          updateDocument(document.id, {
                            documentNumber: event.target.value
                          })
                        }
                      />
                      <input
                        className="apex-input w-36 p-2 text-xs"
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
                        ? ` · confianza ${Math.round(document.confidence * 100)}%`
                        : ""}
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <SmallMetric
                        label={tr(language, { es: "Subtotal", en: "Subtotal" })}
                        value={money(document.subtotal, document.currency)}
                      />
                      <SmallMetric
                        label={tr(language, { es: "Impuestos", en: "Tax" })}
                        value={money(document.tax, document.currency)}
                      />
                      <SmallMetric
                        label="Total"
                        value={money(document.total, document.currency)}
                      />
                      <SmallMetric
                        label={tr(language, { es: "Categoría", en: "Category" })}
                        value={document.category || "—"}
                      />
                    </div>

                    {document.items.length > 0 && (
                      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--apex-border)]">
                        <table className="w-full min-w-[620px] text-left text-xs">
                          <thead className="bg-[var(--apex-bg)]/60 text-[var(--apex-muted)]">
                            <tr>
                              <th className="px-3 py-2">
                                {tr(language, { es: "Detalle", en: "Item" })}
                              </th>
                              <th className="px-3 py-2">
                                {tr(language, { es: "Cant.", en: "Qty" })}
                              </th>
                              <th className="px-3 py-2">
                                {tr(language, { es: "Unitario", en: "Unit" })}
                              </th>
                              <th className="px-3 py-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {document.items.slice(0, 30).map((item, index) => (
                              <tr key={index} className="border-t border-[var(--apex-border)]">
                                <td className="px-3 py-2">{item.description}</td>
                                <td className="px-3 py-2">{item.quantity ?? "—"}</td>
                                <td className="px-3 py-2">{money(item.unitPrice, document.currency)}</td>
                                <td className="px-3 py-2 font-semibold">{money(item.total, document.currency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeDocument(document.id)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--apex-border)] text-[var(--apex-muted)] hover:text-red-500"
                    aria-label={tr(language, { es: "Eliminar", en: "Delete" })}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[var(--apex-muted)]">
              {tr(language, {
                es: "Todavía no escaneaste comprobantes.",
                en: "No scanned documents yet."
              })}
            </div>
          )}
        </div>
      </section>

      <DocumentsHub
        language={language}
        currency={currency}
        locale={locale}
      />
    </div>
  );
}

function SmallMetric({
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
