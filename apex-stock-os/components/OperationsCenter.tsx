"use client";

import {
  Banknote,
  Building2,
  Landmark,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings2,
  ShoppingBag,
  Store,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AdvancedOperations } from "./AdvancedOperations";
import { CatalogAdvanced } from "./CatalogAdvanced";
import { CommercialFinance } from "./CommercialFinance";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  businessId: string | null;
  language: LanguageCode;
  currency: string;
  locale: string;
  businessType: string;
  demoMode?: boolean;
};

type Tab =
  | "cash"
  | "customers"
  | "expenses"
  | "locations"
  | "purchases"
  | "team"
  | "advanced";

type CashSession = {
  id: string;
  opening_amount: number;
  opened_at: string;
  status: "open" | "closed";
};

type CashMovement = {
  id: string;
  kind: string;
  amount: number;
  description: string | null;
  payment_method: string | null;
  created_at: string;
};

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  account_balance: number;
  loyalty_points: number;
};

type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string | null;
  occurred_at: string;
};

type Location = {
  id: string;
  name: string;
  kind: string;
  address: string | null;
};

type PurchaseOrder = {
  id: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
  notes: string | null;
  supplier_id: string | null;
};

type Member = {
  user_id: string;
  role: string;
  active: boolean;
  email: string | null;
};

type MemberInvite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
};

const words: Record<
  LanguageCode,
  {
    title: string;
    subtitle: string;
    cash: string;
    customers: string;
    expenses: string;
    locations: string;
    purchases: string;
    team: string;
    advanced: string;
    cloudRequired: string;
    demo: string;
    openCash: string;
    closeCash: string;
    openingAmount: string;
    closingAmount: string;
    currentCash: string;
    movement: string;
    amount: string;
    description: string;
    add: string;
    name: string;
    phone: string;
    email: string;
    category: string;
    paymentMethod: string;
    kind: string;
    address: string;
    supplier: string;
    total: string;
    status: string;
    role: string;
    empty: string;
  }
