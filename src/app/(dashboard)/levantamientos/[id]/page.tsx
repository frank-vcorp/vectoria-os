import { requirePageModule } from "@/server/auth/page-guard";
import { SurveyDetailView } from "@/components/survey-detail";

type Props = { params: Promise<{ id: string }> };

export default async function LevantamientoDetailPage({ params }: Props) {
  await requirePageModule("levantamientos");
  const { id } = await params;
  return <SurveyDetailView id={id} />;
}
