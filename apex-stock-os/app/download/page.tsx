import "./download.css";

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  ScanBarcode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wallet,
  X
} from "lucide-react";

import { DownloadLogo } from "@/components/DownloadLogo";
import { DownloadThemeToggle } from "@/components/DownloadTheme";
import { PublicPage } from "@/components/PublicSiteChrome";
import { DeviceInstallSection } from "@/components/download/DeviceInstallSection";
import { DownloadNavbar } from "@/components/download/DownloadNavbar";
import { FaqAccordionList } from "@/components/download/FaqAccordionList";
import { HeroProductShowcase } from "@/components/download/HeroProductShowcase";
import { ProblemSolutionExplorer } from "@/components/download/ProblemSolutionExplorer";
import { RevealOnScroll } from "@/components/download/RevealOnScroll";
import {
  COMPARISON_ROWS,
  CORE_FEATURES,
  DEVICES,
  FAQ,
  LEGAL_LINKS,
  SECTOR_GROUPS,
  SITE_URL,
  type CoreFeature
} from "@/components/download/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Global Stock | Sistema de stock, punto de venta y caja",
  description:
    "Controlá inventario en tiempo real, registrá ventas, cerrá tu caja sabiendo exactamente cuánto ganaste y escaneá códigos de barras con tu celular. Gratis en web, iOS, Android, Windows y Mac.",
  icons: {
    icon: [{ url: "/brand/global-stock-mark.png", type: "image/png" }],
    shortcut: "/brand/global-stock-mark.png",
    apple: "/brand/global-stock-mark.png"
  },
  keywords: [
    "sistema de stock",
    "control de inventario",
    "punto de venta",
    "control de caja",
    "app para negocios",
    "lector codigo de barras celular",
    "gestion comercial",
    "Global Stock"
  ],
  alternates: { canonical: "/download" },
  openGraph: {
    title: "Global Stock — Controlá tu stock, ventas y caja en un solo lugar",
    description:
      "Evitá quiebres de stock, cerrá la caja en minutos y conectá tu celular como escáner de códigos de barras. Disponible en web y como app instalable.",
    url: "/download",
    siteName: "Global Stock",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/download/global-stock-product.webp`,
        width: 1672,
        height: 941,
        alt: "Global Stock funcionando en computadora y teléfono móvil"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Stock — Controlá tu stock, ventas y caja",
    description:
      "Inventario en tiempo real, punto de venta, caja diaria y escáner móvil para comercios y empresas.",
    images: [`${SITE_URL}/download/global-stock-product.webp`]
  }
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Global Stock",
      applicationCategory: "BusinessApplication",
      browserRequirements: "Requires JavaScript. Compatible with Chrome, Safari, Edge, Firefox.",
      operatingSystem: "Web, iOS, iPadOS, Android, Windows, macOS",
      url: `${SITE_URL}/download`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      },
      featureList: CORE_FEATURES.map((f) => `${f.name}: ${f.detail}`),
      description:
        "Aplicación web instalable de gestión comercial para controlar inventario, punto de venta, caja diaria, compras, proveedores y reportes desde el celular o la computadora."
    },
    {
      "@type": "Organization",
      name: "Global Stock",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/global-stock-mark.png`
    },
    {
      "@type": "HowTo",
      name: "Cómo instalar Global Stock en celular o computadora",
      description:
        "Pasos para instalar Global Stock directamente desde el navegador en Android, iPhone, iPad, Windows o Mac.",
      step: DEVICES.slice(0, 4).map((d, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
        name: `Instalar en ${d.name}`,
        text: d.steps.join(" ")
      }))
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a
        }
      }))
    }
  ]
};

const safeJsonLd = JSON.stringify(structuredData).replace(/</g, "\\u003c");

const CORE_ICONS: Record<CoreFeature["iconName"], typeof ShoppingBag> = {
  pos: ShoppingBag,
  stock: Boxes,
  scan: ScanBarcode,
  cash: Wallet,
  suppliers: Truck,
  ai: Sparkles
};

