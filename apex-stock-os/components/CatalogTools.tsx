"use client";

import { Boxes, Layers3, PackageOpen, Ruler } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  businessId: string;
  language: LanguageCode;
  currency: string;
  locale: string;
};

type ProductRow = {
  id: string;
  client_key: string;
  name: string;
  barcode: string | null;
  unit: string;
  price: number;
  cost: number | null;
  min_stock: number;
  max_stock: number | null;
};

type VariantRow = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  attributes: Record<string, string>;
  price: number | null;
  cost: number | null;
  active: boolean;
};

type LocationRow = {
  id: string;
  name: string;
};

type VariantLevelRow = {
  variant_id: string | null;
  location_id: string;
  on_hand: number;
  reserved: number;
};

type RecipeRow = {
  id: string;
  product_key: string;
  component_key: string;
  quantity: number;
  unit: string;
  wastage_pct: number;
};

type Tab = "variants" | "recipes" | "units";

function tr(language:LanguageCode,es:string,en:string){return language==="es"?es:en}
function money(v:number,currency:string,locale:string){return new Intl.NumberFormat(locale,{style:"currency",currency,maximumFractionDigits:2}).format(Number(v)||0)}

export function CatalogTools({businessId,language,currency,locale}:Props){
  const [tab,setTab]=useState<Tab>("variants");
  const [products,setProducts]=useState<ProductRow[]>([]);
  const [variants,setVariants]=useState<VariantRow[]>([]);
  const [recipes,setRecipes]=useState<RecipeRow[]>([]);
  const [locations,setLocations]=useState<LocationRow[]>([]);
  const [variantLevels,setVariantLevels]=useState<VariantLevelRow[]>([]);
  const [variantStockDrafts,setVariantStockDrafts]=useState<Record<string,string>>({});
  const [productId,setProductId]=useState("");
  const [variantName,setVariantName]=useState("");
  const [sku,setSku]=useState("");
  const [barcode,setBarcode]=useState("");
  const [attrKey,setAttrKey]=useState("Color");
  const [attrValue,setAttrValue]=useState("");
  const [variantPrice,setVariantPrice]=useState("");
  const [variantStock,setVariantStock]=useState("0");
  const [variantLocation,setVariantLocation]=useState("");
  const [recipeProduct,setRecipeProduct]=useState("");
  const [componentKey,setComponentKey]=useState("");
  const [recipeQty,setRecipeQty]=useState("1");
  const [recipeUnit,setRecipeUnit]=useState("unit");
  const [wastage,setWastage]=useState("0");
  const [unitProduct,setUnitProduct]=useState("");
  const [unit,setUnit]=useState("unit");
  const [maxStock,setMaxStock]=useState("");

  const productById=useMemo(()=>new Map(products.map(p=>[p.id,p])),[products]);
  const productByKey=useMemo(()=>new Map(products.map(p=>[p.client_key,p])),[products]);
  const variantStockById=useMemo(()=>{
    const map=new Map<string,number>();
    for(const level of variantLevels){
      if(!level.variant_id)continue;
      map.set(
        level.variant_id,
        (map.get(level.variant_id)??0)+
          Math.max(0,(Number(level.on_hand)||0)-(Number(level.reserved)||0))
      );
    }
    return map;
  },[variantLevels]);

  async function reload(){
    const s=getSupabaseBrowserClient();if(!s)return;
    const [p,v,r,l,levels]=await Promise.all([
      s.from("global_stock_products").select("id,client_key,name,barcode,unit,price,cost,min_stock,max_stock").eq("business_id",businessId).eq("active",true).order("name"),
      s.from("global_stock_product_variants").select("id,product_id,name,sku,barcode,attributes,price,cost,active").eq("business_id",businessId).order("created_at",{ascending:false}),
      s.from("global_stock_recipes").select("id,product_key,component_key,quantity,unit,wastage_pct").eq("business_id",businessId),
      s.from("global_stock_locations").select("id,name").eq("business_id",businessId).eq("active",true).order("created_at"),
      s.from("global_stock_inventory_levels").select("variant_id,location_id,on_hand,reserved").eq("business_id",businessId).not("variant_id","is",null)
    ]);
    const ps=(p.data as ProductRow[]|null)??[];
    const nextLocations=(l.data as LocationRow[]|null)??[];
    setProducts(ps);
    setVariants((v.data as VariantRow[]|null)??[]);
    setRecipes((r.data as RecipeRow[]|null)??[]);
    setLocations(nextLocations);
    setVariantLevels((levels.data as VariantLevelRow[]|null)??[]);
    if(!productId&&ps[0]?.id)setProductId(ps[0].id);
    if(!recipeProduct&&ps[0]?.client_key)setRecipeProduct(ps[0].client_key);
    if(!componentKey&&ps[1]?.client_key)setComponentKey(ps[1].client_key);
    if(!unitProduct&&ps[0]?.id)setUnitProduct(ps[0].id);
    if(!variantLocation&&nextLocations[0]?.id)setVariantLocation(nextLocations[0].id);
  }

  useEffect(()=>{void reload();/* eslint-disable-next-line react-hooks/exhaustive-deps */},[businessId]);

  async function addVariant(){
    if(!productId||!variantName.trim())return;
    const s=getSupabaseBrowserClient();if(!s)return;
    const price=variantPrice.trim()===""?null:Math.max(0,Number(variantPrice)||0);
    const attributes:Record<string,string>={};
    if(attrKey.trim()&&attrValue.trim())attributes[attrKey.trim()]=attrValue.trim();

    const {data,error}=await s.from("global_stock_product_variants").insert({
      business_id:businessId,
      product_id:productId,
      name:variantName.trim(),
      sku:sku.trim()||null,
      barcode:barcode.trim()||null,
      attributes,
      price,
      active:true
    }).select("id").single();

    if(error||!data?.id)return;

    await s.rpc("global_stock_set_variant_stock",{
      target_business_id:businessId,
      target_variant_id:String(data.id),
      target_stock:Math.max(0,Number(variantStock)||0),
      target_location_id:variantLocation||null
    });

    setVariantName("");
    setSku("");
    setBarcode("");
    setAttrValue("");
    setVariantPrice("");
    setVariantStock("0");
    window.dispatchEvent(new Event("global-stock-variants-changed"));
    await reload();
  }

  async function toggleVariant(id:string,active:boolean){
    const s=getSupabaseBrowserClient();if(!s)return;
    await s.from("global_stock_product_variants").update({active}).eq("id",id);
    window.dispatchEvent(new Event("global-stock-variants-changed"));
    await reload();
  }

  async function saveVariantStock(id:string){
    const s=getSupabaseBrowserClient();if(!s)return;
    const current=variantStockById.get(id)??0;
    const raw=variantStockDrafts[id];
    const next=Math.max(0,raw===undefined?current:Number(raw)||0);

    const {error}=await s.rpc("global_stock_set_variant_stock",{
      target_business_id:businessId,
      target_variant_id:id,
      target_stock:next,
      target_location_id:variantLocation||null
    });

    if(error)return;
    setVariantStockDrafts(drafts=>{
      const copy={...drafts};
      delete copy[id];
      return copy;
    });
    window.dispatchEvent(new Event("global-stock-variants-changed"));
    await reload();
  }

  async function addRecipe(){
    if(!recipeProduct||!componentKey||recipeProduct===componentKey)return;
    const s=getSupabaseBrowserClient();if(!s)return;
    await s.from("global_stock_recipes").upsert({
      business_id:businessId,product_key:recipeProduct,component_key:componentKey,
      quantity:Math.max(0.0001,Number(recipeQty)||1),unit:recipeUnit,wastage_pct:Math.max(0,Number(wastage)||0)
    },{onConflict:"business_id,product_key,component_key"});
    window.dispatchEvent(new Event("global-stock-recipes-changed"));
    await reload();
  }

  async function removeRecipe(id:string){
    const s=getSupabaseBrowserClient();if(!s)return;
    await s.from("global_stock_recipes").delete().eq("id",id);
    window.dispatchEvent(new Event("global-stock-recipes-changed"));
    await reload();
  }

  async function saveUnit(){
    if(!unitProduct)return;
    const s=getSupabaseBrowserClient();if(!s)return;
    const max=maxStock.trim()===""?null:Math.max(0,Number(maxStock)||0);
    await s.from("global_stock_products").update({unit,max_stock:max}).eq("id",unitProduct);
    await reload();
  }

  return <div className="space-y-4">
    <div className="flex gap-2 overflow-x-auto">
      <TabButton active={tab==="variants"} onClick={()=>setTab("variants")} icon={<Layers3 size={14}/>} label={tr(language,"Variantes","Variants")}/>
      <TabButton active={tab==="recipes"} onClick={()=>setTab("recipes")} icon={<PackageOpen size={14}/>} label={tr(language,"Recetas / combos","Recipes / bundles")}/>
      <TabButton active={tab==="units"} onClick={()=>setTab("units")} icon={<Ruler size={14}/>} label={tr(language,"Unidades y máximos","Units & maximums")}/>
    </div>

    {tab==="variants"&&<Split title={tr(language,"Variantes de producto","Product variants")} form={<>
      <Select value={productId} onChange={setProductId} options={products.map(p=>({value:p.id,label:p.name}))}/>
      <Input value={variantName} setValue={setVariantName} placeholder={tr(language,"Nombre de variante (ej. Negro / XL)","Variant name")}/>
      <div className="grid grid-cols-2 gap-2"><Input value={sku} setValue={setSku} placeholder="SKU"/><Input value={barcode} setValue={setBarcode} placeholder={tr(language,"Código de barras","Barcode")}/></div>
      <div className="grid grid-cols-2 gap-2"><Input value={attrKey} setValue={setAttrKey} placeholder={tr(language,"Atributo","Attribute")}/><Input value={attrValue} setValue={setAttrValue} placeholder={tr(language,"Valor","Value")}/></div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={variantPrice} setValue={setVariantPrice} placeholder={tr(language,"Precio opcional","Optional price")} numeric/>
        <Input value={variantStock} setValue={setVariantStock} placeholder={tr(language,"Stock inicial","Initial stock")} numeric/>
      </div>
      <Select value={variantLocation} onChange={setVariantLocation} options={locations.map(l=>({value:l.id,label:l.name}))}/>
      <Action label={tr(language,"Agregar variante","Add variant")} onClick={()=>void addVariant()}/>
    </>}>
      {variants.map(v=>{
        const available=variantStockById.get(v.id)??0;
        return <Row
          key={v.id}
          title={(productById.get(v.product_id)?.name||"Producto")+" · "+v.name}
          subtitle={(Object.entries(v.attributes||{}).map(([k,val])=>k+": "+val).join(" · ")||v.sku||"Sin atributos")+" · stock "+String(available)}
          value={v.price==null?"—":money(v.price,currency,locale)}
          action={<div className="flex flex-wrap items-center gap-2">
            <input
              className="apex-input h-9 w-20 px-2 text-xs"
              inputMode="decimal"
              value={variantStockDrafts[v.id]??String(available)}
              onChange={e=>setVariantStockDrafts(d=>({...d,[v.id]:e.target.value}))}
              aria-label={tr(language,"Stock de variante","Variant stock")}
            />
            <button type="button" onClick={()=>void saveVariantStock(v.id)} className="rounded-xl border border-[var(--apex-border)] px-3 py-2 text-xs font-semibold">{tr(language,"Guardar","Save")}</button>
            <button type="button" onClick={()=>void toggleVariant(v.id,!v.active)} className="rounded-xl border border-[var(--apex-border)] px-3 py-2 text-xs font-semibold">{v.active?"Desactivar":"Activar"}</button>
          </div>}
        />;
      })}
    </Split>}

    {tab==="recipes"&&<Split title={tr(language,"Producto compuesto / receta","Composite product / recipe")} form={<>
      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">{tr(language,"Producto vendido","Sold product")}</label>
      <Select value={recipeProduct} onChange={setRecipeProduct} options={products.map(p=>({value:p.client_key,label:p.name}))}/>
      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">{tr(language,"Ingrediente / componente","Ingredient / component")}</label>
      <Select value={componentKey} onChange={setComponentKey} options={products.map(p=>({value:p.client_key,label:p.name}))}/>
      <div className="grid grid-cols-2 gap-2"><Input value={recipeQty} setValue={setRecipeQty} placeholder={tr(language,"Cantidad","Quantity")} numeric/><select className="apex-input w-full p-3" value={recipeUnit} onChange={e=>setRecipeUnit(e.target.value)}>{["unit","g","kg","ml","l","m","pack","box"].map(u=><option key={u} value={u}>{u}</option>)}</select></div>
      <Input value={wastage} setValue={setWastage} placeholder={tr(language,"Merma %","Waste %")} numeric/>
      <Action label={tr(language,"Agregar componente","Add component")} onClick={()=>void addRecipe()}/>
    </>}>
      {recipes.map(r=><Row key={r.id} title={(productByKey.get(r.product_key)?.name||r.product_key)+" ← "+(productByKey.get(r.component_key)?.name||r.component_key)} subtitle={String(r.quantity)+" "+r.unit+" · merma "+String(r.wastage_pct)+"%"} action={<button type="button" onClick={()=>void removeRecipe(r.id)} className="rounded-xl border border-[var(--apex-border)] px-3 py-2 text-xs font-semibold">Eliminar</button>}/>)}
    </Split>}

    {tab==="units"&&<Split title={tr(language,"Unidad de venta y stock objetivo","Selling unit & target stock")} form={<>
      <Select value={unitProduct} onChange={setUnitProduct} options={products.map(p=>({value:p.id,label:p.name}))}/>
      <select className="apex-input w-full p-3" value={unit} onChange={e=>setUnit(e.target.value)}>{["unit","pack","box","dozen","g","kg","ml","l","m","roll"].map(u=><option key={u} value={u}>{u}</option>)}</select>
      <Input value={maxStock} setValue={setMaxStock} placeholder={tr(language,"Stock máximo objetivo","Target maximum stock")} numeric/>
      <Action label={tr(language,"Guardar configuración","Save settings")} onClick={()=>void saveUnit()}/>
    </>}>
      {products.map(p=><Row key={p.id} title={p.name} subtitle={"Unidad: "+(p.unit||"unit")+" · mínimo "+p.min_stock+" · máximo "+(p.max_stock??"—")} value={money(p.price,currency,locale)}/>)}
    </Split>}
  </div>;
}

