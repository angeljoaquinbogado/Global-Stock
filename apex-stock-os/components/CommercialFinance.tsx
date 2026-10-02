"use client";

import {
  BadgePercent,
  CircleDollarSign,
  FileText,
  RotateCcw,
  UsersRound
} from "lucide-react";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  businessId: string;
  language: LanguageCode;
  currency: string;
  locale: string;
};

type Tab = "accounts" | "payables" | "quotes" | "returns" | "promotions";

type Customer = {
  id: string;
  name: string;
  account_balance: number;
};

type Payable = {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  currency: string;
  due_at: string | null;
  status: string;
};

type Quote = {
  id: string;
  number: string | null;
  status: string;
  total: number;
  currency: string;
  created_at: string;
};

type Sale = {
  id: string;
  total: number;
  currency: string;
  status: string;
  created_at: string;
  cash_session_id: string | null;
};

type Promotion = {
  id: string;
  name: string;
  kind: string;
  value: number | null;
  active: boolean;
};

const tabs: Array<{ id: Tab; icon: typeof UsersRound }> = [
  { id: "accounts", icon: UsersRound },
  { id: "payables", icon: CircleDollarSign },
  { id: "quotes", icon: FileText },
  { id: "returns", icon: RotateCcw },
  { id: "promotions", icon: BadgePercent }
];

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

