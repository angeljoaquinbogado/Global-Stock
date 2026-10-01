"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  BarChart3,
  BellRing,
  Boxes,
  Building2,
  CircleDollarSign,
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
  Store,
  Sun,
  Truck,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
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
import type {
  BusinessSnapshot,
  Product,
  TrendPoint
} from "@/lib/types";

import { ApexIntelligence } from "./ApexIntelligence";
import { BarcodeScanner, type BarcodeScannerHandle } from "./BarcodeScanner";
import {
  GlobalPreferences,
  type LanguageCode
} from "./GlobalPreferences";
import { InstallAppButton } from "./InstallAppButton";
import { Logo } from "./Logo";
import { FxCenter } from "./FxCenter";
import { PremiumCharts } from "./PremiumCharts";
import { NotesHub } from "./NotesHub";
import {
  DocumentsHub,
  OnlineCommerceHub
} from "./BusinessOperations";

type ModuleId =
  | "overview"
  | "pos"
  | "online"
  | "inventory"
  | "charts"
  | "purchases"
  | "suppliers"
  | "activities"
  | "documents"
  | "notes"
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
  | "other";

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
      pos: "Punto de venta",
      online: "Tienda online",
      inventory: "Almacén",
      charts: "Gráficos",
      purchases: "Reposição",
      suppliers: "Abastecedores",
      activities: "Actividad",
      documents: "Comprobantes",
      notes: "Agenda",
      settings: "Configuración"
    },
    more: "Más",
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
    suppliersTitle: "Abastecedores",
    suppliersSubtitle: "Compará quién abastece tu negocio, cuánto stock depende de cada uno y qué margen generan sus productos.",
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
      online: "Online store",
      inventory: "Warehouse",
      charts: "Charts",
      purchases: "Restocking",
      suppliers: "Vendors",
      activities: "Activity",
      documents: "Documents",
      notes: "Agenda",
      settings: "Settings"
    },
    more: "More",
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
      online: "Loja online",
      inventory: "Armazém",
      charts: "Gráficos",
      purchases: "Reposição",
      suppliers: "Abastecedores",
      activities: "Atividade",
      documents: "Comprovantes",
      notes: "Agenda",
      settings: "Configurações"
    },
    more: "Mais",
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
      online: "Boutique en ligne",
      inventory: "Entrepôt",
      charts: "Graphiques",
      purchases: "Réassort",
      suppliers: "Approvisionneurs",
      activities: "Activité",
      documents: "Documents",
      notes: "Agenda",
      settings: "Paramètres"
    },
    more: "Plus",
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
      online: "Onlineshop",
      inventory: "Lager",
      charts: "Diagramme",
      purchases: "Nachbestellung",
      suppliers: "Bezugsquellen",
      activities: "Aktivität",
      documents: "Belege",
      notes: "Agenda",
      settings: "Einstellungen"
    },
    more: "Mehr",
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
      title: "Qué muestra Abastecedores",
      steps: [
        "Productos y unidades asociadas a cada proveedor",
        "Capital inmovilizado por abastecedor",
        "Margen promedio para comparar conveniencia"
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
  { id: "pos", icon: ShoppingCart },
  { id: "online", icon: ShoppingBag },
  { id: "inventory", icon: Boxes },
  { id: "charts", icon: BarChart3 },
  { id: "purchases", icon: PackagePlus },
  { id: "suppliers", icon: Truck },
  { id: "activities", icon: ActivityIcon },
  { id: "documents", icon: ReceiptText },
  { id: "notes", icon: ClipboardList },
  { id: "settings", icon: Settings2 }
];

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  const [trend, setTrend] = useState<TrendPoint[]>(demoTrend);
  const [currencyRate, setCurrencyRate] = useState(1);
  const [fxMarket, setFxMarket] = useState<FxMarket>("oficial");
  const [fxHistory, setFxHistory] = useState<FxHistoryEntry[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [posQuery, setPosQuery] = useState("");
  const [businessName, setBusinessName] = useState("Global Stock Demo");
  const [businessType, setBusinessType] =
    useState<BusinessType>("retail");
  const [businessCountry, setBusinessCountry] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [notice, setNotice] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<BarcodeScannerHandle>(null);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [selectedDate, setSelectedDate] = useState(localDateKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [noteDraft, setNoteDraft] = useState("");

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
    try {
      const savedProducts = localStorage.getItem("global-stock-demo-products-v2");
      const savedTrend = localStorage.getItem("global-stock-trend-v1");
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
        if (Array.isArray(parsed) && parsed.length) setProducts(parsed);
      }
      if (savedTrend) {
        const parsed = JSON.parse(savedTrend) as TrendPoint[];
        if (Array.isArray(parsed) && parsed.length) setTrend(parsed);
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
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(
      "global-stock-demo-products-v2",
      JSON.stringify(products)
    );
  }, [products, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("global-stock-trend-v1", JSON.stringify(trend));
  }, [trend, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(
      "global-stock-activities-v1",
      JSON.stringify(activities)
    );
  }, [activities, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("global-stock-notes-v1", JSON.stringify(notes));
  }, [notes, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("global-stock-fx-market-v1", fxMarket);
  }, [fxMarket, storageReady]);

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
      {
        supplier: string;
        products: number;
        units: number;
        value: number;
        margins: number[];
      }
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
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              stock: Math.max(0, Math.round(nextStock))
            }
          : product
      )
    );
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

    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, stock: item.stock + units }
          : item
      )
    );

    addActivity("restock", {
      product: product?.name,
      units
    });
    setNotice(labels.purchaseApplied);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function saveBusinessName() {
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
    <main className="min-h-screen overflow-x-clip bg-[var(--apex-bg)] text-[var(--apex-text)] lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-[var(--apex-border)] bg-[var(--apex-surface)] px-4 py-5 lg:flex lg:flex-col">
        <Logo withWordmark />

        <nav className="mt-8 space-y-1.5 overflow-y-auto pr-1">
          {modules.map(({ id, icon: Icon }) => {
            const active = activeModule === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveModule(id)}
                className={
                  "flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors " +
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

        <div className="mt-auto space-y-3 pt-4">
          <div className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--apex-muted)]">
              {labels.businessSummary}
            </p>
            <p className="mt-2 truncate text-sm font-semibold">
              {businessName}
            </p>
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

      <section className="min-w-0 pb-28 lg:pb-0">
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

        <AnimatePresence initial={false}>
          <motion.div
            key={activeModule + language}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
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
                recentActivities={activities.slice(0, 4)}
                todayNotes={todayNotes}
                activityText={(activity) =>
                  describeActivity(activity, labels, money)
                }
              />
            )}

            {activeModule === "pos" && (
              <PosModule
                labels={labels}
                language={language}
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

            {activeModule === "online" && (
              <OnlineCommerceHub
                language={language}
                currency={currency}
                locale={locale}
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

            {activeModule === "charts" && (
              <PremiumCharts
                language={language}
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
                receiveRestock={receiveRestock}
              />
            )}

            {activeModule === "suppliers" && (
              <SuppliersModule
                labels={labels}
                language={language}
                stats={supplierStats}
                money={money}
              />
            )}

            {activeModule === "activities" && (
              <ActivitiesModule
                labels={labels}
                activities={activities}
                locale={locale}
                activityText={(activity) =>
                  describeActivity(activity, labels, money)
                }
              />
            )}

            {activeModule === "documents" && (
              <DocumentsHub
                language={language}
                currency={currency}
                locale={locale}
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
              />
            )}

            {activeModule === "settings" && (
              <SettingsModule
                labels={labels}
                language={language}
                currency={currency}
                dark={dark}
                businessName={businessName}
                businessType={businessType}
                businessCountry={businessCountry}
                businessDescription={businessDescription}
                setBusinessName={setBusinessName}
                setBusinessType={setBusinessType}
                setBusinessCountry={setBusinessCountry}
                setBusinessDescription={setBusinessDescription}
                onLanguageChange={onLanguageChange}
                onCurrencyChange={onCurrencyChange}
                onToggleTheme={onToggleTheme}
                onSignOut={onSignOut}
                saveBusinessName={saveBusinessName}
                locale={locale}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--apex-border)] bg-[var(--apex-surface)]/96 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5 items-end gap-1">
          <MobileNavButton
            active={activeModule === "overview"}
            icon={<Store size={18} />}
            label={labels.nav.overview}
            onClick={() => setActiveModule("overview")}
          />
          <MobileNavButton
            active={activeModule === "pos"}
            icon={<ShoppingCart size={18} />}
            label={labels.nav.pos}
            onClick={() => setActiveModule("pos")}
          />

          <button
            type="button"
            onClick={() => {
              setScannerOpen(true);
              scannerRef.current?.openCamera();
            }}
            className="-mt-8 flex min-h-[72px] flex-col items-center justify-end gap-1 text-[10px] font-semibold text-[#8F0000]"
            aria-label={labels.scan}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full border-[5px] border-[var(--apex-bg)] bg-[#8F0000] text-white shadow-[0_12px_34px_rgba(143,0,0,.36)]">
              <ScanLine size={25} />
            </span>
            <span>{labels.scan}</span>
          </button>

          <MobileNavButton
            active={activeModule === "charts"}
            icon={<BarChart3 size={18} />}
            label={labels.nav.charts}
            onClick={() => setActiveModule("charts")}
          />
          <MobileNavButton
            active={false}
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
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.34 }}
              className="apex-scrollbar max-h-[88dvh] w-full overflow-y-auto rounded-t-[30px] border-t border-[var(--apex-border)] bg-[var(--apex-surface)] p-4 pb-[max(20px,env(safe-area-inset-bottom))]"
            >
              <div className="mb-4 flex items-center justify-between">
                <Logo withWordmark />
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--apex-border)]"
                  aria-label={labels.close}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "inventory",
                    "online",
                    "purchases",
                    "suppliers",
                    "activities",
                    "documents",
                    "notes",
                    "settings"
                  ] as ModuleId[]
                ).map((id) => {
                  const item = modules.find(
                    (module) => module.id === id
                  )!;
                  const Icon = item.icon;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveModule(id);
                        setMoreOpen(false);
                      }}
                      className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4 text-left text-sm font-semibold"
                    >
                      <Icon size={18} className="text-[#8F0000]" />
                      {labels.nav[id]}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
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
            ? "fixed inset-0 z-[130] overflow-y-auto bg-[var(--apex-bg)] p-3 pb-24 sm:p-6"
            : "hidden"
        }
      >
            <div className="mx-auto max-w-5xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
                    Global Stock
                  </p>
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
                onProduct={integrateScannedProduct}
              />
            </div>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-28 left-1/2 z-[140] -translate-x-1/2 rounded-full border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-2 text-xs font-semibold shadow-xl lg:bottom-6"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <ApexIntelligence
        snapshot={snapshot}
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
  setActiveModule,
  recentActivities,
  todayNotes,
  activityText
}: {
  labels: (typeof copy)[LanguageCode];
  metrics: ReturnType<typeof calculateMetrics>;
  chartData: Array<{
    label: string;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  money: (value: number) => string;
  currency: string;
  locale: string;
  setActiveModule: (id: ModuleId) => void;
  recentActivities: ActivityRecord[];
  todayNotes: BusinessNote[];
  activityText: (activity: ActivityRecord) => string;
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        title={labels.overviewTitle}
        subtitle={labels.overviewSubtitle}
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          label={labels.revenue}
          value={money(metrics.revenue)}
          icon={<CircleDollarSign size={18} />}
        />
        <Kpi
          label={labels.inventoryCost}
          value={money(metrics.inventoryCost)}
          icon={<Boxes size={18} />}
        />
        <Kpi
          label={labels.grossProfit}
          value={money(metrics.grossProfit)}
          icon={<BarChart3 size={18} />}
        />
        <Kpi
          label={labels.criticalStock}
          value={String(
            metrics.lowStockCount + metrics.outOfStockCount
          )}
          detail={labels.alerts}
          icon={<BellRing size={18} />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <div className="apex-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8F0000]">
                {labels.salesFlow}
              </p>
              <h3 className="mt-2 text-lg font-semibold">
                {labels.grossProfit}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule("charts")}
              className="rounded-full border border-[var(--apex-border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--apex-muted)]"
            >
              {labels.nav.charts}
            </button>
          </div>

          <div className="mt-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="workspaceProfit"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8F0000"
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="100%"
                      stopColor="#8F0000"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--apex-border)"
                  strokeDasharray="1 7"
                  vertical
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  stroke="var(--apex-muted)"
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid var(--apex-border)",
                    background: "var(--apex-surface-strong)",
                    color: "var(--apex-text)"
                  }}
                  formatter={(value) =>
                    formatMoney(Number(value), currency, locale)
                  }
                />
                <Area
                  type="linear"
                  dataKey="profit"
                  stroke="#C10A0A"
                  strokeWidth={2.15}
                  fill="url(#workspaceProfit)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4">
          <section className="apex-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {labels.recentActivity}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModule("activities")}
                className="text-[10px] font-semibold text-[#8F0000]"
              >
                {labels.open}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {recentActivities.length ? (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#8F0000]" />
                    <p className="text-xs leading-5 text-[var(--apex-muted)]">
                      {activityText(activity)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--apex-muted)]">
                  {labels.noActivities}
                </p>
              )}
            </div>
          </section>

          <section className="apex-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {labels.todayNotes}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModule("notes")}
                className="text-[10px] font-semibold text-[#8F0000]"
              >
                {labels.open}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {todayNotes.length ? (
                todayNotes.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 py-2.5 text-xs"
                  >
                    {note.text}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--apex-muted)]">
                  {labels.noNotes}
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function PosModule({
  labels,
  language,
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
  language: LanguageCode;
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
      <WorkflowHelp {...workflowHelp[language].pos} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
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
                <h3 className="mt-4 text-sm font-semibold">
                  {product.name}
                </h3>
                <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                  {product.category}
                </p>
                <p className="mt-4 text-lg font-semibold">
                  {money(product.price)}
                </p>
                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() =>
                    setQuantity(
                      product.id,
                      (cart[product.id] ?? 0) + 1
                    )
                  }
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
            <p className="mt-4 text-sm text-[var(--apex-muted)]">
              {labels.emptyCart}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {cartLines.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-[var(--apex-border)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {product.name}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                        {money(product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(product.id, quantity - 1)
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
                          setQuantity(product.id, quantity + 1)
                        }
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
              <span className="text-[var(--apex-muted)]">
                {labels.total}
              </span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--apex-muted)]">
                {labels.estimatedProfit}
              </span>
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
      <PageIntro
        title={labels.inventoryTitle}
        subtitle={labels.inventorySubtitle}
      />
      <WorkflowHelp {...workflowHelp[language].inventory} />

      <section className="apex-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
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
                  <tr
                    key={product.id}
                    className="border-b border-[var(--apex-border)] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">
                        {product.name}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                        {product.barcode}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--apex-muted)]">
                      {product.category}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--apex-muted)]">
                      {product.supplier}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold">
                      {money(product.cost)}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold">
                      {money(product.price)}
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min={0}
                        value={product.stock}
                        onChange={(event) =>
                          updateStock(
                            product.id,
                            Number(event.target.value)
                          )
                        }
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

      <BarcodeScanner
        onProduct={integrateScannedProduct}
        language={language}
      />
    </div>
  );
}

