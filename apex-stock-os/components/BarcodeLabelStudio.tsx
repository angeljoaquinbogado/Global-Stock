"use client";

import JsBarcode from "jsbarcode";
import {
  Barcode,
  Check,
  Copy,
  Printer,
  RefreshCw,
  Tag
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Product } from "@/lib/types";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  language: LanguageCode;
  products: Product[];
  money: (value: number) => string;
  onAssignBarcode: (productId: string, barcode: string) => void;
};

const copy = {
  es: {
    eyebrow: "Etiquetas imprimibles",
    title: "Códigos de barras",
    subtitle:
      "Usá el código existente de un producto o generá un código interno Code 128 para tu negocio. Podés asignarlo e imprimir varias etiquetas.",
    product: "Producto",
    code: "Código",
    generate: "Generar código interno",
    assign: "Asignar al producto",
    assigned: "Código asignado",
    quantity: "Cantidad de etiquetas",
    print: "Imprimir etiquetas",
    duplicate: "Ese código ya está asignado a otro producto.",
    invalid: "Ingresá un código válido.",
    preview: "Vista previa",
    noProducts: "No hay productos disponibles.",
    copies: "copias"
  },
  en: {
    eyebrow: "Printable labels",
    title: "Barcodes",
    subtitle:
      "Use the product’s existing code or generate an internal Code 128 for your business. Assign it and print multiple labels.",
    product: "Product",
    code: "Code",
    generate: "Generate internal code",
    assign: "Assign to product",
    assigned: "Code assigned",
    quantity: "Label quantity",
    print: "Print labels",
    duplicate: "That code is already assigned to another product.",
    invalid: "Enter a valid code.",
    preview: "Preview",
    noProducts: "No products available.",
    copies: "copies"
  },
  pt: {
    eyebrow: "Etiquetas imprimíveis",
    title: "Códigos de barras",
    subtitle:
      "Use o código existente do produto ou gere um código interno Code 128 para o negócio. Atribua e imprima várias etiquetas.",
    product: "Produto",
    code: "Código",
    generate: "Gerar código interno",
    assign: "Atribuir ao produto",
    assigned: "Código atribuído",
    quantity: "Quantidade de etiquetas",
    print: "Imprimir etiquetas",
    duplicate: "Esse código já está atribuído a outro produto.",
    invalid: "Digite um código válido.",
    preview: "Prévia",
    noProducts: "Não há produtos disponíveis.",
    copies: "cópias"
  },
  fr: {
    eyebrow: "Étiquettes imprimables",
    title: "Codes-barres",
    subtitle:
      "Utilisez le code existant du produit ou générez un code interne Code 128. Attribuez-le et imprimez plusieurs étiquettes.",
    product: "Produit",
    code: "Code",
    generate: "Générer un code interne",
    assign: "Attribuer au produit",
    assigned: "Code attribué",
    quantity: "Nombre d’étiquettes",
    print: "Imprimer les étiquettes",
    duplicate: "Ce code est déjà attribué à un autre produit.",
    invalid: "Saisissez un code valide.",
    preview: "Aperçu",
    noProducts: "Aucun produit disponible.",
    copies: "copies"
  },
  de: {
    eyebrow: "Druckbare Etiketten",
    title: "Barcodes",
    subtitle:
      "Vorhandenen Produktcode verwenden oder einen internen Code 128 erzeugen. Dem Produkt zuweisen und mehrere Etiketten drucken.",
    product: "Produkt",
    code: "Code",
    generate: "Internen Code erzeugen",
    assign: "Produkt zuweisen",
    assigned: "Code zugewiesen",
    quantity: "Etikettenanzahl",
    print: "Etiketten drucken",
    duplicate: "Dieser Code ist bereits einem anderen Produkt zugewiesen.",
    invalid: "Gib einen gültigen Code ein.",
    preview: "Vorschau",
    noProducts: "Keine Produkte verfügbar.",
    copies: "Kopien"
  }
} satisfies Record<LanguageCode, Record<string, string>>;

function ean13Checksum(base12: string) {
  const sum = base12
    .split("")
    .reduce(
      (total, digit, index) =>
        total + Number(digit) * (index % 2 === 0 ? 1 : 3),
      0
    );
  return String((10 - (sum % 10)) % 10);
}

function generateInternalCode() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 1_679_616)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `GS-${time}-${random}`;
}

function normalizeCode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function isValidEan13(code: string) {
  return (
    /^\d{13}$/.test(code) &&
    ean13Checksum(code.slice(0, 12)) === code.slice(12)
  );
}

function renderBarcode(target: SVGSVGElement, code: string) {
  JsBarcode(target, code, {
    format: isValidEan13(code) ? "EAN13" : "CODE128",
    displayValue: true,
    font: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    fontSize: 15,
    height: 62,
    width: 1.7,
    margin: 8,
    background: "#ffffff",
    lineColor: "#000000"
  });
}