export function CommercialFinance({
  businessId,
  language,
  currency,
  locale
}: Props) {
  const [tab, setTab] = useState<Tab>("accounts");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [ledgerKind, setLedgerKind] = useState("charge");
  const [ledgerAmount, setLedgerAmount] = useState("");
  const [ledgerNote, setLedgerNote] = useState("");

  const [payableDescription, setPayableDescription] = useState("");
  const [payableAmount, setPayableAmount] = useState("");
  const [payableDue, setPayableDue] = useState("");
  const [selectedPayable, setSelectedPayable] = useState("");
  const [payablePayment, setPayablePayment] = useState("");

  const [quoteCustomer, setQuoteCustomer] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteQuantity, setQuoteQuantity] = useState("1");
  const [quoteUnitPrice, setQuoteUnitPrice] = useState("");

  const [selectedSale, setSelectedSale] = useState("");

  const [promotionName, setPromotionName] = useState("");
  const [promotionKind, setPromotionKind] = useState("percentage");
  const [promotionValue, setPromotionValue] = useState("");

  const tabLabel: Record<Tab, string> = {
    accounts: tr(language, {
      es: "Cuenta corriente",
      en: "Customer account",
      pt: "Conta corrente",
      fr: "Compte client",
      de: "Kundenkonto"
    }),
    payables: tr(language, {
      es: "Cuentas a pagar",
      en: "Accounts payable",
      pt: "Contas a pagar",
      fr: "Comptes fournisseurs",
      de: "Verbindlichkeiten"
    }),
    quotes: tr(language, {
      es: "Presupuestos",
      en: "Quotes",
      pt: "Orçamentos",
      fr: "Devis",
      de: "Angebote"
    }),
    returns: tr(language, {
      es: "Devoluciones",
      en: "Returns",
      pt: "Devoluções",
      fr: "Retours",
      de: "Retouren"
    }),
    promotions: tr(language, {
      es: "Promociones",
      en: "Promotions",
      pt: "Promoções",
      fr: "Promotions",
      de: "Aktionen"
    })
  };

  async function reload() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const [customerRes, payableRes, quoteRes, saleRes, promoRes] =
      await Promise.all([
        supabase
          .from("global_stock_customers")
          .select("id,name,account_balance")
          .eq("business_id", businessId)
          .eq("active", true)
          .order("name", { ascending: true }),
        supabase
          .from("global_stock_accounts_payable")
          .select("id,description,amount,paid_amount,currency,due_at,status")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_quotes")
          .select("id,number,status,total,currency,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_sales")
          .select("id,total,currency,status,created_at,cash_session_id")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_promotions")
          .select("id,name,kind,value,active")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
      ]);

    const nextCustomers = (customerRes.data as Customer[] | null) ?? [];
    const nextPayables = (payableRes.data as Payable[] | null) ?? [];
    const nextSales = (saleRes.data as Sale[] | null) ?? [];

    setCustomers(nextCustomers);
    setPayables(nextPayables);
    setQuotes((quoteRes.data as Quote[] | null) ?? []);
    setSales(nextSales);
    setPromotions((promoRes.data as Promotion[] | null) ?? []);

    setCustomerId((current) => current || nextCustomers[0]?.id || "");
    setSelectedPayable((current) => current || nextPayables[0]?.id || "");
    setSelectedSale(
      (current) =>
        current ||
        nextSales.find((sale) => sale.status === "completed")?.id ||
        ""
    );
  }

  useEffect(() => {
    void reload();
  // Reload when business changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function postLedger() {
    if (!customerId || !ledgerAmount) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.rpc("global_stock_post_customer_ledger", {
      target_business_id: businessId,
      target_customer_id: customerId,
      entry_kind: ledgerKind,
      entry_amount: Math.max(0, Number(ledgerAmount) || 0),
      entry_notes: ledgerNote.trim() || null,
      entry_reference: null
    });

    setLedgerAmount("");
    setLedgerNote("");
    await reload();
  }

  async function createPayable() {
    const amount = Math.max(0, Number(payableAmount) || 0);
    if (!payableDescription.trim() || !amount) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_accounts_payable").insert({
      business_id: businessId,
      description: payableDescription.trim(),
      amount,
      paid_amount: 0,
      currency,
      due_at: payableDue || null,
      status: "pending"
    });

    setPayableDescription("");
    setPayableAmount("");
    setPayableDue("");
    await reload();
  }

  async function payPayable() {
    if (!selectedPayable || !payablePayment) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.rpc("global_stock_apply_payable_payment", {
      target_business_id: businessId,
      target_payable_id: selectedPayable,
      payment_amount: Math.max(0, Number(payablePayment) || 0)
    });

    setPayablePayment("");
    await reload();
  }

  async function createQuote() {
    const quantity = Math.max(1, Number(quoteQuantity) || 1);
    const unitPrice = Math.max(0, Number(quoteUnitPrice) || 0);
    if (!quoteDescription.trim() || !unitPrice) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data: auth } = await supabase.auth.getSession();
    const total = quantity * unitPrice;

    const { data: quote } = await supabase
      .from("global_stock_quotes")
      .insert({
        business_id: businessId,
        customer_id: quoteCustomer || null,
        user_id: auth.session?.user.id ?? null,
        number: "P-" + Date.now().toString().slice(-8),
        status: "draft",
        currency,
        subtotal: total,
        total
      })
      .select("id")
      .single();

    if (quote?.id) {
      await supabase.from("global_stock_quote_items").insert({
        business_id: businessId,
        quote_id: quote.id,
        description: quoteDescription.trim(),
        quantity,
        unit_price: unitPrice
      });
    }

    setQuoteDescription("");
    setQuoteQuantity("1");
    setQuoteUnitPrice("");
    await reload();
  }

  async function refundSale() {
    const sale = sales.find((item) => item.id === selectedSale);
    if (!sale || sale.status !== "completed") return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data: auth } = await supabase.auth.getSession();
    const { data: items } = await supabase
      .from("global_stock_sale_items")
      .select("id,product_key,product_name,quantity,unit_price,unit_cost")
      .eq("sale_id", sale.id);

    const rows =
      (items as Array<{
        id: string;
        product_key: string | null;
        product_name: string;
        quantity: number;
        unit_price: number;
        unit_cost: number;
      }> | null) ?? [];

    const { data: createdReturn } = await supabase
      .from("global_stock_returns")
      .insert({
        business_id: businessId,
        sale_id: sale.id,
        user_id: auth.session?.user.id ?? null,
        amount: sale.total,
        reason: "Devolución total",
        status: "completed"
      })
      .select("id")
      .single();

    if (!createdReturn?.id) return;

    if (rows.length) {
      await supabase.from("global_stock_return_items").insert(
        rows.map((item) => ({
          business_id: businessId,
          return_id: createdReturn.id,
          sale_item_id: item.id,
          product_key: item.product_key,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_cost: item.unit_cost,
          restock: true
        }))
      );

      const stockRows = rows
        .filter((item) => item.product_key)
        .map((item) => ({
          business_id: businessId,
          product_key: item.product_key,
          user_id: auth.session?.user.id ?? null,
          kind: "return",
          quantity: Math.abs(Number(item.quantity) || 0),
          reason: "Devolución de venta",
          reference_id: createdReturn.id
        }));

      if (stockRows.length) {
        await supabase
          .from("global_stock_stock_movements")
          .insert(stockRows);
      }
    }

    await supabase
      .from("global_stock_sales")
      .update({ status: "refunded" })
      .eq("id", sale.id);

    if (sale.cash_session_id) {
      await supabase.from("global_stock_cash_movements").insert({
        business_id: businessId,
        cash_session_id: sale.cash_session_id,
        user_id: auth.session?.user.id ?? null,
        kind: "refund",
        amount: sale.total,
        description: "Devolución de venta",
        reference_id: sale.id
      });
    }

    await supabase.from("global_stock_audit_events").insert({
      business_id: businessId,
      user_id: auth.session?.user.id ?? null,
      action: "sale.refunded",
      entity_type: "sale",
      entity_id: sale.id,
      metadata: {
        returnId: createdReturn.id,
        total: sale.total
      }
    });

    window.dispatchEvent(
      new CustomEvent("global-stock-return-restock", {
        detail: rows
          .filter((item) => item.product_key)
          .map((item) => ({
            productKey: item.product_key,
            quantity: Math.abs(Number(item.quantity) || 0)
          }))
      })
    );

    await reload();
  }

  async function createPromotion() {
    if (!promotionName.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_promotions").insert({
      business_id: businessId,
      name: promotionName.trim(),
      kind: promotionKind,
      value: Math.max(0, Number(promotionValue) || 0),
      conditions: {},
      active: true
    });

    setPromotionName("");
    setPromotionValue("");
    await reload();
  }

  async function togglePromotion(id: string, active: boolean) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase
      .from("global_stock_promotions")
      .update({ active })
      .eq("id", id);

    await reload();
  }

  return (
    <section className="apex-card p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
          Commerce & Finance
        </p>
        <h3 className="mt-1 text-lg font-semibold">
          {tr(language, {
            es: "Clientes y finanzas",
            en: "Customers & finance",
            pt: "Clientes e finanças",
            fr: "Clients et finances",
            de: "Kunden & Finanzen"
          })}
        </h3>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold " +
              (tab === id
                ? "border-[#8F0000]/60 bg-[#8F0000]/10 text-[#8F0000]"
                : "border-[var(--apex-border)]")
            }
          >
            <Icon size={14} />
            {tabLabel[id]}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "accounts" && (
          <PanelGrid
            title={tabLabel.accounts}
            form={
              <>
                <select
                  className="apex-input w-full p-3"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                >
                  <option value="">Cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <select
                  className="apex-input w-full p-3"
                  value={ledgerKind}
                  onChange={(event) => setLedgerKind(event.target.value)}
                >
                  <option value="charge">Cargo / deuda</option>
                  <option value="payment">Pago</option>
                  <option value="credit">Crédito a favor</option>
                  <option value="adjustment">Ajuste</option>
                </select>
                <input
                  className="apex-input w-full p-3"
                  inputMode="decimal"
                  placeholder="Importe"
                  value={ledgerAmount}
                  onChange={(event) => setLedgerAmount(event.target.value)}
                />
                <input
                  className="apex-input w-full p-3"
                  placeholder="Nota"
                  value={ledgerNote}
                  onChange={(event) => setLedgerNote(event.target.value)}
                />
                <Action
                  label={tr(language, {
                    es: "Registrar movimiento",
                    en: "Post movement"
                  })}
                  onClick={() => void postLedger()}
                />
              </>
            }
          >
            {customers.map((customer) => (
              <Line
                key={customer.id}
                title={customer.name}
                subtitle={
                  customer.account_balance > 0
                    ? "Saldo pendiente"
                    : customer.account_balance < 0
                      ? "Saldo a favor"
                      : "Al día"
                }
                value={money(customer.account_balance, currency, locale)}
              />
            ))}
          </PanelGrid>
        )}

        {tab === "payables" && (
          <div className="grid gap-4 xl:grid-cols-2">
            <SimplePanel title="Nueva cuenta a pagar">
              <input
                className="apex-input w-full p-3"
                placeholder="Descripción"
                value={payableDescription}
                onChange={(event) =>
                  setPayableDescription(event.target.value)
                }
              />
              <input
                className="apex-input w-full p-3"
                inputMode="decimal"
                placeholder="Importe"
                value={payableAmount}
                onChange={(event) => setPayableAmount(event.target.value)}
              />
              <input
                className="apex-input w-full p-3"
                type="date"
                value={payableDue}
                onChange={(event) => setPayableDue(event.target.value)}
              />
              <Action
                label="Guardar deuda"
                onClick={() => void createPayable()}
              />
            </SimplePanel>

            <SimplePanel title="Registrar pago">
              <select
                className="apex-input w-full p-3"
                value={selectedPayable}
                onChange={(event) => setSelectedPayable(event.target.value)}
              >
                <option value="">Cuenta pendiente</option>
                {payables
                  .filter((item) => item.status !== "paid")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.description}
                    </option>
                  ))}
              </select>
              <input
                className="apex-input w-full p-3"
                inputMode="decimal"
                placeholder="Importe a pagar"
                value={payablePayment}
                onChange={(event) =>
                  setPayablePayment(event.target.value)
                }
              />
              <Action
                label="Aplicar pago"
                onClick={() => void payPayable()}
              />
            </SimplePanel>

            <section className="apex-card overflow-hidden xl:col-span-2">
              <div className="divide-y divide-[var(--apex-border)]">
                {payables.map((item) => (
                  <Line
                    key={item.id}
                    title={item.description}
                    subtitle={
                      item.status +
                      " · pagado " +
                      money(
                        item.paid_amount,
                        item.currency || currency,
                        locale
                      )
                    }
                    value={money(
                      item.amount,
                      item.currency || currency,
                      locale
                    )}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "quotes" && (
          <PanelGrid
            title={tabLabel.quotes}
            form={
              <>
                <select
                  className="apex-input w-full p-3"
                  value={quoteCustomer}
                  onChange={(event) => setQuoteCustomer(event.target.value)}
                >
                  <option value="">Sin cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <input
                  className="apex-input w-full p-3"
                  placeholder="Descripción"
                  value={quoteDescription}
                  onChange={(event) =>
                    setQuoteDescription(event.target.value)
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="apex-input w-full p-3"
                    inputMode="decimal"
                    placeholder="Cantidad"
                    value={quoteQuantity}
                    onChange={(event) =>
                      setQuoteQuantity(event.target.value)
                    }
                  />
                  <input
                    className="apex-input w-full p-3"
                    inputMode="decimal"
                    placeholder="Precio"
                    value={quoteUnitPrice}
                    onChange={(event) =>
                      setQuoteUnitPrice(event.target.value)
                    }
                  />
                </div>
                <Action
                  label="Crear presupuesto"
                  onClick={() => void createQuote()}
                />
              </>
            }
          >
            {quotes.map((quote) => (
              <Line
                key={quote.id}
                title={quote.number || "Presupuesto"}
                subtitle={
                  quote.status +
                  " · " +
                  new Date(quote.created_at).toLocaleDateString(locale)
                }
                value={money(
                  quote.total,
                  quote.currency || currency,
                  locale
                )}
              />
            ))}
          </PanelGrid>
        )}

        {tab === "returns" && (
          <SimplePanel title={tabLabel.returns}>
            <select
              className="apex-input w-full p-3"
              value={selectedSale}
              onChange={(event) => setSelectedSale(event.target.value)}
            >
              <option value="">Venta</option>
              {sales
                .filter((sale) => sale.status === "completed")
                .map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    {new Date(sale.created_at).toLocaleString(locale)}
                    {" · "}
                    {money(
                      sale.total,
                      sale.currency || currency,
                      locale
                    )}
                  </option>
                ))}
            </select>
            <p className="text-xs leading-5 text-[var(--apex-muted)]">
              {tr(language, {
                es: "La devolución total revierte la venta, registra el reembolso y devuelve las unidades al stock.",
                en: "A full return reverses the sale, records the refund and puts the units back into stock."
              })}
            </p>
            <Action
              label={tr(language, {
                es: "Devolver venta completa",
                en: "Refund full sale"
              })}
              onClick={() => void refundSale()}
            />
          </SimplePanel>
        )}

        {tab === "promotions" && (
          <PanelGrid
            title={tabLabel.promotions}
            form={
              <>
                <input
                  className="apex-input w-full p-3"
                  placeholder="Nombre"
                  value={promotionName}
                  onChange={(event) =>
                    setPromotionName(event.target.value)
                  }
                />
                <select
                  className="apex-input w-full p-3"
                  value={promotionKind}
                  onChange={(event) =>
                    setPromotionKind(event.target.value)
                  }
                >
                  <option value="percentage">% descuento</option>
                  <option value="fixed">Importe fijo</option>
                  <option value="buy_x_get_y">2x1 / NxM</option>
                  <option value="bundle">Combo</option>
                  <option value="customer_group">Grupo de clientes</option>
                  <option value="loyalty">Fidelización</option>
                </select>
                <input
                  className="apex-input w-full p-3"
                  inputMode="decimal"
                  placeholder="Valor"
                  value={promotionValue}
                  onChange={(event) =>
                    setPromotionValue(event.target.value)
                  }
                />
                <Action
                  label="Crear promoción"
                  onClick={() => void createPromotion()}
                />
              </>
            }
          >
            {promotions.map((promotion) => (
              <Line
                key={promotion.id}
                title={promotion.name}
                subtitle={promotion.kind}
                value={
                  <button
                    type="button"
                    onClick={() =>
                      void togglePromotion(
                        promotion.id,
                        !promotion.active
                      )
                    }
                    className="rounded-xl border border-[var(--apex-border)] px-3 py-2 text-xs font-semibold"
                  >
                    {promotion.active ? "Activa" : "Pausada"}
                  </button>
                }
              />
            ))}
          </PanelGrid>
        )}
      </div>
    </section>
  );
}

function Action({
  label,
  onClick
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 w-full rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white"
    >
      {label}
    </button>
  );
}

function SimplePanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
      <h4 className="font-semibold">{title}</h4>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function PanelGrid({
  title,
  form,
  children
}: {
  title: string;
  form: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SimplePanel title={title}>{form}</SimplePanel>
      <section className="overflow-hidden rounded-[24px] border border-[var(--apex-border)] bg-[var(--apex-bg)]">
        <div className="divide-y divide-[var(--apex-border)]">
          {children}
        </div>
      </section>
    </div>
  );
}

function Line({
  title,
  subtitle,
  value
}: {
  title: string;
  subtitle: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 truncate text-[10px] text-[var(--apex-muted)]">
          {subtitle}
        </p>
      </div>
      <div className="shrink-0 text-sm font-semibold">{value}</div>
    </div>
  );
}
