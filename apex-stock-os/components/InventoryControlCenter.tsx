"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, ArrowUpDown, Barcode, Boxes, CalendarClock, Check, ChevronRight,
  Clock3, MapPin, Package, Search, Settings2, ShieldAlert, SlidersHorizontal,
  Sparkles, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getStockStatus } from "@/lib/analytics";
import type { Product, ProductInventoryDetails } from "@/lib/types";
import type { LanguageCode } from "./GlobalPreferences";
import { ApexSelect } from "./ui/ApexSelect";
import { StockQuantityCell } from "./StockQuantityCell";
import "./inventory-control-center.css";

type BusinessType = "retail" | "restaurant" | "services" | "wholesale" | "ecommerce" | "industry" | "advisory" | "other";
type Profile = NonNullable<ProductInventoryDetails["profile"]>;
type Filter = "all" | "low" | "out" | "expiring" | "expired";
type Sort = "name" | "stock" | "expiry" | "updated";
type Props = {
  language: LanguageCode; businessType: BusinessType; products: Product[];
  money: (n: number) => string; readOnly: boolean;
  onUpdateStock: (id: string, value: number) => void;
  onAddStock: (id: string, value: number, operationId: string) => Promise<number>;
  onUpdatePrice: (id: string, value: number) => void;
  onUpdateCost: (id: string, value: string) => void;
  onUpdateMinimum: (id: string, value: number) => void;
  onUpdateSupplier: (id: string, value: string) => void;
  onUpdateBarcode: (id: string, value: string) => void;
  onUpdateDetails: (id: string, details: ProductInventoryDetails) => void;
};

