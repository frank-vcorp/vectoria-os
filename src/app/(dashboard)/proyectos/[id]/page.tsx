import { requirePageModule } from "@/server/auth/page-guard";
import { ProjectDetailView } from "@/components/project-detail";

type Props = { params: Promise<{ id: string }> };

export default async function ProyectoDetailPage({ params }: Props) {
  await requirePageModule("proyectos");
  const { id } = await params;
  return <ProjectDetailView id={id} />;
}
