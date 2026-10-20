"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  Globe2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  loadCloudWorkspace,
  saveCloudWorkspace
} from "@/lib/cloud-workspace";
import { businessStorageKey } from "@/lib/business-storage";
import { workspaceAccentVars, type WorkspaceAccent } from "@/lib/workspace-accent";
import type { LanguageCode } from "./GlobalPreferences";

type SupplierStat = {
  supplier: string;
  products: number;
  units: number;
  value: number;
  averageMargin: number | null;
};

type SupplierProfile = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  taxId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  language: LanguageCode;
  accent: WorkspaceAccent;
  stats: SupplierStat[];
  money: (value: number) => string;
  onRemoveSupplier: (name: string) => void;
  businessId: string | null;
  demoMode: boolean;
};

const copy = {
  es: {
    eyebrow: "Directorio de abastecimiento",
    title: "Proveedores",
    subtitle:
      "Guardá quién te provee mercadería, cómo contactarlo y qué parte del stock depende de cada proveedor.",
    newSupplier: "Nuevo proveedor",
    editSupplier: "Editar proveedor",
    name: "Empresa / nombre",
    contactName: "Persona de contacto",
    phone: "Teléfono",
    email: "Correo",
    website: "Sitio web",
    address: "Dirección",
    taxId: "CUIT / identificación fiscal",
    notes: "Notas",
    save: "Guardar proveedor",
    cancel: "Cancelar",
    delete: "Eliminar",
    products: "Productos",
    units: "Unidades",
    inventoryValue: "Valor de stock",
    margin: "Margen promedio",
    detected: "Detectado desde productos",
    complete: "Completar contacto",
    noContact: "Sin datos de contacto cargados.",
    required: "Ingresá el nombre del proveedor.",
    close: "Cerrar"
  },
  en: {
    eyebrow: "Supply directory",
    title: "Vendors",
    subtitle:
      "Keep supplier contacts together and see how much inventory depends on each one.",
    newSupplier: "New vendor",
    editSupplier: "Edit vendor",
    name: "Company / name",
    contactName: "Contact person",
    phone: "Phone",
    email: "Email",
    website: "Website",
    address: "Address",
    taxId: "Tax ID",
    notes: "Notes",
    save: "Save vendor",
    cancel: "Cancel",
    delete: "Delete",
    products: "Products",
    units: "Units",
    inventoryValue: "Inventory value",
    margin: "Average margin",
    detected: "Detected from products",
    complete: "Add contact details",
    noContact: "No contact details yet.",
    required: "Enter the vendor name.",
    close: "Close"
  },
  pt: {
    eyebrow: "Diretório de abastecimento",
    title: "Abastecedores",
    subtitle:
      "Guarde contatos dos abastecedores e veja quanto do estoque depende de cada um.",
    newSupplier: "Novo abastecedor",
    editSupplier: "Editar abastecedor",
    name: "Empresa / nome",
    contactName: "Pessoa de contato",
    phone: "Telefone",
    email: "E-mail",
    website: "Site",
    address: "Endereço",
    taxId: "CNPJ / identificação fiscal",
    notes: "Notas",
    save: "Salvar abastecedor",
    cancel: "Cancelar",
    delete: "Excluir",
    products: "Produtos",
    units: "Unidades",
    inventoryValue: "Valor do estoque",
    margin: "Margem média",
    detected: "Detectado pelos produtos",
    complete: "Completar contato",
    noContact: "Sem dados de contato.",
    required: "Digite o nome do abastecedor.",
    close: "Fechar"
  },
  fr: {
    eyebrow: "Répertoire d’approvisionnement",
    title: "Fournisseurs",
    subtitle:
      "Centralisez les contacts fournisseurs et visualisez la part de stock liée à chacun.",
    newSupplier: "Nouveau fournisseur",
    editSupplier: "Modifier le fournisseur",
    name: "Entreprise / nom",
    contactName: "Contact",
    phone: "Téléphone",
    email: "E-mail",
    website: "Site web",
    address: "Adresse",
    taxId: "Identifiant fiscal",
    notes: "Notes",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    products: "Produits",
    units: "Unités",
    inventoryValue: "Valeur du stock",
    margin: "Marge moyenne",
    detected: "Détecté depuis les produits",
    complete: "Compléter le contact",
    noContact: "Aucune coordonnée.",
    required: "Saisissez le nom du fournisseur.",
    close: "Fermer"
  },
  de: {
    eyebrow: "Lieferantenverzeichnis",
    title: "Bezugsquellen",
    subtitle:
      "Kontaktdaten zentral verwalten und sehen, wie viel Bestand von jeder Bezugsquelle abhängt.",
    newSupplier: "Neue Bezugsquelle",
    editSupplier: "Bezugsquelle bearbeiten",
    name: "Unternehmen / Name",
    contactName: "Ansprechperson",
    phone: "Telefon",
    email: "E-Mail",
    website: "Website",
    address: "Adresse",
    taxId: "Steuer-ID",
    notes: "Notizen",
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    products: "Produkte",
    units: "Einheiten",
    inventoryValue: "Bestandswert",
    margin: "Durchschnittsmarge",
    detected: "Aus Produkten erkannt",
    complete: "Kontaktdaten ergänzen",
    noContact: "Noch keine Kontaktdaten.",
    required: "Gib den Namen der Bezugsquelle ein.",
    close: "Schließen"
  }
} satisfies Record<LanguageCode, Record<string, string>>;

