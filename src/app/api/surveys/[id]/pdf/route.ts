import { NextResponse } from "next/server";
import { requireModule, requireUser } from "@/server/auth/session";
import { renderSurveyPdfHtml } from "@/server/services/survey-export";
import { getSurveyById, markExport } from "@/server/services/surveys";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "read");
    const { id } = await params;
    const survey = await getSurveyById(id, user);
    if (!survey) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    await markExport({ id, actor: user, kind: "pdf" });
    const html = renderSurveyPdfHtml({
      folio: survey.folio,
      clientName: survey.clientName,
      quoteFolio: survey.quoteFolio,
      operationType: survey.operationType,
      responsibleName: survey.responsibleName,
      interviewDate: survey.interviewDate,
    });
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${survey.folio}_Formato_${survey.operationType}.html"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
