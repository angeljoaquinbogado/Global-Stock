"use client";

import { ArrowLeft, CheckCircle2, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { BarcodeCameraCapture } from "@/components/BarcodeCameraCapture";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function RemoteScannerPage(){
  const channelRef=useRef<RealtimeChannel|null>(null);
  const [expiry,setExpiry]=useState(0);
  const [token,setToken]=useState("");
  const [connected,setConnected]=useState(false);
  const [message,setMessage]=useState("Preparando escáner…");
  const [manual,setManual]=useState("");
  const [count,setCount]=useState(0);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.hash.slice(1));
    const pair=params.get("pair")||"";
    const until=Number(params.get("until")||"0");
    if(!/^[a-f0-9-]{36}$/i.test(pair)||!Number.isFinite(until)||until<Date.now()||until>Date.now()+11*60*1000){
      setMessage("El enlace es inválido o venció. Generá uno nuevo desde Caja Registradora.");return;
    }
    setToken(pair);setExpiry(until);
    const client=getSupabaseBrowserClient();
    if(!client){setMessage("No se pudo conectar al servicio de escaneo.");return;}
    const channel=client.channel("gs-remote-scanner-"+pair);
    channelRef.current=channel;
    channel.subscribe(status=>{
      if(status==="SUBSCRIBED"){setConnected(true);setMessage("Conectado. Los códigos se enviarán a la caja.");}
      if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){setConnected(false);setMessage("Conexión interrumpida. Revisá la red.");}
    });
    const timer=window.setInterval(()=>{
      if(Date.now()>until){setConnected(false);setMessage("La conexión expiró. Generá otra desde la caja.");}
    },1000);
    return()=>{window.clearInterval(timer);channelRef.current=null;void client.removeChannel(channel);};
  },[]);

  const send=useCallback(async(raw:string)=>{
    const code=raw.trim();
    if(!connected||!token||Date.now()>expiry||!code||code.length>160)return;
    const channel=channelRef.current;
    if(!channel)return;
    const result=await channel.send({
      type:"broadcast",event:"barcode",payload:{code,id:crypto.randomUUID()}
    });
    if(result==="ok"){setCount(n=>n+1);setMessage("Enviado a la caja: "+code);}
    else setMessage("No se pudo enviar. Revisá la conexión e intentá de nuevo.");
  },[connected,expiry,token]);

  return <main className="min-h-dvh bg-[#f7f8f9] px-4 py-8 text-[#25272c]">
    <div className="mx-auto max-w-lg space-y-5">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8f0000] text-white"><Smartphone size={20}/></span>
        <div><h1 className="text-xl font-bold">Global Stock</h1>
          <p className="text-xs text-slate-500">Lector de caja remoto</p></div>
      </header>
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Escanear productos</h2>
          <span className={"rounded-full px-3 py-1 text-xs font-semibold "+(connected?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>
            {connected?"Conectado":"Sin conexión"}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-500">
          Apuntá la cámara al código de barras. Cada lectura llega al ticket de la computadora vinculada.
        </p>
        <BarcodeCameraCapture onBarcode={(code)=>{void send(code)}} language="es"/>
        <form className="space-y-2" onSubmit={e=>{e.preventDefault();void send(manual);setManual("");}}>
          <label className="block text-xs font-semibold" htmlFor="remote-code">Código manual</label>
          <div className="flex gap-2">
            <input id="remote-code" autoComplete="off" inputMode="text" value={manual}
              onChange={e=>setManual(e.target.value)} placeholder="Código de barras"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm"/>
            <button type="submit" disabled={!connected||!manual.trim()} className="min-h-11 rounded-xl bg-[#8f0000] px-4 text-xs font-semibold text-white disabled:opacity-40">Enviar</button>
          </div>
        </form>
        <p role="status" className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 size={16}/>{message}</p>
        <p className="text-xs text-slate-500">Lecturas enviadas: {count}. El celular no puede confirmar pagos.</p>
      </section>
      <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={16}/>Volver a Global Stock</a>
    </div>
  </main>;
}
