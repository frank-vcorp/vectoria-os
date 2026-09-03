import { requirePageModule } from "@/server/auth/page-guard";
import { ClientDetailView } from "@/components/client-detail";

type Props = { params: Promise<{ id: string }> };

export default async function ClienteDetailPage({ params }: Props) {
  await requirePageModule("clientes");
  const { id } = await params;

  return <ClientDetailView id={id} />;
}
