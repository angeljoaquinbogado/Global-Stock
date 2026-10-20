"use client";

import {
  Beef, BookOpen, BriefcaseBusiness, Carrot, Check, ChevronDown, Croissant,
  Eye, Factory, Gem, Hammer, Laptop, Leaf, PawPrint, Pill, Scissors, Shirt,
  ShoppingBag, Store, UtensilsCrossed, Warehouse
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LanguageCode } from "./GlobalPreferences";

export type BusinessTypeValue =
  | "retail" | "restaurant" | "services" | "wholesale"
  | "ecommerce" | "industry" | "advisory" | "other";

type LocalLabels = Record<LanguageCode, string>;
const translated = (es:string,en:string,pt:string,fr:string,de:string):LocalLabels => ({ es,en,pt,fr,de });
export const businessCategories = [
  { id:"almacen",kind:"retail",icon:Store,label:translated("Almacén / Kiosco","Convenience Store","Mercadinho / Quiosque","Épicerie / Kiosque","Kiosk / Laden"),description:"Productos de todos los días" },
  { id:"indumentaria",kind:"retail",icon:Shirt,label:translated("Indumentaria","Clothing","Vestuário","Vêtements","Bekleidung"),description:"Ropa, calzado y accesorios" },
  { id:"carniceria",kind:"retail",icon:Beef,label:translated("Carnicería","Butcher Shop","Açougue","Boucherie","Metzgerei"),description:"Carnes y embutidos" },
  { id:"verduleria",kind:"retail",icon:Carrot,label:translated("Verdulería","Greengrocer","Hortifruti","Primeur","Obst & Gemüse"),description:"Frutas y verduras" },
  { id:"panaderia",kind:"retail",icon:Croissant,label:translated("Panadería","Bakery","Padaria","Boulangerie","Bäckerei"),description:"Pan, facturas y pastelería" },
  { id:"farmacia",kind:"retail",icon:Pill,label:translated("Farmacia","Pharmacy","Farmácia","Pharmacie","Apotheke"),description:"Medicamentos y perfumería" },
  { id:"libreria",kind:"retail",icon:BookOpen,label:translated("Librería","Book & Stationery Shop","Livraria / Papelaria","Librairie / Papeterie","Buchhandlung / Papierwaren"),description:"Libros, útiles y papelería" },
  { id:"ferreteria",kind:"retail",icon:Hammer,label:translated("Ferretería","Hardware Store","Loja de Ferragens","Quincaillerie","Baumarkt"),description:"Herramientas y materiales" },
  { id:"electronica",kind:"retail",icon:Laptop,label:translated("Electrónica","Electronics","Eletrônicos","Électronique","Elektronik"),description:"Celulares y accesorios" },
  { id:"dietetica",kind:"retail",icon:Leaf,label:translated("Dietética","Health Food Store","Produtos Naturais","Produits Naturels","Naturkostladen"),description:"Productos naturales" },
  { id:"estetica",kind:"services",icon:Scissors,label:translated("Estética","Beauty Studio","Estética","Institut de Beauté","Kosmetikstudio"),description:"Cosmética y tratamientos" },
  { id:"optica",kind:"retail",icon:Eye,label:translated("Óptica","Optician","Ótica","Opticien","Optiker"),description:"Anteojos y lentes" },
  { id:"veterinaria",kind:"services",icon:PawPrint,label:translated("Veterinaria","Veterinary","Veterinária","Vétérinaire","Tierarztpraxis"),description:"Alimentos y productos para mascotas" },
  { id:"joyeria",kind:"retail",icon:Gem,label:translated("Joyería","Jewelry Shop","Joalheria","Bijouterie","Juwelier"),description:"Joyas, relojes y accesorios" },
  { id:"peluqueria",kind:"services",icon:Scissors,label:translated("Peluquería","Hair Salon","Salão de Beleza","Salon de Coiffure","Friseursalon"),description:"Cuidado del cabello" },
  { id:"restaurante",kind:"restaurant",icon:UtensilsCrossed,label:translated("Restaurante","Restaurant","Restaurante","Restaurant","Restaurant"),description:"Cocina, ingredientes y comedor" },
  { id:"mayorista",kind:"wholesale",icon:Warehouse,label:translated("Mayorista / Depósito","Wholesale / Warehouse","Atacado / Depósito","Grossiste / Entrepôt","Großhandel / Lager"),description:"Distribución y almacenamiento" },
  { id:"fabricacion",kind:"industry",icon:Factory,label:translated("Taller / Fábrica","Workshop / Factory","Oficina / Fábrica","Atelier / Usine","Werkstatt / Fabrik"),description:"Materiales, repuestos e insumos" },
  { id:"tienda-online",kind:"ecommerce",icon:ShoppingBag,label:translated("Tienda online","Online Store","Loja Online","Boutique en Ligne","Onlineshop"),description:"Productos y pedidos" },
  { id:"servicios",kind:"services",icon:BriefcaseBusiness,label:translated("Servicios","Services","Serviços","Services","Dienstleistungen"),description:"Insumos de trabajo" },
  { id:"otro",kind:"other",icon:Store,label:translated("Otro negocio","Other Business","Outro Negócio","Autre Activité","Sonstiger Betrieb"),description:"Tu actividad" }
] as const satisfies ReadonlyArray<{
  id:string; kind:BusinessTypeValue; icon:typeof Store; label:LocalLabels; description:string;
}>;

