import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

const isProduction = process.env.NODE_ENV === "production";
const projectRoot = dirname(fileURLToPath(import.meta.url));

// Only trust the user's own LAN addresses for local Next.js HMR.
// This does not make production CORS permissive.
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter(entry => entry && entry.family === "IPv4" && !entry.internal)
  .map(entry => entry.address)
  .filter(ip => /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(ip));
const allowedDevOrigins = [...new Set([...lanHosts, "192.168.0.7"])];

// The checked-out production build is also exercised on a loopback HTTP server
// in GitHub Actions. Only there, do not force HTTP assets to HTTPS. Web-facing
// deployments continue to send their original CSP upgrade and HSTS policies.
const localBrowserQaHttp =
  process.env.GLOBAL_STOCK_LOCAL_BROWSER_QA === "1" &&
  process.env.E2E_BASE_URL === "http://127.0.0.1:3000" &&
  process.env.VERCEL !== "1";


const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' https://accounts.google.com${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'self' https://www.google.com https://maps.google.com https://accounts.google.com",
  ...(isProduction && !localBrowserQaHttp ? ["upgrade-insecure-requests"] : [])
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()"
  },
  ...(isProduction && !localBrowserQaHttp
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload"
        }
      ]
    : [])
];

const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: projectRoot },
  ...(!isProduction ? { allowedDevOrigins } : {}),
  poweredByHeader: false,
  compress: true,
  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store, max-age=0" },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
        ...securityHeaders
      ]
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
        ...securityHeaders
      ]
    },
    {
      source: "/(.*)",
      headers: securityHeaders
    }
  ]
};

export default nextConfig;