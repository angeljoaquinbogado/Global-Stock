"use client";

import { BrowserMultiFormatReader } from "@zxing/library";
import {
  Camera,
  CheckCircle2,
  Loader2,
  ScanBarcode,
  Square,
  XCircle
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Product } from "@/lib/types";

type NativeBarcode = { rawValue: string };

type NativeBarcodeDetector = {
  detect: (source: HTMLVideoElement) => Promise<NativeBarcode[]>;
};

type NativeBarcodeDetectorConstructor = {
  new (options: { formats: string[] }): NativeBarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: NativeBarcodeDetectorConstructor;
  }
}

type ScannerStatus =
  | "idle"
  | "requesting"
  | "scanning"
  | "resolved"
  | "error";

type BarcodeScannerProps = {
  onProduct?: (product: Product) => void;
};

export function BarcodeScanner({ onProduct }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const frameRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState(
    "Usá la cámara del teléfono, tablet o PC para leer UPC, EAN, QR y Code 128."
  );
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    return () => stop();
  }, []);

  async function resolveBarcode(rawValue: string) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setMessage(`Código detectado: ${rawValue}. Buscando producto…`);

    try {
      const response = await fetch(
        `/api/product-lookup?barcode=${encodeURIComponent(rawValue)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("No se encontró información para ese código.");
      }

      const payload = (await response.json()) as { product: Product };
      setProduct(payload.product);
      setStatus("resolved");
      setMessage("Producto identificado y datos cargados.");
      onProduct?.(payload.product);
      stopCameraOnly();
    } catch (reason) {
      resolvedRef.current = false;
      setStatus("error");
      setMessage(
        reason instanceof Error
          ? reason.message
          : "No se pudo procesar el código."
      );
      stopCameraOnly();
    }
  }

  async function start() {
    stopCameraOnly();
    setProduct(null);
    setStatus("requesting");
    setMessage("Solicitando acceso a la cámara…");
    resolvedRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setMessage("Este navegador no ofrece acceso a cámara mediante getUserMedia.");
      return;
    }

    try {
      if (window.BarcodeDetector) {
        await startNative();
      } else {
        await startZxing();
      }
    } catch (reason) {
      stopCameraOnly();
      setStatus("error");
      setMessage(
        reason instanceof Error
          ? reason.message
          : "No se pudo iniciar la cámara."
      );
    }
  }

  async function startNative() {
    const video = videoRef.current;
    if (!video || !window.BarcodeDetector) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    streamRef.current = stream;
    video.srcObject = stream;
    await video.play();

    const detector = new window.BarcodeDetector({
      formats: [
        "ean_13",
        "ean_8",
        "upc_a",
        "upc_e",
        "qr_code",
        "code_128",
        "code_39"
      ]
    });

    setStatus("scanning");
    setMessage("Escaneando con BarcodeDetector…");

    const tick = async () => {
      if (!videoRef.current || !streamRef.current || resolvedRef.current) return;

      try {
        const codes = await detector.detect(videoRef.current);
        if (codes[0]?.rawValue) {
          await resolveBarcode(codes[0].rawValue);
          return;
        }
      } catch {
        // A frame can fail while the camera is adapting; the next one is retried.
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
  }

  async function startZxing() {
    const video = videoRef.current;
    if (!video) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    setStatus("scanning");
    setMessage("Escaneando con motor ZXing de compatibilidad…");

    await reader.decodeFromVideoDevice(null, video, (result) => {
      const text = result?.getText();
      if (text) void resolveBarcode(text);
    });
  }

  function stopCameraOnly() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    readerRef.current?.reset();
    readerRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }

  function stop() {
    stopCameraOnly();
    resolvedRef.current = false;
    setStatus("idle");
    setMessage(
      "Usá la cámara del teléfono, tablet o PC para leer UPC, EAN, QR y Code 128."
    );
  }

  const active = status === "scanning" || status === "requesting";

  return (
    <section className="apex-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--apex-border)] p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8F0000]">
            <ScanBarcode size={15} />
            Captura universal
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
            Lector de códigos
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--apex-muted)]">
            BarcodeDetector cuando existe y ZXing como fallback automático.
          </p>
        </div>

        <button
          type="button"
          onClick={active ? stop : start}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#8F0000] px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-[#a40000]"
        >
          {status === "requesting" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : active ? (
            <Square size={15} />
          ) : (
            <Camera size={16} />
          )}
          {active ? "Detener" : "Abrir cámara"}
        </button>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
        <div className="relative aspect-video overflow-hidden rounded-[22px] border border-[var(--apex-border)] bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          {!active && status !== "resolved" && (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <ScanBarcode
                  size={42}
                  strokeWidth={1.35}
                  className="mx-auto text-white/55"
                />
                <p className="mt-3 text-xs text-white/45">
                  La vista de cámara aparecerá acá.
                </p>
              </div>
            </div>
          )}
          {active && (
            <div className="pointer-events-none absolute inset-[12%] rounded-3xl border border-white/40">
              <div className="absolute left-4 right-4 top-1/2 h-px bg-[#d92d2d] shadow-[0_0_16px_rgba(217,45,45,.85)]" />
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-bg)] p-5">
          <div className="flex items-start gap-3">
            {status === "resolved" ? (
              <CheckCircle2 className="mt-0.5 text-green-500" size={19} />
            ) : status === "error" ? (
              <XCircle className="mt-0.5 text-red-500" size={19} />
            ) : (
              <ScanBarcode className="mt-0.5 text-[#8F0000]" size={19} />
            )}
            <p className="text-sm leading-6 text-[var(--apex-muted)]">
              {message}
            </p>
          </div>

          {product && (
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Producto", product.name],
                ["Categoría", product.category],
                ["Compra", product.cost.toLocaleString("es-AR")],
                ["Venta", product.price.toLocaleString("es-AR")],
                ["Stock", String(product.stock)],
                ["Proveedor", product.supplier]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--apex-muted)]">
                    {label}
                  </dt>
                  <dd className="mt-1.5 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
