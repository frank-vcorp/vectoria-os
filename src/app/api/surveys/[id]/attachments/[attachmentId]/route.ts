import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireModule, requireUser } from "@/server/auth/session";
import { getAttachmentFile, withdrawAttachment } from "@/server/services/surveys";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "read");
    const { id, attachmentId } = await params;
    const file = await getAttachmentFile({ surveyId: id, attachmentId, actor: user });
    const bytes = await readFile(file.filePath);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "NOT_FOUND" ? 404 : msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "write");
    const { id, attachmentId } = await params;
    await withdrawAttachment({ surveyId: id, attachmentId, actor: user });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "LOCKED" ? 409 : msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
