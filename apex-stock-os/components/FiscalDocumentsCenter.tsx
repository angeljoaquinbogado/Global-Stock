"use client";

import { ApexSelect } from "@/components/ui/ApexSelect";
import {
  AlertTriangle,
  BadgeCheck,
  FileSignature,
  Loader2,
  Printer,
  ReceiptText,
  Save,
  Send,
  ShieldCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  language: LanguageCode;
  currency: string;
  locale: string;
  businessId: string | null;
  demoMode: boolean;
};

type FiscalProfile = {
  business_id: string;
  country: string;
  legal_name: string;
  tax_id: string;
  tax_condition: string;
  gross_income_number: string | null;
  fiscal_address: string;
  activity_start_date: string | null;
  point_of_sale: number | null;
  provider: string;
  environment: "production" | "testing";
  enabled: boolean;
};

type FiscalDocument = {
  id: string;
  business_id: string;
  sale_id: string | null;
  related_document_id: string | null;
  kind: "invoice" | "credit_note" | "debit_note";
  letter: "A" | "B" | "C" | "M" | "E" | "T" | null;
  status: "draft" | "pending_authorization" | "authorized" | "rejected";
  local_reference: string;
  point_of_sale: number | null;
  voucher_number: number | null;
  customer_name: string;
  customer_document_type: string;
  customer_document_number: string;
  customer_tax_condition: string;
  currency: string;
  exchange_rate: number;
  net_amount: number;
  vat_amount: number;
  exempt_amount: number;
  other_taxes: number;
  total_amount: number;
  concept: string | null;
  due_date: string | null;
  issued_at: string | null;
  authorization_code: string | null;
  authorization_expires_at: string | null;
  qr_url: string | null;
  provider: string;
  rejection_reason: string | null;
  created_at: string;
};

type SaleRow = {
  id: string;
  total: number;
  subtotal: number;
  tax: number;
  currency: string;
  created_at: string;
};

const emptyProfile: Omit<FiscalProfile, "business_id"> = {
  country: "AR",
  legal_name: "",
  tax_id: "",
  tax_condition: "",
  gross_income_number: "",
  fiscal_address: "",
  activity_start_date: null,
  point_of_sale: null,
  provider: "arca",
  environment: "production",
  enabled: false
};

function l(language: LanguageCode, es: string, en: string) {
  return language === "en" ? en : es;
}

