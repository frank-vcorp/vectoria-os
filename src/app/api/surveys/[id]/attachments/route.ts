import { NextResponse } from "next/server";
import { requireModule, requireUser } from "@/server/auth/session";
import { addAttachment, getSurveyById } from "@/server/services/surveys";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "read");
    const { id } = await params;
    const survey = await getSurveyById(id, user);
    if (!survey) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ attachments: survey.attachments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "write");
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const attachment = await addAttachment({
      surveyId: id,
      actor: user,
      file: { name: file.name, type: file.type, size: file.size, bytes },
      sectionId: String(form.get("sectionId") ?? "") || null,
      description: String(form.get("description") ?? "") || null,
    });
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND"
        ? 404
        : msg === "FILE_TOO_LARGE" || msg === "FILE_TYPE" || msg === "LOCKED"
          ? 409
          : msg === "UNAUTHORIZED"
            ? 401
            : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
