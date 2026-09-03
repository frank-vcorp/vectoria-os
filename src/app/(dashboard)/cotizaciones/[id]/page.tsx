import { requirePageModule } from "@/server/auth/page-guard";
import { QuoteDetailView } from "@/components/quote-detail";

type Props = { params: Promise<{ id: string }> };

export default async function CotizacionDetailPage({ params }: Props) {
  await requirePageModule("cotizaciones");
  const { id } = await params;

  return <QuoteDetailView id={id} />;
}
