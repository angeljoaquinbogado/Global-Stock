export type ArcaFinding = { code: string; es: string; en: string };
export type ArcaDraftGuidance = {
  issuer: { legalName?: string; taxId?: string; pointOfSale?: number | null; taxCondition?: string; fiscalAddress?: string };
  document: { kind?: string; letter?: string | null; relatedDocumentId?: string; originalAuthorized?: boolean; currency?: string; concept?: string };
  customer: { name?: string; documentType?: string; documentNumber?: string };
  amounts: { net?: number; vat?: number; exempt?: number; other?: number; total?: number };
  providerReady?: boolean;
};
export function isValidArgentinianCuit(value: string | number | null | undefined): boolean;
export function analyzeArcaDraft(input: ArcaDraftGuidance): { readyToReview: boolean; blockers: ArcaFinding[]; warnings: ArcaFinding[] };
