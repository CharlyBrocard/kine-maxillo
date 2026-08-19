import { BookingWizard } from "@/components/booking/BookingWizard";
import type { MotifId } from "@/lib/motifs";

export default async function RendezVousPage({
  searchParams,
}: {
  searchParams: Promise<{ motif?: string }>;
}) {
  const params = await searchParams;
  const motifInitial =
    params.motif === "pressotherapie" || params.motif === "fonctionnelle"
      ? (params.motif as MotifId)
      : undefined;

  return <BookingWizard motifInitial={motifInitial} />;
}
