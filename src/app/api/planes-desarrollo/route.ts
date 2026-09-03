import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { importDevelopmentPlan, listDevelopmentPlans } from "@/server/services/plans";

export async function GET() {
  try {
    const user = await requireUser();
    await requireModule(user, "proyectos", "read");
    const plans = await listDevelopmentPlans();
    return NextResponse.json({ plans });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const postSchema = z.object({
  content: z.string().min(1),
  fileName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "proyectos", "write");
    const body = postSchema.parse(await request.json());
    const result = await importDevelopmentPlan({
      content: body.content,
      fileName: body.fileName,
      userId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
