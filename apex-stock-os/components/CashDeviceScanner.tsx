"use client";

import { Check, Copy, Link2, ScanLine, Smartphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { BarcodeCameraCapture } from "./BarcodeCameraCapture";

type Props={language:string;onCode:(code:string)=>void};
type Pair={token:string;expires:number};

export function CashDeviceScanner({language,onCode}:Props){
  const listener=useRef(onCode);
  const seen=useRef(new Set<string>());
  const [pair,setPair]=useState<Pair|null>(null);
  const [pairStatus,setPairStatus]=useState("");
  const [copied,setCopied]=useState(false);
  const [cameraOpen,setCameraOpen]=useState(false);
  useEffect(()=>{listener.current=onCode},[onCode]);

  useEffect(()=>{
    if(!pair)return;
    const supabase=getSupabaseBrowserClient();
    if(!supabase){
      setPairStatus(language==="es"?"Conexión no disponible.":"Connection unavailable.");
      return;
    }
    const channel=supabase.channel("gs-remote-scanner-"+pair.token);
    channel.on("broadcast",{event:"barcode"},({payload})=>{
      const code=typeof payload?.code==="string"?payload.code.trim():"";
      const id=typeof payload?.id==="string"?payload.id:"";
      if(Date.now()>pair.expires || !code || code.length>160 || !id || id.length>90 || seen.current.has(id))return;
      seen.current.add(id);
      if(seen.current.size>120)seen.current.clear();
      listener.current(code);
    }).subscribe(status=>{
      if(status==="SUBSCRIBED")setPairStatus(language==="es"?"Conectado: esperando lecturas del celular.":"Connected: waiting for phone scans.");
      else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")setPairStatus(language==="es"?"No se pudo conectar. Revisá tu conexión.":"Connection failed.");
    });
    const timer=window.setInterval(()=>{
      if(Date.now()>pair.expires)setPair(current=>current?.token===pair.token?null:current);
    },1000);
    return ()=>{window.clearInterval(timer);void supabase.removeChannel(channel);};
  },[pair,language]);

  const url=pair&&typeof window!=="undefined"
    ?window.location.origin+"/scan-remote?pair="+encodeURIComponent(pair.token)+"&until="+pair.expires:"";
  const startPair=()=>{
    seen.current.clear();
    setPair({token:crypto.randomUUID(),expires:Date.now()+10*60*1000});
    setCopied(false);
    setPairStatus(language==="es"?"Preparando conexión…":"Connecting…");
  };
  const copy=async()=>{
    try{await navigator.clipboard.writeText(url);setCopied(true)}
    catch {setCopied(false);setPairStatus(language==="es"?"Seleccioná y copiá el enlace manualmente.":"Select and copy the link.");}
  };

  return <div className="mt-3 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-3">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={()=>setCameraOpen(current=>!current)}
        className="inline-flex h-10 min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-xs font-semibold transition-colors hover:border-[var(--apex-accent)]">
        <ScanLine size={16}/>{language==="es"?"Cámara del dispositivo":"Device camera"}
      </button>
      <button type="button" onClick={()=>pair?setPair(null):startPair()}
        className="inline-flex h-10 min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-xs font-semibold transition-colors hover:border-[var(--apex-accent)]">
        <Smartphone size={16}/>{pair?(language==="es"?"Desconectar celular":"Disconnect phone"):(language==="es"?"Conectar celular":"Connect phone")}
      </button>
    </div>
    {cameraOpen&&<div className="mt-3">
      <BarcodeCameraCapture language={language} onBarcode={onCode}/>
    </div>}
    {pair&&<div className="mt-3 space-y-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
      <p className="text-xs font-semibold">{language==="es"?"Escáner remoto temporal (10 minutos)":"Temporary remote scanner (10 minutes)"}</p>
      <p className="text-[11px] leading-relaxed text-[var(--apex-muted)]">
        {language==="es"?"Copiá este enlace y envialo a tu celular por un mensaje privado. Abrilo allí y permití la cámara. Las lecturas se agregan al ticket de esta PC, pero no confirman pagos.":"Send the private link to your phone. Scans enter this computer's receipt; payments are never confirmed remotely."}
      </p>
      <div className="flex min-w-0 gap-2">
        <input aria-label="Enlace del escáner" readOnly value={url}
          onFocus={e=>e.currentTarget.select()} className="apex-input min-h-10 min-w-0 flex-1 px-3 text-xs"/>
        <button type="button" onClick={()=>void copy()} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[var(--apex-accent)] px-3 text-xs font-semibold text-white">
          {copied?<Check size={15}/>:<Copy size={15}/>}
          {copied?(language==="es"?"Copiado":"Copied"):(language==="es"?"Copiar":"Copy")}
        </button>
      </div>
      <p role="status" className="flex items-center gap-1.5 text-[11px] text-[var(--apex-muted)]"><Link2 size={13}/>{pairStatus}</p>
      <button type="button" onClick={()=>setPair(null)} className="inline-flex items-center gap-1 text-[11px] text-[var(--apex-muted)] hover:text-[var(--apex-text)]">
        <X size={13}/>{language==="es"?"Cerrar conexión":"End connection"}
      </button>
    </div>}
    <p className="mt-2 text-[11px] text-[var(--apex-muted)]">
      {language==="es"?"También funciona con lectores USB/Bluetooth que escriben el código y envían Enter.":"USB/Bluetooth scanners that type a code and press Enter are also supported."}
    </p>
  </div>;
}
