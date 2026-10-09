import test from "node:test";
import assert from "node:assert/strict";
import { analyzeArcaDraft, isValidArgentinianCuit } from "../lib/arca-draft-guidance.mjs";

const validIssuer = {
  legalName: "Negocio de prueba",
  taxId: "20-12345678-6",
  taxCondition: "monotributo",
  fiscalAddress: "Domicilio ficticio",
  pointOfSale: 1
};
const template = () => ({
  issuer: { ...validIssuer },
  customer: { name: "Consumidor final", documentType: "DNI", documentNumber: "" },
  document: { kind: "invoice", letter: "C", currency: "ARS", concept: "Venta simulada" },
  amounts: { net: 200, vat: 42, exempt: 0, other: 0, total: 242 },
  providerReady: false
});

test("CUIT verifier respects its check digit", () => {
  assert.equal(isValidArgentinianCuit("20-12345678-6"), true);
  assert.equal(isValidArgentinianCuit("20-12345678-9"), false);
  assert.equal(isValidArgentinianCuit("20304050"), false);
});

test("valid draft can be reviewed but is never an authorized invoice", () => {
  const result = analyzeArcaDraft(template());
  assert.equal(result.readyToReview, true);
  assert.equal(result.blockers.length, 0);
  assert.ok(result.warnings.some((w) => w.code === "PROVIDER_NOT_CONNECTED"));
  assert.ok(result.warnings.some((w) => w.code === "LEGAL_REVIEW"));
});

test("issuer information and point of sale block review when missing", () => {
  const draft = template();
  draft.issuer.legalName = "";
  draft.issuer.pointOfSale = 0;
  const result = analyzeArcaDraft(draft);
  assert.equal(result.readyToReview, false);
  assert.ok(result.blockers.some((f) => f.code === "ISSUER_NAME_MISSING"));
  assert.ok(result.blockers.some((f) => f.code === "POINT_OF_SALE_INVALID"));
});

test("credit note requires authorized origin", () => {
  const draft = template();
  draft.document.kind = "credit_note";
  let result = analyzeArcaDraft(draft);
  assert.ok(result.blockers.some((f) => f.code === "ORIGINAL_REQUIRED"));
  draft.document.relatedDocumentId = "demo-internal-id";
  draft.document.originalAuthorized = false;
  result = analyzeArcaDraft(draft);
  assert.ok(result.blockers.some((f) => f.code === "ORIGINAL_NOT_AUTHORIZED"));
  draft.document.originalAuthorized = true;
  result = analyzeArcaDraft(draft);
  assert.ok(result.readyToReview);
});

test("total has to match parts and must be positive", () => {
  const draft = template();
  draft.amounts.total = 500;
  let result = analyzeArcaDraft(draft);
  assert.ok(result.blockers.some((f) => f.code === "AMOUNTS_MISMATCH"));
  draft.amounts.total = -1;
  result = analyzeArcaDraft(draft);
  assert.ok(result.blockers.some((f) => f.code === "AMOUNTS_INVALID"));
});

test("incorrect 11-digit issuer tax ID emits a warning", () => {
  const draft = template();
  draft.issuer.taxId = "20123456789";
  const result = analyzeArcaDraft(draft);
  assert.ok(result.warnings.some((f) => f.code === "ISSUER_TAX_ID_CHECK"));
});

test("no draft analysis calls any remote system", () => {
  const result = analyzeArcaDraft(template());
  assert.equal(result.readyToReview, true);
  assert.equal(Object.hasOwn(result, "authorizationCode"), false);
  assert.equal(Object.hasOwn(result, "officialNumber"), false);
});
