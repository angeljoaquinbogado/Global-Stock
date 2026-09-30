"use client";

import { BrowserMultiFormatReader } from "@zxing/library";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Keyboard,
  Loader2,
  ScanBarcode,
  Search,
  ShieldAlert,
  Square,
  XCircle
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import type { Product } from "@/lib/types";

type NativeBarcode = { rawValue: string };

type NativeBarcodeDetector = {
  detect: (source: HTMLVideoElement) => Promise<NativeBarcode[]>;
};

type NativeBarcodeDetectorConstructor = {
  new (options: { formats: string[] }): NativeBarcodeDetector;
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

type ScannerLanguage = "es" | "en" | "pt" | "fr" | "de";

type BarcodeScannerProps = {
  onProduct?: (product: Product) => void;
  language?: ScannerLanguage;
};

const scannerCopy: Record<ScannerLanguage, {
  idle: string;
  detected: (code: string) => string;
  missing: string;
  loaded: string;
  secureRequired: string;
  noCamera: string;
  requesting: string;
  aim: string;
  imageAnalyzing: string;
  imageFail: string;
  title: string;
  eyebrow: string;
  description: string;
  localNotice: string;
  live: string;
  stop: string;
  photo: string;
  previewSecure: string;
  previewInsecure: string;
  manual: string;
  manualPlaceholder: string;
  search: string;
  product: string;
  category: string;
  cost: string;
  price: string;
  stock: string;
  supplier: string;
}> = {
  es: {
    idle: "Escaneá en vivo, tomá una foto o ingresá el código manualmente.",
    detected: (code) => `Código detectado: ${code}. Buscando producto…`,
    missing: "El código se leyó correctamente, pero todavía no existe en el catálogo.",
    loaded: "Producto identificado y cargado.",
    secureRequired: "La cámara en vivo necesita HTTPS. En esta prueba local usá “{copy.photo}” o ingresá el código manualmente.",
    noCamera: "Este navegador no expone acceso a cámara en vivo.",
    requesting: "Solicitando permiso para usar la cámara…",
    aim: "Apuntá el código dentro del marco.",
    imageAnalyzing: "Analizando la imagen…",
    imageFail: "No pude detectar un código en esa imagen. Acercate más y asegurate de que esté nítido.",
    title: "{copy.title}",
    eyebrow: "{copy.eyebrow}",
    description: "{copy.description}",
    localNotice: "En tu dirección local HTTP el navegador bloquea la cámara en vivo. La foto sí funciona. En Vercel HTTPS se habilita el escaneo en vivo.",
    live: "Cámara en vivo",
    stop: "Detener",
    photo: "Tomar foto",
    previewSecure: "Abrí la cámara y apuntá al código.",
    previewInsecure: "En esta prueba local usá “Tomar foto”. La cámara en vivo se habilita con HTTPS.",
    manual: "{copy.manual}",
    manualPlaceholder: "EAN / UPC / código",
    search: "Buscar código",
    product: "Producto",
    category: "Categoría",
    cost: "Compra",
    price: "Venta",
    stock: "Stock",
    supplier: "Proveedor"
  },
  en: {
    idle: "Scan live, take a photo or enter the code manually.",
    detected: (code) => `Code detected: ${code}. Looking up product…`,
    missing: "The code was read correctly, but it is not in the catalog yet.",
    loaded: "Product identified and loaded.",
    secureRequired: "Live camera needs HTTPS. In this local test use “Take photo” or enter the code manually.",
    noCamera: "This browser does not expose live camera access.",
    requesting: "Requesting camera permission…",
    aim: "Place the code inside the frame.",
    imageAnalyzing: "Analyzing image…",
    imageFail: "I could not detect a code in that image. Move closer and make sure it is sharp.",
    title: "Barcode scanner",
    eyebrow: "Universal capture",
    description: "Live camera on HTTPS, photo fallback and manual lookup.",
    localNotice: "Your local HTTP address blocks live camera access. Photo capture still works. Live scanning is enabled on HTTPS.",
    live: "Live camera",
    stop: "Stop",
    photo: "Take photo",
    previewSecure: "Open the camera and point it at the code.",
    previewInsecure: "Use “Take photo” in this local test. Live camera is enabled with HTTPS.",
    manual: "Manual code",
    manualPlaceholder: "EAN / UPC / code",
    search: "Search code",
    product: "Product",
    category: "Category",
    cost: "Cost",
    price: "Price",
    stock: "Stock",
    supplier: "Supplier"
  },
  pt: {
    idle: "Escaneie ao vivo, tire uma foto ou digite o código manualmente.",
    detected: (code) => `Código detectado: ${code}. Buscando produto…`,
    missing: "O código foi lido corretamente, mas ainda não existe no catálogo.",
    loaded: "Produto identificado e carregado.",
    secureRequired: "A câmera ao vivo precisa de HTTPS. Neste teste local use “Tirar foto” ou digite o código.",
    noCamera: "Este navegador não oferece acesso à câmera ao vivo.",
    requesting: "Solicitando permissão para usar a câmera…",
    aim: "Posicione o código dentro do quadro.",
    imageAnalyzing: "Analisando a imagem…",
    imageFail: "Não consegui detectar um código nessa imagem. Aproxime e garanta que esteja nítida.",
    title: "Leitor de códigos",
    eyebrow: "Captura universal",
    description: "Câmera ao vivo em HTTPS, foto como fallback e busca manual.",
    localNotice: "No endereço HTTP local o navegador bloqueia a câmera ao vivo. A foto funciona. Em HTTPS o escaneamento ao vivo é liberado.",
    live: "Câmera ao vivo",
    stop: "Parar",
    photo: "Tirar foto",
    previewSecure: "Abra a câmera e aponte para o código.",
    previewInsecure: "Use “Tirar foto” neste teste local. A câmera ao vivo é habilitada com HTTPS.",
    manual: "Código manual",
    manualPlaceholder: "EAN / UPC / código",
    search: "Buscar código",
    product: "Produto",
    category: "Categoria",
    cost: "Compra",
    price: "Venda",
    stock: "Estoque",
    supplier: "Fornecedor"
  },
  fr: {
    idle: "Scannez en direct, prenez une photo ou saisissez le code manuellement.",
    detected: (code) => `Code détecté : ${code}. Recherche du produit…`,
    missing: "Le code a été lu correctement, mais il n’existe pas encore dans le catalogue.",
    loaded: "Produit identifié et chargé.",
    secureRequired: "La caméra en direct nécessite HTTPS. Pour ce test local, utilisez “Prendre une photo” ou saisissez le code.",
    noCamera: "Ce navigateur n’expose pas l’accès à la caméra en direct.",
    requesting: "Demande d’autorisation de la caméra…",
    aim: "Placez le code dans le cadre.",
    imageAnalyzing: "Analyse de l’image…",
    imageFail: "Aucun code détecté. Rapprochez-vous et assurez-vous que l’image est nette.",
    title: "Lecteur de codes",
    eyebrow: "Capture universelle",
    description: "Caméra en direct via HTTPS, photo de secours et recherche manuelle.",
    localNotice: "L’adresse HTTP locale bloque la caméra en direct. La photo fonctionne. Le scan en direct est disponible en HTTPS.",
    live: "Caméra en direct",
    stop: "Arrêter",
    photo: "Prendre une photo",
    previewSecure: "Ouvrez la caméra et visez le code.",
    previewInsecure: "Utilisez “Prendre une photo” pour ce test local. La caméra en direct nécessite HTTPS.",
    manual: "Code manuel",
    manualPlaceholder: "EAN / UPC / code",
    search: "Rechercher le code",
    product: "Produit",
    category: "Catégorie",
    cost: "Achat",
    price: "Vente",
    stock: "Stock",
    supplier: "Fournisseur"
  },
  de: {
    idle: "Live scannen, Foto aufnehmen oder Code manuell eingeben.",
    detected: (code) => `Code erkannt: ${code}. Produkt wird gesucht…`,
    missing: "Der Code wurde gelesen, ist aber noch nicht im Katalog.",
    loaded: "Produkt erkannt und geladen.",
    secureRequired: "Die Live-Kamera benötigt HTTPS. Nutze in diesem lokalen Test “Foto aufnehmen” oder gib den Code manuell ein.",
    noCamera: "Dieser Browser stellt keinen Live-Kamerazugriff bereit.",
    requesting: "Kameraberechtigung wird angefordert…",
    aim: "Code im Rahmen positionieren.",
    imageAnalyzing: "Bild wird analysiert…",
    imageFail: "Kein Code im Bild erkannt. Geh näher heran und achte auf ein scharfes Bild.",
    title: "Barcode-Scanner",
    eyebrow: "Universelle Erfassung",
    description: "Live-Kamera über HTTPS, Foto-Fallback und manuelle Suche.",
    localNotice: "Die lokale HTTP-Adresse blockiert die Live-Kamera. Fotos funktionieren. Live-Scanning wird über HTTPS aktiviert.",
    live: "Live-Kamera",
    stop: "Stoppen",
    photo: "Foto aufnehmen",
    previewSecure: "Kamera öffnen und auf den Code richten.",
    previewInsecure: "Nutze in diesem lokalen Test “Foto aufnehmen”. Live-Kamera funktioniert über HTTPS.",
    manual: "Manueller Code",
    manualPlaceholder: "EAN / UPC / Code",
    search: "Code suchen",
    product: "Produkt",
    category: "Kategorie",
    cost: "Einkauf",
    price: "Verkauf",
    stock: "Bestand",
    supplier: "Lieferant"
  }
};

export function BarcodeScanner({
  onProduct,
  language = "es"
}: BarcodeScannerProps) {
  const copy = scannerCopy[language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const frameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resolvedRef = useRef(false);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState(copy.idle);
  const [product, setProduct] = useState<Product | null>(null);
  const [manualCode, setManualCode] = useState("");

  const liveCameraAvailable = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);
  }, []);

  useEffect(() => {
    return () => stopCameraOnly();
  }, []);

  async function resolveBarcode(rawValue: string) {
    const normalized = rawValue.trim();
    if (!normalized || resolvedRef.current) return;

    resolvedRef.current = true;
    setStatus("requesting");
    setMessage(copy.detected(normalized));

    try {
      const response = await fetch(
        `/api/product-lookup?barcode=${encodeURIComponent(normalized)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(copy.missing);
      }

      const payload = (await response.json()) as { product: Product };
      setProduct(payload.product);
      setManualCode(payload.product.barcode);
      setStatus("resolved");
      setMessage(copy.loaded);
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

  async function startLiveCamera() {
    stopCameraOnly();
    setProduct(null);
    resolvedRef.current = false;

    if (!window.isSecureContext) {
      setStatus("error");
      setMessage(copy.secureRequired);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setMessage(copy.noCamera);
      return;
    }

    setStatus("requesting");
    setMessage(copy.requesting);

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
    setMessage(copy.aim);

    const tick = async () => {
      if (!videoRef.current || !streamRef.current || resolvedRef.current) return;

      try {
        const codes = await detector.detect(videoRef.current);
        if (codes[0]?.rawValue) {
          await resolveBarcode(codes[0].rawValue);
          return;
        }
      } catch {
        // The next frame is retried.
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
    setMessage("Apuntá el código dentro del marco.");

    await reader.decodeFromVideoDevice(null, video, (result) => {
      const text = result?.getText();
      if (text) void resolveBarcode(text);
    });
  }

  async function readPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    stopCameraOnly();
    setProduct(null);
    setStatus("requesting");
    setMessage(copy.imageAnalyzing);
    resolvedRef.current = false;

    const url = URL.createObjectURL(file);
    const reader = new BrowserMultiFormatReader();

    try {
      const result = await reader.decodeFromImageUrl(url);
      await resolveBarcode(result.getText());
    } catch {
      setStatus("error");
      setMessage(copy.imageFail);
    } finally {
      reader.reset();
      URL.revokeObjectURL(url);
    }
  }

  function submitManual(event: FormEvent) {
    event.preventDefault();
    resolvedRef.current = false;
    void resolveBarcode(manualCode);
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
    setMessage(copy.idle);
  }

  const active = status === "scanning" || status === "requesting";

  return (
    <section className="apex-card overflow-hidden">
      <div className="border-b border-[var(--apex-border)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8F0000]">
              <ScanBarcode size={15} />
              Captura universal
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
              Lector de códigos
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--apex-muted)]">
              Cámara en vivo por HTTPS, foto como fallback y búsqueda manual.
            </p>
          </div>

          {!liveCameraAvailable && (
            <div className="flex max-w-sm items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-5 text-amber-600">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              {copy.localNotice}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:flex">
          <button
            type="button"
            onClick={active ? stop : startLiveCamera}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[.985] disabled:opacity-45"
          >
            {status === "requesting" && liveCameraAvailable ? (
              <Loader2 size={16} className="animate-spin" />
            ) : active ? (
              <Square size={15} />
            ) : (
              <Camera size={16} />
            )}
            {active ? copy.stop : copy.live}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] px-4 py-2.5 text-sm font-semibold transition active:scale-[.985]"
          >
            <ImagePlus size={16} />
            Tomar foto
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={readPhoto}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] border border-[var(--apex-border)] bg-black sm:aspect-video">
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-full w-full object-cover"
          />

          {!active && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <ScanBarcode
                  size={46}
                  strokeWidth={1.25}
                  className="mx-auto text-white/55"
                />
                <p className="mt-3 text-xs leading-5 text-white/45">
                  {liveCameraAvailable
                    ? "Abrí la cámara y apuntá al código."
                    : "En esta prueba local usá “Tomar foto”. La cámara en vivo se habilita con HTTPS."}
                </p>
              </div>
            </div>
          )}

          {active && (
            <div className="pointer-events-none absolute inset-[10%] rounded-3xl border border-white/45">
              <div className="absolute left-4 right-4 top-1/2 h-px bg-[#ff2d2d] shadow-[0_0_18px_rgba(255,45,45,.9)]" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-bg)] p-4">
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
          </div>

          <form
            onSubmit={submitManual}
            className="rounded-[22px] border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-bold">
              <Keyboard size={15} className="text-[#8F0000]" />
              Código manual
            </div>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                inputMode="numeric"
                placeholder={copy.manualPlaceholder}
                className="apex-input min-w-0 flex-1 px-3 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#8F0000] text-white disabled:opacity-35"
                aria-label={copy.search}
              >
                <Search size={17} />
              </button>
            </div>
          </form>

          {product && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                [copy.product, product.name],
                [copy.category, product.category],
                [copy.cost, product.cost.toLocaleString("es-AR")],
                [copy.price, product.price.toLocaleString("es-AR")],
                [copy.stock, String(product.stock)],
                [copy.supplier, product.supplier]
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
