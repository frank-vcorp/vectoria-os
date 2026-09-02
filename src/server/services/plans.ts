import { eq, asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { developmentPlans, developmentPlanPhases } from "@/server/db/schema";
import { parseDevelopmentPlanMarkdown } from "@/server/services/plan-parser";
import { writeAudit } from "@/server/services/audit";

export async function importDevelopmentPlan(params: {
  content: string;
  fileName?: string;
  userId?: string;
}) {
  const parsed = parseDevelopmentPlanMarkdown(params.content, params.fileName);
  const db = getDb();

  const [plan] = await db
    .insert(developmentPlans)
    .values({
      name: parsed.name,
      sourceFileName: params.fileName ?? null,
      version: parsed.version ?? null,
      createdBy: params.userId ?? null,
    })
    .returning();

  await db.insert(developmentPlanPhases).values(
    parsed.phases.map((p) => ({
      planId: plan.id,
      phaseNumber: p.phaseNumber,
      name: p.name,
      objective: p.objective,
      includes: p.includes,
      validationCriteria: p.validationCriteria || null,
    })),
  );

  await writeAudit({
    entity: "development_plan",
    entityId: plan.id,
    action: "create",
    userId: params.userId,
    payload: { fileName: params.fileName, phases: parsed.phases.length },
  });

  return { plan, phases: parsed.phases };
}

export async function listDevelopmentPlans() {
  const db = getDb();
  return db.select().from(developmentPlans).orderBy(asc(developmentPlans.createdAt));
}

export async function getDevelopmentPlanWithPhases(planId: string) {
  const db = getDb();
  const [plan] = await db
    .select()
    .from(developmentPlans)
    .where(eq(developmentPlans.id, planId))
    .limit(1);

  if (!plan) return null;

  const phases = await db
    .select()
    .from(developmentPlanPhases)
    .where(eq(developmentPlanPhases.planId, planId))
    .orderBy(asc(developmentPlanPhases.phaseNumber));

  return { plan, phases };
}
