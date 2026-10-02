
"use client";

import {
  BadgeDollarSign,
  BarChart3,
  CircleDollarSign,
  CreditCard,
  PackageSearch,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  businessId: string;
  language: LanguageCode;
  currency: string;
  locale: string;
};

type SaleRow = {
  id: string;
  total: number;
  cost_total: number;
  status: string;
  created_at: string;
};

type ReturnRow = { id: string; amount: number; created_at: string };
type ExpenseRow = { id: string; amount: number; occurred_at: string };
type CustomerRow = { id: string; name: string; account_balance: number };
type PayableRow = {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  status: string;
};
type SaleItemRow = {
  sale_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
};
type PaymentRow = {
  sale_id: string;
  method: string;
  amount: number;
};

function tr(
  language: LanguageCode,
  values: Partial<Record<LanguageCode, string>>
) {
  return values[language] ?? values.en ?? values.es ?? "";
}

function money(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function inputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function BusinessReports({
  businessId,
  language,
  currency,
  locale
}: Props) {
  const initialFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return inputDate(date);
  }, []);

  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(inputDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [payables, setPayables] = useState<PayableRow[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItemRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  async function reload() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    try {
      const from = new Date(fromDate + "T00:00:00").toISOString();
      const to = new Date(toDate + "T23:59:59.999").toISOString();

      const [
        saleRes,
        returnRes,
        expenseRes,
        customerRes,
        payableRes
      ] = await Promise.all([
        supabase
          .from("global_stock_sales")
          .select("id,total,cost_total,status,created_at")
          .eq("business_id", businessId)
          .gte("created_at", from)
          .lte("created_at", to)
          .in("status", [
            "completed",
            "partially_refunded",
            "refunded"
          ])
          .order("created_at", { ascending: false }),
        supabase
          .from("global_stock_returns")
          .select("id,amount,created_at")
          .eq("business_id", businessId)
          .eq("status", "completed")
          .gte("created_at", from)
          .lte("created_at", to),
        supabase
          .from("global_stock_expenses")
          .select("id,amount,occurred_at")
          .eq("business_id", businessId)
          .gte("occurred_at", from)
          .lte("occurred_at", to),
        supabase
          .from("global_stock_customers")
          .select("id,name,account_balance")
          .eq("business_id", businessId)
          .eq("active", true),
        supabase
          .from("global_stock_accounts_payable")
          .select("id,description,amount,paid_amount,status")
          .eq("business_id", businessId)
          .neq("status", "cancelled")
      ]);

      const nextSales = (saleRes.data as SaleRow[] | null) ?? [];
      setSales(nextSales);
      setReturns((returnRes.data as ReturnRow[] | null) ?? []);
      setExpenses((expenseRes.data as ExpenseRow[] | null) ?? []);
      setCustomers((customerRes.data as CustomerRow[] | null) ?? []);
      setPayables((payableRes.data as PayableRow[] | null) ?? []);

      const saleIds = nextSales.map((sale) => sale.id);
      if (!saleIds.length) {
        setSaleItems([]);
        setPayments([]);
        return;
      }

      const [itemRes, paymentRes] = await Promise.all([
        supabase
          .from("global_stock_sale_items")
          .select("sale_id,product_name,quantity,unit_price")
          .in("sale_id", saleIds),
        supabase
          .from("global_stock_payments")
          .select("sale_id,method,amount")
          .in("sale_id", saleIds)
      ]);

      setSaleItems((itemRes.data as SaleItemRow[] | null) ?? []);
      setPayments((paymentRes.data as PaymentRow[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, fromDate, toDate]);

  const grossSales = sales.reduce(
    (sum, sale) => sum + (Number(sale.total) || 0),
    0
  );
  const refunds = returns.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const netSales = Math.max(0, grossSales - refunds);
  const costOfGoods = sales.reduce(
    (sum, sale) => sum + (Number(sale.cost_total) || 0),
    0
  );
  const operatingExpenses = expenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const grossProfit = netSales - costOfGoods;
  const operatingProfit = grossProfit - operatingExpenses;
  const ticketAverage = sales.length ? netSales / sales.length : 0;
  const receivables = customers.reduce(
    (sum, item) =>
      sum + Math.max(0, Number(item.account_balance) || 0),
    0
  );
  const openPayables = payables.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,
        (Number(item.amount) || 0) -
          (Number(item.paid_amount) || 0)
      ),
    0
  );

  const topProducts = useMemo(() => {
    const groups = new Map<
      string,
      { name: string; units: number; revenue: number }
    >();

    for (const item of saleItems) {
      const current = groups.get(item.product_name) ?? {
        name: item.product_name,
        units: 0,
        revenue: 0
      };
      current.units += Number(item.quantity) || 0;
      current.revenue +=
        (Number(item.quantity) || 0) *
        (Number(item.unit_price) || 0);
      groups.set(item.product_name, current);
    }

    return [...groups.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [saleItems]);

  const paymentMix = useMemo(() => {
    const groups = new Map<string, number>();

    for (const payment of payments) {
      groups.set(
        payment.method,
        (groups.get(payment.method) ?? 0) +
          (Number(payment.amount) || 0)
      );
    }

    return [...groups.entries()]
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments]);

  return (
    <div className="space-y-4">
      <section className="apex-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
              Business Intelligence
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              {tr(language, {
                es: "Reporte financiero operativo",
                en: "Operating financial report",
                pt: "Relatório financeiro operacional",
                fr: "Rapport financier opérationnel",
                de: "Operativer Finanzbericht"
              })}
            </h3>
            <p className="mt-1 text-xs text-[var(--apex-muted)]">
              {tr(language, {
                es: "Ventas, devoluciones, gastos, cuentas por cobrar y obligaciones en un solo resumen.",
                en: "Sales, returns, expenses, receivables and obligations in one summary."
              })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
              Desde
              <input
                type="date"
                className="apex-input mt-1 min-h-10 w-full px-3 text-xs"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
              Hasta
              <input
                type="date"
                className="apex-input mt-1 min-h-10 w-full px-3 text-xs"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={<CircleDollarSign size={17} />}
          label={tr(language, { es: "Venta neta", en: "Net sales" })}
          value={money(netSales, currency, locale)}
          detail={
            refunds > 0
              ? tr(language, { es: "Devoluciones", en: "Returns" }) +
                ": " +
                money(refunds, currency, locale)
              : undefined
          }
        />
        <Kpi
          icon={<TrendingUp size={17} />}
          label={tr(language, {
            es: "Ganancia bruta",
            en: "Gross profit"
          })}
          value={money(grossProfit, currency, locale)}
        />
        <Kpi
          icon={<BadgeDollarSign size={17} />}
          label={tr(language, {
            es: "Resultado operativo",
            en: "Operating result"
          })}
          value={money(operatingProfit, currency, locale)}
          detail={
            tr(language, { es: "Gastos", en: "Expenses" }) +
            ": " +
            money(operatingExpenses, currency, locale)
          }
        />
        <Kpi
          icon={<ReceiptText size={17} />}
          label={tr(language, {
            es: "Ticket promedio",
            en: "Average ticket"
          })}
          value={money(ticketAverage, currency, locale)}
          detail={
            String(sales.length) +
            " " +
            tr(language, { es: "ventas", en: "sales" })
          }
        />
        <Kpi
          icon={<UsersRound size={17} />}
          label={tr(language, {
            es: "Por cobrar",
            en: "Receivables"
          })}
          value={money(receivables, currency, locale)}
        />
        <Kpi
          icon={<CreditCard size={17} />}
          label={tr(language, {
            es: "Por pagar",
            en: "Payables"
          })}
          value={money(openPayables, currency, locale)}
        />
        <Kpi
          icon={<TrendingDown size={17} />}
          label={tr(language, {
            es: "Costo vendido",
            en: "Cost of goods"
          })}
          value={money(costOfGoods, currency, locale)}
        />
        <Kpi
          icon={<BarChart3 size={17} />}
          label={tr(language, {
            es: "Margen operativo",
            en: "Operating margin"
          })}
          value={
            netSales > 0
              ? ((operatingProfit / netSales) * 100).toFixed(1) + "%"
              : "0%"
          }
          detail={loading ? "Actualizando…" : undefined}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="apex-card overflow-hidden">
          <div className="border-b border-[var(--apex-border)] p-4">
            <div className="flex items-center gap-2">
              <PackageSearch size={16} />
              <h4 className="font-semibold">
                {tr(language, {
                  es: "Productos con más facturación",
                  en: "Top revenue products"
                })}
              </h4>
            </div>
          </div>
          <div className="divide-y divide-[var(--apex-border)]">
            {topProducts.length ? (
              topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {index + 1}. {product.name}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                      {product.units.toFixed(
                        Number.isInteger(product.units) ? 0 : 2
                      )}{" "}
                      unidades
                    </p>
                  </div>
                  <strong className="shrink-0 text-sm">
                    {money(product.revenue, currency, locale)}
                  </strong>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </div>
        </section>

        <section className="apex-card overflow-hidden">
          <div className="border-b border-[var(--apex-border)] p-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} />
              <h4 className="font-semibold">
                {tr(language, {
                  es: "Medios de pago",
                  en: "Payment mix"
                })}
              </h4>
            </div>
          </div>
          <div className="divide-y divide-[var(--apex-border)]">
            {paymentMix.length ? (
              paymentMix.map((payment) => {
                const share =
                  netSales > 0
                    ? Math.min(100, (payment.amount / netSales) * 100)
                    : 0;

                return (
                  <div key={payment.method} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold">
                        {payment.method}
                      </span>
                      <strong className="text-sm">
                        {money(payment.amount, currency, locale)}
                      </strong>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--apex-border)]">
                      <div
                        className="h-full rounded-full bg-[#8F0000]"
                        style={{ width: String(share) + "%" }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <section className="apex-card p-4">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]">
        {icon}
      </span>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
          {detail}
        </p>
      )}
    </section>
  );
}

function Empty() {
  return (
    <p className="p-4 text-sm text-[var(--apex-muted)]">
      Todavía no hay datos para este período.
    </p>
  );
}
