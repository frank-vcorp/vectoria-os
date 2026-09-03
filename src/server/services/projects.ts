import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogServices,
  clients,
  projectPhases,
  projects,
  serviceOrders,
  users,
} from "@/server/db/schema";
import type { ProjectPhaseStatus, ProjectStatus } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { nextFolio } from "@/server/services/folios";
import { parseDevelopmentPlanMarkdown } from "@/server/services/plan-parser";

export async function createProjectFromServiceOrder(params: {
  serviceOrderId: string;
  programmerId?: string | null;
  userId?: string;
}) {
  const db = getDb();
  const [os] = await db
    .select({
      id: serviceOrders.id,
      folio: serviceOrders.folio,
      clientId: serviceOrders.clientId,
      serviceId: serviceOrders.serviceId,
      description: serviceOrders.description,
      deliveryDate: serviceOrders.deliveryDate,
      generatesProject: catalogServices.generatesProject,
    })
    .from(serviceOrders)
    .innerJoin(catalogServices, eq(serviceOrders.serviceId, catalogServices.id))
    .where(eq(serviceOrders.id, params.serviceOrderId))
    .limit(1);

  if (!os) throw new Error("NOT_FOUND");
  if (!os.generatesProject) throw new Error("NO_PROJECT");

  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.serviceOrderId, params.serviceOrderId))
    .limit(1);
  if (existing) return existing;

  const folio = await nextFolio("proyecto");
  const [project] = await db
    .insert(projects)
    .values({
      folio,
      clientId: os.clientId,
      serviceOrderId: os.id,
      serviceId: os.serviceId,
      description: os.description,
      programmerId: params.programmerId ?? null,
      deliveryDate: os.deliveryDate,
      status: "en_progreso",
    })
    .returning({ id: projects.id, folio: projects.folio });

  await writeAudit({
    entity: "project",
    entityId: project.id,
    action: "create",
    userId: params.userId,
    payload: { serviceOrderId: os.id, folio: project.folio },
  });

  return project;
}

export async function importPlanToProject(params: {
  projectId: string;
  content: string;
  fileName?: string;
  userId?: string;
}) {
  const db = getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
  if (!project) throw new Error("NOT_FOUND");

  const parsed = parseDevelopmentPlanMarkdown(params.content, params.fileName);

  await db.delete(projectPhases).where(eq(projectPhases.projectId, params.projectId));

  const phaseRows = parsed.phases.map((p, i) => ({
    projectId: params.projectId,
    phaseNumber: p.phaseNumber,
    name: p.name,
    objective: p.objective,
    includes: p.includes,
    validationCriteria: p.validationCriteria || null,
    status: (i === 0 ? "disponible" : "bloqueada") as ProjectPhaseStatus,
    startedAt: i === 0 ? new Date() : null,
  }));

  await db.insert(projectPhases).values(phaseRows);

  await db
    .update(projects)
    .set({
      planSourceFileName: params.fileName ?? null,
      planImportedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, params.projectId));

  await writeAudit({
    entity: "project",
    entityId: params.projectId,
    action: "update",
    userId: params.userId,
    payload: { planImported: true, phases: parsed.phases.length },
  });

  return { phases: parsed.phases.length };
}

