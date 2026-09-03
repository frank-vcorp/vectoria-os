import { requirePageModule } from "@/server/auth/page-guard";
import { ServiceOrderDetailView } from "@/components/service-order-detail";

type Props = { params: Promise<{ id: string }> };

export default async function OrdenServicioDetailPage({ params }: Props) {
  await requirePageModule("ordenes_servicio");
  const { id } = await params;

  return <ServiceOrderDetailView id={id} />;
}
