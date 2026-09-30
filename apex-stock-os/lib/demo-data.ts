import type { Product, TrendPoint } from "./types";

export const demoProducts: Product[] = [
  {
    id: "p-001",
    barcode: "7791234567890",
    name: "Reel Frontal Apex 4000",
    category: "Reels",
    supplier: "Delta Fishing Supply",
    stock: 18,
    minStock: 8,
    cost: 46500,
    price: 72900,
    sold30d: 27
  },
  {
    id: "p-002",
    barcode: "7791234567891",
    name: "Caña Carbon Pro 2.40 m",
    category: "Cañas",
    supplier: "South Gear",
    stock: 6,
    minStock: 10,
    cost: 58200,
    price: 89900,
    sold30d: 19
  },
  {
    id: "p-003",
    barcode: "7791234567892",
    name: "Señuelo Minnow 120",
    category: "Señuelos",
    supplier: "River Labs",
    stock: 42,
    minStock: 15,
    cost: 6100,
    price: 11900,
    sold30d: 54
  },
  {
    id: "p-004",
    barcode: "7791234567893",
    name: "Tanza Monofilamento 0.35",
    category: "Líneas",
    supplier: "River Labs",
    stock: 0,
    minStock: 12,
    cost: 4900,
    price: 8900,
    sold30d: 38
  },
  {
    id: "p-005",
    barcode: "7791234567894",
    name: "Caja Organizadora 3600",
    category: "Accesorios",
    supplier: "Delta Fishing Supply",
    stock: 13,
    minStock: 6,
    cost: 12800,
    price: 21900,
    sold30d: 14
  },
  {
    id: "p-006",
    barcode: "7791234567895",
    name: "Anzuelo Forjado #2 x20",
    category: "Terminales",
    supplier: "South Gear",
    stock: 9,
    minStock: 14,
    cost: 2700,
    price: 5900,
    sold30d: 61
  }
];

export const demoTrend: TrendPoint[] = [
  { label: "Lun", revenue: 612000, cost: 372000, profit: 240000 },
  { label: "Mar", revenue: 748000, cost: 433000, profit: 315000 },
  { label: "Mié", revenue: 695000, cost: 420000, profit: 275000 },
  { label: "Jue", revenue: 831000, cost: 486000, profit: 345000 },
  { label: "Vie", revenue: 970000, cost: 555000, profit: 415000 },
  { label: "Sáb", revenue: 1214000, cost: 690000, profit: 524000 },
  { label: "Dom", revenue: 702000, cost: 421000, profit: 281000 }
];

export const productCatalog = Object.fromEntries(
  demoProducts.map((product) => [product.barcode, product])
);