> = {
  es: {
    title: "Gestión del negocio",
    subtitle:
      "Caja, clientes, gastos, sucursales, compras y equipo en un solo lugar.",
    cash: "Caja",
    customers: "Clientes",
    expenses: "Gastos",
    locations: "Sucursales",
    purchases: "Compras",
    team: "Equipo",
    advanced: "Herramientas",
    cloudRequired: "La gestión cloud se activa al iniciar sesión con una cuenta real.",
    demo: "La cuenta demo no escribe datos reales en la nube.",
    openCash: "Abrir caja",
    closeCash: "Cerrar caja",
    openingAmount: "Fondo inicial",
    closingAmount: "Efectivo contado",
    currentCash: "Efectivo esperado",
    movement: "Movimiento",
    amount: "Importe",
    description: "Descripción",
    add: "Agregar",
    name: "Nombre",
    phone: "Teléfono",
    email: "Email",
    category: "Categoría",
    paymentMethod: "Medio de pago",
    kind: "Tipo",
    address: "Dirección",
    supplier: "Proveedor",
    total: "Total",
    status: "Estado",
    role: "Rol",
    empty: "Todavía no hay registros."
  },
  en: {
    title: "Business operations",
    subtitle:
      "Cash, customers, expenses, locations, purchasing and staff in one place.",
    cash: "Cash",
    customers: "Customers",
    expenses: "Expenses",
    locations: "Locations",
    purchases: "Purchasing",
    team: "Team",
    advanced: "Tools",
    cloudRequired: "Cloud operations activate after signing in with a real account.",
    demo: "The demo account never writes real cloud data.",
    openCash: "Open cash",
    closeCash: "Close cash",
    openingAmount: "Opening amount",
    closingAmount: "Counted cash",
    currentCash: "Expected cash",
    movement: "Movement",
    amount: "Amount",
    description: "Description",
    add: "Add",
    name: "Name",
    phone: "Phone",
    email: "Email",
    category: "Category",
    paymentMethod: "Payment method",
    kind: "Type",
    address: "Address",
    supplier: "Supplier",
    total: "Total",
    status: "Status",
    role: "Role",
    empty: "No records yet."
  },
  pt: {
    title: "Gestão do negócio",
    subtitle: "Caixa, clientes, despesas, filiais, compras e equipe em um só lugar.",
    cash: "Caixa", customers: "Clientes", expenses: "Despesas", locations: "Filiais",
    purchases: "Compras", team: "Equipe", advanced: "Ferramentas", cloudRequired: "A gestão cloud ativa ao entrar com uma conta real.",
    demo: "A conta demo não grava dados reais na nuvem.", openCash: "Abrir caixa", closeCash: "Fechar caixa",
    openingAmount: "Fundo inicial", closingAmount: "Dinheiro contado", currentCash: "Dinheiro esperado",
    movement: "Movimento", amount: "Valor", description: "Descrição", add: "Adicionar", name: "Nome",
    phone: "Telefone", email: "Email", category: "Categoria", paymentMethod: "Forma de pagamento",
    kind: "Tipo", address: "Endereço", supplier: "Fornecedor", total: "Total", status: "Status",
    role: "Função", empty: "Ainda não há registros."
  },
  fr: {
    title: "Gestion de l’activité",
    subtitle: "Caisse, clients, dépenses, sites, achats et équipe au même endroit.",
    cash: "Caisse", customers: "Clients", expenses: "Dépenses", locations: "Sites",
    purchases: "Achats", team: "Équipe", advanced: "Outils", cloudRequired: "La gestion cloud s’active avec un compte réel.",
    demo: "Le compte démo n’écrit aucune donnée réelle dans le cloud.", openCash: "Ouvrir la caisse", closeCash: "Fermer la caisse",
    openingAmount: "Fond initial", closingAmount: "Espèces comptées", currentCash: "Espèces attendues",
    movement: "Mouvement", amount: "Montant", description: "Description", add: "Ajouter", name: "Nom",
    phone: "Téléphone", email: "Email", category: "Catégorie", paymentMethod: "Moyen de paiement",
    kind: "Type", address: "Adresse", supplier: "Fournisseur", total: "Total", status: "Statut",
    role: "Rôle", empty: "Aucun enregistrement pour le moment."
  },
  de: {
    title: "Betriebsverwaltung",
    subtitle: "Kasse, Kunden, Ausgaben, Standorte, Einkauf und Team an einem Ort.",
    cash: "Kasse", customers: "Kunden", expenses: "Ausgaben", locations: "Standorte",
    purchases: "Einkauf", team: "Team", advanced: "Werkzeuge", cloudRequired: "Cloud-Verwaltung wird mit einem echten Konto aktiviert.",
    demo: "Das Demokonto schreibt keine echten Cloud-Daten.", openCash: "Kasse öffnen", closeCash: "Kasse schließen",
    openingAmount: "Startbestand", closingAmount: "Gezähltes Bargeld", currentCash: "Erwartetes Bargeld",
    movement: "Bewegung", amount: "Betrag", description: "Beschreibung", add: "Hinzufügen", name: "Name",
    phone: "Telefon", email: "E-Mail", category: "Kategorie", paymentMethod: "Zahlungsart",
    kind: "Typ", address: "Adresse", supplier: "Lieferant", total: "Gesamt", status: "Status",
    role: "Rolle", empty: "Noch keine Einträge."
  }
};

