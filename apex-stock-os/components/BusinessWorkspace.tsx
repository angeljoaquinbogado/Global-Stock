"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Minus,
  Moon,
  PackagePlus,
  Plus,
  Search,
  Settings2,
  ShoppingCart,
  Store,
  Sun,
  Truck,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  calculateMetrics,
  formatMoney,
  getStockStatus,
  rankRestockNeeds
} from "@/lib/analytics";
import { demoProducts, demoTrend } from "@/lib/demo-data";
import type { BusinessSnapshot, Product } from "@/lib/types";

import { ApexIntelligence } from "./ApexIntelligence";
import { BarcodeScanner } from "./BarcodeScanner";
import { GlobalPreferences, type LanguageCode } from "./GlobalPreferences";
import { InstallAppButton } from "./InstallAppButton";
import { Logo } from "./Logo";

type ModuleId =
  | "overview"
  | "pos"
  | "inventory"
  | "purchases"
  | "suppliers"
  | "reports"
  | "settings";

type BusinessWorkspaceProps = {
  dark: boolean;
  language: LanguageCode;
  currency: string;
  onLanguageChange: (language: LanguageCode) => void;
  onCurrencyChange: (currency: string) => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
};

const localeByLanguage: Record<LanguageCode, string> = {
  es: "es-AR",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE"
};

const dayLabels: Record<LanguageCode, string[]> = {
  es: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  pt: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  fr: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
};

const copy: Record<
  LanguageCode,
  {
    nav: Record<ModuleId, string>;
    more: string;
    overviewTitle: string;
    overviewSubtitle: string;
    revenue: string;
    inventoryCost: string;
    grossProfit: string;
    margin: string;
    units: string;
    alerts: string;
    salesFlow: string;
    revenueVsCost: string;
    posTitle: string;
    posSubtitle: string;
    searchProducts: string;
    cart: string;
    emptyCart: string;
    total: string;
    estimatedProfit: string;
    completeSale: string;
    saleCompleted: string;
    add: string;
    inventoryTitle: string;
    inventorySubtitle: string;
    product: string;
    category: string;
    supplier: string;
    cost: string;
    price: string;
    stock: string;
    status: string;
    normal: string;
    low: string;
    out: string;
    purchasesTitle: string;
    purchasesSubtitle: string;
    suggested: string;
    coverage: string;
    days: string;
    estimatedCost: string;
    receivePurchase: string;
    purchaseApplied: string;
    suppliersTitle: string;
    suppliersSubtitle: string;
    products: string;
    inventoryValue: string;
    averageMargin: string;
    reportsTitle: string;
    reportsSubtitle: string;
    settingsTitle: string;
    settingsSubtitle: string;
    businessName: string;
    save: string;
    saved: string;
    appearance: string;
    theme: string;
    preferences: string;
    signOut: string;
    install: string;
    criticalStock: string;
    businessSummary: string;
    open: string;
  }
