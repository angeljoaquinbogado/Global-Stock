export type StockStatus = "normal" | "low" | "out";

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
