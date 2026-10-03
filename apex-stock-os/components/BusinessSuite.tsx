"use client";

import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Landmark,
  Plus,
  Target,
  UsersRound,
  WalletCards
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  loadCloudWorkspace,
  saveCloudWorkspace
} from "@/lib/cloud-workspace";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  language: LanguageCode;
  currency: string;
  locale: string;
  businessId: string | null;
  demoMode: boolean;
  children: ReactNode;
};

type Tab = "operations" | "finance" | "crm" | "projects" | "people";

type FinanceAccount = {
  id: string;
  name: string;
  type: "bank" | "cash" | "wallet";
  balance: number;
};

type FinanceMovement = {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  status: "pending" | "reconciled";
};

type Opportunity = {
  id: string;
  contact: string;
  company: string;
  email: string;
  value: number;
  stage: "lead" | "contacted" | "proposal" | "won" | "lost";
  nextAction: string;
};

type Project = {
  id: string;
  name: string;
  client: string;
  budget: number;
  hoursPlanned: number;
  hoursUsed: number;
  status: "planned" | "active" | "paused" | "done";
};

type Person = {
  id: string;
  name: string;
  role: string;
  weeklyHours: number;
  status: "active" | "leave" | "inactive";
  leaveDays: number;
};

type SuiteState = {
  financeAccounts: FinanceAccount[];
  financeMovements: FinanceMovement[];
  opportunities: Opportunity[];
  projects: Project[];
  people: Person[];
};

const STORAGE_KEY = "global-stock-business-suite-v1";

const emptyState: SuiteState = {
  financeAccounts: [],
  financeMovements: [],
  opportunities: [],
  projects: [],
  people: []
};

function normalizeSuiteState(value: unknown): SuiteState {
  const source =
    value && typeof value === "object"
      ? (value as Partial<SuiteState>)
      : {};

  return {
    financeAccounts: Array.isArray(source.financeAccounts)
      ? source.financeAccounts
      : [],
    financeMovements: Array.isArray(source.financeMovements)
      ? source.financeMovements
      : [],
    opportunities: Array.isArray(source.opportunities)
      ? source.opportunities
      : [],
    projects: Array.isArray(source.projects) ? source.projects : [],
    people: Array.isArray(source.people) ? source.people : []
  };
}

