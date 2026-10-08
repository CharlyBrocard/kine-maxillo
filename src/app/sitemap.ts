import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

/** Pages publiques indexables uniquement (pas /espace ni les pages à token). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1 },
    { path: "/specialites", priority: 0.9 },
    { path: "/rendez-vous", priority: 0.8 },
    { path: "/tarifs", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/mentions-legales", priority: 0.2 },
    { path: "/confidentialite", priority: 0.2 },
  ];
  return pages.map(({ path, priority }) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
