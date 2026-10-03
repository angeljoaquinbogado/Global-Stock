"use client";

import {
  CheckCircle2,
  ExternalLink,
  Globe2,
  Link2,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Store,
  Unplug
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";

export type ConnectedStore = {
  id: string;
  name: string;
  url: string;
  currency: string;
  platform: string;
};

export type ConnectedProduct = {
  externalId: string;
  name: string;
  description?: string;
  features?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stock: number;
  minStock?: number;
  cost: number | null;
  category?: string;
  brand?: string;
  supplier?: string;
  barcode?: string;
  image?: string;
  images?: string[];
  active?: boolean;
  sold30d?: number;
  updatedAt?: string | null;
};

export type ConnectedCatalogPayload = {
  verified: true;
  source: string;
  currency: string;
  products: ConnectedProduct[];
  syncedAt: string;
  completeness?: Record<string, string>;
};

type PublicPreview = {
  reachable: boolean;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  platform: string;
  image: string | null;
  icon: string | null;
  currency: string | null;
  productCount: number | null;
  sampleProducts: Array<{
    name: string;
    price: string | null;
    currency: string | null;
  }>;
  inspectedAt: string;
  publicDataOnly: boolean;
  connector: {
    available: boolean;
    authorizationPath: string | null;
  };
};

type IntegrationReadiness = {
  shopify: boolean;
  tiendanube: boolean;
  mercadolibre: boolean;
  woocommerce: boolean;
  custom: boolean;
};

type IntegrationAccount = {
  id: string;
  provider: keyof IntegrationReadiness;
  external_account_id: string | null;
  display_name: string | null;
  status: string;
  scopes: string[];
  last_synced_at: string | null;
};

type Props = {
  businessId: string | null;
  language: LanguageCode;
  locale: string;
  demoMode?: boolean;
  onCatalogSync: (
    store: ConnectedStore,
    catalog: ConnectedCatalogPayload
  ) => void;
};

const copy = {
  es: {
    eyebrow: "Comercio conectado",
    title: "Tienda online",
    subtitle:
      "Detectá una tienda por URL. Para leer o modificar stock privado, Global Stock exige comprobar que administrás ese negocio.",
    url: "URL de la tienda",
    inspect: "Detectar tienda",
    detecting: "Detectando…",
    detected: "Tienda detectada",
    platform: "Plataforma",
    publicProducts: "Productos públicos detectados",
    publicOnly:
      "Estos datos son públicos y todavía no habilitan cambios de stock.",
    ownership: "Conectar tienda propia",
    ownershipBody:
      "Global Stock solo habilita acceso privado cuando el sitio publica su conector seguro. Conocer una URL no demuestra que administrás ese negocio.",
    doradoStep:
      "Conector seguro detectado. Abrí el panel administrativo del sitio, iniciá sesión con una cuenta autorizada y completá la verificación antes de volver a Global Stock.",
    token: "Token de conexión",
    verify: "Verificar y conectar",
    verifying: "Verificando…",
    verified: "Propietario verificado",
    verifiedBody:
      "Esta conexión puede leer el catálogo real y sincronizar stock según los permisos autorizados.",
    sync: "Sincronizar catálogo real",
    syncing: "Sincronizando…",
    syncDone: "Catálogo real sincronizado",
    products: "productos reales",
    missingCost:
      "Algunos productos todavía no tienen costo real cargado. Global Stock no inventará ese dato.",
    disconnect: "Desconectar tienda",
    openAdmin: "Autorizar esta tienda",
    openStore: "Abrir tienda",
    invalidUrl: "Ingresá una URL válida.",
    inspectError: "No pude leer la tienda desde esa URL.",
    verifyError:
      "No se pudo verificar la propiedad. Revisá el token y que la tienda tenga el conector de Global Stock habilitado.",
    syncError:
      "La tienda está verificada, pero no se pudo sincronizar el catálogo.",
    noToken:
      "La URL sola no da permiso para cambiar stock. Necesitás el token emitido por el administrador.",
    scopes: "Permisos",
    realData: "Datos reales",
    stock: "Stock",
    price: "Precio",
    cost: "Costo",
    supplier: "Proveedor",
    barcode: "Código",
    available: "disponible",
    missing: "pendiente",
    connectedAt: "Conexión verificada",
    syncedProductsTitle: "Productos sincronizados",
    syncedProductsBody:
      "Estos son los datos reales recibidos desde la tienda verificada. Los cambios autorizados de stock y precio se sincronizan de vuelta al canal.",
    noCost: "Costo sin cargar",
    noSupplier: "Sin proveedor",
    noBarcode: "Sin código"
  },
  en: {
    eyebrow: "Connected commerce",
    title: "Online store",
    subtitle:
      "Detect a store by URL. Reading or changing private inventory requires proof that you manage the business.",
    url: "Store URL",
    inspect: "Detect store",
    detecting: "Detecting…",
    detected: "Store detected",
    platform: "Platform",
    publicProducts: "Public products detected",
    publicOnly:
      "This is public data and does not grant inventory write access.",
    ownership: "Connect your store",
    ownershipBody:
      "Global Stock enables private access only when the site publishes its secure connector. Knowing a URL does not prove you manage that business.",
    doradoStep:
      "Secure connector detected. Open the site's admin panel, sign in with an authorized account and complete verification before returning to Global Stock.",
    token: "Connection token",
    verify: "Verify and connect",
    verifying: "Verifying…",
    verified: "Owner verified",
    verifiedBody:
      "This connection can read the real catalog and synchronize inventory according to the granted scopes.",
    sync: "Sync real catalog",
    syncing: "Syncing…",
    syncDone: "Real catalog synchronized",
    products: "real products",
    missingCost:
      "Some products still have no recorded real cost. Global Stock will not invent it.",
    disconnect: "Disconnect store",
    openAdmin: "Authorize this store",
    openStore: "Open store",
    invalidUrl: "Enter a valid URL.",
    inspectError: "Could not inspect that store URL.",
    verifyError:
      "Ownership verification failed. Check the token and make sure the Global Stock connector is enabled.",
    syncError:
      "The store is verified, but the catalog could not be synchronized.",
    noToken:
      "A URL alone does not grant inventory write access. Use the token issued by the store admin.",
    scopes: "Permissions",
    realData: "Real data",
    stock: "Stock",
    price: "Price",
    cost: "Cost",
    supplier: "Supplier",
    barcode: "Barcode",
    available: "available",
    missing: "pending",
    connectedAt: "Connection verified",
    syncedProductsTitle: "Synced products",
    syncedProductsBody: "These are real values returned by the verified store. Authorized stock and price changes sync back to the channel.",
    noCost: "Cost not recorded",
    noSupplier: "No supplier",
    noBarcode: "No barcode"
  },
  pt: {
    eyebrow: "Comércio conectado",
    title: "Loja online",
    subtitle:
      "Detecte uma loja pela URL. Para ler ou alterar estoque privado, é preciso comprovar que você administra o negócio.",
    url: "URL da loja",
    inspect: "Detectar loja",
    detecting: "Detectando…",
    detected: "Loja detectada",
    platform: "Plataforma",
    publicProducts: "Produtos públicos detectados",
    publicOnly:
      "Esses dados são públicos e ainda não permitem alterar estoque.",
    ownership: "Verificar propriedade",
    ownershipBody:
      "O Global Stock só libera acesso privado quando o site publica seu conector seguro. Conhecer a URL não prova que você administra a loja.",
    doradoStep:
      "Conector seguro detectado. Abra o painel administrativo do site, entre com uma conta autorizada e conclua a verificação.",
    token: "Token de conexão",
    verify: "Verificar e conectar",
    verifying: "Verificando…",
    verified: "Proprietário verificado",
    verifiedBody:
      "A conexão pode ler o catálogo real e sincronizar estoque conforme as permissões concedidas.",
    sync: "Sincronizar catálogo real",
    syncing: "Sincronizando…",
    syncDone: "Catálogo real sincronizado",
    products: "produtos reais",
    missingCost:
      "Alguns produtos ainda não têm custo real registrado. O Global Stock não inventará esse dado.",
    disconnect: "Desconectar loja",
    openAdmin: "Autorizar esta loja",
    openStore: "Abrir loja",
    invalidUrl: "Digite uma URL válida.",
    inspectError: "Não foi possível ler a loja dessa URL.",
    verifyError:
      "Não foi possível verificar a propriedade. Confira o token e o conector.",
    syncError:
      "A loja está verificada, mas o catálogo não pôde ser sincronizado.",
    noToken:
      "A URL sozinha não permite alterar estoque. Use o token emitido pelo administrador.",
    scopes: "Permissões",
    realData: "Dados reais",
    stock: "Estoque",
    price: "Preço",
    cost: "Custo",
    supplier: "Fornecedor",
    barcode: "Código",
    available: "disponível",
    missing: "pendente",
    connectedAt: "Conexão verificada",
    syncedProductsTitle: "Produtos sincronizados",
    syncedProductsBody: "Estes são dados reais recebidos da loja verificada. Alterações autorizadas de estoque e preço são sincronizadas de volta.",
    noCost: "Custo não informado",
    noSupplier: "Sem fornecedor",
    noBarcode: "Sem código"
  },
  fr: {
    eyebrow: "Commerce connecté",
    title: "Boutique en ligne",
    subtitle:
      "Détectez une boutique par URL. L’accès au stock privé exige de prouver que vous administrez l’entreprise.",
    url: "URL de la boutique",
    inspect: "Détecter la boutique",
    detecting: "Détection…",
    detected: "Boutique détectée",
    platform: "Plateforme",
    publicProducts: "Produits publics détectés",
    publicOnly:
      "Ces données sont publiques et n’autorisent pas encore la modification du stock.",
    ownership: "Vérifier la propriété",
    ownershipBody:
      "Global Stock n’active l’accès privé que si le site publie son connecteur sécurisé. Connaître l’URL ne prouve pas que vous gérez la boutique.",
    doradoStep:
      "Connecteur sécurisé détecté. Ouvrez l’administration du site, connectez-vous avec un compte autorisé et terminez la vérification.",
    token: "Jeton de connexion",
    verify: "Vérifier et connecter",
    verifying: "Vérification…",
    verified: "Propriétaire vérifié",
    verifiedBody:
      "Cette connexion peut lire le catalogue réel et synchroniser le stock selon les autorisations accordées.",
    sync: "Synchroniser le catalogue réel",
    syncing: "Synchronisation…",
    syncDone: "Catalogue réel synchronisé",
    products: "produits réels",
    missingCost:
      "Certains produits n’ont pas encore de coût réel enregistré. Global Stock ne l’inventera pas.",
    disconnect: "Déconnecter la boutique",
    openAdmin: "Autoriser cette boutique",
    openStore: "Ouvrir la boutique",
    invalidUrl: "Saisissez une URL valide.",
    inspectError: "Impossible de lire cette boutique.",
    verifyError:
      "Impossible de vérifier la propriété. Vérifiez le jeton et le connecteur.",
    syncError:
      "La boutique est vérifiée, mais le catalogue n’a pas pu être synchronisé.",
    noToken:
      "L’URL seule ne permet pas de modifier le stock. Utilisez le jeton émis par l’administrateur.",
    scopes: "Autorisations",
    realData: "Données réelles",
    stock: "Stock",
    price: "Prix",
    cost: "Coût",
    supplier: "Fournisseur",
    barcode: "Code",
    available: "disponible",
    missing: "en attente",
    connectedAt: "Connexion vérifiée",
    syncedProductsTitle: "Produits synchronisés",
    syncedProductsBody: "Ces données proviennent réellement de la boutique vérifiée. Les modifications autorisées de stock et de prix sont renvoyées au canal.",
    noCost: "Coût non renseigné",
    noSupplier: "Sans fournisseur",
    noBarcode: "Sans code"
  },
  de: {
    eyebrow: "Vernetzter Handel",
    title: "Onlineshop",
    subtitle:
      "Shop per URL erkennen. Privater Bestand darf erst nach Nachweis der Administrationsrechte gelesen oder geändert werden.",
    url: "Shop-URL",
    inspect: "Shop erkennen",
    detecting: "Wird erkannt…",
    detected: "Shop erkannt",
    platform: "Plattform",
    publicProducts: "Öffentliche Produkte erkannt",
    publicOnly:
      "Diese Daten sind öffentlich und erlauben noch keine Bestandsänderung.",
    ownership: "Eigentümerschaft prüfen",
    ownershipBody:
      "Global Stock aktiviert privaten Zugriff nur, wenn die Website ihren sicheren Connector veröffentlicht. Die URL allein beweist keine Administratorrechte.",
    doradoStep:
      "Sicherer Connector erkannt. Öffne die Shop-Verwaltung, melde dich mit einem autorisierten Konto an und schließe die Verifizierung ab.",
    token: "Verbindungstoken",
    verify: "Prüfen und verbinden",
    verifying: "Prüfung…",
    verified: "Eigentümer verifiziert",
    verifiedBody:
      "Die Verbindung kann den echten Katalog lesen und Bestand gemäß den freigegebenen Rechten synchronisieren.",
    sync: "Echten Katalog synchronisieren",
    syncing: "Synchronisierung…",
    syncDone: "Echter Katalog synchronisiert",
    products: "echte Produkte",
    missingCost:
      "Einige Produkte haben noch keine echten Kosten. Global Stock erfindet diesen Wert nicht.",
    disconnect: "Shop trennen",
    openAdmin: "Diesen Shop autorisieren",
    openStore: "Shop öffnen",
    invalidUrl: "Gib eine gültige URL ein.",
    inspectError: "Der Shop konnte nicht gelesen werden.",
    verifyError:
      "Eigentümerschaft konnte nicht bestätigt werden. Prüfe Token und Connector.",
    syncError:
      "Der Shop ist verifiziert, aber der Katalog konnte nicht synchronisiert werden.",
    noToken:
      "Eine URL allein erlaubt keine Bestandsänderung. Nutze das vom Admin ausgestellte Token.",
    scopes: "Berechtigungen",
    realData: "Echte Daten",
    stock: "Bestand",
    price: "Preis",
    cost: "Kosten",
    supplier: "Lieferant",
    barcode: "Barcode",
    available: "vorhanden",
    missing: "ausstehend",
    connectedAt: "Verbindung verifiziert",
    syncedProductsTitle: "Synchronisierte Produkte",
    syncedProductsBody: "Diese Werte stammen aus dem verifizierten Shop. Autorisierte Bestands- und Preisänderungen werden zurück synchronisiert.",
    noCost: "Kosten nicht erfasst",
    noSupplier: "Kein Lieferant",
    noBarcode: "Kein Barcode"
  }
} satisfies Record<LanguageCode, Record<string, string>>;

function normalizeUrl(value: string) {
  let next = value.trim();
  if (!next) return "";
  if (!/^https?:\/\//i.test(next)) next = `https://${next}`;
  return new URL(next).toString();
}

function providerFromPlatform(
  platform: string
): keyof IntegrationReadiness | null {
  const normalized = platform.toLowerCase();

  if (normalized.includes("shopify")) return "shopify";
  if (
    normalized.includes("tiendanube") ||
    normalized.includes("nuvem")
  ) {
    return "tiendanube";
  }
  if (normalized.includes("woocommerce")) return "woocommerce";
  if (
    normalized.includes("mercado libre") ||
    normalized.includes("mercadolibre")
  ) {
    return "mercadolibre";
  }

  return null;
}

const providerMethods: Record<
  LanguageCode,
  Array<{
    id: keyof IntegrationReadiness;
    name: string;
    auth: string;
    detail: string;
  }>
> = {
  es: [
    { id: "shopify", name: "Shopify", auth: "OAuth", detail: "Productos, variantes, stock, pedidos y webhooks con autorización del administrador." },
    { id: "tiendanube", name: "Tiendanube", auth: "OAuth", detail: "Catálogo, stock, clientes y pedidos mediante una aplicación autorizada." },
    { id: "woocommerce", name: "WooCommerce", auth: "REST API", detail: "Productos, stock y pedidos usando credenciales generadas por el dueño de la tienda." },
    { id: "mercadolibre", name: "Mercado Libre", auth: "OAuth", detail: "Publicaciones, inventario, órdenes y envíos con permisos de la cuenta." },
    { id: "custom", name: "Sitio propio / API", auth: "Verificación segura", detail: "Conector Global Stock, API empresarial o verificación de dominio para sistemas propios." }
  ],
  en: [
    { id: "shopify", name: "Shopify", auth: "OAuth", detail: "Products, variants, inventory, orders and webhooks with admin authorization." },
    { id: "tiendanube", name: "Tiendanube", auth: "OAuth", detail: "Catalog, inventory, customers and orders through an authorized app." },
    { id: "woocommerce", name: "WooCommerce", auth: "REST API", detail: "Products, inventory and orders using credentials issued by the store owner." },
    { id: "mercadolibre", name: "Mercado Libre", auth: "OAuth", detail: "Listings, inventory, orders and shipping with account permissions." },
    { id: "custom", name: "Custom API", auth: "Secure verification", detail: "Global Stock connector for custom stores with revocable scoped authorization." }
  ],
  pt: [
    { id: "shopify", name: "Shopify", auth: "OAuth", detail: "Produtos, variantes, estoque, pedidos e webhooks com autorização do administrador." },
    { id: "tiendanube", name: "Tiendanube", auth: "OAuth", detail: "Catálogo, estoque, clientes e pedidos por aplicativo autorizado." },
    { id: "woocommerce", name: "WooCommerce", auth: "REST API", detail: "Produtos, estoque e pedidos com credenciais emitidas pelo dono da loja." },
    { id: "mercadolibre", name: "Mercado Libre", auth: "OAuth", detail: "Anúncios, estoque, pedidos e envios com permissões da conta." },
    { id: "custom", name: "API própria", auth: "Verificação segura", detail: "Conector Global Stock para lojas próprias, com autorização revogável." }
  ],
  fr: [
    { id: "shopify", name: "Shopify", auth: "OAuth", detail: "Produits, variantes, stock, commandes et webhooks avec autorisation administrateur." },
    { id: "tiendanube", name: "Tiendanube", auth: "OAuth", detail: "Catalogue, stock, clients et commandes via une application autorisée." },
    { id: "woocommerce", name: "WooCommerce", auth: "REST API", detail: "Produits, stock et commandes avec des identifiants émis par le propriétaire." },
    { id: "mercadolibre", name: "Mercado Libre", auth: "OAuth", detail: "Annonces, stock, commandes et expéditions avec les permissions du compte." },
    { id: "custom", name: "API personnalisée", auth: "Vérification sécurisée", detail: "Connecteur Global Stock pour boutiques propriétaires, avec autorisation révocable." }
  ],
  de: [
    { id: "shopify", name: "Shopify", auth: "OAuth", detail: "Produkte, Varianten, Bestand, Bestellungen und Webhooks mit Admin-Autorisierung." },
    { id: "tiendanube", name: "Tiendanube", auth: "OAuth", detail: "Katalog, Bestand, Kunden und Bestellungen über eine autorisierte App." },
    { id: "woocommerce", name: "WooCommerce", auth: "REST API", detail: "Produkte, Bestand und Bestellungen mit vom Shopinhaber erstellten Zugangsdaten." },
    { id: "mercadolibre", name: "Mercado Libre", auth: "OAuth", detail: "Angebote, Bestand, Bestellungen und Versand mit Kontoberechtigungen." },
    { id: "custom", name: "Eigene API", auth: "Sichere Verifizierung", detail: "Global-Stock-Connector für eigene Shops mit widerrufbarer Autorisierung." }
  ]
};

export function ConnectedCommerceHub({
  businessId,
  language,
  locale,
  demoMode = false,
  onCatalogSync
}: Props) {
  const t = copy[language];
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PublicPreview | null>(null);
  const [store, setStore] = useState<ConnectedStore | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const [missingCostCount, setMissingCostCount] = useState(0);
  const [catalogProducts, setCatalogProducts] = useState<ConnectedProduct[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [readiness, setReadiness] = useState<IntegrationReadiness | null>(null);
  const [integrationAccounts, setIntegrationAccounts] = useState<
    IntegrationAccount[]
  >([]);
  const [selectedProvider, setSelectedProvider] =
    useState<keyof IntegrationReadiness>("custom");
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [requestingIntegration, setRequestingIntegration] = useState(false);

  const selectedProviderMeta =
    providerMethods[language].find(
      (provider) => provider.id === selectedProvider
    ) ?? providerMethods[language][0];
  const selectedProviderReady =
    readiness?.[selectedProvider] ?? false;
  const selectedProviderAccount =
    integrationAccounts.find(
      (account) =>
        account.provider === selectedProvider &&
        account.status === "connected"
    ) ?? null;

  const detectedProvider = preview
    ? providerFromPlatform(preview.platform)
    : null;

  const adminUrl = useMemo(() => {
    if (
      !preview?.connector?.available ||
      !preview.connector.authorizationPath
    ) {
      return "";
    }

    try {
      const admin = new URL(
        preview.connector.authorizationPath,
        normalizeUrl(preview.url)
      );
      admin.searchParams.set("source", "global-stock");
      admin.searchParams.set("intent", "authorize");
      if (typeof window !== "undefined") {
        admin.searchParams.set("return_to", window.location.origin);
      }
      admin.hash = "global-stock-panel";
      return admin.toString();
    } catch {
      return "";
    }
  }, [preview]);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/integrations/status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && payload) {
          setReadiness(payload as IntegrationReadiness);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadIntegrationAccounts() {
    if (!businessId || demoMode) {
      setIntegrationAccounts([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data } = await supabase
      .from("global_stock_integration_accounts")
      .select(
        "id,provider,external_account_id,display_name,status,scopes,last_synced_at"
      )
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false });

    setIntegrationAccounts(
      ((data ?? []) as Array<{
        id: string;
        provider: string;
        external_account_id: string | null;
        display_name: string | null;
        status: string;
        scopes: string[];
        last_synced_at: string | null;
      }>)
        .filter((account) =>
          [
            "shopify",
            "tiendanube",
            "mercadolibre",
            "woocommerce",
            "custom"
          ].includes(account.provider)
        )
        .map((account) => ({
          ...account,
          provider: account.provider as keyof IntegrationReadiness,
          scopes: Array.isArray(account.scopes) ? account.scopes : []
        }))
    );
  }

  useEffect(() => {
    void reloadIntegrationAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, demoMode]);

  useEffect(() => {
    if (demoMode) {
      setStore(null);
      setScopes([]);
      setSyncedCount(null);
      setMissingCostCount(0);
      setCatalogProducts([]);
      return;
    }

    let cancelled = false;

    async function restoreVerifiedConnection() {
      if (!businessId) return;

      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const bindResponse = await fetch("/api/store-connector/verify", {
          method: "PATCH",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ businessId })
        });

        if (!bindResponse.ok) return;

        const response = await fetch(
          `/api/store-connector/verify?businessId=${encodeURIComponent(
            businessId
          )}`,
          { cache: "no-store" }
        );
        const payload = (await response.json().catch(() => ({}))) as {
          verified?: boolean;
          store?: ConnectedStore;
          scopes?: string[];
        };

        if (!response.ok || !payload.verified || !payload.store) return;
        if (cancelled) return;

        setStore(payload.store);
        setScopes(Array.isArray(payload.scopes) ? payload.scopes : []);
        setUrl(payload.store.url);
        await reloadIntegrationAccounts();
        void syncCatalog(payload.store);
      } catch {
        // No persisted verified store is a valid first-run state.
      }
    }

    void restoreVerifiedConnection();
    return () => {
      cancelled = true;
    };
  // Restore only when the active business changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, demoMode]);

  async function inspectStore() {
    setError("");
    setMessage("");

    let normalized: string;
    try {
      normalized = normalizeUrl(url);
      if (!normalized) throw new Error("missing");
    } catch {
      setError(t.invalidUrl);
      return;
    }

    setDetecting(true);
    try {
      const response = await fetch(
        `/api/store-preview?url=${encodeURIComponent(normalized)}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      const payload = (await response.json().catch(() => ({}))) as PublicPreview;

      if (!response.ok || payload.reachable !== true) {
        throw new Error("preview");
      }

      setPreview(payload);
      setUrl(payload.url);
      setMessage(t.detected);
    } catch {
      setPreview(null);
      setError(t.inspectError);
    } finally {
      setDetecting(false);
    }
  }

  async function syncCatalog(currentStore = store) {
    if (!currentStore) return;

    setError("");
    setSyncing(true);
    try {
      const response = await fetch(
        `/api/store-connector/products?businessId=${encodeURIComponent(
          businessId ?? ""
        )}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      const payload = (await response.json().catch(() => ({}))) as
        | ConnectedCatalogPayload
        | { error?: string };

      if (
        !response.ok ||
        !("products" in payload) ||
        !Array.isArray(payload.products)
      ) {
        throw new Error("catalog");
      }

      const catalog = payload as ConnectedCatalogPayload;
      onCatalogSync(currentStore, catalog);
      setCatalogProducts(catalog.products);
      setSyncedCount(catalog.products.length);
      setMissingCostCount(
        catalog.products.filter(
          (product) =>
            product.cost === null ||
            !Number.isFinite(Number(product.cost))
        ).length
      );
      setMessage(
        `${t.syncDone}: ${catalog.products.length} ${t.products}`
      );
    } catch {
      setError(t.syncError);
    } finally {
      setSyncing(false);
    }
  }

  async function requestIntegration(
    kind: "platform" | "enterprise" | "public-site"
  ) {
    if (!preview) return;

    setRequestingIntegration(true);
    setError("");

    const requestId = crypto.randomUUID().slice(0, 8).toUpperCase();
    const description = [
      "Solicitud de integración",
      "tipo=" + kind,
      "dominio=" + preview.domain,
      "plataforma=" + preview.platform,
      "solicitud=" + requestId
    ].join(" · ");

    try {
      const supabase = getSupabaseBrowserClient();

      if (supabase && businessId && !demoMode) {
        await supabase.from("global_stock_notifications").insert({
          business_id: businessId,
          kind: "integration_request",
          title: "Integración solicitada · " + preview.domain,
          body: description,
          severity: "info",
          entity_type: "integration"
        });
      }

      setMessage(
        language === "es"
          ? `Solicitud ${requestId} registrada para ${preview.domain}. La web sigue en modo público hasta que exista una autorización válida.`
          : `Request ${requestId} registered for ${preview.domain}. The site remains public-only until valid authorization exists.`
      );
    } catch {
      setMessage(
        language === "es"
          ? `Solicitud ${requestId} preparada para ${preview.domain}. La tienda sigue en modo público hasta que se complete una autorización válida.`
          : `Request ${requestId} prepared for ${preview.domain}. The store stays public-only until valid authorization is completed.`
      );
    } finally {
      setRequestingIntegration(false);
    }
  }

  async function disconnectProvider(
    provider: keyof IntegrationReadiness
  ) {
    if (!businessId) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error: disconnectError } = await supabase.rpc(
      "global_stock_disconnect_integration",
      {
        target_business_id: businessId,
        target_provider: provider
      }
    );

    if (disconnectError) {
      setError(
        language === "es"
          ? "No se pudo desconectar la integración."
          : "Could not disconnect the integration."
      );
      return;
    }

    await reloadIntegrationAccounts();
  }

  async function disconnect() {
    try {
      await fetch(
        `/api/store-connector/verify?businessId=${encodeURIComponent(
          businessId ?? ""
        )}`,
        {
          method: "DELETE",
          cache: "no-store"
        }
      );

      if (businessId) {
        await disconnectProvider("custom");
      }
    } finally {
      setStore(null);
      setScopes([]);
      setSyncedCount(null);
      setMissingCostCount(0);
      setCatalogProducts([]);
      setMessage("");
      setError("");
    }
  }

  return (
    <div className="space-y-5">
      <section className="apex-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
            <ShieldCheck size={19} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
              {language === "es" ? "Canales compatibles" : language === "pt" ? "Canais compatíveis" : language === "fr" ? "Canaux compatibles" : language === "de" ? "Kompatible Kanäle" : "Supported channels"}
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              {language === "es" ? "Cada canal exige autorización del dueño" : language === "pt" ? "Cada canal exige autorização do proprietário" : language === "fr" ? "Chaque canal exige l’autorisation du propriétaire" : language === "de" ? "Jeder Kanal benötigt die Freigabe des Inhabers" : "Every channel requires owner authorization"}
            </h3>
          </div>
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {providerMethods[language].map((provider) => {
            const ready = readiness?.[provider.id] ?? false;
            const connected = integrationAccounts.some(
              (account) =>
                account.provider === provider.id &&
                account.status === "connected"
            );
            const active = selectedProvider === provider.id;

            return (
              <button
                key={provider.name}
                type="button"
                onClick={() => setSelectedProvider(provider.id)}
                aria-pressed={active}
                className={
                  "rounded-2xl border p-4 text-left transition " +
                  (active
                    ? "border-[#8F0000]/60 bg-[#8F0000]/[0.07] shadow-[0_12px_34px_rgba(143,0,0,.12)]"
                    : "border-[var(--apex-border)] bg-[var(--apex-surface-strong)] hover:border-[#8F0000]/30")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{provider.name}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
                      {provider.auth}
                    </p>
                  </div>
                  <span
                    className={
                      "rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] " +
                      (connected
                        ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-600"
                        : ready
                          ? "border-sky-500/25 bg-sky-500/8 text-sky-600"
                          : "border-amber-500/20 bg-amber-500/8 text-amber-500")
                    }
                  >
                    {connected
                      ? language === "es"
                        ? "Conectado"
                        : "Connected"
                      : ready
                        ? language === "es"
                          ? "Configurado"
                          : "Configured"
                        : language === "es"
                          ? "Pendiente"
                          : language === "pt"
                            ? "Pendente"
                            : language === "fr"
                              ? "En attente"
                              : language === "de"
                                ? "Ausstehend"
                                : "Pending"}
                  </span>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-[var(--apex-muted)]">
                  {provider.detail}
                </p>
                <div className="mt-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.08em]">
                  <span className={active ? "text-[#8F0000]" : "text-[var(--apex-muted)]"}>
                    {active
                      ? language === "es"
                        ? "Seleccionado"
                        : language === "pt"
                          ? "Selecionado"
                          : language === "fr"
                            ? "Sélectionné"
                            : language === "de"
                              ? "Ausgewählt"
                              : "Selected"
                      : language === "es"
                        ? "Elegir canal"
                        : language === "pt"
                          ? "Escolher canal"
                          : language === "fr"
                            ? "Choisir"
                            : language === "de"
                              ? "Auswählen"
                              : "Choose channel"}
                  </span>
                  {active && <CheckCircle2 size={14} />}
                </div>
              </button>
            );
          })}
        </div>

        {selectedProvider !== "custom" && (
          <div className="mt-4 rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {selectedProviderMeta.name} · {selectedProviderMeta.auth}
                </p>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--apex-muted)]">
                  {selectedProviderMeta.detail}
                </p>
              </div>
              <span
                className={
                  "shrink-0 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] " +
                  (selectedProviderAccount
                    ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-600"
                    : selectedProviderReady
                      ? "border-sky-500/25 bg-sky-500/8 text-sky-600"
                      : "border-amber-500/20 bg-amber-500/8 text-amber-600")
                }
              >
                {selectedProviderAccount
                  ? language === "es"
                    ? "Conectado"
                    : "Connected"
                  : selectedProviderReady
                    ? language === "es"
                      ? "Aplicación configurada"
                      : "App configured"
                    : language === "es"
                      ? "Configuración pendiente"
                      : "Setup pending"}
              </span>
            </div>
            {selectedProviderAccount ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-[10px] leading-5 text-[var(--apex-muted)]">
                  {selectedProviderAccount.display_name ||
                    selectedProviderAccount.external_account_id ||
                    selectedProviderMeta.name}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void disconnectProvider(selectedProvider)
                  }
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--apex-border)] px-3 text-xs font-semibold"
                >
                  <Unplug size={13} />
                  {language === "es" ? "Desconectar" : "Disconnect"}
                </button>
              </div>
            ) : !selectedProviderReady ? (
              <p className="mt-3 text-[10px] leading-5 text-[var(--apex-muted)]">
                {language === "es"
                  ? "Global Stock no simula esta conexión: falta configurar la aplicación oficial del proveedor."
                  : "Global Stock does not simulate this connection. The provider app still needs to be configured."}
              </p>
            ) : (
              <p className="mt-3 text-[10px] leading-5 text-[var(--apex-muted)]">
                {language === "es"
                  ? "La aplicación del proveedor está configurada. Falta autorizar esta cuenta comercial."
                  : "The provider app is configured. This business account still needs authorization."}
              </p>
            )}
          </div>
        )}
      </section>
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8F0000]">
          {t.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          {t.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
          {t.subtitle}
        </p>
      </section>

      {!store && selectedProvider === "custom" && (
        <section className="apex-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
              <Globe2 size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{t.detected}</h3>
              <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (detecting || !url.trim()) return;
                  void inspectStore();
                }}
              >
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://tu-tienda.com"
                  inputMode="url"
                  enterKeyHint="search"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="apex-input min-h-12 flex-1 px-4 py-3 text-[16px]"
                  aria-label={t.url}
                />
                <button
                  type="submit"
                  disabled={detecting || !url.trim()}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <RefreshCw
                    size={16}
                    className={detecting ? "animate-spin" : ""}
                  />
                  {detecting ? t.detecting : t.inspect}
                </button>
              </form>
            </div>
          </div>

          {preview && (
            <div className="mt-5 rounded-[24px] border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#8F0000]/10 text-[#8F0000]">
                  <Store size={18} />
                  {(preview.icon || preview.image) && (
                    <img
                      src={preview.icon || preview.image || ""}
                      alt=""
                      className="absolute inset-0 h-full w-full bg-white object-contain p-1.5"
                      onError={(event) => {
                        const image = event.currentTarget;
                        const fallback = preview.image;

                        if (
                          fallback &&
                          image.dataset.fallbackTried !== "true" &&
                          image.src !== new URL(fallback, window.location.origin).toString()
                        ) {
                          image.dataset.fallbackTried = "true";
                          image.src = fallback;
                          return;
                        }

                        image.style.display = "none";
                      }}
                    />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {preview.title}
                  </p>
                  <p className="truncate text-[10px] text-[var(--apex-muted)]">
                    {preview.domain}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Metric label={t.platform} value={preview.platform} />
                <Metric
                  label={t.publicProducts}
                  value={
                    preview.productCount === null
                      ? "—"
                      : String(preview.productCount)
                  }
                />
              </div>

              {preview.description && (
                <p className="mt-4 text-xs leading-5 text-[var(--apex-muted)]">
                  {preview.description}
                </p>
              )}

              <p className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[11px] leading-5 text-[var(--apex-muted)]">
                <LockKeyhole size={15} className="mt-0.5 shrink-0 text-amber-600" />
                {t.publicOnly}
              </p>
            </div>
          )}
        </section>
      )}

      {!store &&
        selectedProvider === "custom" &&
        preview &&
        !preview.connector?.available && (
          <section className="apex-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                <LockKeyhole size={19} />
              </span>
              <div>
                <h3 className="text-sm font-semibold">
                  {language === "es"
                    ? "Análisis público solamente"
                    : "Public analysis only"}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[var(--apex-muted)]">
                  {language === "es"
                    ? "Global Stock puede leer información pública de este sitio, pero no detectó un conector seguro propio. No se mostrará ningún acceso administrativo ni se intentará modificar stock."
                    : "Global Stock can inspect public information from this site, but no secure Global Stock connector was detected. No admin access will be offered and inventory will not be modified."}
                </p>
              </div>
            </div>
          </section>
        )}

      {!store &&
        selectedProvider === "custom" &&
        preview?.connector?.available && (
        <section className="apex-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
              <ShieldCheck size={19} />
            </span>
            <div>
              <h3 className="text-sm font-semibold">{t.ownership}</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--apex-muted)]">
                {t.ownershipBody}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
            <p className="text-xs font-semibold">{t.doradoStep}</p>
            <p className="mt-2 text-[10px] leading-5 text-[var(--apex-muted)]">
              {language === "es"
                ? "Global Stock nunca recibe ni almacena la contraseña del sitio. La credencial técnica se crea detrás de escena únicamente después de completar la verificación."
                : "Global Stock never receives or stores the site's password. The technical connector credential is created server-side only after verification."}
            </p>
            {adminUrl && (
              <a
                href={adminUrl}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#8F0000] px-4 text-xs font-semibold text-white"
              >
                <ExternalLink size={14} />
                {t.openAdmin}
              </a>
            )}
          </div>
        </section>
      )}

      {store && (
        <section className="apex-card overflow-hidden">
          <div className="border-b border-[var(--apex-border)] bg-emerald-500/[0.05] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-600">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
                    {t.verified}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{store.name}</h3>
                  <p className="mt-1 text-xs text-[var(--apex-muted)]">
                    {store.platform} · {store.currency}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={disconnect}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] px-4 text-xs font-semibold text-[var(--apex-muted)]"
              >
                <Unplug size={14} />
                {t.disconnect}
              </button>
            </div>

            <p className="mt-4 max-w-3xl text-xs leading-5 text-[var(--apex-muted)]">
              {t.verifiedBody}
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-[1fr_.85fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {t.scopes}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {scopes.map((scope) => (
                  <span
                    key={scope}
                    className="rounded-full border border-[var(--apex-border)] bg-[var(--apex-bg)] px-3 py-2 text-[10px] font-semibold"
                  >
                    {scope}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void syncCatalog()}
                  disabled={syncing}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <RefreshCw
                    size={16}
                    className={syncing ? "animate-spin" : ""}
                  />
                  {syncing ? t.syncing : t.sync}
                </button>

                <a
                  href={store.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--apex-border)] px-5 text-sm font-semibold"
                >
                  <ExternalLink size={15} />
                  {t.openStore}
                </a>
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
              <div className="flex items-center gap-2">
                <PackageCheck size={16} className="text-[#8F0000]" />
                <p className="text-xs font-semibold">{t.realData}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric
                  label={t.products}
                  value={syncedCount === null ? "—" : String(syncedCount)}
                />
                <Metric
                  label={t.cost}
                  value={
                    syncedCount === null
                      ? "—"
                      : missingCostCount === 0
                        ? t.available
                        : `${missingCostCount} ${t.missing}`
                  }
                />
              </div>
              {missingCostCount > 0 && (
                <p className="mt-3 text-[10px] leading-4 text-amber-600">
                  {t.missingCost}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {store && catalogProducts.length > 0 && (
        <section className="apex-card overflow-hidden">
          <div className="border-b border-[var(--apex-border)] p-5 sm:p-6">
            <h3 className="text-sm font-semibold">{t.syncedProductsTitle}</h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--apex-muted)]">
              {t.syncedProductsBody}
            </p>
          </div>

          <div className="divide-y divide-[var(--apex-border)]">
            {catalogProducts.slice(0, 24).map((product) => (
              <article
                key={product.externalId}
                className="grid gap-3 p-4 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center sm:px-6"
              >
                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)]">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[#8F0000]">
                      <PackageCheck size={18} />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="mt-1 truncate text-[10px] text-[var(--apex-muted)]">
                    {product.supplier || t.noSupplier} · {product.barcode || t.noBarcode}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="rounded-full border border-[var(--apex-border)] px-2.5 py-1.5 text-[10px] font-semibold">
                    {t.stock}: {product.stock}
                  </span>
                  <span className="rounded-full border border-[var(--apex-border)] px-2.5 py-1.5 text-[10px] font-semibold">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: store.currency || "ARS",
                      maximumFractionDigits: 2
                    }).format(Number(product.price) || 0)}
                  </span>
                </div>

                {product.cost === null && (
                  <p className="text-[10px] font-semibold text-amber-600 sm:col-start-2 sm:col-span-2">
                    {t.noCost}
                  </p>
                )}
              </article>
            ))}

            {catalogProducts.length > 24 && (
              <div className="px-6 py-4 text-center text-[10px] text-[var(--apex-muted)]">
                +{catalogProducts.length - 24} {t.products}
              </div>
            )}
          </div>
        </section>
      )}

      {(message || error) && (
        <div
          role={error ? "alert" : "status"}
          className={
            "rounded-2xl border px-4 py-3 text-xs font-semibold " +
            (error
              ? "border-red-500/20 bg-red-500/[0.06] text-red-500"
              : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-600")
          }
        >
          {error || message}
        </div>
      )}

      {!store && selectedProvider === "custom" && !preview && (
        <section className="grid gap-3 sm:grid-cols-3">
          <Info icon={<Link2 size={16} />} text={t.publicOnly} />
          <Info icon={<ShieldCheck size={16} />} text={t.ownershipBody} />
          <Info icon={<PackageCheck size={16} />} text={t.verifiedBody} />
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}

function Info({
  icon,
  text
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <article className="apex-card flex items-start gap-3 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]">
        {icon}
      </span>
      <p className="text-[11px] leading-5 text-[var(--apex-muted)]">
        {text}
      </p>
    </article>
  );
}
