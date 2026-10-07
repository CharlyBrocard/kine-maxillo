import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/espace",
        // Pages à token : un robot qui exécute le JavaScript confirmerait ou
        // annulerait le RDV en les visitant. Aussi en noindex (metadata).
        "/rendez-vous/confirmation",
        "/rendez-vous/annule",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