const emptyDraft = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  taxId: "",
  notes: ""
};

export function SupplierDirectory({
  language,
  accent,
  stats,
  money,
  onRemoveSupplier,
  businessId,
  demoMode
}: Props) {
  const t = copy[language];
  const [profiles, setProfiles] = useState<SupplierProfile[]>([]);
  const [ready, setReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let next: SupplierProfile[] = [];
      const storageKey = businessStorageKey(
        "global-stock-suppliers-v1",
        businessId,
        demoMode
      );

      try {
        const raw = storageKey ? localStorage.getItem(storageKey) : null;
        if (raw) {
          const parsed = JSON.parse(raw) as SupplierProfile[];
          if (Array.isArray(parsed)) next = parsed;
        }
      } catch {
        next = [];
      }

      if (!demoMode && businessId) {
        const cloud = await loadCloudWorkspace(businessId);
        if (Array.isArray(cloud?.state.supplierProfiles)) {
          next = cloud.state.supplierProfiles as SupplierProfile[];
        }
      }

      if (!cancelled) {
        setProfiles(next);
        setReady(true);
      }
    }

    setReady(false);
    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [businessId, demoMode]);

  useEffect(() => {
    if (!ready) return;

    const storageKey = businessStorageKey(
      "global-stock-suppliers-v1",
      businessId,
      demoMode
    );
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(profiles));
    }

    if (demoMode || !businessId) return;

    const timer = window.setTimeout(() => {
      void saveCloudWorkspace(businessId, {
        supplierProfiles: profiles
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [businessId, demoMode, profiles, ready]);

  useEffect(() => {
    if (editingId === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditor();
    };
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onEscape);
    };
  }, [editingId]);

  const merged = useMemo(() => {
    const names = new Set([
      ...stats.map((item) => item.supplier),
      ...profiles.map((item) => item.name)
    ]);

    return [...names]
      .filter(Boolean)
      .map((name) => ({
        name,
        stat: stats.find((item) => item.supplier === name),
        profile: profiles.find(
          (item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase()
        )
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [profiles, stats]);

  function closeEditor() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError("");
  }

  function openNew() {
    setEditingId("new");
    setDraft(emptyDraft);
    setError("");
  }

  function openExisting(name: string, profile?: SupplierProfile) {
    setEditingId(profile?.id ?? "new");
    setDraft({
      name,
      contactName: profile?.contactName ?? "",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      website: profile?.website ?? "",
      address: profile?.address ?? "",
      taxId: profile?.taxId ?? "",
      notes: profile?.notes ?? ""
    });
    setError("");
  }

  function saveProfile() {
    const name = draft.name.trim();
    if (!name) {
      setError(t.required);
      return;
    }

    const now = new Date().toISOString();
    const normalizedWebsite =
      draft.website.trim() &&
      !/^https?:\/\//i.test(draft.website.trim())
        ? `https://${draft.website.trim()}`
        : draft.website.trim();

    setProfiles((current) => {
      const existing =
        editingId && editingId !== "new"
          ? current.find((item) => item.id === editingId)
          : current.find(
              (item) =>
                item.name.toLocaleLowerCase() === name.toLocaleLowerCase()
            );

      const next: SupplierProfile = {
        id: existing?.id ?? crypto.randomUUID(),
        name,
        contactName: draft.contactName.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        website: normalizedWebsite,
        address: draft.address.trim(),
        taxId: draft.taxId.trim(),
        notes: draft.notes.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      return [
        next,
        ...current.filter((item) => item.id !== next.id)
      ];
    });

    closeEditor();
  }

  function deleteProfile(id: string) {
    setProfiles((current) => current.filter((item) => item.id !== id));
    closeEditor();
  }

  function removeSupplier(name: string, profile?: SupplierProfile) {
    if (profile) {
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
    } else {
      setProfiles((current) =>
        current.filter(
          (item) =>
            item.name.toLocaleLowerCase() !== name.toLocaleLowerCase()
        )
      );
    }
    onRemoveSupplier(name);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--apex-accent)]">
            {t.eyebrow}
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
          onClick={openNew}
          className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--apex-accent)] px-5 text-sm font-semibold text-white"
        >
          <Plus size={17} />
          {t.newSupplier}
        </button>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {merged.map(({ name, stat, profile }) => (
          <article key={name} className="apex-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--apex-accent-soft)] text-[var(--apex-accent)]">
                  <Building2 size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{name}</h3>
                  <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                    {profile ? profile.contactName || t.noContact : t.detected}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openExisting(name, profile)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--apex-border)]"
                  aria-label={profile ? t.editSupplier : t.complete}
                  title={profile ? t.editSupplier : t.complete}
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => removeSupplier(name, profile)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-red-500/20 text-red-500 transition hover:bg-red-500/8"
                  aria-label={t.delete}
                  title={t.delete}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {stat && (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Metric label={t.products} value={String(stat.products)} />
                <Metric label={t.units} value={String(stat.units)} />
                <Metric label={t.inventoryValue} value={money(stat.value)} />
                <Metric
                  label={t.margin}
                  value={
                    stat.averageMargin === null
                      ? "—"
                      : `${stat.averageMargin.toFixed(1)}%`
                  }
                />
              </div>
            )}

            {profile && (
              <div className="mt-5 space-y-2 border-t border-[var(--apex-border)] pt-4 text-xs">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                    className="flex min-h-10 items-center gap-3 rounded-xl px-2 text-[var(--apex-muted)] hover:bg-[var(--apex-bg)]"
                  >
                    <Phone size={14} className="text-[var(--apex-accent)]" />
                    <span className="truncate">{profile.phone}</span>
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex min-h-10 items-center gap-3 rounded-xl px-2 text-[var(--apex-muted)] hover:bg-[var(--apex-bg)]"
                  >
                    <Mail size={14} className="text-[var(--apex-accent)]" />
                    <span className="truncate">{profile.email}</span>
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-10 items-center gap-3 rounded-xl px-2 text-[var(--apex-muted)] hover:bg-[var(--apex-bg)]"
                  >
                    <Globe2 size={14} className="text-[var(--apex-accent)]" />
                    <span className="truncate">{profile.website}</span>
                  </a>
                )}
                {profile.address && (
                  <div className="flex min-h-10 items-center gap-3 px-2 text-[var(--apex-muted)]">
                    <MapPin size={14} className="shrink-0 text-[var(--apex-accent)]" />
                    <span>{profile.address}</span>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {editingId !== null && (
          <motion.div
            role="presentation"
            style={workspaceAccentVars(accent)}
            data-workspace-accent={accent}
            className="fixed inset-0 z-[310] flex items-center justify-center overflow-hidden bg-black/55 p-[max(10px,env(safe-area-inset-top))] sm:p-4 sm:backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) closeEditor();
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={editingId === "new" ? t.newSupplier : t.editSupplier}
              initial={{ opacity: 0, y: 22, scale: .985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: .99 }}
              transition={{
                duration: 0.28,
                ease: [0.32, 0.72, 0, 1]
              }}
              className="apex-scrollbar flex max-h-[calc(100dvh-20px)] min-h-0 w-full max-w-2xl flex-col overflow-y-auto overscroll-contain rounded-[20px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4 text-[var(--apex-text)] shadow-[0_25px_85px_rgba(0,0,0,.25)] sm:max-h-[calc(100dvh-32px)] sm:rounded-[22px] sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--apex-accent)]">
                    Global Stock
                  </p>
                  <h3 className="mt-0.5 text-lg font-semibold">
                    {editingId === "new" ? t.newSupplier : t.editSupplier}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] transition-colors hover:bg-[var(--apex-bg)]"
                  aria-label={t.close}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-3 grid gap-x-3 gap-y-2 sm:grid-cols-2">
                <Field label={t.name}>
                  <Building2 size={15} />
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    autoComplete="organization"
                  />
                </Field>
                <Field label={t.contactName}>
                  <UserRound size={15} />
                  <input
                    value={draft.contactName}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, contactName: event.target.value }))
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    autoComplete="name"
                  />
                </Field>
                <Field label={t.phone}>
                  <Phone size={15} />
                  <input
                    value={draft.phone}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, phone: event.target.value }))
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </Field>
                <Field label={t.email}>
                  <Mail size={15} />
                  <input
                    value={draft.email}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, email: event.target.value }))
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                  />
                </Field>
                <Field label={t.website}>
                  <Globe2 size={15} />
                  <input
                    value={draft.website}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, website: event.target.value }))
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </Field>
                <Field label={t.taxId}>
                  <Building2 size={15} />
                  <input
                    value={draft.taxId}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, taxId: event.target.value }))
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none"
                  />
                </Field>
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2 sm:items-start">
                <label className="block min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                  {t.address}
                </span>
                <input
                  value={draft.address}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, address: event.target.value }))
                  }
                  className="apex-input mt-1.5 min-h-10 w-full px-3 py-2"
                  autoComplete="street-address"
                />
              </label>

                <label className="block min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                  {t.notes}
                </span>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={2}
                  className="apex-input mt-1.5 min-h-[56px] max-h-28 w-full resize-y px-3 py-2"
                />
              </label>

              </div>

              {error && (
                <p role="alert" className="mt-3 text-xs font-semibold text-red-500">
                  {error}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--apex-border)] pt-3">
                <button
                  type="button"
                  onClick={saveProfile}
                  className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--apex-accent)] px-4 text-xs font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[.99]"
                >
                  <Save size={16} />
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="min-h-10 rounded-xl border border-[var(--apex-border)] px-4 text-xs font-semibold transition-colors hover:bg-[var(--apex-bg)]"
                >
                  {t.cancel}
                </button>
                {editingId !== "new" && (
                  <button
                    type="button"
                    onClick={() => deleteProfile(editingId)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-red-500/20 text-red-500"
                    aria-label={t.delete}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
        {label}
      </span>
      <span className="mt-1.5 flex min-h-10 items-center gap-2.5 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-[var(--apex-muted)] transition-colors focus-within:border-[var(--apex-accent)]">
        {children}
      </span>
    </label>
  );
}
