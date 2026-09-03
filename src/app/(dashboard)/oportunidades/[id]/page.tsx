import { requirePageModule } from "@/server/auth/page-guard";
import { OpportunityDetailView } from "@/components/opportunity-detail";

type Props = { params: Promise<{ id: string }> };

export default async function OportunidadDetailPage({ params }: Props) {
  await requirePageModule("oportunidades");
  const { id } = await params;

  return <OpportunityDetailView id={id} />;
}
