import { BookingWizard } from "@/components/booking/BookingWizard";
import type { CategoryId } from "@/lib/categories";

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
