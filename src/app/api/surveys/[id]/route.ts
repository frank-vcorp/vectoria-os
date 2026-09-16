import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModule, requireUser } from "@/server/auth/session";
import {
  changeOperationType,
  changeQuote,
  finalizeSurvey,
  getSurveyById,
  markSectionReviewed,
  reopenSurvey,
  reassignResponsible,
  updateSurvey,
} from "@/server/services/surveys";
import { SURVEY_OPERATION_TYPES } from "@/shared/surveys";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", "read");
    const { id } = await params;
    const survey = await getSurveyById(id, user);
    if (!survey) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ survey });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    expectedUpdatedAt: z.string().min(1),
    answers: z.any().optional(),
    sectionStates: z.any().optional(),
    interviewDate: z.string().nullable().optional(),
    correspondenceReviewed: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("review_section"),
    expectedUpdatedAt: z.string().min(1),
    sectionId: z.string().min(1),
    pending: z.boolean(),
  }),
  z.object({ action: z.literal("finalize"), expectedUpdatedAt: z.string().min(1) }),
  z.object({ action: z.literal("reopen") }),
  z.object({
    action: z.literal("change_type"),
    expectedUpdatedAt: z.string().min(1),
    operationType: z.enum(SURVEY_OPERATION_TYPES),
  }),
  z.object({
    action: z.literal("change_quote"),
    expectedUpdatedAt: z.string().min(1),
    quoteId: z.string().uuid(),
  }),
  z.object({ action: z.literal("reassign"), userId: z.string().uuid() }),
]);

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "levantamientos", user.role === "programador" ? "read" : "write");
    const { id } = await params;
    const body = patchSchema.parse(await request.json());

    if (body.action === "save") {
      const survey = await updateSurvey({ id, actor: user, ...body });
      return NextResponse.json({ survey });
    }
    if (body.action === "review_section") {
      const survey = await markSectionReviewed({ id, actor: user, ...body });
      return NextResponse.json({ survey });
    }
    if (body.action === "finalize") {
      const survey = await finalizeSurvey({ id, actor: user, expectedUpdatedAt: body.expectedUpdatedAt });
      return NextResponse.json({ survey });
    }
    if (body.action === "reopen") {
      const survey = await reopenSurvey({ id, actor: user });
      return NextResponse.json({ survey });
    }
    if (body.action === "change_type") {
      const survey = await changeOperationType({ id, actor: user, ...body });
      return NextResponse.json({ survey });
    }
    if (body.action === "change_quote") {
      const survey = await changeQuote({ id, actor: user, ...body });
      return NextResponse.json({ survey });
    }
    const survey = await reassignResponsible({ id, actor: user, userId: body.userId });
    return NextResponse.json({ survey });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND" || msg === "QUOTE_NOT_FOUND"
        ? 404
        : msg === "CONFLICT" ||
            msg === "LOCKED" ||
            msg === "SECTIONS_UNREVIEWED" ||
            msg === "CORRESPONDENCE_REQUIRED" ||
            msg === "INVALID_STATUS" ||
            msg === "INVALID_ASSIGNEE"
          ? 409
          : msg === "UNAUTHORIZED"
            ? 401
            : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
