"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight, Building2, Check, MapPin, Plus, RefreshCw, ShieldAlert,
  Warehouse
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type BusinessRow = {
  id: string; name: string; business_type: string;
  base_currency: string; locale: string; owner_user_id: string;
};
type LocationRow = {
  id: string; business_id: string; name: string;
  address: string | null; kind: string; active: boolean;
};
type StockRow = { location_id: string; product_id: string; on_hand: number; reserved: number };
type ProductRow = { id: string; client_key: string | null; name: string };
type MemberRow = { business_id: string; role: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const inputs = "apex-input min-h-11 w-full rounded-xl px-3 py-2 text-sm";
const action = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] px-3 text-xs font-semibold transition-colors hover:bg-[var(--apex-surface-strong)] disabled:opacity-40";
function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-AR",{style:"currency",currency}).format(value);
  } catch { return String(value); }
}

export function BusinessLocationsCenter({ businessId, currency }: {
  businessId: string | null; currency: string;
}) {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [levels, setLevels] = useState<StockRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reload, setReload] = useState(0);
  const [newBusiness, setNewBusiness] = useState("");
  const [editLocation, setEditLocation] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationKind, setLocationKind] = useState<"store"|"warehouse">("store");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [transferProduct, setTransferProduct] = useState("");
  const [transferDestination, setTransferDestination] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("1");
  const [incomplete, setIncomplete] = useState(false);
  const canManage = ["owner","admin"].includes(role);
  const availableLocations = locations.filter(x => x.active);

  const refresh = useCallback(async () => {
    if (!businessId || !uuid.test(businessId)) return;
    const client = getSupabaseBrowserClient();
    if (!client) { setError("Iniciá sesión para administrar negocios."); return; }
    setLoading(true);
    setError("");
    try {
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || !auth.user) throw new Error("Tu sesión venció. Volvé a entrar.");
      const { data: memberships, error: memberError } = await client
        .from("global_stock_members")
        .select("business_id,role")
        .eq("user_id",auth.user.id).eq("active",true).limit(100);
      if (memberError) throw memberError;
      const authorized = (memberships ?? []) as MemberRow[];
      const current = authorized.find(x => x.business_id === businessId);
      if (!current) throw new Error("No tenés acceso a este negocio.");
      const ids = authorized.map(x => x.business_id).filter(id => uuid.test(id));
      const [allBusinesses, branchRows, levelRows, productRows] = await Promise.all([
        client.from("global_stock_businesses")
          .select("id,name,business_type,base_currency,locale,owner_user_id")
          .in("id",ids).eq("active",true).limit(100),
        client.from("global_stock_locations")
          .select("id,business_id,name,address,kind,active")
          .eq("business_id",businessId).order("created_at",{ascending:true}).limit(200),
        client.from("global_stock_inventory_levels")
          .select("location_id,product_id,on_hand,reserved")
          .eq("business_id",businessId).limit(2001),
        client.from("global_stock_products")
          .select("id,client_key,name")
          .eq("business_id",businessId).eq("active",true).limit(2001)
      ]);
      const failure=[allBusinesses,branchRows,levelRows,productRows].find(x=>x.error)?.error;
      if (failure) throw failure;
      setBusinesses((allBusinesses.data ?? []) as BusinessRow[]);
      setLocations((branchRows.data ?? []) as LocationRow[]);
      setLevels((levelRows.data ?? []).slice(0,2000) as StockRow[]);
      setProducts((productRows.data ?? []).slice(0,2000) as ProductRow[]);
      setIncomplete((levelRows.data?.length ?? 0)>2000 ||
        (productRows.data?.length ?? 0)>2000);
      setRole(current.role);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron cargar los locales.");
    } finally { setLoading(false); }
  },[businessId]);

  useEffect(()=>{ void refresh(); },[refresh,reload]);

  async function perform(actionName:string, fn:()=>Promise<void>) {
    if(busy || !canManage)return;
    setBusy(true);setError("");setSuccess("");
    try {
      await fn();
      setSuccess(actionName);
      setReload(x=>x+1);
    } catch(reason) {
      setError(reason instanceof Error?reason.message:"No se pudo guardar el cambio.");
    } finally { setBusy(false); }
  }

  function switchBusiness(id:string) {
    if(!uuid.test(id)||!businesses.some(x=>x.id===id))return;
    if(id===businessId)return;
    window.localStorage.setItem("global-stock-active-business-id",id);
    // Rebuild the tenant-scoped workspace, caches, subscriptions and permissions.
    window.location.reload();
  }
  function addBusiness() {
    const name=newBusiness.trim();
    if(name.length<2||name.length>100){setError("Escribí un nombre de 2 a 100 caracteres.");return;}
    void perform("Nuevo negocio creado.", async ()=>{
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("Iniciá sesión.");
      const {data:auth,error:authError}=await client.auth.getUser();
      if(authError||!auth.user)throw new Error("Tu sesión venció.");
      const {data:created,error:saveError}=await client.from("global_stock_businesses")
        .insert({
          owner_user_id:auth.user.id, name, business_type:"retail",
          country:"AR",base_currency:"ARS",locale:"es-AR",
          timezone:"America/Argentina/Buenos_Aires"
        }).select("id").single();
      if(saveError)throw saveError;
      // Membership is assigned by the existing Supabase trigger.
      const {error:locError}=await client.from("global_stock_locations")
        .insert({business_id:created.id,name:"Principal",kind:"store",active:true});
      if(locError)throw locError;
      setNewBusiness("");
      window.localStorage.setItem("global-stock-active-business-id",created.id);
      window.location.reload();
    });
  }
  function saveLocation() {
    if(!businessId||!canManage)return;
    const name=locationName.trim(),address=locationAddress.trim();
    if(name.length<2||name.length>100||address.length>220) {
      setError("Revisá el nombre y la dirección (máximo 220 caracteres).");return;
    }
    void perform("Local guardado.",async()=>{
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("No hay sesión.");
      const values={name,address:address||null,kind:locationKind};
      const query=editLocation==="new"
        ?client.from("global_stock_locations").insert({...values,business_id:businessId,active:true})
        :client.from("global_stock_locations").update(values)
          .eq("business_id",businessId).eq("id",editLocation);
      const {error:saveError}=await query;
      if(saveError)throw saveError;
      setEditLocation(null);
    });
  }
  function archiveLocation(item:LocationRow) {
    if(!businessId||!canManage||availableLocations.length<2)return;
    if(!window.confirm('¿Archivar "'+item.name+'"? Se conservarán las ventas y debe quedar sin stock ni reservas.'))return;
    void perform("Local archivado (historial conservado).",async()=>{
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("No hay sesión.");
      const {error:archiveError}=await client.rpc("global_stock_archive_location",{
        target_business_id:businessId,target_location_id:item.id
      });
      if(archiveError)throw archiveError;
      setSelectedLocation(null);
    });
  }
  function transfer(source:LocationRow) {
    const qty=Number(transferQuantity);
    const product=products.find(p=>p.id===transferProduct);
    const stock=levels.find(l=>l.location_id===source.id&&l.product_id===transferProduct);
    const available=Number(stock?.on_hand??0)-Number(stock?.reserved??0);
    if(!businessId||!product?.client_key||!Number.isInteger(qty)||qty<1||qty>available||
      !locations.some(x=>x.id===transferDestination&&x.active&&x.id!==source.id)) {
      setError("Elegí un producto, otro local y una cantidad disponible.");return;
    }
    if(!window.confirm("¿Trasladar "+qty+" unidades de "+product.name+"? No cambia el stock total."))return;
    void perform("Traslado confirmado.",async()=>{
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("No hay sesión.");
      const {error:transferError}=await client.rpc("global_stock_execute_transfer",{
        target_business_id:businessId,from_location:source.id,
        to_location:transferDestination,target_product_key:product.client_key,
        transfer_quantity:qty,transfer_notes:"Traslado desde gestión web"
      });
      if(transferError)throw transferError;
      setTransferProduct("");setTransferDestination("");setTransferQuantity("1");
    });
  }

  return <section className="apex-card p-5 xl:col-span-2" aria-label="Negocios y sucursales">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold"><Building2 size={19}/>Negocios y sucursales</h3>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--apex-muted)]">
          Elegí un negocio, creá locales y consultá sus existencias. Cada negocio tiene datos separados.
        </p>
      </div>
      <button className={action} type="button" disabled={loading||busy} onClick={()=>setReload(x=>x+1)}>
        <RefreshCw size={15}/>Actualizar
      </button>
    </div>
    {error&&<p role="alert" className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
    {success&&<p role="status" className="mt-3 flex items-center gap-2 text-xs text-emerald-500"><Check size={15}/>{success}</p>}
    {loading&&<p role="status" className="mt-3 text-xs text-[var(--apex-muted)]">Actualizando sucursales…</p>}
    {incomplete&&<p className="mt-3 flex items-center gap-2 text-xs text-amber-500"><ShieldAlert size={15}/>Hay más de 2.000 registros. El resumen es parcial; los cambios de stock siguen validados en el servidor.</p>}
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map(b=><button key={b.id} type="button" disabled={busy}
        onClick={()=>switchBusiness(b.id)}
        aria-current={businessId===b.id?"true":undefined}
        className={"flex min-h-16 items-center justify-between gap-2 rounded-xl border p-3 text-left "+
          (businessId===b.id?"border-[#8F0000] bg-[#8F0000]/10":"border-[var(--apex-border)] hover:bg-[var(--apex-surface-strong)]")}>
        <span className="min-w-0"><strong className="block truncate text-sm">{b.name}</strong>
          <span className="text-[11px] text-[var(--apex-muted)]">{b.base_currency} · {b.business_type}</span></span>
        {businessId===b.id?<Check size={17} className="shrink-0 text-[#b92336]"/>:<span className="text-[11px] text-[#b92336]">Abrir</span>}
      </button>)}
    </div>
    {canManage&&<div className="mt-3 flex flex-wrap items-center gap-2">
      <input className={inputs+" max-w-xs"} maxLength={100}
        aria-label="Nombre del nuevo negocio" placeholder="Nombre de otro negocio"
        value={newBusiness} onChange={e=>setNewBusiness(e.target.value)}/>
      <button type="button" className={action} disabled={busy} onClick={addBusiness}>
        <Plus size={15}/>Crear negocio
      </button>
    </div>}
    <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold"><MapPin size={16}/>Locales y depósitos · {availableLocations.length}</h4>
      {canManage&&<button type="button" className={action}
        onClick={()=>{setEditLocation("new");setLocationName("");setLocationAddress("");setLocationKind("store");}}>
        <Plus size={15}/>Agregar local
      </button>}
    </div>
    {canManage&&editLocation&&<div className="mt-3 grid gap-3 rounded-2xl border border-[var(--apex-border)] p-4 sm:grid-cols-2">
      <label className="text-xs">Nombre<input className={inputs+" mt-1"} maxLength={100}
        value={locationName} onChange={e=>setLocationName(e.target.value)}/></label>
      <label className="text-xs">Dirección<input className={inputs+" mt-1"} maxLength={220}
        value={locationAddress} onChange={e=>setLocationAddress(e.target.value)}/></label>
      <label className="text-xs">Tipo<select className={inputs+" mt-1"} value={locationKind}
        onChange={e=>setLocationKind(e.target.value as "store"|"warehouse")}>
        <option value="store">Local</option><option value="warehouse">Depósito</option>
      </select></label>
      <div className="flex flex-wrap items-end gap-2">
        <button className={action} type="button" disabled={busy} onClick={saveLocation}>Guardar local</button>
        <button className={action} type="button" disabled={busy} onClick={()=>setEditLocation(null)}>Cancelar</button>
      </div>
    </div>}
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      {availableLocations.map(loc=>{
        const stocks=levels.filter(x=>x.location_id===loc.id);
        const qty=stocks.reduce((sum,x)=>sum+Number(x.on_hand||0),0);
        const reserved=stocks.reduce((sum,x)=>sum+Number(x.reserved||0),0);
        const selected=selectedLocation===loc.id;
        return <article key={loc.id} className="rounded-2xl border border-[var(--apex-border)] p-4">
          <div className="flex items-start justify-between gap-2">
            <button type="button" className="min-w-0 flex-1 text-left"
              aria-expanded={selected}
              onClick={()=>setSelectedLocation(selected?null:loc.id)}>
              <strong className="block truncate text-sm">{loc.name}</strong>
              <span className="mt-1 block text-xs text-[var(--apex-muted)]">{loc.address||"Sin dirección"}</span>
              <span className="mt-1 block text-xs text-[var(--apex-muted)]">{qty.toLocaleString("es-AR")} unidades · {reserved.toLocaleString("es-AR")} reservadas</span>
            </button>
            {loc.kind==="warehouse"?<Warehouse size={19} className="text-[#8F0000]"/>:<MapPin size={19} className="text-[#8F0000]"/>}
          </div>
          {canManage&&<div className="mt-3 flex flex-wrap gap-2">
            <button className={action} type="button" onClick={()=>{setEditLocation(loc.id);setLocationName(loc.name);setLocationAddress(loc.address||"");setLocationKind(loc.kind==="warehouse"?"warehouse":"store");}}>Editar</button>
            {availableLocations.length>1&&<button className={action} type="button" disabled={busy}
              onClick={()=>archiveLocation(loc)}>Archivar</button>}
          </div>}
          {selected&&<div className="mt-4 space-y-3 border-t border-[var(--apex-border)] pt-3">
            {stocks.slice(0,30).map(level=>{
              const p=products.find(x=>x.id===level.product_id);
              return <div className="flex items-center justify-between gap-3 text-xs" key={level.product_id}>
                <span className="min-w-0 truncate">{p?.name||"Producto"}</span>
                <span className="shrink-0 text-[var(--apex-muted)]">{Number(level.on_hand).toLocaleString("es-AR")}</span>
              </div>;
            })}
            {stocks.length===0&&<p className="text-xs text-[var(--apex-muted)]">Sin existencias asignadas.</p>}
            {stocks.length>30&&<p className="text-xs text-[var(--apex-muted)]">Mostrando los primeros 30 productos.</p>}
            {canManage&&availableLocations.length>1&&!incomplete&&
              <div className="space-y-2 rounded-xl bg-[var(--apex-surface-strong)] p-3">
                <p className="flex items-center gap-2 text-xs font-semibold"><ArrowLeftRight size={15}/>Trasladar stock</p>
                <select className={inputs} aria-label="Producto a trasladar" value={transferProduct}
                  onChange={e=>setTransferProduct(e.target.value)}>
                  <option value="">Elegí un producto</option>
                  {stocks.filter(s=>Number(s.on_hand)>Number(s.reserved)).map(stock=>{
                    const p=products.find(x=>x.id===stock.product_id);
                    return p?.client_key?<option key={stock.product_id} value={stock.product_id}>
                      {p.name} · {Number(stock.on_hand)-Number(stock.reserved)} disponible
                    </option>:null;
                  })}
                </select>
                <select className={inputs} aria-label="Local de destino" value={transferDestination}
                  onChange={e=>setTransferDestination(e.target.value)}>
                  <option value="">Local de destino</option>
                  {availableLocations.filter(x=>x.id!==loc.id).map(x=>
                    <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                <input className={inputs} type="number" min="1" step="1" max="99999999"
                  aria-label="Cantidad a trasladar" value={transferQuantity}
                  onChange={e=>setTransferQuantity(e.target.value)}/>
                <button type="button" className={action} disabled={busy}
                  onClick={()=>transfer(loc)}>Confirmar traslado</button>
              </div>}
          </div>}
        </article>;
      })}
    </div>
    <p className="mt-4 text-[11px] leading-5 text-[var(--apex-muted)]">
      El historial se conserva al archivar un local. Las transferencias y los cambios
      se validan en Supabase y no mezclan los inventarios de otros negocios.
      Moneda de este negocio: {currency}. {money(0,currency)}
    </p>
  </section>;
}
