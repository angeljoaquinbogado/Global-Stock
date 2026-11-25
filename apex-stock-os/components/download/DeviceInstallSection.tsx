"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Globe,
  RefreshCw
} from "lucide-react";
import { DEVICES, SITE_URL, STORE_URLS, type DevicePlatform } from "./content";

type DeviceId = DevicePlatform["id"];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type UiFeedbackState =
  | { kind: "idle" }
  | { kind: "ready"; badge: string; message: string }
  | { kind: "error"; badge: string; message: string; fallbackUrl?: string };

function detectPlatform(): DeviceId {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Macintosh/.test(ua)) return "mac";
  return "web";
}

function checkStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function DeviceInstallSection() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [detectedId, setDetectedId] = useState<DeviceId>("windows");
  const [selectedId, setSelectedId] = useState<DeviceId>("windows");
  const [canInstallPrompt, setCanInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uiState, setUiState] = useState<UiFeedbackState>({ kind: "idle" });

  useEffect(() => {
    const mine = detectPlatform();
    setDetectedId(mine);
    setSelectedId(mine);
    setIsInstalled(checkStandalone());

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setCanInstallPrompt(false);
      setIsInstalled(true);
      setUiState({
        kind: "ready",
        badge: "Listo",
        message: "Global Stock quedó instalada correctamente en tu dispositivo."
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function getTargetUrl(): string {
    if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
      return `${window.location.origin}/download`;
    }
    return `${SITE_URL}/download`;
  }

  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + delta + DEVICES.length) % DEVICES.length;
    setSelectedId(DEVICES[nextIndex].id);
    setUiState({ kind: "idle" });
  }

  async function triggerInstall() {
    const promptEvent = deferredPrompt.current;
    if (!promptEvent) {
      setUiState({
        kind: "error",
        badge: "Error",
        message: "El asistente automático no está disponible. Seguí los 3 pasos manuales de arriba."
      });
      return;
    }

    setUiState({ kind: "idle" });
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") {
        setUiState({
          kind: "ready",
          badge: "Listo",
          message: "Instalando Global Stock en tu pantalla de inicio."
        });
      } else {
        setUiState({
          kind: "error",
          badge: "Cancelado",
          message: "Instalación cancelada. Podés reintentar o seguir los 3 pasos manuales."
        });
      }
    } catch {
      setUiState({
        kind: "error",
        badge: "Error",
        message: "Tu navegador bloqueó el cuadro automático. Seguí los 3 pasos manuales."
      });
    } finally {
      deferredPrompt.current = null;
      setCanInstallPrompt(false);
    }
  }

  async function handleCopyAppUrl() {
    const targetUrl = getTargetUrl();
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(targetUrl);
      setCopiedLink(true);
      setUiState({
        kind: "ready",
        badge: "Listo",
        message: "Enlace copiado. Abrilo en tu celular o navegador para instalar Global Stock."
      });
      setTimeout(() => setCopiedLink(false), 2800);
    } catch {
      setCopiedLink(false);
      setUiState({
        kind: "error",
        badge: "Error",
        message: "No se pudo copiar automáticamente. Copiá el enlace manualmente o reintentá.",
        fallbackUrl: targetUrl
      });
    }
  }

  return (
    <div className="dl-install-box">
      <div className="dl-device-tabs" role="tablist" aria-label="Elegí tu dispositivo">
        {DEVICES.map((device, idx) => {
          const isSelected = device.id === selectedId;
          const isRecommended = device.id === detectedId;
          return (
            <button
              key={device.id}
              id={`device-tab-${device.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`device-panel-${device.id}`}
              tabIndex={isSelected ? 0 : -1}
              className={`dl-device-tab ${isSelected ? "is-active" : ""}`}
              onClick={() => {
                setSelectedId(device.id);
                setUiState({ kind: "idle" });
              }}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
            >
              {isRecommended && <span className="dl-device-mine-badge">Recomendado</span>}
              <span className="dl-device-tab-icon" aria-hidden="true">
                {device.icon ? (
                  <img
                    src={device.icon}
                    alt=""
                    width={22}
                    height={22}
                    loading="lazy"
                    className={device.isMonochrome ? "is-monochrome" : ""}
                  />
                ) : (
                  <Globe size={20} />
                )}
              </span>
              <span className="dl-device-tab-text">
                <strong>{device.name}</strong>
                <small>{device.subtitle}</small>
              </span>
            </button>
          );
        })}
      </div>

      {DEVICES.map((device) => {
        const isSelected = device.id === selectedId;
        const storeUrl = device.storeKey ? STORE_URLS[device.storeKey] : "";
        return (
          <div
            key={device.id}
            id={`device-panel-${device.id}`}
            className="dl-device-panel"
            role="tabpanel"
            aria-labelledby={`device-tab-${device.id}`}
            hidden={!isSelected}
          >
            <div className="dl-device-panel-head">
              <div>
                <span className="dl-device-hint">
                  App Web instalable · {device.browserHint}
                </span>
                <h3 className="dl-device-panel-title">Cómo instalar en {device.name}</h3>
              </div>

              <div className="dl-device-panel-cta">
                <button type="button" onClick={handleCopyAppUrl} className="dl-btn-secondary">
                  {copiedLink ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copiedLink ? "Enlace copiado" : "Copiar enlace"}
                </button>

                {isInstalled && device.id === detectedId ? (
                  <Link href="/" className="dl-btn-primary">
                    <Check size={16} aria-hidden="true" />
                    Ya está instalada · Abrir
                  </Link>
                ) : canInstallPrompt && device.id === detectedId ? (
                  <button type="button" onClick={triggerInstall} className="dl-btn-primary">
                    <Download size={16} aria-hidden="true" />
                    Instalar app ahora
                  </button>
                ) : storeUrl ? (
                  <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="dl-btn-primary">
                    Ver en tienda oficial
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                ) : (
                  <Link href="/" className="dl-btn-primary">
                    Ir a crear cuenta o iniciar sesión
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>

            <ol className="dl-device-steps">
              {device.steps.map((step, i) => (
                <li key={step}>
                  <span className="dl-device-step-num">Paso {i + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>

            {/* Estados de interfaz: Listo / Error con Reintentar */}
            {isSelected && uiState.kind === "ready" && (
              <div role="status" className="dl-inline-state is-ready">
                <span className="dl-inline-state-pill">{uiState.badge}</span>
                <CheckCircle2 size={17} aria-hidden="true" />
                <span>{uiState.message}</span>
              </div>
            )}

            {isSelected && uiState.kind === "error" && (
              <div role="alert" className="dl-inline-state is-error">
                <div className="dl-inline-state-main">
                  <span className="dl-inline-state-pill">{uiState.badge}</span>
                  <AlertCircle size={17} aria-hidden="true" />
                  <span>{uiState.message}</span>
                </div>
                <div className="dl-inline-state-actions">
                  {uiState.fallbackUrl && (
                    <input
                      type="text"
                      readOnly
                      aria-label="Enlace directo para copiar manualmente"
                      value={uiState.fallbackUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="dl-inline-url-input"
                    />
                  )}
                  <button type="button" onClick={handleCopyAppUrl} className="dl-inline-retry-btn">
                    <RefreshCw size={14} aria-hidden="true" />
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            <p className="dl-install-legal">
              No requiere descargar archivos ejecutables ni ocupar memoria pesada. Al usar Global Stock aceptás los{" "}
              <Link href="/legal/terms">Términos de uso</Link>, la{" "}
              <Link href="/legal/privacy">Política de privacidad</Link> y el uso de{" "}
              <Link href="/legal/cookies">cookies y almacenamiento local</Link>.
            </p>
          </div>
        );
      })}
    </div>
  );
}