const prompt:Record<LanguageCode,string> = {
  es:"Tipo de negocio", en:"Business type", pt:"Tipo de negócio",
  fr:"Type d'activité", de:"Geschäftstyp"
};
const help:Record<LanguageCode,string> = {
  es:"Elegí lo que más se parezca a tu negocio. Podés cargar cualquier producto.",
  en:"Choose the closest category. You can add any product.",
  pt:"Escolha a categoria mais próxima. Você pode cadastrar qualquer produto.",
  fr:"Choisissez la catégorie la plus proche. Ajoutez tout type de produit.",
  de:"Wähle die passende Kategorie. Du kannst beliebige Produkte hinzufügen."
};
export function BusinessTypePicker({
  language, value, onChange, categoryId, onCategoryChange, className = ""
}: {
  language: LanguageCode;
  value: BusinessTypeValue;
  onChange: (value: BusinessTypeValue) => void;
  categoryId?: string;
  onCategoryChange?: (id:string) => void;
  className?: string;
}) {
  const [open,setOpen] = useState(false);
  const [localCategory,setLocalCategory] = useState("almacen");
  const rootRef=useRef<HTMLDivElement>(null);
  const reducedMotion=useReducedMotion();
  const selected=useMemo(() => {
    const explicit=businessCategories.find(item=>item.id===(categoryId??localCategory));
    if(explicit?.kind===value) return explicit;
    return businessCategories.find(item=>item.kind===value)??businessCategories[0];
  },[categoryId,localCategory,value]);

  useEffect(()=>{
    if(!open)return;
    const outside=(e:PointerEvent)=>{if(!rootRef.current?.contains(e.target as Node))setOpen(false);};
    const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);};
    window.addEventListener("pointerdown",outside);
    window.addEventListener("keydown",escape);
    return()=>{window.removeEventListener("pointerdown",outside);window.removeEventListener("keydown",escape);};
  },[open]);

  function choose(item:typeof businessCategories[number]) {
    setLocalCategory(item.id);
    onChange(item.kind);
    onCategoryChange?.(item.id);
    setOpen(false);
  }
  const Icon=selected.icon;
  return <div ref={rootRef} className={"relative "+className}>
    <button
      type="button"
      aria-label={prompt[language]+": "+selected.label[language]}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls="global-stock-business-category-grid"
      onClick={()=>setOpen(v=>!v)}
      className="apex-input flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--apex-accent)]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--apex-accent-soft)] text-[var(--apex-accent)]"><Icon size={19}/></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{selected.label[language]}</span>
        <span className="mt-0.5 block truncate text-[11px] text-[var(--apex-muted)]">{selected.description}</span>
      </span>
      <ChevronDown size={17} className={"shrink-0 transition-transform "+(open?"rotate-180":"")}/>
    </button>
    <AnimatePresence>
      {open&&<motion.div
        id="global-stock-business-category-grid" role="dialog"
        aria-label={prompt[language]}
        initial={reducedMotion?false:{opacity:0,y:7,filter:"blur(6px)"}}
        animate={{opacity:1,y:0,filter:"blur(0px)"}}
        exit={reducedMotion?{opacity:0}:{opacity:0,y:-5,filter:"blur(4px)"}}
        transition={{duration:reducedMotion?0:.18}}
        className="apex-scrollbar absolute inset-x-0 top-[calc(100%+8px)] z-[350] max-h-[65dvh] overflow-y-auto overscroll-contain rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3 shadow-[0_24px_70px_rgba(0,0,0,.38)]">
        <p className="mb-3 px-1 text-xs leading-5 text-[var(--apex-muted)]">{help[language]}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {businessCategories.map(item=>{
            const CurrentIcon=item.icon;
            const active=selected.id===item.id;
            return <button
              key={item.id} type="button" aria-pressed={active} onClick={()=>choose(item)}
              className={"group flex min-h-[110px] flex-col justify-between rounded-2xl border p-3 text-left transition-[transform,background-color,border-color] hover:scale-[1.025] focus-visible:ring-2 focus-visible:ring-[var(--apex-accent)] "+
                (active?"border-[var(--apex-accent)] bg-[var(--apex-accent-soft)]":"border-[var(--apex-border)] bg-[var(--apex-bg)] hover:border-[var(--apex-accent)]")}>
              <div className="flex items-start justify-between">
                <CurrentIcon size={22} className={active?"text-[var(--apex-accent)]":"text-[var(--apex-text)]"} strokeWidth={1.8}/>
                {active&&<Check size={15} className="text-[var(--apex-accent)]"/>}
              </div>
              <span className="mt-4 block min-w-0">
                <span className="block text-[11px] font-bold leading-4">{item.label[language]}</span>
                {language==="es"&&<span className="mt-1 block text-[10px] leading-[14px] text-[var(--apex-muted)]">{item.description}</span>}
              </span>
            </button>;
          })}
        </div>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
