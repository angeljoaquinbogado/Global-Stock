import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateFiscalTotals } from "../lib/fiscal-validation.mjs";

const valid = {
  net_amount: "1200.60", vat_amount: "252.13",
  exempt_amount: 0, other_taxes: 0, total_amount: "1452.73"
};
test("complete amount decomposition and line items must agree", () => {
  const lines = [{
    description: "Producto de prueba", quantity: 1, unit_price: "1452.73",
    line_total: "1452.73"
  }];
  assert.deepEqual(validateFiscalTotals(valid, lines), { ok: true, code: "OK" });
});
test("FEAFIP illustration supplied by user is NOT a valid invoice", () => {
  // The PHP sample's line total (1231.14) differs from header (1452.73).
  const lines = [{
    description: "Producto nro 10", quantity: 1,
    unit_price: "1025.95", line_total: "1231.14"
  }];
  assert.deepEqual(validateFiscalTotals(valid, lines), {
    ok: false, code: "FISCAL_LINE_TOTAL_MISMATCH"
  });
});
test("rejects totals with wrong VAT, invalid cents and negative lines", () => {
  assert.equal(validateFiscalTotals({ ...valid, vat_amount: 250 }, [{
    description: "item", quantity: 1, unit_price: 1, line_total: 1452.73
  }]).code, "FISCAL_HEADER_TOTAL_MISMATCH");
  assert.equal(validateFiscalTotals(valid, [{
    description: "item", quantity: 1, unit_price: 1, line_total: "1452.735"
  }]).code, "FISCAL_LINE_INVALID");
  assert.equal(validateFiscalTotals(valid, [{
    description: "item", quantity: 1, unit_price: 1, line_total: -5
  }]).code, "FISCAL_LINE_INVALID");
});
test("provider attempts remain state-locked and never retry ambiguous issuance", () => {
  const route = readFileSync(new URL("../app/api/fiscal/issue/route.ts", import.meta.url), "utf8");
  assert.match(route, /FISCAL_RECONCILIATION_REQUIRED/);
  assert.match(route, /\.in\("status", \["draft", "rejected"\]\)/);
  assert.match(route, /FISCAL_PRODUCTION_ENABLED.*true/);
  assert.match(route, /explicitRejection = providerPayload\.status === "rejected"/);
  assert.match(route, /const totals = validateFiscalTotals\(document, items\)/);
});
