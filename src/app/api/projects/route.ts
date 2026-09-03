import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { PROJECT_STATUSES } from "@/shared/commercial";
import {
  advanceProjectPhase,
  getProjectById,
  importPlanToProject,
  listProjectPhases,
  listProjects,
  returnProjectPhase,
  updateProject,
  validateProjectPhase,
} from "@/server/services/projects";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "proyectos", "read");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const project = await getProjectById(id);
      if (!project) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      const phases = await listProjectPhases(id);
      return NextResponse.json({ project, phases });
    }

    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    id: z.string().uuid(),
    programmerId: z.string().uuid().nullable().optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
  }),
  z.object({
    action: z.literal("import_plan"),
    id: z.string().uuid(),
    content: z.string().min(1),
    fileName: z.string().optional(),
  }),
  z.object({
    action: z.literal("advance_phase"),
    projectId: z.string().uuid(),
    phaseId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("validate_phase"),
    projectId: z.string().uuid(),
    phaseId: z.string().uuid(),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("return_phase"),
    projectId: z.string().uuid(),
    phaseId: z.string().uuid(),
    notes: z.string().optional(),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "proyectos", "write");
    const body = patchSchema.parse(await request.json());

    if (body.action === "update") {
      const project = await updateProject({
        id: body.id,
        programmerId: body.programmerId,
        status: body.status,
        userId: user.id,
      });
      return NextResponse.json({ project });
    }

    if (body.action === "import_plan") {
      const result = await importPlanToProject({
        projectId: body.id,
        content: body.content,
        fileName: body.fileName,
        userId: user.id,
      });
      const phases = await listProjectPhases(body.id);
      return NextResponse.json({ result, phases });
    }

    if (body.action === "advance_phase") {
      await advanceProjectPhase({ projectId: body.projectId, phaseId: body.phaseId, userId: user.id });
      const phases = await listProjectPhases(body.projectId);
      return NextResponse.json({ phases });
    }

    if (body.action === "validate_phase") {
      await validateProjectPhase({
        projectId: body.projectId,
        phaseId: body.phaseId,
        notes: body.notes,
        userId: user.id,
      });
      const phases = await listProjectPhases(body.projectId);
      return NextResponse.json({ phases });
    }

    await returnProjectPhase({
      projectId: body.projectId,
      phaseId: body.phaseId,
      notes: body.notes,
      userId: user.id,
    });
    const phases = await listProjectPhases(body.projectId);
    return NextResponse.json({ phases });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    const status = msg === "NOT_FOUND" ? 404 : msg === "INVALID_STATUS" ? 409 : msg === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
