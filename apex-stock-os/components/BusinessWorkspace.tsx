"use client";

import { ApexSelect } from "@/components/ui/ApexSelect";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Activity as ActivityIcon,
  BarChart3,
  Landmark,
  UserRound,
  ShieldCheck,
  Boxes,
  Building2,
  ClipboardList,
  LogOut,
  ReceiptText,
  ShoppingBag,
  Menu,
  Minus,
  Moon,
  PackagePlus,
  Plus,
  ScanLine,
  Search,
  Settings2,
  ShoppingCart,
  Wallet,
  Store,
  Sun,
  Truck,
  X,
  PanelLeft,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateMetrics,
  formatMoney,
  getStockStatus,
  rankRestockNeeds
} from "@/lib/analytics";
import { canAccessModule } from "@/lib/access-control";
import {
  ensureCloudBusiness,
  flushOfflineBusinessOperations,
  loadCloudWorkspace,
  loadCanonicalProducts,
  mergeCanonicalProducts,
  addProductStockToCloud,
  mirrorProductsToCloud,
  recordPosSale,
  recordStockAdjustment,
  type CloudWorkspaceState,
  type PosPayment,
  saveCloudWorkspace,
  updateCloudBusiness
} from "@/lib/cloud-workspace";
import { businessStorageKey } from "@/lib/business-storage";
import { WORKSPACE_ACCENT_KEY, isWorkspaceAccent, workspaceAccentVars, type WorkspaceAccent } from "@/lib/workspace-accent";
import "./workspace-accent.css";
import type {
  BusinessSnapshot,
  Product,
  ProductInventoryDetails,
  TrendPoint
} from "@/lib/types";
import { demoProducts, demoTrend } from "@/lib/demo-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";

import { AnimatedHomeDashboard } from "./AnimatedHomeDashboard";
import { ApexIntelligence } from "./ApexIntelligence";
import { NewsletterPreferences } from "./NewsletterPreferences";
import { BusinessTypePicker } from "./BusinessTypePicker";
import { StockQuantityCell } from "./StockQuantityCell";
import { InventoryControlCenter } from "./InventoryControlCenter";
import { CashRegisterCenter } from "./CashRegisterCenter";
import { CashDeviceScanner } from "./CashDeviceScanner";
import { BarcodeScanner, type BarcodeScannerHandle } from "./BarcodeScanner";
import { BarcodeLabelStudio } from "./BarcodeLabelStudio";
import {
  GlobalPreferences,
  type LanguageCode
} from "./GlobalPreferences";
import { InstallAppButton } from "./InstallAppButton";
import { Logo } from "./Logo";
import { FxCenter } from "./FxCenter";
import type {
  ConnectedCatalogPayload,
  ConnectedStore
} from "./ConnectedCommerceHub";

function LazyModuleFallback() {
  return (
    <section className="apex-card min-h-56 animate-pulse p-5">
      <div className="h-4 w-32 rounded-full bg-[var(--apex-border)]" />
      <div className="mt-5 h-24 rounded-2xl bg-[var(--apex-border)]/60" />
    </section>
  );
}

const ConnectedCommerceHub = dynamic(
  () =>
    import("./ConnectedCommerceHub").then(
      (module) => module.ConnectedCommerceHub
    ),
  { ssr: false, loading: LazyModuleFallback }
);

const FiscalDocumentsCenter = dynamic(
  () => import("./FiscalDocumentsCenter").then(module => module.FiscalDocumentsCenter),
  { ssr: false, loading: LazyModuleFallback }
);

const WorkspaceAccountPanel = dynamic(
  () => import("./WorkspaceAccountPanel").then(module => module.WorkspaceAccountPanel),
  { ssr: false, loading: LazyModuleFallback }
);

const PremiumCharts = dynamic(
  () =>
    import("./PremiumCharts").then(
      (module) => module.PremiumCharts
    ),
  { ssr: false, loading: LazyModuleFallback }
);

const SupplierDirectory = dynamic(
  () =>
    import("./SupplierDirectory").then(
      (module) => module.SupplierDirectory
    ),
  { ssr: false, loading: LazyModuleFallback }
);

const SmartDocumentInbox = dynamic(
  () =>
    import("./SmartDocumentInbox").then(
      (module) => module.SmartDocumentInbox
    ),
  { ssr: false, loading: LazyModuleFallback }
);

const NotesHub = dynamic(
  () =>
    import("./NotesHub").then(
      (module) => module.NotesHub
    ),
  { ssr: false, loading: LazyModuleFallback }
);

const OperationsCenter = dynamic(
  () =>
    import("./OperationsCenter").then(
      (module) => module.OperationsCenter
    ),
  { ssr: false, loading: LazyModuleFallback }
);

const OnlineConnectionRequests = dynamic(
  () => import("./OnlineConnectionRequests").then(mod => mod.OnlineConnectionRequests),
  { ssr: false }
);

const BusinessSuite = dynamic(
  () =>
    import("./BusinessSuite").then(
      (module) => module.BusinessSuite
    ),
  { ssr: false, loading: LazyModuleFallback }
);

type ModuleId =
  | "overview"
  | "pos"
  | "cash"
  | "online"
  | "inventory"
  | "charts"
  | "purchases"
  | "suppliers"
  | "activities"
  | "documents"
  | "notes"
  | "operations"
  | "arca"
  | "account"
  | "settings";

type BusinessWorkspaceProps = {
  dark: boolean;
  language: LanguageCode;
  currency: string;
  onLanguageChange: (language: LanguageCode) => void;
  onCurrencyChange: (currency: string) => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
  demoMode?: boolean;
};

const welcomeLabels: Record<LanguageCode, { greeting: string; role: string; demo: string }> = {
  es: { greeting: "Bienvenido", role: "Cargo", demo: "Cuenta de demostración" },
  en: { greeting: "Welcome", role: "Role", demo: "Demo account" },
  pt: { greeting: "Bem-vindo", role: "Cargo", demo: "Conta de demonstração" },
  fr: { greeting: "Bienvenue", role: "Rôle", demo: "Compte de démonstration" },
  de: { greeting: "Willkommen", role: "Rolle", demo: "Demokonto" }
};
const workspaceRoleLabels: Record<LanguageCode, Record<string, string>> = {
  es: { owner:"Dueño", admin:"Administrador", manager:"Gerente", cashier:"Cajero", warehouse:"Almacén", sales:"Ventas", accountant:"Contador", viewer:"Solo lectura" },
  en: { owner:"Owner", admin:"Administrator", manager:"Manager", cashier:"Cashier", warehouse:"Warehouse", sales:"Sales", accountant:"Accountant", viewer:"Read only" },
  pt: { owner:"Proprietário", admin:"Administrador", manager:"Gerente", cashier:"Caixa", warehouse:"Estoque", sales:"Vendas", accountant:"Contador", viewer:"Somente leitura" },
  fr: { owner:"Propriétaire", admin:"Administrateur", manager:"Responsable", cashier:"Caissier", warehouse:"Stock", sales:"Ventes", accountant:"Comptable", viewer:"Lecture seule" },
  de: { owner:"Inhaber", admin:"Administrator", manager:"Manager", cashier:"Kasse", warehouse:"Lager", sales:"Verkauf", accountant:"Buchhaltung", viewer:"Nur Lesen" }
};

type FxMarket = "oficial" | "blue" | "mep" | "ccl" | "tarjeta";

type FxHistoryEntry = {
  date: string;
  currency: string;
  market: FxMarket;
  rate: number;
};
type BusinessType =
  | "retail"
  | "restaurant"
  | "services"
  | "wholesale"
  | "ecommerce"
  | "industry"
  | "advisory"
  | "other";

type RecipeComponent = {
  product_key: string;
  component_key: string;
  quantity: number;
  wastage_pct: number;
};

type PosPromotion = {
  id: string;
  name: string;
  kind: string;
  value: number | null;
  starts_at: string | null;
  ends_at: string | null;
};

type PosVariant = {
  id: string;
  productKey: string;
  name: string;
  sku: string;
  barcode: string;
  attributes: Record<string, string>;
  price: number | null;
  cost: number | null;
  stock: number;
  stockByLocation: Record<string, number>;
};

type PosLocation = {
  id: string;
  name: string;
  kind: string;
};

type PendingConnectedWrite = {
  externalId: string;
  patch: Record<string, unknown>;
  updatedAt: string;
};

const CONNECTED_WRITE_QUEUE_KEY =
  "global-stock-connected-write-queue-v1";
const BUSINESS_WORKSPACE_CACHE_KEY =
  "global-stock-workspace-cache-v1";

function connectedWriteQueueKey(businessId: string) {
  return `${CONNECTED_WRITE_QUEUE_KEY}:business:${businessId}`;
}

function readConnectedWriteQueue(
  businessId: string
): PendingConnectedWrite[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(
      connectedWriteQueueKey(businessId)
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingConnectedWrite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConnectedWriteQueue(
  businessId: string,
  queue: PendingConnectedWrite[]
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    connectedWriteQueueKey(businessId),
    JSON.stringify(queue.slice(-500))
  );
}

function queueConnectedWrite(
  businessId: string,
  externalId: string,
  patch: Record<string, unknown>
) {
  const queue = readConnectedWriteQueue(businessId);
  const index = queue.findIndex(
    (item) => item.externalId === externalId
  );

  const next: PendingConnectedWrite = {
    externalId,
    patch:
      index >= 0
        ? { ...queue[index].patch, ...patch }
        : patch,
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) queue[index] = next;
  else queue.push(next);

  saveConnectedWriteQueue(businessId, queue);
}

type ActivityKind =
  | "sale"
  | "restock"
  | "scan"
  | "note"
  | "settings";

type ActivityRecord = {
  id: string;
  kind: ActivityKind;
  createdAt: string;
  product?: string;
  units?: number;
  total?: number;
};

type BusinessNote = {
  id: string;
  text: string;
  date: string;
  done: boolean;
  createdAt: string;
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
    losses: string;
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
    chartsTitle: string;
    chartsSubtitle: string;
    stockByProduct: string;
    marginByProduct: string;
    stockHealth: string;
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
    activitiesTitle: string;
    activitiesSubtitle: string;
    noActivities: string;
    saleActivity: string;
    restockActivity: string;
    scanActivity: string;
    noteActivity: string;
    settingsActivity: string;
    notesTitle: string;
    notesSubtitle: string;
    addNote: string;
    notePlaceholder: string;
    noNotes: string;
    today: string;
    previousMonth: string;
    nextMonth: string;
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
    scan: string;
    scannerTitle: string;
    close: string;
    exchangeRate: string;
    liveRate: string;
    rateUnavailable: string;
    updated: string;
    rateHistory: string;
    recentActivity: string;
    todayNotes: string;
  }
> = {
  es: {
    nav: {
      overview: "Inicio",
      pos: "Ventas (Punto de venta)",
      cash: "Caja Registradora",
      online: "Tienda online",
      inventory: "Almacén",
      charts: "Gráficos",
      purchases: "Reposición",
      suppliers: "Proveedores",
      activities: "Actividad",
      documents: "Comprobantes",
      notes: "Agenda",
      operations: "Negocios / Locales",
      arca: "ARCA Facturación",
      account: "Cuenta / Cuentas",
      settings: "Configuración"
    },
    more: "Menú",
    overviewTitle: "Centro de control",
    overviewSubtitle: "Una vista completa de la operación de tu negocio.",
    revenue: "Ingresos",
    inventoryCost: "Costo de inventario",
    grossProfit: "Ganancia bruta",
    margin: "Margen",
    losses: "Pérdidas",
    units: "unidades",
    alerts: "alertas",
    salesFlow: "Flujo de ventas",
    revenueVsCost: "Ingresos vs costos",
    posTitle: "Punto de venta",
    posSubtitle: "Caja de mostrador: elegí productos, armá el carrito, registrá el cobro y descontá stock al instante.",
    searchProducts: "Buscar producto",
    cart: "Carrito",
    emptyCart: "Todavía no agregaste productos.",
    total: "Total",
    estimatedProfit: "Ganancia estimada",
    completeSale: "Confirmar venta",
    saleCompleted: "Venta registrada y stock actualizado.",
    add: "Agregar",
    inventoryTitle: "Almacén y stock",
    inventorySubtitle: "Controlá existencias, mínimos, precios, códigos y ajustes de stock desde un solo lugar.",
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
    chartsTitle: "Gráficos",
    chartsSubtitle: "Analizá ventas, costos, ganancias, pérdidas, stock y margen.",
    stockByProduct: "Stock por producto",
    marginByProduct: "Margen por producto",
    stockHealth: "Estado del stock",
    purchasesTitle: "Reposición inteligente",
    purchasesSubtitle: "Global Stock calcula qué conviene reponer, cuántas unidades y cuánto capital necesitás según cobertura y rotación.",
    suggested: "Sugerido",
    coverage: "Cobertura",
    days: "días",
    estimatedCost: "Costo estimado",
    receivePurchase: "Recibir reposición",
    purchaseApplied: "Reposición aplicada al inventario.",
    suppliersTitle: "Proveedores",
    suppliersSubtitle: "Administrá tus proveedores, contactos y condiciones, y compará cuánto stock depende de cada uno.",
    products: "Productos",
    inventoryValue: "Valor de inventario",
    averageMargin: "Margen promedio",
    activitiesTitle: "Actividad",
    activitiesSubtitle: "Historial de ventas, reposiciones, escaneos y cambios.",
    noActivities: "Todavía no hay movimientos registrados.",
    saleActivity: "Venta registrada",
    restockActivity: "Reposición recibida",
    scanActivity: "Producto escaneado",
    noteActivity: "Nota creada",
    settingsActivity: "Configuración actualizada",
    notesTitle: "Notas y calendario",
    notesSubtitle: "Organizá tareas, compras pendientes y recordatorios por fecha.",
    addNote: "Agregar nota",
    notePlaceholder: "Ej.: mañana comprar 20 anzuelos...",
    noNotes: "No hay notas para esta fecha.",
    today: "Hoy",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
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
    open: "Abrir",
    scan: "Escanear",
    scannerTitle: "Escáner rápido",
    close: "Cerrar",
    exchangeRate: "Tipo de cambio",
    liveRate: "Cotización actual",
    rateUnavailable: "Cotización en vivo no disponible",
    updated: "Actualizado",
    rateHistory: "Registro diario",
    recentActivity: "Actividad reciente",
    todayNotes: "Notas de hoy"
  },
  en: {
    nav: {
      overview: "Home",
      pos: "Point of sale",
      cash: "Cash register",
      online: "Online store",
      inventory: "Warehouse",
      charts: "Charts",
      purchases: "Restocking",
      suppliers: "Vendors",
      activities: "Activity",
      documents: "Documents",
      notes: "Agenda",
      operations: "Businesses / Locations",
      arca: "ARCA Invoicing",
      account: "Account / Accounts",
      settings: "Settings"
    },
    more: "Menu",
    overviewTitle: "Control center",
    overviewSubtitle: "A complete view of your business operation.",
    revenue: "Revenue",
    inventoryCost: "Inventory cost",
    grossProfit: "Gross profit",
    margin: "Margin",
    losses: "Losses",
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
    inventoryTitle: "Warehouse & stock",
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
    chartsTitle: "Charts",
    chartsSubtitle: "Analyze sales, costs, profit, losses, stock and margins.",
    stockByProduct: "Stock by product",
    marginByProduct: "Margin by product",
    stockHealth: "Stock health",
    purchasesTitle: "Purchasing & replenishment",
    purchasesSubtitle: "Prioritize purchases by coverage and rotation.",
    suggested: "Suggested",
    coverage: "Coverage",
    days: "days",
    estimatedCost: "Estimated cost",
    receivePurchase: "Receive restock",
    purchaseApplied: "Restock applied to inventory.",
    suppliersTitle: "Vendors",
    suppliersSubtitle: "Compare who supplies your operation, stock exposure and the margin produced by each vendor.",
    products: "Products",
    inventoryValue: "Inventory value",
    averageMargin: "Average margin",
    activitiesTitle: "Activity",
    activitiesSubtitle: "History of sales, restocks, scans and changes.",
    noActivities: "No activity recorded yet.",
    saleActivity: "Sale recorded",
    restockActivity: "Restock received",
    scanActivity: "Product scanned",
    noteActivity: "Note created",
    settingsActivity: "Settings updated",
    notesTitle: "Notes & calendar",
    notesSubtitle: "Organize tasks, pending purchases and reminders by date.",
    addNote: "Add note",
    notePlaceholder: "Example: buy 20 hooks tomorrow...",
    noNotes: "No notes for this date.",
    today: "Today",
    previousMonth: "Previous month",
    nextMonth: "Next month",
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
    open: "Open",
    scan: "Scan",
    scannerTitle: "Quick scanner",
    close: "Close",
    exchangeRate: "Exchange rate",
    liveRate: "Current quote",
    rateUnavailable: "Live exchange rate unavailable",
    updated: "Updated",
    rateHistory: "Daily rate history",
    recentActivity: "Recent activity",
    todayNotes: "Today's notes"
  },
  pt: {
    nav: {
      overview: "Início",
      pos: "Ponto de venda",
      cash: "Caixa",
      online: "Loja online",
      inventory: "Armazém",
      charts: "Gráficos",
      purchases: "Reposição",
      suppliers: "Abastecedores",
      activities: "Atividade",
      documents: "Comprovantes",
      notes: "Agenda",
      operations: "Negócios / Locais",
      arca: "ARCA Faturamento",
      account: "Conta / Contas",
      settings: "Configurações"
    },
    more: "Menu",
    overviewTitle: "Centro de controle",
    overviewSubtitle: "Uma visão completa da operação do seu negócio.",
    revenue: "Receita",
    inventoryCost: "Custo do estoque",
    grossProfit: "Lucro bruto",
    margin: "Margem",
    losses: "Perdas",
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
    inventoryTitle: "Armazém e estoque",
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
    chartsTitle: "Gráficos",
    chartsSubtitle: "Analise vendas, custos, lucros, perdas, estoque e margens.",
    stockByProduct: "Estoque por produto",
    marginByProduct: "Margem por produto",
    stockHealth: "Estado do estoque",
    purchasesTitle: "Reposição inteligente",
    purchasesSubtitle: "Priorize compras por cobertura e rotação.",
    suggested: "Sugerido",
    coverage: "Cobertura",
    days: "dias",
    estimatedCost: "Custo estimado",
    receivePurchase: "Receber reposição",
    purchaseApplied: "Reposição aplicada ao estoque.",
    suppliersTitle: "Abastecedores",
    suppliersSubtitle: "Compare quem abastece a operação, o estoque associado e a margem gerada por cada abastecedor.",
    products: "Produtos",
    inventoryValue: "Valor do estoque",
    averageMargin: "Margem média",
    activitiesTitle: "Atividade",
    activitiesSubtitle: "Histórico de vendas, reposições, leituras e mudanças.",
    noActivities: "Ainda não há movimentações registradas.",
    saleActivity: "Venda registrada",
    restockActivity: "Reposição recebida",
    scanActivity: "Produto escaneado",
    noteActivity: "Nota criada",
    settingsActivity: "Configurações atualizadas",
    notesTitle: "Notas e calendário",
    notesSubtitle: "Organize tarefas, compras pendentes e lembretes por data.",
    addNote: "Adicionar nota",
    notePlaceholder: "Ex.: amanhã comprar 20 anzóis...",
    noNotes: "Não há notas para esta data.",
    today: "Hoje",
    previousMonth: "Mês anterior",
    nextMonth: "Próximo mês",
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
    open: "Abrir",
    scan: "Escanear",
    scannerTitle: "Scanner rápido",
    close: "Fechar",
    exchangeRate: "Taxa de câmbio",
    liveRate: "Cotação atual",
    rateUnavailable: "Cotação ao vivo indisponível",
    updated: "Atualizado",
    rateHistory: "Histórico diário",
    recentActivity: "Atividade recente",
    todayNotes: "Notas de hoje"
  },
  fr: {
    nav: {
      overview: "Accueil",
      pos: "Point de vente",
      cash: "Caisse",
      online: "Boutique en ligne",
      inventory: "Entrepôt",
      charts: "Graphiques",
      purchases: "Réassort",
      suppliers: "Approvisionneurs",
      activities: "Activité",
      documents: "Documents",
      notes: "Agenda",
      operations: "Entreprises / Sites",
      arca: "Facturation ARCA",
      account: "Compte / Comptes",
      settings: "Paramètres"
    },
    more: "Menu",
    overviewTitle: "Centre de contrôle",
    overviewSubtitle: "Une vue complète de l’activité de votre entreprise.",
    revenue: "Revenus",
    inventoryCost: "Coût du stock",
    grossProfit: "Bénéfice brut",
    margin: "Marge",
    losses: "Pertes",
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
    inventoryTitle: "Entrepôt et stock",
    inventorySubtitle: "Contrôlez quantités, minimums, prix, codes et ajustements de stock au même endroit.",
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
    chartsTitle: "Graphiques",
    chartsSubtitle: "Analysez ventes, coûts, bénéfices, pertes, stock et marges.",
    stockByProduct: "Stock par produit",
    marginByProduct: "Marge par produit",
    stockHealth: "État du stock",
    purchasesTitle: "Réassort intelligent",
    purchasesSubtitle: "Global Stock estime quoi réapprovisionner, en quelle quantité et avec quel budget selon la couverture et la rotation.",
    suggested: "Suggéré",
    coverage: "Couverture",
    days: "jours",
    estimatedCost: "Coût estimé",
    receivePurchase: "Recevoir le stock",
    purchaseApplied: "Réapprovisionnement appliqué au stock.",
    suppliersTitle: "Approvisionneurs",
    suppliersSubtitle: "Comparez les fournisseurs, le stock associé et la marge générée par leurs produits.",
    products: "Produits",
    inventoryValue: "Valeur du stock",
    averageMargin: "Marge moyenne",
    activitiesTitle: "Activité",
    activitiesSubtitle: "Historique des ventes, réapprovisionnements et scans.",
    noActivities: "Aucun mouvement enregistré.",
    saleActivity: "Vente enregistrée",
    restockActivity: "Réapprovisionnement reçu",
    scanActivity: "Produit scanné",
    noteActivity: "Note créée",
    settingsActivity: "Paramètres mis à jour",
    notesTitle: "Notes et calendrier",
    notesSubtitle: "Organisez tâches, achats en attente et rappels par date.",
    addNote: "Ajouter une note",
    notePlaceholder: "Ex. : acheter 20 hameçons demain...",
    noNotes: "Aucune note pour cette date.",
    today: "Aujourd’hui",
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
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
    open: "Ouvrir",
    scan: "Scanner",
    scannerTitle: "Scanner rapide",
    close: "Fermer",
    exchangeRate: "Taux de change",
    liveRate: "Cours actuel",
    rateUnavailable: "Cours en direct indisponible",
    updated: "Mis à jour",
    rateHistory: "Historique quotidien",
    recentActivity: "Activité récente",
    todayNotes: "Notes du jour"
  },
  de: {
    nav: {
      overview: "Start",
      pos: "Kasse",
      cash: "Kassenbereich",
      online: "Onlineshop",
      inventory: "Lager",
      charts: "Diagramme",
      purchases: "Nachbestellung",
      suppliers: "Bezugsquellen",
      activities: "Aktivität",
      documents: "Belege",
      notes: "Agenda",
      operations: "Betriebe / Standorte",
      arca: "ARCA Rechnungen",
      account: "Konto / Konten",
      settings: "Einstellungen"
    },
    more: "Menü",
    overviewTitle: "Kontrollzentrum",
    overviewSubtitle: "Eine vollständige Sicht auf deinen Geschäftsbetrieb.",
    revenue: "Umsatz",
    inventoryCost: "Lagerkosten",
    grossProfit: "Bruttogewinn",
    margin: "Marge",
    losses: "Verluste",
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
    inventoryTitle: "Lager und Bestand",
    inventorySubtitle: "Bestände, Mindestmengen, Preise, Barcodes und Lagerkorrekturen zentral verwalten.",
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
    chartsTitle: "Diagramme",
    chartsSubtitle: "Verkäufe, Kosten, Gewinn, Verluste, Bestand und Margen analysieren.",
    stockByProduct: "Bestand pro Produkt",
    marginByProduct: "Marge pro Produkt",
    stockHealth: "Bestandsstatus",
    purchasesTitle: "Intelligente Nachbestellung",
    purchasesSubtitle: "Global Stock ermittelt Nachbestellbedarf, Mengen und Budget aus Reichweite und Umschlag.",
    suggested: "Empfohlen",
    coverage: "Reichweite",
    days: "Tage",
    estimatedCost: "Geschätzte Kosten",
    receivePurchase: "Nachschub buchen",
    purchaseApplied: "Nachschub wurde dem Bestand hinzugefügt.",
    suppliersTitle: "Bezugsquellen",
    suppliersSubtitle: "Vergleiche Bezugsquellen, abhängigen Bestand und die durchschnittliche Marge ihrer Produkte.",
    products: "Produkte",
    inventoryValue: "Lagerwert",
    averageMargin: "Durchschnittsmarge",
    activitiesTitle: "Aktivität",
    activitiesSubtitle: "Verlauf von Verkäufen, Nachschub, Scans und Änderungen.",
    noActivities: "Noch keine Aktivitäten gespeichert.",
    saleActivity: "Verkauf gespeichert",
    restockActivity: "Nachschub erhalten",
    scanActivity: "Produkt gescannt",
    noteActivity: "Notiz erstellt",
    settingsActivity: "Einstellungen aktualisiert",
    notesTitle: "Notizen und Kalender",
    notesSubtitle: "Aufgaben, offene Einkäufe und Erinnerungen nach Datum organisieren.",
    addNote: "Notiz hinzufügen",
    notePlaceholder: "Beispiel: morgen 20 Haken kaufen...",
    noNotes: "Keine Notizen für dieses Datum.",
    today: "Heute",
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
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
    open: "Öffnen",
    scan: "Scannen",
    scannerTitle: "Schnellscanner",
    close: "Schließen",
    exchangeRate: "Wechselkurs",
    liveRate: "Aktueller Kurs",
    rateUnavailable: "Live-Wechselkurs nicht verfügbar",
    updated: "Aktualisiert",
    rateHistory: "Täglicher Kursverlauf",
    recentActivity: "Letzte Aktivität",
    todayNotes: "Heutige Notizen"
  }
};

const workflowHelp: Record<
  LanguageCode,
  {
    pos: { title: string; steps: string[] };
    inventory: { title: string; steps: string[] };
    purchases: { title: string; steps: string[] };
    suppliers: { title: string; steps: string[] };
  }
> = {
  es: {
    pos: {
      title: "Cómo funciona el punto de venta",
      steps: [
        "Buscá o escaneá un producto",
        "Agregalo al carrito y ajustá cantidades",
        "Confirmá la venta: se registra la operación y baja el stock"
      ]
    },
    inventory: {
      title: "Qué controlás en Almacén",
      steps: [
        "Existencias y stock mínimo por producto",
        "Costo, precio, categoría y abastecedor",
        "Ajustes manuales y altas mediante código de barras"
      ]
    },
    purchases: {
      title: "Qué hace Reposición",
      steps: [
        "Detecta riesgo de quiebre de stock",
        "Sugiere unidades según ventas y cobertura",
        "Calcula el costo antes de recibir la mercadería"
      ]
    },
    suppliers: {
      title: "Qué gestionás en Proveedores",
      steps: [
        "Datos de contacto, empresa, teléfono, correo y dirección",
        "Productos y unidades asociadas a cada proveedor",
        "Capital inmovilizado y margen promedio por proveedor"
      ]
    }
  },
  en: {
    pos: { title: "How point of sale works", steps: ["Search or scan a product", "Add it to the cart and adjust quantities", "Confirm the sale to register it and reduce stock"] },
    inventory: { title: "What Warehouse controls", steps: ["On-hand and minimum stock", "Cost, price, category and vendor", "Manual adjustments and barcode intake"] },
    purchases: { title: "What Restocking does", steps: ["Detects stock-out risk", "Suggests units from sales and coverage", "Calculates cost before receiving goods"] },
    suppliers: { title: "What Vendors shows", steps: ["Products and units by vendor", "Capital tied to each vendor", "Average margin for comparison"] }
  },
  pt: {
    pos: { title: "Como funciona o ponto de venda", steps: ["Busque ou escaneie um produto", "Adicione ao carrinho e ajuste quantidades", "Confirme a venda para registrar e baixar o estoque"] },
    inventory: { title: "O que o Armazém controla", steps: ["Estoque atual e mínimo", "Custo, preço, categoria e abastecedor", "Ajustes e entrada por código de barras"] },
    purchases: { title: "O que a Reposição faz", steps: ["Detecta risco de ruptura", "Sugere unidades por vendas e cobertura", "Calcula o custo antes do recebimento"] },
    suppliers: { title: "O que Abastecedores mostra", steps: ["Produtos e unidades por fornecedor", "Capital por abastecedor", "Margem média para comparação"] }
  },
  fr: {
    pos: { title: "Fonctionnement du point de vente", steps: ["Recherchez ou scannez un produit", "Ajoutez-le au panier et ajustez la quantité", "Validez la vente pour enregistrer et déduire le stock"] },
    inventory: { title: "Ce que contrôle l’Entrepôt", steps: ["Stock disponible et minimum", "Coût, prix, catégorie et approvisionneur", "Ajustements et entrée par code-barres"] },
    purchases: { title: "Fonction du Réassort", steps: ["Détecte le risque de rupture", "Suggère les quantités selon ventes et couverture", "Calcule le coût avant réception"] },
    suppliers: { title: "Vue Approvisionneurs", steps: ["Produits et unités par fournisseur", "Capital lié à chaque fournisseur", "Marge moyenne de comparaison"] }
  },
  de: {
    pos: { title: "So funktioniert die Kasse", steps: ["Produkt suchen oder scannen", "In den Warenkorb legen und Menge anpassen", "Verkauf bestätigen: Vorgang speichern und Bestand reduzieren"] },
    inventory: { title: "Was das Lager steuert", steps: ["Bestand und Mindestbestand", "Kosten, Preis, Kategorie und Bezugsquelle", "Manuelle Anpassungen und Barcode-Zugang"] },
    purchases: { title: "Was Nachbestellung macht", steps: ["Erkennt Bestandsrisiken", "Schlägt Mengen aus Verkauf und Reichweite vor", "Berechnet Kosten vor Wareneingang"] },
    suppliers: { title: "Was Bezugsquellen zeigt", steps: ["Produkte und Einheiten je Lieferant", "Gebundenes Kapital je Quelle", "Durchschnittsmarge zum Vergleich"] }
  }
};

const modules: Array<{ id: ModuleId; icon: typeof Store }> = [
  { id: "overview", icon: Store },
  { id: "cash", icon: Wallet },
  { id: "online", icon: ShoppingBag },
  { id: "inventory", icon: Boxes },
  { id: "charts", icon: BarChart3 },
  { id: "purchases", icon: PackagePlus },
  { id: "suppliers", icon: Truck },
  { id: "activities", icon: ActivityIcon },
  { id: "documents", icon: ReceiptText },
  { id: "notes", icon: ClipboardList },
  { id: "operations", icon: Building2 },
  { id: "arca", icon: Landmark },
  { id: "settings", icon: Settings2 },
  { id: "account", icon: UserRound }
];

type NavigationGroupId = "core" | "analysis" | "organization" | "management" | "settings" | "legal";
type LegalLinkId = "terms" | "privacy" | "cookies" | "security";

const legalLinks: Array<{ id: LegalLinkId; href: string; icon: typeof Store }> = [
  { id: "terms", href: "/legal/terms", icon: ClipboardList },
  { id: "privacy", href: "/legal/privacy", icon: ShieldCheck },
  { id: "cookies", href: "/legal/cookies", icon: Settings2 },
  { id: "security", href: "/legal/security", icon: ShieldCheck }
];

const legalLinkLabels: Record<LanguageCode, Record<LegalLinkId, string>> = {
  es: { terms: "Términos y condiciones", privacy: "Política de privacidad", cookies: "Política de cookies", security: "Seguridad" },
  en: { terms: "Terms and conditions", privacy: "Privacy policy", cookies: "Cookie policy", security: "Security" },
  pt: { terms: "Termos e condições", privacy: "Política de privacidade", cookies: "Política de cookies", security: "Segurança" },
  fr: { terms: "Conditions générales", privacy: "Politique de confidentialité", cookies: "Politique de cookies", security: "Sécurité" },
  de: { terms: "Nutzungsbedingungen", privacy: "Datenschutz", cookies: "Cookie-Richtlinie", security: "Sicherheit" }
};

const navigationGroups: Array<{
  id: NavigationGroupId;
  modules: readonly ModuleId[];
}> = [
  { id: "core", modules: ["cash", "inventory", "online"] },
  { id: "analysis", modules: ["charts", "activities"] },
  { id: "organization", modules: ["suppliers", "purchases", "notes"] },
  { id: "management", modules: ["documents", "arca", "operations"] },
  { id: "settings", modules: ["settings", "account"] },
  { id: "legal", modules: [] }
];

const navigationGroupLabels: Record<LanguageCode, Record<NavigationGroupId, string>> = {
  es: { core: "Principal", analysis: "Análisis", organization: "Organización", management: "Gestión", settings: "Ajustes", legal: "Legal" },
  en: { core: "Main", analysis: "Analysis", organization: "Organization", management: "Management", settings: "Settings", legal: "Legal" },
  pt: { core: "Principal", analysis: "Análise", organization: "Organização", management: "Gestão", settings: "Ajustes", legal: "Legal" },
  fr: { core: "Principal", analysis: "Analyse", organization: "Organisation", management: "Gestion", settings: "Réglages", legal: "Légal" },
  de: { core: "Hauptbereich", analysis: "Analyse", organization: "Organisation", management: "Verwaltung", settings: "Einstellungen", legal: "Rechtliches" }
};

const mobileMenuSubtitle: Record<LanguageCode, string> = {
  es: "Herramientas secundarias, organizadas por área.",
  en: "Secondary tools, organized by area.",
  pt: "Ferramentas secundárias, organizadas por área.",
  fr: "Outils secondaires, organisés par domaine.",
  de: "Weitere Werkzeuge, nach Bereich geordnet."
};

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const VARIANT_CART_SEPARATOR = "::variant::";

function variantCartKey(productId: string, variantId?: string) {
  return variantId
    ? productId + VARIANT_CART_SEPARATOR + variantId
    : productId;
}

function parseCartKey(key: string) {
  const [productId, variantId] = key.split(VARIANT_CART_SEPARATOR);
  return {
    productId,
    variantId: variantId || null
  };
}

async function connectedApiAuthHeaders() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : null;
}

