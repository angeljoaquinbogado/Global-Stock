import type { Product, TrendPoint } from "./types";

/**
 * Neutral Argentine small-business sample data used only in the explicitly
 * labelled demo workspace. Keep it aligned with Global Stock's real inventory
 * model; never imply these records belong to a signed-in business.
 */
export const demoProducts: Product[] = [
  {
    id: "demo-p-001",
    barcode: "7790001000010",
    name: "Yerba mate 1 kg",
    category: "Almacén",
    supplier: "Distribuidora Norte",
    stock: 24,
    minStock: 10,
    cost: 4200,
    price: 6200,
    sold30d: 38
  },
  {
    id: "demo-p-002",
    barcode: "7790001000027",
    name: "Leche entera 1 L",
    category: "Lácteos",
    supplier: "Lácteos del Parque",
    stock: 7,
    minStock: 12,
    cost: 1100,
    price: 1650,
    sold30d: 64
  },
  {
    id: "demo-p-003",
    barcode: "7790001000034",
    name: "Fideos secos 500 g",
    category: "Almacén",
    supplier: "Distribuidora Norte",
    stock: 31,
    minStock: 12,
    cost: 850,
    price: 1350,
    sold30d: 45
  },
  {
    id: "demo-p-004",
    barcode: "7790001000041",
    name: "Aceite de girasol 900 ml",
    category: "Almacén",
    supplier: "Mayorista Central",
    stock: 0,
    minStock: 8,
    cost: 1900,
    price: 2750,
    sold30d: 29
  },
  {
    id: "demo-p-005",
    barcode: "7790001000058",
    name: "Galletitas surtidas 300 g",
    category: "Golosinas",
    supplier: "Mayorista Central",
    stock: 16,
    minStock: 8,
    cost: 1250,
    price: 1950,
    sold30d: 33
  },
  {
    id: "demo-p-006",
    barcode: "7790001000065",
    name: "Agua mineral 1,5 L",
    category: "Bebidas",
    supplier: "Bebidas del Río",
    stock: 5,
    minStock: 14,
    cost: 700,
    price: 1200,
    sold30d: 52
  }
];

export const demoTrend: TrendPoint[] = [
  { label: "Lun", revenue: 182000, cost: 119000, profit: 63000 },
  { label: "Mar", revenue: 216000, cost: 139000, profit: 77000 },
  { label: "Mié", revenue: 198000, cost: 128000, profit: 70000 },
  { label: "Jue", revenue: 247000, cost: 157000, profit: 90000 },
  { label: "Vie", revenue: 289000, cost: 181000, profit: 108000 },
  { label: "Sáb", revenue: 334000, cost: 209000, profit: 125000 },
  { label: "Dom", revenue: 221000, cost: 144000, profit: 77000 }
];

export const productCatalog = Object.fromEntries(
  demoProducts.map((product) => [product.barcode, product])
);