export async function listProjects() {
  const db = getDb();
  return db
    .select({
      id: projects.id,
      folio: projects.folio,
      clientId: projects.clientId,
      clientName: clients.name,
      serviceOrderId: projects.serviceOrderId,
      serviceOrderFolio: serviceOrders.folio,
      serviceName: catalogServices.name,
      programmerName: users.name,
      deliveryDate: projects.deliveryDate,
      status: projects.status,
      planImportedAt: projects.planImportedAt,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .innerJoin(serviceOrders, eq(projects.serviceOrderId, serviceOrders.id))
    .innerJoin(catalogServices, eq(projects.serviceId, catalogServices.id))
    .leftJoin(users, eq(projects.programmerId, users.id))
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: projects.id,
      folio: projects.folio,
      clientId: projects.clientId,
      clientName: clients.name,
      serviceOrderId: projects.serviceOrderId,
      serviceOrderFolio: serviceOrders.folio,
      serviceId: projects.serviceId,
      serviceName: catalogServices.name,
      description: projects.description,
      programmerId: projects.programmerId,
      programmerName: users.name,
      deliveryDate: projects.deliveryDate,
      status: projects.status,
      planSourceFileName: projects.planSourceFileName,
      planImportedAt: projects.planImportedAt,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .innerJoin(serviceOrders, eq(projects.serviceOrderId, serviceOrders.id))
    .innerJoin(catalogServices, eq(projects.serviceId, catalogServices.id))
    .leftJoin(users, eq(projects.programmerId, users.id))
    .where(eq(projects.id, id))
    .limit(1);
  return row ?? null;
}

export async function listProjectPhases(projectId: string) {
  const db = getDb();
  return db
    .select()
    .from(projectPhases)
    .where(eq(projectPhases.projectId, projectId))
    .orderBy(asc(projectPhases.phaseNumber));
}

export async function updateProject(params: {
  id: string;
  programmerId?: string | null;
  status?: ProjectStatus;
  userId?: string;
}) {
  const db = getDb();
  const updates: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };
  if (params.programmerId !== undefined) updates.programmerId = params.programmerId;
  if (params.status) updates.status = params.status;

  const [project] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, params.id))
    .returning({ id: projects.id, folio: projects.folio, status: projects.status });

  if (!project) throw new Error("NOT_FOUND");

  await writeAudit({
    entity: "project",
    entityId: project.id,
    action: "update",
    userId: params.userId,
    payload: updates,
  });

  return project;
}

export async function advanceProjectPhase(params: { projectId: string; phaseId: string; userId?: string }) {
  const db = getDb();
  const phases = await listProjectPhases(params.projectId);
  const phase = phases.find((p) => p.id === params.phaseId);
  if (!phase) throw new Error("NOT_FOUND");
  if (phase.status !== "disponible") throw new Error("INVALID_STATUS");

  await db
    .update(projectPhases)
    .set({ status: "en_validacion", updatedAt: new Date() })
    .where(eq(projectPhases.id, params.phaseId));

  await writeAudit({
    entity: "project_phase",
    entityId: params.phaseId,
    action: "update",
    userId: params.userId,
    payload: { status: "en_validacion" },
  });
}

export async function validateProjectPhase(params: {
  projectId: string;
  phaseId: string;
  notes?: string;
  userId?: string;
}) {
  const db = getDb();
  const phases = await listProjectPhases(params.projectId);
  const phase = phases.find((p) => p.id === params.phaseId);
  if (!phase) throw new Error("NOT_FOUND");
  if (phase.status !== "en_validacion") throw new Error("INVALID_STATUS");

  await db
    .update(projectPhases)
    .set({
      status: "validada",
      validatedAt: new Date(),
      validationNotes: params.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(projectPhases.id, params.phaseId));

  const next = phases.find((p) => p.phaseNumber === phase.phaseNumber + 1);
  if (next) {
    await db
      .update(projectPhases)
      .set({ status: "disponible", startedAt: new Date(), updatedAt: new Date() })
      .where(eq(projectPhases.id, next.id));
  } else {
    await db
      .update(projects)
      .set({ status: "terminado", updatedAt: new Date() })
      .where(eq(projects.id, params.projectId));
  }

  await writeAudit({
    entity: "project_phase",
    entityId: params.phaseId,
    action: "validate",
    userId: params.userId,
    payload: { validated: true },
  });
}

export async function returnProjectPhase(params: {
  projectId: string;
  phaseId: string;
  notes?: string;
  userId?: string;
}) {
  const db = getDb();
  const phases = await listProjectPhases(params.projectId);
  const phase = phases.find((p) => p.id === params.phaseId);
  if (!phase) throw new Error("NOT_FOUND");
  if (phase.status !== "en_validacion") throw new Error("INVALID_STATUS");

  await db
    .update(projectPhases)
    .set({
      status: "disponible",
      validationNotes: params.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(projectPhases.id, params.phaseId));

  await writeAudit({
    entity: "project_phase",
    entityId: params.phaseId,
    action: "update",
    userId: params.userId,
    payload: { returned: true },
  });
}