export function BusinessWorkspace({
  dark,
  language,
  currency,
  onLanguageChange,
  onCurrencyChange,
  onToggleTheme,
  onSignOut,
  demoMode = false
}: BusinessWorkspaceProps) {
  const labels = copy[language];
  const locale = localeByLanguage[language];
  const reduceMotion = useReducedMotion();

  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [routingReady, setRoutingReady] = useState(false);

  const moduleRoutes: Record<ModuleId, string> = {
    overview: "/dashboard", pos: "/sales", cash: "/cash-register", online: "/online-store",
    inventory: "/inventory", charts: "/analytics", purchases: "/restocking", suppliers: "/suppliers",
    activities: "/activity", documents: "/documents", notes: "/agenda", operations: "/businesses",
    arca: "/invoicing", account: "/account", settings: "/settings"
  };
  const routeModules = Object.fromEntries(
    Object.entries(moduleRoutes).map(([module, route]) => [route, module])
  ) as Record<string, ModuleId>;

  useEffect(() => {
    const syncFromPath = () => {
      const path = window.location.pathname.replace(/\/$/, "") || "/dashboard";
      const module = routeModules[path];
      if (module) setActiveModule(module);
    };
    syncFromPath();
    setRoutingReady(true);
    window.addEventListener("popstate", syncFromPath);
    return () => window.removeEventListener("popstate", syncFromPath);
  }, []);

  useEffect(() => {
    if (!routingReady) return;
    const nextPath = moduleRoutes[activeModule];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ module: activeModule }, "", nextPath);
    }
  }, [activeModule, routingReady]);
  const [workspaceAccent, setWorkspaceAccent] = useState<WorkspaceAccent>("red");
  useEffect(() => {
    try {
      const old = window.localStorage.getItem("global-stock-home-accent-v1");
      const saved = window.localStorage.getItem(WORKSPACE_ACCENT_KEY) ?? old;
      if (isWorkspaceAccent(saved)) setWorkspaceAccent(saved);
    } catch { /* Browsers with disabled storage use the default red. */ }
  }, []);
  function chooseWorkspaceAccent(next: WorkspaceAccent) {
    setWorkspaceAccent(next);
    try { window.localStorage.setItem(WORKSPACE_ACCENT_KEY, next); }
    catch { /* Preference still works for this session. */ }
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [recipeComponents, setRecipeComponents] =
    useState<RecipeComponent[]>([]);
  const [posPromotions, setPosPromotions] = useState<PosPromotion[]>([]);
  const [posVariants, setPosVariants] = useState<PosVariant[]>([]);
  const [posLocations, setPosLocations] = useState<PosLocation[]>([]);
  const [posLocationStock, setPosLocationStock] = useState<
    Record<string, Record<string, number>>
  >({});
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [currencyRate, setCurrencyRate] = useState(1);
  const [fxMarket, setFxMarket] = useState<FxMarket>("oficial");
  const [fxHistory, setFxHistory] = useState<FxHistoryEntry[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [posQuery, setPosQuery] = useState("");
  const [cashTab, setCashTab] = useState<"checkout" | "management">("checkout");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] =
    useState<BusinessType>("retail");
  const [businessCountry, setBusinessCountry] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [notice, setNotice] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const sidebarNavRef = useRef<HTMLElement>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<BarcodeScannerHandle>(null);
  const remoteWriteTimersRef = useRef<Map<string, number>>(new Map());
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [selectedDate, setSelectedDate] = useState(localDateKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [noteDraft, setNoteDraft] = useState("");
  const [cloudBusinessId, setCloudBusinessId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState(
    demoMode ? "owner" : "viewer"
  );
  const [memberRoleReady, setMemberRoleReady] = useState(demoMode);
  const [signedInName, setSignedInName] = useState("");
  const [cloudReady, setCloudReady] = useState(demoMode);
  const cloudHydratedRef = useRef(false);
  const lastMirroredProductsRef = useRef<Map<string,string>>(new Map());
  const productSyncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const cloudSaveTimerRef = useRef<number | null>(null);

  function scrollSidebarToProgress(
    progress: number,
    behavior: ScrollBehavior = "smooth"
  ) {
    const nav = sidebarNavRef.current;
    if (!nav) return;

    const maxScroll = Math.max(0, nav.scrollHeight - nav.clientHeight);
    const nextProgress = Math.min(1, Math.max(0, progress));

    nav.scrollTo({
      top: maxScroll * nextProgress,
      behavior
    });
  }

  function scrollSidebarByKeyboard(key: string) {
    const nav = sidebarNavRef.current;
    if (!nav) return false;

    if (key === "ArrowDown") {
      nav.scrollBy({ top: 72, behavior: "smooth" });
      return true;
    }

    if (key === "ArrowUp") {
      nav.scrollBy({ top: -72, behavior: "smooth" });
      return true;
    }

    if (key === "PageDown") {
      nav.scrollBy({
        top: Math.max(180, Math.round(nav.clientHeight * 0.72)),
        behavior: "smooth"
      });
      return true;
    }

    if (key === "PageUp") {
      nav.scrollBy({
        top: -Math.max(180, Math.round(nav.clientHeight * 0.72)),
        behavior: "smooth"
      });
      return true;
    }

    if (key === "Home") {
      scrollSidebarToProgress(0);
      return true;
    }

    if (key === "End") {
      scrollSidebarToProgress(1);
      return true;
    }

    return false;
  }

  useEffect(() => {
    if (!demoMode) return;

    const seededKey = "global-stock-demo-seeded-v1";
    if (window.localStorage.getItem(seededKey) === "1") return;

    setProducts(demoProducts.map((product) => ({ ...product })));
    setTrend(demoTrend.map((point) => ({ ...point })));
    setBusinessName("Global Stock Demo");
    setBusinessType("retail");
    setBusinessCountry("Argentina");
    setBusinessDescription(
      "Cuenta demo con productos, stock, ventas y métricas de prueba."
    );
    setActivities([
      {
        id: "demo-sale-1",
        kind: "sale",
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        product: "Reel Frontal Apex 4000",
        units: 2,
        total: 145800
      },
      {
        id: "demo-restock-1",
        kind: "restock",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        product: "Caña Carbon Pro 2.40 m",
        units: 8
      }
    ]);
    setNotes([
      {
        id: "demo-note-1",
        text: "Revisar reposición de stock crítico antes del viernes.",
        date: localDateKey(new Date()),
        done: false,
        createdAt: new Date().toISOString()
      }
    ]);

    window.localStorage.setItem(seededKey, "1");
  }, [demoMode]);

  useEffect(() => {
    const releaseMouseButtonFocus = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest("button");
      if (button instanceof HTMLButtonElement) {
        window.requestAnimationFrame(() => button.blur());
      }
    };

    document.addEventListener("pointerup", releaseMouseButtonFocus, true);
    return () =>
      document.removeEventListener(
        "pointerup",
        releaseMouseButtonFocus,
        true
      );
  }, []);


  useEffect(() => {
    if (demoMode) {
      setSignedInName("");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;
    async function loadSignedInName() {
      try {
        const { data: { user } } = await client.auth.getUser();
        if (!user || cancelled) return;
        const metadata = user.user_metadata ?? {};
        const candidates = [metadata.full_name, metadata.name, metadata.display_name];
        let name = candidates.find((item): item is string =>
          typeof item === "string" && item.trim().length > 0 && item.trim().length <= 100
        )?.trim() ?? "";
        if (!name) {
          const { data: profile } = await client
            .from("global_stock_profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .maybeSingle();
          if (typeof profile?.full_name === "string" && profile.full_name.trim().length <= 100) {
            name = profile.full_name.trim();
          }
        }
        if (!cancelled) setSignedInName(name);
      } catch {
        if (!cancelled) setSignedInName("");
      }
    }
    void loadSignedInName();
    return () => { cancelled = true; };
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) {
      setMemberRoleReady(true);
      setMemberRole("owner");
      return;
    }

    if (!cloudBusinessId) {
      setMemberRoleReady(false);
      setMemberRole("viewer");
      return;
    }

    let cancelled = false;
    setMemberRoleReady(false);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;

    async function loadRole() {
      const {
        data: { session }
      } = await client.auth.getSession();

      if (!session?.user?.id || cancelled) return;

      const { data } = await client
        .from("global_stock_members")
        .select("role")
        .eq("business_id", cloudBusinessId)
        .eq("user_id", session.user.id)
        .eq("active", true)
        .maybeSingle();

      if (!cancelled) {
        setMemberRole(String(data?.role || "viewer"));
        setMemberRoleReady(true);
      }
    }

    void loadRole();
    return () => {
      cancelled = true;
    };
  }, [cloudBusinessId, demoMode]);

  useEffect(() => {
    if (!cloudBusinessId || demoMode) {
      setRecipeComponents([]);
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;

    async function loadRecipes() {
      const { data } = await client
        .from("global_stock_recipes")
        .select("product_key,component_key,quantity,wastage_pct")
        .eq("business_id", cloudBusinessId);

      if (!cancelled) {
        setRecipeComponents(
          (data as RecipeComponent[] | null) ?? []
        );
      }
    }

    const handleRecipeChange = () => {
      void loadRecipes();
    };

    void loadRecipes();
    window.addEventListener(
      "global-stock-recipes-changed",
      handleRecipeChange
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "global-stock-recipes-changed",
        handleRecipeChange
      );
    };
  }, [cloudBusinessId, demoMode]);

  useEffect(() => {
    if (!cloudBusinessId || demoMode) {
      setPosPromotions([]);
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;

    async function loadPromotions() {
      const now = new Date().toISOString();
      const { data } = await client
        .from("global_stock_promotions")
        .select("id,name,kind,value,starts_at,ends_at")
        .eq("business_id", cloudBusinessId)
        .eq("active", true);

      if (cancelled) return;

      const active = ((data as PosPromotion[] | null) ?? []).filter(
        (promotion) =>
          (!promotion.starts_at || promotion.starts_at <= now) &&
          (!promotion.ends_at || promotion.ends_at >= now) &&
          ["percentage", "fixed"].includes(promotion.kind)
      );

      setPosPromotions(active);
    }

    const handlePromotionChange = () => {
      void loadPromotions();
    };

    void loadPromotions();
    window.addEventListener(
      "global-stock-promotions-changed",
      handlePromotionChange
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "global-stock-promotions-changed",
        handlePromotionChange
      );
    };
  }, [cloudBusinessId, demoMode]);

  useEffect(() => {
    if (!cloudBusinessId || demoMode) {
      setPosVariants([]);
      setPosLocations([]);
      setPosLocationStock({});
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;

    async function loadVariants() {
      const [productRes, variantRes, levelRes, locationRes] =
        await Promise.all([
          client
            .from("global_stock_products")
            .select("id,client_key")
            .eq("business_id", cloudBusinessId)
            .eq("active", true),
          client
            .from("global_stock_product_variants")
            .select("id,product_id,name,sku,barcode,attributes,price,cost")
            .eq("business_id", cloudBusinessId)
            .eq("active", true),
          client
            .from("global_stock_inventory_levels")
            .select("product_id,variant_id,location_id,on_hand,reserved")
            .eq("business_id", cloudBusinessId),
          client
            .from("global_stock_locations")
            .select("id,name,kind")
            .eq("business_id", cloudBusinessId)
            .eq("active", true)
            .order("created_at", { ascending: true })
        ]);

      if (cancelled) return;

      const productKeys = new Map<string, string>();
      for (const product of productRes.data ?? []) {
        productKeys.set(String(product.id), String(product.client_key));
      }

      const stockByVariant = new Map<string, number>();
      const stockByVariantLocation = new Map<
        string,
        Record<string, number>
      >();
      const baseStockByProduct: Record<
        string,
        Record<string, number>
      > = {};

      for (const level of levelRes.data ?? []) {
        const productKey = productKeys.get(String(level.product_id));
        if (!productKey) continue;

        const locationId = String(level.location_id);
        const available = Math.max(
          0,
          (Number(level.on_hand) || 0) - (Number(level.reserved) || 0)
        );

        if (level.variant_id) {
          const variantId = String(level.variant_id);
          stockByVariant.set(
            variantId,
            (stockByVariant.get(variantId) ?? 0) + available
          );

          const current = stockByVariantLocation.get(variantId) ?? {};
          current[locationId] = (current[locationId] ?? 0) + available;
          stockByVariantLocation.set(variantId, current);
        } else {
          baseStockByProduct[productKey] ??= {};
          baseStockByProduct[productKey][locationId] =
            (baseStockByProduct[productKey][locationId] ?? 0) + available;
        }
      }

      const mapped: PosVariant[] = [];
      for (const variant of variantRes.data ?? []) {
        const productKey = productKeys.get(String(variant.product_id));
        if (!productKey) continue;

        mapped.push({
          id: String(variant.id),
          productKey,
          name: String(variant.name || "Variante"),
          sku: String(variant.sku || ""),
          barcode: String(variant.barcode || ""),
          attributes:
            variant.attributes &&
            typeof variant.attributes === "object" &&
            !Array.isArray(variant.attributes)
              ? (variant.attributes as Record<string, string>)
              : {},
          price:
            variant.price === null || variant.price === undefined
              ? null
              : Number(variant.price),
          cost:
            variant.cost === null || variant.cost === undefined
              ? null
              : Number(variant.cost),
          stock: stockByVariant.get(String(variant.id)) ?? 0,
          stockByLocation:
            stockByVariantLocation.get(String(variant.id)) ?? {}
        });
      }

      setPosVariants(mapped);
      setPosLocationStock(baseStockByProduct);
      setPosLocations(
        ((locationRes.data ?? []) as Array<{
          id: string;
          name: string;
          kind: string;
        }>).map((location) => ({
          id: String(location.id),
          name: String(location.name),
          kind: String(location.kind || "store")
        }))
      );

      const totalsByProduct = new Map<string, number>();
      const variantProducts = new Set<string>();

      for (const variant of mapped) {
        variantProducts.add(variant.productKey);
        totalsByProduct.set(
          variant.productKey,
          (totalsByProduct.get(variant.productKey) ?? 0) + variant.stock
        );
      }

      if (variantProducts.size) {
        setProducts((current) =>
          current.map((product) =>
            variantProducts.has(product.id)
              ? {
                  ...product,
                  stock: totalsByProduct.get(product.id) ?? 0
                }
              : product
          )
        );
      }
    }

    const handleVariantsChanged = () => {
      void loadVariants();
    };

    void loadVariants();
    window.addEventListener(
      "global-stock-variants-changed",
      handleVariantsChanged
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "global-stock-variants-changed",
        handleVariantsChanged
      );
    };
  }, [cloudBusinessId, demoMode]);

  useEffect(() => {
    const handleImportedProducts = (event: Event) => {
      const detail = (event as CustomEvent<Product[]>).detail;
      if (!Array.isArray(detail) || !detail.length) return;

      setProducts((current) => {
        const next = [...current];

        for (const imported of detail) {
          const existingIndex = next.findIndex(
            (item) =>
              (imported.barcode &&
                item.barcode &&
                imported.barcode === item.barcode) ||
              (!imported.barcode &&
                item.name.trim().toLocaleLowerCase() ===
                  imported.name.trim().toLocaleLowerCase())
          );

          if (existingIndex >= 0) {
            next[existingIndex] = {
              ...next[existingIndex],
              ...imported,
              id: next[existingIndex].id
            };
          } else {
            next.unshift(imported);
          }
        }

        return next;
      });

      setNotice(
        language === "es"
          ? `${detail.length} productos importados.`
          : language === "pt"
            ? `${detail.length} produtos importados.`
            : language === "fr"
              ? `${detail.length} produits importés.`
              : language === "de"
                ? `${detail.length} Produkte importiert.`
                : `${detail.length} products imported.`
      );
      window.setTimeout(() => setNotice(""), 2800);
    };

    window.addEventListener(
      "global-stock-import-products",
      handleImportedProducts
    );

    return () => {
      window.removeEventListener(
        "global-stock-import-products",
        handleImportedProducts
      );
    };
  }, [language]);

  useEffect(() => {
    const handleReturnRestock = (event: Event) => {
      const detail = (
        event as CustomEvent<
          Array<{
            productKey: string;
            variantId?: string | null;
            locationId?: string | null;
            quantity: number;
          }>
        >
      ).detail;

      if (!Array.isArray(detail) || !detail.length) return;

      const quantityByProduct = new Map<string, number>();
      const quantityByVariant = new Map<string, number>();
      const quantityByProductLocation = new Map<string, number>();
      const quantityByVariantLocation = new Map<string, number>();

      for (const item of detail) {
        if (!item?.productKey) continue;

        const quantity = Math.max(0, Number(item.quantity) || 0);
        if (item.variantId) {
          quantityByVariant.set(
            item.variantId,
            (quantityByVariant.get(item.variantId) ?? 0) + quantity
          );

          if (item.locationId) {
            const key = item.variantId + "::" + item.locationId;
            quantityByVariantLocation.set(
              key,
              (quantityByVariantLocation.get(key) ?? 0) + quantity
            );
          }
        }

        const recipe = recipeComponents.filter(
          (component) => component.product_key === item.productKey
        );

        if (recipe.length) {
          for (const component of recipe) {
            const componentQuantity =
              quantity *
              component.quantity *
              (1 + (Number(component.wastage_pct) || 0) / 100);

            quantityByProduct.set(
              component.component_key,
              (quantityByProduct.get(component.component_key) ?? 0) +
                componentQuantity
            );

            if (item.locationId) {
              const key =
                component.component_key + "::" + item.locationId;
              quantityByProductLocation.set(
                key,
                (quantityByProductLocation.get(key) ?? 0) +
                  componentQuantity
              );
            }
          }
        } else {
          quantityByProduct.set(
            item.productKey,
            (quantityByProduct.get(item.productKey) ?? 0) + quantity
          );

          if (item.locationId && !item.variantId) {
            const key = item.productKey + "::" + item.locationId;
            quantityByProductLocation.set(
              key,
              (quantityByProductLocation.get(key) ?? 0) + quantity
            );
          }
        }
      }

      if (!quantityByProduct.size) return;

      for (const product of products) {
        const quantity = quantityByProduct.get(product.id);
        if (!quantity) continue;

        const nextStock = product.stock + quantity;
        void writeConnectedProduct(product, { stock: nextStock });
      }

      setProducts((current) =>
        current.map((product) => {
          const quantity = quantityByProduct.get(product.id);
          return quantity
            ? { ...product, stock: product.stock + quantity }
            : product;
        })
      );

      if (quantityByVariant.size) {
        setPosVariants((current) =>
          current.map((variant) => {
            const quantity = quantityByVariant.get(variant.id);
            if (!quantity) return variant;

            const nextByLocation = { ...variant.stockByLocation };
            for (const [key, value] of quantityByVariantLocation) {
              const [variantId, locationId] = key.split("::");
              if (variantId !== variant.id || !locationId) continue;
              nextByLocation[locationId] =
                (nextByLocation[locationId] ?? 0) + value;
            }

            return {
              ...variant,
              stock: variant.stock + quantity,
              stockByLocation: nextByLocation
            };
          })
        );
      }

      if (quantityByProductLocation.size) {
        setPosLocationStock((current) => {
          const next = { ...current };

          for (const [key, quantity] of quantityByProductLocation) {
            const [productKey, locationId] = key.split("::");
            if (!productKey || !locationId) continue;

            next[productKey] = {
              ...(next[productKey] ?? {}),
              [locationId]:
                (next[productKey]?.[locationId] ?? 0) + quantity
            };
          }

          return next;
        });
      }

      setNotice(
        language === "es"
          ? "Devolución aplicada y stock restaurado."
          : language === "pt"
            ? "Devolução aplicada e estoque restaurado."
            : language === "fr"
              ? "Retour appliqué et stock restauré."
              : language === "de"
                ? "Retoure verbucht und Bestand wiederhergestellt."
                : "Return applied and stock restored."
      );
      window.setTimeout(() => setNotice(""), 2800);
    };

    window.addEventListener(
      "global-stock-return-restock",
      handleReturnRestock
    );

    return () => {
      window.removeEventListener(
        "global-stock-return-restock",
        handleReturnRestock
      );
    };
  }, [language, products, recipeComponents]);

  useEffect(() => {
    const handleStockDelta = (event: Event) => {
      const detail = (
        event as CustomEvent<{ productKey?: string; delta?: number }>
      ).detail;

      const productKey = detail?.productKey;
      const delta = Number(detail?.delta) || 0;
      if (!productKey || !delta) return;

      const product = products.find((item) => item.id === productKey);
      if (product) {
        const nextStock = Math.max(0, product.stock + delta);
        void writeConnectedProduct(product, { stock: nextStock });
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === productKey
            ? { ...item, stock: Math.max(0, item.stock + delta) }
            : item
        )
      );
    };

    window.addEventListener(
      "global-stock-stock-delta",
      handleStockDelta
    );

    return () => {
      window.removeEventListener(
        "global-stock-stock-delta",
        handleStockDelta
      );
    };
  }, [products]);

  useEffect(() => {
    if (!moreOpen && !scannerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (scannerOpen) {
        scannerRef.current?.stop();
        setScannerOpen(false);
        return;
      }

      setMoreOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen, scannerOpen]);

  useEffect(() => {
    if (!demoMode) {
      setStorageReady(true);
      return;
    }

    try {
      const currentProducts = localStorage.getItem("global-stock-products-v3");
      const legacyProducts = localStorage.getItem("global-stock-demo-products-v2");
      const savedProducts = currentProducts ?? legacyProducts;
      const currentTrend = localStorage.getItem("global-stock-trend-v2");
      const legacyTrend = localStorage.getItem("global-stock-trend-v1");
      const savedTrend = currentTrend ?? legacyTrend;
      const savedName = localStorage.getItem("global-stock-business-name");
      const savedBusinessType = localStorage.getItem(
        "global-stock-business-type"
      ) as BusinessType | null;
      const savedBusinessCountry = localStorage.getItem(
        "global-stock-business-country"
      );
      const savedBusinessDescription = localStorage.getItem(
        "global-stock-business-description"
      );
      const savedActivities = localStorage.getItem("global-stock-activities-v1");
      const savedNotes = localStorage.getItem("global-stock-notes-v1");
      const savedFxHistory = localStorage.getItem("global-stock-fx-history-v1");
      const savedFxMarket = localStorage.getItem(
        "global-stock-fx-market-v1"
      ) as FxMarket | null;

      if (savedProducts) {
        const parsed = JSON.parse(savedProducts) as Product[];
        const bundledDemoIds = new Set([
          "p-001",
          "p-002",
          "p-003",
          "p-004",
          "p-005",
          "p-006"
        ]);
        const isBundledDemo =
          !currentProducts &&
          Array.isArray(parsed) &&
          parsed.length === bundledDemoIds.size &&
          parsed.every((item) => bundledDemoIds.has(String(item.id)));

        if (Array.isArray(parsed) && !isBundledDemo) {
          setProducts(parsed);
          if (!currentProducts) {
            localStorage.setItem(
              "global-stock-products-v3",
              JSON.stringify(parsed)
            );
          }
        } else if (isBundledDemo) {
          localStorage.removeItem("global-stock-demo-products-v2");
        }
      }
      if (savedTrend) {
        const parsed = JSON.parse(savedTrend) as TrendPoint[];
        const isBundledDemoTrend =
          !currentTrend &&
          Array.isArray(parsed) &&
          parsed.length === 7 &&
          Number(parsed[0]?.revenue) === 612000 &&
          Number(parsed[5]?.profit) === 524000;

        if (Array.isArray(parsed) && !isBundledDemoTrend) {
          setTrend(parsed);
          if (!currentTrend) {
            localStorage.setItem(
              "global-stock-trend-v2",
              JSON.stringify(parsed)
            );
          }
        } else if (isBundledDemoTrend) {
          localStorage.removeItem("global-stock-trend-v1");
        }
      }
      if (savedName) setBusinessName(savedName);
      if (
        savedBusinessType &&
        [
          "retail",
          "restaurant",
          "services",
          "wholesale",
          "ecommerce",
          "industry",
          "advisory",
          "other"
        ].includes(savedBusinessType)
      ) {
        setBusinessType(savedBusinessType);
      }
      if (savedBusinessCountry) setBusinessCountry(savedBusinessCountry);
      if (savedBusinessDescription) {
        setBusinessDescription(savedBusinessDescription);
      }
      if (savedActivities) {
        const parsed = JSON.parse(savedActivities) as ActivityRecord[];
        if (Array.isArray(parsed)) setActivities(parsed);
      }
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes) as BusinessNote[];
        if (Array.isArray(parsed)) setNotes(parsed);
      }
      if (savedFxHistory) {
        const parsed = JSON.parse(savedFxHistory) as Array<
          Partial<FxHistoryEntry>
        >;
        if (Array.isArray(parsed)) {
          setFxHistory(
            parsed
              .filter(
                (item) =>
                  typeof item.date === "string" &&
                  typeof item.currency === "string" &&
                  Number.isFinite(Number(item.rate))
              )
              .map((item) => ({
                date: String(item.date),
                currency: String(item.currency),
                market:
                  item.market &&
                  ["oficial", "blue", "mep", "ccl", "tarjeta"].includes(
                    item.market
                  )
                    ? item.market
                    : "oficial",
                rate: Number(item.rate)
              }))
          );
        }
      }
      if (
        savedFxMarket &&
        ["oficial", "blue", "mep", "ccl", "tarjeta"].includes(
          savedFxMarket
        )
      ) {
        setFxMarket(savedFxMarket);
      }
    } catch {
      // Keep bundled demo data if a local value is invalid.
    } finally {
      setStorageReady(true);
    }
  }, [demoMode]);

  useEffect(() => {
    if (!storageReady || !demoMode) return;
    localStorage.setItem(
      "global-stock-products-v3",
      JSON.stringify(products)
    );
  }, [demoMode, products, storageReady]);

  useEffect(() => {
    if (!storageReady || demoMode) {
      if (demoMode) {
        cloudHydratedRef.current = true;
        setCloudReady(true);
      }
      return;
    }

    let cancelled = false;

    async function hydrateCloudWorkspace() {
      const business = await ensureCloudBusiness({
        name: businessName,
        businessType,
        country: businessCountry,
        currency,
        locale
      });

      if (!business || cancelled) {
        setCloudReady(true);
        return;
      }

      setCloudBusinessId(business.id);

      const cacheKey = businessStorageKey(
        BUSINESS_WORKSPACE_CACHE_KEY,
        business.id,
        false
      );
      let cachedState: CloudWorkspaceState | null = null;

      try {
        const raw = cacheKey
          ? window.localStorage.getItem(cacheKey)
          : null;
        if (raw) {
          const parsed = JSON.parse(raw) as CloudWorkspaceState;
          if (parsed && typeof parsed === "object") {
            cachedState = parsed;
          }
        }
      } catch {
        cachedState = null;
      }

      const [remote, canonical] = await Promise.all([
        loadCloudWorkspace(business.id),
        loadCanonicalProducts(business.id)
      ]);

      if (cancelled) return;
      if (canonical === null) {
        setNotice("No se pudo leer el inventario compartido. Tus datos locales siguen disponibles; actualizá cuando vuelva la conexión.");
        return; // Fail closed: do not overwrite unknown server stock.
      }

      const resolvedState = remote?.state ?? cachedState;
      const savedProducts = Array.isArray(resolvedState?.products)
        ? resolvedState.products : products;
      const mergedProducts = mergeCanonicalProducts(savedProducts, canonical);
      const canonicalIds = new Set(canonical.map(product => product.id));
      lastMirroredProductsRef.current = new Map(mergedProducts
        .filter(product => canonicalIds.has(product.id))
        .map(product => [product.id, JSON.stringify(product)]));
      setProducts(mergedProducts);

      if (resolvedState) {
        const state = resolvedState;

        if (Array.isArray(state.trend)) setTrend(state.trend);
        if (typeof state.businessName === "string") {
          setBusinessName(state.businessName);
        } else if (business.name) {
          setBusinessName(business.name);
        }
        if (
          typeof state.businessType === "string" &&
          ["retail","restaurant","services","wholesale","ecommerce","industry","advisory","other"].includes(
            state.businessType
          )
        ) {
          setBusinessType(state.businessType as BusinessType);
        }
        if (typeof state.businessCountry === "string") {
          setBusinessCountry(state.businessCountry);
        }
        if (typeof state.businessDescription === "string") {
          setBusinessDescription(state.businessDescription);
        }
        if (Array.isArray(state.activities)) {
          setActivities(state.activities as ActivityRecord[]);
        }
        if (Array.isArray(state.notes)) {
          setNotes(state.notes as BusinessNote[]);
        }
        if (Array.isArray(state.fxHistory)) {
          setFxHistory(state.fxHistory as FxHistoryEntry[]);
        }
        if (
          typeof state.fxMarket === "string" &&
          ["oficial","blue","mep","ccl","tarjeta"].includes(state.fxMarket)
        ) {
          setFxMarket(state.fxMarket as FxMarket);
        }
      } else {
        await saveCloudWorkspace(business.id, {
          products: mergedProducts,
          trend,
          businessName: businessName || business.name,
          businessType,
          businessCountry,
          businessDescription,
          activities,
          notes,
          fxHistory,
          fxMarket
        });
      }

      if (cacheKey && resolvedState) {
        try {
          window.localStorage.setItem(
            cacheKey,
            JSON.stringify(resolvedState)
          );
        } catch {
          // A local cache failure must not block the cloud workspace.
        }
      }

      cloudHydratedRef.current = true;
      setCloudReady(true);
    }

    void hydrateCloudWorkspace();

    return () => {
      cancelled = true;
    };
  // Initial cloud hydration must happen once after local cache is ready.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, demoMode]);

  // Only write changed products. Another device's stock must not be
  // overwritten simply because this user edited a note or preference.
  function enqueueChangedProductSync(businessId: string, items: Product[]) {
    const snapshot = items.map(product => ({ product, fingerprint: JSON.stringify(product) }));
    productSyncQueueRef.current = productSyncQueueRef.current.catch(() => {}).then(async () => {
      const changed = snapshot.filter(entry =>
        lastMirroredProductsRef.current.get(entry.product.id) !== entry.fingerprint
      );
      if (!changed.length) return;
      const success = await mirrorProductsToCloud(businessId, changed.map(entry => entry.product));
      if (!success) {
        console.warn("[Global Stock] Product sync deferred; cloud inventory stays authoritative");
        return;
      }
      for (const entry of changed) {
        lastMirroredProductsRef.current.set(entry.product.id, entry.fingerprint);
      }
    });
    return productSyncQueueRef.current;
  }

  useEffect(() => {
    if (
      demoMode ||
      !storageReady ||
      !cloudReady ||
      !cloudBusinessId ||
      !cloudHydratedRef.current
    ) {
      return;
    }

    if (cloudSaveTimerRef.current) {
      window.clearTimeout(cloudSaveTimerRef.current);
    }

    cloudSaveTimerRef.current = window.setTimeout(() => {
      const state = {
        products,
        trend,
        businessName,
        businessType,
        businessCountry,
        businessDescription,
        activities,
        notes,
        fxHistory,
        fxMarket
      };

      const cacheKey = businessStorageKey(
        BUSINESS_WORKSPACE_CACHE_KEY,
        cloudBusinessId,
        false
      );
      if (cacheKey) {
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(state));
        } catch {
          // Cloud persistence remains authoritative if browser storage is full.
        }
      }

      void Promise.all([
        saveCloudWorkspace(cloudBusinessId, state),
        enqueueChangedProductSync(cloudBusinessId, products),
        updateCloudBusiness(cloudBusinessId, {
          name: businessName,
          businessType,
          country: businessCountry,
          currency,
          locale
        })
      ]);
    }, 900);

    return () => {
      if (cloudSaveTimerRef.current) {
        window.clearTimeout(cloudSaveTimerRef.current);
      }
    };
  }, [
    activities,
    businessCountry,
    businessDescription,
    businessName,
    businessType,
    cloudBusinessId,
    cloudReady,
    currency,
    demoMode,
    fxHistory,
    fxMarket,
    locale,
    notes,
    products,
    storageReady,
    trend
  ]);

  useEffect(() => {
    if (!cloudBusinessId || demoMode) return;

    const syncWhenOnline = () => {
      void Promise.all([
        saveCloudWorkspace(cloudBusinessId, {
          products,
          trend,
          businessName,
          businessType,
          businessCountry,
          businessDescription,
          activities,
          notes,
          fxHistory,
          fxMarket
        }),
        enqueueChangedProductSync(cloudBusinessId, products),
        flushOfflineBusinessOperations(cloudBusinessId),
        flushConnectedProductWrites()
      ]);
    };

    window.addEventListener("online", syncWhenOnline);
    return () => window.removeEventListener("online", syncWhenOnline);
  }, [
    activities,
    businessCountry,
    businessDescription,
    businessName,
    businessType,
    cloudBusinessId,
    demoMode,
    fxHistory,
    fxMarket,
    notes,
    products,
    trend
  ]);

  useEffect(() => {
    if (
      !cloudBusinessId ||
      demoMode ||
      typeof navigator === "undefined" ||
      navigator.onLine === false
    ) {
      return;
    }

    void Promise.all([
      flushOfflineBusinessOperations(cloudBusinessId),
      flushConnectedProductWrites()
    ]);
  }, [cloudBusinessId, demoMode]);

  useEffect(() => {
    if (!storageReady || !demoMode) return;
    localStorage.setItem("global-stock-trend-v2", JSON.stringify(trend));
  }, [demoMode, trend, storageReady]);

  useEffect(() => {
    if (!storageReady || !demoMode) return;
    localStorage.setItem(
      "global-stock-activities-v1",
      JSON.stringify(activities)
    );
  }, [activities, demoMode, storageReady]);

  useEffect(() => {
    if (!storageReady || !demoMode) return;
    localStorage.setItem("global-stock-notes-v1", JSON.stringify(notes));
  }, [demoMode, notes, storageReady]);

  useEffect(() => {
    if (!storageReady || !demoMode) return;
    localStorage.setItem("global-stock-fx-market-v1", fxMarket);
  }, [demoMode, fxMarket, storageReady]);

  useEffect(() => {
    let cancelled = false;

    async function loadRate() {
      try {
        const response = await fetch(
          `/api/fx?target=${encodeURIComponent(currency)}&market=${encodeURIComponent(fxMarket)}&t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("FX unavailable");

        const payload = (await response.json()) as {
          rate?: number;
        };
        const nextRate = Number(payload.rate);

        if (!cancelled && Number.isFinite(nextRate) && nextRate > 0) {
          setCurrencyRate(nextRate);

          const today = localDateKey(new Date());
          setFxHistory((current) => {
            const withoutToday = current.filter(
              (item) =>
                !(
                  item.date === today &&
                  item.currency === currency &&
                  item.market === fxMarket
                )
            );
            const next = [
              {
                date: today,
                currency,
                market: fxMarket,
                rate: nextRate
              },
              ...withoutToday
            ].slice(0, 180);

            if (storageReady) {
              localStorage.setItem(
                "global-stock-fx-history-v1",
                JSON.stringify(next)
              );
            }

            return next;
          });
        }
      } catch {
        if (!cancelled && currency === "ARS") {
          setCurrencyRate(1);
        }
      }
    }

    void loadRate();
    const timer = window.setInterval(loadRate, 30 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadRate();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [currency, fxMarket, storageReady]);

  const localizedTrend = useMemo(
    () =>
      trend.map((point, index) => ({
        ...point,
        label: dayLabels[language][index] ?? point.label,
        revenue: point.revenue * currencyRate,
        cost: point.cost * currencyRate,
        profit: point.profit * currencyRate
      })),
    [trend, language, currencyRate]
  );

  const snapshot: BusinessSnapshot = useMemo(
    () => ({
      products,
      trend,
      currency,
      currencyRate,
      locale
    }),
    [products, trend, currency, currencyRate, locale]
  );

  const metrics = useMemo(() => calculateMetrics(snapshot), [snapshot]);
  const totalCost = useMemo(
    () => trend.reduce((sum, point) => sum + point.cost, 0),
    [trend]
  );
  const totalLoss = useMemo(
    () =>
      Math.abs(
        trend.reduce(
          (sum, point) => sum + Math.min(point.profit, 0),
          0
        )
      ),
    [trend]
  );

  const money = (value: number) =>
    formatMoney(value * currencyRate, currency, locale);

  const visibleModules = useMemo(
    () =>
      modules.filter(({ id }) =>
        canAccessModule(id, memberRole, demoMode)
      ),
    [demoMode, memberRole]
  );

  const visibleModuleIds = useMemo(
    () => new Set(visibleModules.map((module) => module.id)),
    [visibleModules]
  );

  useEffect(() => {
    if (visibleModuleIds.has(activeModule)) return;
    const fallback = visibleModules[0]?.id ?? "overview";
    setActiveModule(fallback);
  }, [activeModule, visibleModuleIds, visibleModules]);

  const mobileLeftModule: ModuleId = visibleModuleIds.has("cash")
    ? "cash"
    : visibleModuleIds.has("inventory")
      ? "inventory"
      : "activities";

  const mobileRightModule: ModuleId = visibleModuleIds.has("inventory")
    ? "inventory"
    : visibleModuleIds.has("charts")
      ? "charts"
      : visibleModuleIds.has("operations")
        ? "operations"
        : "notes";

  const mobileDockModuleIds = new Set<ModuleId>([
    "overview",
    mobileLeftModule,
    mobileRightModule
  ]);

  const activeModuleLivesInMenu =
    visibleModuleIds.has(activeModule) &&
    !mobileDockModuleIds.has(activeModule);

  const MobileLeftIcon =
    modules.find((module) => module.id === mobileLeftModule)?.icon ??
    ActivityIcon;

  const MobileRightIcon =
    modules.find((module) => module.id === mobileRightModule)?.icon ??
    ClipboardList;

  const canUseScanner =
    demoMode ||
    ["owner", "admin", "manager", "cashier", "sales", "warehouse"].includes(
      memberRole
    );

  const canEditGlobalPreferences =
    demoMode || ["owner", "admin"].includes(memberRole);

  const canViewFinancials =
    demoMode ||
    ["owner", "admin", "manager", "accountant"].includes(memberRole);

  const inventoryReadOnly = !demoMode && memberRole === "viewer";

  const recipesByProduct = useMemo(() => {
    const map = new Map<string, RecipeComponent[]>();

    for (const component of recipeComponents) {
      const current = map.get(component.product_key) ?? [];
      current.push(component);
      map.set(component.product_key, current);
    }

    return map;
  }, [recipeComponents]);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const sellableStockById = useMemo(() => {
    const map = new Map<string, number>();

    for (const product of products) {
      const recipe = recipesByProduct.get(product.id);

      if (!recipe?.length) {
        map.set(product.id, product.stock);
        continue;
      }

      let available = Number.POSITIVE_INFINITY;

      for (const component of recipe) {
        const componentProduct = productById.get(component.component_key);
        const perUnit =
          component.quantity *
          (1 + (Number(component.wastage_pct) || 0) / 100);

        if (!componentProduct || perUnit <= 0) {
          available = 0;
          break;
        }

        available = Math.min(
          available,
          Math.floor(componentProduct.stock / perUnit)
        );
      }

      map.set(
        product.id,
        Number.isFinite(available) ? Math.max(0, available) : 0
      );
    }

    return map;
  }, [products, productById, recipesByProduct]);

  const sellableStockByLocation = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};

    for (const product of products) {
      const recipe = recipesByProduct.get(product.id);

      if (!recipe?.length) {
        result[product.id] = {
          ...(posLocationStock[product.id] ?? {})
        };
        continue;
      }

      const byLocation: Record<string, number> = {};

      for (const location of posLocations) {
        let available = Number.POSITIVE_INFINITY;

        for (const component of recipe) {
          const componentStock =
            posLocationStock[component.component_key]?.[location.id] ?? 0;
          const perUnit =
            component.quantity *
            (1 + (Number(component.wastage_pct) || 0) / 100);

          if (perUnit <= 0) {
            available = 0;
            break;
          }

          available = Math.min(
            available,
            Math.floor(componentStock / perUnit)
          );
        }

        byLocation[location.id] = Number.isFinite(available)
          ? Math.max(0, available)
          : 0;
      }

      result[product.id] = byLocation;
    }

    return result;
  }, [
    posLocations,
    posLocationStock,
    products,
    recipesByProduct
  ]);

  const filteredPosProducts = useMemo(() => {
    const query = posQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const baseMatch = [product.name, product.category, product.barcode]
        .join(" ")
        .toLowerCase()
        .includes(query);

      if (baseMatch) return true;

      return posVariants
        .filter((variant) => variant.productKey === product.id)
        .some((variant) =>
          [
            variant.name,
            variant.sku,
            variant.barcode,
            ...Object.values(variant.attributes)
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        );
    });
  }, [posQuery, posVariants, products]);

  const posVariantById = useMemo(
    () => new Map(posVariants.map((variant) => [variant.id, variant])),
    [posVariants]
  );

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([key, quantity]) => {
          const { productId, variantId } = parseCartKey(key);
          const product = products.find((item) => item.id === productId);
          if (!product) return null;

          const variant = variantId
            ? posVariantById.get(variantId) ?? null
            : null;

          if (variant && variant.productKey !== product.id) return null;

          return {
            cartKey: key,
            product,
            variant,
            quantity
          };
        })
        .filter(Boolean) as Array<{
          cartKey: string;
          product: Product;
          variant: PosVariant | null;
          quantity: number;
        }>,
    [cart, posVariantById, products]
  );

  const cartSubtotal = cartLines.reduce(
    (sum, line) =>
      sum +
      (line.variant?.price ?? line.product.price) * line.quantity,
    0
  );

  const appliedPromotion = useMemo(() => {
    if (cartSubtotal <= 0 || !posPromotions.length) return null;

    let best: {
      id: string;
      name: string;
      discount: number;
    } | null = null;

    for (const promotion of posPromotions) {
      const rawValue = Math.max(0, Number(promotion.value) || 0);
      const discount =
        promotion.kind === "percentage"
          ? cartSubtotal * Math.min(100, rawValue) / 100
          : Math.min(cartSubtotal, rawValue);

      if (!best || discount > best.discount) {
        best = {
          id: promotion.id,
          name: promotion.name,
          discount
        };
      }
    }

    return best;
  }, [cartSubtotal, posPromotions]);

  const promotionDiscount = Math.min(
    cartSubtotal,
    appliedPromotion?.discount ?? 0
  );

  const cartTotal = Math.max(0, cartSubtotal - promotionDiscount);
  function effectiveUnitCost(
    product: Product,
    variant: PosVariant | null = null
  ) {
    if (variant?.cost !== null && variant?.cost !== undefined) {
      return variant.cost;
    }

    const recipe = recipesByProduct.get(product.id);

    if (!recipe?.length) {
      return product.costKnown === false ? null : product.cost;
    }

    let total = 0;

    for (const component of recipe) {
      const componentProduct = productById.get(component.component_key);
      if (!componentProduct || componentProduct.costKnown === false) {
        return null;
      }

      total +=
        componentProduct.cost *
        component.quantity *
        (1 + (Number(component.wastage_pct) || 0) / 100);
    }

    return total;
  }

  const cartCostKnown = cartLines.every(
    (line) => effectiveUnitCost(line.product, line.variant) !== null
  );

  const cartCost = cartLines.reduce((sum, line) => {
    const unitCost = effectiveUnitCost(line.product, line.variant);
    return unitCost === null
      ? sum
      : sum + unitCost * line.quantity;
  }, 0);

  const supplierStats = useMemo(() => {
    const groups = new Map<
      string,
      {
        supplier: string;
        products: number;
        units: number;
        value: number;
        margins: number[];
      }
    >();

    for (const product of products) {
      const supplier = product.supplier.trim();
      if (!supplier) continue;

      const current = groups.get(supplier) ?? {
        supplier,
        products: 0,
        units: 0,
        value: 0,
        margins: []
      };

      current.products += 1;
      current.units += product.stock;
      if (product.costKnown !== false) {
        current.value += product.stock * product.cost;
        if (product.price > 0) {
          current.margins.push(
            ((product.price - product.cost) / product.price) * 100
          );
        }
      }
      groups.set(supplier, current);
    }

    return [...groups.values()].map((group) => ({
      ...group,
      averageMargin:
        group.margins.length > 0
          ? group.margins.reduce((sum, value) => sum + value, 0) /
            group.margins.length
          : null
    }));
  }, [products]);

  const restock = useMemo(
    () =>
      rankRestockNeeds(products).filter(
        (item) => item.suggestedUnits > 0
      ),
    [products]
  );

  const selectedNotes = useMemo(
    () => notes.filter((note) => note.date === selectedDate),
    [notes, selectedDate]
  );
  const todayNotes = useMemo(
    () =>
      notes.filter(
        (note) => note.date === localDateKey(new Date()) && !note.done
      ),
    [notes]
  );

  function addActivity(
    kind: ActivityKind,
    extra: Omit<ActivityRecord, "id" | "kind" | "createdAt"> = {}
  ) {
    setActivities((current) => [
      {
        id: crypto.randomUUID(),
        kind,
        createdAt: new Date().toISOString(),
        ...extra
      },
      ...current
    ].slice(0, 200));
  }

  function connectedSyncErrorText() {
    return language === "es"
      ? "El cambio quedó en Global Stock, pero no pudo sincronizarse con la tienda online. Revisá la conexión."
      : language === "pt"
        ? "A alteração ficou no Global Stock, mas não pôde ser sincronizada com a loja online."
        : language === "fr"
          ? "La modification est enregistrée dans Global Stock mais n’a pas pu être synchronisée avec la boutique."
          : language === "de"
            ? "Die Änderung wurde in Global Stock gespeichert, konnte aber nicht mit dem Shop synchronisiert werden."
            : "The change is saved in Global Stock but could not be synchronized with the online store.";
  }

  async function flushConnectedProductWrites() {
    if (!cloudBusinessId) return 0;

    const authHeaders = await connectedApiAuthHeaders();
    if (!authHeaders) return 0;

    const queue = readConnectedWriteQueue(cloudBusinessId);
    if (!queue.length) return 0;

    const remaining: PendingConnectedWrite[] = [];
    let flushed = 0;

    for (const item of queue) {
      try {
        const response = await fetch("/api/store-connector/product", {
          method: "PATCH",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders
          },
          body: JSON.stringify({
            businessId: cloudBusinessId,
            externalId: item.externalId,
            ...item.patch
          })
        });

        if (!response.ok) throw new Error("remote write failed");
        flushed += 1;
      } catch {
        remaining.push(item);
      }
    }

    saveConnectedWriteQueue(cloudBusinessId, remaining);
    return flushed;
  }

  async function writeConnectedProduct(
    product: Product,
    patch: Record<string, unknown>
  ) {
    if (demoMode) return true;

    const authHeaders = await connectedApiAuthHeaders();
    if (!authHeaders) return false;

    if (
      product.source !== "connected" ||
      !product.externalId
    ) {
      return true;
    }

    try {
      const response = await fetch("/api/store-connector/product", {
        method: "PATCH",
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders
          },
        body: JSON.stringify({
          businessId: cloudBusinessId,
          externalId: product.externalId,
          ...patch
        })
      });

      if (!response.ok) throw new Error("remote write failed");
      return true;
    } catch {
      if (cloudBusinessId) {
        queueConnectedWrite(
          cloudBusinessId,
          product.externalId,
          patch
        );
      }
      setNotice(connectedSyncErrorText());
      window.setTimeout(() => setNotice(""), 4200);
      return false;
    }
  }

  function scheduleConnectedWrite(
    product: Product,
    patch: Record<string, unknown>
  ) {
    if (
      product.source !== "connected" ||
      !product.externalId
    ) {
      return;
    }

    const key = product.id;
    const existing = remoteWriteTimersRef.current.get(key);
    if (existing) window.clearTimeout(existing);

    const timer = window.setTimeout(() => {
      remoteWriteTimersRef.current.delete(key);
      void writeConnectedProduct(product, patch);
    }, 420);

    remoteWriteTimersRef.current.set(key, timer);
  }

  function importConnectedCatalog(
    store: ConnectedStore,
    catalog: ConnectedCatalogPayload
  ) {
    const mapped: Product[] = catalog.products.map((product) => {
      const costKnown =
        product.cost !== null &&
        Number.isFinite(Number(product.cost));

      return {
        id: `connected:${store.id}:${product.externalId}`,
        externalId: product.externalId,
        sourceStoreId: store.id,
        sourceStoreUrl: store.url,
        source: "connected",
        barcode: product.barcode?.trim() ?? "",
        name: product.name,
        description: product.description ?? "",
        category: product.category?.trim() ?? "",
        brand: product.brand?.trim() ?? "",
        supplier: product.supplier?.trim() ?? "",
        stock: Math.max(0, Number(product.stock) || 0),
        minStock: Math.max(0, Number(product.minStock) || 0),
        cost: costKnown ? Math.max(0, Number(product.cost)) : 0,
        costKnown,
        price: Math.max(0, Number(product.price) || 0),
        originalPrice: Number.isFinite(Number(product.originalPrice))
          ? Math.max(0, Number(product.originalPrice))
          : undefined,
        discountPercent: Number.isFinite(Number(product.discountPercent))
          ? Math.max(0, Number(product.discountPercent))
          : undefined,
        sold30d: Math.max(0, Number(product.sold30d) || 0),
        image: product.image ?? "",
        images: Array.isArray(product.images) ? product.images : [],
        active: product.active !== false,
        updatedAt: product.updatedAt ?? null
      };
    });

    setProducts(mapped);
    setCart({});

    // Demo financial trend must never survive after a real business catalog
    // is connected. New POS sales build real local activity from zero.
    setTrend(
      dayLabels.es.map((label) => ({
        label,
        revenue: 0,
        cost: 0,
        profit: 0
      }))
    );

    if (
      businessName.trim() === "" ||
      businessName === "Global Stock Demo"
    ) {
      setBusinessName(store.name);
      if (demoMode) {
        localStorage.setItem("global-stock-business-name", store.name);
      }
    }

    setNotice(
      language === "es"
        ? `${mapped.length} productos reales sincronizados desde ${store.name}.`
        : language === "pt"
          ? `${mapped.length} produtos reais sincronizados de ${store.name}.`
          : language === "fr"
            ? `${mapped.length} produits réels synchronisés depuis ${store.name}.`
            : language === "de"
              ? `${mapped.length} echte Produkte aus ${store.name} synchronisiert.`
              : `${mapped.length} real products synchronized from ${store.name}.`
    );
    window.setTimeout(() => setNotice(""), 3200);
  }

  function setQuantity(
    key: string,
    quantity: number,
    availableOverride?: number
  ) {
    const { productId, variantId } = parseCartKey(key);
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const variant = variantId
      ? posVariantById.get(variantId) ?? null
      : null;

    const available =
      availableOverride !== undefined
        ? Math.max(0, availableOverride)
        : variant
          ? variant.stock
          : sellableStockById.get(productId) ?? product.stock;

    const safe = Math.max(0, Math.min(quantity, available));

    setCart((current) => {
      const next = { ...current };
      if (safe <= 0) delete next[key];
      else next[key] = safe;
      return next;
    });
  }

  function completeSale(
    payments: PosPayment[] = [{ method: "cash", amount: cartTotal }],
    receivedAmount?: number,
    customerId?: string,
    locationId?: string
  ) {
    if (!cartLines.length) return;

    if (cloudBusinessId && !demoMode) {
      void recordPosSale({
        businessId: cloudBusinessId,
        currency,
        payments,
        receivedAmount,
        customerId,
        locationId,
        lines: cartLines,
        total: cartTotal,
        costTotal: cartCost
      });
    }

    const stockDeltas = new Map<string, number>();
    const soldByProduct = new Map<string, number>();
    const soldByVariant = new Map<string, number>();

    for (const { product, variant, quantity } of cartLines) {
      soldByProduct.set(
        product.id,
        (soldByProduct.get(product.id) ?? 0) + quantity
      );

      if (variant) {
        soldByVariant.set(
          variant.id,
          (soldByVariant.get(variant.id) ?? 0) + quantity
        );
      }

      const recipe = recipesByProduct.get(product.id);

      if (recipe?.length) {
        for (const component of recipe) {
          const componentQuantity =
            quantity *
            component.quantity *
            (1 + (Number(component.wastage_pct) || 0) / 100);

          stockDeltas.set(
            component.component_key,
            (stockDeltas.get(component.component_key) ?? 0) -
              componentQuantity
          );
        }
      } else {
        stockDeltas.set(
          product.id,
          (stockDeltas.get(product.id) ?? 0) - quantity
        );
      }
    }

    const remoteChanges: Array<{ product: Product; stock: number }> = [];

    for (const product of products) {
      const delta = stockDeltas.get(product.id);
      if (!delta) continue;

      remoteChanges.push({
        product,
        stock: Math.max(0, product.stock + delta)
      });
    }

    setProducts((current) =>
      current.map((product) => {
        const soldQuantity = soldByProduct.get(product.id) ?? 0;
        const stockDelta = stockDeltas.get(product.id) ?? 0;

        if (!soldQuantity && !stockDelta) return product;

        return {
          ...product,
          stock: Math.max(0, product.stock + stockDelta),
          sold30d: product.sold30d + soldQuantity
        };
      })
    );

    for (const change of remoteChanges) {
      void writeConnectedProduct(change.product, {
        stock: change.stock
      });
    }

    if (soldByVariant.size) {
      setPosVariants((current) =>
        current.map((variant) => {
          const sold = soldByVariant.get(variant.id) ?? 0;
          if (!sold) return variant;

          const nextByLocation = { ...variant.stockByLocation };
          if (locationId) {
            nextByLocation[locationId] = Math.max(
              0,
              (nextByLocation[locationId] ?? 0) - sold
            );
          }

          return {
            ...variant,
            stock: Math.max(0, variant.stock - sold),
            stockByLocation: nextByLocation
          };
        })
      );
    }

    if (locationId && stockDeltas.size) {
      setPosLocationStock((current) => {
        const next = { ...current };

        for (const [productKey, delta] of stockDeltas) {
          next[productKey] = {
            ...(next[productKey] ?? {}),
            [locationId]: Math.max(
              0,
              (next[productKey]?.[locationId] ?? 0) + delta
            )
          };
        }

        return next;
      });
    }

    const dayIndex = (new Date().getDay() + 6) % 7;
    setTrend((current) =>
      current.map((point, index) =>
        index === dayIndex
          ? {
              ...point,
              revenue: point.revenue + cartTotal,
              cost: point.cost + cartCost,
              profit: point.profit + (cartTotal - cartCost)
            }
          : point
      )
    );

    addActivity("sale", {
      units: cartLines.reduce((sum, line) => sum + line.quantity, 0),
      total: cartTotal
    });
    setCart({});
    setNotice(labels.saleCompleted);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function updateStock(id: string, nextStock: number) {
    const safeStock = Math.max(0, Math.round(nextStock));
    const product = products.find((item) => item.id === id);

    if (product && cloudBusinessId && !demoMode) {
      void recordStockAdjustment({
        businessId: cloudBusinessId,
        product,
        previousStock: product.stock,
        nextStock: safeStock,
        reason: "manual"
      });
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              stock: safeStock
            }
          : item
      )
    );

    if (product) {
      scheduleConnectedWrite(product, { stock: safeStock });
    }
  }

  async function addStock(id: string, quantity: number, operationId: string): Promise<number> {
    const product = products.find(item => item.id === id);
    if (!product) throw new Error("El producto ya no está disponible.");
    if (demoMode) {
      const confirmed = Math.round((product.stock + quantity) * 1000) / 1000;
      setProducts(current => current.map(item =>
        item.id === id ? { ...item, stock: confirmed } : item
      ));
      return confirmed;
    }
    if (!cloudBusinessId) throw new Error("Conectá el negocio para agregar stock.");
    const confirmed = await addProductStockToCloud({
      businessId: cloudBusinessId,
      productKey: product.id,
      quantity,
      operationId
    });
    const updatedProduct = { ...product, stock: confirmed };
    // This server-confirmed stock is already stored in inventory_levels and
    // stock_movements. Do NOT mirror the same stock increase a second time.
    lastMirroredProductsRef.current.set(product.id, JSON.stringify(updatedProduct));
    setProducts(current => current.map(item =>
      item.id === id ? { ...item, stock: confirmed } : item
    ));
    setNotice("Stock actualizado.");
    return confirmed;
  }

  function updatePrice(id: string, nextPrice: number) {
    const safeListPrice = Math.max(0, Number(nextPrice) || 0);
    const product = products.find((item) => item.id === id);
    const discount = Math.min(
      90,
      Math.max(0, Number(product?.discountPercent) || 0)
    );
    const finalPrice =
      Math.round(safeListPrice * (1 - discount / 100) * 100) / 100;

    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              originalPrice: safeListPrice,
              price: finalPrice
            }
          : item
      )
    );

    if (product) {
      scheduleConnectedWrite(product, { price: safeListPrice });
    }
  }

  function updateCost(id: string, raw: string) {
    const product = products.find((item) => item.id === id);
    const trimmed = raw.trim();
    const known = trimmed !== "";
    const safeCost = known
      ? Math.max(0, Number(trimmed.replace(",", ".")) || 0)
      : 0;

    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, cost: safeCost, costKnown: known }
          : item
      )
    );

    if (product) {
      scheduleConnectedWrite(product, {
        cost: known ? safeCost : null
      });
    }
  }

  function updateMinStock(id: string, nextMinStock: number) {
    const safeMinStock = Math.max(0, Math.round(nextMinStock));
    const product = products.find((item) => item.id === id);

    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, minStock: safeMinStock }
          : item
      )
    );

    if (product) {
      scheduleConnectedWrite(product, {
        minStock: safeMinStock
      });
    }
  }

  function updateInventoryDetails(id: string, details: ProductInventoryDetails) {
    setProducts(current => current.map(product =>
      product.id === id ? { ...product, inventoryDetails: details } : product
    ));
  }

  function updateSupplier(id: string, supplier: string) {
    const product = products.find((item) => item.id === id);

    setProducts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, supplier } : item
      )
    );

    if (product) {
      scheduleConnectedWrite(product, { supplier });
    }
  }

  function removeSupplier(name: string) {
    const normalized = name.trim().toLocaleLowerCase();
    if (!normalized) return;

    const affected = products.filter(
      (product) =>
        product.supplier.trim().toLocaleLowerCase() === normalized
    );

    setProducts((current) =>
      current.map((product) =>
        product.supplier.trim().toLocaleLowerCase() === normalized
          ? { ...product, supplier: "" }
          : product
      )
    );

    for (const product of affected) {
      scheduleConnectedWrite(product, { supplier: "" });
    }

    setNotice(
      language === "es"
        ? "Proveedor eliminado y desvinculado de los productos."
        : language === "pt"
          ? "Fornecedor removido e desvinculado dos produtos."
          : language === "fr"
            ? "Fournisseur supprimé et dissocié des produits."
            : language === "de"
              ? "Lieferant entfernt und von den Produkten getrennt."
              : "Supplier removed and unlinked from products."
    );
    window.setTimeout(() => setNotice(""), 2600);
  }

  function updateBarcode(id: string, barcode: string) {
    const product = products.find((item) => item.id === id);

    setProducts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, barcode } : item
      )
    );

    if (product) {
      void writeConnectedProduct(product, { barcode });
    }
    setNotice(
      language === "es"
        ? "Código de barras asignado."
        : language === "pt"
          ? "Código de barras atribuído."
          : language === "fr"
            ? "Code-barres attribué."
            : language === "de"
              ? "Barcode zugewiesen."
              : "Barcode assigned."
    );
    window.setTimeout(() => setNotice(""), 1800);
  }

  function integrateScannedProduct(scanned: Product) {
    setProducts((current) => {
      const exists = current.some(
        (item) => item.barcode === scanned.barcode
      );
      if (!exists) return [scanned, ...current];
      return current.map((item) =>
        item.barcode === scanned.barcode
          ? { ...item, ...scanned }
          : item
      );
    });

    addActivity("scan", { product: scanned.name });
    setScannerOpen(false);
  }

  function receiveRestock(id: string, units: number) {
    const product = products.find((item) => item.id === id);
    const nextStock = Math.max(0, (product?.stock ?? 0) + units);

    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, stock: item.stock + units }
          : item
      )
    );

    if (product) {
      void writeConnectedProduct(product, { stock: nextStock });

      if (cloudBusinessId && !demoMode) {
        void recordStockAdjustment({
          businessId: cloudBusinessId,
          product,
          previousStock: product.stock,
          nextStock,
          reason: "purchase"
        });
      }
    }

    addActivity("restock", {
      product: product?.name,
      units
    });
    setNotice(labels.purchaseApplied);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function saveBusinessName() {
    if (demoMode) {
      localStorage.setItem(
        "global-stock-business-name",
        businessName.trim()
      );
      localStorage.setItem(
        "global-stock-business-type",
        businessType
      );
      localStorage.setItem(
        "global-stock-business-country",
        businessCountry.trim()
      );
      localStorage.setItem(
        "global-stock-business-description",
        businessDescription.trim()
      );
    }
    addActivity("settings");
    setNotice(labels.saved);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addNote() {
    const text = noteDraft.trim();
    if (!text) return;

    const note: BusinessNote = {
      id: crypto.randomUUID(),
      text,
      date: selectedDate,
      done: false,
      createdAt: new Date().toISOString()
    };

    setNotes((current) => [note, ...current]);
    addActivity("note");
    setNoteDraft("");
  }

  function toggleNote(id: string) {
    setNotes((current) =>
      current.map((note) =>
        note.id === id ? { ...note, done: !note.done } : note
      )
    );
  }

  function removeNote(id: string) {
    setNotes((current) =>
      current.filter((note) => note.id !== id)
    );
  }

  return (
    <motion.main data-workspace-accent={workspaceAccent} style={{ ...workspaceAccentVars(workspaceAccent) }} animate={{ gridTemplateColumns: sidebarCollapsed ? "84px minmax(0, 1fr)" : "250px minmax(0, 1fr)" }} transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.85 }} className="gs-app-shell min-h-screen w-full min-w-0 overflow-x-clip bg-[var(--apex-bg)] text-[var(--apex-text)] lg:grid">
      <motion.aside animate={{ width: sidebarCollapsed ? 84 : 250 }} transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.85 }} className={`relative sticky top-0 hidden h-screen min-w-0 overflow-hidden border-r border-gray-200 bg-[var(--apex-surface)] dark:border-white/10 py-5 lg:flex lg:flex-col ${sidebarCollapsed ? "items-center px-1" : "px-4"}`}>
        <div className={`mb-4 flex w-full shrink-0 items-center border-b border-[var(--apex-border)] pb-4 ${sidebarCollapsed ? "flex-row justify-between gap-1" : "justify-between gap-2"}`}>
          <button
            type="button"
            onClick={() => setActiveModule("overview")}
            aria-label={language === "es" ? "Ir a Inicio" : "Go to Home"}
            title={language === "es" ? "Inicio" : "Home"}
            className={`grid shrink-0 place-items-center rounded-xl border border-transparent bg-transparent text-[var(--apex-text)] opacity-95 transition-all duration-300 ease-in-out hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--apex-border)] ${sidebarCollapsed ? "h-9 w-9" : "h-11 w-11"}`}
          >
            <Logo />
          </button>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(value => !value)}
            aria-label={sidebarCollapsed ? (language === "es" ? "Expandir menú lateral" : "Expand sidebar") : (language === "es" ? "Contraer menú lateral" : "Collapse sidebar")}
            title={sidebarCollapsed ? (language === "es" ? "Expandir menú" : "Expand menu") : (language === "es" ? "Contraer menú" : "Collapse menu")}
            aria-expanded={!sidebarCollapsed}
            className={`grid shrink-0 place-items-center rounded-lg border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-muted)] transition-all duration-300 ease-in-out hover:border-[var(--apex-accent)] hover:bg-[var(--apex-accent-glow)] hover:text-[var(--apex-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--apex-accent)] ${sidebarCollapsed ? "h-7 w-7" : "h-9 w-9"}`}
          >
            <motion.span aria-hidden="true" animate={{ rotate: sidebarCollapsed ? 0 : 180 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="grid place-items-center">
              <PanelLeft size={19} strokeWidth={1.8} />
            </motion.span>
          </button>
        </div>

        <div className={`relative mt-1 min-h-0 w-full flex-1 ${sidebarCollapsed ? "px-0" : ""}`}>
          <nav
            id="business-sidebar-nav"
            ref={sidebarNavRef}
            tabIndex={0}
            onKeyDown={(event) => {
              if (!scrollSidebarByKeyboard(event.key)) return;
              event.preventDefault();
            }}
            className="gs-sidebar-nav h-full min-w-0 overflow-x-hidden overflow-y-auto px-1 pt-1 outline-none"
          >
            <div className="w-full min-w-0 pb-4">
              {navigationGroups.map((group) => {
                const groupItems = group.modules
                  .filter((id) => visibleModuleIds.has(id))
                  .map((id) =>
                    modules.find((module) => module.id === id)
                  )
                  .filter(
                    (
                      item
                    ): item is (typeof modules)[number] =>
                      Boolean(item)
                  );

                if (!groupItems.length && group.id !== "legal") return null;

                return (
                  <section key={group.id} className="min-w-0 border-t border-gray-100 pb-3 pt-3 first:border-t-0 first:pt-0 dark:border-white/10 last:pb-0">
                    {sidebarCollapsed ? (
                      <motion.div aria-hidden="true" initial={false} animate={{ opacity: 1 }} className="flex h-5 items-center justify-center text-sm leading-none text-[var(--apex-muted)]">
                        
                      </motion.div>
                    ) : (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.16, delay: reduceMotion ? 0 : 0.12 }} className="mb-1.5 min-h-5 px-3 text-xs font-bold leading-5 tracking-[-0.01em] text-[var(--apex-text)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif' }}>
                        {navigationGroupLabels[language][group.id]}
                      </motion.p>
                    )}

                    <div className="min-w-0 space-y-0.5">
                      {groupItems.map(({ id, icon: Icon }) => {
                        const active = activeModule === id;

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setActiveModule(id)}
                            title={labels.nav[id]}
                            aria-label={labels.nav[id]}
                            className={
                              "group relative mx-1 flex min-h-10 w-[calc(100%-0.5rem)] min-w-0 items-center rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-300 ease-in-out hover:translate-x-[1px] " + (sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3") + " " +
                              (active
                                ? "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white"
                                : "text-[var(--apex-muted)] hover:bg-gray-50 hover:text-[var(--apex-text)] dark:hover:bg-white/[0.06]")
                            }
                          >
                            <Icon size={18} strokeWidth={1.6} />
                            <AnimatePresence initial={false}>
                              {!sidebarCollapsed && <motion.span key="nav-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.14, delay: reduceMotion || sidebarCollapsed ? 0 : 0.12 }} className="min-w-0 flex-1 truncate whitespace-nowrap">
                                {labels.nav[id]}
                              </motion.span>}
                            </AnimatePresence>
                            {sidebarCollapsed && <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[80] -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-white/10 bg-[#171717] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">{labels.nav[id]}</span>}
                          </button>
                        );
                      })}
                      {group.id === "legal" && legalLinks.map(({ id, href, icon: Icon }) => (
                        <a
                          key={id}
                          href={href}
                          className={`group relative mx-1 flex min-h-10 w-[calc(100%-0.5rem)] min-w-0 items-center rounded-xl py-2.5 text-[13px] font-semibold text-[var(--apex-muted)] transition-all duration-200 hover:translate-x-[1px] hover:bg-gray-50 hover:text-[var(--apex-text)] dark:hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--apex-accent)] ${sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3"}`} title={legalLinkLabels[language][id]}
                        >
                          <Icon size={16} aria-hidden="true" />
                          <AnimatePresence initial={false}>
                            {!sidebarCollapsed && <motion.span key="legal-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.14, delay: reduceMotion || sidebarCollapsed ? 0 : 0.12 }} className="min-w-0 flex-1 truncate whitespace-nowrap">{legalLinkLabels[language][id]}</motion.span>}
                          </AnimatePresence>
                          {sidebarCollapsed && <span aria-hidden="true" className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[80] -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-white/10 bg-[#171717] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">{legalLinkLabels[language][id]}</span>}
                        </a>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </nav>


        </div>

        <div className={`mt-auto w-full space-y-3 pt-4 ${sidebarCollapsed ? "px-0" : ""}`}>
          {!sidebarCollapsed && <>
          <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--apex-muted)]">
              {labels.businessSummary}
            </p>
            <p className="mt-2 truncate text-sm font-semibold">
              {businessName || labels.businessSummary}
            </p>
            <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
              {metrics.inventoryUnits} {labels.units}
            </p>
            {!demoMode && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
                {language === "es" ? "Rol" : "Role"}: {memberRole}
              </p>
            )}
          </div>

          </>}
          <button
            type="button"
            onClick={onSignOut}
            className={`flex w-full items-center rounded-2xl border border-[var(--apex-border)] py-3 text-sm font-semibold text-[var(--apex-muted)] ${sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3"}`}
          >
            <LogOut size={17} />
            {!sidebarCollapsed && labels.signOut}
          </button>
        </div>
      </motion.aside>

      <section className="min-w-0 pb-28 lg:pb-0">
        <header className="sticky top-0 z-40 border-b border-[var(--apex-border)] bg-[var(--apex-surface)]/95 backdrop-blur-lg">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-6 lg:px-8">
            <div className="min-w-0 lg:hidden">
              <Logo withWordmark />
              <motion.p
                key={activeModule}
                layoutId={"gs-mobile-shared-title-" + activeModule}
                className="mt-1 truncate text-[10px] font-bold tracking-[.04em] text-[var(--apex-muted)]"
                transition={{ duration: reduceMotion ? 0 : .26, ease: [0.22, 1, 0.36, 1] }}
              >
                {labels.nav[activeModule]}
              </motion.p>
              {activeModule === "overview" && (
                <div className="mt-1 min-w-0">
                  <p className="truncate text-[17px] font-semibold leading-snug tracking-[-0.035em] text-[var(--apex-text)] sm:text-[19px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif' }}>
                    {language === "es" ? (signedInName ? `¡Hola, ${signedInName}!` : "¡Hola! Bienvenido de nuevo") : `${welcomeLabels[language].greeting}${signedInName ? `, ${signedInName}` : ""}`}
                  </p>
                  {(demoMode || (cloudBusinessId && memberRoleReady)) && (
                    <span className="mt-1.5 inline-flex max-w-full items-center rounded-full border border-[#8F0000]/20 bg-[#8F0000]/[0.07] px-2.5 py-1 text-[10px] font-semibold tracking-[0.015em] text-[#8F0000] dark:border-white/10 dark:bg-white/[0.06] dark:text-[var(--apex-text)]">
                      {demoMode ? welcomeLabels[language].demo : `${welcomeLabels[language].role}: ${workspaceRoleLabels[language][memberRole] ?? memberRole}`}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="hidden min-w-0 lg:block">
              <div className="flex items-center gap-2">
                <Logo className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
                  Global Stock
                </p>
              </div>
              <motion.h1
                key={activeModule}
                layoutId="global-stock-active-module-title"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className="mt-1 truncate text-[22px] font-semibold leading-tight tracking-[-0.045em] text-[var(--apex-text)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif' }}
              >
                {labels.nav[activeModule]}
              </motion.h1>
              {activeModule === "overview" && (
                <div className="mt-1 min-w-0">
                  <p className="truncate text-base font-semibold tracking-[-0.035em] text-[var(--apex-text)] sm:text-lg">
                    {language === "es" ? (signedInName ? `¡Hola, ${signedInName}!` : "¡Hola! Bienvenido de nuevo") : `${welcomeLabels[language].greeting}${signedInName ? `, ${signedInName}` : ""}`}
                  </p>
                  {(demoMode || (cloudBusinessId && memberRoleReady)) && (
                    <p className="truncate text-[10px] text-[var(--apex-muted)]">
                      {demoMode
                        ? welcomeLabels[language].demo
                        : `${welcomeLabels[language].role}: ${workspaceRoleLabels[language][memberRole] ?? memberRole}`}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:block">
                <InstallAppButton language={language} variant="header" />
              </div>
              {canEditGlobalPreferences && (
                <div className="hidden sm:block">
                  <GlobalPreferences
                    variant="header"
                    language={language}
                    currency={currency}
                    onLanguageChange={onLanguageChange}
                    onCurrencyChange={onCurrencyChange}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={onToggleTheme}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]"
                aria-label={labels.theme}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] lg:hidden"
                aria-label={labels.more}
              >
                <Menu size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full min-w-0 max-w-[1500px] px-4 py-5 sm:px-6 lg:px-6 xl:px-8 lg:py-7">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeModule}
              initial={reduceMotion ? false : { opacity: 0, y: 8, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(5px)" }}
              transition={{ duration: reduceMotion ? 0 : 0.20, ease: "easeOut" }}
              className="min-w-0"
            >
            {activeModule === "overview" && (
              <OverviewModule
                dark={dark}
                language={language}
                workspaceAccent={workspaceAccent}
                onAccentChange={chooseWorkspaceAccent}
                labels={labels}
                metrics={metrics}
                chartData={localizedTrend}
                money={money}
                currency={currency}
                locale={locale}
                setActiveModule={setActiveModule}
                canOpenModule={(id) => visibleModuleIds.has(id)}
                showFinancials={canViewFinancials}
                recentActivities={activities.slice(0, 4)}
                todayNotes={todayNotes}
                activityText={(activity) =>
                  describeActivity(
                    activity,
                    labels,
                    money,
                    canViewFinancials
                  )
                }
              />
            )}

            {activeModule === "cash" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-1.5" role="tablist" aria-label={language === "es" ? "Secciones de Caja Registradora" : "Cash register sections"}>
                  <button type="button" role="tab" aria-selected={cashTab === "checkout"}
                    onClick={() => setCashTab("checkout")}
                    className={"min-h-10 flex-1 rounded-xl px-4 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 sm:flex-none " +
                      (cashTab === "checkout"
                        ? "bg-[var(--apex-accent)] text-white shadow-sm"
                        : "text-[var(--apex-muted)] hover:bg-[var(--apex-bg)] hover:text-[var(--apex-text)]")}>
                    <ShoppingCart className="mr-2 inline-block" size={15} />
                    {language === "es" ? "Cobros y ventas" : language === "pt" ? "Vendas e pagamentos" : language === "fr" ? "Ventes et paiements" : language === "de" ? "Verkauf und Zahlung" : "Checkout & sales"}
                  </button>
                  <button type="button" role="tab" aria-selected={cashTab === "management"}
                    onClick={() => setCashTab("management")}
                    className={"min-h-10 flex-1 rounded-xl px-4 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 sm:flex-none " +
                      (cashTab === "management"
                        ? "bg-[var(--apex-accent)] text-white shadow-sm"
                        : "text-[var(--apex-muted)] hover:bg-[var(--apex-bg)] hover:text-[var(--apex-text)]")}>
                    <Wallet className="mr-2 inline-block" size={15} />
                    {language === "es" ? "Apertura, cierre y arqueo" : language === "pt" ? "Abertura, fechamento e conferência" : language === "fr" ? "Ouverture et clôture" : language === "de" ? "Kassenöffnung und -abschluss" : "Shifts & cash reconciliation"}
                  </button>
                </div>
                <div role="tabpanel">
                  {cashTab === "checkout" ? (
                    <PosModule
                      cashMode={true}
                      labels={labels}
                      language={language}
                      products={products}
                      posVariants={posVariants}
                      locations={posLocations}
                      sellableStockByLocation={sellableStockByLocation}
                      query={posQuery}
                      setQuery={setPosQuery}
                      cart={cart}
                      setQuantity={setQuantity}
                      cartLines={cartLines}
                      cartSubtotal={cartSubtotal}
                      promotionDiscount={promotionDiscount}
                      promotionLabel={appliedPromotion?.name ?? ""}
                      cartTotal={cartTotal}
                      cartProfit={canViewFinancials && cartCostKnown ? cartTotal - cartCost : null}
                      money={money}
                      businessId={cloudBusinessId}
                      demoMode={demoMode}
                      sellableStockById={sellableStockById}
                      completeSale={completeSale}
                    />
                  ) : (
                    <CashRegisterCenter
                      language={language}
                      businessId={cloudBusinessId}
                      demoMode={demoMode}
                      locations={posLocations}
                      money={money}
                      currency={currency}
                      canManage={demoMode || memberRole !== "viewer"}
                      onGoToPos={() => setCashTab("checkout")}
                    />
                  )}
                </div>
              </div>
            )}

            {activeModule === "online" && (
              <div className="space-y-5">
                <ConnectedCommerceHub
                  businessId={cloudBusinessId}
                  language={language}
                  locale={locale}
                  demoMode={demoMode}
                  onCatalogSync={importConnectedCatalog}
                />
                {!demoMode && cloudBusinessId ?
                  <OnlineConnectionRequests businessId={cloudBusinessId} /> : null}
              </div>
            )}

            {activeModule === "inventory" && (
              <InventoryModule
                labels={labels}
                language={language}
                products={products}
                money={money}
                updateStock={updateStock}
                addStock={addStock}
                updatePrice={updatePrice}
                updateCost={updateCost}
                updateMinStock={updateMinStock}
                updateSupplier={updateSupplier}
                updateBarcode={updateBarcode}
                updateInventoryDetails={updateInventoryDetails}
                businessType={businessType}
                accent={workspaceAccent}
                integrateScannedProduct={integrateScannedProduct}
                businessId={cloudBusinessId}
                readOnly={inventoryReadOnly}
              />
            )}

            {activeModule === "charts" && (
              <PremiumCharts
                language={language}
                dark={dark}
                accent={workspaceAccent}
                products={products}
                data={localizedTrend}
                money={money}
                currency={currency}
                locale={locale}
                revenue={metrics.revenue}
                cost={totalCost}
                profit={metrics.grossProfit}
                losses={totalLoss}
              />
            )}

            {activeModule === "purchases" && (
              <PurchasesModule
                labels={labels}
                language={language}
                restock={restock}
                money={money}
                showFinancials={canViewFinancials}
                receiveRestock={receiveRestock}
              />
            )}

            {activeModule === "suppliers" && (
              <SupplierDirectory
                language={language}
                accent={workspaceAccent}
                stats={supplierStats}
                money={money}
                onRemoveSupplier={removeSupplier}
                businessId={cloudBusinessId}
                demoMode={demoMode}
              />
            )}

            {activeModule === "activities" && (
              <ActivitiesModule
                labels={labels}
                activities={activities}
                locale={locale}
                activityText={(activity) =>
                  describeActivity(
                    activity,
                    labels,
                    money,
                    canViewFinancials
                  )
                }
              />
            )}

            {activeModule === "arca" && (
              <FiscalDocumentsCenter
                language={language}
                currency={currency}
                locale={locale}
                businessId={cloudBusinessId}
                demoMode={demoMode}
              />
            )}

            {activeModule === "account" && (
              <WorkspaceAccountPanel
                language={language}
                demoMode={demoMode}
                onSignOut={onSignOut}
              />
            )}

            {activeModule === "documents" && (
              <SmartDocumentInbox
                language={language}
                currency={currency}
                locale={locale}
                businessId={cloudBusinessId}
                demoMode={demoMode}
              />
            )}

            {activeModule === "notes" && (
              <NotesHub
                language={language}
                locale={locale}
                notes={notes}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedNotes={selectedNotes}
                noteDraft={noteDraft}
                setNoteDraft={setNoteDraft}
                addNote={addNote}
                toggleNote={toggleNote}
                removeNote={removeNote}
                calendarMonth={calendarMonth}
                setCalendarMonth={setCalendarMonth}
                businessId={cloudBusinessId}
                demoMode={demoMode}
              />
            )}

            {activeModule === "operations" && (
              demoMode || ["owner", "admin"].includes(memberRole) ? (
                <BusinessSuite
                  language={language}
                  currency={currency}
                  locale={locale}
                  businessId={cloudBusinessId}
                  demoMode={demoMode}
                  memberRole={memberRole}
                >
                  <OperationsCenter
                    businessId={cloudBusinessId}
                    language={language}
                    currency={currency}
                    locale={locale}
                    businessType={businessType}
                    memberRole={memberRole}
                    demoMode={demoMode}
                  />
                </BusinessSuite>
              ) : (
                <OperationsCenter
                  businessId={cloudBusinessId}
                  language={language}
                  currency={currency}
                  locale={locale}
                  businessType={businessType}
                  memberRole={memberRole}
                  demoMode={demoMode}
                />
              )
            )}

            {activeModule === "settings" && (
              <SettingsModule
                labels={labels}
                language={language}
                currency={currency}
                businessName={businessName}
                businessType={businessType}
                businessCountry={businessCountry}
                businessDescription={businessDescription}
                setBusinessName={setBusinessName}
                setBusinessType={setBusinessType}
                setBusinessCountry={setBusinessCountry}
                setBusinessDescription={setBusinessDescription}
                saveBusinessName={saveBusinessName}
                locale={locale}
              />
            )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <nav className="gs-mobile-dock fixed inset-x-0 bottom-0 z-50 border-t border-[var(--apex-border)] bg-[var(--apex-surface)]/96 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg lg:hidden">
        <div className="grid grid-cols-5 items-end gap-1">
          <MobileNavButton
            active={activeModule === "overview"}
            icon={<Store size={18} />}
            label={labels.nav.overview}
            onClick={() => setActiveModule("overview")}
          />
          <MobileNavButton
            active={activeModule === mobileLeftModule}
            icon={<MobileLeftIcon size={18} />}
            label={labels.nav[mobileLeftModule]}
            onClick={() => setActiveModule(mobileLeftModule)}
          />

          <button
            type="button"
            onClick={() => {
              if (!canUseScanner) return;
              setScannerOpen(true);
              scannerRef.current?.openCamera();
            }}
            disabled={!canUseScanner}
            className={
              "-mt-8 flex min-h-[72px] flex-col items-center justify-end gap-1 text-[10px] font-semibold text-[#8F0000] " +
              (!canUseScanner ? "pointer-events-none opacity-30" : "")
            }
            aria-label={labels.scan}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full border-[5px] border-[var(--apex-bg)] bg-[#8F0000] text-white shadow-[0_12px_34px_rgba(143,0,0,.36)]">
              <ScanLine size={25} />
            </span>
            <span>{labels.scan}</span>
          </button>

          <MobileNavButton
            active={activeModule === mobileRightModule}
            icon={<MobileRightIcon size={18} />}
            label={labels.nav[mobileRightModule]}
            onClick={() => setActiveModule(mobileRightModule)}
          />
          <MobileNavButton
            active={activeModuleLivesInMenu}
            icon={<Menu size={18} />}
            label={labels.more}
            onClick={() => setMoreOpen(true)}
          />
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end bg-black/55 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setMoreOpen(false);
            }}
          >
            <motion.div
              initial={{ transform: "translate3d(0,100%,0)" }}
              animate={{ transform: "translate3d(0,0,0)" }}
              exit={{ transform: "translate3d(0,100%,0)" }}
              transition={{
                duration: 0.28,
                ease: [0.32, 0.72, 0, 1]
              }}
              className="apex-scrollbar max-h-[84dvh] w-full overflow-y-auto rounded-t-[32px] border-t border-[var(--apex-border)] bg-[var(--apex-surface)] p-4 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-18px_60px_rgba(0,0,0,.18)]"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--apex-border)]" />

              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Logo className="h-7 w-7 shrink-0" aria-hidden="true" />
                    <p className="text-base font-semibold">
                      {labels.more}
                    </p>
                  </div>
                  <p className="mt-1.5 max-w-[260px] text-xs leading-5 text-[var(--apex-muted)]">
                    {mobileMenuSubtitle[language]}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-muted)]"
                  aria-label={labels.close}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-5">
                {navigationGroups.map((group) => {
                  const groupItems = group.modules
                    .filter(
                      (id) => visibleModuleIds.has(id)
                    )
                    .map((id) =>
                      modules.find((module) => module.id === id)
                    )
                    .filter(
                      (
                        item
                      ): item is (typeof modules)[number] =>
                        Boolean(item)
                    );

                  if (!groupItems.length && group.id !== "legal") return null;

                  return (
                    <section key={group.id}>
                      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--apex-muted)]">
                        {navigationGroupLabels[language][group.id]}
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {groupItems.map(({ id, icon: Icon }) => {
                          const active = activeModule === id;

                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setActiveModule(id);
                                setMoreOpen(false);
                              }}
                              className={
                                "flex min-h-[62px] items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-semibold transition-[background-color,border-color,color,box-shadow] " +
                                (active
                                  ? "border-[#8F0000]/35 bg-[#8F0000]/10 text-[var(--apex-text)] shadow-[0_8px_22px_rgba(143,0,0,.08)]"
                                  : "border-[var(--apex-border)] bg-[var(--apex-surface-strong)] text-[var(--apex-text)]")
                              }
                            >
                              <span
                                className={
                                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl " +
                                  (active
                                    ? "bg-[#8F0000] text-white"
                                    : "bg-[#8F0000]/10 text-[#8F0000]")
                                }
                              >
                                <Icon size={17} />
                              </span>
                              <motion.span
                                layoutId={"gs-mobile-shared-title-" + id}
                                className="min-w-0 leading-tight"
                                transition={{ duration: reduceMotion ? 0 : .26, ease: [0.22, 1, 0.36, 1] }}
                              >
                                {labels.nav[id]}
                              </motion.span>
                            </button>
                          );
                        })}
                        {group.id === "legal" && legalLinks.map(({ id, href, icon: Icon }) => (
                          <a
                            key={id}
                            href={href}
                            className="flex min-h-[62px] items-center gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3.5 text-left text-sm font-semibold text-[var(--apex-text)]"
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]">
                              <Icon size={17} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 break-words leading-tight">{legalLinkLabels[language][id]}</span>
                          </a>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>

              <div className="mt-5 border-t border-[var(--apex-border)] pt-5">
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

      <div
        className={
          scannerOpen
            ? "fixed inset-0 z-[130] overflow-y-auto bg-[var(--apex-bg)] px-3 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] sm:p-6"
            : "hidden"
        }
      >
            <div className="mx-auto max-w-5xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Logo className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
                      Global Stock
                    </p>
                  </div>
                  <h2 className="mt-1 text-xl font-semibold">
                    {labels.scannerTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    scannerRef.current?.stop();
                    setScannerOpen(false);
                  }}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]"
                  aria-label={labels.close}
                >
                  <X size={18} />
                </button>
              </div>

              <BarcodeScanner
                ref={scannerRef}
                language={language}
                businessId={cloudBusinessId}
                onProduct={integrateScannedProduct}
              />
            </div>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{
              opacity: 0,
              transform: "translate3d(-50%,12px,0) scale(.97)"
            }}
            animate={{
              opacity: 1,
              transform: "translate3d(-50%,0,0) scale(1)"
            }}
            exit={{
              opacity: 0,
              transform: "translate3d(-50%,8px,0) scale(.98)"
            }}
            transition={{
              duration: 0.18,
              ease: [0.23, 1, 0.32, 1]
            }}
            className="fixed bottom-28 left-1/2 z-[140] rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-2 text-xs font-semibold shadow-xl lg:bottom-6"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <ApexIntelligence
        snapshot={snapshot}
        accent={workspaceAccent}
        demoMode={demoMode}
        businessId={cloudBusinessId}
        raiseOnMobile={
          activeModule === "cash" && cashTab === "checkout" && cartLines.length > 0
        }
        appContext={{
          businessName,
          businessType,
          businessCountry,
          businessDescription,
          recentActivities: activities.slice(0, 80),
          notes: notes.slice(0, 80),
          fxHistory: fxHistory.slice(0, 60),
          activeModule
        }}
      />
    </motion.main>
  );
}

function OverviewModule({
  dark,
  language,
  workspaceAccent,
  onAccentChange,
  labels,
  metrics,
  chartData,
  money,
  setActiveModule,
  canOpenModule,
  showFinancials,
  recentActivities,
  todayNotes,
  activityText
}: {
  dark: boolean;
  language: LanguageCode;
  workspaceAccent: WorkspaceAccent;
  onAccentChange: (accent: WorkspaceAccent) => void;
  labels: (typeof copy)[LanguageCode];
  metrics: ReturnType<typeof calculateMetrics>;
  chartData: Array<{ label: string; revenue: number; cost: number; profit: number }>;
  money: (value: number) => string;
  currency: string;
  locale: string;
  setActiveModule: (id: ModuleId) => void;
  canOpenModule: (id: ModuleId) => boolean;
  showFinancials: boolean;
  recentActivities: ActivityRecord[];
  todayNotes: BusinessNote[];
  activityText: (activity: ActivityRecord) => string;
}) {
  return (
    <AnimatedHomeDashboard
      dark={dark}
      language={language}
      accent={workspaceAccent}
      onAccentChange={onAccentChange}
      labels={{
        title: labels.overviewTitle,
        subtitle: labels.overviewSubtitle,
        revenue: labels.revenue,
        inventoryCost: labels.inventoryCost,
        grossProfit: labels.grossProfit,
        stock: labels.stock,
        criticalStock: labels.criticalStock,
        units: labels.units,
        alerts: labels.alerts,
        salesFlow: labels.salesFlow,
        recentActivity: labels.recentActivity,
        todayNotes: labels.todayNotes,
        noActivities: labels.noActivities,
        noNotes: labels.noNotes,
        charts: labels.nav.charts,
        open: labels.open
      }}
      metrics={metrics}
      chartData={chartData}
      money={money}
      showFinancials={showFinancials}
      recentActivities={recentActivities.map(activityText)}
      todayNotes={todayNotes.map(note => note.text)}
      canOpenCharts={canOpenModule("charts")}
      canOpenActivities={canOpenModule("activities")}
      canOpenNotes={canOpenModule("notes")}
      openCharts={() => setActiveModule("charts")}
      openActivities={() => setActiveModule("activities")}
      openNotes={() => setActiveModule("notes")}
    />
  );
}

function PosModule({
  cashMode,
  labels,
  language,
  products,
  posVariants,
  locations,
  sellableStockByLocation,
  query,
  setQuery,
  cart,
  setQuantity,
  cartLines,
  cartSubtotal,
  promotionDiscount,
  promotionLabel,
  cartTotal,
  cartProfit,
  money,
  businessId,
  demoMode,
  sellableStockById,
  completeSale
}: {
  cashMode: boolean;
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
  products: Product[];
  posVariants: PosVariant[];
  locations: PosLocation[];
  sellableStockByLocation: Record<string, Record<string, number>>;
  query: string;
  setQuery: (value: string) => void;
  cart: Record<string, number>;
  setQuantity: (
    id: string,
    quantity: number,
    availableOverride?: number
  ) => void;
  cartLines: Array<{
    cartKey: string;
    product: Product;
    variant: PosVariant | null;
    quantity: number;
  }>;
  cartSubtotal: number;
  promotionDiscount: number;
  promotionLabel: string;
  cartTotal: number;
  cartProfit: number | null;
  money: (value: number) => string;
  businessId: string | null;
  demoMode: boolean;
  sellableStockById: Map<string, number>;
  completeSale: (
    payments?: PosPayment[],
    receivedAmount?: number,
    customerId?: string,
    locationId?: string
  ) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string; account_balance: number }>
  >([]);
  const [customerId, setCustomerId] = useState("");
  const [splitPayment, setSplitPayment] = useState(false);
  const [splitFirstAmount, setSplitFirstAmount] = useState("");
  const [secondPaymentMethod, setSecondPaymentMethod] = useState("debit");
  const [selectedVariantByProduct, setSelectedVariantByProduct] =
    useState<Record<string, string>>({});
  const [selectedLocation, setSelectedLocation] = useState("");
  const [scanEntry, setScanEntry] = useState("");
  const [scanFeedback, setScanFeedback] = useState("");
  const [clearCashConfirm, setClearCashConfirm] = useState(false);
  const cashScanRef = useRef<HTMLInputElement>(null);

  // Most USB/Bluetooth barcode readers emulate a keyboard and send Enter.
  useEffect(() => {
    if (cashMode && window.matchMedia("(pointer: fine)").matches) {
      cashScanRef.current?.focus();
    }
  }, [cashMode]);

  useEffect(() => {
    if (!locations.length) {
      setSelectedLocation("");
      return;
    }

    setSelectedLocation((current) =>
      current && locations.some((location) => location.id === current)
        ? current
        : locations[0].id
    );
  }, [locations]);

  useEffect(() => {
    if (!businessId || demoMode) {
      setCustomers([]);
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    void supabase
      .from("global_stock_customers")
      .select("id,name,account_balance")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        if (!cancelled) {
          setCustomers(
            (data as Array<{
              id: string;
              name: string;
              account_balance: number;
            }> | null) ?? []
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [businessId, demoMode]);

  const received = Math.max(0, Number(receivedAmount.replace(",", ".")) || 0);
  const firstSplit = Math.max(
    0,
    Math.min(
      cartTotal,
      Number(splitFirstAmount.replace(",", ".")) || 0
    )
  );
  const secondSplit = Math.max(0, cartTotal - firstSplit);
  const payments: PosPayment[] = splitPayment
    ? [
        { method: paymentMethod, amount: firstSplit },
        { method: secondPaymentMethod, amount: secondSplit }
      ].filter((payment) => payment.amount > 0)
    : [{ method: paymentMethod, amount: cartTotal }];

  const accountPaymentUsed = payments.some(
    (payment) => payment.method === "account"
  );
  const splitInvalid =
    splitPayment &&
    (firstSplit <= 0 ||
      secondSplit <= 0 ||
      paymentMethod === secondPaymentMethod);
  const cashInsufficient =
    !splitPayment &&
    paymentMethod === "cash" &&
    cartLines.length > 0 &&
    received < cartTotal;
  const customerRequired = accountPaymentUsed && !customerId;
  const change =
    !splitPayment && paymentMethod === "cash"
      ? Math.max(0, received - cartTotal)
      : 0;

  function finishSale() {
    if (
      !cartLines.length ||
      cashInsufficient ||
      splitInvalid ||
      customerRequired
    ) {
      return;
    }

    completeSale(
      payments,
      !splitPayment && paymentMethod === "cash" ? received : undefined,
      customerId || undefined,
      selectedLocation || undefined
    );

    setReceivedAmount("");
    setSplitFirstAmount("");
  }


  const cashLabels = ({
    es: {
      reader: "Escáner de caja", readerHint: "Escaneá con un lector USB/Bluetooth o ingresá el código y presioná Enter.",
      input: "Código de barras, SKU o nombre exacto", add: "Agregar artículo", matches: "Coincidencias del catálogo",
      notFound: "No encontramos ese código. Revisalo o elegí una coincidencia.",
      ambiguous: "Hay varias variantes para ese código. Elegí la correcta en la lista.",
      stockLimit: "Stock insuficiente", added: "Agregado", ticket: "Ticket de venta",
      items: "unidades", clear: "Vaciar ticket", clearConfirm: "Confirmar vaciado",
      empty: "Listo para escanear", emptyHint: "El primer producto aparecerá acá al escanear su código.",
      barcode: "Código", unit: "Precio unitario", qty: "Cantidad", lineTotal: "Importe",
      noDiscount: "Sin descuento", savings: "Ahorro por precios rebajados (ya incluido)",
      remove: "Quitar producto", subtotal: "Subtotal", checkout: "Cobro", products: "Productos"
    },
    en: {
      reader: "Checkout scanner", readerHint: "Use a USB/Bluetooth scanner or type the code and press Enter.",
      input: "Barcode, SKU or exact product name", add: "Add item", matches: "Catalog matches",
      notFound: "Code not found. Check it or choose a match.",
      ambiguous: "Multiple variants match. Choose the correct one below.",
      stockLimit: "Insufficient stock", added: "Added", ticket: "Sales receipt",
      items: "items", clear: "Clear receipt", clearConfirm: "Confirm clearing",
      empty: "Ready to scan", emptyHint: "Scanned products will appear here.",
      barcode: "Code", unit: "Unit price", qty: "Quantity", lineTotal: "Amount",
      noDiscount: "No discount", savings: "Savings already included in prices",
      remove: "Remove item", subtotal: "Subtotal", checkout: "Checkout", products: "Products"
    },
    pt: {
      reader: "Leitor de caixa", readerHint: "Escaneie com leitor USB/Bluetooth ou digite o código e pressione Enter.",
      input: "Código de barras, SKU ou nome exato", add: "Adicionar item", matches: "Resultados do catálogo",
      notFound: "Código não encontrado. Confira ou escolha uma opção.",
      ambiguous: "Há várias variantes. Escolha a correta abaixo.",
      stockLimit: "Estoque insuficiente", added: "Adicionado", ticket: "Cupom de venda",
      items: "unidades", clear: "Limpar cupom", clearConfirm: "Confirmar limpeza",
      empty: "Pronto para escanear", emptyHint: "O primeiro produto aparecerá aqui após a leitura.",
      barcode: "Código", unit: "Preço unitário", qty: "Quantidade", lineTotal: "Valor",
      noDiscount: "Sem desconto", savings: "Economia já incluída nos preços",
      remove: "Remover produto", subtotal: "Subtotal", checkout: "Pagamento", products: "Produtos"
    },
    fr: {
      reader: "Scanner de caisse", readerHint: "Scannez avec un lecteur USB/Bluetooth ou saisissez le code puis Entrée.",
      input: "Code-barres, SKU ou nom exact", add: "Ajouter", matches: "Résultats du catalogue",
      notFound: "Code introuvable. Vérifiez ou choisissez un résultat.",
      ambiguous: "Plusieurs variantes correspondent. Choisissez ci-dessous.",
      stockLimit: "Stock insuffisant", added: "Ajouté", ticket: "Ticket de caisse",
      items: "articles", clear: "Vider le ticket", clearConfirm: "Confirmer",
      empty: "Prêt à scanner", emptyHint: "Le premier produit scanné apparaîtra ici.",
      barcode: "Code", unit: "Prix unitaire", qty: "Quantité", lineTotal: "Montant",
      noDiscount: "Sans remise", savings: "Économies déjà incluses",
      remove: "Retirer le produit", subtotal: "Sous-total", checkout: "Paiement", products: "Produits"
    },
    de: {
      reader: "Kassenscanner", readerHint: "Mit USB/Bluetooth-Scanner scannen oder Code eingeben und Enter drücken.",
      input: "Barcode, SKU oder genauer Name", add: "Artikel hinzufügen", matches: "Katalogtreffer",
      notFound: "Code nicht gefunden. Prüfen oder Treffer auswählen.",
      ambiguous: "Mehrere Varianten gefunden. Bitte unten auswählen.",
      stockLimit: "Nicht genügend Bestand", added: "Hinzugefügt", ticket: "Kassenbon",
      items: "Stück", clear: "Bon leeren", clearConfirm: "Leeren bestätigen",
      empty: "Bereit zum Scannen", emptyHint: "Der erste gescannte Artikel erscheint hier.",
      barcode: "Code", unit: "Stückpreis", qty: "Menge", lineTotal: "Betrag",
      noDiscount: "Kein Rabatt", savings: "Ersparnis bereits im Preis enthalten",
      remove: "Artikel entfernen", subtotal: "Zwischensumme", checkout: "Bezahlen", products: "Produkte"
    }
  })[language];

  const cashSuggestions = useMemo(() => {
    const search = scanEntry.trim().toLocaleLowerCase();
    const result: Array<{ product: Product; variant: PosVariant | null }> = [];
    if (!cashMode || !search) return result;

    for (const product of products) {
      const baseMatch = [product.name, product.barcode, product.id, product.category]
        .some((value) => value.toLocaleLowerCase().includes(search));
      const variants = posVariants.filter((variant) => variant.productKey === product.id);

      if (!variants.length && baseMatch) {
        result.push({ product, variant: null });
      } else {
        for (const variant of variants) {
          const variantMatch = [variant.name, variant.sku, variant.barcode]
            .some((value) => value.toLocaleLowerCase().includes(search));
          if (baseMatch || variantMatch) result.push({ product, variant });
          if (result.length >= 7) break;
        }
      }
      if (result.length >= 7) break;
    }
    return result.slice(0, 6);
  }, [cashMode, scanEntry, products, posVariants]);

  const discountedPriceSavings = cartLines.reduce((sum, line) => {
    if (line.variant) return sum;
    return sum + Math.max(0, (line.product.originalPrice ?? line.product.price) - line.product.price) * line.quantity;
  }, 0);

  function availableForCash(product: Product, variant: PosVariant | null) {
    return variant
      ? selectedLocation
        ? variant.stockByLocation[selectedLocation] ?? 0
        : variant.stock
      : selectedLocation
        ? sellableStockByLocation[product.id]?.[selectedLocation] ?? 0
        : sellableStockById.get(product.id) ?? product.stock;
  }

  function addCashItem(product: Product, variant: PosVariant | null = null) {
    const key = variantCartKey(product.id, variant?.id);
    const available = availableForCash(product, variant);
    if ((cart[key] ?? 0) >= available) {
      setScanFeedback(`${cashLabels.stockLimit}: ${product.name} (${available}).`);
      return;
    }
    setQuantity(key, (cart[key] ?? 0) + 1, available);
    setScanEntry("");
    setScanFeedback(`${cashLabels.added}: ${product.name}${variant ? " · " + variant.name : ""} (+1)`);
    setClearCashConfirm(false);
  }

  function applyCashCode(raw: string) {
    const code = raw.trim().toLocaleLowerCase();
    if (!code) return;

    const variants = posVariants.filter(
      (variant) =>
        products.some((product) => product.id === variant.productKey) &&
        [variant.barcode, variant.sku].some((value) => value.trim().toLocaleLowerCase() === code)
    );
    if (variants.length === 1) {
      const product = products.find((item) => item.id === variants[0].productKey);
      if (product) addCashItem(product, variants[0]);
      return;
    }
    if (variants.length > 1) {
      setScanFeedback(cashLabels.ambiguous);
      return;
    }

    const exactProducts = products.filter(
      (product) =>
        product.barcode.trim().toLocaleLowerCase() === code ||
        product.id.toLocaleLowerCase() === code ||
        product.name.trim().toLocaleLowerCase() === code
    );
    if (exactProducts.length !== 1) {
      setScanFeedback(exactProducts.length > 1 ? cashLabels.ambiguous : cashLabels.notFound);
      return;
    }
    const product = exactProducts[0];
    const productVariants = posVariants.filter((variant) => variant.productKey === product.id);
    if (productVariants.length > 1) {
      setScanFeedback(cashLabels.ambiguous);
      return;
    }
    addCashItem(product, productVariants[0] ?? null);
  }

  function submitCashCode() {
    applyCashCode(scanEntry);
  }

  return (
    <div className="space-y-5">
      <PageIntro
        title={cashMode ? labels.nav.cash : labels.posTitle}
        subtitle={cashMode
          ? (language === "es"
            ? "Escaneá artículos, aplicá promociones y calculá el vuelto antes de registrar el cobro."
            : language === "en"
              ? "Scan products, apply promotions and calculate change before confirming payment."
              : language === "pt"
                ? "Escaneie produtos, aplique promoções e calcule o troco antes de registrar o pagamento."
                : language === "fr"
                  ? "Scannez vos produits, appliquez les remises et calculez la monnaie."
                  : "Produkte scannen, Rabatte anwenden und Rückgeld berechnen.")
          : labels.posSubtitle}
      />
      {!cashMode && <WorkflowHelp {...workflowHelp[language].pos} />}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          {locations.length > 0 && (
            <div className="apex-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                  {language === "es" ? "Ubicación de venta" : "Sale location"}
                </p>
                <p className="mt-1 text-xs text-[var(--apex-muted)]">
                  {cartLines.length
                    ? language === "es"
                      ? "La ubicación queda fija mientras haya productos en el carrito."
                      : "Location is locked while the cart has items."
                    : language === "es"
                      ? "El stock se descuenta de esta sucursal o depósito."
                      : "Stock is deducted from this store or warehouse."}
                </p>
              </div>
              <ApexSelect
                className="apex-input min-h-11 min-w-52 px-3 text-sm"
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                disabled={Boolean(cartLines.length)}
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </ApexSelect>
            </div>
          )}

          {cashMode ? (
            <div className="apex-card overflow-hidden p-0">
              <div className="border-b border-[var(--apex-border)] p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--apex-accent-soft)] text-[var(--apex-accent)]">
                    <ScanLine size={20} aria-hidden="true" />
                  </span>
                  <h2 className="text-base font-bold">{cashLabels.reader}</h2>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-[var(--apex-muted)]">{cashLabels.readerHint}</p>
                <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); submitCashCode(); cashScanRef.current?.focus(); }}>
                  <input
                    ref={cashScanRef}
                    autoComplete="off"
                    aria-label={cashLabels.input}
                    value={scanEntry}
                    onChange={(event) => { setScanEntry(event.target.value); setScanFeedback(""); }}
                    placeholder={cashLabels.input}
                    className="apex-input min-h-12 min-w-0 flex-1 px-4 text-sm"
                  />
                  <button type="submit" disabled={!scanEntry.trim()}
                    className="min-h-12 rounded-xl bg-[var(--apex-accent)] px-5 text-sm font-semibold text-white transition-opacity disabled:opacity-40">
                    {cashLabels.add}
                  </button>
                </form>
                {scanFeedback && <p role="status" aria-live="polite" className="mt-3 rounded-xl bg-[var(--apex-bg)] px-3 py-2 text-xs">{scanFeedback}</p>}
                <CashDeviceScanner language={language} onCode={(code) => { applyCashCode(code); cashScanRef.current?.focus(); }}/>
                {scanEntry.trim() && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[var(--apex-border)]">
                    <div className="border-b border-[var(--apex-border)] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--apex-muted)]">
                      {cashLabels.matches}
                    </div>
                    {cashSuggestions.length ? cashSuggestions.map(({ product, variant }) => {
                      const price = variant?.price ?? product.price;
                      const available = availableForCash(product, variant);
                      return (
                        <button key={variantCartKey(product.id, variant?.id)} type="button"
                          disabled={available <= (cart[variantCartKey(product.id, variant?.id)] ?? 0)}
                          onClick={() => { addCashItem(product, variant); cashScanRef.current?.focus(); }}
                          className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-[var(--apex-border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--apex-bg)] disabled:opacity-40">
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold">{product.name}{variant ? " · " + variant.name : ""}</span>
                            <span className="block truncate text-[10px] text-[var(--apex-muted)]">{variant?.barcode || variant?.sku || product.barcode || product.id}</span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold">{money(price)}</span>
                        </button>
                      );
                    }) : (
                      <p className="px-3 py-3 text-xs text-[var(--apex-muted)]">{cashLabels.notFound}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--apex-border)] px-4 py-3 sm:px-5">
                <div>
                  <h2 className="text-sm font-bold">{cashLabels.ticket}</h2>
                  <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                    {cartLines.length} {cashLabels.products.toLocaleLowerCase()} · {cartLines.reduce((sum, line) => sum + line.quantity, 0)} {cashLabels.items}
                  </p>
                </div>
                {cartLines.length > 0 && (
                  <button type="button"
                    onClick={() => {
                      if (!clearCashConfirm) { setClearCashConfirm(true); return; }
                      for (const line of cartLines) setQuantity(line.cartKey, 0);
                      setClearCashConfirm(false);
                      setScanFeedback("");
                      cashScanRef.current?.focus();
                    }}
                    className="rounded-xl border border-[var(--apex-border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--apex-bg)]">
                    {clearCashConfirm ? cashLabels.clearConfirm : cashLabels.clear}
                  </button>
                )}
              </div>

              {!cartLines.length ? (
                <div className="flex min-h-52 flex-col items-center justify-center px-4 py-10 text-center">
                  <ScanLine size={30} className="mb-3 text-[var(--apex-accent)]" aria-hidden="true" />
                  <p className="text-sm font-bold">{cashLabels.empty}</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--apex-muted)]">{cashLabels.emptyHint}</p>
                </div>
              ) : (
                <div className="max-h-[540px] overflow-y-auto">
                  <div className="hidden grid-cols-[minmax(0,1fr)_110px_122px_125px_30px] gap-3 border-b border-[var(--apex-border)] bg-[var(--apex-bg)] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--apex-muted)] md:grid sm:px-5">
                    <span>{cashLabels.products}</span>
                    <span>{cashLabels.unit}</span>
                    <span>{cashLabels.qty}</span>
                    <span className="text-right">{cashLabels.lineTotal}</span>
                    <span />
                  </div>
                  {cartLines.map(({ cartKey, product, variant, quantity }, index) => {
                    const price = variant?.price ?? product.price;
                    const previousPrice = !variant && (product.originalPrice ?? 0) > price ? product.originalPrice ?? 0 : null;
                    const percent = previousPrice ? Math.round((1 - price / previousPrice) * 100) : !variant ? Math.max(0, product.discountPercent ?? 0) : 0;
                    const available = availableForCash(product, variant);
                    return (
                      <div key={cartKey} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 border-b border-[var(--apex-border)] px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_110px_122px_125px_30px] sm:px-5">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-[var(--apex-muted)]">#{String(index + 1).padStart(2, "0")} · {cashLabels.barcode}: {variant?.barcode || variant?.sku || product.barcode || "—"}</p>
                          <p className="mt-1 break-words text-sm font-bold">{product.name}</p>
                          {variant && <p className="mt-0.5 text-[11px] text-[var(--apex-muted)]">{variant.name}</p>}
                          <p className={"mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold " + (percent > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-[var(--apex-bg)] text-[var(--apex-muted)]")}>
                            {percent > 0 ? percent + "% off" : cashLabels.noDiscount}
                          </p>
                        </div>
                        <div className="text-right md:text-left">
                          <span className="block text-[10px] text-[var(--apex-muted)] md:hidden">{cashLabels.unit}</span>
                          {previousPrice && <span className="block text-[10px] text-[var(--apex-muted)] line-through">{money(previousPrice)}</span>}
                          <span className="text-xs font-semibold">{money(price)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button type="button" aria-label={"− " + product.name}
                            onClick={() => setQuantity(cartKey, quantity - 1, available)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--apex-border)] hover:bg-[var(--apex-bg)]"><Minus size={14} /></button>
                          <span className="min-w-8 text-center text-sm font-bold tabular-nums">{quantity}</span>
                          <button type="button" aria-label={"+ " + product.name} disabled={quantity >= available}
                            onClick={() => setQuantity(cartKey, quantity + 1, available)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--apex-border)] hover:bg-[var(--apex-bg)] disabled:opacity-30"><Plus size={14} /></button>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] text-[var(--apex-muted)] md:hidden">{cashLabels.lineTotal}</span>
                          <strong className="text-sm tabular-nums">{money(price * quantity)}</strong>
                        </div>
                        <button type="button" aria-label={cashLabels.remove + ": " + product.name}
                          onClick={() => setQuantity(cartKey, 0)}
                          className="grid h-8 w-8 place-items-center justify-self-end rounded-lg text-[var(--apex-muted)] hover:bg-rose-500/10 hover:text-rose-600">
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
          <label className="relative block">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--apex-muted)]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchProducts}
              className="apex-input py-3.5 pl-11 pr-4"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => {
              const variants = posVariants.filter(
                (variant) => variant.productKey === product.id
              );
              const selectedVariantId =
                selectedVariantByProduct[product.id] ||
                variants[0]?.id ||
                "";
              const selectedVariant =
                variants.find(
                  (variant) => variant.id === selectedVariantId
                ) ?? null;
              const key = variantCartKey(
                product.id,
                selectedVariant?.id
              );
              const availableStock = selectedVariant
                ? selectedLocation
                  ? selectedVariant.stockByLocation[selectedLocation] ?? 0
                  : selectedVariant.stock
                : selectedLocation
                  ? sellableStockByLocation[product.id]?.[
                      selectedLocation
                    ] ?? 0
                  : sellableStockById.get(product.id) ?? product.stock;
              const displayPrice =
                selectedVariant?.price ?? product.price;

              return (
              <article key={product.id} className="apex-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
                    <Store size={17} />
                  </span>
                  <span className="rounded-full border border-[var(--apex-border)] px-2.5 py-1 text-[10px] text-[var(--apex-muted)]">
                    {availableStock} {labels.stock}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold">
                  {product.name}
                </h3>
                <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                  {product.category}
                </p>

                {variants.length > 0 && (
                  <ApexSelect
                    className="apex-input mt-3 min-h-10 w-full px-3 text-xs"
                    value={selectedVariantId}
                    onChange={(event) =>
                      setSelectedVariantByProduct((current) => ({
                        ...current,
                        [product.id]: event.target.value
                      }))
                    }
                  >
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name}
                        {variant.stock >= 0
                          ? " · stock " + String(variant.stock)
                          : ""}
                      </option>
                    ))}
                  </ApexSelect>
                )}

                <p className="mt-4 text-lg font-semibold">
                  {money(displayPrice)}
                </p>
                <button
                  type="button"
                  disabled={availableStock <= 0}
                  onClick={() =>
                    setQuantity(
                      key,
                      (cart[key] ?? 0) + 1,
                      availableStock
                    )
                  }
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white disabled:opacity-35"
                >
                  <Plus size={16} />
                  {labels.add}
                </button>
              </article>
              );
            })}
          </div>
            </>
          )}
        </section>

        <aside className="apex-card h-fit p-5 xl:sticky xl:top-24">
          <h2 className="text-lg font-semibold">{cashMode ? cashLabels.checkout : labels.cart}</h2>
          {cashMode && <p className="mt-2 text-xs text-[var(--apex-muted)]">{cartLines.reduce((sum, line) => sum + line.quantity, 0)} {cashLabels.items}</p>}

          {!cashMode && (!cartLines.length ? (
            <p className="mt-4 text-sm text-[var(--apex-muted)]">
              {labels.emptyCart}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {cartLines.map(
                ({ cartKey, product, variant, quantity }) => {
                  const lineAvailable = variant
                    ? selectedLocation
                      ? variant.stockByLocation[selectedLocation] ?? 0
                      : variant.stock
                    : selectedLocation
                      ? sellableStockByLocation[product.id]?.[
                          selectedLocation
                        ] ?? 0
                      : sellableStockById.get(product.id) ?? product.stock;

                  return (
                <div
                  key={cartKey}
                  className="rounded-2xl border border-[var(--apex-border)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {product.name}
                      </p>
                      {variant && (
                        <p className="mt-1 text-[10px] font-semibold text-[#8F0000]">
                          {variant.name}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                        {money(variant?.price ?? product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            cartKey,
                            quantity - 1,
                            lineAvailable
                          )
                        }
                        className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--apex-border)]"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            cartKey,
                            quantity + 1,
                            lineAvailable
                          )
                        }
                        className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--apex-border)]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                  );
                }
              )}
            </div>
          ))}

          <div className="mt-5 space-y-2 border-t border-[var(--apex-border)] pt-4 text-sm">
            {(cashMode || promotionDiscount > 0) && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--apex-muted)]">
                    {language === "es" ? "Subtotal" : "Subtotal"}
                  </span>
                  <span>{money(cartSubtotal)}</span>
                </div>
                {promotionDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>
                    {promotionLabel ||
                      (language === "es" ? "Promoción" : "Promotion")}
                  </span>
                  <strong>-{money(promotionDiscount)}</strong>
                </div>
                )}
              </>
            )}
            {cashMode && discountedPriceSavings > 0 && (
              <div className="flex items-center justify-between gap-3 text-xs text-emerald-600">
                <span>{cashLabels.savings}</span>
                <strong>{money(discountedPriceSavings)}</strong>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[var(--apex-muted)]">
                {labels.total}
              </span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--apex-muted)]">
                {labels.estimatedProfit}
              </span>
              <strong>{cartProfit === null ? "—" : money(cartProfit)}</strong>
            </div>
          </div>

          <div className="mt-5 border-t border-[var(--apex-border)] pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
              {language === "es"
                ? "Cliente"
                : language === "pt"
                  ? "Cliente"
                  : language === "fr"
                    ? "Client"
                    : language === "de"
                      ? "Kunde"
                      : "Customer"}
            </p>
            <ApexSelect
              className="apex-input mt-2 min-h-11 w-full px-3 text-sm"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">
                {language === "es"
                  ? "Consumidor final / sin cliente"
                  : "Walk-in / no customer"}
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.account_balance
                    ? ` · ${money(customer.account_balance)}`
                    : ""}
                </option>
              ))}
            </ApexSelect>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {language === "es"
                  ? "Medio de pago"
                  : language === "pt"
                    ? "Forma de pagamento"
                    : language === "fr"
                      ? "Moyen de paiement"
                      : language === "de"
                        ? "Zahlungsart"
                        : "Payment method"}
              </p>
              <button
                type="button"
                onClick={() => setSplitPayment((current) => !current)}
                className={
                  "rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold " +
                  (splitPayment
                    ? "border-[#8F0000]/50 bg-[#8F0000]/10 text-[#8F0000]"
                    : "border-[var(--apex-border)] text-[var(--apex-muted)]")
                }
              >
                {language === "es"
                  ? splitPayment
                    ? "Pago combinado ON"
                    : "Pago combinado"
                  : splitPayment
                    ? "Split ON"
                    : "Split payment"}
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <ApexSelect
                className="apex-input min-h-11 px-3 text-sm"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="cash">
                  {language === "es" ? "Efectivo" : language === "pt" ? "Dinheiro" : language === "fr" ? "Espèces" : language === "de" ? "Bargeld" : "Cash"}
                </option>
                <option value="debit">
                  {language === "es" ? "Débito" : language === "pt" ? "Débito" : language === "fr" ? "Débit" : language === "de" ? "Debitkarte" : "Debit"}
                </option>
                <option value="credit">
                  {language === "es" ? "Crédito" : language === "pt" ? "Crédito" : language === "fr" ? "Crédit" : language === "de" ? "Kreditkarte" : "Credit"}
                </option>
                <option value="transfer">
                  {language === "es" ? "Transferencia" : language === "pt" ? "Transferência" : language === "fr" ? "Virement" : language === "de" ? "Überweisung" : "Transfer"}
                </option>
                <option value="qr">QR</option>
                <option value="account">
                  {language === "es" ? "Cuenta corriente" : language === "pt" ? "Conta corrente" : language === "fr" ? "Compte client" : language === "de" ? "Kundenkonto" : "Customer account"}
                </option>
              </ApexSelect>

              {paymentMethod === "cash" ? (
                <input
                  className="apex-input min-h-11 px-3 text-sm"
                  inputMode="decimal"
                  placeholder={
                    language === "es"
                      ? "Recibido"
                      : language === "pt"
                        ? "Recebido"
                        : language === "fr"
                          ? "Reçu"
                          : language === "de"
                            ? "Erhalten"
                            : "Received"
                  }
                  value={receivedAmount}
                  onChange={(event) => setReceivedAmount(event.target.value)}
                />
              ) : (
                <div className="flex min-h-11 items-center rounded-2xl border border-[var(--apex-border)] px-3 text-xs text-[var(--apex-muted)]">
                  {language === "es"
                    ? "Cobro electrónico"
                    : language === "pt"
                      ? "Pagamento eletrônico"
                      : language === "fr"
                        ? "Paiement électronique"
                        : language === "de"
                          ? "Elektronische Zahlung"
                          : "Electronic payment"}
                </div>
              )}
            </div>

            {splitPayment && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  className="apex-input min-h-11 px-3 text-sm"
                  inputMode="decimal"
                  placeholder={
                    language === "es"
                      ? "Importe primer medio"
                      : "First payment amount"
                  }
                  value={splitFirstAmount}
                  onChange={(event) =>
                    setSplitFirstAmount(event.target.value)
                  }
                />
                <ApexSelect
                  className="apex-input min-h-11 px-3 text-sm"
                  value={secondPaymentMethod}
                  onChange={(event) =>
                    setSecondPaymentMethod(event.target.value)
                  }
                >
                  <option value="cash">Efectivo</option>
                  <option value="debit">Débito</option>
                  <option value="credit">Crédito</option>
                  <option value="transfer">Transferencia</option>
                  <option value="qr">QR</option>
                  <option value="account">Cuenta corriente</option>
                </ApexSelect>
                <div className="col-span-2 flex items-center justify-between rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-3 py-2.5 text-xs">
                  <span className="text-[var(--apex-muted)]">
                    {language === "es"
                      ? "Segundo medio"
                      : "Second payment"}
                  </span>
                  <strong>{money(secondSplit)}</strong>
                </div>
              </div>
            )}

            {accountPaymentUsed && !customerId && (
              <p className="mt-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[10px] text-amber-600">
                {language === "es"
                  ? "Elegí un cliente para usar cuenta corriente."
                  : "Choose a customer for customer-account payment."}
              </p>
            )}

            {!splitPayment && paymentMethod === "cash" && cartLines.length > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-bg)] px-3 py-2.5 text-sm">
                <span className="text-[var(--apex-muted)]">
                  {language === "es"
                    ? "Vuelto"
                    : language === "pt"
                      ? "Troco"
                      : language === "fr"
                        ? "Monnaie"
                        : language === "de"
                          ? "Rückgeld"
                          : "Change"}
                </span>
                <strong>{money(change)}</strong>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={
              !cartLines.length ||
              cashInsufficient ||
              splitInvalid ||
              customerRequired
            }
            onClick={finishSale}
            className="mt-5 w-full rounded-2xl bg-[#8F0000] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-35"
          >
            {labels.completeSale}
          </button>
        </aside>
      </div>

      {cartLines.length > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(82px+env(safe-area-inset-bottom,0px))] z-[70] rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]/96 p-2.5 shadow-[0_18px_60px_rgba(0,0,0,.28)] backdrop-blur-lg lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
                {labels.total}
              </p>
              <p className="truncate text-base font-semibold">{money(cartTotal)}</p>
            </div>
            <button
              type="button"
              onClick={finishSale}
              disabled={
                cashInsufficient || splitInvalid || customerRequired
              }
              className="min-h-12 shrink-0 rounded-2xl bg-[#8F0000] px-5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(143,0,0,.24)] disabled:opacity-35"
            >
              {labels.completeSale}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryModule({
  labels,
  language,
  products,
  money,
  updateStock,
  addStock,
  updatePrice,
  updateCost,
  updateMinStock,
  updateSupplier,
  updateBarcode,
  updateInventoryDetails,
  businessType,
  accent,
  integrateScannedProduct,
  businessId,
  readOnly
}: {
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
  products: Product[];
  money: (value: number) => string;
  updateStock: (id: string, stock: number) => void;
  addStock: (id: string, quantity: number, operationId: string) => Promise<number>;
  updatePrice: (id: string, price: number) => void;
  updateCost: (id: string, value: string) => void;
  updateMinStock: (id: string, minStock: number) => void;
  updateSupplier: (id: string, supplier: string) => void;
  updateBarcode: (id: string, barcode: string) => void;
  updateInventoryDetails: (id: string, details: ProductInventoryDetails) => void;
  businessType: BusinessType;
  accent: WorkspaceAccent;
  integrateScannedProduct: (product: Product) => void;
  businessId: string | null;
  readOnly: boolean;
}) {
  return (
    <div className="space-y-5">
      <PageIntro title={labels.inventoryTitle} subtitle={labels.inventorySubtitle} />
      <InventoryControlCenter
        language={language}
        businessType={businessType}
        accent={accent}
        products={products}
        money={money}
        readOnly={readOnly}
        onUpdateStock={updateStock}
        onAddStock={addStock}
        onUpdatePrice={updatePrice}
        onUpdateCost={updateCost}
        onUpdateMinimum={updateMinStock}
        onUpdateSupplier={updateSupplier}
        onUpdateBarcode={updateBarcode}
        onUpdateDetails={updateInventoryDetails}
      />
      {!readOnly && (
        <details className="apex-card group overflow-hidden p-4 sm:p-5">
          <summary className="cursor-pointer select-none text-sm font-semibold marker:text-[var(--apex-accent)]">
            {language === "es" ? "Herramientas de códigos de barras y escaneo" :
              language === "pt" ? "Ferramentas de códigos de barras e leitura" :
              language === "fr" ? "Outils de codes-barres et de scan" :
              language === "de" ? "Barcode- und Scanner-Werkzeuge" :
              "Barcode and scanning tools"}
          </summary>
          <div className="mt-5 space-y-4">
            <BarcodeLabelStudio language={language} products={products} money={money} onAssignBarcode={updateBarcode} />
            <BarcodeScanner onProduct={integrateScannedProduct} language={language} businessId={businessId} />
          </div>
        </details>
      )}
    </div>
  );
}