function tr(
  language: LanguageCode,
  values: Partial<Record<LanguageCode, string>>
) {
  return values[language] ?? values.es ?? values.en ?? "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BusinessSuite({
  language,
  currency,
  locale,
  businessId,
  demoMode,
  children
}: Props) {
  const [tab, setTab] = useState<Tab>("operations");
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<SuiteState>(emptyState);

  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] =
    useState<FinanceAccount["type"]>("bank");
  const [accountBalance, setAccountBalance] = useState("");

  const [movementAccount, setMovementAccount] = useState("");
  const [movementDate, setMovementDate] = useState(today());
  const [movementDescription, setMovementDescription] = useState("");
  const [movementAmount, setMovementAmount] = useState("");

  const [contact, setContact] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [opportunityValue, setOpportunityValue] = useState("");
  const [nextAction, setNextAction] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectClient, setProjectClient] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [projectHours, setProjectHours] = useState("");

  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [personHours, setPersonHours] = useState("40");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let nextState = emptyState;

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) nextState = normalizeSuiteState(JSON.parse(raw));
      } catch {
        nextState = emptyState;
      }

      if (!demoMode && businessId) {
        const cloud = await loadCloudWorkspace(businessId);
        if (cloud?.state.businessSuite) {
          nextState = normalizeSuiteState(cloud.state.businessSuite);
        }
      }

      if (!cancelled) {
        setState(nextState);
        setReady(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [businessId, demoMode]);

  useEffect(() => {
    if (!ready) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (demoMode || !businessId) return;

    const timer = window.setTimeout(() => {
      void saveCloudWorkspace(businessId, {
        businessSuite: state
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [businessId, demoMode, ready, state]);

  useEffect(() => {
    if (!movementAccount && state.financeAccounts[0]?.id) {
      setMovementAccount(state.financeAccounts[0].id);
    }
  }, [movementAccount, state.financeAccounts]);

  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);

  const finance = useMemo(() => {
    const reconciled = state.financeMovements.filter(
      (item) => item.status === "reconciled"
    );
    const income = reconciled
      .filter((item) => item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);
    const outflow = Math.abs(
      reconciled
        .filter((item) => item.amount < 0)
        .reduce((sum, item) => sum + item.amount, 0)
    );
    const balance =
      state.financeAccounts.reduce((sum, item) => sum + item.balance, 0) +
      state.financeMovements.reduce((sum, item) => sum + item.amount, 0);
    const pending = state.financeMovements.filter(
      (item) => item.status === "pending"
    ).length;

    return { income, outflow, balance, pending };
  }, [state.financeAccounts, state.financeMovements]);

  const crm = useMemo(() => {
    const pipeline = state.opportunities
      .filter((item) => !["won", "lost"].includes(item.stage))
      .reduce((sum, item) => sum + item.value, 0);
    const won = state.opportunities
      .filter((item) => item.stage === "won")
      .reduce((sum, item) => sum + item.value, 0);
    const open = state.opportunities.filter(
      (item) => !["won", "lost"].includes(item.stage)
    ).length;
    return { pipeline, won, open };
  }, [state.opportunities]);

  function addAccount() {
    const name = accountName.trim();
    if (!name) return;

    setState((current) => ({
      ...current,
      financeAccounts: [
        ...current.financeAccounts,
        {
          id: crypto.randomUUID(),
          name,
          type: accountType,
          balance: Number(accountBalance) || 0
        }
      ]
    }));
    setAccountName("");
    setAccountBalance("");
  }

  function addMovement() {
    const description = movementDescription.trim();
    const amount = Number(movementAmount);
    if (!movementAccount || !description || !Number.isFinite(amount) || !amount) {
      return;
    }

    setState((current) => ({
      ...current,
      financeMovements: [
        {
          id: crypto.randomUUID(),
          accountId: movementAccount,
          date: movementDate || today(),
          description,
          amount,
          status: "pending"
        },
        ...current.financeMovements
      ]
    }));
    setMovementDescription("");
    setMovementAmount("");
  }

  function reconcileMovement(id: string) {
    setState((current) => ({
      ...current,
      financeMovements: current.financeMovements.map((item) =>
        item.id === id ? { ...item, status: "reconciled" } : item
      )
    }));
  }

  function addOpportunity() {
    if (!contact.trim()) return;
    setState((current) => ({
      ...current,
      opportunities: [
        {
          id: crypto.randomUUID(),
          contact: contact.trim(),
          company: company.trim(),
          email: email.trim(),
          value: Math.max(0, Number(opportunityValue) || 0),
          stage: "lead",
          nextAction: nextAction.trim()
        },
        ...current.opportunities
      ]
    }));
    setContact("");
    setCompany("");
    setEmail("");
    setOpportunityValue("");
    setNextAction("");
  }

  function updateOpportunity(
    id: string,
    patch: Partial<Opportunity>
  ) {
    setState((current) => ({
      ...current,
      opportunities: current.opportunities.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    }));
  }

  function addProject() {
    if (!projectName.trim()) return;
    setState((current) => ({
      ...current,
      projects: [
        {
          id: crypto.randomUUID(),
          name: projectName.trim(),
          client: projectClient.trim(),
          budget: Math.max(0, Number(projectBudget) || 0),
          hoursPlanned: Math.max(0, Number(projectHours) || 0),
          hoursUsed: 0,
          status: "planned"
        },
        ...current.projects
      ]
    }));
    setProjectName("");
    setProjectClient("");
    setProjectBudget("");
    setProjectHours("");
  }

  function updateProject(id: string, patch: Partial<Project>) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    }));
  }

  function addPerson() {
    if (!personName.trim()) return;
    setState((current) => ({
      ...current,
      people: [
        {
          id: crypto.randomUUID(),
          name: personName.trim(),
          role: personRole.trim() || "Equipo",
          weeklyHours: Math.max(0, Number(personHours) || 0),
          status: "active",
          leaveDays: 0
        },
        ...current.people
      ]
    }));
    setPersonName("");
    setPersonRole("");
    setPersonHours("40");
  }

  function updatePerson(id: string, patch: Partial<Person>) {
    setState((current) => ({
      ...current,
      people: current.people.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    }));
  }

  const tabs: Array<{ id: Tab; icon: typeof Landmark; label: string }> = [
    {
      id: "operations",
      icon: BriefcaseBusiness,
      label: tr(language, {
        es: "Operación",
        en: "Operations",
        pt: "Operação",
        fr: "Opérations",
        de: "Betrieb"
      })
    },
    {
      id: "finance",
      icon: Landmark,
      label: tr(language, {
        es: "Finanzas",
        en: "Finance",
        pt: "Finanças",
        fr: "Finances",
        de: "Finanzen"
      })
    },
    {
      id: "crm",
      icon: Target,
      label: "CRM"
    },
    {
      id: "projects",
      icon: WalletCards,
      label: tr(language, {
        es: "Proyectos",
        en: "Projects",
        pt: "Projetos",
        fr: "Projets",
        de: "Projekte"
      })
    },
    {
      id: "people",
      icon: UsersRound,
      label: tr(language, {
        es: "Equipo",
        en: "People",
        pt: "Equipe",
        fr: "Équipe",
        de: "Team"
      })
    }
  ];

  return (
    <div className="space-y-5">
      <section className="apex-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--apex-border)] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8F0000]">
              Business OS
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
              {tr(language, {
                es: "Toda la empresa en un solo lugar",
                en: "Your whole company in one place",
                pt: "Toda a empresa em um só lugar",
                fr: "Toute l’entreprise au même endroit",
                de: "Das ganze Unternehmen an einem Ort"
              })}
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--apex-muted)]">
              {tr(language, {
                es: "Caja, inventario, finanzas, CRM, proyectos y equipo conectados con la misma operación.",
                en: "POS, inventory, finance, CRM, projects and people connected to the same operation."
              })}
            </p>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--apex-muted)]">
            {demoMode
              ? tr(language, { es: "Modo demo · datos locales", en: "Demo · local data" })
              : businessId
                ? tr(language, { es: "Cuenta conectada", en: "Connected account" })
                : tr(language, { es: "Preparando nube", en: "Preparing cloud" })}
          </div>
        </div>

        <div className="apex-scrollbar flex gap-2 overflow-x-auto p-3">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition " +
                (tab === id
                  ? "border-[#8F0000]/55 bg-[#8F0000]/10 text-[#8F0000]"
                  : "border-[var(--apex-border)] bg-[var(--apex-surface-strong)]")
              }
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {tab === "operations" && children}

      {tab === "finance" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={tr(language, { es: "Saldo estimado", en: "Estimated balance" })} value={money(finance.balance)} />
            <MetricCard label={tr(language, { es: "Ingresos conciliados", en: "Reconciled income" })} value={money(finance.income)} />
            <MetricCard label={tr(language, { es: "Egresos conciliados", en: "Reconciled outflow" })} value={money(finance.outflow)} />
            <MetricCard label={tr(language, { es: "Pendientes", en: "Pending" })} value={String(finance.pending)} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="apex-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Landmark size={17} />
                <h3 className="font-semibold">
                  {tr(language, { es: "Cuentas y cajas", en: "Accounts & cash" })}
                </h3>
              </div>
              <div className="mt-4 grid gap-2">
                <input className="apex-input p-3" placeholder={tr(language, { es: "Nombre de la cuenta", en: "Account name" })} value={accountName} onChange={(event) => setAccountName(event.target.value)} />
                <select className="apex-input min-h-11 px-3" value={accountType} onChange={(event) => setAccountType(event.target.value as FinanceAccount["type"])}>
                  <option value="bank">{tr(language, { es: "Banco", en: "Bank" })}</option>
                  <option value="cash">{tr(language, { es: "Caja", en: "Cash" })}</option>
                  <option value="wallet">{tr(language, { es: "Billetera", en: "Wallet" })}</option>
                </select>
                <input className="apex-input p-3" inputMode="decimal" placeholder={tr(language, { es: "Saldo inicial", en: "Opening balance" })} value={accountBalance} onChange={(event) => setAccountBalance(event.target.value)} />
                <PrimaryButton onClick={addAccount} label={tr(language, { es: "Agregar cuenta", en: "Add account" })} />
              </div>
              <div className="mt-4 space-y-2">
                {state.financeAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-2xl border border-[var(--apex-border)] p-3">
                    <div>
                      <p className="text-sm font-semibold">{account.name}</p>
                      <p className="text-[11px] text-[var(--apex-muted)]">{account.type}</p>
                    </div>
                    <span className="text-sm font-semibold">{money(account.balance)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="apex-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <CircleDollarSign size={17} />
                <h3 className="font-semibold">
                  {tr(language, { es: "Movimientos y conciliación", en: "Transactions & reconciliation" })}
                </h3>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                <select className="apex-input min-h-11 px-3 xl:col-span-1" value={movementAccount} onChange={(event) => setMovementAccount(event.target.value)}>
                  <option value="">{tr(language, { es: "Cuenta", en: "Account" })}</option>
                  {state.financeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
                <input className="apex-input p-3" type="date" value={movementDate} onChange={(event) => setMovementDate(event.target.value)} />
                <input className="apex-input p-3 xl:col-span-2" placeholder={tr(language, { es: "Descripción", en: "Description" })} value={movementDescription} onChange={(event) => setMovementDescription(event.target.value)} />
                <div className="flex gap-2">
                  <input className="apex-input min-w-0 flex-1 p-3" inputMode="decimal" placeholder="+ / -" value={movementAmount} onChange={(event) => setMovementAmount(event.target.value)} />
                  <button type="button" onClick={addMovement} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#8F0000] text-white"><Plus size={16} /></button>
                </div>
              </div>

              <div className="mt-4 divide-y divide-[var(--apex-border)] overflow-hidden rounded-2xl border border-[var(--apex-border)]">
                {state.financeMovements.length ? state.financeMovements.map((movement) => (
                  <div key={movement.id} className="grid gap-3 p-3 sm:grid-cols-[110px_1fr_auto_auto] sm:items-center">
                    <span className="text-xs text-[var(--apex-muted)]">{movement.date}</span>
                    <div>
                      <p className="text-sm font-semibold">{movement.description}</p>
                      <p className="text-[11px] text-[var(--apex-muted)]">
                        {state.financeAccounts.find((account) => account.id === movement.accountId)?.name ?? "Cuenta"}
                      </p>
                    </div>
                    <span className={"text-sm font-semibold " + (movement.amount >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {money(movement.amount)}
                    </span>
                    {movement.status === "pending" ? (
                      <button type="button" onClick={() => reconcileMovement(movement.id)} className="min-h-9 rounded-xl border border-[var(--apex-border)] px-3 text-xs font-semibold">
                        {tr(language, { es: "Conciliar", en: "Match" })}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={14} /> OK</span>
                    )}
                  </div>
                )) : <EmptyText text={tr(language, { es: "Todavía no hay movimientos.", en: "No transactions yet." })} />}
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === "crm" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label={tr(language, { es: "Pipeline abierto", en: "Open pipeline" })} value={money(crm.pipeline)} />
            <MetricCard label={tr(language, { es: "Ganado", en: "Won" })} value={money(crm.won)} />
            <MetricCard label={tr(language, { es: "Oportunidades abiertas", en: "Open opportunities" })} value={String(crm.open)} />
          </div>

          <section className="apex-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Target size={17} />
              <h3 className="font-semibold">{tr(language, { es: "Nueva oportunidad", en: "New opportunity" })}</h3>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
              <input className="apex-input p-3" placeholder={tr(language, { es: "Contacto", en: "Contact" })} value={contact} onChange={(event) => setContact(event.target.value)} />
              <input className="apex-input p-3" placeholder={tr(language, { es: "Empresa", en: "Company" })} value={company} onChange={(event) => setCompany(event.target.value)} />
              <input className="apex-input p-3" type="email" placeholder="email@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              <input className="apex-input p-3" inputMode="decimal" placeholder={tr(language, { es: "Valor", en: "Value" })} value={opportunityValue} onChange={(event) => setOpportunityValue(event.target.value)} />
              <input className="apex-input p-3" placeholder={tr(language, { es: "Próxima acción", en: "Next action" })} value={nextAction} onChange={(event) => setNextAction(event.target.value)} />
              <PrimaryButton onClick={addOpportunity} label={tr(language, { es: "Agregar", en: "Add" })} />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-5">
            {(["lead", "contacted", "proposal", "won", "lost"] as const).map((stage) => (
              <section key={stage} className="apex-card min-w-0 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-[0.08em]">{stage}</h4>
                  <span className="rounded-full bg-[var(--apex-bg)] px-2 py-1 text-[10px] font-semibold">
                    {state.opportunities.filter((item) => item.stage === stage).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {state.opportunities.filter((item) => item.stage === stage).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
                      <p className="text-sm font-semibold">{item.contact}</p>
                      <p className="mt-0.5 text-xs text-[var(--apex-muted)]">{item.company || item.email || "—"}</p>
                      <p className="mt-2 text-sm font-semibold">{money(item.value)}</p>
                      {item.nextAction && <p className="mt-1 text-[11px] text-[var(--apex-muted)]">{item.nextAction}</p>}
                      <select className="apex-input mt-3 min-h-9 px-2 text-xs" value={item.stage} onChange={(event) => updateOpportunity(item.id, { stage: event.target.value as Opportunity["stage"] })}>
                        <option value="lead">lead</option>
                        <option value="contacted">contacted</option>
                        <option value="proposal">proposal</option>
                        <option value="won">won</option>
                        <option value="lost">lost</option>
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {tab === "projects" && (
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="apex-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Building2 size={17} />
              <h3 className="font-semibold">{tr(language, { es: "Nuevo proyecto", en: "New project" })}</h3>
            </div>
            <div className="mt-4 grid gap-2">
              <input className="apex-input p-3" placeholder={tr(language, { es: "Proyecto", en: "Project" })} value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              <input className="apex-input p-3" placeholder={tr(language, { es: "Cliente", en: "Client" })} value={projectClient} onChange={(event) => setProjectClient(event.target.value)} />
              <input className="apex-input p-3" inputMode="decimal" placeholder={tr(language, { es: "Presupuesto", en: "Budget" })} value={projectBudget} onChange={(event) => setProjectBudget(event.target.value)} />
              <input className="apex-input p-3" inputMode="decimal" placeholder={tr(language, { es: "Horas previstas", en: "Planned hours" })} value={projectHours} onChange={(event) => setProjectHours(event.target.value)} />
              <PrimaryButton onClick={addProject} label={tr(language, { es: "Crear proyecto", en: "Create project" })} />
            </div>
          </section>

          <section className="apex-card overflow-hidden">
            <div className="border-b border-[var(--apex-border)] p-4">
              <h3 className="font-semibold">{tr(language, { es: "Proyectos activos", en: "Projects" })}</h3>
            </div>
            <div className="divide-y divide-[var(--apex-border)]">
              {state.projects.length ? state.projects.map((project) => {
                const progress = project.hoursPlanned > 0
                  ? Math.min(100, (project.hoursUsed / project.hoursPlanned) * 100)
                  : 0;
                return (
                  <div key={project.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className="text-xs text-[var(--apex-muted)]">
                        {project.client || "Sin cliente"} · {money(project.budget)}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--apex-bg)]">
                        <div className="h-full rounded-full bg-[#8F0000]" style={{ width: progress + "%" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} className="text-[var(--apex-muted)]" />
                      <input className="apex-input w-20 p-2 text-xs" inputMode="decimal" value={project.hoursUsed} onChange={(event) => updateProject(project.id, { hoursUsed: Math.max(0, Number(event.target.value) || 0) })} />
                      <span className="text-xs text-[var(--apex-muted)]">/ {project.hoursPlanned}h</span>
                    </div>
                    <select className="apex-input min-h-10 px-3 text-xs" value={project.status} onChange={(event) => updateProject(project.id, { status: event.target.value as Project["status"] })}>
                      <option value="planned">planned</option>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                );
              }) : <EmptyText text={tr(language, { es: "Todavía no hay proyectos.", en: "No projects yet." })} />}
            </div>
          </section>
        </div>
      )}

      {tab === "people" && (
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="apex-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <UsersRound size={17} />
              <h3 className="font-semibold">{tr(language, { es: "Alta de persona", en: "Add person" })}</h3>
            </div>
            <div className="mt-4 grid gap-2">
              <input className="apex-input p-3" placeholder={tr(language, { es: "Nombre", en: "Name" })} value={personName} onChange={(event) => setPersonName(event.target.value)} />
              <input className="apex-input p-3" placeholder={tr(language, { es: "Rol / puesto", en: "Role" })} value={personRole} onChange={(event) => setPersonRole(event.target.value)} />
              <input className="apex-input p-3" inputMode="decimal" placeholder={tr(language, { es: "Horas semanales", en: "Weekly hours" })} value={personHours} onChange={(event) => setPersonHours(event.target.value)} />
              <PrimaryButton onClick={addPerson} label={tr(language, { es: "Agregar al equipo", en: "Add to team" })} />
            </div>
          </section>

          <section className="apex-card overflow-hidden">
            <div className="border-b border-[var(--apex-border)] p-4">
              <h3 className="font-semibold">{tr(language, { es: "Equipo y disponibilidad", en: "People & availability" })}</h3>
            </div>
            <div className="divide-y divide-[var(--apex-border)]">
              {state.people.length ? state.people.map((person) => (
                <div key={person.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                  <div>
                    <p className="font-semibold">{person.name}</p>
                    <p className="text-xs text-[var(--apex-muted)]">{person.role}</p>
                  </div>
                  <span className="text-xs font-semibold">{person.weeklyHours}h/sem</span>
                  <label className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--apex-muted)]">{tr(language, { es: "Licencia", en: "Leave" })}</span>
                    <input className="apex-input w-16 p-2 text-xs" inputMode="numeric" value={person.leaveDays} onChange={(event) => updatePerson(person.id, { leaveDays: Math.max(0, Number(event.target.value) || 0) })} />
                  </label>
                  <select className="apex-input min-h-10 px-3 text-xs" value={person.status} onChange={(event) => updatePerson(person.id, { status: event.target.value as Person["status"] })}>
                    <option value="active">active</option>
                    <option value="leave">leave</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              )) : <EmptyText text={tr(language, { es: "Todavía no hay personas cargadas.", en: "No people yet." })} />}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="apex-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--apex-muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.025em]">{value}</p>
    </div>
  );
}

function PrimaryButton({
  onClick,
  label
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#8F0000] px-4 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(143,0,0,.18)]"
    >
      <Plus size={15} />
      {label}
    </button>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="p-6 text-center text-sm text-[var(--apex-muted)]">
      {text}
    </div>
  );
}
