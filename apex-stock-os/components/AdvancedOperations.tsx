"use client";

import { ApexSelect } from "@/components/ui/ApexSelect";
import {
  ArchiveRestore,
  BarChart3,
  BellRing,
  Boxes,
  ChefHat,
  ClipboardCheck,
  Download,
  FileUp,
  PackageSearch,
  Plus,
  RefreshCw,
  Tags,
  Truck,
  WalletCards,
  Wrench
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { businessStorageKey } from "@/lib/business-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { BusinessReports } from "./BusinessReports";
import { CatalogTools } from "./CatalogTools";
import { CommercialOperations } from "./CommercialOperations";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  businessId: string;
  businessType: string;
  language: LanguageCode;
  currency: string;
  locale: string;
};

type ToolId =
  | "orders"
  | "inventory"
  | "catalog"
  | "services"
  | "commercial"
  | "reports"
  | "automations"
  | "data"
  | "restaurant"
  | "pricing";

type OrderRow = {
  id: string;
  provider: string;
  status: string;
  fulfillment_type: string;
  total: number;
  currency: string;
  created_at: string;
};

type CountRow = {
  id: string;
  status: string;
  scope: string | null;
  created_at: string;
};

type TransferRow = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type LotRow = {
  id: string;
  product_key: string;
  lot_number: string;
  quantity: number;
  expires_at: string | null;
};

type ServiceRow = {
  id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  estimated_total: number;
};

type AutomationRow = {
  id: string;
  name: string;
  event_type: string;
  conditions: Record<string, unknown>;
  enabled: boolean;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  created_at: string;
};

type DiningTable = {
  id: string;
  name: string;
  seats: number;
  status: string;
};

type PriceList = {
  id: string;
  name: string;
  currency: string;
  customer_group: string | null;
};

type LocationRow = {
  id: string;
  name: string;
  kind: string;
};

type KitchenTicketRow = {
  id: string;
  order_id: string;
  station: string;
  status: string;
  priority: number;
  created_at: string;
};

type ShipmentRow = {
  id: string;
  order_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipping_cost: number;
  created_at: string;
};