function PurchasesModule({
  labels,
  language,
  restock,
  money,
  showFinancials,
  receiveRestock
}: {
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
  restock: ReturnType<typeof rankRestockNeeds>;
  money: (value: number) => string;
  showFinancials: boolean;
  receiveRestock: (id: string, units: number) => void;
}) {
  const [plannedUnits, setPlannedUnits] = useState<Record<string, number>>({});

  const noRestockText =
    language === "es"
      ? "No hay productos que requieran reposición con los datos actuales."
      : language === "pt"
        ? "Não há produtos que precisem de reposição com os dados atuais."
        : language === "fr"
          ? "Aucun produit ne nécessite de réapprovisionnement avec les données actuelles."
          : language === "de"
            ? "Mit den aktuellen Daten ist keine Nachbestellung erforderlich."
            : "No products need restocking with the current data.";

  return (
    <div className="space-y-5">
      <PageIntro
        title={labels.purchasesTitle}
        subtitle={labels.purchasesSubtitle}
      />
      <WorkflowHelp {...workflowHelp[language].purchases} />

      {!restock.length ? (
        <section className="apex-card p-6 text-sm text-[var(--apex-muted)]">
          {noRestockText}
        </section>
      ) : (
        <div className="grid gap-3">
          {restock.map(
            ({ product, daysCover, suggestedUnits }) => {
              const units = Math.max(
                1,
                Math.round(plannedUnits[product.id] ?? suggestedUnits)
              );

              return (
                <article key={product.id} className="apex-card p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 xl:w-[260px]">
                      <h3 className="truncate text-sm font-semibold">
                        {product.name}
                      </h3>
                      <p className="mt-1 truncate text-[11px] text-[var(--apex-muted)]">
                        {product.supplier || "—"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[470px]">
                      <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                          {labels.suggested}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <div className="inline-flex h-10 items-center gap-1 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-1 transition-colors focus-within:border-[var(--apex-accent)]">
                            <button type="button" disabled={units <= 1}
                              onClick={() => setPlannedUnits(current => ({...current,[product.id]:Math.max(1,units-1)}))}
                              aria-label={language === "es" ? "Restar una unidad" : "Decrease by one"}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--apex-muted)] hover:bg-[var(--apex-bg)] disabled:opacity-30">
                              <Minus size={14}/>
                            </button>
                            <input
                              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={9}
                              value={String(units)}
                              onChange={event => {
                                const raw=event.target.value;
                                if (!/^\d*$/.test(raw)) return;
                                setPlannedUnits(current => ({...current,[product.id]:Math.max(1,Math.min(1_000_000,Number(raw)||1))}));
                              }}
                              onKeyDown={event => {
                                if(event.key!=="ArrowUp"&&event.key!=="ArrowDown")return;
                                event.preventDefault();
                                const delta=event.key==="ArrowUp"?1:-1;
                                setPlannedUnits(current=>({...current,[product.id]:Math.max(1,Math.min(1_000_000,units+delta))}));
                              }}
                              className="w-[60px] bg-transparent text-center text-sm font-semibold tabular-nums text-[var(--apex-text)] outline-none focus:outline-none focus-visible:!outline-none"
                              aria-label={labels.suggested}
                            />
                            <button type="button" onClick={()=>setPlannedUnits(current=>({...current,[product.id]:Math.min(1_000_000,units+1)}))}
                              aria-label={language==="es"?"Sumar una unidad":"Increase by one"}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--apex-muted)] hover:bg-[var(--apex-bg)]">
                              <Plus size={14}/>
                            </button>
                          </div>
                          <span className="text-[10px] text-[var(--apex-muted)]">
                            {suggestedUnits !== units
                              ? language === "es"
                                ? `sugerencia: ${suggestedUnits}`
                                : language === "pt"
                                  ? `sugestão: ${suggestedUnits}`
                                  : language === "fr"
                                    ? `suggestion : ${suggestedUnits}`
                                    : language === "de"
                                      ? `Vorschlag: ${suggestedUnits}`
                                      : `suggested: ${suggestedUnits}`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <MiniStat
                        label={labels.coverage}
                        value={`${daysCover.toFixed(1)} ${labels.days}`}
                      />
                      <MiniStat
                        label={
                          showFinancials
                            ? labels.estimatedCost
                            : labels.stock
                        }
                        value={
                          showFinancials
                            ? product.costKnown === false
                              ? "—"
                              : money(units * product.cost)
                            : String(product.stock)
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => receiveRestock(product.id, units)}
                      className="min-h-11 rounded-2xl bg-[#8F0000] px-4 py-3 text-xs font-semibold text-white"
                    >
                      {labels.receivePurchase}
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

function ActivitiesModule({
  labels,
  activities,
  locale,
  activityText
}: {
  labels: (typeof copy)[LanguageCode];
  activities: ActivityRecord[];
  locale: string;
  activityText: (activity: ActivityRecord) => string;
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        title={labels.activitiesTitle}
        subtitle={labels.activitiesSubtitle}
      />

      <section className="apex-card p-5 sm:p-6">
        {!activities.length ? (
          <p className="text-sm text-[var(--apex-muted)]">
            {labels.noActivities}
          </p>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="relative flex gap-4 py-4"
              >
                {index < activities.length - 1 && (
                  <div className="absolute left-[15px] top-9 h-[calc(100%-20px)] w-px bg-[var(--apex-border)]" />
                )}
                <span className="relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#8F0000]/12 text-[#8F0000]">
                  <ActivityIcon size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {activityText(activity)}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(new Date(activity.createdAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsModule({
  labels,
  language,
  currency,
  businessName,
  businessType,
  businessCountry,
  businessDescription,
  setBusinessName,
  setBusinessType,
  setBusinessCountry,
  setBusinessDescription,
  saveBusinessName,
  locale
}: {
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
  currency: string;
  businessName: string;
  businessType: BusinessType;
  businessCountry: string;
  businessDescription: string;
  setBusinessName: (value: string) => void;
  setBusinessType: (value: BusinessType) => void;
  setBusinessCountry: (value: string) => void;
  setBusinessDescription: (value: string) => void;
  saveBusinessName: () => void;
  locale: string;
}) {
  const [businessCategoryId, setBusinessCategoryId] = useState(() =>
    typeof window === "undefined" ? "almacen" :
    window.localStorage.getItem("global-stock-business-category") || "almacen"
  );

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    let live = true;
    void client.auth.getUser().then(({data}) => {
      const category = data.user?.user_metadata?.business_category;
      if (live && typeof category === "string" && category.length < 60) {
        setBusinessCategoryId(category);
        window.localStorage.setItem("global-stock-business-category",category);
      }
    }).catch(() => null);
    return () => { live = false; };
  }, []);

  function chooseBusinessCategory(id:string) {
    setBusinessCategoryId(id);
    window.localStorage.setItem("global-stock-business-category",id);
    const client = getSupabaseBrowserClient();
    if (client) {
      void client.auth.updateUser({ data: {business_category:id} }).then(({error}) => {
        if (error) console.warn("No se pudo sincronizar la categoría del perfil");
      }).catch(() => null);
    }
  }

  const settingsCopy = {
    es: {
      profile: "Perfil operativo",
      profileHelp:
        "Definí el tipo de operación para que Global Stock pueda adaptar análisis, IA y flujos a tu negocio.",
      activity: "Actividad",
      country: "País de operación",
      countryPlaceholder: "Ej.: Argentina",
      description: "¿A qué se dedica el negocio?",
      descriptionPlaceholder:
        "Ej.: local de pesca con ventas presenciales y ecommerce",
      industry: "Industria / fabricación",
      save: "Guardar perfil"
    },
    en: {
      profile: "Operating profile",
      profileHelp:
        "Define the operation so Global Stock can adapt analytics, AI and workflows to your business.",
      activity: "Activity",
      country: "Operating country",
      countryPlaceholder: "Example: United States",
      description: "What does the business do?",
      descriptionPlaceholder:
        "Example: fishing retailer with in-store and online sales",
      industry: "Industry / manufacturing",
      save: "Save profile"
    },
    pt: {
      profile: "Perfil operacional",
      profileHelp:
        "Defina a operação para que o Global Stock adapte análises, IA e fluxos ao seu negócio.",
      activity: "Atividade",
      country: "País de operação",
      countryPlaceholder: "Ex.: Brasil",
      description: "Qual é a atividade do negócio?",
      descriptionPlaceholder:
        "Ex.: loja de pesca com vendas físicas e ecommerce",
      industry: "Indústria / fabricação",
      save: "Salvar perfil"
    },
    fr: {
      profile: "Profil opérationnel",
      profileHelp:
        "Définissez l’activité afin que Global Stock adapte analyses, IA et flux à votre entreprise.",
      activity: "Activité",
      country: "Pays d’activité",
      countryPlaceholder: "Ex. : France",
      description: "Que fait l’entreprise ?",
      descriptionPlaceholder:
        "Ex. : magasin de pêche avec ventes physiques et ecommerce",
      industry: "Industrie / fabrication",
      save: "Enregistrer"
    },
    de: {
      profile: "Betriebsprofil",
      profileHelp:
        "Definiere den Betrieb, damit Global Stock Analysen, KI und Abläufe an dein Unternehmen anpassen kann.",
      activity: "Tätigkeit",
      country: "Betriebsland",
      countryPlaceholder: "Beispiel: Deutschland",
      description: "Was macht das Unternehmen?",
      descriptionPlaceholder:
        "Beispiel: Angelgeschäft mit Filial- und Onlineverkauf",
      industry: "Industrie / Fertigung",
      save: "Profil speichern"
    }
  }[language];

  return (
    <div className="space-y-5">
      <PageIntro
        title={labels.settingsTitle}
        subtitle={labels.settingsSubtitle}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="apex-card p-5 xl:col-span-2">
          <div className="max-w-3xl">
            <h3 className="text-sm font-semibold">
              {settingsCopy.profile}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--apex-muted)]">
              {settingsCopy.profileHelp}
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {labels.businessName}
              </span>
              <input
                value={businessName}
                onChange={(event) =>
                  setBusinessName(event.target.value)
                }
                className="apex-input mt-2 px-4 py-3"
              />
            </label>

            <label>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {settingsCopy.activity}
              </span>
              <BusinessTypePicker
                language={language}
                value={businessType}
                categoryId={businessCategoryId}
                onCategoryChange={chooseBusinessCategory}
                onChange={(value) => setBusinessType(value as BusinessType)}
                className="mt-2"
              />
            </label>

            <label>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {settingsCopy.country}
              </span>
              <input
                value={businessCountry}
                onChange={(event) =>
                  setBusinessCountry(event.target.value)
                }
                placeholder={settingsCopy.countryPlaceholder}
                className="apex-input mt-2 px-4 py-3"
              />
            </label>

            <label>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                {settingsCopy.description}
              </span>
              <textarea
                value={businessDescription}
                onChange={(event) =>
                  setBusinessDescription(event.target.value)
                }
                rows={2}
                placeholder={settingsCopy.descriptionPlaceholder}
                className="apex-input mt-2 resize-none px-4 py-3 text-sm"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={saveBusinessName}
            className="mt-4 rounded-xl bg-[var(--apex-accent)] px-5 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[.99]"
          >
            {settingsCopy.save}
          </button>
        </section>

        <div className="xl:col-span-2">
          <FxCenter
            language={language}
            locale={locale}
            defaultCurrency={currency}
          />
        </div>

        <NewsletterPreferences />

        {typeof window !== "undefined" &&
          Boolean((window as typeof window & { ReactNativeWebView?: { postMessage: (v:string)=>void } }).ReactNativeWebView) && (
          <section className="apex-card p-4 xl:col-span-2">
            <h3 className="text-xs font-semibold">
              {language === "es" ? "Recuperación de datos anteriores" : "Previous data recovery"}
            </h3>
            <button type="button"
              onClick={() => (window as typeof window & { ReactNativeWebView?: { postMessage: (v:string)=>void } }).ReactNativeWebView?.postMessage(JSON.stringify({type:"open_legacy_recovery"}))}
              className="mt-3 min-h-10 rounded-xl border border-[var(--apex-border)] px-3 text-xs font-semibold text-[var(--apex-muted)] hover:bg-[var(--apex-bg)]">
              {language === "es" ? "Recuperar borradores de Expo anterior" : "Recover previous Expo drafts"}
            </button>
          </section>
        )}

      </div>
    </div>
  );
}

function describeActivity(
  activity: ActivityRecord,
  labels: (typeof copy)[LanguageCode],
  money: (value: number) => string,
  includeMoney = true
) {
  if (activity.kind === "sale") {
    return includeMoney
      ? `${labels.saleActivity} · ${activity.units ?? 0} ${labels.units} · ${money(activity.total ?? 0)}`
      : `${labels.saleActivity} · ${activity.units ?? 0} ${labels.units}`;
  }
  if (activity.kind === "restock") {
    return `${labels.restockActivity} · ${activity.product ?? ""} · +${activity.units ?? 0}`;
  }
  if (activity.kind === "scan") {
    return `${labels.scanActivity} · ${activity.product ?? ""}`;
  }
  if (activity.kind === "note") {
    return labels.noteActivity;
  }
  return labels.settingsActivity;
}

function MobileNavButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors " +
        (active
          ? "bg-[#8F0000]/12 text-[#8F0000]"
          : "text-[var(--apex-muted)]")
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ChartCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="apex-card p-5 sm:p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-5 h-[330px]">{children}</div>
    </section>
  );
}

function PageIntro({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <Logo className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
          Global Stock
        </p>
      </div>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--apex-muted)]">
        {subtitle}
      </p>
    </section>
  );
}

function WorkflowHelp({
  title,
  steps
}: {
  title: string;
  steps: string[];
}) {
  return (
    <section className="rounded-[22px] border border-[#8F0000]/18 bg-[#8F0000]/[0.045] p-4">
      <p className="text-xs font-semibold text-[var(--apex-text)]">{title}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className="flex items-start gap-2 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface)] px-3 py-3"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#8F0000] text-[10px] font-bold text-white">
              {index + 1}
            </span>
            <p className="text-[11px] leading-5 text-[var(--apex-muted)]">
              {step}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
    </div>
  );
}