/**
 * Script JSON-LD. `<` est échappé pour qu'une valeur contenant
 * "</script>" ne puisse pas sortir de la balise (recommandation de la doc
 * Next.js, guide JSON-LD).
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