function TabButton({active,onClick,icon,label}:{active:boolean;onClick:()=>void;icon:React.ReactNode;label:string}){return <button type="button" onClick={onClick} className={"inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold "+(active?"border-[#8F0000]/60 bg-[#8F0000]/10 text-[#8F0000]":"border-[var(--apex-border)]")}>{icon}{label}</button>}
function Input({value,setValue,placeholder,numeric=false}:{value:string;setValue:(v:string)=>void;placeholder:string;numeric?:boolean}){return <input className="apex-input w-full p-3" inputMode={numeric?"decimal":undefined} placeholder={placeholder} value={value} onChange={e=>setValue(e.target.value)}/>}
function Select({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:Array<{value:string;label:string}>}){return <select className="apex-input w-full p-3" value={value} onChange={e=>onChange(e.target.value)}><option value="">—</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>}
function Action({label,onClick}:{label:string;onClick:()=>void}){return <button type="button" onClick={onClick} className="min-h-11 w-full rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white">{label}</button>}
function Split({title,form,children}:{title:string;form:React.ReactNode;children:React.ReactNode}){return <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]"><section className="apex-card p-5"><div className="flex items-center gap-2"><Boxes size={16}/><h3 className="font-semibold">{title}</h3></div><div className="mt-4 space-y-2">{form}</div></section><section className="apex-card overflow-hidden"><div className="divide-y divide-[var(--apex-border)]">{children}</div></section></div>}
function Row({title,subtitle,value,action}:{title:string;subtitle:string;value?:string;action?:React.ReactNode}){return <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-1 text-[10px] text-[var(--apex-muted)]">{subtitle}</p></div><div className="flex items-center gap-3">{value&&<strong className="text-sm">{value}</strong>}{action}</div></div>}
