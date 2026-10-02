"use client";

import { Boxes, Layers3, Ruler, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  businessId: string;
  language: LanguageCode;
};

type Variant = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  attributes: Record<string, unknown>;
};

type Recipe = {
  id: string;
  product_key: string;
  component_key: string;
  quantity: number;
  unit: string;
};

type Serial = {
  id: string;
  product_key: string;
  serial_number: string;
  status: string;
  warranty_until: string | null;
};

type Conversion = {
  id: string;
  product_key: string;
  from_unit: string;
  to_unit: string;
  factor: number;
};

function tr(
  language: LanguageCode,
  values: Partial<Record<LanguageCode, string>>
) {
  return values[language] ?? values.en ?? values.es ?? "";
}

function parseAttributes(raw: string) {
  const result: Record<string, string> = {};

  for (const part of raw.split(",")) {
    const [key, ...valueParts] = part.split("=");
    const value = valueParts.join("=").trim();
    if (key?.trim() && value) {
      result[key.trim()] = value;
    }
  }

  return result;
}

export function CatalogAdvanced({
  businessId,
  language
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [serials, setSerials] = useState<Serial[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);

  const [variantProduct, setVariantProduct] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [variantBarcode, setVariantBarcode] = useState("");
  const [variantAttrs, setVariantAttrs] = useState("");

  const [recipeProduct, setRecipeProduct] = useState("");
  const [recipeComponent, setRecipeComponent] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState("1");
  const [recipeUnit, setRecipeUnit] = useState("unit");

  const [serialProduct, setSerialProduct] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [serialWarranty, setSerialWarranty] = useState("");

  const [conversionProduct, setConversionProduct] = useState("");
  const [fromUnit, setFromUnit] = useState("box");
  const [toUnit, setToUnit] = useState("unit");
  const [conversionFactor, setConversionFactor] = useState("1");

  async function reload() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const [workspaceRes, variantRes, recipeRes, serialRes, conversionRes] =
      await Promise.all([
        supabase
          .from("global_stock_workspaces")
          .select("state")
          .eq("business_id", businessId)
          .maybeSingle(),
        supabase
          .from("global_stock_product_variants")
          .select("id,product_id,name,sku,barcode,attributes")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_recipes")
          .select("id,product_key,component_key,quantity,unit")
          .eq("business_id", businessId)
          .limit(100),
        supabase
          .from("global_stock_serial_numbers")
          .select("id,product_key,serial_number,status,warranty_until")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("global_stock_unit_conversions")
          .select("id,product_key,from_unit,to_unit,factor")
          .eq("business_id", businessId)
          .limit(100)
      ]);

    const state = (workspaceRes.data?.state ?? {}) as { products?: Product[] };
    const nextProducts = Array.isArray(state.products) ? state.products : [];

    setProducts(nextProducts);
    setVariants((variantRes.data as Variant[] | null) ?? []);
    setRecipes((recipeRes.data as Recipe[] | null) ?? []);
    setSerials((serialRes.data as Serial[] | null) ?? []);
    setConversions((conversionRes.data as Conversion[] | null) ?? []);

    const first = nextProducts[0]?.id || "";
    setVariantProduct((current) => current || first);
    setRecipeProduct((current) => current || first);
    setRecipeComponent((current) => current || nextProducts[1]?.id || first);
    setSerialProduct((current) => current || first);
    setConversionProduct((current) => current || first);
  }

  useEffect(() => {
    void reload();
  // Reload when the business changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function addVariant() {
    if (!variantProduct || !variantName.trim()) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data: mirrored } = await supabase
      .from("global_stock_products")
      .select("id")
      .eq("business_id", businessId)
      .eq("client_key", variantProduct)
      .maybeSingle();

    if (!mirrored?.id) return;

    await supabase.from("global_stock_product_variants").insert({
      business_id: businessId,
      product_id: mirrored.id,
      name: variantName.trim(),
      sku: variantSku.trim() || null,
      barcode: variantBarcode.trim() || null,
      attributes: parseAttributes(variantAttrs)
    });

    setVariantName("");
    setVariantSku("");
    setVariantBarcode("");
    setVariantAttrs("");
    await reload();
  }

  async function addRecipe() {
    if (!recipeProduct || !recipeComponent) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_recipes").upsert({
      business_id: businessId,
      product_key: recipeProduct,
      component_key: recipeComponent,
      quantity: Math.max(0.0001, Number(recipeQuantity) || 1),
      unit: recipeUnit.trim() || "unit"
    }, {
      onConflict: "business_id,product_key,component_key"
    });

    setRecipeQuantity("1");
    await reload();
  }

  async function addSerial() {
    if (!serialProduct || !serialNumber.trim()) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_serial_numbers").insert({
      business_id: businessId,
      product_key: serialProduct,
      serial_number: serialNumber.trim(),
      status: "in_stock",
      warranty_until: serialWarranty || null
    });

    setSerialNumber("");
    setSerialWarranty("");
    await reload();
  }

  async function addConversion() {
    if (!conversionProduct || !fromUnit.trim() || !toUnit.trim()) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.from("global_stock_unit_conversions").upsert({
      business_id: businessId,
      product_key: conversionProduct,
      from_unit: fromUnit.trim(),
      to_unit: toUnit.trim(),
      factor: Math.max(0.000001, Number(conversionFactor) || 1)
    }, {
      onConflict: "business_id,product_key,from_unit,to_unit"
    });

    await reload();
  }

  const nameOf = (id: string) =>
    products.find((product) => product.id === id)?.name || id;

  return (
    <section className="apex-card p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8F0000]">
          Flexible Catalog
        </p>
        <h3 className="mt-1 text-lg font-semibold">
          {tr(language, {
            es: "Variantes, recetas y trazabilidad",
            en: "Variants, recipes and traceability",
            pt: "Variantes, receitas e rastreabilidade",
            fr: "Variantes, recettes et traçabilité",
            de: "Varianten, Rezepte und Rückverfolgung"
          })}
        </h3>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ToolCard
          icon={<Layers3 size={17} />}
          title={tr(language, {
            es: "Variantes",
            en: "Variants"
          })}
        >
          <ProductSelect
            products={products}
            value={variantProduct}
            onChange={setVariantProduct}
          />
          <input
            className="apex-input w-full p-3"
            placeholder="Ej.: Talle M · Negro"
            value={variantName}
            onChange={(event) => setVariantName(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="apex-input w-full p-3"
              placeholder="SKU"
              value={variantSku}
              onChange={(event) => setVariantSku(event.target.value)}
            />
            <input
              className="apex-input w-full p-3"
              placeholder="Código de barras"
              value={variantBarcode}
              onChange={(event) => setVariantBarcode(event.target.value)}
            />
          </div>
          <input
            className="apex-input w-full p-3"
            placeholder="Talle=M, Color=Negro"
            value={variantAttrs}
            onChange={(event) => setVariantAttrs(event.target.value)}
          />
          <SaveButton onClick={() => void addVariant()} />
          <MiniRows
            rows={variants.slice(0, 6).map((item) => ({
              title: item.name,
              subtitle: item.sku || item.barcode || "Sin código"
            }))}
          />
        </ToolCard>

        <ToolCard
          icon={<Boxes size={17} />}
          title={tr(language, {
            es: "Recetas, kits y combos",
            en: "Recipes, kits & bundles"
          })}
        >
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
            Producto final
          </label>
          <ProductSelect
            products={products}
            value={recipeProduct}
            onChange={setRecipeProduct}
          />
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--apex-muted)]">
            Componente
          </label>
          <ProductSelect
            products={products}
            value={recipeComponent}
            onChange={setRecipeComponent}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="apex-input w-full p-3"
              inputMode="decimal"
              value={recipeQuantity}
              onChange={(event) => setRecipeQuantity(event.target.value)}
            />
            <input
              className="apex-input w-full p-3"
              value={recipeUnit}
              onChange={(event) => setRecipeUnit(event.target.value)}
            />
          </div>
          <SaveButton onClick={() => void addRecipe()} />
          <MiniRows
            rows={recipes.slice(0, 6).map((item) => ({
              title: nameOf(item.product_key),
              subtitle:
                nameOf(item.component_key) +
                " · " +
                item.quantity +
                " " +
                item.unit
            }))}
          />
        </ToolCard>

        <ToolCard
          icon={<ShieldCheck size={17} />}
          title={tr(language, {
            es: "Serie y garantía",
            en: "Serial & warranty"
          })}
        >
          <ProductSelect
            products={products}
            value={serialProduct}
            onChange={setSerialProduct}
          />
          <input
            className="apex-input w-full p-3"
            placeholder="Número de serie"
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
          />
          <input
            className="apex-input w-full p-3"
            type="date"
            value={serialWarranty}
            onChange={(event) => setSerialWarranty(event.target.value)}
          />
          <SaveButton onClick={() => void addSerial()} />
          <MiniRows
            rows={serials.slice(0, 6).map((item) => ({
              title: item.serial_number,
              subtitle:
                nameOf(item.product_key) +
                " · " +
                item.status +
                (item.warranty_until
                  ? " · garantía " + item.warranty_until
                  : "")
            }))}
          />
        </ToolCard>

        <ToolCard
          icon={<Ruler size={17} />}
          title={tr(language, {
            es: "Conversión de unidades",
            en: "Unit conversion"
          })}
        >
          <ProductSelect
            products={products}
            value={conversionProduct}
            onChange={setConversionProduct}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              className="apex-input w-full p-3"
              value={fromUnit}
              onChange={(event) => setFromUnit(event.target.value)}
              placeholder="caja"
            />
            <input
              className="apex-input w-full p-3"
              inputMode="decimal"
              value={conversionFactor}
              onChange={(event) =>
                setConversionFactor(event.target.value)
              }
              placeholder="24"
            />
            <input
              className="apex-input w-full p-3"
              value={toUnit}
              onChange={(event) => setToUnit(event.target.value)}
              placeholder="unidad"
            />
          </div>
          <SaveButton onClick={() => void addConversion()} />
          <MiniRows
            rows={conversions.slice(0, 6).map((item) => ({
              title: nameOf(item.product_key),
              subtitle:
                "1 " +
                item.from_unit +
                " = " +
                item.factor +
                " " +
                item.to_unit
            }))}
          />
        </ToolCard>
      </div>
    </section>
  );
}

function ProductSelect({
  products,
  value,
  onChange
}: {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="apex-input w-full p-3"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Producto</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name}
        </option>
      ))}
    </select>
  );
}

function ToolCard({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#8F0000]/10 text-[#8F0000]">
          {icon}
        </span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 w-full rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white"
    >
      Guardar
    </button>
  );
}

function MiniRows({
  rows
}: {
  rows: Array<{ title: string; subtitle: string }>;
}) {
  if (!rows.length) return null;

  return (
    <div className="mt-3 divide-y divide-[var(--apex-border)] rounded-2xl border border-[var(--apex-border)]">
      {rows.map((row, index) => (
        <div key={row.title + "-" + index} className="p-3">
          <p className="text-xs font-semibold">{row.title}</p>
          <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
            {row.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
