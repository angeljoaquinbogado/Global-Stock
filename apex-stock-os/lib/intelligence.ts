import {
  calculateMetrics,
  formatMoney,
  getTopSellingProducts,
  rankRestockNeeds
} from "./analytics";
import type { BusinessSnapshot } from "./types";

export function answerBusinessQuestion(
  snapshot: BusinessSnapshot,
  question: string
) {
  const q = normalize(question);
  const metrics = calculateMetrics(snapshot);
  const restock = rankRestockNeeds(snapshot.products);
  const topSelling = getTopSellingProducts(snapshot.products, 3);

  const money = (value: number) =>
    formatMoney(
      value * snapshot.currencyRate,
      snapshot.currency,
      snapshot.locale
    );

  if (containsAny(q, ["reponer", "reposicion", "comprar", "stock bajo"])) {
    const urgent = restock
      .filter((item) => item.suggestedUnits > 0)
      .slice(0, 4);

    if (!urgent.length) {
      return "No detecto reposiciones necesarias con los mínimos y la velocidad de venta actuales.";
    }

    const lines = urgent.map(
      ({ product, daysCover, suggestedUnits }, index) =>
        `${index + 1}. ${product.name}: ${suggestedUnits} u. sugeridas; cobertura estimada ${daysCover.toFixed(1)} días; stock actual ${product.stock}.`
    );

    return [
      "Prioridad de reposición calculada por cobertura de stock y ventas de los últimos 30 días:",
      ...lines,
      "La prioridad aumenta cuando el producto está agotado, por debajo del mínimo o tiene alta rotación."
    ].join("\n");
  }

  if (containsAny(q, ["mas vendido", "más vendido", "ventas", "rotacion"])) {
    return [
      "Productos con mayor rotación en la ventana disponible:",
      ...topSelling.map(
        (product, index) =>
          `${index + 1}. ${product.name}: ${product.sold30d} unidades en 30 días.`
      )
    ].join("\n");
  }

  if (containsAny(q, ["margen", "rentabilidad", "beneficio"])) {
    const weakestMargin = [...snapshot.products]
      .filter((product) => product.price > 0)
      .map((product) => ({
        product,
        margin: ((product.price - product.cost) / product.price) * 100
      }))
      .sort((a, b) => a.margin - b.margin)
      .slice(0, 3);

    return [
      `Margen operativo del período visible: ${metrics.marginPct.toFixed(1)}%. Ganancia bruta: ${money(metrics.grossProfit)} sobre ingresos por ${money(metrics.revenue)}.`,
      "Los márgenes unitarios más ajustados son:",
      ...weakestMargin.map(
        ({ product, margin }) =>
          `• ${product.name}: ${margin.toFixed(1)}%.`
      )
    ].join("\n");
  }

  if (containsAny(q, ["gan", "profit", "utilidad", "resultado"])) {
    return `El período visible acumula ${money(metrics.revenue)} de ingresos y ${money(metrics.grossProfit)} de ganancia bruta, con un margen de ${metrics.marginPct.toFixed(1)}%.`;
  }

  if (containsAny(q, ["inventario", "capital", "costo de stock"])) {
    return `El inventario actual representa ${money(metrics.inventoryCost)} a costo, distribuido en ${metrics.inventoryUnits} unidades. Hay ${metrics.lowStockCount} productos en stock bajo y ${metrics.outOfStockCount} agotados.`;
  }

  if (containsAny(q, ["agotado", "sin stock", "critico", "crítico"])) {
    const critical = snapshot.products.filter(
      (product) => product.stock <= product.minStock
    );

    if (!critical.length) {
      return "No hay productos por debajo de su stock mínimo.";
    }

    return [
      `Hay ${critical.length} productos en condición crítica:`,
      ...critical.map(
        (product) =>
          `• ${product.name}: ${product.stock} u. disponibles; mínimo ${product.minStock}.`
      )
    ].join("\n");
  }

  const highestRevenueDay = [...snapshot.trend].sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  return [
    `Estado operativo: ${money(metrics.revenue)} de ingresos, ${money(metrics.grossProfit)} de ganancia bruta y ${metrics.marginPct.toFixed(1)}% de margen.`,
    `${metrics.lowStockCount + metrics.outOfStockCount} productos requieren atención de inventario.`,
    highestRevenueDay
      ? `El punto de mayor ingreso en la serie visible es ${highestRevenueDay.label}, con ${money(highestRevenueDay.revenue)}.`
      : "No hay una serie de ventas disponible.",
    "Podés preguntarme por reposición, margen, rentabilidad, productos más vendidos, inventario o stock crítico."
  ].join("\n");
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function containsAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(normalize(term)));
}