export function BarcodeLabelStudio({
  language,
  products,
  money,
  onAssignBarcode
}: Props) {
  const t = copy[language];
  const previewRef = useRef<SVGSVGElement>(null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? products[0],
    [productId, products]
  );
  const [code, setCode] = useState(selectedProduct?.barcode ?? "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [assigned, setAssigned] = useState(false);

  useEffect(() => {
    if (!selectedProduct) return;
    setCode(selectedProduct.barcode || "");
    setError("");
    setAssigned(false);
  }, [selectedProduct?.id]);

  useEffect(() => {
    const normalized = normalizeCode(code);
    if (!previewRef.current || !normalized) return;

    try {
      renderBarcode(previewRef.current, normalized);
      setError("");
    } catch {
      setError(t.invalid);
    }
  }, [code, t.invalid]);

  function generate() {
    setCode(generateInternalCode());
    setAssigned(false);
    setError("");
  }

  function assign() {
    if (!selectedProduct) return;
    const normalized = normalizeCode(code);
    if (!normalized) {
      setError(t.invalid);
      return;
    }

    const duplicate = products.some(
      (product) =>
        product.id !== selectedProduct.id &&
        normalizeCode(product.barcode) === normalized
    );

    if (duplicate) {
      setError(t.duplicate);
      return;
    }

    try {
      const test = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      renderBarcode(test, normalized);
    } catch {
      setError(t.invalid);
      return;
    }

    onAssignBarcode(selectedProduct.id, normalized);
    setAssigned(true);
    setError("");
    window.setTimeout(() => setAssigned(false), 1800);
  }

  function printLabels() {
    if (!selectedProduct) return;
    const normalized = normalizeCode(code);
    if (!normalized) {
      setError(t.invalid);
      return;
    }

    let svgMarkup = "";
    try {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      renderBarcode(svg, normalized);
      svgMarkup = svg.outerHTML;
    } catch {
      setError(t.invalid);
      return;
    }

    const popup = window.open("", "_blank", "width=900,height=760");
    if (!popup) return;

    const safeName = selectedProduct.name
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    const label = `
      <article class="label">
        <div class="name">${safeName}</div>
        <div class="price">${money(selectedProduct.price)}</div>
        ${svgMarkup}
      </article>
    `;

    popup.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${safeName} · ${normalized}</title>
          <style>
            @page{margin:8mm}
            *{box-sizing:border-box}
            body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111}
            .sheet{display:grid;grid-template-columns:repeat(auto-fill,minmax(58mm,1fr));gap:4mm}
            .label{min-height:34mm;border:1px solid #ddd;border-radius:3mm;padding:3mm;display:flex;flex-direction:column;align-items:center;justify-content:center;break-inside:avoid}
            .name{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font-size:10pt;font-weight:700}
            .price{margin-top:1mm;font-size:10pt;font-weight:600}
            svg{display:block;max-width:100%;height:auto}
            @media print{.label{border-color:#bbb}}
          </style>
        </head>
        <body>
          <main class="sheet">
            ${Array.from({ length: Math.max(1, Math.min(quantity, 100)) }, () => label).join("")}
          </main>
          <script>window.addEventListener("load",()=>{window.print()})<\/script>
        </body>
      </html>`);
    popup.document.close();
  }

  if (!products.length) {
    return (
      <section className="apex-card p-5">
        <p className="text-sm text-[var(--apex-muted)]">{t.noProducts}</p>
      </section>
    );
  }

  return (
    <section className="apex-card overflow-hidden">
      <div className="border-b border-[var(--apex-border)] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
            <Barcode size={20} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
              {t.eyebrow}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{t.title}</h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--apex-muted)]">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,.9fr)_minmax(320px,1.1fr)]">
        <div className="space-y-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
              {t.product}
            </span>
            <select
              value={selectedProduct?.id ?? ""}
              onChange={(event) => setProductId(event.target.value)}
              className="apex-input mt-2 px-4 py-3"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
              {t.code}
            </span>
            <div className="mt-2 flex gap-2">
              <input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setAssigned(false);
                }}
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="text"
                className="apex-input min-w-0 flex-1 px-4 py-3 font-mono"
              />
              <button
                type="button"
                onClick={generate}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)]"
                aria-label={t.generate}
                title={t.generate}
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </label>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <button
              type="button"
              onClick={assign}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white"
            >
              {assigned ? <Check size={16} /> : <Tag size={16} />}
              {assigned ? t.assigned : t.assign}
            </button>

            <label>
              <span className="sr-only">{t.quantity}</span>
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.max(1, Math.min(100, Number(event.target.value) || 1))
                  )
                }
                className="apex-input h-12 px-3 text-center"
                inputMode="numeric"
                aria-label={t.quantity}
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-red-500">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={printLabels}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 text-sm font-semibold"
          >
            <Printer size={17} />
            {t.print} · {quantity} {t.copies}
          </button>
        </div>

        <div className="rounded-[24px] border border-[var(--apex-border)] bg-white p-5 text-black">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/50">
              {t.preview}
            </p>
            <Copy size={14} className="text-black/35" />
          </div>
          <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center text-center">
            <p className="max-w-full truncate text-sm font-semibold">
              {selectedProduct?.name}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {selectedProduct ? money(selectedProduct.price) : ""}
            </p>
            <svg ref={previewRef} className="mt-3 max-w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
