import { Footer } from "@/components/marketing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { cabinetJsonLd } from "@/lib/structured-data";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={cabinetJsonLd()} />
      {children}
      <Footer />
    </>
  );
}
