"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, RefreshCw, Trash2, Unplug } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Request = { id:string; provider:string; display_name:string|null; store_url:string|null; status:string; created_at:string };
type Account = { id:string; provider:string; display_name:string|null; status:string; last_synced_at:string|null };
const btn="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] px-3 text-xs font-semibold hover:bg-[var(--apex-surface-strong)] disabled:opacity-40";
const input="apex-input min-h-11 w-full rounded-xl px-3 py-2 text-xs";
const providers:Record<string,string>={mercadolibre:"Mercado Libre",shopify:"Shopify",tiendanube:"Tiendanube",woocommerce:"WooCommerce",custom:"Sitio propio",other:"Otra plataforma"};

function normalizePublicUrl(raw:string) {
  if (!raw.trim()) return null;
  const url=new URL(raw.trim());
  if(url.protocol!=="https:") throw new Error("La URL debe comenzar con https://.");
  if(url.username||url.password||url.port) throw new Error("No ingreses credenciales ni puertos en la URL.");
  const host=url.hostname.toLowerCase();
  if(host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||
      host.endsWith(".internal")||host.endsWith(".invalid")||host.endsWith(".test")||
      /^[0-9.]+$/.test(host)||host.includes(":")||host.length>253)
    throw new Error("Ingresá el dominio público de la tienda.");
  return url.origin;
}
export function OnlineConnectionRequests({businessId}:{businessId:string}) {
  const [requests,setRequests]=useState<Request[]>([]);
  const [accounts,setAccounts]=useState<Account[]>([]);
  const [canEdit,setCanEdit]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [editing,setEditing]=useState<string|null>(null);
  const [editName,setEditName]=useState("");
  const [editUrl,setEditUrl]=useState("");
  const [version,setVersion]=useState(0);

  const reload=useCallback(async()=>{
    const client=getSupabaseBrowserClient();
    if(!client)throw new Error("Iniciá sesión para administrar las conexiones.");
    const {data:auth,error:authError}=await client.auth.getUser();
    if(authError||!auth.user)throw new Error("Tu sesión venció.");
    const [role,req,acc]=await Promise.all([
      client.from("global_stock_members").select("role")
        .eq("business_id",businessId).eq("user_id",auth.user.id).eq("active",true).maybeSingle(),
      client.from("global_stock_integration_requests")
        .select("id,provider,display_name,store_url,status,created_at")
        .eq("business_id",businessId).order("created_at",{ascending:false}).limit(50),
      client.from("global_stock_integration_accounts")
        .select("id,provider,display_name,status,last_synced_at")
        .eq("business_id",businessId).limit(50)
    ]);
    if(role.error||req.error||acc.error)throw (role.error||req.error||acc.error);
    const granted=role.data?.role==="owner"||role.data?.role==="admin";
    setCanEdit(granted);
    setRequests((req.data??[]) as Request[]);
    setAccounts((acc.data??[]) as Account[]);
  },[businessId]);

  useEffect(()=>{
    let live=true;
    setLoading(true);
    void reload().catch(e=>{if(live)setError(e instanceof Error?e.message:"No pudimos consultar las conexiones.");})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[reload,version]);

  async function modify(actionName:string,fn:()=>Promise<void>) {
    if(busy||!canEdit)return;
    setBusy(true);setError("");setSuccess("");
    try { await fn();setSuccess(actionName);setEditing(null);setVersion(x=>x+1); }
    catch(e) { setError(e instanceof Error?e.message:"No pudimos guardar el cambio."); }
    finally { setBusy(false); }
  }
  function beginEdit(req:Request) {
    setEditing(req.id);setEditName(req.display_name||providers[req.provider]||req.provider);
    setEditUrl(req.store_url||"");setError("");
  }
  function saveRequest(req:Request) {
    if(!canEdit)return;
    void modify("Solicitud actualizada.",async()=>{
      if(editName.trim().length<2||editName.trim().length>120)
        throw new Error("Elegí un nombre de 2 a 120 caracteres.");
      const storeUrl=normalizePublicUrl(editUrl);
      if(!storeUrl&&["custom","other"].includes(req.provider))throw new Error("Ingresá la URL pública de tu tienda.");
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("Iniciá sesión.");
      const {error:rpcError}=await client.rpc("global_stock_manage_integration_request",{
        target_business_id:businessId,target_request_id:req.id,
        action:"edit",new_display_name:editName.trim(),new_store_url:storeUrl
      });
      if(rpcError)throw rpcError;
    });
  }
  function removeRequest(req:Request) {
    if(!canEdit||!window.confirm("¿Eliminar la solicitud pendiente? No borra productos ni pedidos."))return;
    void modify("Solicitud eliminada.",async()=>{
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("Iniciá sesión.");
      const {error:rpcError}=await client.rpc("global_stock_manage_integration_request",{
        target_business_id:businessId,target_request_id:req.id,action:"delete"
      });
      if(rpcError)throw rpcError;
    });
  }
  function disconnect(account:Account) {
    if(!canEdit||!window.confirm("¿Desconectar "+(providers[account.provider]||account.provider)+"? Se revocan credenciales de Global Stock; revocá también la autorización desde la plataforma."))return;
    void modify("Conexión de Global Stock desconectada.",async()=>{
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("Iniciá sesión.");
      const {error:rpcError}=await client.rpc("global_stock_disconnect_integration",{
        target_business_id:businessId,target_provider:account.provider
      });
      if(rpcError)throw rpcError;
    });
  }
  function renameAccount(acc:Account) {
    if(!canEdit)return;
    void modify("Nombre de la conexión actualizado.",async()=>{
      const name=editName.trim();
      if(name.length<2||name.length>120)throw new Error("Ingresá un nombre válido.");
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("Iniciá sesión.");
      const {data,error:updateError}=await client.from("global_stock_integration_accounts")
        .update({display_name:name}).eq("business_id",businessId).eq("id",acc.id)
        .select("id");
      if(updateError)throw updateError;
      if(!data?.length)throw new Error("No tenés permiso para editar esta conexión.");
    });
  }

  return <section className="apex-card p-5 sm:p-6" aria-label="Administrar conexiones online">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-base font-semibold">Administrar conexiones</h3>
        <p className="mt-1 text-xs text-[var(--apex-muted)]">Editá una URL equivocada o desconectá una tienda. El inventario y las ventas se conservan.</p>
      </div>
      <button type="button" className={btn} disabled={busy||loading} onClick={()=>setVersion(x=>x+1)}>
        <RefreshCw size={15}/>Actualizar
      </button>
    </div>
    {loading&&<p role="status" className="mt-3 text-xs text-[var(--apex-muted)]">Cargando conexiones…</p>}
    {error&&<p role="alert" className="mt-3 rounded-xl border border-red-500/25 p-3 text-xs text-red-500">{error}</p>}
    {success&&<p role="status" className="mt-3 flex items-center gap-2 text-xs text-emerald-600"><Check size={15}/>{success}</p>}
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {accounts.map(acc=><div key={acc.id} className="rounded-xl border border-[var(--apex-border)] p-3">
        <p className="text-sm font-semibold">{acc.display_name||providers[acc.provider]||acc.provider}</p>
        <p className="mt-1 text-xs text-[var(--apex-muted)]">{providers[acc.provider]||acc.provider} · {acc.status}</p>
        {canEdit&&<div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={()=>{setEditing("account:"+acc.id);setEditName(acc.display_name||providers[acc.provider]||acc.provider);}}><Pencil size={14}/>Renombrar</button>
          <button type="button" className={btn} disabled={busy} onClick={()=>disconnect(acc)}><Unplug size={14}/>Desconectar</button>
        </div>}
        {editing==="account:"+acc.id&&canEdit&&<div className="mt-3 flex flex-wrap gap-2">
          <input className={input} maxLength={120} aria-label="Nombre de la conexión" value={editName}
            onChange={e=>setEditName(e.target.value)}/>
          <button className={btn} type="button" disabled={busy} onClick={()=>renameAccount(acc)}>Guardar</button>
          <button className={btn} type="button" onClick={()=>setEditing(null)}>Cancelar</button>
        </div>}
      </div>)}
      {requests.map(req=><div key={req.id} className="rounded-xl border border-[var(--apex-border)] p-3">
        <p className="text-sm font-semibold">{req.display_name||providers[req.provider]||req.provider}</p>
        <p className="mt-1 text-xs text-[var(--apex-muted)]">{req.store_url||"Sin URL"} · {req.status}</p>
        {canEdit&&<div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={()=>beginEdit(req)}><Pencil size={14}/>Editar</button>
          <button type="button" className={btn} disabled={busy} onClick={()=>removeRequest(req)}><Trash2 size={14}/>Eliminar solicitud</button>
        </div>}
        {editing===req.id&&canEdit&&<div className="mt-3 space-y-2">
          <input className={input} value={editName} onChange={e=>setEditName(e.target.value)} maxLength={120} aria-label="Nombre de la solicitud"/>
          <input className={input} value={editUrl} onChange={e=>setEditUrl(e.target.value)} maxLength={300} aria-label="URL de la tienda" placeholder="https://mitienda.com"/>
          <div className="flex gap-2"><button className={btn} type="button" disabled={busy} onClick={()=>saveRequest(req)}>Guardar</button>
          <button className={btn} type="button" onClick={()=>setEditing(null)}>Cancelar</button></div>
        </div>}
      </div>)}
    </div>
    {!loading&&!accounts.length&&!requests.length&&<p className="mt-4 text-xs text-[var(--apex-muted)]">No hay conexiones ni solicitudes guardadas para este negocio.</p>}
    {!canEdit&&!loading&&<p className="mt-3 text-xs text-[var(--apex-muted)]">Solo propietarios o administradores pueden modificar conexiones.</p>}
  </section>;
}