function cleanTaxId(value: string) {
  return value.replace(/\D/g, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function statusLabel(language: LanguageCode, status: FiscalDocument["status"]) {
  if (status === "authorized") return l(language, "Autorizado", "Authorized");
  if (status === "pending_authorization") {
    return l(language, "Esperando autorización", "Pending authorization");
  }
  if (status === "rejected") return l(language, "Rechazado", "Rejected");
  return l(language, "Borrador", "Draft");
}

function kindLabel(language: LanguageCode, kind: FiscalDocument["kind"]) {
  if (kind === "credit_note") return l(language, "Nota de crédito", "Credit note");
  if (kind === "debit_note") return l(language, "Nota de débito", "Debit note");
  return l(language, "Factura", "Invoice");
}

export function FiscalDocumentsCenter({
  language,
  currency,
  locale,
  businessId,
  demoMode
}: Props) {
  const [providerReady, setProviderReady] = useState(false);
  const [profile, setProfile] = useState<Omit<FiscalProfile, "business_id">>(
    emptyProfile
  );
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [saleId, setSaleId] = useState("");
  const [relatedDocumentId, setRelatedDocumentId] = useState("");
  const [kind, setKind] = useState<FiscalDocument["kind"]>("invoice");
  const [letter, setLetter] = useState<FiscalDocument["letter"]>("C");
  const [customerName, setCustomerName] = useState("Consumidor final");
  const [customerDocumentType, setCustomerDocumentType] = useState("DNI");
  const [customerDocumentNumber, setCustomerDocumentNumber] = useState("");
  const [customerTaxCondition, setCustomerTaxCondition] =
    useState("Consumidor final");
  const [concept, setConcept] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [netAmount, setNetAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [exemptAmount, setExemptAmount] = useState("");
  const [otherTaxes, setOtherTaxes] = useState("");

  const normalizedTaxId = cleanTaxId(profile.tax_id);
  const profileComplete =
    Boolean(profile.legal_name.trim()) &&
    normalizedTaxId.length === 11 &&
    Boolean(profile.tax_condition.trim()) &&
    Boolean(profile.fiscal_address.trim()) &&
    Number(profile.point_of_sale) > 0;

  const amounts = useMemo(() => {
    const parse = (value: string) =>
      Math.max(0, Number(value.replace(",", ".")) || 0);

    const net = parse(netAmount);
    const vat = parse(vatAmount);
    const exempt = parse(exemptAmount);
    const other = parse(otherTaxes);

    return {
      net,
      vat,
      exempt,
      other,
      total: Math.round((net + vat + exempt + other) * 100) / 100
    };
  }, [exemptAmount, netAmount, otherTaxes, vatAmount]);

  const canIssue =
    Boolean(businessId) &&
    !demoMode &&
    providerReady &&
    profileComplete &&
    profile.enabled;

  async function loadFiscalData() {
    if (!businessId || demoMode) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [profileResult, docsResult, salesResult, providerResult] =
      await Promise.all([
        supabase
          .from("global_stock_fiscal_profiles")
          .select("*")
          .eq("business_id", businessId)
          .maybeSingle(),
        supabase
          .from("global_stock_fiscal_documents")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_sales")
          .select("id,total,subtotal,tax,currency,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(40),
        fetch("/api/fiscal/status", { cache: "no-store" }).then((response) =>
          response.json().catch(() => ({}))
        )
      ]);

    if (profileResult.data) {
      const row = profileResult.data as FiscalProfile;
      setProfile({
        country: row.country || "AR",
        legal_name: row.legal_name || "",
        tax_id: row.tax_id || "",
        tax_condition: row.tax_condition || "",
        gross_income_number: row.gross_income_number || "",
        fiscal_address: row.fiscal_address || "",
        activity_start_date: row.activity_start_date || null,
        point_of_sale: row.point_of_sale,
        provider: row.provider || "arca",
        environment: row.environment || "production",
        enabled: Boolean(row.enabled)
      });
    }

    setDocuments((docsResult.data as FiscalDocument[] | null) ?? []);
    setSales((salesResult.data as SaleRow[] | null) ?? []);
    setProviderReady(Boolean((providerResult as { configured?: boolean }).configured));
    setLoading(false);
  }

  useEffect(() => {
    void loadFiscalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, demoMode]);

  async function saveProfile() {
    if (!businessId || demoMode) return;
    setMessage("");

    if (!profileComplete) {
      setMessage(
        l(
          language,
          "Completá razón social, CUIT válido, condición fiscal, domicilio fiscal y punto de venta.",
          "Complete legal name, valid tax ID, tax condition, fiscal address and point of sale."
        )
      );
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSavingProfile(true);
    const { error } = await supabase
      .from("global_stock_fiscal_profiles")
      .upsert(
        {
          business_id: businessId,
          country: "AR",
          legal_name: profile.legal_name.trim(),
          tax_id: normalizedTaxId,
          tax_condition: profile.tax_condition,
          gross_income_number: profile.gross_income_number?.trim() || null,
          fiscal_address: profile.fiscal_address.trim(),
          activity_start_date: profile.activity_start_date || null,
          point_of_sale: Number(profile.point_of_sale) || null,
          provider: "arca",
          environment: profile.environment,
          enabled: profile.enabled
        },
        { onConflict: "business_id" }
      );

    setSavingProfile(false);
    setMessage(
      error
        ? l(language, "No pude guardar los datos fiscales.", "Could not save fiscal data.")
        : l(language, "Datos fiscales guardados.", "Fiscal data saved.")
    );

    if (!error) void loadFiscalData();
  }

  function selectSale(id: string) {
    setSaleId(id);
    const sale = sales.find((item) => item.id === id);
    if (!sale) return;

    const base = Math.max(0, Number(sale.subtotal ?? sale.total) || 0);
    const tax = Math.max(0, Number(sale.tax) || 0);
    setNetAmount(String(Math.max(0, base - tax) || sale.total || 0));
    setVatAmount(String(tax));
    setExemptAmount("");
    setOtherTaxes("");
    setConcept(
      l(
        language,
        "Venta POS vinculada",
        "Linked POS sale"
      )
    );
  }

  async function saveDraft() {
    if (!businessId || demoMode) return;
    setMessage("");

    if (!profileComplete) {
      setMessage(
        l(
          language,
          "Primero completá y guardá los datos fiscales del emisor.",
          "Complete and save issuer fiscal data first."
        )
      );
      return;
    }

    if (
      !customerName.trim() ||
      amounts.total <= 0 ||
      !letter ||
      (kind !== "invoice" && !relatedDocumentId)
    ) {
      setMessage(
        l(
          language,
          "Completá cliente, letra, total y, para notas de crédito/débito, el comprobante fiscal original.",
          "Complete customer, invoice letter, total and, for credit/debit notes, the original fiscal document."
        )
      );
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const reference = `GS-FISC-${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    setSavingDraft(true);

    const { data, error } = await supabase
      .from("global_stock_fiscal_documents")
      .insert({
        business_id: businessId,
        sale_id: saleId || null,
        related_document_id: relatedDocumentId || null,
        kind,
        letter,
        status: "draft",
        local_reference: reference,
        point_of_sale: Number(profile.point_of_sale),
        customer_name: customerName.trim(),
        customer_document_type: customerDocumentType,
        customer_document_number: customerDocumentNumber.trim(),
        customer_tax_condition: customerTaxCondition,
        currency: currency || "ARS",
        exchange_rate: 1,
        net_amount: amounts.net,
        vat_amount: amounts.vat,
        exempt_amount: amounts.exempt,
        other_taxes: amounts.other,
        total_amount: amounts.total,
        concept: concept.trim() || null,
        due_date: dueDate || null,
        provider: "arca",
        created_by: sessionData.session?.user?.id ?? null
      })
      .select("*")
      .single();

    if (!error && data) {
      await supabase.from("global_stock_fiscal_document_items").insert({
        document_id: data.id,
        description:
          concept.trim() ||
          (kind === "invoice"
            ? l(language, "Venta", "Sale")
            : kindLabel(language, kind)),
        quantity: 1,
        unit_price: amounts.total,
        tax_rate: amounts.net > 0 ? amounts.vat / amounts.net : 0,
        line_total: amounts.total
      });
    }

    setSavingDraft(false);

    if (error || !data) {
      setMessage(
        l(language, "No pude guardar el borrador fiscal.", "Could not save fiscal draft.")
      );
      return;
    }

    setMessage(
      l(
        language,
        "Borrador guardado. Todavía no tiene validez fiscal.",
        "Draft saved. It is not fiscally valid yet."
      )
    );
    setSaleId("");
    setRelatedDocumentId("");
    setConcept("");
    setDueDate("");
    setNetAmount("");
    setVatAmount("");
    setExemptAmount("");
    setOtherTaxes("");
    void loadFiscalData();
  }

  async function issueDocument(documentId: string) {
    if (!canIssue) {
      setMessage(
        l(
          language,
          "La emisión fiscal está bloqueada hasta completar el perfil y conectar el proveedor fiscal de ARCA.",
          "Fiscal issuance is blocked until the fiscal profile and ARCA provider are connected."
        )
      );
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.access_token) return;

    setIssuingId(documentId);
    setMessage("");

    try {
      const response = await fetch("/api/fiscal/issue", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          businessId,
          documentId
        })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        code?: string;
        document?: FiscalDocument;
        message?: string;
      };

      if (!response.ok || !payload.document) {
        throw new Error(payload.message || payload.code || "ISSUE_FAILED");
      }

      setMessage(
        l(
          language,
          "Comprobante autorizado y guardado con su código fiscal.",
          "Document authorized and stored with its fiscal authorization."
        )
      );
      void loadFiscalData();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "ISSUE_FAILED";
      setMessage(
        detail === "FISCAL_PROVIDER_NOT_CONFIGURED"
          ? l(
              language,
              "Falta conectar las credenciales reales del proveedor fiscal/ARCA. No se emitió nada como fiscal.",
              "Real fiscal/ARCA provider credentials are missing. Nothing was issued as fiscal."
            )
          : l(
              language,
              "El organismo/proveedor fiscal no autorizó el comprobante. Revisá el rechazo antes de reintentar.",
              "The tax authority/provider did not authorize the document. Review the rejection before retrying."
            )
      );
    } finally {
      setIssuingId(null);
    }
  }

  function printDocument(document: FiscalDocument) {
    const popup = window.open("", "_blank", "width=820,height=980");
    if (!popup) return;

    const authorized =
      document.status === "authorized" &&
      Boolean(document.authorization_code) &&
      Boolean(document.voucher_number);

    const total = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: document.currency || currency
    }).format(document.total_amount);

    const number =
      document.voucher_number && document.point_of_sale
        ? `${String(document.point_of_sale).padStart(5, "0")}-${String(
            document.voucher_number
          ).padStart(8, "0")}`
        : document.local_reference;

    const qr =
      authorized && document.qr_url?.startsWith("https://")
        ? `<img src="${escapeHtml(document.qr_url)}" alt="QR fiscal" style="width:132px;height:132px;object-fit:contain" />`
        : "";

    popup.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(number)}</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#111}
  .sheet{max-width:760px;margin:auto}
  .top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}
  .brand{font-weight:800;letter-spacing:.08em;color:#8f0000}
  .status{font-size:12px;font-weight:800;padding:8px 12px;border-radius:999px;background:${authorized ? "#eaf8ef" : "#fff2d8"};color:${authorized ? "#176b35" : "#8a5a00"}}
  .invalid{margin:24px 0;border:2px dashed #b42318;padding:16px;text-align:center;font-weight:800;color:#b42318}
  h1{margin:10px 0 4px;font-size:30px}
  .muted{color:#666;font-size:12px;line-height:1.5}
  .box{margin-top:24px;border:1px solid #ddd;border-radius:18px;padding:20px}
  .row{display:flex;justify-content:space-between;gap:20px;padding:10px 0;border-bottom:1px solid #eee}
  .row:last-child{border-bottom:0}
  .total{font-size:28px;font-weight:800;margin-top:18px}
  .auth{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-top:24px}
</style>
</head>
<body>
<div class="sheet">
  <div class="top">
    <div>
      <div class="brand">GLOBAL STOCK</div>
      <h1>${escapeHtml(kindLabel(language, document.kind))} ${escapeHtml(document.letter || "")}</h1>
      <div class="muted">${escapeHtml(profile.legal_name || "Emisor sin configurar")} · CUIT ${escapeHtml(profile.tax_id || "—")}</div>
      <div class="muted">${escapeHtml(profile.fiscal_address || "")}</div>
    </div>
    <div class="status">${authorized ? "AUTORIZADO" : "BORRADOR"}</div>
  </div>
  ${authorized ? "" : '<div class="invalid">SIN VALIDEZ FISCAL</div>'}
  <div class="box">
    <div class="row"><span>Número</span><strong>${escapeHtml(number)}</strong></div>
    <div class="row"><span>Cliente</span><strong>${escapeHtml(document.customer_name)}</strong></div>
    <div class="row"><span>Documento</span><strong>${escapeHtml(document.customer_document_type)} ${escapeHtml(document.customer_document_number || "—")}</strong></div>
    <div class="row"><span>Condición fiscal</span><strong>${escapeHtml(document.customer_tax_condition || "—")}</strong></div>
    <div class="row"><span>Neto</span><strong>${escapeHtml(String(document.net_amount))}</strong></div>
    <div class="row"><span>IVA</span><strong>${escapeHtml(String(document.vat_amount))}</strong></div>
    <div class="row"><span>Exento</span><strong>${escapeHtml(String(document.exempt_amount))}</strong></div>
    <div class="row"><span>Otros tributos</span><strong>${escapeHtml(String(document.other_taxes))}</strong></div>
    <div class="total">${escapeHtml(total)}</div>
  </div>
  <div class="auth">
    <div class="muted">
      ${authorized ? `CAE / autorización: <strong>${escapeHtml(document.authorization_code || "")}</strong><br/>Vencimiento: ${escapeHtml(document.authorization_expires_at || "—")}` : "Este documento no fue autorizado por el organismo fiscal."}
    </div>
    ${qr}
  </div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`);
    popup.document.close();
  }

  return (
    <section className="space-y-4">
      <div className="apex-card overflow-hidden">
        <div className="grid gap-4 p-5 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8F0000]">
              <ShieldCheck size={13} />
              {l(language, "Facturación fiscal", "Fiscal invoicing")}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
              {l(
                language,
                "Comprobantes fiscales con autorización real",
                "Fiscal documents with real authorization"
              )}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
              {l(
                language,
                "Global Stock separa borradores internos de comprobantes fiscales. Un documento solo pasa a “Autorizado” cuando el proveedor fiscal devuelve número oficial, código de autorización y fecha de emisión.",
                "Global Stock separates internal drafts from fiscal documents. A document only becomes “Authorized” after the fiscal provider returns an official number, authorization code and issue date."
              )}
            </p>
          </div>

          <div
            className={
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold " +
              (providerReady
                ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-500"
                : "border-amber-500/25 bg-amber-500/8 text-amber-500")
            }
          >
            {providerReady ? <BadgeCheck size={15} /> : <AlertTriangle size={15} />}
            {providerReady
              ? l(language, "Conector fiscal listo", "Fiscal connector ready")
              : l(language, "Falta conectar ARCA/proveedor", "ARCA/provider not connected")}
          </div>
        </div>

        {message ? (
          <div className="border-t border-[var(--apex-border)] bg-[var(--apex-bg)]/45 px-5 py-3 text-xs text-[var(--apex-muted)]">
            {message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[.88fr_1.12fr]">
        <div className="apex-card p-5">
          <div className="flex items-center gap-2">
            <FileSignature size={17} className="text-[#8F0000]" />
            <h3 className="text-sm font-semibold">
              {l(language, "Datos fiscales del emisor", "Issuer fiscal data")}
            </h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="apex-input px-3 py-2.5 text-sm"
              placeholder={l(language, "Razón social", "Legal name")}
              value={profile.legal_name}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  legal_name: event.target.value
                }))
              }
            />
            <input
              className="apex-input px-3 py-2.5 text-sm"
              inputMode="numeric"
              placeholder="CUIT"
              value={profile.tax_id}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  tax_id: event.target.value
                }))
              }
            />
            <ApexSelect
              className="apex-input px-3 py-2.5 text-sm"
              value={profile.tax_condition}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  tax_condition: event.target.value
                }))
              }
            >
              <option value="">{l(language, "Condición fiscal", "Tax condition")}</option>
              <option value="responsable_inscripto">Responsable inscripto</option>
              <option value="monotributo">Monotributo</option>
              <option value="exento">Exento</option>
              <option value="otro">Otro</option>
            </ApexSelect>
            <input
              className="apex-input px-3 py-2.5 text-sm"
              placeholder={l(language, "Ingresos Brutos (opcional)", "Gross income tax ID (optional)")}
              value={profile.gross_income_number || ""}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  gross_income_number: event.target.value
                }))
              }
            />
            <input
              className="apex-input px-3 py-2.5 text-sm sm:col-span-2"
              placeholder={l(language, "Domicilio fiscal", "Fiscal address")}
              value={profile.fiscal_address}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  fiscal_address: event.target.value
                }))
              }
            />
            <label className="text-xs text-[var(--apex-muted)]">
              {l(language, "Inicio de actividades", "Activity start date")}
              <input
                className="apex-input mt-1 w-full px-3 py-2.5 text-sm"
                type="date"
                value={profile.activity_start_date || ""}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    activity_start_date: event.target.value || null
                  }))
                }
              />
            </label>
            <label className="text-xs text-[var(--apex-muted)]">
              {l(language, "Punto de venta fiscal", "Fiscal point of sale")}
              <input
                className="apex-input mt-1 w-full px-3 py-2.5 text-sm"
                inputMode="numeric"
                min={1}
                max={99999}
                value={profile.point_of_sale ?? ""}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    point_of_sale: event.target.value
                      ? Number(event.target.value)
                      : null
                  }))
                }
              />
            </label>
          </div>

          <label className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--apex-border)] px-3 text-xs">
            <input
              type="checkbox"
              checked={profile.enabled}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  enabled: event.target.checked
                }))
              }
            />
            {l(
              language,
              "Activar emisión fiscal cuando el conector real esté disponible",
              "Enable fiscal issuance when the real connector is available"
            )}
          </label>

          <button
            type="button"
            disabled={!businessId || demoMode || savingProfile}
            onClick={() => void saveProfile()}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {savingProfile ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {l(language, "Guardar datos fiscales", "Save fiscal data")}
          </button>
        </div>

        <div className="apex-card p-5">
          <div className="flex items-center gap-2">
            <ReceiptText size={17} className="text-[#8F0000]" />
            <h3 className="text-sm font-semibold">
              {l(language, "Nuevo comprobante fiscal", "New fiscal document")}
            </h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ApexSelect
              className="apex-input px-3 py-2.5 text-sm"
              value={kind}
              onChange={(event) =>
                {
                  const nextKind = event.target.value as FiscalDocument["kind"];
                  setKind(nextKind);
                  if (nextKind === "invoice") setRelatedDocumentId("");
                }
              }
            >
              <option value="invoice">{l(language, "Factura", "Invoice")}</option>
              <option value="credit_note">{l(language, "Nota de crédito", "Credit note")}</option>
              <option value="debit_note">{l(language, "Nota de débito", "Debit note")}</option>
            </ApexSelect>
            <ApexSelect
              className="apex-input px-3 py-2.5 text-sm"
              value={letter || ""}
              onChange={(event) =>
                setLetter(
                  (event.target.value || null) as FiscalDocument["letter"]
                )
              }
            >
              <option value="">{l(language, "Letra", "Letter")}</option>
              {["A", "B", "C", "M", "E", "T"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </ApexSelect>
            <ApexSelect
              className="apex-input px-3 py-2.5 text-sm"
              value={saleId}
              onChange={(event) => selectSale(event.target.value)}
            >
              <option value="">
                {l(language, "Sin venta vinculada", "No linked sale")}
              </option>
              {sales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {new Date(sale.created_at).toLocaleString(locale)} ·{" "}
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: sale.currency || currency
                  }).format(Number(sale.total) || 0)}
                </option>
              ))}
            </ApexSelect>
          </div>

          {kind !== "invoice" ? (
            <div className="mt-3">
              <ApexSelect
                className="apex-input w-full px-3 py-2.5 text-sm"
                value={relatedDocumentId}
                onChange={(event) => setRelatedDocumentId(event.target.value)}
              >
                <option value="">
                  {l(
                    language,
                    "Seleccioná el comprobante fiscal original",
                    "Select the original fiscal document"
                  )}
                </option>
                {documents
                  .filter((document) => document.status === "authorized")
                  .map((document) => (
                    <option key={document.id} value={document.id}>
                      {kindLabel(language, document.kind)} {document.letter || ""} ·{" "}
                      {document.point_of_sale && document.voucher_number
                        ? `${String(document.point_of_sale).padStart(5, "0")}-${String(
                            document.voucher_number
                          ).padStart(8, "0")}`
                        : document.local_reference}
                    </option>
                  ))}
              </ApexSelect>
              <p className="mt-1 text-[10px] leading-4 text-[var(--apex-muted)]">
                {l(
                  language,
                  "Las notas de crédito y débito quedan vinculadas al comprobante que corrigen o ajustan.",
                  "Credit and debit notes stay linked to the document they correct or adjust."
                )}
              </p>
            </div>
          ) : null}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              className="apex-input px-3 py-2.5 text-sm"
              placeholder={l(language, "Cliente / razón social", "Customer / legal name")}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
            <ApexSelect
              className="apex-input px-3 py-2.5 text-sm"
              value={customerTaxCondition}
              onChange={(event) => setCustomerTaxCondition(event.target.value)}
            >
              <option value="Consumidor final">Consumidor final</option>
              <option value="Responsable inscripto">Responsable inscripto</option>
              <option value="Monotributo">Monotributo</option>
              <option value="Exento">Exento</option>
              <option value="Otro">Otro</option>
            </ApexSelect>
            <ApexSelect
              className="apex-input px-3 py-2.5 text-sm"
              value={customerDocumentType}
              onChange={(event) => setCustomerDocumentType(event.target.value)}
            >
              <option value="DNI">DNI</option>
              <option value="CUIT">CUIT</option>
              <option value="CUIL">CUIL</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="OTRO">Otro</option>
            </ApexSelect>
            <input
              className="apex-input px-3 py-2.5 text-sm"
              placeholder={l(language, "Número de documento", "Document number")}
              value={customerDocumentNumber}
              onChange={(event) => setCustomerDocumentNumber(event.target.value)}
            />
            <input
              className="apex-input px-3 py-2.5 text-sm sm:col-span-2"
              placeholder={l(language, "Concepto / detalle", "Concept / detail")}
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <input
              className="apex-input px-3 py-2.5 text-sm"
              inputMode="decimal"
              placeholder={l(language, "Neto", "Net")}
              value={netAmount}
              onChange={(event) => setNetAmount(event.target.value)}
            />
            <input
              className="apex-input px-3 py-2.5 text-sm"
              inputMode="decimal"
              placeholder="IVA"
              value={vatAmount}
              onChange={(event) => setVatAmount(event.target.value)}
            />
            <input
              className="apex-input px-3 py-2.5 text-sm"
              inputMode="decimal"
              placeholder={l(language, "Exento", "Exempt")}
              value={exemptAmount}
              onChange={(event) => setExemptAmount(event.target.value)}
            />
            <input
              className="apex-input px-3 py-2.5 text-sm"
              inputMode="decimal"
              placeholder={l(language, "Otros tributos", "Other taxes")}
              value={otherTaxes}
              onChange={(event) => setOtherTaxes(event.target.value)}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="text-xs text-[var(--apex-muted)]">
              {l(language, "Vencimiento (si corresponde)", "Due date (if applicable)")}
              <input
                className="apex-input mt-1 w-full px-3 py-2.5 text-sm"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
            <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)]/40 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                Total
              </p>
              <p className="mt-1 text-lg font-semibold">
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency
                }).format(amounts.total)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[10px] leading-4 text-[var(--apex-muted)]">
            {l(
              language,
              "La letra y los impuestos deben corresponder a la situación fiscal real del emisor y del cliente. Global Stock no inventa CAE, numeración oficial ni QR: esos datos solo se guardan cuando el proveedor fiscal los devuelve.",
              "Invoice letter and taxes must match the real fiscal status of issuer and customer. Global Stock never invents authorization codes, official numbering or QR data."
            )}
          </p>

          <button
            type="button"
            disabled={!businessId || demoMode || savingDraft}
            onClick={() => void saveDraft()}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {savingDraft ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {l(language, "Guardar borrador", "Save draft")}
          </button>
        </div>
      </div>

      <div className="apex-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--apex-border)] p-5">
          <div>
            <h3 className="text-sm font-semibold">
              {l(language, "Comprobantes fiscales", "Fiscal documents")}
            </h3>
            <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
              {l(
                language,
                "Los autorizados quedan inmutables; para corregirlos se emite una nota de crédito o débito.",
                "Authorized documents are immutable; corrections use credit/debit notes."
              )}
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--apex-muted)]">
            {loading ? "…" : documents.length}
          </span>
        </div>

        <div className="divide-y divide-[var(--apex-border)]">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--apex-muted)]">
              {l(language, "Todavía no hay comprobantes fiscales.", "No fiscal documents yet.")}
            </div>
          ) : (
            documents.map((document) => (
              <article
                key={document.id}
                className="flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {kindLabel(language, document.kind)} {document.letter || ""}
                    </p>
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold " +
                        (document.status === "authorized"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : document.status === "rejected"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-amber-500/10 text-amber-500")
                      }
                    >
                      {statusLabel(language, document.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--apex-muted)]">
                    {document.voucher_number && document.point_of_sale
                      ? `${String(document.point_of_sale).padStart(5, "0")}-${String(
                          document.voucher_number
                        ).padStart(8, "0")}`
                      : document.local_reference}{" "}
                    · {document.customer_name}
                  </p>
                  {document.authorization_code ? (
                    <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                      CAE / autorización: {document.authorization_code}
                      {document.authorization_expires_at
                        ? ` · vence ${document.authorization_expires_at}`
                        : ""}
                    </p>
                  ) : null}
                  {document.rejection_reason ? (
                    <p className="mt-1 text-[10px] text-red-500">
                      {document.rejection_reason}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <p className="mr-2 text-sm font-semibold">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: document.currency || currency
                    }).format(document.total_amount)}
                  </p>
                  {document.status !== "authorized" ? (
                    <button
                      type="button"
                      disabled={!canIssue || issuingId === document.id}
                      onClick={() => void issueDocument(document.id)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#8F0000] px-3 text-xs font-semibold text-white disabled:opacity-35"
                    >
                      {issuingId === document.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      {l(language, "Autorizar", "Authorize")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => printDocument(document)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--apex-border)]"
                    aria-label={l(language, "Imprimir", "Print")}
                  >
                    <Printer size={15} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
