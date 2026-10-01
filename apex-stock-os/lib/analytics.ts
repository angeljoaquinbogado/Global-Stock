import type {
  BusinessSnapshot,
  DashboardMetrics,
  Product,
  StockStatus
} from "./types";

export function getStockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return "out";
  if (product.stock <= product.minStock) return "low";
  return "normal";
}

export function calculateMetrics(snapshot: BusinessSnapshot): DashboardMetrics {
  const revenue = snapshot.trend.reduce((sum, point) => sum + point.revenue, 0);
  const costOfSales = snapshot.trend.reduce((sum, point) => sum + point.cost, 0);
  const grossProfit = revenue - costOfSales;

  const inventoryCost = snapshot.products.reduce(
    (sum, product) =>
      product.costKnown === false
        ? sum
        : sum + product.stock * product.cost,
    0
  );

  const lowStockCount = snapshot.products.filter(
    (product) => getStockStatus(product) === "low"
  ).length;

  const outOfStockCount = snapshot.products.filter(
    (product) => getStockStatus(product) === "out"
  ).length;

  const inventoryUnits = snapshot.products.reduce(
    (sum, product) => sum + product.stock,
    0
  );

  return {
    revenue,
    inventoryCost,
    grossProfit,
    marginPct: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    lowStockCount,
    outOfStockCount,
    inventoryUnits
  };
}

export function rankRestockNeeds(products: Product[]) {
  return products
    .map((product) => {
      const demandPerDay = Math.max(product.sold30d / 30, 0.05);
      const daysCover = product.stock / demandPerDay;
      const targetStock = Math.ceil(demandPerDay * 30 + product.minStock);
      const suggestedUnits = Math.max(0, targetStock - product.stock);

      return {
        product,
        daysCover,
        suggestedUnits,
        urgency:
          product.stock <= 0
            ? 100
            : Math.max(
                0,
                100 - Math.min(daysCover, 30) * 2.5
              ) + (product.stock <= product.minStock ? 20 : 0)
      };
    })
    .sort((a, b) => b.urgency - a.urgency);
}

export function getTopSellingProducts(products: Product[], limit = 3) {
  return [...products]
    .sort((a, b) => b.sold30d - a.sold30d)
    .slice(0, limit);
}

export function formatMoney(
  value: number,
  currency: string,
  locale = "es-AR"
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2
  }).format(value);
}
