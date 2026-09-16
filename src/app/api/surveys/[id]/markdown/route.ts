import { NextResponse } from "next/server";
import { requireModule, requireUser } from "@/server/auth/session";
import { renderSurveyMarkdown } from "@/server/services/survey-export";
import { getSurveyById, markExport } from "@/server/services/surveys";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "read");
    const { id } = await params;
    const survey = await getSurveyById(id, user);
    if (!survey) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    await markExport({ id, actor: user, kind: "markdown" });
    const markdown = renderSurveyMarkdown({
      folio: survey.folio,
      clientName: survey.clientName,
      quoteFolio: survey.quoteFolio,
      operationType: survey.operationType,
      responsibleName: survey.responsibleName,
      status: survey.status,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      interviewDate: survey.interviewDate,
      revisionNumber: survey.revisionNumber,
      lastFinalizedAt: survey.lastFinalizedAt,
      transversalTemplateVersion: survey.transversalTemplateVersion,
      operationTemplateVersion: survey.operationTemplateVersion,
      answers: survey.answers,
      sectionStates: survey.sectionStates,
      attachments: survey.attachments,
      archivedOperations: survey.archivedOperations,
    });
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${survey.folio}_Levantamiento_${survey.operationType}_${date}.md"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
