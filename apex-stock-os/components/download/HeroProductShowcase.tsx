"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AlertCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  Laptop,
  MonitorSmartphone,
  RefreshCw,
  ScanBarcode,
  ShoppingBag,
  Smartphone,
  Wallet
} from "lucide-react";

const TABS = [
  { id: "both", label: "PC + Celular", icon: MonitorSmartphone },
  { id: "pc", label: "En computadora (PC)", icon: Laptop },
  { id: "mobile", label: "En celular (Móvil)", icon: Smartphone }
] as const;

type TabId = (typeof TABS)[number]["id"];

const LIVE_FEED = [
  {
    code: "7790895001428",
    name: "Yerba Mate Despalada 1 kg",
    qty: 1,
    price: 5400,
    dailySales: "$ 455.500",
    cashBalance: "$ 142.800",
    netProfit: "$ 154.900"
  },
  {
    code: "7791234008914",
    name: "Café Molido Selección 500 g",
    qty: 2,
    price: 19600,
    dailySales: "$ 475.100",
    cashBalance: "$ 162.400",
    netProfit: "$ 161.800"
  },
  {
    code: "7790580112042",
    name: "Galletitas Integrales 250 g",
    qty: 3,
    price: 6900,
    dailySales: "$ 482.000",
    cashBalance: "$ 169.300",
    netProfit: "$ 164.300"
  }
] as const;

