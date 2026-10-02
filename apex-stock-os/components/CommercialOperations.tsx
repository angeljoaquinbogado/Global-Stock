"use client";

import {
  BadgePercent,
  ClipboardList,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import type { LanguageCode } from "./GlobalPreferences";

type Props = {
  businessId: string;
  language: LanguageCode;
  currency: string;
  locale: string;
};

type Tab = "quotes" | "returns" | "ledger" | "payables" | "promotions" | "serials";

type Customer = { id:string; name:string; account_balance:number };
type Sale = { id:string; total:number; currency:string; created_at:string; status:string };
type Supplier = { id:string; name:string };
type Quote = { id:string; status:string; total:number; currency:string; valid_until:string|null; created_at:string; customer_id:string|null };
type ReturnRow = { id:string; amount:number; reason:string|null; status:string; created_at:string; sale_id:string|null };
type LedgerRow = { id:string; customer_id:string; kind:string; amount:number; notes:string|null; created_at:string };
type Payable = { id:string; description:string; amount:number; paid_amount:number; currency:string; due_at:string|null; status:string; supplier_id:string|null };
type Promotion = { id:string; name:string; kind:string; value:number|null; starts_at:string|null; ends_at:string|null; active:boolean };
type LoyaltyRule = { id:string; name:string; points_per_currency:number; redemption_value:number; active:boolean };
type SerialRow = { id:string; product_key:string; serial_number:string; status:string; warranty_until:string|null };

function tr(language:LanguageCode, es:string, en:string){ return language==="es" ? es : en; }
function money(value:number,currency:string,locale:string){ return new Intl.NumberFormat(locale,{style:"currency",currency,maximumFractionDigits:2}).format(Number(value)||0); }

const tabMeta:Array<{id:Tab;icon:typeof ClipboardList;es:string;en:string}>=[
  {id:"quotes",icon:ClipboardList,es:"Presupuestos",en:"Quotes"},
  {id:"returns",icon:RotateCcw,es:"Devoluciones",en:"Returns"},
  {id:"ledger",icon:WalletCards,es:"Cuenta corriente",en:"Customer ledger"},
  {id:"payables",icon:CreditCard,es:"Cuentas por pagar",en:"Payables"},
  {id:"promotions",icon:BadgePercent,es:"Promos y fidelización",en:"Promotions & loyalty"},
  {id:"serials",icon:ShieldCheck,es:"Números de serie",en:"Serial numbers"}
];

export function CommercialOperations({businessId,language,currency,locale}:Props){
  const [tab,setTab]=useState<Tab>("quotes");
  const [loading,setLoading]=useState(false);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [sales,setSales]=useState<Sale[]>([]);
  const [suppliers,setSuppliers]=useState<Supplier[]>([]);
  const [quotes,setQuotes]=useState<Quote[]>([]);
  const [returns,setReturns]=useState<ReturnRow[]>([]);
  const [ledger,setLedger]=useState<LedgerRow[]>([]);
  const [payables,setPayables]=useState<Payable[]>([]);
  const [promotions,setPromotions]=useState<Promotion[]>([]);
  const [loyalty,setLoyalty]=useState<LoyaltyRule[]>([]);
  const [serials,setSerials]=useState<SerialRow[]>([]);
  const [products,setProducts]=useState<Product[]>([]);

  const [customerId,setCustomerId]=useState("");
  const [quoteTotal,setQuoteTotal]=useState("");
  const [quoteValid,setQuoteValid]=useState("");
  const [saleId,setSaleId]=useState("");
  const [returnAmount,setReturnAmount]=useState("");
  const [returnReason,setReturnReason]=useState("");
  const [ledgerCustomer,setLedgerCustomer]=useState("");
  const [ledgerKind,setLedgerKind]=useState("charge");
  const [ledgerAmount,setLedgerAmount]=useState("");
  const [ledgerNote,setLedgerNote]=useState("");
  const [supplierId,setSupplierId]=useState("");
  const [payableDescription,setPayableDescription]=useState("");
  const [payableAmount,setPayableAmount]=useState("");
  const [payableDue,setPayableDue]=useState("");
  const [promoName,setPromoName]=useState("");
  const [promoKind,setPromoKind]=useState("percentage");
  const [promoValue,setPromoValue]=useState("");
  const [loyaltyName,setLoyaltyName]=useState("");
  const [pointsPerCurrency,setPointsPerCurrency]=useState("0");
  const [redemptionValue,setRedemptionValue]=useState("0");
  const [serialProduct,setSerialProduct]=useState("");
  const [serialNumber,setSerialNumber]=useState("");
  const [warrantyUntil,setWarrantyUntil]=useState("");

  const customerName=useMemo(()=>new Map(customers.map(c=>[c.id,c.name])),[customers]);
  const supplierName=useMemo(()=>new Map(suppliers.map(s=>[s.id,s.name])),[suppliers]);

  async function reload(){
    const s=getSupabaseBrowserClient(); if(!s)return; setLoading(true);
    try{
      const [a,b,c,d,e,f,g,h,i,j]=await Promise.all([
        s.from("global_stock_customers").select("id,name,account_balance").eq("business_id",businessId).eq("active",true).order("name"),
        s.from("global_stock_sales").select("id,total,currency,created_at,status").eq("business_id",businessId).order("created_at",{ascending:false}).limit(100),
        s.from("global_stock_suppliers").select("id,name").eq("business_id",businessId).eq("active",true).order("name"),
        s.from("global_stock_quotes").select("id,status,total,currency,valid_until,created_at,customer_id").eq("business_id",businessId).order("created_at",{ascending:false}).limit(100),
        s.from("global_stock_returns").select("id,amount,reason,status,created_at,sale_id").eq("business_id",businessId).order("created_at",{ascending:false}).limit(100),
        s.from("global_stock_customer_ledger").select("id,customer_id,kind,amount,notes,created_at").eq("business_id",businessId).order("created_at",{ascending:false}).limit(200),
        s.from("global_stock_accounts_payable").select("id,description,amount,paid_amount,currency,due_at,status,supplier_id").eq("business_id",businessId).order("created_at",{ascending:false}).limit(100),
        s.from("global_stock_promotions").select("id,name,kind,value,starts_at,ends_at,active").eq("business_id",businessId).order("created_at",{ascending:false}),
        s.from("global_stock_loyalty_rules").select("id,name,points_per_currency,redemption_value,active").eq("business_id",businessId).order("created_at",{ascending:false}),
        s.from("global_stock_serial_numbers").select("id,product_key,serial_number,status,warranty_until").eq("business_id",businessId).order("created_at",{ascending:false}).limit(200)
      ]);
      setCustomers((a.data as Customer[]|null)??[]);
      setSales((b.data as Sale[]|null)??[]);
      setSuppliers((c.data as Supplier[]|null)??[]);
      setQuotes((d.data as Quote[]|null)??[]);
      setReturns((e.data as ReturnRow[]|null)??[]);
      setLedger((f.data as LedgerRow[]|null)??[]);
      setPayables((g.data as Payable[]|null)??[]);
      setPromotions((h.data as Promotion[]|null)??[]);
      setLoyalty((i.data as LoyaltyRule[]|null)??[]);
      setSerials((j.data as SerialRow[]|null)??[]);
      const {data:workspace}=await s.from("global_stock_workspaces").select("state").eq("business_id",businessId).maybeSingle();
      const state=(workspace?.state??{}) as {products?:Product[]};
      const p=Array.isArray(state.products)?state.products:[];
      setProducts(p);
      if(!serialProduct&&p[0]?.id)setSerialProduct(p[0].id);
      if(!customerId&&a.data?.[0]?.id)setCustomerId(String(a.data[0].id));
      if(!ledgerCustomer&&a.data?.[0]?.id)setLedgerCustomer(String(a.data[0].id));
      if(!saleId&&b.data?.[0]?.id)setSaleId(String(b.data[0].id));
      if(!supplierId&&c.data?.[0]?.id)setSupplierId(String(c.data[0].id));
    }finally{setLoading(false)}
  }

  useEffect(()=>{void reload();/* eslint-disable-next-line react-hooks/exhaustive-deps */},[businessId]);

  async function createQuote(){
    const total=Math.max(0,Number(quoteTotal)||0); if(!total)return;
    const s=getSupabaseBrowserClient();if(!s)return;const {data:auth}=await s.auth.getSession();
    await s.from("global_stock_quotes").insert({business_id:businessId,customer_id:customerId||null,user_id:auth.session?.user.id??null,status:"draft",currency,total,subtotal:total,valid_until:quoteValid||null});
    setQuoteTotal("");setQuoteValid("");await reload();
  }

  async function quoteStatus(id:string,status:string){
    const s=getSupabaseBrowserClient();if(!s)return;await s.from("global_stock_quotes").update({status}).eq("id",id);await reload();
  }

  async function createReturn(){
    const amount=Math.max(0,Number(returnAmount)||0);if(!saleId||!amount)return;
    const s=getSupabaseBrowserClient();if(!s)return;const {data:auth}=await s.auth.getSession();
    await s.from("global_stock_returns").insert({business_id:businessId,sale_id:saleId,user_id:auth.session?.user.id??null,amount,reason:returnReason.trim()||null,status:"completed"});
    await s.from("global_stock_audit_events").insert({business_id:businessId,user_id:auth.session?.user.id??null,action:"sale.returned",entity_type:"sale",entity_id:saleId,metadata:{amount,reason:returnReason.trim()||null}});
    setReturnAmount("");setReturnReason("");await reload();
  }

  async function addLedgerEntry(){
    const amount=Math.max(0,Number(ledgerAmount)||0);if(!ledgerCustomer||!amount)return;
    const s=getSupabaseBrowserClient();if(!s)return;const {data:auth}=await s.auth.getSession();
    await s.from("global_stock_customer_ledger").insert({business_id:businessId,customer_id:ledgerCustomer,user_id:auth.session?.user.id??null,kind:ledgerKind,amount,notes:ledgerNote.trim()||null});
    const customer=customers.find(c=>c.id===ledgerCustomer);const current=Number(customer?.account_balance)||0;
    const next=ledgerKind==="payment"||ledgerKind==="credit"?current-amount:current+amount;
    await s.from("global_stock_customers").update({account_balance:next}).eq("id",ledgerCustomer);
    setLedgerAmount("");setLedgerNote("");await reload();
  }

  async function createPayable(){
    const amount=Math.max(0,Number(payableAmount)||0);if(!payableDescription.trim()||!amount)return;
    const s=getSupabaseBrowserClient();if(!s)return;
    await s.from("global_stock_accounts_payable").insert({business_id:businessId,supplier_id:supplierId||null,description:payableDescription.trim(),amount,paid_amount:0,currency,due_at:payableDue||null,status:"pending"});
    setPayableDescription("");setPayableAmount("");setPayableDue("");await reload();
  }

  async function markPayablePaid(id:string,amount:number){
    const s=getSupabaseBrowserClient();if(!s)return;
    await s.from("global_stock_accounts_payable").update({paid_amount:amount,status:"paid"}).eq("id",id);await reload();
  }

  async function createPromotion(){
    if(!promoName.trim())return;const s=getSupabaseBrowserClient();if(!s)return;
    await s.from("global_stock_promotions").insert({business_id:businessId,name:promoName.trim(),kind:promoKind,value:Math.max(0,Number(promoValue)||0),active:true,conditions:{}});
    setPromoName("");setPromoValue("");await reload();
  }

  async function createLoyalty(){
    if(!loyaltyName.trim())return;const s=getSupabaseBrowserClient();if(!s)return;
    await s.from("global_stock_loyalty_rules").insert({business_id:businessId,name:loyaltyName.trim(),points_per_currency:Math.max(0,Number(pointsPerCurrency)||0),redemption_value:Math.max(0,Number(redemptionValue)||0),conditions:{},active:true});
    setLoyaltyName("");await reload();
  }

  async function addSerial(){
    if(!serialProduct||!serialNumber.trim())return;const s=getSupabaseBrowserClient();if(!s)return;
    await s.from("global_stock_serial_numbers").insert({business_id:businessId,product_key:serialProduct,serial_number:serialNumber.trim(),status:"in_stock",warranty_until:warrantyUntil||null});
    setSerialNumber("");setWarrantyUntil("");await reload();
  }

  return <div className="space-y-4">
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabMeta.map(({id,icon:Icon,es,en})=><button key={id} type="button" onClick={()=>setTab(id)} className={"inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold "+(tab===id?"border-[#8F0000]/60 bg-[#8F0000]/10 text-[#8F0000]":"border-[var(--apex-border)]")}><Icon size={14}/>{tr(language,es,en)}</button>)}
      <button type="button" onClick={()=>void reload()} className="ml-auto inline-flex min-h-10 shrink-0 items-center rounded-xl border border-[var(--apex-border)] px-3 text-xs font-semibold">{loading?"…":"Sync"}</button>
    </div>

    {tab==="quotes"&&<Grid title={tr(language,"Presupuestos","Quotes")} form={<><Select value={customerId} onChange={setCustomerId} options={customers.map(c=>({value:c.id,label:c.name}))} placeholder="Cliente"/><Input value={quoteTotal} setValue={setQuoteTotal} placeholder="Total" numeric/><input className="apex-input w-full p-3" type="date" value={quoteValid} onChange={e=>setQuoteValid(e.target.value)}/><Action label="Crear presupuesto" onClick={()=>void createQuote()}/></>}>{quotes.map(q=><Row key={q.id} title={(q.customer_id?customerName.get(q.customer_id):"Sin cliente")+" · "+money(q.total,q.currency||currency,locale)} subtitle={q.valid_until?"Válido hasta "+q.valid_until:"Sin vencimiento"} action={<select className="apex-input min-h-9 px-2 text-xs" value={q.status} onChange={e=>void quoteStatus(q.id,e.target.value)}>{["draft","sent","accepted","rejected","expired","converted"].map(x=><option key={x} value={x}>{x}</option>)}</select>}/>)}</Grid>}

    {tab==="returns"&&<Grid title="Devoluciones" form={<><Select value={saleId} onChange={setSaleId} options={sales.map(s=>({value:s.id,label:new Date(s.created_at).toLocaleDateString(locale)+" · "+money(s.total,s.currency||currency,locale)}))} placeholder="Venta"/><Input value={returnAmount} setValue={setReturnAmount} placeholder="Importe a devolver" numeric/><Input value={returnReason} setValue={setReturnReason} placeholder="Motivo"/><Action label="Registrar devolución" onClick={()=>void createReturn()}/></>}>{returns.map(r=><Row key={r.id} title={money(r.amount,currency,locale)} subtitle={(r.reason||"Sin motivo")+" · "+r.status}/>)}</Grid>}

    {tab==="ledger"&&<Grid title="Cuenta corriente" form={<><Select value={ledgerCustomer} onChange={setLedgerCustomer} options={customers.map(c=>({value:c.id,label:c.name+" · saldo "+money(c.account_balance,currency,locale)}))} placeholder="Cliente"/><select className="apex-input w-full p-3" value={ledgerKind} onChange={e=>setLedgerKind(e.target.value)}><option value="charge">Cargo / deuda</option><option value="payment">Pago</option><option value="credit">Crédito</option><option value="adjustment">Ajuste</option></select><Input value={ledgerAmount} setValue={setLedgerAmount} placeholder="Importe" numeric/><Input value={ledgerNote} setValue={setLedgerNote} placeholder="Nota"/><Action label="Guardar movimiento" onClick={()=>void addLedgerEntry()}/></>}>{ledger.map(l=><Row key={l.id} title={(customerName.get(l.customer_id)||"Cliente")+" · "+money(l.amount,currency,locale)} subtitle={l.kind+" · "+(l.notes||"")}/>)}</Grid>}

    {tab==="payables"&&<Grid title="Cuentas por pagar" form={<><Select value={supplierId} onChange={setSupplierId} options={suppliers.map(s=>({value:s.id,label:s.name}))} placeholder="Proveedor"/><Input value={payableDescription} setValue={setPayableDescription} placeholder="Descripción"/><Input value={payableAmount} setValue={setPayableAmount} placeholder="Importe" numeric/><input className="apex-input w-full p-3" type="date" value={payableDue} onChange={e=>setPayableDue(e.target.value)}/><Action label="Crear cuenta por pagar" onClick={()=>void createPayable()}/></>}>{payables.map(p=><Row key={p.id} title={p.description+" · "+money(p.amount,p.currency||currency,locale)} subtitle={(p.supplier_id?supplierName.get(p.supplier_id):"Sin proveedor")+" · "+p.status+(p.due_at?" · "+p.due_at:"")} action={p.status!=="paid"?<button type="button" onClick={()=>void markPayablePaid(p.id,p.amount)} className="rounded-xl border border-[var(--apex-border)] px-3 py-2 text-xs font-semibold">Marcar pagado</button>:undefined}/>)}</Grid>}

    {tab==="promotions"&&<div className="grid gap-4 xl:grid-cols-2"><Panel title="Promociones"><Input value={promoName} setValue={setPromoName} placeholder="Nombre"/><select className="apex-input w-full p-3" value={promoKind} onChange={e=>setPromoKind(e.target.value)}><option value="percentage">Porcentaje</option><option value="fixed">Importe fijo</option><option value="buy_x_get_y">2x1 / X por Y</option><option value="bundle">Combo</option><option value="customer_group">Grupo de clientes</option><option value="loyalty">Fidelización</option></select><Input value={promoValue} setValue={setPromoValue} placeholder="Valor" numeric/><Action label="Crear promoción" onClick={()=>void createPromotion()}/><Mini rows={promotions.map(p=>({title:p.name,subtitle:p.kind+" · "+String(p.value??0)}))}/></Panel><Panel title="Fidelización"><Input value={loyaltyName} setValue={setLoyaltyName} placeholder="Nombre del programa"/><Input value={pointsPerCurrency} setValue={setPointsPerCurrency} placeholder="Puntos por unidad monetaria" numeric/><Input value={redemptionValue} setValue={setRedemptionValue} placeholder="Valor de cada punto" numeric/><Action label="Crear regla" onClick={()=>void createLoyalty()}/><Mini rows={loyalty.map(l=>({title:l.name,subtitle:"Puntos "+l.points_per_currency+" · valor "+l.redemption_value}))}/></Panel></div>}

    {tab==="serials"&&<Grid title="Números de serie y garantía" form={<><Select value={serialProduct} onChange={setSerialProduct} options={products.map(p=>({value:p.id,label:p.name}))} placeholder="Producto"/><Input value={serialNumber} setValue={setSerialNumber} placeholder="Número de serie"/><input className="apex-input w-full p-3" type="date" value={warrantyUntil} onChange={e=>setWarrantyUntil(e.target.value)}/><Action label="Registrar unidad" onClick={()=>void addSerial()}/></>}>{serials.map(s=><Row key={s.id} title={s.serial_number} subtitle={(products.find(p=>p.id===s.product_key)?.name||s.product_key)+" · "+s.status+(s.warranty_until?" · garantía "+s.warranty_until:"")}/>)}</Grid>}
  </div>;
}

