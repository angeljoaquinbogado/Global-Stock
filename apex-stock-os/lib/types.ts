export type StockStatus = "normal" | "low" | "out";

export type ProductInventoryDetails = {
  profile?: "basic" | "perishable" | "serialized" | "warehouse";
  sku?: string;
  unit?: string;
  location?: string;
  shelf?: string;
  receivedOn?: string;
  manufacturedOn?: string;
  expiresOn?: string;
  batchCode?: string;
  serialNumber?: string;
  reorderPoint?: number;
  leadTimeDays?: number;
  safetyStock?: number;
  notes?: string;
  trackReceived?: boolean;
  trackExpiry?: boolean;
  trackManufacturing?: boolean;
  trackBatch?: boolean;
  trackSerial?: boolean;
  trackLocation?: boolean;
};

export type Product = {
  id: string;
  barcode: string;
  name: string;
  category: string;
  supplier: string;
  stock: number;
  minStock: number;
  cost: number;
  price: number;
  sold30d: number;
  source?: "demo" | "local" | "connected";
  externalId?: string;
  sourceStoreId?: string;
  sourceStoreUrl?: string;
  costKnown?: boolean;
  description?: string;
  brand?: string;
  image?: string;
  images?: string[];
  originalPrice?: number;
  discountPercent?: number;
  active?: boolean;
  updatedAt?: string | null;
  inventoryDetails?: ProductInventoryDetails;
};

export type TrendPoint = {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type BusinessSnapshot = {
  products: Product[];
  trend: TrendPoint[];
  currency: string;
  currencyRate: number;
  locale: string;
};

export type DashboardMetrics = {
  revenue: number;
  inventoryCost: number;
  grossProfit: number;
  marginPct: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryUnits: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
