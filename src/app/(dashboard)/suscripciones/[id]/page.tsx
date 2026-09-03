import { requirePageModule } from "@/server/auth/page-guard";
import { SubscriptionDetailView } from "@/components/subscription-detail";

type Props = { params: Promise<{ id: string }> };

export default async function SuscripcionDetailPage({ params }: Props) {
  await requirePageModule("suscripciones");
  const { id } = await params;
  return <SubscriptionDetailView id={id} />;
}
