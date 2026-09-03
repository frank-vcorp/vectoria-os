import { requirePageModule } from "@/server/auth/page-guard";
import { InvoiceDetailView } from "@/components/invoice-detail";

export default async function FacturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageModule("facturacion");
  const { id } = await params;
  return <InvoiceDetailView id={id} />;
}
