"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  Code2,
  FileCheck2,
  FilePlus2,
  Globe2,
  PackageCheck,
  PlugZap,
  Printer,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  Unplug
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { LanguageCode } from "./GlobalPreferences";

type ConnectionState = "not_connected" | "configured";

type Connector = {
  id: string;
  name: string;
  description: Record<LanguageCode, string>;
  kind: "marketplace" | "storefront" | "api";
};

type SavedConnection = {
  id: string;
  status: ConnectionState;
  storeUrl: string;
  updatedAt: string;
};

type OnlineOrder = {
  id: string;
  channel: string;
  customer: string;
  total: number;
  currency: string;
  status: "pending" | "paid" | "preparing" | "shipped" | "delivered";
  createdAt: string;
};

type DocumentType = "invoice" | "receipt" | "credit_note";

type BusinessDocument = {
  id: string;
  number: string;
  type: DocumentType;
  customer: string;
  description: string;
  total: number;
  currency: string;
  createdAt: string;
};

const connectors: Connector[] = [
  {
    id: "shopify",
    name: "Shopify",
    description: {
      es: "Productos, pedidos, stock y webhooks.",
      en: "Products, orders, inventory and webhooks.",
      pt: "Produtos, pedidos, estoque e webhooks.",
      fr: "Produits, commandes, stock et webhooks.",
      de: "Produkte, Bestellungen, Bestand und Webhooks."
    },
    kind: "storefront"
  },
  {
    id: "tiendanube",
    name: "Tiendanube",
    description: {
      es: "Catálogo, pedidos, clientes y stock.",
      en: "Catalog, orders, customers and inventory.",
      pt: "Catálogo, pedidos, clientes e estoque.",
      fr: "Catalogue, commandes, clients et stock.",
      de: "Katalog, Bestellungen, Kunden und Bestand."
    },
    kind: "storefront"
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: {
      es: "REST API, pedidos, productos y existencias.",
      en: "REST API, orders, products and stock levels.",
      pt: "REST API, pedidos, produtos e estoque.",
      fr: "API REST, commandes, produits et niveaux de stock.",
      de: "REST-API, Bestellungen, Produkte und Lagerbestände."
    },
    kind: "storefront"
  },
  {
    id: "mercadolibre",
    name: "Mercado Libre",
    description: {
      es: "Publicaciones, órdenes, stock y envíos.",
      en: "Listings, orders, inventory and shipping.",
      pt: "Anúncios, pedidos, estoque e envios.",
      fr: "Annonces, commandes, stock et expéditions.",
      de: "Angebote, Bestellungen, Bestand und Versand."
    },
    kind: "marketplace"
  },
  {
    id: "custom-api",
    name: "API / Webhooks",
    description: {
      es: "Conector genérico para cualquier ecommerce o sistema propio.",
      en: "Generic connector for any ecommerce platform or custom system.",
      pt: "Conector genérico para qualquer ecommerce ou sistema próprio.",
      fr: "Connecteur générique pour tout ecommerce ou système personnalisé.",
      de: "Generischer Connector für beliebige Shops oder eigene Systeme."
    },
    kind: "api"
  }
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const copy: Record<
  LanguageCode,
  {
    onlineEyebrow: string;
    onlineTitle: string;
    onlineSubtitle: string;
    channels: string;
    orders: string;
    pending: string;
    paid: string;
    preparing: string;
    shipped: string;
    delivered: string;
    connector: string;
    notConnected: string;
    configured: string;
    configure: string;
    disconnect: string;
    storeUrl: string;
    credentialsHint: string;
    saveConnector: string;
    noOrders: string;
    sampleOrder: string;
    syncArchitecture: string;
    syncArchitectureBody: string;
    documentsEyebrow: string;
    documentsTitle: string;
    documentsSubtitle: string;
    newDocument: string;
    type: string;
    invoice: string;
    receipt: string;
    creditNote: string;
    customer: string;
    description: string;
    total: string;
    create: string;
    print: string;
    delete: string;
    noDocuments: string;
    internalNotice: string;
    documentCreated: string;
  }
> = {
  es: {
    onlineEyebrow: "Comercio conectado",
    onlineTitle: "Tienda online",
    onlineSubtitle:
      "Centralizá pedidos y prepará integraciones con Shopify, Tiendanube, WooCommerce, Mercado Libre o cualquier API.",
    channels: "Canales",
    orders: "Pedidos",
    pending: "Pendiente",
    paid: "Pagado",
    preparing: "Preparando",
    shipped: "Enviado",
    delivered: "Entregado",
    connector: "Conector",
    notConnected: "Sin conectar",
    configured: "Configuración preparada",
    configure: "Configurar",
    disconnect: "Desconectar",
    storeUrl: "URL de la tienda",
    credentialsHint:
      "Las credenciales reales deben cargarse en el servidor o mediante OAuth. No se guardan secretos en el navegador.",
    saveConnector: "Guardar configuración",
    noOrders: "Todavía no hay pedidos online sincronizados.",
    sampleOrder: "Agregar pedido de prueba",
    syncArchitecture: "Sincronización omnicanal",
    syncArchitectureBody:
      "El mismo inventario puede alimentar tienda física y canales online. Las conexiones reales requieren credenciales de cada plataforma.",
    documentsEyebrow: "Administración",
    documentsTitle: "Facturas y comprobantes",
    documentsSubtitle:
      "Registrá comprobantes internos, recibos y notas de crédito desde Global Stock.",
    newDocument: "Nuevo comprobante",
    type: "Tipo",
    invoice: "Factura interna",
    receipt: "Recibo",
    creditNote: "Nota de crédito",
    customer: "Cliente",
    description: "Concepto",
    total: "Total",
    create: "Crear comprobante",
    print: "Imprimir",
    delete: "Eliminar",
    noDocuments: "Todavía no hay comprobantes.",
    internalNotice:
      "Estos documentos son registros internos. La facturación fiscal válida requiere integración con el organismo fiscal correspondiente.",
    documentCreated: "Comprobante creado"
  },
  en: {
    onlineEyebrow: "Connected commerce",
    onlineTitle: "Online store",
    onlineSubtitle:
      "Centralize orders and prepare integrations with Shopify, Tiendanube, WooCommerce, Mercado Libre or any API.",
    channels: "Channels",
    orders: "Orders",
    pending: "Pending",
    paid: "Paid",
    preparing: "Preparing",
    shipped: "Shipped",
    delivered: "Delivered",
    connector: "Connector",
    notConnected: "Not connected",
    configured: "Configuration ready",
    configure: "Configure",
    disconnect: "Disconnect",
    storeUrl: "Store URL",
    credentialsHint:
      "Real credentials must be stored server-side or through OAuth. Browser secrets are not persisted.",
    saveConnector: "Save configuration",
    noOrders: "No online orders have been synchronized yet.",
    sampleOrder: "Add sample order",
    syncArchitecture: "Omnichannel synchronization",
    syncArchitectureBody:
      "The same inventory can power physical and online channels. Real connections require each platform's credentials.",
    documentsEyebrow: "Administration",
    documentsTitle: "Invoices & receipts",
    documentsSubtitle:
      "Record internal invoices, receipts and credit notes from Global Stock.",
    newDocument: "New document",
    type: "Type",
    invoice: "Internal invoice",
    receipt: "Receipt",
    creditNote: "Credit note",
    customer: "Customer",
    description: "Description",
    total: "Total",
    create: "Create document",
    print: "Print",
    delete: "Delete",
    noDocuments: "No documents yet.",
    internalNotice:
      "These are internal records. Legally valid tax invoices require integration with the corresponding tax authority.",
    documentCreated: "Document created"
  },
  pt: {
    onlineEyebrow: "Comércio conectado",
    onlineTitle: "Loja online",
    onlineSubtitle:
      "Centralize pedidos e prepare integrações com Shopify, Tiendanube, WooCommerce, Mercado Libre ou qualquer API.",
    channels: "Canais",
    orders: "Pedidos",
    pending: "Pendente",
    paid: "Pago",
    preparing: "Preparando",
    shipped: "Enviado",
    delivered: "Entregue",
    connector: "Conector",
    notConnected: "Sem conexão",
    configured: "Configuração pronta",
    configure: "Configurar",
    disconnect: "Desconectar",
    storeUrl: "URL da loja",
    credentialsHint:
      "As credenciais reais devem ficar no servidor ou via OAuth. Segredos não são salvos no navegador.",
    saveConnector: "Salvar configuração",
    noOrders: "Ainda não há pedidos online sincronizados.",
    sampleOrder: "Adicionar pedido de teste",
    syncArchitecture: "Sincronização omnichannel",
    syncArchitectureBody:
      "O mesmo estoque pode alimentar loja física e canais online. Conexões reais exigem credenciais de cada plataforma.",
    documentsEyebrow: "Administração",
    documentsTitle: "Faturas e comprovantes",
    documentsSubtitle:
      "Registre comprovantes internos, recibos e notas de crédito no Global Stock.",
    newDocument: "Novo comprovante",
    type: "Tipo",
    invoice: "Fatura interna",
    receipt: "Recibo",
    creditNote: "Nota de crédito",
    customer: "Cliente",
    description: "Descrição",
    total: "Total",
    create: "Criar comprovante",
    print: "Imprimir",
    delete: "Excluir",
    noDocuments: "Ainda não há comprovantes.",
    internalNotice:
      "Estes documentos são registros internos. Faturas fiscais válidas exigem integração com a autoridade fiscal correspondente.",
    documentCreated: "Comprovante criado"
  },
  fr: {
    onlineEyebrow: "Commerce connecté",
    onlineTitle: "Boutique en ligne",
    onlineSubtitle:
      "Centralisez les commandes et préparez les intégrations Shopify, Tiendanube, WooCommerce, Mercado Libre ou toute API.",
    channels: "Canaux",
    orders: "Commandes",
    pending: "En attente",
    paid: "Payée",
    preparing: "Préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
    connector: "Connecteur",
    notConnected: "Non connecté",
    configured: "Configuration prête",
    configure: "Configurer",
    disconnect: "Déconnecter",
    storeUrl: "URL de la boutique",
    credentialsHint:
      "Les identifiants réels doivent être stockés côté serveur ou via OAuth. Aucun secret n’est conservé dans le navigateur.",
    saveConnector: "Enregistrer",
    noOrders: "Aucune commande en ligne synchronisée.",
    sampleOrder: "Ajouter une commande test",
    syncArchitecture: "Synchronisation omnicanale",
    syncArchitectureBody:
      "Le même stock peut alimenter le magasin physique et les canaux en ligne. Les connexions réelles nécessitent les identifiants de chaque plateforme.",
    documentsEyebrow: "Administration",
    documentsTitle: "Factures et justificatifs",
    documentsSubtitle:
      "Enregistrez factures internes, reçus et avoirs depuis Global Stock.",
    newDocument: "Nouveau document",
    type: "Type",
    invoice: "Facture interne",
    receipt: "Reçu",
    creditNote: "Avoir",
    customer: "Client",
    description: "Description",
    total: "Total",
    create: "Créer",
    print: "Imprimer",
    delete: "Supprimer",
    noDocuments: "Aucun document.",
    internalNotice:
      "Ces documents sont des registres internes. La facturation fiscale valide nécessite une intégration avec l’autorité fiscale correspondante.",
    documentCreated: "Document créé"
  },
  de: {
    onlineEyebrow: "Vernetzter Handel",
    onlineTitle: "Onlineshop",
    onlineSubtitle:
      "Bestellungen zentralisieren und Shopify, Tiendanube, WooCommerce, Mercado Libre oder beliebige APIs vorbereiten.",
    channels: "Kanäle",
    orders: "Bestellungen",
    pending: "Ausstehend",
    paid: "Bezahlt",
    preparing: "In Vorbereitung",
    shipped: "Versendet",
    delivered: "Geliefert",
    connector: "Connector",
    notConnected: "Nicht verbunden",
    configured: "Konfiguration bereit",
    configure: "Konfigurieren",
    disconnect: "Trennen",
    storeUrl: "Shop-URL",
    credentialsHint:
      "Echte Zugangsdaten gehören auf den Server oder in OAuth. Geheimnisse werden nicht im Browser gespeichert.",
    saveConnector: "Konfiguration speichern",
    noOrders: "Noch keine Online-Bestellungen synchronisiert.",
    sampleOrder: "Testbestellung hinzufügen",
    syncArchitecture: "Omnichannel-Synchronisierung",
    syncArchitectureBody:
      "Ein Bestand kann Filiale und Onlinekanäle speisen. Echte Verbindungen benötigen Plattform-Zugangsdaten.",
    documentsEyebrow: "Verwaltung",
    documentsTitle: "Rechnungen & Belege",
    documentsSubtitle:
      "Interne Rechnungen, Belege und Gutschriften in Global Stock erfassen.",
    newDocument: "Neuer Beleg",
    type: "Typ",
    invoice: "Interne Rechnung",
    receipt: "Beleg",
    creditNote: "Gutschrift",
    customer: "Kunde",
    description: "Beschreibung",
    total: "Gesamt",
    create: "Beleg erstellen",
    print: "Drucken",
    delete: "Löschen",
    noDocuments: "Noch keine Belege.",
    internalNotice:
      "Diese Dokumente sind interne Aufzeichnungen. Rechtsgültige Steuerrechnungen benötigen die Integration mit der zuständigen Steuerbehörde.",
    documentCreated: "Beleg erstellt"
  }
};

export function OnlineCommerceHub({
  language,
  currency,
  locale
}: {
  language: LanguageCode;
  currency: string;
  locale: string;
}) {
  const t = copy[language];
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [onlineStorageReady, setOnlineStorageReady] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState("");

  useEffect(() => {
    try {
      const savedConnections = localStorage.getItem(
        "global-stock-online-connections-v1"
      );
      const savedOrders = localStorage.getItem(
        "global-stock-online-orders-v1"
      );
      if (savedConnections) {
        const parsed = JSON.parse(savedConnections) as SavedConnection[];
        if (Array.isArray(parsed)) setConnections(parsed);
      }
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders) as OnlineOrder[];
        if (Array.isArray(parsed)) {
          setOrders(
            parsed.map((order) => ({
              ...order,
              currency: order.currency || currency
            }))
          );
        }
      }
    } catch {
      // Keep empty local state.
    } finally {
      setOnlineStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!onlineStorageReady) return;
    localStorage.setItem(
      "global-stock-online-connections-v1",
      JSON.stringify(connections)
    );
  }, [connections, onlineStorageReady]);

  useEffect(() => {
    if (!onlineStorageReady) return;
    localStorage.setItem(
      "global-stock-online-orders-v1",
      JSON.stringify(orders)
    );
  }, [orders, onlineStorageReady]);

  function saveConnection(id: string) {
    const normalized = storeUrl.trim();
    setConnections((current) => {
      const next = current.filter((item) => item.id !== id);
      return [
        ...next,
        {
          id,
          status: "configured",
          storeUrl: normalized,
          updatedAt: new Date().toISOString()
        }
      ];
    });
    setEditing(null);
    setStoreUrl("");
  }

  function disconnect(id: string) {
    setConnections((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function addSampleOrder() {
    const samples = ["Shopify", "Tiendanube", "WooCommerce", "Mercado Libre"];
    const channel = samples[orders.length % samples.length];
    const index = orders.length + 1;
    setOrders((current) => [
      {
        id: crypto.randomUUID(),
        channel,
        customer:
          language === "en"
            ? `Customer ${index}`
            : language === "pt"
              ? `Cliente ${index}`
              : language === "fr"
                ? `Client ${index}`
                : language === "de"
                  ? `Kunde ${index}`
                  : `Cliente ${index}`,
        total: 15900 + index * 2300,
        currency,
        status: index % 2 ? "paid" : "preparing",
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  }

  const statusLabel = (status: OnlineOrder["status"]) =>
    status === "pending"
      ? t.pending
      : status === "paid"
        ? t.paid
        : status === "preparing"
          ? t.preparing
          : status === "shipped"
            ? t.shipped
            : t.delivered;

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow={t.onlineEyebrow}
        title={t.onlineTitle}
        subtitle={t.onlineSubtitle}
      />

      <section className="apex-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--apex-border)] p-5">
          <div>
            <p className="text-sm font-semibold">{t.channels}</p>
            <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
              {t.credentialsHint}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--apex-border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--apex-muted)]">
            <RefreshCw size={12} />
            {t.syncArchitecture}
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {connectors.map((connector) => {
            const saved = connections.find(
              (item) => item.id === connector.id
            );
            const Icon =
              connector.kind === "marketplace"
                ? ShoppingBag
                : connector.kind === "api"
                  ? Code2
                  : Cloud;

            return (
              <article
                key={connector.id}
                className="rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
                    <Icon size={18} />
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] " +
                      (saved
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-[var(--apex-bg)] text-[var(--apex-muted)]")
                    }
                  >
                    {saved ? t.configured : t.notConnected}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold">
                  {connector.name}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[var(--apex-muted)]">
                  {connector.description[language]}
                </p>

                {saved?.storeUrl && (
                  <p className="mt-3 truncate text-[10px] text-[var(--apex-muted)]">
                    {saved.storeUrl}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(connector.id);
                      setStoreUrl(saved?.storeUrl ?? "");
                    }}
                    className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#8F0000] px-3 text-xs font-semibold text-white"
                  >
                    <PlugZap size={14} />
                    {t.configure}
                  </button>
                  {saved && (
                    <button
                      type="button"
                      onClick={() => disconnect(connector.id)}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--apex-border)] text-[var(--apex-muted)]"
                      aria-label={t.disconnect}
                    >
                      <Unplug size={14} />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {editing === connector.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 border-t border-[var(--apex-border)] pt-4">
                        <input
                          value={storeUrl}
                          onChange={(event) =>
                            setStoreUrl(event.target.value)
                          }
                          placeholder={t.storeUrl}
                          className="apex-input px-3 py-2.5 text-xs"
                        />
                        <p className="mt-2 text-[10px] leading-4 text-[var(--apex-muted)]">
                          {t.credentialsHint}
                        </p>
                        <button
                          type="button"
                          onClick={() => saveConnection(connector.id)}
                          className="mt-3 w-full rounded-xl border border-[var(--apex-border)] px-3 py-2.5 text-xs font-semibold"
                        >
                          {t.saveConnector}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <div className="apex-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--apex-border)] p-5">
            <h3 className="text-sm font-semibold">{t.orders}</h3>
            <button
              type="button"
              onClick={addSampleOrder}
              className="rounded-xl border border-[var(--apex-border)] px-3 py-2 text-[10px] font-semibold"
            >
              {t.sampleOrder}
            </button>
          </div>

          {!orders.length ? (
            <p className="p-5 text-sm text-[var(--apex-muted)]">
              {t.noOrders}
            </p>
          ) : (
            <div className="divide-y divide-[var(--apex-border)]">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {order.customer}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                      {order.channel} ·{" "}
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(new Date(order.createdAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: order.currency || currency
                      }).format(order.total)}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-[#8F0000]">
                      {statusLabel(order.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <article className="apex-card p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
            <Globe2 size={19} />
          </span>
          <h3 className="mt-4 text-sm font-semibold">
            {t.syncArchitecture}
          </h3>
          <p className="mt-2 text-xs leading-5 text-[var(--apex-muted)]">
            {t.syncArchitectureBody}
          </p>
          <div className="mt-5 space-y-2">
            {[Store, Boxes, PackageCheck, Truck].map((Icon, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-[var(--apex-border)] p-3"
              >
                <Icon size={15} className="text-[#8F0000]" />
                <div className="h-1.5 flex-1 rounded-full bg-[var(--apex-bg)]">
                  <div
                    className="h-full rounded-full bg-[#8F0000]"
                    style={{ width: `${88 - index * 12}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export function DocumentsHub({
  language,
  currency,
  locale
}: {
  language: LanguageCode;
  currency: string;
  locale: string;
}) {
  const t = copy[language];
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [documentsReady, setDocumentsReady] = useState(false);
  const [type, setType] = useState<DocumentType>("invoice");
  const [customer, setCustomer] = useState("");
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(
        "global-stock-documents-v1"
      );
      if (!raw) return;
      const parsed = JSON.parse(raw) as BusinessDocument[];
      if (Array.isArray(parsed)) {
        setDocuments(
          parsed.map((document) => ({
            ...document,
            currency: document.currency || currency
          }))
        );
      }
    } catch {
      // Ignore invalid local document data.
    } finally {
      setDocumentsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!documentsReady) return;
    localStorage.setItem(
      "global-stock-documents-v1",
      JSON.stringify(documents)
    );
  }, [documents, documentsReady]);

  const totals = useMemo(
    () =>
      documents
        .filter((document) => document.currency === currency)
        .reduce(
          (sum, document) =>
            sum +
            (document.type === "credit_note"
              ? -document.total
              : document.total),
          0
        ),
    [currency, documents]
  );

  function createDocument() {
    const parsedTotal = Number(total.replace(",", "."));
    if (!customer.trim() || !Number.isFinite(parsedTotal)) return;

    const prefix =
      type === "invoice" ? "FAC" : type === "receipt" ? "REC" : "NC";
    const nextSequence =
      documents.reduce((max, document) => {
        const sequence = Number(document.number.split("-").pop());
        return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
      }, 0) + 1;
    const number = `${prefix}-${String(nextSequence).padStart(6, "0")}`;

    setDocuments((current) => [
      {
        id: crypto.randomUUID(),
        number,
        type,
        customer: customer.trim(),
        description: description.trim(),
        total: Math.max(0, parsedTotal),
        currency,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);

    setCustomer("");
    setDescription("");
    setTotal("");
  }

  function printDocument(document: BusinessDocument) {
    const popup = window.open("", "_blank", "width=760,height=850");
    if (!popup) return;

    const typeLabel =
      document.type === "invoice"
        ? t.invoice
        : document.type === "receipt"
          ? t.receipt
          : t.creditNote;

    const money = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: document.currency || currency
    }).format(document.total);

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(document.number)}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:48px;color:#111}
            .brand{font-size:13px;font-weight:700;letter-spacing:.16em;color:#8f0000}
            h1{font-size:32px;margin:12px 0 32px}
            .card{border:1px solid #ddd;border-radius:18px;padding:24px}
            .row{display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid #eee}
            .row:last-child{border-bottom:0}
            .muted{color:#666;font-size:12px}
            .total{font-size:28px;font-weight:700;margin-top:24px}
          </style>
        </head>
        <body>
          <div class="brand">GLOBAL STOCK</div>
          <h1>${escapeHtml(typeLabel)}</h1>
          <div class="card">
            <div class="row"><span>${escapeHtml(document.number)}</span><span>${escapeHtml(new Date(document.createdAt).toLocaleString(locale))}</span></div>
            <div class="row"><span>${escapeHtml(t.customer)}</span><strong>${escapeHtml(document.customer)}</strong></div>
            <div class="row"><span>${escapeHtml(t.description)}</span><strong>${escapeHtml(document.description || "—")}</strong></div>
            <div class="total">${escapeHtml(money)}</div>
          </div>
          <p class="muted">${escapeHtml(t.internalNotice)}</p>
          <script>window.onload=()=>window.print()</script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  const typeLabel = (value: DocumentType) =>
    value === "invoice"
      ? t.invoice
      : value === "receipt"
        ? t.receipt
        : t.creditNote;

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow={t.documentsEyebrow}
        title={t.documentsTitle}
        subtitle={t.documentsSubtitle}
      />

      <div className="grid gap-4 xl:grid-cols-[.72fr_1.28fr]">
        <section className="apex-card h-fit p-5">
          <div className="flex items-center gap-2">
            <FilePlus2 size={17} className="text-[#8F0000]" />
            <h3 className="text-sm font-semibold">
              {t.newDocument}
            </h3>
          </div>

          <label className="mt-4 block">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
              {t.type}
            </span>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as DocumentType)
              }
              className="apex-input mt-2 px-4 py-3 text-sm"
            >
              <option value="invoice">{t.invoice}</option>
              <option value="receipt">{t.receipt}</option>
              <option value="credit_note">{t.creditNote}</option>
            </select>
          </label>

          <input
            value={customer}
            onChange={(event) => setCustomer(event.target.value)}
            placeholder={t.customer}
            className="apex-input mt-3 px-4 py-3 text-sm"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t.description}
            rows={4}
            className="apex-input mt-3 resize-none px-4 py-3 text-sm"
          />
          <input
            value={total}
            onChange={(event) => setTotal(event.target.value)}
            placeholder={t.total}
            inputMode="decimal"
            className="apex-input mt-3 px-4 py-3 text-sm"
          />

          <button
            type="button"
            onClick={createDocument}
            disabled={!customer.trim() || !total.trim()}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white disabled:opacity-35"
          >
            <FileCheck2 size={16} />
            {t.create}
          </button>

          <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-3 text-[10px] leading-4 text-[var(--apex-muted)]">
            {t.internalNotice}
          </p>
        </section>

        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={<ReceiptText size={17} />}
              label={t.documentsTitle}
              value={String(documents.length)}
            />
            <SummaryCard
              icon={<CircleDollarSign size={17} />}
              label={t.total}
              value={new Intl.NumberFormat(locale, {
                style: "currency",
                currency
              }).format(totals)}
            />
            <SummaryCard
              icon={<CheckCircle2 size={17} />}
              label={t.documentCreated}
              value={documents[0]?.number ?? "—"}
            />
          </div>

          {!documents.length ? (
            <div className="apex-card p-6 text-sm text-[var(--apex-muted)]">
              {t.noDocuments}
            </div>
          ) : (
            <div className="apex-card overflow-hidden">
              <div className="divide-y divide-[var(--apex-border)]">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {document.number} · {typeLabel(document.type)}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                        {document.customer} ·{" "}
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium"
                        }).format(new Date(document.createdAt))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="mr-2 text-sm">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: document.currency || currency
                        }).format(document.total)}
                      </strong>
                      <button
                        type="button"
                        onClick={() => printDocument(document)}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--apex-border)]"
                        aria-label={t.print}
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDocuments((current) =>
                            current.filter(
                              (item) => item.id !== document.id
                            )
                          )
                        }
                        className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--apex-border)] text-[var(--apex-muted)]"
                        aria-label={t.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  subtitle
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
        {subtitle}
      </p>
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="apex-card p-4">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]">
        {icon}
      </span>
      <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </article>
  );
}