const baseTools: Array<{ id: ToolId; icon: typeof ClipboardCheck }> = [
  { id: "orders", icon: PackageSearch },
  { id: "inventory", icon: ClipboardCheck },
  { id: "catalog", icon: Boxes },
  { id: "services", icon: Wrench },
  { id: "commercial", icon: WalletCards },
  { id: "reports", icon: BarChart3 },
  { id: "automations", icon: BellRing },
  { id: "data", icon: ArchiveRestore }
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

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadFile(name: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AdvancedOperations({
  businessId,
  businessType,
  language,
  currency,
  locale
}: Props) {
  const [tool, setTool] = useState<ToolId>("orders");
  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [counts, setCounts] = useState<CountRow[]>([]);
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [lots, setLots] = useState<LotRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [automations, setAutomations] = useState<AutomationRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicketRow[]>([]);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);

  const [orderTotal, setOrderTotal] = useState("");
  const [orderFulfillment, setOrderFulfillment] = useState("pickup");

  const [countScope, setCountScope] = useState("Conteo general");
  const [countLocation, setCountLocation] = useState("");
  const [countProduct, setCountProduct] = useState("");
  const [countExpected, setCountExpected] = useState("");
  const [countActual, setCountActual] = useState("");

  const [transferNote, setTransferNote] = useState("");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferProduct, setTransferProduct] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");

  const [lotProductKey, setLotProductKey] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [lotQuantity, setLotQuantity] = useState("");
  const [lotExpiry, setLotExpiry] = useState("");

  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceTotal, setServiceTotal] = useState("");

  const [automationName, setAutomationName] = useState("");
  const [automationEvent, setAutomationEvent] = useState("stock_below_min");
  const [automationThreshold, setAutomationThreshold] = useState("20");

  const [tableName, setTableName] = useState("");
  const [tableSeats, setTableSeats] = useState("2");
  const [kitchenOrder, setKitchenOrder] = useState("");
  const [kitchenStation, setKitchenStation] = useState("general");

  const [shipmentOrder, setShipmentOrder] = useState("");
  const [shipmentCarrier, setShipmentCarrier] = useState("");
  const [shipmentTracking, setShipmentTracking] = useState("");
  const [shipmentCost, setShipmentCost] = useState("");

  const [priceListName, setPriceListName] = useState("");
  const [customerGroup, setCustomerGroup] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools = useMemo(() => {
    const next = [...baseTools];
    if (businessType === "restaurant") {
      next.unshift({ id: "restaurant", icon: ChefHat });
    }
    if (["wholesale", "retail", "ecommerce"].includes(businessType)) {
      next.push({ id: "pricing", icon: Tags });
    }
    return next;
  }, [businessType]);

  const labels: Record<ToolId, string> = {
    orders: tr(language, {
      es: "Pedidos",
      en: "Orders",
      pt: "Pedidos",
      fr: "Commandes",
      de: "Bestellungen"
    }),
    inventory: tr(language, {
      es: "Control de stock",
      en: "Inventory control",
      pt: "Controle de estoque",
      fr: "Contrôle du stock",
      de: "Bestandskontrolle"
    }),
    catalog: tr(language, {
      es: "Catálogo avanzado",
      en: "Advanced catalog",
      pt: "Catálogo avançado",
      fr: "Catalogue avancé",
      de: "Erweiterter Katalog"
    }),
    services: tr(language, {
      es: "Servicios",
      en: "Services",
      pt: "Serviços",
      fr: "Services",
      de: "Services"
    }),
    commercial: tr(language, {
      es: "Comercial",
      en: "Commercial",
      pt: "Comercial",
      fr: "Commercial",
      de: "Handel"
    }),
    reports: tr(language, {
      es: "Reportes",
      en: "Reports",
      pt: "Relatórios",
      fr: "Rapports",
      de: "Berichte"
    }),
    automations: tr(language, {
      es: "Automatizaciones",
      en: "Automations",
      pt: "Automações",
      fr: "Automatisations",
      de: "Automationen"
    }),
    data: tr(language, {
      es: "Datos y backup",
      en: "Data & backup",
      pt: "Dados e backup",
      fr: "Données et sauvegarde",
      de: "Daten & Backup"
    }),
    restaurant: tr(language, {
      es: "Salón y cocina",
      en: "Dining & kitchen",
      pt: "Salão e cozinha",
      fr: "Salle et cuisine",
      de: "Restaurant"
    }),
    pricing: tr(language, {
      es: "Listas de precios",
      en: "Price lists",
      pt: "Listas de preços",
      fr: "Listes de prix",
      de: "Preislisten"
    })
  };

  async function reload() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    try {
      const [
        orderRes,
        countRes,
        transferRes,
        lotRes,
        serviceRes,
        automationRes,
        notificationRes,
        tableRes,
        priceRes,
        workspaceRes
      ] = await Promise.all([
        supabase
          .from("global_stock_orders")
          .select("id,provider,status,fulfillment_type,total,currency,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_stock_counts")
          .select("id,status,scope,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("global_stock_transfers")
          .select("id,status,notes,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("global_stock_lots")
          .select("id,product_key,lot_number,quantity,expires_at")
          .eq("business_id", businessId)
          .order("received_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_service_jobs")
          .select("id,title,status,scheduled_at,estimated_total")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_automation_rules")
          .select("id,name,event_type,conditions,enabled")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false }),
        supabase
          .from("global_stock_notifications")
          .select("id,title,body,severity,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("global_stock_dining_tables")
          .select("id,name,seats,status")
          .eq("business_id", businessId)
          .order("name", { ascending: true }),
        supabase
          .from("global_stock_price_lists")
          .select("id,name,currency,customer_group")
          .eq("business_id", businessId)
          .eq("active", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("global_stock_workspaces")
          .select("state")
          .eq("business_id", businessId)
          .maybeSingle()
      ]);

      setOrders((orderRes.data as OrderRow[] | null) ?? []);
      setCounts((countRes.data as CountRow[] | null) ?? []);
      setTransfers((transferRes.data as TransferRow[] | null) ?? []);
      setLots((lotRes.data as LotRow[] | null) ?? []);
      setServices((serviceRes.data as ServiceRow[] | null) ?? []);
      setAutomations((automationRes.data as AutomationRow[] | null) ?? []);
      setNotifications((notificationRes.data as NotificationRow[] | null) ?? []);
      setTables((tableRes.data as DiningTable[] | null) ?? []);
      setPriceLists((priceRes.data as PriceList[] | null) ?? []);

      const [locationRes, kitchenRes, shipmentRes] = await Promise.all([
        supabase
          .from("global_stock_locations")
          .select("id,name,kind")
          .eq("business_id", businessId)
          .eq("active", true)
          .order("created_at", { ascending: true }),
        supabase
          .from("global_stock_kitchen_tickets")
          .select("id,order_id,station,status,priority,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_shipments")
          .select("id,order_id,carrier,tracking_number,status,shipping_cost,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100)
      ]);

      const nextLocations = (locationRes.data as LocationRow[] | null) ?? [];
      const nextKitchen =
        (kitchenRes.data as KitchenTicketRow[] | null) ?? [];
      const nextShipments =
        (shipmentRes.data as ShipmentRow[] | null) ?? [];

      setLocations(nextLocations);
      setKitchenTickets(nextKitchen);
      setShipments(nextShipments);

      setCountLocation((current) => current || nextLocations[0]?.id || "");
      setTransferFrom((current) => current || nextLocations[0]?.id || "");
      setTransferTo(
        (current) =>
          current ||
          nextLocations.find((item) => item.id !== nextLocations[0]?.id)?.id ||
          ""
      );

      const state = (workspaceRes.data?.state ?? {}) as { products?: Product[] };
      const nextProducts = Array.isArray(state.products) ? state.products : [];
      setProducts(nextProducts);
      const firstProduct = nextProducts[0]?.id || "";
      setLotProductKey((current) => current || firstProduct);
      setCountProduct((current) => current || firstProduct);
      setTransferProduct((current) => current || firstProduct);
      setCountExpected((current) => {
        if (current) return current;
        const first = nextProducts[0];
        return first ? String(first.stock) : "";
      });
      setKitchenOrder(
        (current) =>
          current ||
          ((orderRes.data as OrderRow[] | null) ?? []).find(
            (order) => !["delivered", "cancelled", "refunded"].includes(order.status)
          )?.id ||
          ""
      );
      setShipmentOrder(
        (current) =>
          current ||
          ((orderRes.data as OrderRow[] | null) ?? []).find(
            (order) => !["delivered", "cancelled", "refunded"].includes(order.status)
          )?.id ||
          ""
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  // Reload when the business changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function createOrder() {
    const total = Math.max(0, Number(orderTotal) || 0);
    if (!total) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_orders").insert({
      business_id: businessId,
      provider: "manual",
      status: "pending",
      fulfillment_type: orderFulfillment,
      currency,
      total
    });

    setOrderTotal("");
    await reload();
  }

  async function updateOrderStatus(id: string, status: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("global_stock_orders").update({ status }).eq("id", id);
    await reload();
  }

  async function createCount() {
    const product = products.find((item) => item.id === countProduct);
    const expected = Math.max(
      0,
      Number(countExpected || product?.stock || 0) || 0
    );
    const actual = Math.max(0, Number(countActual) || 0);

    if (!countProduct || countActual.trim() === "") return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data, error } = await supabase.rpc(
      "global_stock_apply_stock_count",
      {
        target_business_id: businessId,
        target_location_id: countLocation || null,
        target_product_key: countProduct,
        expected_quantity: expected,
        counted_quantity: actual,
        count_reason: countScope.trim() || null
      }
    );

    if (error || !data) return;

    const delta = actual - expected;
    if (delta !== 0) {
      window.dispatchEvent(
        new CustomEvent("global-stock-stock-delta", {
          detail: { productKey: countProduct, delta }
        })
      );
    }

    setCountExpected(String(actual));
    setCountActual("");
    await reload();
  }

  async function createTransfer() {
    const quantity = Math.max(0, Number(transferQuantity) || 0);
    if (
      !transferFrom ||
      !transferTo ||
      transferFrom === transferTo ||
      !transferProduct ||
      !quantity
    ) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data, error } = await supabase.rpc(
      "global_stock_execute_transfer",
      {
        target_business_id: businessId,
        from_location: transferFrom,
        to_location: transferTo,
        target_product_key: transferProduct,
        transfer_quantity: quantity,
        transfer_notes: transferNote.trim() || null
      }
    );

    if (error || !data) return;

    setTransferQuantity("");
    setTransferNote("");
    await reload();
  }

  async function createLot() {
    if (!lotProductKey || !lotNumber.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_lots").insert({
      business_id: businessId,
      product_key: lotProductKey,
      lot_number: lotNumber.trim(),
      quantity: Math.max(0, Number(lotQuantity) || 0),
      expires_at: lotExpiry || null
    });

    setLotNumber("");
    setLotQuantity("");
    setLotExpiry("");
    await reload();
  }

  async function createService() {
    if (!serviceTitle.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_service_jobs").insert({
      business_id: businessId,
      title: serviceTitle.trim(),
      status: serviceDate ? "scheduled" : "pending",
      scheduled_at: serviceDate ? new Date(serviceDate).toISOString() : null,
      estimated_total: Math.max(0, Number(serviceTotal) || 0)
    });

    setServiceTitle("");
    setServiceDate("");
    setServiceTotal("");
    await reload();
  }

  async function updateServiceStatus(id: string, status: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase
      .from("global_stock_service_jobs")
      .update({ status })
      .eq("id", id);
    await reload();
  }

  async function createAutomation() {
    if (!automationName.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_automation_rules").insert({
      business_id: businessId,
      name: automationName.trim(),
      event_type: automationEvent,
      conditions: {
        threshold: Math.max(0, Number(automationThreshold) || 0)
      },
      actions: [{ type: "notification" }],
      enabled: true
    });

    setAutomationName("");
    await reload();
  }

  async function evaluateAutomations() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const today = new Date().toISOString().slice(0, 10);

    type AutomationTarget = {
      id: string;
      name: string;
      body: string;
      severity: "info" | "warning" | "critical";
      entityType: string;
      result: Record<string, unknown>;
    };

    let suite: {
      financeAccounts?: Array<{ id: string; name: string; balance: number }>;
      financeMovements?: Array<{ amount: number }>;
      projects?: Array<{
        id: string;
        name: string;
        hoursPlanned: number;
        hoursUsed: number;
        status: string;
      }>;
    } = {};

    let smartDocuments: Array<{
      id?: string;
      filename?: string;
      supplier?: string;
      total?: number | null;
      confidence?: number | null;
    }> = [];

    try {
      const suiteKey = businessStorageKey(
        "global-stock-business-suite-v1",
        businessId,
        false
      );
      const documentsKey = businessStorageKey(
        "global-stock-smart-documents-v1",
        businessId,
        false
      );

      const rawSuite = suiteKey
        ? window.localStorage.getItem(suiteKey)
        : null;
      if (rawSuite) suite = JSON.parse(rawSuite);

      const rawDocuments = documentsKey
        ? window.localStorage.getItem(documentsKey)
        : null;
      if (rawDocuments) {
        const parsed = JSON.parse(rawDocuments);
        if (Array.isArray(parsed)) smartDocuments = parsed;
      }
    } catch {
      // Optional local context should never block cloud automations.
    }

    for (const rule of automations.filter((item) => item.enabled)) {
      const threshold = Number(rule.conditions?.threshold) || 0;
      const targets: AutomationTarget[] = [];

      if (rule.event_type === "stock_below_min") {
        for (const product of products.filter(
          (item) => item.stock <= item.minStock
        )) {
          targets.push({
            id: product.id,
            name: product.name,
            body: `${product.name}: stock ${product.stock}, mínimo ${product.minStock}.`,
            severity: "critical",
            entityType: "product",
            result: { product: product.name, stock: product.stock }
          });
        }
      } else if (rule.event_type === "no_sales_30d") {
        for (const product of products.filter(
          (item) => item.stock > 0 && item.sold30d <= 0
        )) {
          targets.push({
            id: product.id,
            name: product.name,
            body: `${product.name}: sin ventas registradas en 30 días.`,
            severity: "warning",
            entityType: "product",
            result: { product: product.name }
          });
        }
      } else if (rule.event_type === "low_margin") {
        for (const product of products.filter((item) => {
          if (item.costKnown === false || item.price <= 0) return false;
          const margin =
            ((item.price - item.cost) / item.price) * 100;
          return margin <= threshold;
        })) {
          const margin =
            ((product.price - product.cost) / product.price) * 100;
          targets.push({
            id: product.id,
            name: product.name,
            body: `${product.name}: margen ${margin.toFixed(1)}%, debajo del umbral ${threshold}%.`,
            severity: "warning",
            entityType: "product",
            result: { product: product.name, margin }
          });
        }
      } else if (rule.event_type === "low_cash") {
        const balance =
          (suite.financeAccounts ?? []).reduce(
            (sum, item) => sum + (Number(item.balance) || 0),
            0
          ) +
          (suite.financeMovements ?? []).reduce(
            (sum, item) => sum + (Number(item.amount) || 0),
            0
          );

        if (balance <= threshold) {
          targets.push({
            id: "business-cash",
            name: "Caja y bancos",
            body: `Saldo estimado ${balance.toFixed(2)}; umbral configurado ${threshold.toFixed(2)}.`,
            severity: "critical",
            entityType: "finance",
            result: { balance, threshold }
          });
        }
      } else if (rule.event_type === "project_over_hours") {
        for (const project of (suite.projects ?? []).filter(
          (item) =>
            item.status !== "done" &&
            Number(item.hoursPlanned) > 0 &&
            Number(item.hoursUsed) > Number(item.hoursPlanned)
        )) {
          targets.push({
            id: project.id,
            name: project.name,
            body: `${project.name}: ${project.hoursUsed}h usadas sobre ${project.hoursPlanned}h previstas.`,
            severity: "warning",
            entityType: "project",
            result: {
              project: project.name,
              hoursUsed: project.hoursUsed,
              hoursPlanned: project.hoursPlanned
            }
          });
        }
      } else if (rule.event_type === "document_needs_review") {
        for (const document of smartDocuments.filter(
          (item) =>
            !item.supplier ||
            item.total === null ||
            item.total === undefined ||
            (item.confidence !== null &&
              item.confidence !== undefined &&
              Number(item.confidence) < 0.75)
        )) {
          const id = String(document.id || document.filename || crypto.randomUUID());
          targets.push({
            id,
            name: document.filename || "Comprobante",
            body: `${document.filename || "Comprobante"}: faltan datos o la confianza de lectura es baja.`,
            severity: "warning",
            entityType: "document",
            result: {
              filename: document.filename,
              confidence: document.confidence ?? null
            }
          });
        }
      }

      for (const target of targets.slice(0, 50)) {
        const dedupeKey = `${today}:${rule.event_type}:${target.id}`;

        const { data: existing } = await supabase
          .from("global_stock_automation_executions")
          .select("id")
          .eq("rule_id", rule.id)
          .eq("dedupe_key", dedupeKey)
          .maybeSingle();

        if (existing?.id) continue;

        const { error: executionError } = await supabase
          .from("global_stock_automation_executions")
          .insert({
            business_id: businessId,
            rule_id: rule.id,
            dedupe_key: dedupeKey,
            result: target.result
          });

        if (executionError) continue;

        await supabase.from("global_stock_notifications").insert({
          business_id: businessId,
          kind: rule.event_type,
          title: rule.name,
          body: target.body,
          severity: target.severity,
          entity_type: target.entityType,
          entity_id: target.id
        });
      }
    }

    await reload();
  }

  async function addDiningTable() {
    if (!tableName.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_dining_tables").insert({
      business_id: businessId,
      name: tableName.trim(),
      seats: Math.max(1, Number(tableSeats) || 1),
      status: "available"
    });

    setTableName("");
    setTableSeats("2");
    await reload();
  }

  async function updateTableStatus(id: string, status: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase
      .from("global_stock_dining_tables")
      .update({ status })
      .eq("id", id);
    await reload();
  }

  async function createKitchenTicket() {
    if (!kitchenOrder) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error } = await supabase
      .from("global_stock_kitchen_tickets")
      .insert({
        business_id: businessId,
        order_id: kitchenOrder,
        station: kitchenStation.trim() || "general",
        status: "queued",
        priority: 0
      });

    if (error) return;

    await supabase
      .from("global_stock_orders")
      .update({ status: "preparing" })
      .eq("id", kitchenOrder);

    await reload();
  }

  async function updateKitchenTicket(id: string, status: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const patch: Record<string, unknown> = { status };
    if (status === "preparing") {
      patch.started_at = new Date().toISOString();
    }
    if (status === "ready") {
      patch.ready_at = new Date().toISOString();
    }

    await supabase
      .from("global_stock_kitchen_tickets")
      .update(patch)
      .eq("id", id);

    const ticket = kitchenTickets.find((item) => item.id === id);
    if (ticket && status === "ready") {
      await supabase
        .from("global_stock_orders")
        .update({ status: "ready" })
        .eq("id", ticket.order_id);
    }

    await reload();
  }

  async function createShipment() {
    if (!shipmentOrder || !shipmentCarrier.trim()) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const cost = Math.max(0, Number(shipmentCost) || 0);

    const { error } = await supabase
      .from("global_stock_shipments")
      .insert({
        business_id: businessId,
        order_id: shipmentOrder,
        carrier: shipmentCarrier.trim(),
        tracking_number: shipmentTracking.trim() || null,
        status: shipmentTracking.trim() ? "in_transit" : "pending",
        shipping_cost: cost
      });

    if (error) return;

    await supabase
      .from("global_stock_orders")
      .update({
        status: shipmentTracking.trim() ? "shipped" : "ready",
        carrier: shipmentCarrier.trim(),
        tracking_number: shipmentTracking.trim() || null,
        shipping_cost: cost
      })
      .eq("id", shipmentOrder);

    setShipmentTracking("");
    setShipmentCost("");
    await reload();
  }

  async function updateShipmentStatus(id: string, status: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase
      .from("global_stock_shipments")
      .update({ status })
      .eq("id", id);

    const shipment = shipments.find((item) => item.id === id);
    if (shipment?.order_id && status === "delivered") {
      await supabase
        .from("global_stock_orders")
        .update({ status: "delivered" })
        .eq("id", shipment.order_id);
    }

    await reload();
  }

  async function addPriceList() {
    if (!priceListName.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_price_lists").insert({
      business_id: businessId,
      name: priceListName.trim(),
      currency,
      customer_group: customerGroup.trim() || null,
      active: true
    });

    setPriceListName("");
    setCustomerGroup("");
    await reload();
  }

  async function exportBackup() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const tables = [
      "global_stock_businesses",
      "global_stock_workspaces",
      "global_stock_locations",
      "global_stock_customers",
      "global_stock_suppliers",
      "global_stock_expenses",
      "global_stock_sales",
      "global_stock_sale_items",
      "global_stock_payments",
      "global_stock_purchase_orders",
      "global_stock_purchase_order_items",
      "global_stock_orders",
      "global_stock_service_jobs",
      "global_stock_automation_rules"
    ];

    const backup: Record<string, unknown> = {
      format: "global-stock-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      businessId
    };

    for (const table of tables) {
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq(
          table === "global_stock_businesses" ? "id" : "business_id",
          businessId
        );
      backup[table] = data ?? [];
    }

    downloadFile(
      `global-stock-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json;charset=utf-8",
      JSON.stringify(backup, null, 2)
    );
  }

  function exportProductsCsv() {
    const header = [
      "name",
      "barcode",
      "category",
      "supplier",
      "cost",
      "price",
      "stock",
      "minStock"
    ];

    const rows = products.map((product) => [
      product.name,
      product.barcode,
      product.category,
      product.supplier,
      product.costKnown === false ? "" : product.cost,
      product.price,
      product.stock,
      product.minStock
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    downloadFile(
      "global-stock-products.csv",
      "text/csv;charset=utf-8",
      csv
    );
  }

  async function importProducts(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const raw = await file.text();
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;

    const delimiter = lines[0].includes(";") ? ";" : ",";

    const parse = (line: string) => {
      const cells: string[] = [];
      let current = "";
      let quoted = false;

      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === '"') {
          if (quoted && line[index + 1] === '"') {
            current += '"';
            index += 1;
          } else {
            quoted = !quoted;
          }
        } else if (char === delimiter && !quoted) {
          cells.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }

      cells.push(current.trim());
      return cells;
    };

    const header = parse(lines[0]).map((value) => value.toLowerCase());
    const indexOfAny = (...names: string[]) => {
      for (const name of names) {
        const index = header.indexOf(name);
        if (index >= 0) return index;
      }
      return -1;
    };

    const nameIndex = indexOfAny("name", "nombre", "producto");
    if (nameIndex < 0) return;

    const barcodeIndex = indexOfAny(
      "barcode",
      "codigo",
      "código",
      "codigo_barras"
    );
    const categoryIndex = indexOfAny("category", "categoria", "categoría");
    const supplierIndex = indexOfAny("supplier", "proveedor");
    const costIndex = indexOfAny("cost", "costo");
    const priceIndex = indexOfAny("price", "precio");
    const stockIndex = indexOfAny("stock", "cantidad");
    const minIndex = indexOfAny(
      "minstock",
      "min_stock",
      "minimo",
      "mínimo"
    );

    const imported: Product[] = lines
      .slice(1)
      .map((line) => {
        const cells = parse(line);
        const numberAt = (index: number) =>
          index >= 0
            ? Math.max(
                0,
                Number(String(cells[index] || "0").replace(",", ".")) || 0
              )
            : 0;

        const name = String(cells[nameIndex] || "").trim();

        return {
          id: `import:${crypto.randomUUID()}`,
          barcode:
            barcodeIndex >= 0
              ? String(cells[barcodeIndex] || "").trim()
              : "",
          name,
          category:
            categoryIndex >= 0
              ? String(cells[categoryIndex] || "").trim()
              : "",
          supplier:
            supplierIndex >= 0
              ? String(cells[supplierIndex] || "").trim()
              : "",
          stock: numberAt(stockIndex),
          minStock: numberAt(minIndex),
          cost: numberAt(costIndex),
          costKnown:
            costIndex >= 0 && String(cells[costIndex] || "").trim() !== "",
          price: numberAt(priceIndex),
          sold30d: 0,
          source: "local"
        } as Product;
      })
      .filter((product) => product.name);

    if (imported.length) {
      window.dispatchEvent(
        new CustomEvent("global-stock-import-products", {
          detail: imported
        })
      );
    }

    event.target.value = "";
  }

  return (
    <section className="apex-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-[var(--apex-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
            Advanced Business OS
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            {tr(language, {
              es: "Herramientas avanzadas",
              en: "Advanced tools",
              pt: "Ferramentas avançadas",
              fr: "Outils avancés",
              de: "Erweiterte Werkzeuge"
            })}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] px-3 text-xs font-semibold"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {tools.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            className={
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition " +
              (tool === id
                ? "border-[#8F0000]/60 bg-[#8F0000]/10 text-[#8F0000]"
                : "border-[var(--apex-border)]")
            }
          >
            <Icon size={14} />
            {labels[id]}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tool === "orders" && (
          <div className="space-y-4">
            <ToolGrid
            title={labels.orders}
            form={
              <>
                <input
                  className="apex-input w-full p-3"
                  inputMode="decimal"
                  placeholder={tr(language, {
                    es: "Total del pedido",
                    en: "Order total"
                  })}
                  value={orderTotal}
                  onChange={(event) => setOrderTotal(event.target.value)}
                />
                <ApexSelect
                  className="apex-input w-full p-3"
                  value={orderFulfillment}
                  onChange={(event) =>
                    setOrderFulfillment(event.target.value)
                  }
                >
                  <option value="pickup">Retiro</option>
                  <option value="delivery">Delivery</option>
                  <option value="shipping">Envío</option>
                  <option value="dine_in">Mesa</option>
                  <option value="service">Servicio</option>
                </ApexSelect>
                <Action
                  onClick={() => void createOrder()}
                  label={tr(language, {
                    es: "Crear pedido",
                    en: "Create order"
                  })}
                />
              </>
            }
          >
            {orders.map((order) => (
              <ListCard
                key={order.id}
                title={`${order.provider} · ${money(
                  order.total,
                  order.currency || currency,
                  locale
                )}`}
                subtitle={`${order.fulfillment_type} · ${new Date(
                  order.created_at
                ).toLocaleString(locale)}`}
                action={
                  <ApexSelect
                    className="apex-input min-h-9 px-2 text-xs"
                    value={order.status}
                    onChange={(event) =>
                      void updateOrderStatus(order.id, event.target.value)
                    }
                  >
                    {[
                      "pending",
                      "paid",
                      "preparing",
                      "ready",
                      "shipped",
                      "delivered",
                      "cancelled",
                      "refunded"
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </ApexSelect>
                }
              />
            ))}
          </ToolGrid>

            <section className="apex-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Truck size={16} />
                <h4 className="font-semibold">
                  {tr(language, {
                    es: "Logística y seguimiento",
                    en: "Shipping & tracking"
                  })}
                </h4>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_140px_auto]">
                <ApexSelect
                  className="apex-input min-h-11 px-3"
                  value={shipmentOrder}
                  onChange={(event) => setShipmentOrder(event.target.value)}
                >
                  <option value="">Pedido</option>
                  {orders
                    .filter(
                      (order) =>
                        !["delivered", "cancelled", "refunded"].includes(
                          order.status
                        )
                    )
                    .map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.id.slice(0, 8)} · {money(
                          order.total,
                          order.currency || currency,
                          locale
                        )}
                      </option>
                    ))}
                </ApexSelect>
                <input
                  className="apex-input min-h-11 px-3"
                  placeholder="Transportista"
                  value={shipmentCarrier}
                  onChange={(event) => setShipmentCarrier(event.target.value)}
                />
                <input
                  className="apex-input min-h-11 px-3"
                  placeholder="Tracking"
                  value={shipmentTracking}
                  onChange={(event) => setShipmentTracking(event.target.value)}
                />
                <input
                  className="apex-input min-h-11 px-3"
                  inputMode="decimal"
                  placeholder="Costo"
                  value={shipmentCost}
                  onChange={(event) => setShipmentCost(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void createShipment()}
                  className="min-h-11 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white"
                >
                  Crear envío
                </button>
              </div>

              <div className="mt-4 divide-y divide-[var(--apex-border)] rounded-2xl border border-[var(--apex-border)]">
                {shipments.length ? (
                  shipments.slice(0, 12).map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {shipment.carrier || "Envío"}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                          {shipment.tracking_number || "Sin tracking"} ·{" "}
                          {money(shipment.shipping_cost, currency, locale)}
                        </p>
                      </div>
                      <ApexSelect
                        className="apex-input min-h-9 px-2 text-xs"
                        value={shipment.status}
                        onChange={(event) =>
                          void updateShipmentStatus(
                            shipment.id,
                            event.target.value
                          )
                        }
                      >
                        {[
                          "pending",
                          "label_created",
                          "picked_up",
                          "in_transit",
                          "delivered",
                          "exception",
                          "returned",
                          "cancelled"
                        ].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </ApexSelect>
                    </div>
                  ))
                ) : (
                  <Empty />
                )}
              </div>
            </section>
          </div>
        )}

        {tool === "inventory" && (
          <div className="grid gap-4 xl:grid-cols-3">
            <MiniPanel
              title={tr(language, {
                es: "Conteo con ajuste",
                en: "Count & adjust"
              })}
            >
              <ApexSelect
                className="apex-input w-full p-3"
                value={countLocation}
                onChange={(event) => setCountLocation(event.target.value)}
              >
                <option value="">Ubicación general</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </ApexSelect>
              <ApexSelect
                className="apex-input w-full p-3"
                value={countProduct}
                onChange={(event) => {
                  const value = event.target.value;
                  setCountProduct(value);
                  const product = products.find((item) => item.id === value);
                  setCountExpected(product ? String(product.stock) : "");
                }}
              >
                <option value="">Producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </ApexSelect>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="apex-input w-full p-3"
                  inputMode="decimal"
                  placeholder="Esperado"
                  value={countExpected}
                  onChange={(event) => setCountExpected(event.target.value)}
                />
                <input
                  className="apex-input w-full p-3"
                  inputMode="decimal"
                  placeholder="Contado"
                  value={countActual}
                  onChange={(event) => setCountActual(event.target.value)}
                />
              </div>
              <input
                className="apex-input w-full p-3"
                value={countScope}
                onChange={(event) => setCountScope(event.target.value)}
                placeholder="Motivo / observación"
              />
              <Action
                onClick={() => void createCount()}
                label={tr(language, {
                  es: "Aplicar conteo",
                  en: "Apply count"
                })}
              />
              <CompactList
                rows={counts.map((row) => ({
                  title: row.scope || "Conteo",
                  subtitle: row.status
                }))}
              />
            </MiniPanel>

            <MiniPanel
              title={tr(language, {
                es: "Transferir entre ubicaciones",
                en: "Transfer locations"
              })}
            >
              <ApexSelect
                className="apex-input w-full p-3"
                value={transferFrom}
                onChange={(event) => setTransferFrom(event.target.value)}
              >
                <option value="">Origen</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </ApexSelect>
              <ApexSelect
                className="apex-input w-full p-3"
                value={transferTo}
                onChange={(event) => setTransferTo(event.target.value)}
              >
                <option value="">Destino</option>
                {locations
                  .filter((location) => location.id !== transferFrom)
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </ApexSelect>
              <ApexSelect
                className="apex-input w-full p-3"
                value={transferProduct}
                onChange={(event) => setTransferProduct(event.target.value)}
              >
                <option value="">Producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </ApexSelect>
              <input
                className="apex-input w-full p-3"
                inputMode="decimal"
                placeholder="Cantidad"
                value={transferQuantity}
                onChange={(event) => setTransferQuantity(event.target.value)}
              />
              <input
                className="apex-input w-full p-3"
                placeholder="Motivo / referencia"
                value={transferNote}
                onChange={(event) => setTransferNote(event.target.value)}
              />
              <Action
                onClick={() => void createTransfer()}
                label={tr(language, {
                  es: "Transferir",
                  en: "Transfer"
                })}
              />
              <CompactList
                rows={transfers.map((row) => ({
                  title: row.notes || "Transferencia",
                  subtitle: row.status
                }))}
              />
            </MiniPanel>

            <MiniPanel
              title={tr(language, {
                es: "Lotes y vencimientos",
                en: "Lots & expiry"
              })}
            >
              <ApexSelect
                className="apex-input w-full p-3"
                value={lotProductKey}
                onChange={(event) => setLotProductKey(event.target.value)}
              >
                <option value="">Producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </ApexSelect>
              <input
                className="apex-input w-full p-3"
                placeholder="Lote"
                value={lotNumber}
                onChange={(event) => setLotNumber(event.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="apex-input w-full p-3"
                  inputMode="decimal"
                  placeholder="Cantidad"
                  value={lotQuantity}
                  onChange={(event) => setLotQuantity(event.target.value)}
                />
                <input
                  className="apex-input w-full p-3"
                  type="date"
                  value={lotExpiry}
                  onChange={(event) => setLotExpiry(event.target.value)}
                />
              </div>
              <Action
                onClick={() => void createLot()}
                label={tr(language, {
                  es: "Guardar lote",
                  en: "Save lot"
                })}
              />
              <CompactList
                rows={lots.slice(0, 8).map((row) => ({
                  title: `${row.lot_number} · ${row.quantity}`,
                  subtitle: row.expires_at || "Sin vencimiento"
                }))}
              />
            </MiniPanel>
          </div>
        )}

        {tool === "services" && (
          <ToolGrid
            title={labels.services}
            form={
              <>
                <input
                  className="apex-input w-full p-3"
                  placeholder={tr(language, {
                    es: "Trabajo / servicio",
                    en: "Job / service"
                  })}
                  value={serviceTitle}
                  onChange={(event) => setServiceTitle(event.target.value)}
                />
                <input
                  className="apex-input w-full p-3"
                  type="datetime-local"
                  value={serviceDate}
                  onChange={(event) => setServiceDate(event.target.value)}
                />
                <input
                  className="apex-input w-full p-3"
                  inputMode="decimal"
                  placeholder={tr(language, {
                    es: "Presupuesto",
                    en: "Estimate"
                  })}
                  value={serviceTotal}
                  onChange={(event) => setServiceTotal(event.target.value)}
                />
                <Action
                  onClick={() => void createService()}
                  label={tr(language, {
                    es: "Crear orden de trabajo",
                    en: "Create work order"
                  })}
                />
              </>
            }
          >
            {services.map((service) => (
              <ListCard
                key={service.id}
                title={service.title}
                subtitle={
                  service.scheduled_at
                    ? new Date(service.scheduled_at).toLocaleString(locale)
                    : "Sin turno"
                }
                value={money(service.estimated_total, currency, locale)}
                action={
                  <ApexSelect
                    className="apex-input min-h-9 px-2 text-xs"
                    value={service.status}
                    onChange={(event) =>
                      void updateServiceStatus(
                        service.id,
                        event.target.value
                      )
                    }
                  >
                    {[
                      "pending",
                      "scheduled",
                      "in_progress",
                      "waiting",
                      "ready",
                      "delivered",
                      "cancelled"
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </ApexSelect>
                }
              />
            ))}
          </ToolGrid>
        )}

        {tool === "reports" && (
          <BusinessReports
            businessId={businessId}
            language={language}
            currency={currency}
            locale={locale}
          />
        )}

        {tool === "automations" && (
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <MiniPanel title={labels.automations}>
              <input
                className="apex-input w-full p-3"
                placeholder={tr(language, {
                  es: "Nombre de la regla",
                  en: "Rule name"
                })}
                value={automationName}
                onChange={(event) =>
                  setAutomationName(event.target.value)
                }
              />
              <ApexSelect
                className="apex-input w-full p-3"
                value={automationEvent}
                onChange={(event) =>
                  setAutomationEvent(event.target.value)
                }
              >
                <option value="stock_below_min">
                  Stock debajo del mínimo
                </option>
                <option value="no_sales_30d">Sin ventas 30 días</option>
                <option value="low_margin">Margen bajo</option>
                <option value="low_cash">Caja / bancos debajo del umbral</option>
                <option value="project_over_hours">Proyecto excedido en horas</option>
                <option value="document_needs_review">Comprobante para revisar</option>
              </ApexSelect>
              {(automationEvent === "low_margin" ||
                automationEvent === "low_cash") && (
                <input
                  className="apex-input w-full p-3"
                  inputMode="decimal"
                  placeholder={
                    automationEvent === "low_margin"
                      ? "%"
                      : tr(language, {
                          es: "Umbral de saldo",
                          en: "Balance threshold"
                        })
                  }
                  value={automationThreshold}
                  onChange={(event) =>
                    setAutomationThreshold(event.target.value)
                  }
                />
              )}
              <Action
                onClick={() => void createAutomation()}
                label={tr(language, {
                  es: "Crear automatización",
                  en: "Create automation"
                })}
              />
              <button
                type="button"
                onClick={() => void evaluateAutomations()}
                className="min-h-11 w-full rounded-2xl border border-[var(--apex-border)] px-4 text-sm font-semibold"
              >
                {tr(language, {
                  es: "Evaluar ahora",
                  en: "Run now"
                })}
              </button>

              <CompactList
                rows={automations.map((rule) => ({
                  title: rule.name,
                  subtitle: rule.enabled
                    ? rule.event_type
                    : `${rule.event_type} · off`
                }))}
              />
            </MiniPanel>

            <section className="apex-card overflow-hidden border border-[var(--apex-border)]">
              <div className="border-b border-[var(--apex-border)] p-4">
                <h4 className="font-semibold">
                  {tr(language, {
                    es: "Alertas generadas",
                    en: "Generated alerts"
                  })}
                </h4>
              </div>
              <div className="divide-y divide-[var(--apex-border)]">
                {notifications.length ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">
                          {notification.title}
                        </p>
                        <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--apex-muted)]">
                          {notification.severity}
                        </span>
                      </div>
                      {notification.body && (
                        <p className="mt-1 text-xs text-[var(--apex-muted)]">
                          {notification.body}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <Empty />
                )}
              </div>
            </section>
          </div>
        )}

        {tool === "restaurant" && (
          <div className="grid gap-4 xl:grid-cols-2">
            <ToolGrid
              title={labels.restaurant}
              form={
                <>
                  <input
                    className="apex-input w-full p-3"
                    placeholder="Mesa"
                    value={tableName}
                    onChange={(event) => setTableName(event.target.value)}
                  />
                  <input
                    className="apex-input w-full p-3"
                    inputMode="numeric"
                    placeholder="Personas"
                    value={tableSeats}
                    onChange={(event) => setTableSeats(event.target.value)}
                  />
                  <Action
                    onClick={() => void addDiningTable()}
                    label={tr(language, {
                      es: "Agregar mesa",
                      en: "Add table"
                    })}
                  />
                </>
              }
            >
              {tables.map((table) => (
                <ListCard
                  key={table.id}
                  title={table.name}
                  subtitle={`${table.seats} personas`}
                  action={
                    <ApexSelect
                      className="apex-input min-h-9 px-2 text-xs"
                      value={table.status}
                      onChange={(event) =>
                        void updateTableStatus(table.id, event.target.value)
                      }
                    >
                      {[
                        "available",
                        "occupied",
                        "reserved",
                        "cleaning",
                        "disabled"
                      ].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </ApexSelect>
                  }
                />
              ))}
            </ToolGrid>

            <section className="apex-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <ChefHat size={16} />
                <h4 className="font-semibold">Cocina / KDS</h4>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <ApexSelect
                  className="apex-input min-h-11 px-3"
                  value={kitchenOrder}
                  onChange={(event) => setKitchenOrder(event.target.value)}
                >
                  <option value="">Pedido</option>
                  {orders
                    .filter(
                      (order) =>
                        !["delivered", "cancelled", "refunded"].includes(
                          order.status
                        )
                    )
                    .map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.id.slice(0, 8)} · {order.status}
                      </option>
                    ))}
                </ApexSelect>
                <input
                  className="apex-input min-h-11 px-3"
                  placeholder="Estación (barra, cocina...)"
                  value={kitchenStation}
                  onChange={(event) => setKitchenStation(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void createKitchenTicket()}
                  className="min-h-11 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white"
                >
                  Enviar
                </button>
              </div>

              <div className="mt-4 divide-y divide-[var(--apex-border)] rounded-2xl border border-[var(--apex-border)]">
                {kitchenTickets.length ? (
                  kitchenTickets.slice(0, 20).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          #{ticket.order_id.slice(0, 8)} · {ticket.station}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                          {new Date(ticket.created_at).toLocaleTimeString(
                            locale,
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      </div>
                      <ApexSelect
                        className="apex-input min-h-9 px-2 text-xs"
                        value={ticket.status}
                        onChange={(event) =>
                          void updateKitchenTicket(
                            ticket.id,
                            event.target.value
                          )
                        }
                      >
                        {[
                          "queued",
                          "preparing",
                          "ready",
                          "served",
                          "cancelled"
                        ].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </ApexSelect>
                    </div>
                  ))
                ) : (
                  <Empty />
                )}
              </div>
            </section>
          </div>
        )}

        {tool === "pricing" && (
          <ToolGrid
            title={labels.pricing}
            form={
              <>
                <input
                  className="apex-input w-full p-3"
                  placeholder={tr(language, {
                    es: "Nombre de la lista",
                    en: "Price list name"
                  })}
                  value={priceListName}
                  onChange={(event) => setPriceListName(event.target.value)}
                />
                <input
                  className="apex-input w-full p-3"
                  placeholder={tr(language, {
                    es: "Grupo de clientes",
                    en: "Customer group"
                  })}
                  value={customerGroup}
                  onChange={(event) => setCustomerGroup(event.target.value)}
                />
                <Action
                  onClick={() => void addPriceList()}
                  label={tr(language, {
                    es: "Crear lista",
                    en: "Create list"
                  })}
                />
              </>
            }
          >
            {priceLists.map((priceList) => (
              <ListCard
                key={priceList.id}
                title={priceList.name}
                subtitle={priceList.customer_group || "General"}
                value={priceList.currency}
              />
            ))}
          </ToolGrid>
        )}

        {tool === "catalog" && (
          <CatalogTools
            businessId={businessId}
            language={language}
            currency={currency}
            locale={locale}
          />
        )}

        {tool === "commercial" && (
          <CommercialOperations
            businessId={businessId}
            language={language}
            currency={currency}
            locale={locale}
          />
        )}

        {tool === "data" && (
          <div className="grid gap-4 md:grid-cols-3">
            <DataAction
              icon={<Download size={18} />}
              title={tr(language, {
                es: "Backup completo",
                en: "Full backup"
              })}
              body={tr(language, {
                es: "Exporta la información principal del negocio en JSON.",
                en: "Exports the main business data as JSON."
              })}
              button={tr(language, {
                es: "Descargar backup",
                en: "Download backup"
              })}
              onClick={() => void exportBackup()}
            />

            <DataAction
              icon={<Truck size={18} />}
              title="CSV"
              body={tr(language, {
                es: "Exporta productos para Excel, Sheets u otro sistema.",
                en: "Export products for Excel, Sheets or another system."
              })}
              button={tr(language, {
                es: "Exportar productos",
                en: "Export products"
              })}
              onClick={exportProductsCsv}
            />

            <DataAction
              icon={<FileUp size={18} />}
              title={tr(language, {
                es: "Importador universal",
                en: "Universal importer"
              })}
              body={tr(language, {
                es: "Importa productos desde CSV sin volver a cargarlos a mano.",
                en: "Import products from CSV without entering them manually."
              })}
              button={tr(language, {
                es: "Importar CSV",
                en: "Import CSV"
              })}
              onClick={() => fileInputRef.current?.click()}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => void importProducts(event)}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function Action({
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
      className="min-h-11 w-full rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white"
    >
      <span className="inline-flex items-center gap-2">
        <Plus size={15} />
        {label}
      </span>
    </button>
  );
}

function MiniPanel({
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

function ToolGrid({
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
      <MiniPanel title={title}>{form}</MiniPanel>
      <section className="overflow-hidden rounded-[24px] border border-[var(--apex-border)] bg-[var(--apex-bg)]">
        <div className="border-b border-[var(--apex-border)] p-4">
          <h4 className="font-semibold">{title}</h4>
        </div>
        <div className="divide-y divide-[var(--apex-border)]">
          {children || <Empty />}
        </div>
      </section>
    </div>
  );
}

function ListCard({
  title,
  subtitle,
  value,
  action
}: {
  title: string;
  subtitle: string;
  value?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 truncate text-[10px] text-[var(--apex-muted)]">
          {subtitle}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {value && <strong className="text-sm">{value}</strong>}
        {action}
      </div>
    </div>
  );
}

function CompactList({
  rows
}: {
  rows: Array<{ title: string; subtitle: string }>;
}) {
  if (!rows.length) return <Empty />;

  return (
    <div className="mt-3 divide-y divide-[var(--apex-border)] rounded-2xl border border-[var(--apex-border)]">
      {rows.slice(0, 8).map((row, index) => (
        <div key={`${row.title}-${index}`} className="p-3">
          <p className="text-xs font-semibold">{row.title}</p>
          <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
            {row.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <p className="p-4 text-sm text-[var(--apex-muted)]">
      Todavía no hay registros.
    </p>
  );
}

function DataAction({
  icon,
  title,
  body,
  button,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
        {icon}
      </span>
      <h4 className="mt-4 font-semibold">{title}</h4>
      <p className="mt-2 text-xs leading-5 text-[var(--apex-muted)]">
        {body}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 min-h-11 w-full rounded-2xl border border-[var(--apex-border)] px-4 text-sm font-semibold"
      >
        {button}
      </button>
    </section>
  );
}
