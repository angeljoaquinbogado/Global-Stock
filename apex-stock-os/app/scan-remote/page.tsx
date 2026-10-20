"use client";

import { ArrowLeft, CheckCircle2, RefreshCw, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { BarcodeCameraCapture } from "@/components/BarcodeCameraCapture";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function RemoteScannerPage() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingRef = useRef(new Map<string, { code: string; timeout: number }>());
  const recentRef = useRef({ code: "", at: 0 });
  const [expiry, setExpiry] = useState(0);
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("Preparando escáner…");
  const [manual, setManual] = useState("");
  const [count, setCount] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const pair = params.get("pair") || "";
    const until = Number(params.get("until") || "0");
    if (!/^[a-f0-9-]{36}$/i.test(pair) || !Number.isFinite(until)
      || until < Date.now() || until > Date.now() + 11 * 60 * 1000) {
      setConnected(false);
      setCanRetry(false);
      setMessage("El enlace es inválido o venció. Generá uno nuevo desde Caja Registradora.");
      return;
    }
    setToken(pair);
    setExpiry(until);
    setConnected(false);
    setCanRetry(false);
    setMessage("Buscando la caja registradora…");

    const client = getSupabaseBrowserClient();
    if (!client) {
      setCanRetry(true);
      setMessage("Servicio de escaneo no configurado. Revisá la conexión de Global Stock.");
      return;
    }
    let alive = true;
    let paired = false;
    const channel = client.channel("gs-remote-scanner-" + pair);
    channelRef.current = channel;
    channel.on("broadcast", { event: "pc-ready" }, () => {
      if (!alive || Date.now() > until) return;
      paired = true;
      setConnected(true);
      setCanRetry(false);
      setMessage("Celular vinculado a la caja. Podés escanear.");
    });
    channel.on("broadcast", { event: "scan-received" }, ({ payload }) => {
      const id = typeof payload?.id === "string" ? payload.id : "";
      if (!alive || !id) return;
      const pending = pendingRef.current.get(id);
      if (!pending) return;
      window.clearTimeout(pending.timeout);
      pendingRef.current.delete(id);
      setCount(current => current + 1);
      setMessage("Recibido por la caja: " + pending.code);
    });
    channel.subscribe(status => {
      if (!alive) return;
      if (status === "SUBSCRIBED") {
        setMessage("Servicio conectado. Esperando confirmación de la caja…");
        void channel.send({ type: "broadcast", event: "phone-ready", payload: { at: Date.now() } });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        paired = false;
        setConnected(false);
        setCanRetry(true);
        setMessage("No se pudo vincular con la caja. Revisá la conexión y tocá Reintentar.");
      }
    });

    // A one-time broadcast may be missed if the PC is still subscribing.
    // Retry the pairing hello until the PC confirms the same channel.
    const helloTimer = window.setInterval(() => {
      if (!alive || paired || Date.now() > until) return;
      void channel.send({ type: "broadcast", event: "phone-ready", payload: { at: Date.now() } });
    }, 3500);
    const timeout = window.setTimeout(() => {
      if (!alive || paired) return;
      setCanRetry(true);
      setMessage("La caja no respondió. Dejá Caja Registradora abierta y tocá Reintentar.");
    }, 15000);
    const expiryTimer = window.setInterval(() => {
      if (Date.now() > until) {
        setConnected(false);
        setCanRetry(false);
        setMessage("La conexión expiró. Generá otro enlace desde la caja.");
      }
    }, 1000);
    return () => {
      alive = false;
      window.clearInterval(helloTimer);
      window.clearTimeout(timeout);
      window.clearInterval(expiryTimer);
      channelRef.current = null;
      for (const pending of pendingRef.current.values()) window.clearTimeout(pending.timeout);
      pendingRef.current.clear();
      void client.removeChannel(channel);
    };
  }, [attempt]);

  const send = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!connected || !token || Date.now() > expiry || !code || code.length > 160) return;
    const now = Date.now();
    if (recentRef.current.code === code && now - recentRef.current.at < 1800) return;
    const channel = channelRef.current;
    if (!channel) return;
    recentRef.current = { code, at: now };
    const id = crypto.randomUUID();
    const timeout = window.setTimeout(() => {
      pendingRef.current.delete(id);
      setMessage("La caja no confirmó la lectura. Revisá la conexión e intentá de nuevo.");
      recentRef.current = { code: "", at: 0 };
    }, 6000);
    pendingRef.current.set(id, { code, timeout });
    const result = await channel.send({
      type: "broadcast", event: "barcode", payload: { code, id }
    });
    if (result === "ok") {
      setMessage("Enviado. Esperando confirmación de la caja…");
    } else {
      window.clearTimeout(timeout);
      pendingRef.current.delete(id);
      recentRef.current = { code: "", at: 0 };
      setMessage("No se pudo enviar. Revisá la conexión e intentá de nuevo.");
    }
  }, [connected, expiry, token]);

  return <main className="min-h-dvh bg-[#f7f8f9] px-4 py-8 text-[#25272c]">
    <div className="mx-auto max-w-lg space-y-5">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#086846] text-white">
          <Smartphone size={20}/>
        </span>
        <div>
          <h1 className="text-xl font-bold">Global Stock</h1>
          <p className="text-xs text-slate-500">Lector de caja remoto</p>
        </div>
      </header>
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Escanear productos</h2>
          <span className={"rounded-full px-3 py-1 text-xs font-semibold " +
            (connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
            {connected ? "Caja vinculada" : "Sin vincular"}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-500">
          Abrí este enlace desde el celular y vinculalo a Caja Registradora.
          Cuando aparezca «Caja vinculada», permití la cámara y apuntá al código de barras.
        </p>
        {connected && <BarcodeCameraCapture
          onBarcode={code => { void send(code); }} language="es"
        />}
        <form className="space-y-2" onSubmit={event => {
          event.preventDefault();
          if (!manual.trim() || !connected) return;
          void send(manual);
          setManual("");
        }}>
          <label className="block text-xs font-semibold" htmlFor="remote-code">Código manual</label>
          <div className="flex gap-2">
            <input id="remote-code" autoComplete="off" inputMode="text" value={manual}
              onChange={event => setManual(event.target.value)} placeholder="Código de barras"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm"/>
            <button type="submit" disabled={!connected || !manual.trim()}
              className="min-h-11 rounded-xl bg-[#086846] px-4 text-xs font-semibold text-white disabled:opacity-40">
              Enviar
            </button>
          </div>
        </form>
        <p role="status" className="flex items-start gap-2 text-xs leading-5 text-slate-600">
          <CheckCircle2 className="mt-0.5 shrink-0" size={16}/>{message}
        </p>
        {canRetry && Date.now() < expiry && <button
          type="button" onClick={() => setAttempt(current => current + 1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-xs font-semibold hover:bg-slate-50">
          <RefreshCw size={15}/>Reintentar conexión
        </button>}
        <p className="text-xs text-slate-500">
          Lecturas confirmadas: {count}. El celular no puede confirmar pagos.
        </p>
      </section>
      <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
        <ArrowLeft size={16}/>Volver a Global Stock
      </a>
    </div>
  </main>;
}