function PurchasesModule({
  labels,
  language,
  restock,
  money,
  receiveRestock
}: {
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
  restock: ReturnType<typeof rankRestockNeeds>;
  money: (value: number) => string;
  receiveRestock: (id: string, units: number) => void;
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        title={labels.purchasesTitle}
        subtitle={labels.purchasesSubtitle}
      />
      <WorkflowHelp {...workflowHelp[language].purchases} />

      <div className="grid gap-3">
        {restock.map(
          ({ product, daysCover, suggestedUnits }) => (
            <article key={product.id} className="apex-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                    {product.supplier}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:min-w-[430px]">
                  <MiniStat
                    label={labels.suggested}
                    value={String(suggestedUnits)}
                  />
                  <MiniStat
                    label={labels.coverage}
                    value={`${daysCover.toFixed(1)} ${labels.days}`}
                  />
                  <MiniStat
                    label={labels.estimatedCost}
                    value={money(suggestedUnits * product.cost)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    receiveRestock(product.id, suggestedUnits)
                  }
                  className="rounded-2xl bg-[#8F0000] px-4 py-3 text-xs font-semibold text-white"
                >
                  {labels.receivePurchase}
                </button>
              </div>
            </article>
          )
        )}
      </div>
    </div>
  );
}

function SuppliersModule({
  labels,
  language,
  stats,
  money
}: {
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
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
      <PageIntro
        title={labels.suppliersTitle}
        subtitle={labels.suppliersSubtitle}
      />
      <WorkflowHelp {...workflowHelp[language].suppliers} />

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {stats.map((supplier) => (
          <article
            key={supplier.supplier}
            className="apex-card p-5"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
                <Building2 size={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold">
                  {supplier.supplier}
                </h3>
                <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                  {supplier.products} {labels.products}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat
                label={labels.units}
                value={String(supplier.units)}
              />
              <MiniStat
                label={labels.inventoryValue}
                value={money(supplier.value)}
              />
              <MiniStat
                label={labels.averageMargin}
                value={`${supplier.averageMargin.toFixed(1)}%`}
              />
            </div>
          </article>
        ))}
      </div>
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
  dark,
  businessName,
  businessType,
  businessCountry,
  businessDescription,
  setBusinessName,
  setBusinessType,
  setBusinessCountry,
  setBusinessDescription,
  onLanguageChange,
  onCurrencyChange,
  onToggleTheme,
  onSignOut,
  saveBusinessName,
  locale
}: {
  labels: (typeof copy)[LanguageCode];
  language: LanguageCode;
  currency: string;
  dark: boolean;
  businessName: string;
  businessType: BusinessType;
  businessCountry: string;
  businessDescription: string;
  setBusinessName: (value: string) => void;
  setBusinessType: (value: BusinessType) => void;
  setBusinessCountry: (value: string) => void;
  setBusinessDescription: (value: string) => void;
  onLanguageChange: (language: LanguageCode) => void;
  onCurrencyChange: (currency: string) => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
  saveBusinessName: () => void;
  locale: string;
}) {
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
              <select
                value={businessType}
                onChange={(event) =>
                  setBusinessType(event.target.value as BusinessType)
                }
                className="apex-input mt-2 px-4 py-3 text-sm"
              >
                <option value="retail">
                  {language === "en"
                    ? "Retail"
                    : language === "pt"
                      ? "Comércio / varejo"
                      : language === "fr"
                        ? "Commerce"
                        : language === "de"
                          ? "Einzelhandel"
                          : "Comercio / retail"}
                </option>
                <option value="restaurant">
                  {language === "en"
                    ? "Restaurant / hospitality"
                    : language === "pt"
                      ? "Restaurante / gastronomia"
                      : language === "fr"
                        ? "Restaurant / restauration"
                        : language === "de"
                          ? "Restaurant / Gastronomie"
                          : "Restaurante / gastronomía"}
                </option>
                <option value="services">
                  {language === "en"
                    ? "Services"
                    : language === "pt"
                      ? "Serviços"
                      : language === "fr"
                        ? "Services"
                        : language === "de"
                          ? "Dienstleistungen"
                          : "Servicios"}
                </option>
                <option value="wholesale">
                  {language === "en"
                    ? "Wholesale / distribution"
                    : language === "pt"
                      ? "Atacado / distribuição"
                      : language === "fr"
                        ? "Grossiste / distribution"
                        : language === "de"
                          ? "Großhandel / Vertrieb"
                          : "Mayorista / distribución"}
                </option>
                <option value="ecommerce">Ecommerce</option>
                <option value="industry">
                  {settingsCopy.industry}
                </option>
                <option value="other">
                  {language === "en"
                    ? "Other"
                    : language === "pt"
                      ? "Outro"
                      : language === "fr"
                        ? "Autre"
                        : language === "de"
                          ? "Andere"
                          : "Otro"}
                </option>
              </select>
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
            className="mt-4 rounded-2xl bg-[#8F0000] px-5 py-3 text-sm font-semibold text-white"
          >
            {settingsCopy.save}
          </button>
        </section>

        <section className="apex-card p-5">
          <h3 className="text-sm font-semibold">
            {labels.preferences}
          </h3>
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
          <h3 className="text-sm font-semibold">
            {labels.appearance}
          </h3>
          <button
            type="button"
            onClick={onToggleTheme}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-3 text-sm font-semibold"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {labels.theme}
          </button>
        </section>

        <div className="xl:col-span-2">
          <FxCenter
            language={language}
            locale={locale}
            defaultCurrency={currency}
          />
        </div>

        <section className="apex-card p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold">
            {labels.install}
          </h3>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <InstallAppButton language={language} />
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-2 rounded-2xl border border-[var(--apex-border)] px-4 py-3 text-sm font-semibold text-[var(--apex-muted)]"
            >
              <LogOut size={16} />
              {labels.signOut}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function describeActivity(
  activity: ActivityRecord,
  labels: (typeof copy)[LanguageCode],
  money: (value: number) => string
) {
  if (activity.kind === "sale") {
    return `${labels.saleActivity} · ${activity.units ?? 0} ${labels.units} · ${money(activity.total ?? 0)}`;
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
      <p className="mt-4 text-xs font-semibold text-[var(--apex-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
          {detail}
        </p>
      )}
    </article>
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
