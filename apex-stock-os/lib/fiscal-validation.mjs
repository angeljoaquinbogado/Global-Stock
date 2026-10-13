// Exact-money validation before contacting a fiscal authority or provider.
// This never generates invoices and never sends any network request.
function asCents(value) {
  if (value == null || value === "") return null;
  const text = String(value).trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fractional = ""] = text.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  const absWhole = whole.replace("-", "");
  const total = Number(absWhole) * 100 + Number(fractional.padEnd(2, "0"));
  return Number.isSafeInteger(total) ? total * sign : null;
}

export function validateFiscalTotals(document, lines) {
  if (!document || !Array.isArray(lines) || lines.length === 0) {
    return { ok: false, code: "FISCAL_ITEMS_MISSING" };
  }
  const components = [
    document.net_amount, document.vat_amount,
    document.exempt_amount, document.other_taxes
  ].map(asCents);
  const total = asCents(document.total_amount);
  if (total === null || total <= 0 ||
      components.some(c => c === null || c < 0)) {
    return { ok: false, code: "FISCAL_AMOUNTS_INVALID" };
  }
  if (components.reduce((sum, value) => sum + value, 0) !== total) {
    return { ok: false, code: "FISCAL_HEADER_TOTAL_MISMATCH" };
  }
  let linesTotal = 0;
  for (const line of lines) {
    const qty = Number(line.quantity);
    const value = asCents(line.line_total);
    const price = asCents(line.unit_price);
    if (!Number.isFinite(qty) || qty <= 0 ||
        value === null || value < 0 ||
        price === null || price < 0 ||
        !String(line.description ?? "").trim()) {
      return { ok: false, code: "FISCAL_LINE_INVALID" };
    }
    linesTotal += value;
    if (!Number.isSafeInteger(linesTotal)) {
      return { ok: false, code: "FISCAL_AMOUNTS_INVALID" };
    }
  }
  if (linesTotal !== total) {
    return { ok: false, code: "FISCAL_LINE_TOTAL_MISMATCH" };
  }
  return { ok: true, code: "OK" };
}
