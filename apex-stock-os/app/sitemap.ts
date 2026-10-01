import type { MetadataRoute } from "next";

function baseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/\/$/, "")}`;

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${deployment.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  const updated = new Date();

  return [
    { url: `${base}/download`, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/support`, lastModified: updated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/legal`, lastModified: updated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/legal/privacy`, lastModified: updated, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal/terms`, lastModified: updated, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal/security`, lastModified: updated, changeFrequency: "monthly", priority: 0.5 }
  ];
}
