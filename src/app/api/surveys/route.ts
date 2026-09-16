import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModule, requireUser } from "@/server/auth/session";
import {
  createSurvey,
  listAssignableUsers,
  listSurveys,
} from "@/server/services/surveys";
import { SURVEY_OPERATION_TYPES, SURVEY_STATUSES } from "@/shared/surveys";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "read");
    const { searchParams } = new URL(request.url);
    if (searchParams.get("assignees") === "1") {
      const assignees = await listAssignableUsers();
      return NextResponse.json({ assignees });
    }
    const surveys = await listSurveys({
      actor: user,
      search: searchParams.get("search") ?? undefined,
      quoteId: searchParams.get("quoteId") ?? undefined,
      projectId: searchParams.get("projectId") ?? undefined,
      serviceOrderId: searchParams.get("serviceOrderId") ?? undefined,
      type: (searchParams.get("type") as (typeof SURVEY_OPERATION_TYPES)[number] | null) ?? undefined,
      status: (searchParams.get("status") as (typeof SURVEY_STATUSES)[number] | null) ?? undefined,
      responsibleUserId: searchParams.get("responsibleUserId") ?? undefined,
    });
    return NextResponse.json({ surveys });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const createSchema = z.object({
  quoteId: z.string().uuid(),
  operationType: z.enum(SURVEY_OPERATION_TYPES),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "write");
    const body = createSchema.parse(await request.json());
    const survey = await createSurvey({ ...body, actor: user });
    return NextResponse.json({ survey }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    const status = msg === "QUOTE_NOT_FOUND" ? 404 : msg === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