const locale: Record<LanguageCode, string> = {
  es: "es-AR", en: "en-US", pt: "pt-BR", fr: "fr-FR", de: "de-DE"
};
const texts = {
  es: {
    title: "Control de inventario", subtitle: "Tu stock, ordenado y con información útil para cada producto.",
    products: "Productos", units: "Unidades", alerts: "Stock bajo", expiring: "Por vencer", expired: "Vencidos",
    all: "Todos", low: "Bajo", out: "Agotado", status: "Estado",
    find: "Buscar nombre, código, SKU, lote o proveedor", sort: "Ordenar por", name: "Nombre",
    stockAsc: "Menor stock", soon: "Vencimiento próximo", latest: "Últimos actualizados",
    product: "Producto", category: "Categoría", supplier: "Proveedor", cost: "Costo", price: "Precio",
    stock: "Stock", min: "Mínimo", actions: "Detalle", details: "Ficha de producto", edit: "Editar",
    open: "Abrir ficha", none: "Ningún producto coincide con los filtros.", unknown: "Sin datos",
    profile: "Tipo de control", basic: "General", perishable: "Perecedero", serialized: "Con número de serie",
    warehouse: "Depósito / logística", intro: "Activá únicamente los campos que correspondan a este artículo.",
    general: "Datos comerciales", advanced: "Trazabilidad opcional", sku: "SKU / código interno",
    barcode: "Código de barras", unit: "Unidad de medida", location: "Ubicación / depósito",
    shelf: "Estante / sector", received: "Fecha de ingreso", made: "Fabricación", expiry: "Vencimiento",
    batch: "Lote de referencia", serial: "N.º de serie", reorder: "Punto de reposición",
    lead: "Plazo de entrega (días)", safety: "Stock de seguridad", notes: "Observaciones",
    trackReceived: "Registrar ingresos", trackExpiry: "Controlar vencimiento",
    trackMade: "Registrar fabricación", trackBatch: "Identificar lote",
    trackSerial: "Identificar serie", trackLocation: "Registrar ubicación",
    save: "Guardar ficha", saved: "Datos guardados", cancel: "Cerrar", invalid: "El vencimiento no puede ser anterior al ingreso o fabricación.",
    noExpiry: "Sin vencimiento asignado", expiredTag: "Vencido", soonTag: "Próximo",
    expiryCaption: "Alertas para productos con fecha de vencimiento informada: 30 días de anticipación.",
    batchNotice: "Esta ficha guarda un lote de referencia. No distribuye automáticamente las existencias entre lotes ni descuenta por FEFO.",
    readOnly: "Solo lectura", discount: "Precio actual", pending: "Cambios sin guardar",
    enableHint: "Los datos se guardan por producto y por negocio; un comercio sin vencimientos puede dejarlos desactivados.",
    expiryNone: "No se registraron vencimientos", alertExplain: "El vencimiento solo se controla cuando está activado en la ficha.",
    yes: "Sí", no: "No", empty: "—"
  },
  en: {
    title:"Inventory control",subtitle:"Organized stock with useful details for every item.",
    products:"Products",units:"Units",alerts:"Low stock",expiring:"Expiring soon",expired:"Expired",
    all:"All",low:"Low",out:"Out of stock",status:"Status",find:"Search name, barcode, SKU, lot or supplier",
    sort:"Sort by",name:"Name",stockAsc:"Lowest stock",soon:"Earliest expiry",latest:"Recently updated",
    product:"Product",category:"Category",supplier:"Supplier",cost:"Cost",price:"Price",
    stock:"Stock",min:"Minimum",actions:"Details",details:"Product details",edit:"Edit",open:"Open details",none:"No products match these filters.",unknown:"Unknown",
    profile:"Tracking profile",basic:"General",perishable:"Perishable",serialized:"Serial-numbered",warehouse:"Warehouse / logistics",
    intro:"Enable only the fields relevant to this item.",general:"Commercial details",advanced:"Optional traceability",
    sku:"SKU / internal code",barcode:"Barcode",unit:"Unit",location:"Location / warehouse",shelf:"Shelf / area",
    received:"Received on",made:"Manufactured on",expiry:"Expires on",batch:"Reference lot",serial:"Serial number",
    reorder:"Reorder point",lead:"Lead time (days)",safety:"Safety stock",notes:"Notes",
    trackReceived:"Track receiving",trackExpiry:"Track expiration",trackMade:"Track manufacture",trackBatch:"Track lot",
    trackSerial:"Track serial",trackLocation:"Track location",save:"Save details",saved:"Saved",cancel:"Close",
    invalid:"Expiry cannot precede receiving or manufacturing.",noExpiry:"No expiry date",expiredTag:"Expired",
    soonTag:"Soon",expiryCaption:"Warnings for items with an expiry date, up to 30 days ahead.",
    batchNotice:"This records one reference lot. It does not automatically allocate stock among batches or perform FEFO deductions.",
    readOnly:"Read only",discount:"Current price",pending:"Unsaved changes",
    enableHint:"Details are saved per product and business. Expiry tracking is optional.",
    expiryNone:"No tracked expiries",alertExplain:"Expiry alerts apply only to products with tracking enabled.",
    yes:"Yes",no:"No",empty:"—"
  },
  pt: {
    title:"Controle de estoque",subtitle:"Estoque organizado com os dados de cada produto.",
    products:"Produtos",units:"Unidades",alerts:"Estoque baixo",expiring:"Próximos do vencimento",expired:"Vencidos",
    all:"Todos",low:"Baixo",out:"Esgotado",status:"Estado",find:"Buscar nome, código, SKU, lote ou fornecedor",
    sort:"Ordenar por",name:"Nome",stockAsc:"Menor estoque",soon:"Vencimento próximo",latest:"Mais recentes",
    product:"Produto",category:"Categoria",supplier:"Fornecedor",cost:"Custo",price:"Preço",
    stock:"Estoque",min:"Mínimo",actions:"Detalhes",details:"Ficha do produto",edit:"Editar",open:"Abrir ficha",none:"Nenhum produto encontrado.",unknown:"Sem dados",
    profile:"Tipo de controle",basic:"Geral",perishable:"Perecível",serialized:"Com número de série",warehouse:"Depósito / logística",
    intro:"Ative apenas os campos aplicáveis.",general:"Dados comerciais",advanced:"Rastreabilidade opcional",
    sku:"SKU / código interno",barcode:"Código de barras",unit:"Unidade",location:"Local / depósito",shelf:"Prateleira / setor",
    received:"Data de entrada",made:"Fabricação",expiry:"Validade",batch:"Lote de referência",serial:"N.º de série",
    reorder:"Ponto de reposição",lead:"Prazo de entrega (dias)",safety:"Estoque de segurança",notes:"Observações",
    trackReceived:"Registrar entrada",trackExpiry:"Controlar validade",trackMade:"Registrar fabricação",trackBatch:"Identificar lote",
    trackSerial:"Identificar série",trackLocation:"Registrar localização",save:"Salvar ficha",saved:"Dados salvos",cancel:"Fechar",
    invalid:"A validade não pode ser anterior à entrada ou fabricação.",noExpiry:"Sem validade",expiredTag:"Vencido",
    soonTag:"Próximo",expiryCaption:"Alertas de validade com 30 dias de antecedência.",
    batchNotice:"A ficha guarda um lote de referência. Não distribui estoque entre lotes nem faz saída FEFO automática.",
    readOnly:"Somente leitura",discount:"Preço atual",pending:"Alterações não salvas",
    enableHint:"Os dados são salvos por produto e negócio; a validade é opcional.",
    expiryNone:"Sem validades registradas",alertExplain:"Alertas somente para produtos com controle habilitado.",
    yes:"Sim",no:"Não",empty:"—"
  },
  fr: {
    title:"Gestion des stocks",subtitle:"Suivez votre stock et les données de chaque article.",
    products:"Produits",units:"Unités",alerts:"Stock faible",expiring:"Expiration proche",expired:"Expirés",
    all:"Tous",low:"Faible",out:"Rupture",status:"État",find:"Chercher nom, code, SKU, lot ou fournisseur",
    sort:"Trier par",name:"Nom",stockAsc:"Stock croissant",soon:"Expiration proche",latest:"Dernières modifications",
    product:"Produit",category:"Catégorie",supplier:"Fournisseur",cost:"Coût",price:"Prix",stock:"Stock",
    min:"Minimum",actions:"Détails",details:"Fiche produit",edit:"Modifier",open:"Ouvrir la fiche",none:"Aucun produit trouvé.",unknown:"Inconnu",
    profile:"Type de suivi",basic:"Général",perishable:"Périssable",serialized:"Numéro de série",warehouse:"Entrepôt / logistique",
    intro:"Activez seulement les champs pertinents.",general:"Données commerciales",advanced:"Traçabilité facultative",
    sku:"SKU / code interne",barcode:"Code-barres",unit:"Unité",location:"Emplacement",shelf:"Rayon / zone",
    received:"Date d'entrée",made:"Fabrication",expiry:"Péremption",batch:"Lot de référence",serial:"N° de série",
    reorder:"Seuil de réapprovisionnement",lead:"Délai (jours)",safety:"Stock de sécurité",notes:"Notes",
    trackReceived:"Suivre les entrées",trackExpiry:"Suivre la péremption",trackMade:"Suivre la fabrication",
    trackBatch:"Identifier le lot",trackSerial:"Identifier le numéro de série",trackLocation:"Suivre l'emplacement",
    save:"Enregistrer",saved:"Enregistré",cancel:"Fermer",invalid:"La date de péremption doit suivre les dates d'entrée et de fabrication.",
    noExpiry:"Aucune date",expiredTag:"Expiré",soonTag:"Bientôt",
    expiryCaption:"Alertes 30 jours avant la péremption des produits suivis.",
    batchNotice:"Un seul lot de référence est enregistré. Le stock multi-lots et FEFO ne sont pas automatisés.",
    readOnly:"Lecture seule",discount:"Prix actuel",pending:"Modifications non enregistrées",
    enableHint:"Les données sont sauvegardées par produit et par entreprise. La péremption reste facultative.",
    expiryNone:"Aucune péremption",alertExplain:"Alertes uniquement pour les produits suivis.",
    yes:"Oui",no:"Non",empty:"—"
  },
  de: {
    title:"Bestandskontrolle",subtitle:"Lagerbestand und wichtige Produktdaten im Überblick.",
    products:"Produkte",units:"Einheiten",alerts:"Geringer Bestand",expiring:"Bald ablaufend",expired:"Abgelaufen",
    all:"Alle",low:"Niedrig",out:"Ausverkauft",status:"Status",find:"Name, Barcode, SKU, Charge oder Lieferant suchen",
    sort:"Sortieren",name:"Name",stockAsc:"Niedrigster Bestand",soon:"Ablaufdatum",latest:"Zuletzt geändert",
    product:"Produkt",category:"Kategorie",supplier:"Lieferant",cost:"Kosten",price:"Preis",
    stock:"Bestand",min:"Minimum",actions:"Details",details:"Produktdetails",edit:"Bearbeiten",open:"Details öffnen",none:"Keine passenden Produkte.",unknown:"Unbekannt",
    profile:"Erfassungsprofil",basic:"Allgemein",perishable:"Verderblich",serialized:"Mit Seriennummer",warehouse:"Lager / Logistik",
    intro:"Nur die benötigten Felder aktivieren.",general:"Geschäftsdaten",advanced:"Optionale Rückverfolgbarkeit",
    sku:"SKU / interner Code",barcode:"Barcode",unit:"Einheit",location:"Standort / Lager",shelf:"Regal / Bereich",
    received:"Eingangsdatum",made:"Herstellung",expiry:"Verfallsdatum",batch:"Referenzcharge",serial:"Seriennummer",
    reorder:"Meldebestand",lead:"Lieferzeit (Tage)",safety:"Sicherheitsbestand",notes:"Anmerkungen",
    trackReceived:"Eingang erfassen",trackExpiry:"Verfallsdatum verfolgen",trackMade:"Herstellung erfassen",
    trackBatch:"Charge erfassen",trackSerial:"Seriennummer erfassen",trackLocation:"Standort erfassen",
    save:"Speichern",saved:"Gespeichert",cancel:"Schließen",invalid:"Das Verfallsdatum darf nicht vor Eingang oder Herstellung liegen.",
    noExpiry:"Kein Verfallsdatum",expiredTag:"Abgelaufen",soonTag:"Bald",
    expiryCaption:"Warnung 30 Tage vor Verfallsdatum bei aktivierter Überwachung.",
    batchNotice:"Hier wird eine Referenzcharge gespeichert. Mehrere Chargen und FEFO werden nicht automatisch verwaltet.",
    readOnly:"Nur lesen",discount:"Aktueller Preis",pending:"Nicht gespeicherte Änderungen",
    enableHint:"Daten werden pro Produkt und Geschäft gespeichert. Verfallsdaten sind optional.",
    expiryNone:"Keine Daten",alertExplain:"Warnungen nur für Produkte mit aktiviertem Ablauftracking.",
    yes:"Ja",no:"Nein",empty:"—"
  }
} as const;