function Input({value,setValue,placeholder,numeric=false}:{value:string;setValue:(value:string)=>void;placeholder:string;numeric?:boolean}){return <input className="apex-input w-full p-3" inputMode={numeric?"decimal":undefined} placeholder={placeholder} value={value} onChange={e=>setValue(e.target.value)}/>}
function Select({value,onChange,options,placeholder}:{value:string;onChange:(value:string)=>void;options:Array<{value:string;label:string}>;placeholder:string}){return <select className="apex-input w-full p-3" value={value} onChange={e=>onChange(e.target.value)}><option value="">{placeholder}</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>}
function Action({label,onClick}:{label:string;onClick:()=>void}){return <button type="button" onClick={onClick} className="min-h-11 w-full rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white">{label}</button>}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="apex-card p-5"><h3 className="font-semibold">{title}</h3><div className="mt-4 space-y-2">{children}</div></section>}
function Grid({title,form,children}:{title:string;form:React.ReactNode;children:React.ReactNode}){return <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]"><Panel title={title}>{form}</Panel><section className="apex-card overflow-hidden"><div className="border-b border-[var(--apex-border)] p-5"><h3 className="font-semibold">{title}</h3></div><div className="divide-y divide-[var(--apex-border)]">{children}</div></section></div>}
function Row({title,subtitle,action}:{title:string;subtitle:string;action?:React.ReactNode}){return <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-1 text-[10px] text-[var(--apex-muted)]">{subtitle}</p></div>{action}</div>}
function Mini({rows}:{rows:Array<{title:string;subtitle:string}>}){return <div className="divide-y divide-[var(--apex-border)]">{rows.length?rows.map((r,i)=><div key={r.title+"-"+i} className="py-3"><p className="text-sm font-semibold">{r.title}</p><p className="mt-1 text-[10px] text-[var(--apex-muted)]">{r.subtitle}</p></div>):<p className="py-3 text-xs text-[var(--apex-muted)]">Sin registros.</p>}</div>}
