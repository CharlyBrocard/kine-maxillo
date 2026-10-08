import { siteConfig } from "@/lib/site-config";

/**
 * Carte OpenStreetMap intégrée + liens d'itinéraire. OpenStreetMap plutôt
 * que Google Maps : pas de cookie de suivi, donc pas de bandeau de
 * consentement (voir PROJECT.md). Les applis de navigation ne sont
 * ouvertes qu'au clic, dans un nouvel onglet.
 */
const { lat, lon } = siteConfig.coordonnees;
// Emprise de la carte autour du cabinet (environ 600 m × 500 m).
const bbox = [lon - 0.004, lat - 0.0022, lon + 0.004, lat + 0.0022].map((n) => n.toFixed(6)).join(",");
const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
const destination = encodeURIComponent(`${siteConfig.adresseLigne1}, ${siteConfig.adresseLigne2}`);

const itineraires = [
  { label: "Google Maps", href: `https://www.google.com/maps/dir/?api=1&destination=${destination}` },
  { label: "Waze", href: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes` },
  { label: "Plans (iPhone)", href: `https://maps.apple.com/?daddr=${lat},${lon}` },
];

export function CabinetMap() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-72 overflow-hidden rounded-2xl border border-border bg-sauge sm:h-[420px]">
        <iframe
          src={embedUrl}
          title={`Carte : cabinet au ${siteConfig.adresseLigne1}, ${siteConfig.adresseLigne2}`}
          className="h-full w-full"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[15px] text-body">Itinéraire :</span>
        {itineraires.map((it) => (
          <a
            key={it.label}
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-[10px] border-[1.5px] border-border-input bg-white px-4 text-[15px] font-semibold text-ink transition-colors hover:border-accent"
          >
            {it.label}
          </a>
        ))}
      </div>
    </div>
  );
}
