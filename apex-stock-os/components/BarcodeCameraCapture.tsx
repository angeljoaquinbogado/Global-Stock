"use client";

import { BrowserMultiFormatReader } from "@zxing/library";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = { onBarcode:(code:string)=>void; language?:string; autoStart?:boolean; };

export function BarcodeCameraCapture({onBarcode, language="es", autoStart=false}:Props) {
  const video = useRef<HTMLVideoElement>(null);
  const callback = useRef(onBarcode);
  const readerRef = useRef<BrowserMultiFormatReader|null>(null);
  const last = useRef({code:"",at:0});
  const [enabled,setEnabled] = useState(autoStart);
  const [message,setMessage] = useState("");
  useEffect(()=>{callback.current=onBarcode},[onBarcode]);

  useEffect(()=>{
    if(!enabled)return;
    const element=video.current;
    if(!element)return;
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
      setMessage(language==="es"?"La cámara necesita HTTPS y permiso del navegador.":"Camera requires HTTPS and permission.");
      setEnabled(false);
      return;
    }
    let active=true;
    const reader=new BrowserMultiFormatReader();
    readerRef.current=reader;
    setMessage(language==="es"?"Apuntá al código de barras.":"Aim at a barcode.");
    void reader.decodeFromVideoDevice(null,element,(result)=>{
      if(!active||!result)return;
      const code=result.getText().trim();
      if(!code||code.length>160)return;
      const now=Date.now();
      if(last.current.code===code && now-last.current.at<1700)return;
      last.current={code,at:now};
      callback.current(code);
    }).catch((cause:unknown)=>{
      if(!active)return;
      setMessage(cause instanceof Error?cause.message:"No se pudo iniciar la cámara.");
      setEnabled(false);
    });
    return ()=>{
      active=false;
      reader.reset();
      readerRef.current=null;
      const stream=element.srcObject;
      if(stream instanceof MediaStream)stream.getTracks().forEach(track=>track.stop());
      element.srcObject=null;
    };
  },[enabled,language]);

  return <div className="space-y-2">
    <button type="button" onClick={()=>setEnabled(current=>!current)}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-xs font-semibold transition-colors hover:border-[var(--apex-accent)]">
      {enabled?<CameraOff size={16}/>:<Camera size={16}/>}
      {enabled?(language==="es"?"Detener cámara":"Stop camera"):(language==="es"?"Usar cámara":"Use camera")}
    </button>
    {enabled&&<div className="relative aspect-video overflow-hidden rounded-2xl border border-[var(--apex-border)] bg-black">
      <video ref={video} autoPlay muted playsInline className="h-full w-full object-cover"/>
      <ScanLine className="pointer-events-none absolute inset-0 m-auto text-white/70" size={42}/>
    </div>}
    {message&&<p role="status" className="text-[11px] text-[var(--apex-muted)]">{message}</p>}
  </div>;
}