function money(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

const tabs: Array<{ id: Tab; icon: typeof Store }> = [
  { id: "cash", icon: Banknote },
  { id: "customers", icon: UsersRound },
  { id: "expenses", icon: ReceiptText },
  { id: "locations", icon: Building2 },
  { id: "purchases", icon: ShoppingBag },
  { id: "team", icon: Landmark },
  { id: "advanced", icon: Settings2 }
];

export function OperationsCenter({
  businessId,
  language,
  currency,
  locale,
  businessType,
  demoMode = false
}: Props) {
  const t = words[language];
  const [tab, setTab] = useState<Tab>("cash");
  const [loading, setLoading] = useState(false);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<MemberInvite[]>([]);

  const [opening, setOpening] = useState("0");
  const [closing, setClosing] = useState("0");
  const [movementKind, setMovementKind] = useState("income");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [expenseCategory, setExpenseCategory] = useState("Operación");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  const [locationName, setLocationName] = useState("");
  const [locationKind, setLocationKind] = useState("store");
  const [locationAddress, setLocationAddress] = useState("");

  const [purchaseSupplier, setPurchaseSupplier] = useState("");
  const [purchaseTotal, setPurchaseTotal] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("cashier");

  const expectedCash = useMemo(() => {
    if (!cashSession) return 0;
    const delta = movements.reduce((sum, movement) => {
      const amount = Number(movement.amount) || 0;
      if (["expense", "withdrawal", "refund"].includes(movement.kind)) {
        return sum - amount;
      }
      return sum + amount;
    }, 0);
    return Number(cashSession.opening_amount || 0) + delta;
  }, [cashSession, movements]);

  async function reload() {
    if (!businessId || demoMode) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    try {
      const [
        cashRes,
        movementRes,
        customerRes,
        expenseRes,
        locationRes,
        purchaseRes,
        memberRes,
        inviteRes
      ] = await Promise.all([
          supabase
            .from("global_stock_cash_sessions")
            .select("id,opening_amount,opened_at,status")
            .eq("business_id", businessId)
            .eq("status", "open")
            .order("opened_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("global_stock_cash_movements")
            .select("id,kind,amount,description,payment_method,created_at")
            .eq("business_id", businessId)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("global_stock_customers")
            .select("id,name,email,phone,account_balance,loyalty_points")
            .eq("business_id", businessId)
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("global_stock_expenses")
            .select("id,category,description,amount,payment_method,occurred_at")
            .eq("business_id", businessId)
            .order("occurred_at", { ascending: false })
            .limit(200),
          supabase
            .from("global_stock_locations")
            .select("id,name,kind,address")
            .eq("business_id", businessId)
            .eq("active", true)
            .order("created_at", { ascending: true }),
          supabase
            .from("global_stock_purchase_orders")
            .select("id,status,total,currency,created_at,notes,supplier_id")
            .eq("business_id", businessId)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("global_stock_members")
            .select("user_id,role,active,email")
            .eq("business_id", businessId)
            .order("created_at", { ascending: true }),
          supabase
            .from("global_stock_member_invites")
            .select("id,email,role,status,expires_at")
            .eq("business_id", businessId)
            .order("created_at", { ascending: false })
        ]);

      setCashSession((cashRes.data as CashSession | null) ?? null);
      setMovements((movementRes.data as CashMovement[] | null) ?? []);
      setCustomers((customerRes.data as Customer[] | null) ?? []);
      setExpenses((expenseRes.data as Expense[] | null) ?? []);
      setLocations((locationRes.data as Location[] | null) ?? []);
      setPurchases((purchaseRes.data as PurchaseOrder[] | null) ?? []);
      setMembers((memberRes.data as Member[] | null) ?? []);
      setInvites((inviteRes.data as MemberInvite[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  // Reload when the current business changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, demoMode]);

  if (demoMode || !businessId) {
    return (
      <div className="space-y-5">
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8F0000]">
            Business OS
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">{t.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
            {demoMode ? t.demo : t.cloudRequired}
          </p>
        </section>
      </div>
    );
  }

  async function openCash() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId) return;
    const { data: session } = await supabase.auth.getSession();
    await supabase.from("global_stock_cash_sessions").insert({
      business_id: businessId,
      user_id: session.session?.user.id ?? null,
      opening_amount: Math.max(0, Number(opening) || 0),
      status: "open"
    });
    setOpening("0");
    await reload();
  }

  async function addMovement() {
    if (!cashSession || !movementAmount) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId) return;
    const { data: session } = await supabase.auth.getSession();
    const amount = Math.max(0, Number(movementAmount) || 0);
    if (!amount) return;

    await supabase.from("global_stock_cash_movements").insert({
      business_id: businessId,
      cash_session_id: cashSession.id,
      user_id: session.session?.user.id ?? null,
      kind: movementKind,
      amount,
      description: movementDescription.trim() || null,
      payment_method: paymentMethod
    });

    if (movementKind === "expense") {
      await supabase.from("global_stock_expenses").insert({
        business_id: businessId,
        user_id: session.session?.user.id ?? null,
        category: expenseCategory || "Caja",
        description: movementDescription.trim() || "Egreso de caja",
        amount,
        currency,
        payment_method: paymentMethod
      });
    }

    setMovementAmount("");
    setMovementDescription("");
    await reload();
  }

  async function closeCash() {
    if (!cashSession) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const counted = Math.max(0, Number(closing) || 0);
    await supabase
      .from("global_stock_cash_sessions")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closing_amount: counted,
        expected_amount: expectedCash,
        difference: counted - expectedCash
      })
      .eq("id", cashSession.id);
    setClosing("0");
    await reload();
  }

  async function addCustomer() {
    if (!customerName.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId) return;
    await supabase.from("global_stock_customers").insert({
      business_id: businessId,
      name: customerName.trim(),
      phone: customerPhone.trim() || null,
      email: customerEmail.trim() || null
    });
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    await reload();
  }

  async function addExpense() {
    if (!expenseDescription.trim() || !expenseAmount) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId) return;
    const { data: session } = await supabase.auth.getSession();
    await supabase.from("global_stock_expenses").insert({
      business_id: businessId,
      user_id: session.session?.user.id ?? null,
      category: expenseCategory.trim() || "Otros",
      description: expenseDescription.trim(),
      amount: Math.max(0, Number(expenseAmount) || 0),
      currency,
      payment_method: paymentMethod
    });
    setExpenseDescription("");
    setExpenseAmount("");
    await reload();
  }

  async function addLocation() {
    if (!locationName.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId) return;
    await supabase.from("global_stock_locations").insert({
      business_id: businessId,
      name: locationName.trim(),
      kind: locationKind,
      address: locationAddress.trim() || null
    });
    setLocationName("");
    setLocationAddress("");
    await reload();
  }

  async function addPurchase() {
    if (!purchaseSupplier.trim() || !purchaseTotal) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId) return;
    const { data: session } = await supabase.auth.getSession();

    const { data: supplier } = await supabase
      .from("global_stock_suppliers")
      .insert({
        business_id: businessId,
        name: purchaseSupplier.trim()
      })
      .select("id")
      .single();

    await supabase.from("global_stock_purchase_orders").insert({
      business_id: businessId,
      supplier_id: supplier?.id ?? null,
      user_id: session.session?.user.id ?? null,
      status: "draft",
      currency,
      total: Math.max(0, Number(purchaseTotal) || 0),
      notes: purchaseNotes.trim() || null
    });

    setPurchaseSupplier("");
    setPurchaseTotal("");
    setPurchaseNotes("");
    await reload();
  }

  async function changeRole(userId: string, role: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId || role === "owner") return;
    await supabase
      .from("global_stock_members")
      .update({ role })
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .neq("role", "owner");
    await reload();
  }

  async function inviteMember() {
    const email = inviteEmail.trim().toLocaleLowerCase();
    if (!email || !email.includes("@")) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId) return;

    const { data: auth } = await supabase.auth.getSession();

    await supabase.from("global_stock_member_invites").insert({
      business_id: businessId,
      email,
      role: inviteRole,
      invited_by: auth.session?.user.id ?? null,
      status: "pending"
    });

    setInviteEmail("");
    await reload();
  }

  async function revokeInvite(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase
      .from("global_stock_member_invites")
      .update({ status: "revoked" })
      .eq("id", id);

    await reload();
  }

  async function setMemberActive(userId: string, active: boolean) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !businessId) return;

    await supabase
      .from("global_stock_members")
      .update({ active })
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .neq("role", "owner");

    await reload();
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8F0000]">
            Business OS
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
            {t.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--apex-border)] px-4 text-xs font-semibold"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Sync
        </button>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-xs font-semibold transition " +
              (tab === id
                ? "border-[#8F0000] bg-[#8F0000] text-white"
                : "border-[var(--apex-border)] bg-[var(--apex-surface)]")
            }
          >
            <Icon size={15} />
            {t[id]}
          </button>
        ))}
      </div>

      {tab === "cash" && (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="apex-card p-5">
            {!cashSession ? (
              <>
                <h3 className="text-lg font-semibold">{t.openCash}</h3>
                <label className="mt-4 block text-xs text-[var(--apex-muted)]">{t.openingAmount}</label>
                <input className="apex-input mt-2 w-full p-3" inputMode="decimal" value={opening} onChange={(e)=>setOpening(e.target.value)} />
                <button type="button" onClick={()=>void openCash()} className="mt-4 min-h-11 w-full rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white">
                  {t.openCash}
                </button>
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">{t.cash}</p>
                <h3 className="mt-2 text-2xl font-semibold">{money(expectedCash,currency,locale)}</h3>
                <p className="mt-1 text-xs text-[var(--apex-muted)]">{t.currentCash}</p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <select className="apex-input p-3 text-sm" value={movementKind} onChange={(e)=>setMovementKind(e.target.value)}>
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                    <option value="deposit">Depósito</option>
                    <option value="withdrawal">Retiro</option>
                    <option value="adjustment">Ajuste</option>
                  </select>
                  <select className="apex-input p-3 text-sm" value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}>
                    <option value="cash">Efectivo</option>
                    <option value="debit">Débito</option>
                    <option value="credit">Crédito</option>
                    <option value="transfer">Transferencia</option>
                    <option value="qr">QR</option>
                  </select>
                </div>
                <input className="apex-input mt-2 w-full p-3" inputMode="decimal" placeholder={t.amount} value={movementAmount} onChange={(e)=>setMovementAmount(e.target.value)} />
                <input className="apex-input mt-2 w-full p-3" placeholder={t.description} value={movementDescription} onChange={(e)=>setMovementDescription(e.target.value)} />
                <button type="button" onClick={()=>void addMovement()} className="mt-3 min-h-11 w-full rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white">
                  {t.add} {t.movement.toLowerCase()}
                </button>

                <div className="mt-6 border-t border-[var(--apex-border)] pt-4">
                  <input className="apex-input w-full p-3" inputMode="decimal" placeholder={t.closingAmount} value={closing} onChange={(e)=>setClosing(e.target.value)} />
                  <button type="button" onClick={()=>void closeCash()} className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--apex-border)] px-4 text-sm font-semibold">
                    {t.closeCash}
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="apex-card overflow-hidden">
            <div className="border-b border-[var(--apex-border)] p-5"><h3 className="font-semibold">{t.movement}</h3></div>
            <div className="divide-y divide-[var(--apex-border)]">
              {movements.length ? movements.map((m)=>(
                <div key={m.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-semibold">{m.description || m.kind}</p>
                    <p className="mt-1 text-[10px] text-[var(--apex-muted)]">{new Date(m.created_at).toLocaleString(locale)} · {m.payment_method || "—"}</p>
                  </div>
                  <strong className="text-sm">{money(m.amount,currency,locale)}</strong>
                </div>
              )) : <p className="p-5 text-sm text-[var(--apex-muted)]">{t.empty}</p>}
            </div>
          </section>
        </div>
      )}

      {tab === "customers" && (
        <TwoColumnForm
          title={t.customers}
          form={
            <>
              <input className="apex-input w-full p-3" placeholder={t.name} value={customerName} onChange={(e)=>setCustomerName(e.target.value)} />
              <input className="apex-input w-full p-3" placeholder={t.phone} value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} />
              <input className="apex-input w-full p-3" placeholder={t.email} value={customerEmail} onChange={(e)=>setCustomerEmail(e.target.value)} />
              <PrimaryButton onClick={()=>void addCustomer()}>{t.add}</PrimaryButton>
            </>
          }
          list={customers.map((customer)=>(
            <Row key={customer.id} title={customer.name} subtitle={[customer.phone,customer.email].filter(Boolean).join(" · ") || "—"} value={money(customer.account_balance,currency,locale)} />
          ))}
          empty={t.empty}
        />
      )}

      {tab === "expenses" && (
        <TwoColumnForm
          title={t.expenses}
          form={
            <>
              <input className="apex-input w-full p-3" placeholder={t.category} value={expenseCategory} onChange={(e)=>setExpenseCategory(e.target.value)} />
              <input className="apex-input w-full p-3" placeholder={t.description} value={expenseDescription} onChange={(e)=>setExpenseDescription(e.target.value)} />
              <input className="apex-input w-full p-3" inputMode="decimal" placeholder={t.amount} value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} />
              <PrimaryButton onClick={()=>void addExpense()}>{t.add}</PrimaryButton>
            </>
          }
          list={expenses.map((expense)=>(
            <Row key={expense.id} title={expense.description} subtitle={expense.category} value={money(expense.amount,currency,locale)} />
          ))}
          empty={t.empty}
        />
      )}

      {tab === "locations" && (
        <TwoColumnForm
          title={t.locations}
          form={
            <>
              <input className="apex-input w-full p-3" placeholder={t.name} value={locationName} onChange={(e)=>setLocationName(e.target.value)} />
              <select className="apex-input w-full p-3" value={locationKind} onChange={(e)=>setLocationKind(e.target.value)}>
                <option value="store">Local</option>
                <option value="warehouse">Depósito</option>
                <option value="kitchen">Cocina</option>
                <option value="office">Oficina</option>
                <option value="other">Otro</option>
              </select>
              <input className="apex-input w-full p-3" placeholder={t.address} value={locationAddress} onChange={(e)=>setLocationAddress(e.target.value)} />
              <PrimaryButton onClick={()=>void addLocation()}>{t.add}</PrimaryButton>
            </>
          }
          list={locations.map((location)=>(
            <Row key={location.id} title={location.name} subtitle={location.kind} value={location.address || "—"} />
          ))}
          empty={t.empty}
        />
      )}

      {tab === "purchases" && (
        <TwoColumnForm
          title={t.purchases}
          form={
            <>
              <input className="apex-input w-full p-3" placeholder={t.supplier} value={purchaseSupplier} onChange={(e)=>setPurchaseSupplier(e.target.value)} />
              <input className="apex-input w-full p-3" inputMode="decimal" placeholder={t.total} value={purchaseTotal} onChange={(e)=>setPurchaseTotal(e.target.value)} />
              <textarea className="apex-input min-h-24 w-full p-3" placeholder={t.description} value={purchaseNotes} onChange={(e)=>setPurchaseNotes(e.target.value)} />
              <PrimaryButton onClick={()=>void addPurchase()}>{t.add}</PrimaryButton>
            </>
          }
          list={purchases.map((purchase)=>(
            <Row key={purchase.id} title={purchase.notes || "Orden de compra"} subtitle={purchase.status} value={money(purchase.total,purchase.currency || currency,locale)} />
          ))}
          empty={t.empty}
        />
      )}

      {tab === "team" && (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="apex-card p-5">
            <h3 className="text-lg font-semibold">
              {language === "es" ? "Invitar persona" : "Invite member"}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--apex-muted)]">
              {language === "es"
                ? "La persona entra con su propia cuenta. Nunca compartas la contraseña del negocio."
                : "They sign in with their own account. Never share the business password."}
            </p>

            <input
              className="apex-input mt-4 w-full p-3"
              type="email"
              placeholder="email@ejemplo.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />

            <select
              className="apex-input mt-2 w-full p-3"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="warehouse">Warehouse</option>
              <option value="sales">Sales</option>
              <option value="accountant">Accountant</option>
              <option value="viewer">Viewer</option>
            </select>

            <PrimaryButton onClick={() => void inviteMember()}>
              {language === "es" ? "Crear invitación" : "Create invite"}
            </PrimaryButton>

            {invites.length > 0 && (
              <div className="mt-5 space-y-2">
                {invites.slice(0, 12).map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-2xl border border-[var(--apex-border)] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {invite.email}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                          {invite.role} · {invite.status}
                        </p>
                      </div>
                      {invite.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => void revokeInvite(invite.id)}
                          className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8F0000]"
                        >
                          {language === "es" ? "Revocar" : "Revoke"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="apex-card overflow-hidden">
            <div className="border-b border-[var(--apex-border)] p-5">
              <h3 className="font-semibold">{t.team}</h3>
              <p className="mt-1 text-xs text-[var(--apex-muted)]">
                Owner, admin, manager, cashier, warehouse, sales, accountant, viewer.
              </p>
            </div>

            <div className="divide-y divide-[var(--apex-border)]">
              {members.length ? (
                members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {member.email || `${member.user_id.slice(0, 8)}…`}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                        {member.active ? "Activo" : "Inactivo"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        className="apex-input min-h-10 px-3 text-sm"
                        value={member.role}
                        disabled={member.role === "owner"}
                        onChange={(event) =>
                          void changeRole(member.user_id, event.target.value)
                        }
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="cashier">Cashier</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="sales">Sales</option>
                        <option value="accountant">Accountant</option>
                        <option value="viewer">Viewer</option>
                      </select>

                      {member.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() =>
                            void setMemberActive(
                              member.user_id,
                              !member.active
                            )
                          }
                          className="min-h-10 rounded-xl border border-[var(--apex-border)] px-3 text-xs font-semibold"
                        >
                          {member.active
                            ? language === "es"
                              ? "Desactivar"
                              : "Disable"
                            : language === "es"
                              ? "Activar"
                              : "Enable"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-5 text-sm text-[var(--apex-muted)]">
                  {t.empty}
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "advanced" && (
        <div className="space-y-4">
          <AdvancedOperations
            businessId={businessId}
            businessType={businessType}
            language={language}
            currency={currency}
            locale={locale}
          />
          <CommercialFinance
            businessId={businessId}
            language={language}
            currency={currency}
            locale={locale}
          />
          <CatalogAdvanced
            businessId={businessId}
            language={language}
          />
        </div>
      )}
    </div>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="min-h-11 w-full rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white">
      <span className="inline-flex items-center gap-2"><Plus size={15} />{children}</span>
    </button>
  );
}

function TwoColumnForm({
  title,
  form,
  list,
  empty
}: {
  title: string;
  form: React.ReactNode;
  list: React.ReactNode[];
  empty: string;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="apex-card p-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-4 space-y-2">{form}</div>
      </section>
      <section className="apex-card overflow-hidden">
        <div className="border-b border-[var(--apex-border)] p-5">
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="divide-y divide-[var(--apex-border)]">
          {list.length ? list : <p className="p-5 text-sm text-[var(--apex-muted)]">{empty}</p>}
        </div>
      </section>
    </div>
  );
}

function Row({
  title,
  subtitle,
  value
}: {
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 truncate text-[10px] text-[var(--apex-muted)]">{subtitle}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
  );
}
