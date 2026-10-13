export type FiscalMoneyInput = {
  net_amount: string | number;
  vat_amount: string | number;
  exempt_amount: string | number;
  other_taxes: string | number;
  total_amount: string | number;
};
export type FiscalLineInput = {
  description: string;
  quantity: string | number;
  unit_price: string | number;
  line_total: string | number;
};
export declare function validateFiscalTotals(
  document: FiscalMoneyInput,
  lines: FiscalLineInput[]
): { ok: boolean; code: string };