> = {
  es: {
    nav: {
      overview: "Inicio",
      pos: "Ventas",
      inventory: "Inventario",
      purchases: "Compras",
      suppliers: "Proveedores",
      reports: "Reportes",
      settings: "Configuración"
    },
    more: "Más",
    overviewTitle: "Centro de control",
    overviewSubtitle: "Una vista completa de la operación de tu negocio.",
    revenue: "Ingresos",
    inventoryCost: "Costo de inventario",
    grossProfit: "Ganancia bruta",
    margin: "Margen",
    units: "unidades",
    alerts: "alertas",
    salesFlow: "Flujo de ventas",
    revenueVsCost: "Ingresos vs costos",
    posTitle: "Punto de venta",
    posSubtitle: "Vendé, calculá el total y descontá stock en tiempo real.",
    searchProducts: "Buscar producto",
    cart: "Carrito",
    emptyCart: "Todavía no agregaste productos.",
    total: "Total",
    estimatedProfit: "Ganancia estimada",
    completeSale: "Confirmar venta",
    saleCompleted: "Venta registrada y stock actualizado.",
    add: "Agregar",
    inventoryTitle: "Inventario",
    inventorySubtitle: "Controlá stock, precios, estados y códigos.",
    product: "Producto",
    category: "Categoría",
    supplier: "Proveedor",
    cost: "Costo",
    price: "Precio",
    stock: "Stock",
    status: "Estado",
    normal: "Normal",
    low: "Bajo",
    out: "Agotado",
    purchasesTitle: "Compras y reposición",
    purchasesSubtitle: "Priorizá compras según cobertura y rotación.",
    suggested: "Sugerido",
    coverage: "Cobertura",
    days: "días",
    estimatedCost: "Costo estimado",
    receivePurchase: "Recibir reposición",
    purchaseApplied: "Reposición aplicada al inventario.",
    suppliersTitle: "Proveedores",
    suppliersSubtitle: "Visualizá exposición, stock y margen por proveedor.",
    products: "Productos",
    inventoryValue: "Valor de inventario",
    averageMargin: "Margen promedio",
    reportsTitle: "Reportes",
    reportsSubtitle: "Compará ingresos, costos y ganancia por período.",
    settingsTitle: "Configuración",
    settingsSubtitle: "Preferencias globales de tu negocio y aplicación.",
    businessName: "Nombre del negocio",
    save: "Guardar cambios",
    saved: "Cambios guardados.",
    appearance: "Apariencia",
    theme: "Tema",
    preferences: "Idioma y moneda",
    signOut: "Cerrar sesión",
    install: "Instalar aplicación",
    criticalStock: "Stock crítico",
    businessSummary: "Resumen del negocio",
    open: "Abrir"
  },
  en: {
    nav: {
      overview: "Home",
      pos: "Sales",
      inventory: "Inventory",
      purchases: "Purchases",
      suppliers: "Suppliers",
      reports: "Reports",
      settings: "Settings"
    },
    more: "More",
    overviewTitle: "Control center",
    overviewSubtitle: "A complete view of your business operation.",
    revenue: "Revenue",
    inventoryCost: "Inventory cost",
    grossProfit: "Gross profit",
    margin: "Margin",
    units: "units",
    alerts: "alerts",
    salesFlow: "Sales flow",
    revenueVsCost: "Revenue vs costs",
    posTitle: "Point of sale",
    posSubtitle: "Sell, calculate totals and deduct stock in real time.",
    searchProducts: "Search product",
    cart: "Cart",
    emptyCart: "No products added yet.",
    total: "Total",
    estimatedProfit: "Estimated profit",
    completeSale: "Complete sale",
    saleCompleted: "Sale recorded and stock updated.",
    add: "Add",
    inventoryTitle: "Inventory",
    inventorySubtitle: "Control stock, prices, status and barcodes.",
    product: "Product",
    category: "Category",
    supplier: "Supplier",
    cost: "Cost",
    price: "Price",
    stock: "Stock",
    status: "Status",
    normal: "Normal",
    low: "Low",
    out: "Out of stock",
    purchasesTitle: "Purchasing & replenishment",
    purchasesSubtitle: "Prioritize purchases by coverage and rotation.",
    suggested: "Suggested",
    coverage: "Coverage",
    days: "days",
    estimatedCost: "Estimated cost",
    receivePurchase: "Receive restock",
    purchaseApplied: "Restock applied to inventory.",
    suppliersTitle: "Suppliers",
    suppliersSubtitle: "See exposure, stock and margin by supplier.",
    products: "Products",
    inventoryValue: "Inventory value",
    averageMargin: "Average margin",
    reportsTitle: "Reports",
    reportsSubtitle: "Compare revenue, costs and profit by period.",
    settingsTitle: "Settings",
    settingsSubtitle: "Global business and application preferences.",
    businessName: "Business name",
    save: "Save changes",
    saved: "Changes saved.",
    appearance: "Appearance",
    theme: "Theme",
    preferences: "Language & currency",
    signOut: "Sign out",
    install: "Install app",
    criticalStock: "Critical stock",
    businessSummary: "Business summary",
    open: "Open"
  },
  pt: {
    nav: {
      overview: "Início",
      pos: "Vendas",
      inventory: "Estoque",
      purchases: "Compras",
      suppliers: "Fornecedores",
      reports: "Relatórios",
      settings: "Configurações"
    },
    more: "Mais",
    overviewTitle: "Centro de controle",
    overviewSubtitle: "Uma visão completa da operação do seu negócio.",
    revenue: "Receita",
    inventoryCost: "Custo do estoque",
    grossProfit: "Lucro bruto",
    margin: "Margem",
    units: "unidades",
    alerts: "alertas",
    salesFlow: "Fluxo de vendas",
    revenueVsCost: "Receita vs custos",
    posTitle: "Ponto de venda",
    posSubtitle: "Venda, calcule o total e desconte o estoque em tempo real.",
    searchProducts: "Buscar produto",
    cart: "Carrinho",
    emptyCart: "Nenhum produto adicionado ainda.",
    total: "Total",
    estimatedProfit: "Lucro estimado",
    completeSale: "Confirmar venda",
    saleCompleted: "Venda registrada e estoque atualizado.",
    add: "Adicionar",
    inventoryTitle: "Estoque",
    inventorySubtitle: "Controle estoque, preços, status e códigos.",
    product: "Produto",
    category: "Categoria",
    supplier: "Fornecedor",
    cost: "Custo",
    price: "Preço",
    stock: "Estoque",
    status: "Status",
    normal: "Normal",
    low: "Baixo",
    out: "Esgotado",
    purchasesTitle: "Compras e reposição",
    purchasesSubtitle: "Priorize compras por cobertura e rotação.",
    suggested: "Sugerido",
    coverage: "Cobertura",
    days: "dias",
    estimatedCost: "Custo estimado",
    receivePurchase: "Receber reposição",
    purchaseApplied: "Reposição aplicada ao estoque.",
    suppliersTitle: "Fornecedores",
    suppliersSubtitle: "Veja exposição, estoque e margem por fornecedor.",
    products: "Produtos",
    inventoryValue: "Valor do estoque",
    averageMargin: "Margem média",
    reportsTitle: "Relatórios",
    reportsSubtitle: "Compare receita, custos e lucro por período.",
    settingsTitle: "Configurações",
    settingsSubtitle: "Preferências globais do negócio e do aplicativo.",
    businessName: "Nome do negócio",
    save: "Salvar alterações",
    saved: "Alterações salvas.",
    appearance: "Aparência",
    theme: "Tema",
    preferences: "Idioma e moeda",
    signOut: "Sair",
    install: "Instalar aplicativo",
    criticalStock: "Estoque crítico",
    businessSummary: "Resumo do negócio",
    open: "Abrir"
  },
  fr: {
    nav: {
      overview: "Accueil",
      pos: "Ventes",
      inventory: "Inventaire",
      purchases: "Achats",
      suppliers: "Fournisseurs",
      reports: "Rapports",
      settings: "Paramètres"
    },
    more: "Plus",
    overviewTitle: "Centre de contrôle",
    overviewSubtitle: "Une vue complète de l’activité de votre entreprise.",
    revenue: "Revenus",
    inventoryCost: "Coût du stock",
    grossProfit: "Bénéfice brut",
    margin: "Marge",
    units: "unités",
    alerts: "alertes",
    salesFlow: "Flux des ventes",
    revenueVsCost: "Revenus vs coûts",
    posTitle: "Point de vente",
    posSubtitle: "Vendez, calculez le total et déduisez le stock en temps réel.",
    searchProducts: "Rechercher un produit",
    cart: "Panier",
    emptyCart: "Aucun produit ajouté.",
    total: "Total",
    estimatedProfit: "Bénéfice estimé",
    completeSale: "Confirmer la vente",
    saleCompleted: "Vente enregistrée et stock mis à jour.",
    add: "Ajouter",
    inventoryTitle: "Inventaire",
    inventorySubtitle: "Contrôlez stock, prix, statuts et codes.",
    product: "Produit",
    category: "Catégorie",
    supplier: "Fournisseur",
    cost: "Coût",
    price: "Prix",
    stock: "Stock",
    status: "Statut",
    normal: "Normal",
    low: "Faible",
    out: "Épuisé",
    purchasesTitle: "Achats et réapprovisionnement",
    purchasesSubtitle: "Priorisez les achats selon couverture et rotation.",
    suggested: "Suggéré",
    coverage: "Couverture",
    days: "jours",
    estimatedCost: "Coût estimé",
    receivePurchase: "Recevoir le stock",
    purchaseApplied: "Réapprovisionnement appliqué au stock.",
    suppliersTitle: "Fournisseurs",
    suppliersSubtitle: "Visualisez exposition, stock et marge par fournisseur.",
    products: "Produits",
    inventoryValue: "Valeur du stock",
    averageMargin: "Marge moyenne",
    reportsTitle: "Rapports",
    reportsSubtitle: "Comparez revenus, coûts et bénéfice par période.",
    settingsTitle: "Paramètres",
    settingsSubtitle: "Préférences globales de l’entreprise et de l’application.",
    businessName: "Nom de l’entreprise",
    save: "Enregistrer",
    saved: "Modifications enregistrées.",
    appearance: "Apparence",
    theme: "Thème",
    preferences: "Langue et devise",
    signOut: "Se déconnecter",
    install: "Installer l’application",
    criticalStock: "Stock critique",
    businessSummary: "Résumé de l’activité",
    open: "Ouvrir"
  },
  de: {
    nav: {
      overview: "Start",
      pos: "Verkäufe",
      inventory: "Bestand",
      purchases: "Einkauf",
      suppliers: "Lieferanten",
      reports: "Berichte",
      settings: "Einstellungen"
    },
    more: "Mehr",
    overviewTitle: "Kontrollzentrum",
    overviewSubtitle: "Eine vollständige Sicht auf deinen Geschäftsbetrieb.",
    revenue: "Umsatz",
    inventoryCost: "Lagerkosten",
    grossProfit: "Bruttogewinn",
    margin: "Marge",
    units: "Einheiten",
    alerts: "Warnungen",
    salesFlow: "Verkaufsverlauf",
    revenueVsCost: "Umsatz vs Kosten",
    posTitle: "Kasse",
    posSubtitle: "Verkaufen, Summe berechnen und Bestand sofort reduzieren.",
    searchProducts: "Produkt suchen",
    cart: "Warenkorb",
    emptyCart: "Noch keine Produkte hinzugefügt.",
    total: "Gesamt",
    estimatedProfit: "Geschätzter Gewinn",
    completeSale: "Verkauf abschließen",
    saleCompleted: "Verkauf gespeichert und Bestand aktualisiert.",
    add: "Hinzufügen",
    inventoryTitle: "Bestand",
    inventorySubtitle: "Bestand, Preise, Status und Barcodes verwalten.",
    product: "Produkt",
    category: "Kategorie",
    supplier: "Lieferant",
    cost: "Kosten",
    price: "Preis",
    stock: "Bestand",
    status: "Status",
    normal: "Normal",
    low: "Niedrig",
    out: "Ausverkauft",
    purchasesTitle: "Einkauf und Nachschub",
    purchasesSubtitle: "Einkäufe nach Reichweite und Umschlag priorisieren.",
    suggested: "Empfohlen",
    coverage: "Reichweite",
    days: "Tage",
    estimatedCost: "Geschätzte Kosten",
    receivePurchase: "Nachschub buchen",
    purchaseApplied: "Nachschub wurde dem Bestand hinzugefügt.",
    suppliersTitle: "Lieferanten",
    suppliersSubtitle: "Bestand, Kapital und Marge pro Lieferant.",
    products: "Produkte",
    inventoryValue: "Lagerwert",
    averageMargin: "Durchschnittsmarge",
    reportsTitle: "Berichte",
    reportsSubtitle: "Umsatz, Kosten und Gewinn nach Zeitraum vergleichen.",
    settingsTitle: "Einstellungen",
    settingsSubtitle: "Globale Einstellungen für Unternehmen und App.",
    businessName: "Unternehmensname",
    save: "Speichern",
    saved: "Änderungen gespeichert.",
    appearance: "Darstellung",
    theme: "Design",
    preferences: "Sprache und Währung",
    signOut: "Abmelden",
    install: "App installieren",
    criticalStock: "Kritischer Bestand",
    businessSummary: "Geschäftsübersicht",
    open: "Öffnen"
  }
};