function localDay() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
}
function daysUntil(date?: string) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const target = Date.parse(date + "T00:00:00Z");
  const today = Date.parse(localDay() + "T00:00:00Z");
  return Number.isFinite(target) ? Math.round((target - today) / 86400000) : null;
}
function naturalProfile(product: Product, businessType: BusinessType): Profile {
  const words = [product.category, product.name].join(" ").toLocaleLowerCase();
  if (businessType === "restaurant" || /alimento|comida|bebida|lácteo|lacteo|helado|panader|carne|lácteos|bebidas|medicamento|farmacia|pereceder|food|dairy|frozen|fruit|verdura|cosmétic|cosmetic/i.test(words)) return "perishable";
  if (/electrónic|electronic|computador|telefon|notebook|celular|equipo|herramienta|hardware/i.test(words)) return "serialized";
  if (businessType === "wholesale" || businessType === "industry") return "warehouse";
  return "basic";
}
function profileSettings(profile: Profile): Pick<ProductInventoryDetails,"trackReceived"|"trackExpiry"|"trackManufacturing"|"trackBatch"|"trackSerial"|"trackLocation"> {
  return {
    trackReceived: profile === "perishable" || profile === "warehouse",
    trackExpiry: profile === "perishable",
    trackManufacturing: false,
    trackBatch: profile === "perishable" || profile === "warehouse",
    trackSerial: profile === "serialized",
    trackLocation: profile === "warehouse" || profile === "perishable"
  };
}
function initialDetails(product: Product, businessType: BusinessType): ProductInventoryDetails {
  const profile = product.inventoryDetails?.profile ?? naturalProfile(product,businessType);
  return { profile, unit:"unidades", ...profileSettings(profile), ...product.inventoryDetails };
}
function expiryState(product: Product, businessType: BusinessType) {
  const details = initialDetails(product,businessType);
  return details.trackExpiry ? daysUntil(details.expiresOn) : null;
}
function NumericEdit({ label, value, onChange, disabled, step="1" }: {
  label:string;value:number | string;onChange:(value:string)=>void;disabled:boolean;step?:string
}) {
  const [draft,setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)),[value]);
  return <label className="gs-warehouse-field">
    <span>{label}</span>
    <input type="number" min="0" step={step} inputMode="decimal" disabled={disabled}
      value={draft} onChange={e=>setDraft(e.target.value)}
      onBlur={()=>{if(draft !== String(value))onChange(draft)}}
      onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();if(e.key==="Escape"){setDraft(String(value));e.currentTarget.blur();}}}
      className="apex-input" />
  </label>;
}
export function InventoryControlCenter({
  language,businessType,products,money,readOnly,onUpdateStock,onAddStock,
  onUpdatePrice,onUpdateCost,onUpdateMinimum,onUpdateSupplier,onUpdateBarcode,onUpdateDetails
}:Props) {
  const t = texts[language];
  const reduced = useReducedMotion();
  const [query,setQuery] = useState("");
  const [filter,setFilter] = useState<Filter>("all");
  const [sort,setSort] = useState<Sort>("name");
  const [selectedId,setSelectedId] = useState<string|null>(null);
  const selected = products.find(p=>p.id===selectedId) ?? null;
  const [draft,setDraft] = useState<ProductInventoryDetails>({});
  const [supplierDraft,setSupplierDraft] = useState("");
  const [barcodeDraft,setBarcodeDraft] = useState("");
  const [formError,setFormError] = useState("");
  const [saved,setSaved] = useState(false);

  useEffect(()=>{
    if (!selected) return;
    setDraft(initialDetails(selected,businessType));
    setSupplierDraft(selected.supplier || "");
    setBarcodeDraft(selected.barcode || "");
    setFormError("");
    setSaved(false);
  },[selected?.id,businessType]);

  const expiring = products.filter(p=>p.stock>0 && (expiryState(p,businessType) ?? Infinity) >= 0 && (expiryState(p,businessType) ?? Infinity) <= 30).length;
  const expired = products.filter(p=>p.stock>0 && (expiryState(p,businessType) ?? Infinity)<0).length;
  const lowCount = products.filter(p=>getStockStatus(p)==="low").length;
  const outCount = products.filter(p=>getStockStatus(p)==="out").length;
  const number = useMemo(()=>new Intl.NumberFormat(locale[language]),[language]);

  const visible = useMemo(()=>{
    const q = query.trim().toLocaleLowerCase();
    return products.filter(product=>{
      const state = getStockStatus(product);
      const exp=expiryState(product,businessType);
      const match= [product.name,product.barcode,product.category,product.supplier,
        product.inventoryDetails?.sku,product.inventoryDetails?.batchCode,product.inventoryDetails?.location]
        .some(v=>(v??"").toLocaleLowerCase().includes(q));
      if(!match)return false;
      if(filter==="low")return state==="low";
      if(filter==="out")return state==="out";
      if(filter==="expiring")return product.stock>0 && exp!==null && exp>=0 && exp<=30;
      if(filter==="expired")return product.stock>0 && exp!==null && exp<0;
      return true;
    }).sort((a,b)=>{
      if(sort==="stock")return a.stock-b.stock || a.name.localeCompare(b.name);
      if(sort==="expiry")return (expiryState(a,businessType) ?? Infinity)-(expiryState(b,businessType) ?? Infinity);
      if(sort==="updated")return String(b.updatedAt??"").localeCompare(String(a.updatedAt??""));
      return a.name.localeCompare(b.name);
    });
  },[products,query,filter,sort,businessType]);

  const changed = selected ? JSON.stringify(draft)!==JSON.stringify(initialDetails(selected,businessType))
    || supplierDraft!==selected.supplier || barcodeDraft!==selected.barcode : false;

  function applyProfile(profile: Profile) {
    setDraft(current=>({...current,...profileSettings(profile),profile}));
    setFormError("");
    setSaved(false);
  }
  function field<K extends keyof ProductInventoryDetails>(name:K,value:ProductInventoryDetails[K]) {
    setDraft(current=>({...current,[name]:value}));
    setSaved(false);
    setFormError("");
  }
  function save() {
    if (!selected || readOnly) return;
    if (draft.trackExpiry && draft.expiresOn
       && ((draft.trackReceived && draft.receivedOn && draft.expiresOn < draft.receivedOn)
         || (draft.trackManufacturing && draft.manufacturedOn && draft.expiresOn < draft.manufacturedOn))) {
      setFormError(t.invalid); return;
    }
    if (barcodeDraft.trim()!==selected.barcode) onUpdateBarcode(selected.id,barcodeDraft.trim());
    if (supplierDraft!==selected.supplier) onUpdateSupplier(selected.id,supplierDraft);
    onUpdateDetails(selected.id,{
      ...draft,
      sku:draft.sku?.trim()||"",
      batchCode:draft.batchCode?.trim()||"",
      serialNumber:draft.serialNumber?.trim()||"",
      location:draft.location?.trim()||"",
      shelf:draft.shelf?.trim()||"",
      leadTimeDays:Math.max(0,Number(draft.leadTimeDays)||0),
      reorderPoint:Math.max(0,Number(draft.reorderPoint)||0),
      safetyStock:Math.max(0,Number(draft.safetyStock)||0)
    });
    setSaved(true);
  }
  const toggles: Array<{key:keyof ProductInventoryDetails;title:string}> = [
    {key:"trackReceived",title:t.trackReceived},
    {key:"trackExpiry",title:t.trackExpiry},
    {key:"trackManufacturing",title:t.trackMade},
    {key:"trackBatch",title:t.trackBatch},
    {key:"trackSerial",title:t.trackSerial},
    {key:"trackLocation",title:t.trackLocation}
  ];

  return <div className="gs-warehouse space-y-4">
    <div className="gs-warehouse-stats">
      {[
        {label:t.products,value:number.format(products.length),icon:<Boxes size={18}/>,target:"all" as Filter},
        {label:t.alerts,value:number.format(lowCount),icon:<AlertTriangle size={18}/>,target:"low" as Filter},
        {label:t.expiring,value:number.format(expiring),icon:<CalendarClock size={18}/>,target:"expiring" as Filter},
        {label:t.expired,value:number.format(expired),icon:<ShieldAlert size={18}/>,target:"expired" as Filter}
      ].map(item=><button type="button" key={item.target} onClick={()=>setFilter(item.target)}
        aria-pressed={filter===item.target}
        className="gs-warehouse-stat group">
        <span className="gs-warehouse-stat__icon">{item.icon}</span>
        <span><span className="gs-warehouse-stat__label">{item.label}</span><strong className="gs-warehouse-stat__number">{item.value}</strong></span>
        <ChevronRight size={15} className="ml-auto opacity-40 transition-transform group-hover:translate-x-0.5"/>
      </button>)}
    </div>
    <section className="apex-card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--apex-border)] px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight">{t.title}</h2>
          <p className="mt-1 text-xs text-[var(--apex-muted)]">{t.subtitle}</p>
        </div>
        {readOnly && <span className="rounded-full border border-[var(--apex-border)] px-3 py-1.5 text-xs">{t.readOnly}</span>}
      </div>
      <div className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_190px_200px]">
        <label className="relative min-w-0">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--apex-muted)]"/>
          <input className="apex-input gs-warehouse-search pl-11" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.find} aria-label={t.find}/>
        </label>
        <div className="relative min-w-0">
          <SlidersHorizontal size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-[var(--apex-muted)]"/>
          <ApexSelect aria-label={t.status} value={filter} onChange={e=>setFilter(e.target.value as Filter)}
            className="apex-input gs-warehouse-select pl-10">
            <option value="all">{t.all}</option>
            <option value="low">{t.low}</option>
            <option value="out">{t.out}</option>
            <option value="expiring">{t.expiring}</option>
            <option value="expired">{t.expired}</option>
          </ApexSelect>
        </div>
        <div className="relative min-w-0">
          <ArrowUpDown size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-[var(--apex-muted)]"/>
          <ApexSelect aria-label={t.sort} value={sort} onChange={e=>setSort(e.target.value as Sort)}
            className="apex-input gs-warehouse-select pl-10">
            <option value="name">{t.name}</option>
            <option value="stock">{t.stockAsc}</option>
            <option value="expiry">{t.soon}</option>
            <option value="updated">{t.latest}</option>
          </ApexSelect>
        </div>
      </div>
      <div className="gs-warehouse-scroll overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead><tr>
            <th>{t.product}</th><th>{t.category}</th><th>{t.supplier}</th>
            <th>{t.cost}</th><th>{t.price}</th><th>{t.stock}</th>
            <th>{t.min}</th><th>{t.status}</th><th className="text-right">{t.actions}</th>
          </tr></thead>
          <tbody>
            {visible.map(product=>{
              const stockStatus=getStockStatus(product);
              const days=expiryState(product,businessType);
              const expFlag=product.stock>0 && days!==null && days<0;
              const soonFlag=product.stock>0 && days!==null && days>=0 && days<=30;
              return <tr key={product.id} className="gs-warehouse-row">
                <td>
                  <button type="button" className="group max-w-[240px] text-left" onClick={()=>setSelectedId(product.id)}>
                    <span className="block truncate text-[13px] font-semibold group-hover:text-[var(--apex-accent)]">{product.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-[var(--apex-muted)]">{product.inventoryDetails?.sku || product.barcode || t.empty}</span>
                  </button>
                </td>
                <td className="text-[12px] text-[var(--apex-muted)]">{product.category || t.empty}</td>
                <td className="text-[12px]">{product.supplier || t.empty}</td>
                <td className="text-[12px] tabular-nums">{product.costKnown===false ? t.empty : money(product.cost)}</td>
                <td className="text-[12px] font-semibold tabular-nums">{money(product.price)}</td>
                <td>
                  {readOnly ? <b className="text-sm tabular-nums">{number.format(product.stock)}</b>
                    : <StockQuantityCell productId={product.id} stock={product.stock} onSetStock={onUpdateStock} onAddStock={onAddStock}/>}
                </td>
                <td className="text-[12px] tabular-nums">{number.format(product.minStock)}</td>
                <td>
                  <div className="flex max-w-36 flex-col items-start gap-1.5">
                    <span className={"gs-warehouse-chip " + (stockStatus==="out"?"gs-warehouse-chip--danger":stockStatus==="low"?"gs-warehouse-chip--warning":"gs-warehouse-chip--ok")}>
                      {stockStatus==="out"?t.out:stockStatus==="low"?t.low:"OK"}
                    </span>
                    {expFlag&&<span className="gs-warehouse-chip gs-warehouse-chip--danger">{t.expiredTag}</span>}
                    {soonFlag&&<span className="gs-warehouse-chip gs-warehouse-chip--warning">{t.soonTag} · {days}d</span>}
                  </div>
                </td>
                <td className="text-right">
                  <button type="button" onClick={()=>setSelectedId(product.id)} aria-label={t.open+": "+product.name}
                    className="gs-warehouse-open group" title={t.open}>
                    <Settings2 size={15}/><span>{t.edit}</span>
                  </button>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
        {!visible.length&&<p className="px-5 py-14 text-center text-sm text-[var(--apex-muted)]">{t.none}</p>}
      </div>
      <div className="border-t border-[var(--apex-border)] px-4 py-3 text-[11px] text-[var(--apex-muted)] sm:px-5">
        {number.format(visible.length)} / {number.format(products.length)} {t.products.toLocaleLowerCase()} · {t.expiryCaption}
      </div>
    </section>
    <p className="px-1 text-xs leading-relaxed text-[var(--apex-muted)]">{t.enableHint}</p>
    <AnimatePresence>
      {selected && <motion.div className="gs-warehouse-modal fixed inset-0 z-[160] flex justify-end"
        initial={reduced?false:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        transition={{duration:reduced?0:.18}}>
        <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={()=>setSelectedId(null)} aria-label={t.cancel}/>
        <motion.section role="dialog" aria-modal="true" aria-label={t.details} key={selected.id}
          initial={reduced?false:{x:30,opacity:.75}} animate={{x:0,opacity:1}} exit={{x:20,opacity:0}}
          transition={{duration:reduced?0:.28,ease:[.22,1,.36,1]}}
          className="gs-warehouse-drawer relative ml-auto flex h-full w-full max-w-[610px] flex-col overflow-hidden border-l border-[var(--apex-border)] bg-[var(--apex-surface-strong)] shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--apex-border)] px-5 py-5 sm:px-7">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--apex-accent)]">{t.details}</p>
              <h3 className="mt-1 truncate text-xl font-bold tracking-tight">{selected.name}</h3>
              <p className="mt-1 text-xs text-[var(--apex-muted)]">{selected.category || t.unknown}</p>
            </div>
            <button type="button" onClick={()=>setSelectedId(null)} className="gs-warehouse-close" aria-label={t.cancel}><X size={19}/></button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
            <p className="text-xs leading-relaxed text-[var(--apex-muted)]">{t.intro}</p>
            <label className="gs-warehouse-field">
              <span>{t.profile}</span>
              <ApexSelect disabled={readOnly} className="apex-input" value={draft.profile ?? "basic"} onChange={e=>applyProfile(e.target.value as Profile)}>
                <option value="basic">{t.basic}</option><option value="perishable">{t.perishable}</option>
                <option value="serialized">{t.serialized}</option><option value="warehouse">{t.warehouse}</option>
              </ApexSelect>
            </label>
            <section>
              <h4 className="gs-warehouse-heading"><Package size={16}/>{t.general}</h4>
              <div className="gs-warehouse-fields">
                <label className="gs-warehouse-field"><span>{t.sku}</span>
                  <input className="apex-input" value={draft.sku??""} disabled={readOnly} maxLength={120} onChange={e=>field("sku",e.target.value)}/></label>
                <label className="gs-warehouse-field"><span>{t.barcode}</span>
                  <input className="apex-input" value={barcodeDraft} disabled={readOnly} maxLength={140} onChange={e=>{setBarcodeDraft(e.target.value);setSaved(false);}}/></label>
                <label className="gs-warehouse-field"><span>{t.supplier}</span>
                  <input className="apex-input" value={supplierDraft} disabled={readOnly} maxLength={140} onChange={e=>{setSupplierDraft(e.target.value);setSaved(false);}}/></label>
                <label className="gs-warehouse-field"><span>{t.unit}</span>
                  <input className="apex-input" value={draft.unit??""} disabled={readOnly} maxLength={35} onChange={e=>field("unit",e.target.value)}/></label>
                <NumericEdit label={t.cost} value={selected.costKnown===false?"":selected.cost} step="0.01" disabled={readOnly}
                  onChange={value=>onUpdateCost(selected.id,value)}/>
                <NumericEdit label={t.price} value={selected.originalPrice??selected.price} step="0.01" disabled={readOnly}
                  onChange={value=>{const amount=Number(value);if(Number.isFinite(amount))onUpdatePrice(selected.id,Math.max(0,amount));}}/>
                <NumericEdit label={t.min} value={selected.minStock} disabled={readOnly}
                  onChange={value=>{const amount=Number(value);if(Number.isFinite(amount))onUpdateMinimum(selected.id,Math.max(0,amount));}}/>
                <label className="gs-warehouse-field"><span>{t.reorder}</span>
                  <input className="apex-input" type="number" min="0" value={draft.reorderPoint??""} disabled={readOnly} onChange={e=>field("reorderPoint",Math.max(0,Number(e.target.value)||0))}/></label>
                <label className="gs-warehouse-field"><span>{t.safety}</span>
                  <input className="apex-input" type="number" min="0" value={draft.safetyStock??""} disabled={readOnly} onChange={e=>field("safetyStock",Math.max(0,Number(e.target.value)||0))}/></label>
                <label className="gs-warehouse-field"><span>{t.lead}</span>
                  <input className="apex-input" type="number" min="0" value={draft.leadTimeDays??""} disabled={readOnly} onChange={e=>field("leadTimeDays",Math.max(0,Number(e.target.value)||0))}/></label>
              </div>
            </section>
            <section>
              <h4 className="gs-warehouse-heading"><Sparkles size={16}/>{t.advanced}</h4>
              <div className="gs-warehouse-toggle-grid">
                {toggles.map(item=><button key={item.key} type="button" disabled={readOnly}
                  role="switch" aria-checked={Boolean(draft[item.key])}
                  onClick={()=>field(item.key,!draft[item.key] as never)}
                  className="gs-warehouse-toggle">
                  <span>{item.title}</span>
                  <span className={"gs-warehouse-switch "+(draft[item.key]?"is-on":"")} aria-hidden="true"><i/></span>
                </button>)}
              </div>
              <AnimatePresence initial={false}>
                {(draft.trackReceived||draft.trackExpiry||draft.trackManufacturing||draft.trackBatch||draft.trackSerial||draft.trackLocation) && (
                  <motion.div initial={reduced?false:{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                    exit={{height:0,opacity:0}} transition={{duration:reduced?0:.22}}
                    className="overflow-hidden">
                    <div className="gs-warehouse-fields pt-4">
                      {draft.trackReceived&&<label className="gs-warehouse-field"><span>{t.received}</span>
                        <input className="apex-input" type="date" disabled={readOnly} value={draft.receivedOn??""} onChange={e=>field("receivedOn",e.target.value)}/></label>}
                      {draft.trackManufacturing&&<label className="gs-warehouse-field"><span>{t.made}</span>
                        <input className="apex-input" type="date" disabled={readOnly} value={draft.manufacturedOn??""} onChange={e=>field("manufacturedOn",e.target.value)}/></label>}
                      {draft.trackExpiry&&<label className="gs-warehouse-field"><span>{t.expiry}</span>
                        <input className="apex-input" type="date" disabled={readOnly} value={draft.expiresOn??""} onChange={e=>field("expiresOn",e.target.value)}/></label>}
                      {draft.trackBatch&&<label className="gs-warehouse-field"><span>{t.batch}</span>
                        <input className="apex-input" disabled={readOnly} maxLength={120} value={draft.batchCode??""} onChange={e=>field("batchCode",e.target.value)}/></label>}
                      {draft.trackSerial&&<label className="gs-warehouse-field"><span>{t.serial}</span>
                        <input className="apex-input" disabled={readOnly} maxLength={120} value={draft.serialNumber??""} onChange={e=>field("serialNumber",e.target.value)}/></label>}
                      {draft.trackLocation&&<><label className="gs-warehouse-field"><span>{t.location}</span>
                        <input className="apex-input" disabled={readOnly} maxLength={120} value={draft.location??""} onChange={e=>field("location",e.target.value)}/></label>
                        <label className="gs-warehouse-field"><span>{t.shelf}</span>
                        <input className="apex-input" disabled={readOnly} maxLength={120} value={draft.shelf??""} onChange={e=>field("shelf",e.target.value)}/></label></>}
                    </div>
                    {(draft.trackBatch||draft.trackExpiry)&&<p className="mt-3 text-[11px] leading-relaxed text-[var(--apex-muted)]">{t.batchNotice}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
            <label className="gs-warehouse-field"><span>{t.notes}</span>
              <textarea rows={3} maxLength={2000} disabled={readOnly} className="apex-input min-h-24 resize-y py-3" value={draft.notes??""} onChange={e=>field("notes",e.target.value)}/>
            </label>
            {formError&&<p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-600" role="alert">{formError}</p>}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-5 py-4 sm:px-7">
            <span role="status" className="text-xs text-[var(--apex-muted)]">{saved?<span className="flex items-center gap-1 text-emerald-600"><Check size={14}/>{t.saved}</span>:changed?t.pending:""}</span>
            <div className="flex gap-2">
              <button type="button" onClick={()=>setSelectedId(null)} className="gs-warehouse-secondary">{t.cancel}</button>
              {!readOnly&&<button type="button" onClick={save} disabled={!changed&&!formError}
                className="gs-warehouse-primary">{t.save}</button>}
            </div>
          </div>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
