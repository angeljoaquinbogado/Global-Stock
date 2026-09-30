import {
  calculateMetrics,
  formatMoney,
  getStockStatus,
  getTopSellingProducts,
  rankRestockNeeds
} from "./analytics";
import type { BusinessSnapshot, Product } from "./types";

type Language = "es" | "en" | "pt" | "fr" | "de";

export function answerBusinessQuestion(
  snapshot: BusinessSnapshot,
  question: string
) {
  const q = normalize(question);
  const language = languageFromLocale(snapshot.locale);
  const metrics = calculateMetrics(snapshot);
  const restock = rankRestockNeeds(snapshot.products);
  const topSelling = getTopSellingProducts(snapshot.products, 5);

  const money = (value: number) =>
    formatMoney(
      value * snapshot.currencyRate,
      snapshot.currency,
      snapshot.locale
    );

  const productMatch = findProduct(snapshot.products, q);
  if (productMatch) {
    return productAnalysis(productMatch, snapshot, language, money);
  }

  const percentage = extractPercentage(q);
  if (
    percentage !== null &&
    containsAny(q, [
      "precio",
      "preco",
      "price",
      "prix",
      "preis",
      "subo",
      "aumento",
      "increase"
    ])
  ) {
    const newRevenue = metrics.revenue * (1 + percentage / 100);
    const projectedProfit = newRevenue -
      snapshot.trend.reduce((sum, point) => sum + point.cost, 0);
    const projectedMargin =
      newRevenue > 0 ? (projectedProfit / newRevenue) * 100 : 0;

    return localized(language, {
      es: `Si el volumen vendido se mantuviera y aumentás precios ${percentage.toFixed(1)}%, los ingresos teóricos pasarían de ${money(metrics.revenue)} a ${money(newRevenue)}. La ganancia bruta proyectada sería ${money(projectedProfit)} y el margen ${projectedMargin.toFixed(1)}%. Esto es un escenario, no contempla caída de demanda.`,
      en: `If sales volume stayed constant and prices increased by ${percentage.toFixed(1)}%, theoretical revenue would move from ${money(metrics.revenue)} to ${money(newRevenue)}. Projected gross profit would be ${money(projectedProfit)} with a ${projectedMargin.toFixed(1)}% margin. This is a scenario and does not model demand elasticity.`,
      pt: `Se o volume vendido permanecesse igual e os preços subissem ${percentage.toFixed(1)}%, a receita teórica passaria de ${money(metrics.revenue)} para ${money(newRevenue)}. O lucro bruto projetado seria ${money(projectedProfit)} com margem de ${projectedMargin.toFixed(1)}%. É um cenário e não considera queda de demanda.`,
      fr: `Si le volume vendu restait stable et que les prix augmentaient de ${percentage.toFixed(1)}%, le chiffre d’affaires théorique passerait de ${money(metrics.revenue)} à ${money(newRevenue)}. Le bénéfice brut projeté serait de ${money(projectedProfit)} avec une marge de ${projectedMargin.toFixed(1)}%. Ce scénario ne modélise pas l’élasticité de la demande.`,
      de: `Wenn das Verkaufsvolumen gleich bliebe und die Preise um ${percentage.toFixed(1)}% stiegen, würde der theoretische Umsatz von ${money(metrics.revenue)} auf ${money(newRevenue)} steigen. Der prognostizierte Bruttogewinn läge bei ${money(projectedProfit)} und die Marge bei ${projectedMargin.toFixed(1)}%. Das ist ein Szenario ohne Nachfrageelastizität.`
    });
  }

  if (
    containsAny(q, [
      "reponer",
      "reposicion",
      "reposição",
      "restock",
      "buy",
      "comprar",
      "stock bajo",
      "low stock"
    ])
  ) {
    const urgent = restock
      .filter((item) => item.suggestedUnits > 0)
      .slice(0, 5);

    if (!urgent.length) {
      return localized(language, {
        es: "No detecto reposiciones necesarias con los mínimos y la velocidad de venta actuales.",
        en: "I do not detect any restocking need with the current minimums and sales velocity.",
        pt: "Não detecto necessidade de reposição com os mínimos e a velocidade de vendas atuais.",
        fr: "Je ne détecte aucun besoin de réapprovisionnement avec les minimums et la vitesse de vente actuels.",
        de: "Mit den aktuellen Mindestbeständen und der Verkaufsgeschwindigkeit erkenne ich keinen Nachbestellbedarf."
      });
    }

    const budget = urgent.reduce(
      (sum, item) => sum + item.suggestedUnits * item.product.cost,
      0
    );

    const lines = urgent.map(
      ({ product, daysCover, suggestedUnits }, index) =>
        `${index + 1}. ${product.name}: ${suggestedUnits} u. · ${daysCover.toFixed(1)} días de cobertura · stock ${product.stock}.`
    );

    return localized(language, {
      es: [
        `Prioridad de reposición: inversión estimada ${money(budget)}.`,
        ...lines,
        "Ordené la lista por agotados, cobertura restante y rotación de los últimos 30 días."
      ].join("\n"),
      en: [
        `Restock priority: estimated purchase budget ${money(budget)}.`,
        ...lines,
        "The ranking weighs stockouts, days of cover and 30-day sales velocity."
      ].join("\n"),
      pt: [
        `Prioridade de reposição: investimento estimado ${money(budget)}.`,
        ...lines,
        "A ordem considera ruptura, dias de cobertura e rotação dos últimos 30 dias."
      ].join("\n"),
      fr: [
        `Priorité de réapprovisionnement : budget estimé ${money(budget)}.`,
        ...lines,
        "Le classement tient compte des ruptures, des jours de couverture et de la rotation sur 30 jours."
      ].join("\n"),
      de: [
        `Nachbestellpriorität: geschätztes Einkaufsbudget ${money(budget)}.`,
        ...lines,
        "Die Reihenfolge berücksichtigt Ausverkäufe, Reichweite und 30-Tage-Umschlag."
      ].join("\n")
    });
  }

  if (
    containsAny(q, [
      "mas vendido",
      "más vendido",
      "best seller",
      "vendido",
      "rotacion",
      "rotation",
      "rotação"
    ])
  ) {
    const lines = topSelling.map(
      (product, index) =>
        `${index + 1}. ${product.name}: ${product.sold30d} u. / 30 días · margen unitario ${unitMargin(product).toFixed(1)}%.`
    );

    return localized(language, {
      es: ["Mayor rotación del período:", ...lines].join("\n"),
      en: ["Highest rotation in the available period:", ...lines].join("\n"),
      pt: ["Maior rotação no período disponível:", ...lines].join("\n"),
      fr: ["Rotation la plus forte sur la période :", ...lines].join("\n"),
      de: ["Höchster Umschlag im verfügbaren Zeitraum:", ...lines].join("\n")
    });
  }

  if (
    containsAny(q, [
      "margen",
      "margin",
      "rentabilidad",
      "profitability",
      "rentabilité",
      "marge"
    ])
  ) {
    const weakest = [...snapshot.products]
      .filter((product) => product.price > 0)
      .map((product) => ({ product, margin: unitMargin(product) }))
      .sort((a, b) => a.margin - b.margin)
      .slice(0, 4);

    const strongest = [...snapshot.products]
      .filter((product) => product.price > 0)
      .map((product) => ({ product, margin: unitMargin(product) }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 3);

    return localized(language, {
      es: [
        `Margen bruto del período: ${metrics.marginPct.toFixed(1)}% · ganancia ${money(metrics.grossProfit)} sobre ${money(metrics.revenue)} de ingresos.`,
        "Márgenes más ajustados:",
        ...weakest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`),
        "Mejores márgenes:",
        ...strongest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`)
      ].join("\n"),
      en: [
        `Gross margin for the period: ${metrics.marginPct.toFixed(1)}% · profit ${money(metrics.grossProfit)} on ${money(metrics.revenue)} revenue.`,
        "Tightest margins:",
        ...weakest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`),
        "Best margins:",
        ...strongest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`)
      ].join("\n"),
      pt: [
        `Margem bruta do período: ${metrics.marginPct.toFixed(1)}% · lucro ${money(metrics.grossProfit)} sobre ${money(metrics.revenue)} de receita.`,
        "Margens mais apertadas:",
        ...weakest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`),
        "Melhores margens:",
        ...strongest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`)
      ].join("\n"),
      fr: [
        `Marge brute de la période : ${metrics.marginPct.toFixed(1)}% · bénéfice ${money(metrics.grossProfit)} sur ${money(metrics.revenue)} de revenus.`,
        "Marges les plus faibles :",
        ...weakest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`),
        "Meilleures marges :",
        ...strongest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`)
      ].join("\n"),
      de: [
        `Bruttomarge im Zeitraum: ${metrics.marginPct.toFixed(1)}% · Gewinn ${money(metrics.grossProfit)} bei ${money(metrics.revenue)} Umsatz.`,
        "Niedrigste Margen:",
        ...weakest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`),
        "Beste Margen:",
        ...strongest.map(({ product, margin }) => `• ${product.name}: ${margin.toFixed(1)}%.`)
      ].join("\n")
    });
  }

  if (
    containsAny(q, [
      "sin movimiento",
      "no se vende",
      "dead stock",
      "slow",
      "parado",
      "encalhado",
      "immobile"
    ])
  ) {
    const slow = [...snapshot.products]
      .sort((a, b) => a.sold30d - b.sold30d)
      .slice(0, 5);
    const trappedCapital = slow.reduce(
      (sum, product) => sum + product.stock * product.cost,
      0
    );

    return localized(language, {
      es: [
        `Capital inmovilizado aproximado en los 5 productos más lentos: ${money(trappedCapital)}.`,
        ...slow.map((product) => `• ${product.name}: ${product.sold30d} ventas/30d · stock ${product.stock}.`),
        "Podrías revisar promociones, bundles o bajar compras futuras antes de tocar precio."
      ].join("\n"),
      en: [
        `Approximate capital tied in the 5 slowest products: ${money(trappedCapital)}.`,
        ...slow.map((product) => `• ${product.name}: ${product.sold30d} sales/30d · stock ${product.stock}.`),
        "Consider promotions, bundles or reducing future purchasing before cutting price."
      ].join("\n"),
      pt: [
        `Capital aproximado parado nos 5 produtos mais lentos: ${money(trappedCapital)}.`,
        ...slow.map((product) => `• ${product.name}: ${product.sold30d} vendas/30d · estoque ${product.stock}.`),
        "Vale revisar promoções, combos ou reduzir compras futuras antes de baixar preço."
      ].join("\n"),
      fr: [
        `Capital immobilisé approximatif sur les 5 produits les plus lents : ${money(trappedCapital)}.`,
        ...slow.map((product) => `• ${product.name}: ${product.sold30d} ventes/30j · stock ${product.stock}.`),
        "Envisagez promotions, bundles ou baisse des achats futurs avant de réduire le prix."
      ].join("\n"),
      de: [
        `Ungefähr gebundenes Kapital in den 5 langsamsten Produkten: ${money(trappedCapital)}.`,
        ...slow.map((product) => `• ${product.name}: ${product.sold30d} Verkäufe/30T · Bestand ${product.stock}.`),
        "Prüfe Aktionen, Bundles oder geringere Nachkäufe, bevor du Preise senkst."
      ].join("\n")
    });
  }

  if (
    containsAny(q, [
      "gan",
      "profit",
      "utilidad",
      "resultado",
      "benefice",
      "gewinn"
    ])
  ) {
    return localized(language, {
      es: `Resultado visible: ingresos ${money(metrics.revenue)}, ganancia bruta ${money(metrics.grossProfit)}, margen ${metrics.marginPct.toFixed(1)}% y capital actual en inventario ${money(metrics.inventoryCost)}.`,
      en: `Visible result: revenue ${money(metrics.revenue)}, gross profit ${money(metrics.grossProfit)}, margin ${metrics.marginPct.toFixed(1)}% and current inventory capital ${money(metrics.inventoryCost)}.`,
      pt: `Resultado visível: receita ${money(metrics.revenue)}, lucro bruto ${money(metrics.grossProfit)}, margem ${metrics.marginPct.toFixed(1)}% e capital atual em estoque ${money(metrics.inventoryCost)}.`,
      fr: `Résultat visible : revenus ${money(metrics.revenue)}, bénéfice brut ${money(metrics.grossProfit)}, marge ${metrics.marginPct.toFixed(1)}% et capital en stock ${money(metrics.inventoryCost)}.`,
      de: `Sichtbares Ergebnis: Umsatz ${money(metrics.revenue)}, Bruttogewinn ${money(metrics.grossProfit)}, Marge ${metrics.marginPct.toFixed(1)}% und aktuelles Lagerkapital ${money(metrics.inventoryCost)}.`
    });
  }

  if (
    containsAny(q, [
      "inventario",
      "inventory",
      "estoque",
      "stock",
      "capital",
      "lager"
    ])
  ) {
    const critical = snapshot.products.filter(
      (product) => getStockStatus(product) !== "normal"
    );
    const healthiest = [...snapshot.products]
      .filter((product) => getStockStatus(product) === "normal")
      .sort((a, b) => b.sold30d - a.sold30d)
      .slice(0, 3);

    return localized(language, {
      es: [
        `Tenés ${metrics.inventoryUnits} unidades con un costo de ${money(metrics.inventoryCost)}.`,
        `${metrics.lowStockCount} productos están bajos y ${metrics.outOfStockCount} agotados.`,
        critical.length
          ? `Atención inmediata: ${critical.slice(0, 4).map((product) => product.name).join(", ")}.`
          : "No hay productos críticos.",
        healthiest.length
          ? `Stock saludable con buena rotación: ${healthiest.map((product) => product.name).join(", ")}.`
          : ""
      ].filter(Boolean).join("\n"),
      en: `You have ${metrics.inventoryUnits} units at a cost of ${money(metrics.inventoryCost)}. ${metrics.lowStockCount} products are low and ${metrics.outOfStockCount} are out of stock.`,
      pt: `Você tem ${metrics.inventoryUnits} unidades a um custo de ${money(metrics.inventoryCost)}. ${metrics.lowStockCount} produtos estão baixos e ${metrics.outOfStockCount} esgotados.`,
      fr: `Vous avez ${metrics.inventoryUnits} unités pour un coût de ${money(metrics.inventoryCost)}. ${metrics.lowStockCount} produits sont faibles et ${metrics.outOfStockCount} épuisés.`,
      de: `Du hast ${metrics.inventoryUnits} Einheiten mit Lagerkosten von ${money(metrics.inventoryCost)}. ${metrics.lowStockCount} Produkte sind niedrig und ${metrics.outOfStockCount} ausverkauft.`
    });
  }

  const highestRevenueDay = [...snapshot.trend].sort(
    (a, b) => b.revenue - a.revenue
  )[0];
  const lowestRevenueDay = [...snapshot.trend].sort(
    (a, b) => a.revenue - b.revenue
  )[0];

  return localized(language, {
    es: [
      `Panorama operativo: ${money(metrics.revenue)} de ingresos, ${money(metrics.grossProfit)} de ganancia bruta y ${metrics.marginPct.toFixed(1)}% de margen.`,
      `Inventario: ${metrics.inventoryUnits} unidades · ${metrics.lowStockCount} bajas · ${metrics.outOfStockCount} agotadas.`,
      highestRevenueDay
        ? `Mejor día de la serie: ${highestRevenueDay.label} con ${money(highestRevenueDay.revenue)}.`
        : "",
      lowestRevenueDay
        ? `Día más débil: ${lowestRevenueDay.label} con ${money(lowestRevenueDay.revenue)}.`
        : "",
      "Puedo analizar reposición, margen, productos lentos, escenarios de precio, rotación, inventario o un producto concreto."
    ].filter(Boolean).join("\n"),
    en: [
      `Operating overview: ${money(metrics.revenue)} revenue, ${money(metrics.grossProfit)} gross profit and ${metrics.marginPct.toFixed(1)}% margin.`,
      `Inventory: ${metrics.inventoryUnits} units · ${metrics.lowStockCount} low · ${metrics.outOfStockCount} out.`,
      "Ask me about restocking, margins, slow movers, price scenarios, rotation or a specific product."
    ].join("\n"),
    pt: [
      `Visão operacional: ${money(metrics.revenue)} de receita, ${money(metrics.grossProfit)} de lucro bruto e ${metrics.marginPct.toFixed(1)}% de margem.`,
      `Estoque: ${metrics.inventoryUnits} unidades · ${metrics.lowStockCount} baixas · ${metrics.outOfStockCount} esgotadas.`,
      "Posso analisar reposição, margem, produtos lentos, cenários de preço, rotação ou um produto específico."
    ].join("\n"),
    fr: [
      `Vue opérationnelle : ${money(metrics.revenue)} de revenus, ${money(metrics.grossProfit)} de bénéfice brut et ${metrics.marginPct.toFixed(1)}% de marge.`,
      `Inventaire : ${metrics.inventoryUnits} unités · ${metrics.lowStockCount} faibles · ${metrics.outOfStockCount} épuisées.`,
      "Je peux analyser le réapprovisionnement, les marges, les produits lents, les scénarios de prix ou un produit précis."
    ].join("\n"),
    de: [
      `Operativer Überblick: ${money(metrics.revenue)} Umsatz, ${money(metrics.grossProfit)} Bruttogewinn und ${metrics.marginPct.toFixed(1)}% Marge.`,
      `Bestand: ${metrics.inventoryUnits} Einheiten · ${metrics.lowStockCount} niedrig · ${metrics.outOfStockCount} ausverkauft.`,
      "Ich kann Nachbestellung, Margen, Langsamdreher, Preisszenarien oder ein bestimmtes Produkt analysieren."
    ].join("\n")
  });
}

function productAnalysis(
  product: Product,
  snapshot: BusinessSnapshot,
  language: Language,
  money: (value: number) => string
) {
  const demandPerDay = Math.max(product.sold30d / 30, 0.01);
  const daysCover = product.stock / demandPerDay;
  const margin = unitMargin(product);
  const capital = product.stock * product.cost;
  const target = Math.ceil(demandPerDay * 30 + product.minStock);
  const suggested = Math.max(0, target - product.stock);

  return localized(language, {
    es: [
      `${product.name}`,
      `• Stock: ${product.stock} u. · mínimo ${product.minStock}.`,
      `• Ventas 30d: ${product.sold30d} u. · cobertura estimada ${daysCover.toFixed(1)} días.`,
      `• Costo ${money(product.cost)} · precio ${money(product.price)} · margen unitario ${margin.toFixed(1)}%.`,
      `• Capital inmovilizado actual: ${money(capital)}.`,
      suggested > 0
        ? `• Reposición sugerida: ${suggested} unidades para volver a ~30 días de cobertura + mínimo.`
        : "• No requiere reposición inmediata con este patrón de ventas."
    ].join("\n"),
    en: `${product.name}: stock ${product.stock}, 30-day sales ${product.sold30d}, ~${daysCover.toFixed(1)} days cover, unit margin ${margin.toFixed(1)}%, tied capital ${money(capital)} and suggested restock ${suggested} units.`,
    pt: `${product.name}: estoque ${product.stock}, vendas 30d ${product.sold30d}, ~${daysCover.toFixed(1)} dias de cobertura, margem unitária ${margin.toFixed(1)}%, capital parado ${money(capital)} e reposição sugerida ${suggested} unidades.`,
    fr: `${product.name} : stock ${product.stock}, ventes 30j ${product.sold30d}, ~${daysCover.toFixed(1)} jours de couverture, marge unitaire ${margin.toFixed(1)}%, capital immobilisé ${money(capital)} et réapprovisionnement conseillé ${suggested} unités.`,
    de: `${product.name}: Bestand ${product.stock}, 30-Tage-Verkäufe ${product.sold30d}, ~${daysCover.toFixed(1)} Tage Reichweite, Stückmarge ${margin.toFixed(1)}%, gebundenes Kapital ${money(capital)} und empfohlene Nachbestellung ${suggested} Einheiten.`
  });
}

function findProduct(products: Product[], normalizedQuestion: string) {
  const ranked = products
    .map((product) => {
      const tokens = normalize(product.name)
        .split(/\s+/)
        .filter((token) => token.length >= 4);
      const hits = tokens.filter((token) =>
        normalizedQuestion.includes(token)
      ).length;
      return { product, hits };
    })
    .sort((a, b) => b.hits - a.hits);

  return ranked[0]?.hits >= 1 ? ranked[0].product : null;
}

function unitMargin(product: Product) {
  return product.price > 0
    ? ((product.price - product.cost) / product.price) * 100
    : 0;
}

function extractPercentage(value: string) {
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return null;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function languageFromLocale(locale: string): Language {
  if (locale.startsWith("en")) return "en";
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("fr")) return "fr";
  if (locale.startsWith("de")) return "de";
  return "es";
}

function localized(
  language: Language,
  values: Record<Language, string>
) {
  return values[language];
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
