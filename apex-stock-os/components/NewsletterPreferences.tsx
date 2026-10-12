"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Mail, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function NewsletterPreferences() {
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [subscribed,setSubscribed]=useState(false);
  const [email,setEmail]=useState("");
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");

  useEffect(()=>{
    let live=true;
    void (async()=>{
      const client=getSupabaseBrowserClient();
      if(!client)return;
      const {data:auth,error:authError}=await client.auth.getUser();
      if(authError||!auth.user?.email)throw new Error("No pudimos comprobar tu correo.");
      const {data,error:readError}=await client.from("global_stock_newsletter_preferences")
        .select("subscribed").eq("user_id",auth.user.id).maybeSingle();
      if(readError)throw readError;
      if(live){setEmail(auth.user.email);setSubscribed(data?.subscribed===true);}
    })().catch(reason=>{if(live)setError(reason instanceof Error?reason.message:"No pudimos cargar la preferencia.");})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[]);

  async function change(next:boolean){
    if(saving||loading)return;
    setSaving(true);setError("");setSuccess("");
    try{
      const client=getSupabaseBrowserClient();
      if(!client)throw new Error("Ingresá a tu cuenta.");
      const {data:auth,error:authError}=await client.auth.getUser();
      if(authError||!auth.user?.email)throw new Error("No pudimos verificar tu correo.");
      const now=new Date().toISOString();
      const {error:saveError}=await client.from("global_stock_newsletter_preferences")
        .upsert({
          user_id:auth.user.id,email:auth.user.email.toLowerCase(),subscribed:next,
          consented_at:next?now:null,unsubscribed_at:next?null:now,updated_at:now
        },{onConflict:"user_id"});
      if(saveError)throw saveError;
      setSubscribed(next);setEmail(auth.user.email);
      setSuccess(next?"Guardamos tu suscripción voluntaria. Todavía no empezamos los envíos.":"Cancelaste tu suscripción. La baja es gratuita.");
    }catch(reason){setError(reason instanceof Error?reason.message:"No pudimos guardar tu preferencia.");}
    finally{setSaving(false);}
  }
  return <section className="apex-card p-5 xl:col-span-2" aria-label="Novedades por correo">
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8F0000]/10 text-[#B31E30]"><BellRing size={19}/></span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">Novedades de Global Stock · gratis</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--apex-muted)]">
          Correos ocasionales sobre funciones nuevas, cambios importantes y consejos de uso.
          Sin publicidad de terceros. Es opcional y podés darte de baja cuando quieras.
        </p>
      </div>
    </div>
    {loading?<p role="status" className="mt-4 text-xs text-[var(--apex-muted)]">Comprobando tu preferencia…</p>:(
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4">
        <div className="flex min-w-0 items-center gap-2">
          <Mail size={15} className="shrink-0 text-[var(--apex-muted)]"/>
          <span className="min-w-0 break-all text-xs">{email || "Correo de tu cuenta"}</span>
        </div>
        <button type="button" disabled={saving||!email}
          onClick={()=>void change(!subscribed)}
          aria-pressed={subscribed}
          className={"min-h-10 rounded-xl px-4 text-xs font-bold disabled:opacity-40 "+
            (subscribed?"border border-[var(--apex-border)] text-[var(--apex-text)]":"bg-[#8F0000] text-white")}>
          {saving?"Guardando…":subscribed?"Darme de baja":"Quiero recibir novedades"}
        </button>
      </div>
    )}
    {error&&<p role="alert" className="mt-3 flex gap-2 text-xs text-red-500"><XCircle size={14}/>{error}</p>}
    {success&&<p role="status" className="mt-3 flex gap-2 text-xs text-emerald-500"><CheckCircle2 size={14}/>{success}</p>}
    <p className="mt-3 text-[11px] leading-5 text-[var(--apex-muted)]">
      El sistema de envío de boletines aún no está habilitado; esta elección queda guardada
      y no se enviará ningún correo promocional hasta configurar un remitente verificado.
      Cuando esté disponible, cada mensaje tendrá un enlace gratuito de baja.
      Consultá la <a href="/legal/privacy" className="underline">Política de privacidad</a>.
    </p>
  </section>;
}
