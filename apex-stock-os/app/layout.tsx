import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegistrar } from "@/components/PwaRegistrar";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
      : "https://globalstocks.vercel.app")
  ),
  title: {
    default: "Global Stock",
    template: "%s | Global Stock"
  },
  description:
    "Gestión de stock, ventas, caja y negocios conectados con Global Intelligence.",
  applicationName: "Global Stock",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Global Stock",
    title: "Global Stock — Gestión inteligente de tu negocio",
    description: "Ventas, inventario, caja y análisis en una misma aplicación.",
    images: [{ url: "/icons/global-stock-icon-512.png", width: 512, height: 512, alt: "Global Stock" }]
  },
  twitter: {
    card: "summary",
    title: "Global Stock — Gestión inteligente",
    description: "Stock, ventas, caja e inteligencia en un mismo lugar.",
    images: ["/icons/global-stock-icon-512.png"]
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Global Stock",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/icons/global-stock-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/global-stock-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/global-stock-icon-192.png", sizes: "192x192", type: "image/png" }
    ]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}