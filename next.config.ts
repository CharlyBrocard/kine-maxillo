import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses. Pas de CSP
 * stricte pour l'instant (Next.js injecte des scripts inline : il
 * faudrait des nonces) — frame-ancestors suffit contre le clickjacking.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Les liens de confirmation/annulation portent un token en query string :
  // ne jamais le transmettre à un site tiers via l'en-tête Referer.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Serveur autonome minimal pour l'image Docker (voir Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
