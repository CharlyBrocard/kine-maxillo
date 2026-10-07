import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { CategoryId } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Prendre rendez-vous en ligne",
  description: `Réservez en ligne votre séance de rééducation maxillo-faciale ou de pressothérapie au cabinet de ${siteConfig.ville}, sans créer de compte. Confirmation par email.`,
  alternates: { canonical: "/rendez-vous" },
};

export default async function RendezVousPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categoryInitial =
    params.category === "MAXILLO_FACIAL" || params.category === "PRESSOTHERAPIE"
      ? (params.category as CategoryId)
      : undefined;

  return <BookingWizard categoryInitial={categoryInitial} />;
}
