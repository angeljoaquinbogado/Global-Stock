"use client";

import { Check, Copy, Link2, RefreshCw, ScanLine, Share2, Smartphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { BarcodeCameraCapture } from "./BarcodeCameraCapture";

type Props = { language: string; onCode: (code: string) => void };
type Pair = { token: string; expires: number };
type PairPhase = "connecting" | "waiting" | "paired" | "error";

export function CashDeviceScanner({ language, onCode }: Props) {
  const listener = useRef(onCode);
  const seen = useRef(new Set<string>());
  const [pair, setPair] = useState<Pair | null>(null);
  const [phase, setPhase] = useState<PairPhase>("connecting");
  const [pairStatus, setPairStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  useEffect(() => { listener.current = onCode; }, [onCode]);

  useEffect(() => {
    if (!pair) return;
    let alive = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPhase("error");
      setPairStatus(language === "es"
        ? "El servicio de conexión no está configurado."
        : "The connection service is not configured.");
      return;
    }
    const channel = supabase.channel("gs-remote-scanner-" + pair.token);
    channel.on("broadcast", { event: "phone-ready" }, () => {
      if (!alive || Date.now() > pair.expires) return;
      setPhase("paired");
      setPairStatus(language === "es"
        ? "Celular vinculado. Escaneá desde el teléfono."
        : "Phone paired. Scan from your phone.");
      // Confirm actual PC presence: merely joining Realtime does not mean
      // the phone and the register have found each other.
      void channel.send({ type: "broadcast", event: "pc-ready", payload: { at: Date.now() } });
    });
    channel.on("broadcast", { event: "barcode" }, ({ payload }) => {
      const code = typeof payload?.code === "string" ? payload.code.trim() : "";
      const id = typeof payload?.id === "string" ? payload.id : "";
      if (!alive || Date.now() > pair.expires || !code || code.length > 160
        || !id || id.length > 90 || seen.current.has(id)) return;
      seen.current.add(id);
      if (seen.current.size > 120) seen.current.clear();
      listener.current(code);
      // An explicit receipt tells the phone that the PC actually got the
      // barcode, rather than trusting channel.send("ok") as delivery proof.
      void channel.send({ type: "broadcast", event: "scan-received", payload: { id } });
    });
    channel.subscribe(status => {
      if (!alive) return;
      if (status === "SUBSCRIBED") {
        setPhase(current => current === "paired" ? current : "waiting");
        setPairStatus(language === "es"
          ? "Conexión lista. Abrí el enlace en tu celular para vincularlo."
          : "Connection ready. Open the link on your phone to pair.");
        void channel.send({ type: "broadcast", event: "pc-ready", payload: { at: Date.now() } });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        setPhase("error");
        setPairStatus(language === "es"
          ? "Sin conexión en tiempo real. Reintentá o revisá el servicio Supabase."
          : "Realtime unavailable. Retry or check the Supabase service.");
      }
    });

    const waitingTimer = window.setTimeout(() => {
      if (!alive) return;
      setPhase(current => {
        if (current !== "connecting") return current;
        setPairStatus(language === "es"
          ? "La conexión tardó demasiado. Tocá Reintentar."
          : "The connection timed out. Choose Retry.");
        return "error";
      });
    }, 15000);
    const expiryTimer = window.setInterval(() => {
      if (Date.now() > pair.expires) setPair(current => current?.token === pair.token ? null : current);
    }, 1000);
    return () => {
      alive = false;
      window.clearTimeout(waitingTimer);
      window.clearInterval(expiryTimer);
      void supabase.removeChannel(channel);
    };
  }, [pair, language]);

  const url = pair && typeof window !== "undefined"
    ? window.location.origin + "/scan-remote#pair=" + encodeURIComponent(pair.token)
      + "&until=" + pair.expires
    : "";

  function startPair() {
    seen.current.clear();
    setPair({ token: crypto.randomUUID(), expires: Date.now() + 10 * 60 * 1000 });
    setCopied(false);
    setPhase("connecting");
    setPairStatus(language === "es" ? "Conectando con el servicio…" : "Connecting to service…");
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
      setPairStatus(language === "es"
        ? "Seleccioná y copiá el enlace manualmente."
        : "Select and copy the link manually.");
    }
  }
  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Global Stock · Escáner de caja",
          text: language === "es" ? "Abrí este enlace desde tu celular para escanear." : "Open this link on your phone to scan.",
          url
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  return <div className="mt-3 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-bg)] p-3">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setCameraOpen(current => !current)}
        className="inline-flex h-10 min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-xs font-semibold transition-colors hover:border-[var(--apex-accent)]">
        <ScanLine size={16} />{language === "es" ? "Cámara del dispositivo" : "Device camera"}
      </button>
      <button type="button" onClick={() => pair ? setPair(null) : startPair()}
        className="inline-flex h-10 min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-3 text-xs font-semibold transition-colors hover:border-[var(--apex-accent)]">
        <Smartphone size={16} />{pair ? (language === "es" ? "Desconectar celular" : "Disconnect phone")
          : (language === "es" ? "Conectar celular" : "Connect phone")}
      </button>
    </div>
    {cameraOpen && <div className="mt-3">
      <BarcodeCameraCapture language={language} onBarcode={onCode} autoStart />
    </div>}
    {pair && <div className="mt-3 space-y-3 rounded-xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold">
          {language === "es" ? "Lector remoto · enlace temporal (10 minutos)" : "Remote scanner · temporary link (10 minutes)"}
        </p>
        <span role="status" className={"rounded-full px-2.5 py-1 text-[10px] font-semibold " + (
          phase === "paired" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" :
          phase === "error" ? "bg-red-500/10 text-red-600 dark:text-red-300" :
          "bg-[var(--apex-bg)] text-[var(--apex-muted)]"
        )}>
          {phase === "paired" ? (language === "es" ? "Celular vinculado" : "Phone paired") :
            phase === "waiting" ? (language === "es" ? "Esperando celular" : "Waiting for phone") :
            phase === "error" ? (language === "es" ? "Error de conexión" : "Connection issue") :
            (language === "es" ? "Conectando…" : "Connecting…")}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-[var(--apex-muted)]">
        {language === "es"
          ? "1. Enviá este enlace a tu celular. 2. Abrilo en el navegador y permití la cámara. 3. Escaneá: el código aparecerá en esta caja. No hace falta cable ni Bluetooth."
          : "1. Send the link to your phone. 2. Open it and allow camera access. 3. Scan: the barcode appears on this register. No cable or Bluetooth needed."}
      </p>
      <div className="flex min-w-0 flex-wrap gap-2">
        <input aria-label="Enlace del escáner" readOnly value={url}
          onFocus={event => event.currentTarget.select()}
          className="apex-input min-h-10 min-w-[160px] flex-[1_1_200px] px-3 text-xs"/>
        <button type="button" onClick={() => void copyLink()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[var(--apex-accent)] px-3 text-xs font-semibold text-white">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? (language === "es" ? "Copiado" : "Copied") : (language === "es" ? "Copiar" : "Copy")}
        </button>
        <button type="button" onClick={() => void shareLink()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--apex-border)] px-3 text-xs font-semibold hover:bg-[var(--apex-bg)]">
          <Share2 size={15}/>{language === "es" ? "Compartir" : "Share"}
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="flex items-center gap-1.5 text-[11px] text-[var(--apex-muted)]">
          <Link2 size={13}/>{pairStatus}
        </p>
        {phase === "error" && <button type="button" onClick={startPair}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--apex-border)] px-3 text-[11px] font-semibold hover:bg-[var(--apex-bg)]">
          <RefreshCw size={13}/>{language === "es" ? "Reintentar" : "Retry"}
        </button>}
      </div>
      <button type="button" onClick={() => setPair(null)}
        className="inline-flex items-center gap-1 text-[11px] text-[var(--apex-muted)] hover:text-[var(--apex-text)]">
        <X size={13}/>{language === "es" ? "Cerrar conexión" : "End connection"}
      </button>
    </div>}
    <p className="mt-2 text-[11px] text-[var(--apex-muted)]">
      {language === "es"
        ? "También podés conectar una pistola lectora de códigos USB o Bluetooth en modo teclado: escribe el código y envía Enter. Usar el celular como dispositivo USB/Bluetooth requiere una app HID compatible."
        : "USB/Bluetooth barcode readers in keyboard mode are supported: they type the code and press Enter. Using a phone as a USB/Bluetooth reader needs an HID-compatible app."}
    </p>
  </div>;
}