export function HeroProductShowcase() {
  const [tab, setTab] = useState<TabId>("both");
  const [step, setStep] = useState(0);
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");
  const [imgAttempt, setImgAttempt] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      setImgState(img.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [imgAttempt]);

  useEffect(() => {
    if (tab === "both") return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % LIVE_FEED.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [tab]);

  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
    setTab(TABS[nextIndex].id);
  }

  function handleRetryImage() {
    setImgState("loading");
    setImgAttempt((prev) => prev + 1);
  }

  const activeItem = LIVE_FEED[step];
  const ticketRows = LIVE_FEED.slice(0, step + 1);
  const ticketTotal = ticketRows.reduce((sum, r) => sum + r.price, 0);

  return (
    <div className="dl-showcase">
      <div className="dl-showcase-bar">
        <div className="dl-showcase-tabs" role="tablist" aria-label="Vista por dispositivo">
          {TABS.map((item, idx) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                id={`showcase-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`showcase-panel-${item.id}`}
                tabIndex={active ? 0 : -1}
                className={`dl-showcase-tab ${active ? "is-active" : ""}`}
                onClick={() => setTab(item.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <span className="dl-showcase-badge">Sincronización en tiempo real</span>
      </div>

      {/* 1. VISTA REAL PRINCIPAL (PC + CELULAR) CON SKELETON Y ESTADO ERROR */}
      {tab === "both" && (
        <div
          id="showcase-panel-both"
          className="dl-showcase-stage dl-view-enter"
          role="tabpanel"
          aria-labelledby="showcase-tab-both"
        >
          {imgState === "error" ? (
            <div className="dl-ui-state-card is-error" role="alert">
              <span className="dl-ui-state-badge">Error de conexión</span>
              <div className="dl-ui-state-icon" aria-hidden="true">
                <AlertCircle size={26} />
              </div>
              <strong>No se pudo cargar la vista previa</strong>
              <p>Verificá tu conexión a internet e intentá nuevamente.</p>
              <button type="button" className="dl-btn-primary" onClick={handleRetryImage}>
                <RefreshCw size={15} aria-hidden="true" />
                Reintentar
              </button>
            </div>
          ) : (
            <div className="dl-showcase-img-wrap">
              {imgState === "loading" && (
                <div
                  className="dl-img-skeleton-overlay"
                  role="status"
                  aria-label="Cargando vista previa de Global Stock"
                >
                  <div className="dl-skel-stage-silhouette" aria-hidden="true">
                    <div className="dl-skel-pc-card">
                      <div className="dl-skel-row-between">
                        <span className="dl-skel" style={{ width: 130, height: 14 }} />
                        <span className="dl-skel dl-skel-pill" style={{ width: 72, height: 20 }} />
                      </div>
                      <div className="dl-skel-kpi-row">
                        <span className="dl-skel" style={{ height: 48, borderRadius: 10 }} />
                        <span className="dl-skel" style={{ height: 48, borderRadius: 10 }} />
                        <span className="dl-skel" style={{ height: 48, borderRadius: 10 }} />
                      </div>
                      <span className="dl-skel" style={{ width: "100%", height: 96, borderRadius: 10 }} />
                    </div>
                    <div className="dl-skel-phone-card">
                      <span className="dl-skel" style={{ width: "70%", height: 13 }} />
                      <span className="dl-skel" style={{ width: "100%", height: 74, borderRadius: 10 }} />
                      <span className="dl-skel" style={{ width: "100%", height: 42, borderRadius: 10 }} />
                    </div>
                  </div>
                </div>
              )}

              <img
                key={imgAttempt}
                ref={imgRef}
                src="/download/global-stock-product.webp"
                alt="Global Stock funcionando en una notebook y un celular mostrando ventas, inventario y caja."
                width={1672}
                height={941}
                loading="eager"
                decoding="async"
                className={imgState === "loaded" ? "is-loaded" : "is-loading"}
                onLoad={() => setImgState("loaded")}
                onError={() => setImgState("error")}
              />
            </div>
          )}
        </div>
      )}

      {/* 2. VISTA EN COMPUTADORA (INTERFAZ ANIMADA RESPONSIVE) */}
      {tab === "pc" && (
        <div
          id="showcase-panel-pc"
          className="dl-device-frame-stage dl-view-enter"
          role="tabpanel"
          aria-labelledby="showcase-tab-pc"
        >
          <div className="dl-pc-window">
            <div className="dl-pc-topbar">
              <div className="dl-pc-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="dl-pc-title">Global Stock · Punto de venta y Caja</span>
              <span className="dl-mock-pill is-ok">Turno abierto</span>
            </div>

            <div className="dl-pc-body">
              <aside className="dl-pc-sidebar" aria-hidden="true">
                <span className="is-current">
                  <ShoppingBag size={14} /> Ventas
                </span>
                <span>
                  <Boxes size={14} /> Stock
                </span>
                <span>
                  <Wallet size={14} /> Caja
                </span>
                <span>
                  <BarChart3 size={14} /> Reportes
                </span>
              </aside>

              <div className="dl-pc-main">
                <div className="dl-pc-kpis">
                  <div className="dl-mock-kpi">
                    <small>Ventas de hoy</small>
                    <strong>{activeItem.dailySales}</strong>
                  </div>
                  <div className="dl-mock-kpi">
                    <small>Efectivo en caja</small>
                    <strong>{activeItem.cashBalance}</strong>
                  </div>
                  <div className="dl-mock-kpi is-highlight">
                    <small>Ganancia neta hoy</small>
                    <strong>{activeItem.netProfit}</strong>
                  </div>
                </div>

                <div className="dl-pc-ticket">
                  <div className="dl-mock-head">
                    <strong>Ticket actual · Mostrador 1</strong>
                    <span className="dl-mock-pill is-ok">Stock descontado al instante</span>
                  </div>
                  <ul className="dl-mock-list">
                    {ticketRows.map((row) => (
                      <li key={row.code} className="dl-row-slide">
                        <span>
                          {row.qty} × {row.name}
                        </span>
                        <strong>$ {row.price.toLocaleString("es-AR")}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="dl-mock-total">
                    <span>Total a cobrar</span>
                    <strong>$ {ticketTotal.toLocaleString("es-AR")}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. VISTA EN CELULAR (APP MÓVIL ANIMADA RESPONSIVE) */}
      {tab === "mobile" && (
        <div
          id="showcase-panel-mobile"
          className="dl-device-frame-stage dl-view-enter"
          role="tabpanel"
          aria-labelledby="showcase-tab-mobile"
        >
          <div className="dl-mobile-showcase-wrap">
            <div className="dl-phone-frame">
              <div className="dl-phone-notch" aria-hidden="true" />
              <div className="dl-phone-screen">
                <div className="dl-mock-head">
                  <strong>Global Stock Móvil</strong>
                  <span className="dl-mock-pill is-ok">Conectado a PC</span>
                </div>

                <div className="dl-phone-scanner-card">
                  <div className="dl-phone-scanner-head">
                    <ScanBarcode size={16} aria-hidden="true" />
                    <span>Escáner de cámara activo</span>
                  </div>
                  <div className="dl-barcode-box" aria-hidden="true">
                    <div className="dl-barcode-bars" />
                    <div className="dl-barcode-laser" />
                    <span className="dl-barcode-num">{activeItem.code}</span>
                  </div>
                  <div key={activeItem.code} className="dl-phone-scanned-item dl-row-slide">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <div>
                      <strong>
                        {activeItem.name} · $ {activeItem.price.toLocaleString("es-AR")}
                      </strong>
                      <small>Enviado al ticket de tu computadora</small>
                    </div>
                  </div>
                </div>

                <div className="dl-mock-kpis">
                  <div className="dl-mock-kpi">
                    <small>Caja hoy</small>
                    <strong>{activeItem.dailySales}</strong>
                  </div>
                  <div className="dl-mock-kpi is-highlight">
                    <small>Ganancia neta</small>
                    <strong>{activeItem.netProfit}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="dl-showcase-caption">
        {tab === "both" &&
          "Accedé desde tu computadora en el local o desde tu celular estés donde estés, con datos sincronizados."}
        {tab === "pc" &&
          "En computadora tenés pantalla amplia para cobrar rápido en mostrador y controlar caja y márgenes."}
        {tab === "mobile" &&
          "En celular llevás tu negocio en el bolsillo y usás la cámara como lector de códigos de barras."}
      </p>
    </div>
  );
}