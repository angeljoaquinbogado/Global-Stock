// Pre-flight ARCA document guidance: deterministic, no network, AI, cookies or credentials.
// Inspired by the guardrail pattern of buanzo/agentic-skill-arca-comprobantes
// (Apache-2.0). This is independently implemented, not a fiscal authorization.
// Official ARCA rules and taxpayer status must still be checked by the provider.
const makeFinding = (code, es, en) => ({ code, es, en });
const digits = (value) => String(value ?? "").replace(/\D/g, "");

export function isValidArgentinianCuit(value) {
  const id = digits(value);
  if (!/^\d{11}$/.test(id)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + weight * Number(id[index]), 0);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  return check < 10 && Number(id[10]) === check;
}

export function analyzeArcaDraft(input) {
  const blockers = [];
  const warnings = [];
  const issuer = input?.issuer || {};
  const document = input?.document || {};
  const customer = input?.customer || {};
  const amounts = input?.amounts || {};

  const legalName = String(issuer.legalName ?? "").trim();
  const taxId = digits(issuer.taxId);
  const pointOfSale = Number(issuer.pointOfSale);
  const kind = String(document.kind || "");
  const letter = String(document.letter || "").trim();
  const customerName = String(customer.name || "").trim();
  const customerType = String(customer.documentType || "").toUpperCase();
  const customerId = digits(customer.documentNumber);
  const currency = String(document.currency || "").trim().toUpperCase();
  const total = Number(amounts.total);
  const parts = ["net", "vat", "exempt", "other"].map(key => Number(amounts[key] ?? 0));

  if (!legalName) {
    blockers.push(makeFinding("ISSUER_NAME_MISSING", "Completá la razón social del emisor.", "Enter the issuer's legal name."));
  }
  if (taxId.length !== 11) {
    blockers.push(makeFinding("ISSUER_TAX_ID_MISSING", "El CUIT del emisor debe tener 11 dígitos.", "The issuer CUIT must have 11 digits."));
  } else if (!isValidArgentinianCuit(taxId)) {
    warnings.push(makeFinding("ISSUER_TAX_ID_CHECK", "Revisá el dígito verificador del CUIT del emisor.", "Check the issuer CUIT verification digit."));
  }
  if (!String(issuer.taxCondition ?? "").trim()) {
    blockers.push(makeFinding("ISSUER_TAX_CONDITION_MISSING", "Elegí la condición fiscal del emisor.", "Select the issuer's tax condition."));
  }
  if (!String(issuer.fiscalAddress ?? "").trim()) {
    blockers.push(makeFinding("ISSUER_ADDRESS_MISSING", "Completá el domicilio fiscal.", "Enter the fiscal address."));
  }
  if (!Number.isInteger(pointOfSale) || pointOfSale < 1 || pointOfSale > 99999) {
    blockers.push(makeFinding("POINT_OF_SALE_INVALID", "Indicá un punto de venta entre 1 y 99999.", "Use a point of sale between 1 and 99999."));
  }
  if (!["invoice", "credit_note", "debit_note"].includes(kind)) {
    blockers.push(makeFinding("DOCUMENT_KIND_INVALID", "Seleccioná el tipo de comprobante.", "Select a document type."));
  }
  if (!["A", "B", "C", "M", "E", "T"].includes(letter)) {
    blockers.push(makeFinding("DOCUMENT_LETTER_INVALID", "Seleccioná una letra de comprobante válida.", "Select a valid document letter."));
  }
  if (kind !== "invoice" && !String(document.relatedDocumentId ?? "").trim()) {
    blockers.push(makeFinding("ORIGINAL_REQUIRED", "Las notas necesitan el comprobante fiscal original.", "Credit/debit notes require the original authorized document."));
  }
  if (kind !== "invoice" && document.relatedDocumentId && document.originalAuthorized === false) {
    blockers.push(makeFinding("ORIGINAL_NOT_AUTHORIZED", "El comprobante original debe estar autorizado.", "The original document must be authorized."));
  }
  if (!customerName) {
    blockers.push(makeFinding("CUSTOMER_NAME_MISSING", "Completá el nombre del receptor.", "Enter the customer name."));
  }
  if (!Number.isFinite(total) || total <= 0 || parts.some(n => !Number.isFinite(n) || n < 0)) {
    blockers.push(makeFinding("AMOUNTS_INVALID", "El total debe ser positivo y los importes no pueden ser negativos.", "Total must be positive and amounts cannot be negative."));
  } else {
    const sum = Math.round(parts.reduce((a, b) => a + b, 0) * 100) / 100;
    if (Math.abs(sum - total) > 0.01) {
      blockers.push(makeFinding("AMOUNTS_MISMATCH", "El total no coincide con neto, IVA, exento y tributos.", "Total does not match net, VAT, exempt and other taxes."));
    }
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    warnings.push(makeFinding("CURRENCY_REVIEW", "Comprobá la moneda y su tipo de cambio.", "Check the currency and exchange rate."));
  }
  if (customerType === "CUIT" && customerId && !isValidArgentinianCuit(customerId)) {
    warnings.push(makeFinding("CUSTOMER_CUIT_CHECK", "Revisá el CUIT del receptor antes de emitir.", "Check the customer CUIT before issuing."));
  }
  if (!customerId) {
    warnings.push(makeFinding("CUSTOMER_IDENTIFICATION_REVIEW", "Verificá si esta operación requiere identificar al receptor según la normativa vigente.", "Check whether customer identification is required for this transaction."));
  }
  if (!String(document.concept ?? "").trim()) {
    warnings.push(makeFinding("CONCEPT_REVIEW", "Agregá un concepto que identifique la operación.", "Add a concept describing the transaction."));
  }
  if (!input?.providerReady) {
    warnings.push(makeFinding("PROVIDER_NOT_CONNECTED", "El proveedor de ARCA no está conectado; esto solo prepara un borrador interno.", "ARCA provider is not connected; this only prepares an internal draft."));
  }
  // Matching invoice letter/tax situation is not determined by AI or this tool.
  warnings.push(makeFinding("LEGAL_REVIEW", "Confirmá letra, IVA y condición fiscal con las reglas vigentes de ARCA.", "Verify letter, VAT and taxpayer conditions against current ARCA rules."));
  return { readyToReview: blockers.length === 0, blockers, warnings };
}