const modules: Array<{ id: ModuleId; icon: typeof LayoutDashboard }> = [
  { id: "overview", icon: LayoutDashboard },
  { id: "pos", icon: ShoppingCart },
  { id: "inventory", icon: Boxes },
  { id: "purchases", icon: PackagePlus },
  { id: "suppliers", icon: Truck },
  { id: "reports", icon: BarChart3 },
  { id: "settings", icon: Settings2 }
];

export function BusinessWorkspace({
  dark,
  language,
  currency,
  onLanguageChange,
  onCurrencyChange,
  onToggleTheme,
  onSignOut
}: BusinessWorkspaceProps) {
  const labels = copy[language];
  const locale = localeByLanguage[language];

  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [currencyRate, setCurrencyRate] = useState(1);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [posQuery, setPosQuery] = useState("");
  const [businessName, setBusinessName] = useState("Global Stock Demo");
  const [notice, setNotice] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem("global-stock-demo-products-v1");
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts) as Product[];
        if (Array.isArray(parsed) && parsed.length) setProducts(parsed);
      }
      const savedName = localStorage.getItem("global-stock-business-name");
      if (savedName) setBusinessName(savedName);
    } catch {
      // Ignore invalid local demo data.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("global-stock-demo-products-v1", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    let cancelled = false;

    async function loadRate() {
      try {
        const response = await fetch(
          `/api/fx?target=${encodeURIComponent(currency)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as { rate?: number };
        const nextRate = Number(payload.rate);
        if (!cancelled && Number.isFinite(nextRate) && nextRate > 0) {
          setCurrencyRate(nextRate);
        }
      } catch {
        if (!cancelled && currency === "ARS") setCurrencyRate(1);
      }
    }

    void loadRate();
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const localizedTrend = useMemo(
    () =>
      demoTrend.map((point, index) => ({
        ...point,
        label: dayLabels[language][index] ?? point.label,
        revenue: point.revenue * currencyRate,
        cost: point.cost * currencyRate,
        profit: point.profit * currencyRate
      })),
    [language, currencyRate]
  );

  const snapshot: BusinessSnapshot = useMemo(
    () => ({
      products,
      trend: demoTrend,
      currency,
      currencyRate,
      locale
    }),
    [products, currency, currencyRate, locale]
  );

  const metrics = useMemo(() => calculateMetrics(snapshot), [snapshot]);

  const money = (value: number) =>
    formatMoney(value * currencyRate, currency, locale);

  const filteredPosProducts = useMemo(() => {
    const query = posQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.category, product.barcode]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [posQuery, products]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const product = products.find((item) => item.id === id);
          return product ? { product, quantity } : null;
        })
        .filter(Boolean) as Array<{ product: Product; quantity: number }>,
    [cart, products]
  );

  const cartTotal = cartLines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );
  const cartCost = cartLines.reduce(
    (sum, line) => sum + line.product.cost * line.quantity,
    0
  );

  const supplierStats = useMemo(() => {
    const groups = new Map<
      string,
      { supplier: string; products: number; units: number; value: number; margins: number[] }
    >();

    for (const product of products) {
      const current = groups.get(product.supplier) ?? {
        supplier: product.supplier,
        products: 0,
        units: 0,
        value: 0,
        margins: []
      };

      current.products += 1;
      current.units += product.stock;
      current.value += product.stock * product.cost;
      current.margins.push(
        product.price > 0
          ? ((product.price - product.cost) / product.price) * 100
          : 0
      );
      groups.set(product.supplier, current);
    }

    return [...groups.values()].map((group) => ({
      ...group,
      averageMargin:
        group.margins.reduce((sum, value) => sum + value, 0) /
        Math.max(group.margins.length, 1)
    }));
  }, [products]);

  const restock = useMemo(
    () => rankRestockNeeds(products).filter((item) => item.suggestedUnits > 0),
    [products]
  );

  function setQuantity(id: string, quantity: number) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    const safe = Math.max(0, Math.min(quantity, product.stock));

    setCart((current) => {
      const next = { ...current };
      if (safe <= 0) delete next[id];
      else next[id] = safe;
      return next;
    });
  }

  function completeSale() {
    if (!cartLines.length) return;

    setProducts((current) =>
      current.map((product) => {
        const quantity = cart[product.id] ?? 0;
        if (!quantity) return product;
        return {
          ...product,
          stock: Math.max(0, product.stock - quantity),
          sold30d: product.sold30d + quantity
        };
      })
    );

    setCart({});
    setNotice(labels.saleCompleted);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function updateStock(id: string, nextStock: number) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, stock: Math.max(0, Math.round(nextStock)) }
          : product
      )
    );
  }

  function integrateScannedProduct(scanned: Product) {
    setProducts((current) => {
      const exists = current.some((item) => item.barcode === scanned.barcode);
      if (!exists) return [scanned, ...current];
      return current.map((item) =>
        item.barcode === scanned.barcode ? { ...item, ...scanned } : item
      );
    });
  }

  function receiveRestock(id: string, units: number) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, stock: product.stock + units }
          : product
      )
    );
    setNotice(labels.purchaseApplied);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function saveBusinessName() {
    localStorage.setItem("global-stock-business-name", businessName.trim());
    setNotice(labels.saved);
    window.setTimeout(() => setNotice(""), 2200);
  }

  return (
    <main className="min-h-screen bg-[var(--apex-bg)] text-[var(--apex-text)] lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-[var(--apex-border)] bg-[var(--apex-surface)] px-4 py-5 lg:flex lg:flex-col">
        <Logo withWordmark />

        <nav className="mt-8 space-y-1.5">
          {modules.map(({ id, icon: Icon }) => {
            const active = activeModule === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveModule(id)}
                className={
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition " +
                  (active
                    ? "bg-[#8F0000] text-white shadow-[0_10px_30px_rgba(143,0,0,.2)]"
                    : "text-[var(--apex-muted)] hover:bg-[var(--apex-surface-strong)] hover:text-[var(--apex-text)]")
                }
              >
                <Icon size={17} />
                {labels.nav[id]}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--apex-muted)]">
              {labels.businessSummary}
            </p>
            <p className="mt-2 truncate text-sm font-semibold">{businessName}</p>
            <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
              {metrics.inventoryUnits} {labels.units}
            </p>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--apex-border)] px-3 py-3 text-sm font-semibold text-[var(--apex-muted)]"
          >
            <LogOut size={17} />
            {labels.signOut}
          </button>
        </div>
      </aside>

      <section className="min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-40 border-b border-[var(--apex-border)] bg-[var(--apex-surface)]/95 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Logo withWordmark />
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
                Global Stock
              </p>
              <h1 className="truncate text-lg font-semibold tracking-[-0.03em]">
                {labels.nav[activeModule]}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:block">
                <InstallAppButton language={language} />
              </div>
              <div className="hidden sm:block">
                <GlobalPreferences
                  language={language}
                  currency={currency}
                  onLanguageChange={onLanguageChange}
                  onCurrencyChange={onCurrencyChange}
                />
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]"
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] lg:hidden"
              >
                <Menu size={17} />
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeModule + language}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
          >
            {activeModule === "overview" && (
              <OverviewModule
                labels={labels}
                metrics={metrics}
                chartData={localizedTrend}
                money={money}
                currency={currency}
                locale={locale}
                setActiveModule={setActiveModule}
              />
            )}

            {activeModule === "pos" && (
              <PosModule
                labels={labels}
                products={filteredPosProducts}
                query={posQuery}
                setQuery={setPosQuery}
                cart={cart}
                setQuantity={setQuantity}
                cartLines={cartLines}
                cartTotal={cartTotal}
                cartProfit={cartTotal - cartCost}
                money={money}
                completeSale={completeSale}
              />
            )}

            {activeModule === "inventory" && (
              <InventoryModule
                labels={labels}
                language={language}
                products={products}
                money={money}
                updateStock={updateStock}
                integrateScannedProduct={integrateScannedProduct}
              />
            )}

            {activeModule === "purchases" && (
              <PurchasesModule
                labels={labels}
                restock={restock}
                money={money}
                receiveRestock={receiveRestock}
              />
            )}

            {activeModule === "suppliers" && (
              <SuppliersModule
                labels={labels}
                stats={supplierStats}
                money={money}
              />
            )}

            {activeModule === "reports" && (
              <ReportsModule
                labels={labels}
                data={localizedTrend}
                currency={currency}
                locale={locale}
              />
            )}

            {activeModule === "settings" && (
              <SettingsModule
                labels={labels}
                language={language}
                currency={currency}
                dark={dark}
                businessName={businessName}
                setBusinessName={setBusinessName}
                onLanguageChange={onLanguageChange}
                onCurrencyChange={onCurrencyChange}
                onToggleTheme={onToggleTheme}
                onSignOut={onSignOut}
                saveBusinessName={saveBusinessName}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--apex-border)] bg-[var(--apex-surface)]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {(["overview", "pos", "inventory", "reports"] as ModuleId[]).map((id) => {
            const item = modules.find((module) => module.id === id)!;
            const Icon = item.icon;
            const active = activeModule === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveModule(id)}
                className={
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold " +
                  (active
                    ? "bg-[#8F0000]/12 text-[#8F0000]"
                    : "text-[var(--apex-muted)]")
                }
              >
                <Icon size={18} />
                <span>{labels.nav[id]}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold text-[var(--apex-muted)]"
          >
            <Menu size={18} />
            <span>{labels.more}</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end bg-black/55 p-0 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setMoreOpen(false);
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full rounded-t-[30px] border-t border-[var(--apex-border)] bg-[var(--apex-surface)] p-4 pb-[max(20px,env(safe-area-inset-bottom))]"
            >
              <div className="mb-4 flex items-center justify-between">
                <Logo withWordmark />
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-[var(--apex-border)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["purchases", "suppliers", "settings"] as ModuleId[]).map((id) => {
                  const item = modules.find((module) => module.id === id)!;
                  const Icon = item.icon;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveModule(id);
                        setMoreOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4 text-left text-sm font-semibold"
                    >
                      <Icon size={18} className="text-[#8F0000]" />
                      {labels.nav[id]}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex gap-2">
                <GlobalPreferences
                  language={language}
                  currency={currency}
                  onLanguageChange={onLanguageChange}
                  onCurrencyChange={onCurrencyChange}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-24 left-1/2 z-[110] -translate-x-1/2 rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-2 text-xs font-semibold shadow-xl lg:bottom-6"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <ApexIntelligence snapshot={snapshot} />
    </main>
  );
}

function OverviewModule({
  labels,
  metrics,
  chartData,
  money,
  currency,
  locale,
  setActiveModule
}: {
  labels: (typeof copy)[LanguageCode];
  metrics: ReturnType<typeof calculateMetrics>;
  chartData: Array<{ label: string; revenue: number; cost: number; profit: number }>;
  money: (value: number) => string;
  currency: string;
  locale: string;
  setActiveModule: (id: ModuleId) => void;
}) {
  return (
    <div className="space-y-5">
      <PageIntro title={labels.overviewTitle} subtitle={labels.overviewSubtitle} />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label={labels.revenue} value={money(metrics.revenue)} icon={<CircleDollarSign size={18} />} />
        <Kpi label={labels.inventoryCost} value={money(metrics.inventoryCost)} icon={<Boxes size={18} />} />
        <Kpi label={labels.grossProfit} value={money(metrics.grossProfit)} icon={<BarChart3 size={18} />} />
        <Kpi
          label={labels.criticalStock}
          value={String(metrics.lowStockCount + metrics.outOfStockCount)}
          detail={labels.alerts}
          icon={<PackagePlus size={18} />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <div className="apex-card p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8F0000]">
            {labels.salesFlow}
          </p>
          <div className="mt-5 h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="workspaceProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8F0000" stopOpacity={0.36} />
                    <stop offset="100%" stopColor="#8F0000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--apex-border)" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11} stroke="var(--apex-muted)" />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid var(--apex-border)",
                    background: "var(--apex-surface-strong)",
                    color: "var(--apex-text)"
                  }}
                  formatter={(value) => formatMoney(Number(value), currency, locale)}
                />
                <Area type="monotone" dataKey="profit" stroke="#8F0000" strokeWidth={2.5} fill="url(#workspaceProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-3">
          {(["pos", "inventory", "purchases"] as ModuleId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveModule(id)}
              className="apex-card flex items-center justify-between p-5 text-left"
            >
              <div>
                <p className="text-sm font-semibold">{labels.nav[id]}</p>
                <p className="mt-1 text-[11px] text-[var(--apex-muted)]">{labels.open}</p>
              </div>
              <ChevronRight size={18} className="text-[#8F0000]" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function PosModule({
  labels,
  products,
  query,
  setQuery,
  cart,
  setQuantity,
  cartLines,
  cartTotal,
  cartProfit,
  money,
  completeSale
}: {
  labels: (typeof copy)[LanguageCode];
  products: Product[];
  query: string;
  setQuery: (value: string) => void;
  cart: Record<string, number>;
  setQuantity: (id: string, quantity: number) => void;
  cartLines: Array<{ product: Product; quantity: number }>;
  cartTotal: number;
  cartProfit: number;
  money: (value: number) => string;
  completeSale: () => void;
}) {
  return (
    <div className="space-y-5">
      <PageIntro title={labels.posTitle} subtitle={labels.posSubtitle} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          <label className="relative block">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--apex-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchProducts}
              className="apex-input py-3.5 pl-11 pr-4"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="apex-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
                    <Store size={17} />
                  </span>
                  <span className="rounded-full border border-[var(--apex-border)] px-2.5 py-1 text-[10px] text-[var(--apex-muted)]">
                    {product.stock} {labels.stock}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold">{product.name}</h3>
                <p className="mt-1 text-[11px] text-[var(--apex-muted)]">{product.category}</p>
                <p className="mt-4 text-lg font-semibold">{money(product.price)}</p>
                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => setQuantity(product.id, (cart[product.id] ?? 0) + 1)}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white disabled:opacity-35"
                >
                  <Plus size={16} />
                  {labels.add}
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="apex-card h-fit p-5 xl:sticky xl:top-24">
          <h2 className="text-lg font-semibold">{labels.cart}</h2>

          {!cartLines.length ? (
            <p className="mt-4 text-sm text-[var(--apex-muted)]">{labels.emptyCart}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {cartLines.map(({ product, quantity }) => (
                <div key={product.id} className="rounded-2xl border border-[var(--apex-border)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                        {money(product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(product.id, quantity - 1)}
                        className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--apex-border)]"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(product.id, quantity + 1)}
                        className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--apex-border)]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-2 border-t border-[var(--apex-border)] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--apex-muted)]">{labels.total}</span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--apex-muted)]">{labels.estimatedProfit}</span>
              <strong>{money(cartProfit)}</strong>
            </div>
          </div>

          <button
            type="button"
            disabled={!cartLines.length}
            onClick={completeSale}
            className="mt-5 w-full rounded-2xl bg-[#8F0000] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-35"
          >
            {labels.completeSale}
          </button>
        </aside>
      </div>
    </div>
  );
}

function InventoryModule({
  labels,
  language,
  products,
  money,
  updateStock,
  integrateScannedProduct
}: {
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
  products: Product[];
  money: (value: number) => string;
  updateStock: (id: string, stock: number) => void;
  integrateScannedProduct: (product: Product) => void;
}) {
  return (
    <div className="space-y-5">
      <PageIntro title={labels.inventoryTitle} subtitle={labels.inventorySubtitle} />

      <section className="apex-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
            <thead className="border-b border-[var(--apex-border)] text-[10px] uppercase tracking-[0.12em] text-[var(--apex-muted)]">
              <tr>
                <th className="px-5 py-4">{labels.product}</th>
                <th className="px-4 py-4">{labels.category}</th>
                <th className="px-4 py-4">{labels.supplier}</th>
                <th className="px-4 py-4">{labels.cost}</th>
                <th className="px-4 py-4">{labels.price}</th>
                <th className="px-4 py-4">{labels.stock}</th>
                <th className="px-4 py-4">{labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className="border-b border-[var(--apex-border)] last:border-0">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="mt-1 text-[10px] text-[var(--apex-muted)]">{product.barcode}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--apex-muted)]">{product.category}</td>
                    <td className="px-4 py-4 text-xs text-[var(--apex-muted)]">{product.supplier}</td>
                    <td className="px-4 py-4 text-xs font-semibold">{money(product.cost)}</td>
                    <td className="px-4 py-4 text-xs font-semibold">{money(product.price)}</td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min={0}
                        value={product.stock}
                        onChange={(event) => updateStock(product.id, Number(event.target.value))}
                        className="apex-input w-20 px-3 py-2 text-xs"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          "rounded-full px-2.5 py-1 text-[10px] font-bold " +
                          (status === "normal"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : status === "low"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-red-500/10 text-red-600")
                        }
                      >
                        {status === "normal"
                          ? labels.normal
                          : status === "low"
                            ? labels.low
                            : labels.out}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <BarcodeScanner onProduct={integrateScannedProduct} language={language} />
    </div>
  );
}

function PurchasesModule({
  labels,
  restock,
  money,
  receiveRestock
}: {
  labels: (typeof copy)[LanguageCode];
  restock: ReturnType<typeof rankRestockNeeds>;
  money: (value: number) => string;
  receiveRestock: (id: string, units: number) => void;
}) {
  return (
    <div className="space-y-5">
      <PageIntro title={labels.purchasesTitle} subtitle={labels.purchasesSubtitle} />

      <div className="grid gap-3">
        {restock.map(({ product, daysCover, suggestedUnits }) => (
          <article key={product.id} className="apex-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">{product.name}</h3>
                <p className="mt-1 text-[11px] text-[var(--apex-muted)]">{product.supplier}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:min-w-[430px]">
                <MiniStat label={labels.suggested} value={String(suggestedUnits)} />
                <MiniStat label={labels.coverage} value={`${daysCover.toFixed(1)} ${labels.days}`} />
                <MiniStat label={labels.estimatedCost} value={money(suggestedUnits * product.cost)} />
              </div>
              <button
                type="button"
                onClick={() => receiveRestock(product.id, suggestedUnits)}
                className="rounded-2xl bg-[#8F0000] px-4 py-3 text-xs font-semibold text-white"
              >
                {labels.receivePurchase}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SuppliersModule({
  labels,
  stats,
  money
}: {
  labels: (typeof copy)[LanguageCode];
  stats: Array<{
    supplier: string;
    products: number;
    units: number;
    value: number;
    averageMargin: number;
  }>;
  money: (value: number) => string;
}) {
  return (
    <div className="space-y-5">
      <PageIntro title={labels.suppliersTitle} subtitle={labels.suppliersSubtitle} />

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {stats.map((supplier) => (
          <article key={supplier.supplier} className="apex-card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
                <Building2 size={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{supplier.supplier}</h3>
                <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                  {supplier.products} {labels.products}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat label={labels.units} value={String(supplier.units)} />
              <MiniStat label={labels.inventoryValue} value={money(supplier.value)} />
              <MiniStat label={labels.averageMargin} value={`${supplier.averageMargin.toFixed(1)}%`} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ReportsModule({
  labels,
  data,
  currency,
  locale
}: {
  labels: (typeof copy)[LanguageCode];
  data: Array<{ label: string; revenue: number; cost: number; profit: number }>;
  currency: string;
  locale: string;
}) {
  return (
    <div className="space-y-5">
      <PageIntro title={labels.reportsTitle} subtitle={labels.reportsSubtitle} />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="apex-card p-5 sm:p-6">
          <h3 className="text-sm font-semibold">{labels.salesFlow}</h3>
          <div className="mt-5 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid stroke="var(--apex-border)" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} stroke="var(--apex-muted)" fontSize={11} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid var(--apex-border)",
                    background: "var(--apex-surface-strong)",
                    color: "var(--apex-text)"
                  }}
                  formatter={(value) => formatMoney(Number(value), currency, locale)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8F0000" fill="#8F0000" fillOpacity={0.16} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="apex-card p-5 sm:p-6">
          <h3 className="text-sm font-semibold">{labels.revenueVsCost}</h3>
          <div className="mt-5 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid stroke="var(--apex-border)" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} stroke="var(--apex-muted)" fontSize={11} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid var(--apex-border)",
                    background: "var(--apex-surface-strong)",
                    color: "var(--apex-text)"
                  }}
                  formatter={(value) => formatMoney(Number(value), currency, locale)}
                />
                <Bar dataKey="revenue" fill="#8F0000" radius={[8, 8, 3, 3]} />
                <Bar dataKey="cost" fill="#6B6B70" radius={[8, 8, 3, 3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsModule({
  labels,
  language,
  currency,
  dark,
  businessName,
  setBusinessName,
  onLanguageChange,
  onCurrencyChange,
  onToggleTheme,
  onSignOut,
  saveBusinessName
}: {
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
  currency: string;
  dark: boolean;
  businessName: string;
  setBusinessName: (value: string) => void;
  onLanguageChange: (language: LanguageCode) => void;
  onCurrencyChange: (currency: string) => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
  saveBusinessName: () => void;
}) {
  return (
    <div className="space-y-5">
      <PageIntro title={labels.settingsTitle} subtitle={labels.settingsSubtitle} />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="apex-card p-5">
          <h3 className="text-sm font-semibold">{labels.businessName}</h3>
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            className="apex-input mt-4 px-4 py-3"
          />
          <button
            type="button"
            onClick={saveBusinessName}
            className="mt-3 rounded-2xl bg-[#8F0000] px-4 py-3 text-sm font-semibold text-white"
          >
            {labels.save}
          </button>
        </section>

        <section className="apex-card p-5">
          <h3 className="text-sm font-semibold">{labels.preferences}</h3>
          <div className="mt-4">
            <GlobalPreferences
              language={language}
              currency={currency}
              onLanguageChange={onLanguageChange}
              onCurrencyChange={onCurrencyChange}
            />
          </div>
        </section>

        <section className="apex-card p-5">
          <h3 className="text-sm font-semibold">{labels.appearance}</h3>
          <button
            type="button"
            onClick={onToggleTheme}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3 text-sm font-semibold"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {labels.theme}
          </button>
        </section>

        <section className="apex-card p-5">
          <h3 className="text-sm font-semibold">{labels.install}</h3>
          <div className="mt-4">
            <InstallAppButton language={language} />
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--apex-border)] px-4 py-3 text-sm font-semibold text-[var(--apex-muted)]"
          >
            <LogOut size={16} />
            {labels.signOut}
          </button>
        </section>
      </div>
    </div>
  );
}

function PageIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
        Global Stock
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--apex-muted)]">
        {subtitle}
      </p>
    </section>
  );
}

function Kpi({
  label,
  value,
  detail,
  icon
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="apex-card p-5">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
        {icon}
      </span>
      <p className="mt-4 text-xs font-semibold text-[var(--apex-muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">{value}</p>
      {detail && <p className="mt-1 text-[11px] text-[var(--apex-muted)]">{detail}</p>}
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">{label}</p>
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