export default function DownloadPage() {
  const brand = (
    <>
      <span className="dl-brand-chip">
        <DownloadLogo alt="" width={28} height={28} />
      </span>
      <span className="dl-brand-name">Global Stock</span>
    </>
  );

  return (
    <PublicPage downloadBrand>
      <div id="inicio" className="dl-page">
        <DownloadNavbar brand={brand} themeToggle={<DownloadThemeToggle />} />

        <main>
          {/* 1. HERO DIRECTO + VISTAS RESPONSIVE POR DISPOSITIVO */}
          <section className="dl-hero" aria-labelledby="hero-title">
            <div className="dl-container">
              <div className="dl-hero-grid">
                <div>
                  <span className="dl-eyebrow">App de gestión comercial · Gratis para empezar</span>
                  <h1 id="hero-title" className="dl-h1">
                    Controlá tu stock, ventas y caja en un solo lugar
                  </h1>
                  <p className="dl-lead">
                    Dejá de perder ventas por faltantes y cerrá el día sabiendo cuánto ganaste. Usalo desde tu PC o
                    celular y convertí tu teléfono en lector de códigos de barras.
                  </p>

                  <div className="dl-hero-actions">
                    <Link href="/" className="dl-btn-primary">
                      Empezar gratis ahora
                      <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                    <a href="#instalar" className="dl-btn-secondary">
                      Instalar en mi dispositivo
                    </a>
                  </div>

                  <div className="dl-hero-meta">
                    <span>
                      <CheckCircle2 size={16} aria-hidden="true" /> Sin planillas ni instalaciones pesadas
                    </span>
                    <span>
                      <CheckCircle2 size={16} aria-hidden="true" /> Sincronización en tiempo real PC + Celular
                    </span>
                    <span>
                      <CheckCircle2 size={16} aria-hidden="true" /> 7 monedas e Inteligencia Artificial incluidas
                    </span>
                  </div>
                </div>

                <HeroProductShowcase />
              </div>
            </div>
          </section>

          {/* 2. VENTAJAS (COMPARATIVA) */}
          <section id="comparativa" className="dl-section dl-section-alt" aria-labelledby="comparativa-title">
            <div className="dl-container">
              <RevealOnScroll className="dl-section-head">
                <span className="dl-eyebrow">Por qué dar el paso</span>
                <h2 id="comparativa-title" className="dl-h2">
                  Lo que cambia en tu negocio desde el primer día
                </h2>
                <p className="dl-lead">
                  Compará cómo se resuelven las tareas diarias de un comercio con cuadernos o Excel frente a tener todo
                  conectado en Global Stock.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delayMs={60} className="dl-compare-wrap">
                <div className="dl-compare-head" aria-hidden="true">
                  <span>Área</span>
                  <span>Hoy (cuaderno, memoria o Excel)</span>
                  <span>Con Global Stock</span>
                </div>

                {COMPARISON_ROWS.map((row) => (
                  <div key={row.aspect} className="dl-compare-row">
                    <div className="dl-compare-aspect">{row.aspect}</div>
                    <div className="dl-compare-before">
                      <X size={16} aria-hidden="true" />
                      <span>{row.before}</span>
                    </div>
                    <div className="dl-compare-after">
                      <Check size={16} aria-hidden="true" />
                      <span>{row.after}</span>
                    </div>
                  </div>
                ))}
              </RevealOnScroll>
            </div>
          </section>

          {/* 3. FUNCIONES Y SOLUCIONES COMPACTAS */}
          <section id="funciones" className="dl-section" aria-labelledby="funciones-title">
            <span id="download-features" className="dl-compat-anchor" aria-hidden="true" />
            <span id="download-feature-catalog" className="dl-compat-anchor" aria-hidden="true" />
            <div className="dl-container">
              <RevealOnScroll className="dl-section-head">
                <span className="dl-eyebrow">Pensado para el día a día</span>
                <h2 id="funciones-title" className="dl-h2">
                  Elegí un problema de tu local y mirá cómo lo resolvés
                </h2>
              </RevealOnScroll>

              <RevealOnScroll delayMs={50}>
                <ProblemSolutionExplorer />
              </RevealOnScroll>

              <div className="dl-core-grid" style={{ marginTop: "2rem" }}>
                {CORE_FEATURES.map((feat, idx) => {
                  const Icon = CORE_ICONS[feat.iconName];
                  return (
                    <RevealOnScroll key={feat.id} delayMs={idx * 45}>
                      <article className="dl-core-card">
                        <span className="dl-core-icon">
                          <Icon size={19} aria-hidden="true" />
                        </span>
                        <div>
                          <h3>{feat.name}</h3>
                          <p>{feat.detail}</p>
                        </div>
                      </article>
                    </RevealOnScroll>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. RUBROS */}
          <section id="rubros" className="dl-section dl-section-alt" aria-labelledby="rubros-title">
            <span id="download-sectors" className="dl-compat-anchor" aria-hidden="true" />
            <div className="dl-container">
              <RevealOnScroll className="dl-section-head">
                <span className="dl-eyebrow">Flexible para cada formato</span>
                <h2 id="rubros-title" className="dl-h2">
                  Adaptable a cualquier comercio, depósito o tienda online
                </h2>
              </RevealOnScroll>

              <div className="dl-sectors-grid">
                {SECTOR_GROUPS.map((group, idx) => (
                  <RevealOnScroll key={group.category} delayMs={idx * 55}>
                    <article className="dl-sector-card">
                      <h3>{group.category}</h3>
                      <ul>
                        {group.examples.map((ex) => (
                          <li key={ex}>{ex}</li>
                        ))}
                      </ul>
                    </article>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </section>

          {/* 5. INSTALACIÓN MULTIDISPOSITIVO */}
          <section id="instalar" className="dl-section" aria-labelledby="instalar-title">
            <span id="download-install" className="dl-compat-anchor" aria-hidden="true" />
            <div className="dl-container">
              <RevealOnScroll className="dl-section-head">
                <span className="dl-eyebrow">Multiplataforma · Liviana y rápida</span>
                <h2 id="instalar-title" className="dl-h2">
                  Instalá Global Stock en tu celular o computadora en menos de 30 segundos
                </h2>
                <p className="dl-lead">
                  Detectamos tu dispositivo automáticamente. Elegí cualquier plataforma para ver los pasos exactos o
                  copiá el enlace para abrirlo desde tu teléfono.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delayMs={60}>
                <DeviceInstallSection />
              </RevealOnScroll>
            </div>
          </section>

          {/* 6. PREGUNTAS FRECUENTES + ACCESO DIRECTO A SEGURIDAD Y POLÍTICAS */}
          <section id="preguntas" className="dl-section dl-section-alt" aria-labelledby="preguntas-title">
            <div className="dl-container">
              <RevealOnScroll className="dl-section-head">
                <span className="dl-eyebrow">Respuestas claras</span>
                <h2 id="preguntas-title" className="dl-h2">
                  Preguntas frecuentes sobre Global Stock
                </h2>
              </RevealOnScroll>

              <RevealOnScroll delayMs={50}>
                <FaqAccordionList />
              </RevealOnScroll>

              <RevealOnScroll delayMs={90} className="dl-security-strip">
                <div className="dl-security-strip-info">
                  <span className="dl-security-strip-icon">
                    <ShieldCheck size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Seguridad, respaldo en la nube y privacidad</strong>
                    <span>Conocé cómo protegemos los datos y accesos de tu comercio.</span>
                  </div>
                </div>

                <nav className="dl-legal-links" aria-label="Seguridad y políticas">
                  {LEGAL_LINKS.map((link) => (
                    <Link key={link.href} href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </RevealOnScroll>
            </div>
          </section>

          {/* 7. CIERRE FINAL */}
          <section className="dl-section" aria-label="Comenzar ahora">
            <div className="dl-container">
              <RevealOnScroll className="dl-cta-banner">
                <span className="dl-cta-kicker">Listo en menos de 1 minuto</span>
                <h2>Ordená tu stock, tus ventas y tu caja hoy mismo</h2>
                <p>
                  Creá tu espacio de trabajo gratis, cargá tus primeros productos o escanealos con tu celular y empezá a
                  tomar decisiones con datos reales.
                </p>
                <div className="dl-cta-actions">
                  <Link href="/" className="dl-btn-primary">
                    Crear cuenta gratis
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                  <Link href="/support" className="dl-cta-ghost">
                    Hablar con soporte
                  </Link>
                </div>
                <div className="dl-cta-perks">
                  <span>
                    <CheckCircle2 size={15} aria-hidden="true" /> Sin tarjeta de crédito
                  </span>
                  <span>
                    <CheckCircle2 size={15} aria-hidden="true" /> Celular como escáner
                  </span>
                  <span>
                    <CheckCircle2 size={15} aria-hidden="true" /> Sincronizado en la nube
                  </span>
                </div>
              </RevealOnScroll>
            </div>
          </section>
        </main>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
    </PublicPage>
  );
}