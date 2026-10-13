import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { authorizeApiRequest } from "@/lib/server-auth";
import { analyzeArcaDraft } from "@/lib/arca-draft-guidance.mjs";
import {
  guardApiRequest,
  noStoreHeaders,
  readJsonBody,
  securityErrorResponse
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IssueBody = {
  businessId?: string;
  documentId?: string;
};

type ProviderResponse = {
  status?: "authorized" | "rejected";
  authorizationCode?: string;
  authorizationExpiresAt?: string;
  voucherNumber?: number;
  pointOfSale?: number;
  letter?: string;
  qrUrl?: string;
  requestId?: string;
  message?: string;
  raw?: unknown;
};

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function userScopedSupabase(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!url || !anonKey || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: authorization
      }
    }
  });
}

function fiscalProviderConfigured() {
  return Boolean(
    process.env.ARCA_FISCAL_PROVIDER_URL?.trim() &&
      process.env.ARCA_FISCAL_PROVIDER_API_KEY?.trim()
  );
}

export async function POST(request: Request) {
  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { code: authorization.code },
      { status: authorization.status, headers: noStoreHeaders() }
    );
  }

  try {
    guardApiRequest(request, {
      scope: "fiscal-issue",
      limit: 20,
      identity: authorization.userId
    });
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { code: "REQUEST_BLOCKED" },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  let body: IssueBody;
  try {
    body = await readJsonBody<IssueBody>(request, 32_000);
  } catch (error) {
    return securityErrorResponse(error) ?? NextResponse.json(
      { code: "INVALID_REQUEST" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  const businessId = body.businessId?.trim() ?? "";
  const documentId = body.documentId?.trim() ?? "";

  if (!validUuid(businessId) || !validUuid(documentId)) {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const supabase = userScopedSupabase(request);
  if (!supabase) {
    return NextResponse.json(
      { code: "AUTH_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const { data: membership } = await supabase
    .from("global_stock_members")
    .select("role,active")
    .eq("business_id", businessId)
    .eq("user_id", authorization.userId)
    .maybeSingle();

  if (
    !membership?.active ||
    !["owner", "admin", "manager", "accountant"].includes(
      String(membership.role)
    )
  ) {
    return NextResponse.json(
      { code: "FISCAL_PERMISSION_REQUIRED" },
      { status: 403 }
    );
  }

  const [{ data: profile }, { data: document }] = await Promise.all([
    supabase
      .from("global_stock_fiscal_profiles")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("global_stock_fiscal_documents")
      .select("*")
      .eq("business_id", businessId)
      .eq("id", documentId)
      .maybeSingle()
  ]);

  if (!profile || !document) {
    return NextResponse.json(
      { code: "FISCAL_PROFILE_OR_DOCUMENT_MISSING" },
      { status: 404 }
    );
  }

  const taxId = String(profile.tax_id || "").replace(/\D/g, "");
  const profileComplete =
    Boolean(String(profile.legal_name || "").trim()) &&
    taxId.length === 11 &&
    Boolean(String(profile.tax_condition || "").trim()) &&
    Boolean(String(profile.fiscal_address || "").trim()) &&
    Number(profile.point_of_sale) > 0;

  if (!profileComplete || profile.enabled !== true) {
    return NextResponse.json(
      { code: "FISCAL_PROFILE_INCOMPLETE" },
      { status: 409 }
    );
  }

  if (document.status === "authorized") {
    return NextResponse.json(
      { document },
      { headers: noStoreHeaders() }
    );
  }

  // A pending attempt may already have reached ARCA and generated a CAE,
  // even if this server never received the response. NEVER reissue it.
  if (document.status === "pending_authorization") {
    return NextResponse.json(
      { code: "FISCAL_RECONCILIATION_REQUIRED" },
      { status: 409, headers: noStoreHeaders() }
    );
  }

  // A production invoice must never be issued by adding a provider key
  // alone. The merchant/operator must explicitly enable production.
  if (profile.environment === "production" &&
      process.env.ARCA_FISCAL_PRODUCTION_ENABLED !== "true") {
    return NextResponse.json(
      { code: "FISCAL_PRODUCTION_LOCKED" },
      { status: 409, headers: noStoreHeaders() }
    );
  }

  if (!fiscalProviderConfigured()) {
    return NextResponse.json(
      { code: "FISCAL_PROVIDER_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const { data: items, error: itemsError } = await supabase
    .from("global_stock_fiscal_document_items")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });
  if (itemsError || !items?.length) {
    return NextResponse.json(
      { code: "FISCAL_ITEMS_MISSING" },
      { status: 422, headers: noStoreHeaders() }
    );
  }

  // The example FEAFIP payload supplied for reference has inconsistent
  // item and header totals. Reject discrepancies before contacting a
  // provider: an electronic invoice must never get an invented CAE.
  const check = analyzeArcaDraft({
    issuer: {
      legalName: profile.legal_name,
      taxId: profile.tax_id,
      taxCondition: profile.tax_condition,
      fiscalAddress: profile.fiscal_address,
      pointOfSale: profile.point_of_sale
    },
    document: {
      kind: document.kind,
      letter: document.letter,
      currency: document.currency,
      concept: document.concept,
      relatedDocumentId: document.related_document_id,
      originalAuthorized: document.kind === "invoice" ? true : undefined
    },
    customer: {
      name: document.customer_name,
      documentType: document.customer_document_type,
      documentNumber: document.customer_document_number
    },
    amounts: {
      net: document.net_amount,
      vat: document.vat_amount,
      exempt: document.exempt_amount,
      other: document.other_taxes,
      total: document.total_amount
    },
    providerReady: true
  });
  if (!check.readyToReview) {
    return NextResponse.json(
      { code: "FISCAL_PREFLIGHT_FAILED", issues: check.blockers.map(item => item.code) },
      { status: 422, headers: noStoreHeaders() }
    );
  }
  const cents = (value: unknown) => Math.round(Number(value) * 100);
  const lineCents = items.reduce(
    (sum, item) => sum + cents(item.line_total), 0
  );
  if (items.some(item =>
    !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0 ||
    !Number.isFinite(Number(item.line_total)) || Number(item.line_total) < 0
  ) || Math.abs(lineCents - cents(document.total_amount)) > 1) {
    return NextResponse.json(
      { code: "FISCAL_LINE_TOTAL_MISMATCH" },
      { status: 422, headers: noStoreHeaders() }
    );
  }

  const { data: lockedDocument, error: pendingError } = await supabase
    .from("global_stock_fiscal_documents")
    .update({
      status: "pending_authorization",
      rejection_reason: null
    })
    .eq("id", documentId)
    .eq("business_id", businessId)
    .in("status", ["draft", "rejected"])
    .select("id")
    .maybeSingle();

  if (!lockedDocument && !pendingError) {
    return NextResponse.json(
      { code: "FISCAL_RECONCILIATION_REQUIRED" },
      { status: 409, headers: noStoreHeaders() }
    );
  }
  if (pendingError) {
    return NextResponse.json(
      { code: "FISCAL_STATE_UPDATE_FAILED" },
      { status: 500 }
    );
  }

  const providerUrl = process.env.ARCA_FISCAL_PROVIDER_URL!.trim();
  const providerKey = process.env.ARCA_FISCAL_PROVIDER_API_KEY!.trim();
  const timeoutMs = Math.max(
    5000,
    Math.min(
      30000,
      Number(process.env.ARCA_FISCAL_PROVIDER_TIMEOUT_MS) || 15000
    )
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let providerPayload: ProviderResponse = {};
  let providerStatus = 0;

  try {
    const response = await fetch(providerUrl, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerKey}`
      },
      body: JSON.stringify({
        authority: "ARCA",
        country: "AR",
        issuer: {
          legalName: profile.legal_name,
          taxId,
          taxCondition: profile.tax_condition,
          grossIncomeNumber: profile.gross_income_number,
          fiscalAddress: profile.fiscal_address,
          activityStartDate: profile.activity_start_date,
          pointOfSale: profile.point_of_sale,
          environment: profile.environment
        },
        document: {
          id: document.id,
          localReference: document.local_reference,
          kind: document.kind,
          letter: document.letter,
          saleId: document.sale_id,
          customer: {
            name: document.customer_name,
            documentType: document.customer_document_type,
            documentNumber: document.customer_document_number,
            taxCondition: document.customer_tax_condition
          },
          currency: document.currency,
          exchangeRate: document.exchange_rate,
          netAmount: document.net_amount,
          vatAmount: document.vat_amount,
          exemptAmount: document.exempt_amount,
          otherTaxes: document.other_taxes,
          totalAmount: document.total_amount,
          concept: document.concept,
          dueDate: document.due_date,
          relatedDocumentId: document.related_document_id,
          items: items ?? []
        }
      })
    });

    providerStatus = response.status;
    providerPayload = (await response.json().catch(() => ({}))) as ProviderResponse;
  } catch (error) {
    providerPayload = {
      status: "rejected",
      message:
        error instanceof Error ? error.message : "FISCAL_PROVIDER_UNAVAILABLE"
    };
  } finally {
    clearTimeout(timeout);
  }

  const authorized =
    providerStatus >= 200 &&
    providerStatus < 300 &&
    providerPayload.status === "authorized" &&
    Boolean(providerPayload.authorizationCode?.trim()) &&
    Number(providerPayload.voucherNumber) > 0;

  if (!authorized) {
    // Missing responses, timeouts and upstream 5xx are AMBIGUOUS: the
    // authority may have issued a CAE before the connection failed.
    // Leave the document pending until an authorized reconciliation query.
    const explicitRejection = providerPayload.status === "rejected" &&
      providerStatus >= 400 && providerStatus < 500;
    if (!explicitRejection) {
      await supabase.from("global_stock_fiscal_events").insert({
        business_id: businessId,
        document_id: documentId,
        event_type: "authorization_uncertain",
        status: "pending_authorization",
        message: "Authorization response uncertain; reconcile with official provider before retry.",
        payload: { providerStatus },
        created_by: authorization.userId
      });
      return NextResponse.json(
        { code: "FISCAL_RECONCILIATION_REQUIRED" },
        { status: 409, headers: noStoreHeaders() }
      );
    }

    // Never persist unfiltered third-party objects or echo provider errors
    // containing customer details, credentials or private response bodies.
    const { data: rejected } = await supabase
      .from("global_stock_fiscal_documents")
      .update({
        status: "rejected",
        rejection_reason: "FISCAL_PROVIDER_REJECTED",
        provider_request_id: providerPayload.requestId?.slice(0, 120) || null,
        provider_response: { providerStatus, providerState: "rejected" }
      })
      .eq("id", documentId)
      .eq("business_id", businessId)
      .eq("status", "pending_authorization")
      .select("*")
      .single();

    await supabase.from("global_stock_fiscal_events").insert({
      business_id: businessId,
      document_id: documentId,
      event_type: "authorization_rejected",
      status: "rejected",
      message: "Explicit provider rejection.",
      payload: { providerStatus },
      created_by: authorization.userId
    });

    return NextResponse.json(
      { code: "FISCAL_PROVIDER_REJECTED", document: rejected ?? null },
      { status: 422, headers: noStoreHeaders() }
    );
  }

  const pointOfSale =
    Number(providerPayload.pointOfSale) || Number(profile.point_of_sale);

  const { data: authorizedDocument, error: updateError } = await supabase
    .from("global_stock_fiscal_documents")
    .update({
      status: "authorized",
      point_of_sale: pointOfSale,
      voucher_number: Number(providerPayload.voucherNumber),
      letter: providerPayload.letter || document.letter,
      issued_at: new Date().toISOString(),
      authorization_code: providerPayload.authorizationCode!.trim(),
      authorization_expires_at:
        providerPayload.authorizationExpiresAt || null,
      qr_url:
        providerPayload.qrUrl?.startsWith("https://")
          ? providerPayload.qrUrl
          : null,
      provider_request_id: providerPayload.requestId || null,
      provider_response: providerPayload,
      rejection_reason: null
    })
    .eq("id", documentId)
    .eq("business_id", businessId)
    .select("*")
    .single();

  if (updateError || !authorizedDocument) {
    return NextResponse.json(
      { code: "FISCAL_AUTHORIZATION_SAVE_FAILED" },
      { status: 500 }
    );
  }

  await supabase.from("global_stock_fiscal_events").insert({
    business_id: businessId,
    document_id: documentId,
    event_type: "authorization_granted",
    status: "authorized",
    message: "Fiscal authorization stored.",
    payload: {
      providerRequestId: providerPayload.requestId || null,
      voucherNumber: providerPayload.voucherNumber,
      pointOfSale,
      authorizationExpiresAt:
        providerPayload.authorizationExpiresAt || null
    },
    created_by: authorization.userId
  });

  return NextResponse.json(
    { document: authorizedDocument },
    { headers: { "Cache-Control": "no-store" } }
  );
}
