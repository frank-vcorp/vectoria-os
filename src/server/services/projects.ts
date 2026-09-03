import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  catalogServices,
  clients,
  projectPhaseChecks,
  projectPhases,
  projects,
  serviceOrders,
  users,
} from "@/server/db/schema";
import type { ProjectPhaseStatus, ProjectStatus } from "@/shared/commercial";
import { writeAudit } from "@/server/services/audit";
import { nextFolio } from "@/server/services/folios";
import { folioOrClientNameFilter } from "@/server/services/list-search";
import { parseValidationPlanMarkdown } from "@/server/services/plan-parser";

export type PhaseWithChecks = {
  id: string;
  phaseNumber: number;
  name: string;
  objective: string;
  expectedResult: string;
  status: ProjectPhaseStatus;
  startedAt: Date | null;
  validatedAt: Date | null;
  validationNotes: string | null;
  evidenceNotes: string | null;
  checks: {
    id: string;
    sortOrder: number;
    text: string;
    checked: boolean;
    notApplicable: boolean;
  }[];
};

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
      programmerId: serviceOrders.programmerId,
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
      programmerId: params.programmerId ?? os.programmerId ?? null,
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

export async function getProjectByServiceOrderId(serviceOrderId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: projects.id, folio: projects.folio, status: projects.status })
    .from(projects)
    .where(eq(projects.serviceOrderId, serviceOrderId))
    .limit(1);
  return row ?? null;
}

export async function syncProjectFromServiceOrder(params: {
  serviceOrderId: string;
  programmerId?: string | null;
  deliveryDate?: Date;
}) {
  const db = getDb();
  const updates: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };
  if (params.programmerId !== undefined) updates.programmerId = params.programmerId;
  if (params.deliveryDate) updates.deliveryDate = params.deliveryDate;
  await db.update(projects).set(updates).where(eq(projects.serviceOrderId, params.serviceOrderId));
}

/** @deprecated Use syncProjectFromServiceOrder */
export async function syncProjectProgrammerFromServiceOrder(serviceOrderId: string, programmerId: string | null) {
  await syncProjectFromServiceOrder({ serviceOrderId, programmerId });
}

export async function importPlanToProject(params: {
  projectId: string;
  content: string;
  fileName?: string;
  userId?: string;
  replace?: boolean;
}) {
  const db = getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
  if (!project) throw new Error("NOT_FOUND");

  const existingPhases = await listProjectPhases(params.projectId);
  if (existingPhases.length > 0 && !params.replace) throw new Error("PLAN_EXISTS");

  const parsed = parseValidationPlanMarkdown(params.content);
  const hadPhases = existingPhases.length > 0;

  await db.delete(projectPhases).where(eq(projectPhases.projectId, params.projectId));

  for (const p of parsed.phases) {
    const [phase] = await db
      .insert(projectPhases)
      .values({
        projectId: params.projectId,
        phaseNumber: p.phaseNumber,
        name: p.name,
        objective: p.objective,
        includes: "",
        validationCriteria: p.expectedResult,
        status: (p.phaseNumber === 1 ? "disponible" : "bloqueada") as ProjectPhaseStatus,
        startedAt: p.phaseNumber === 1 ? new Date() : null,
      })
      .returning({ id: projectPhases.id });

    await db.insert(projectPhaseChecks).values(
      p.checks.map((check) => ({
        phaseId: phase.id,
        sortOrder: check.sortOrder,
        text: check.text,
      })),
    );
  }

  await db
    .update(projects)
    .set({
      planSourceFileName: params.fileName ?? null,
      planImportedAt: new Date(),
      planVersion: parsed.version,
      planName: parsed.name,
      planDiscovery: parsed.discovery,
      checklistRequired: parsed.checklistRequired,
      status: "en_progreso",
      updatedAt: new Date(),
    })
    .where(eq(projects.id, params.projectId));

  await writeAudit({
    entity: "project",
    entityId: params.projectId,
    action: "update",
    userId: params.userId,
    payload: {
      planImported: true,
      phases: parsed.phases.length,
      replaced: hadPhases,
      progressReset: hadPhases,
    },
  });

  return { phases: parsed.phases.length, progressReset: hadPhases };
}

export async function listProjects(programmerId?: string | null, search?: string) {
  const db = getDb();
  const baseQuery = db
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
    .leftJoin(users, eq(projects.programmerId, users.id));

  const searchFilter = folioOrClientNameFilter(search, projects.folio, clients.name);
  const filters = [
    searchFilter,
    programmerId ? eq(projects.programmerId, programmerId) : undefined,
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  if (filters.length > 0) {
    return baseQuery.where(and(...filters)).orderBy(desc(projects.createdAt));
  }

  return baseQuery.orderBy(desc(projects.createdAt));
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
      planVersion: projects.planVersion,
      planName: projects.planName,
      planDiscovery: projects.planDiscovery,
      checklistRequired: projects.checklistRequired,
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

export async function listProjectPhasesWithChecks(projectId: string): Promise<PhaseWithChecks[]> {
  const phases = await listProjectPhases(projectId);
  if (phases.length === 0) return [];

  const db = getDb();
  const phaseIds = phases.map((p) => p.id);
  const checks = await db
    .select()
    .from(projectPhaseChecks)
    .where(inArray(projectPhaseChecks.phaseId, phaseIds))
    .orderBy(asc(projectPhaseChecks.sortOrder));

  const checksByPhase = new Map<string, typeof checks>();
  for (const check of checks) {
    const list = checksByPhase.get(check.phaseId) ?? [];
    list.push(check);
    checksByPhase.set(check.phaseId, list);
  }

  return phases.map((phase) => ({
    id: phase.id,
    phaseNumber: phase.phaseNumber,
    name: phase.name,
    objective: phase.objective,
    expectedResult: phase.validationCriteria ?? "",
    status: phase.status,
    startedAt: phase.startedAt,
    validatedAt: phase.validatedAt,
    validationNotes: phase.validationNotes,
    evidenceNotes: phase.evidenceNotes,
    checks: (checksByPhase.get(phase.id) ?? []).map((c) => ({
      id: c.id,
      sortOrder: c.sortOrder,
      text: c.text,
      checked: c.checked,
      notApplicable: c.notApplicable,
    })),
  }));
}

function pendingChecksForPhase(phase: PhaseWithChecks) {
  return phase.checks.filter((c) => !c.checked && !c.notApplicable);
}

export async function updatePhaseEvidence(params: {
  projectId: string;
  phaseId: string;
  evidenceNotes: string | null;
  userId?: string;
}) {
  const db = getDb();
  const phases = await listProjectPhases(params.projectId);
  const phase = phases.find((p) => p.id === params.phaseId);
  if (!phase) throw new Error("NOT_FOUND");
  if (phase.status === "bloqueada" || phase.status === "validada") throw new Error("INVALID_STATUS");

  await db
    .update(projectPhases)
    .set({ evidenceNotes: params.evidenceNotes?.trim() || null, updatedAt: new Date() })
    .where(eq(projectPhases.id, params.phaseId));

  await writeAudit({
    entity: "project_phase",
    entityId: params.phaseId,
    action: "update",
    userId: params.userId,
    payload: { evidenceUpdated: true },
  });
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

export async function togglePhaseCheck(params: {
  projectId: string;
  checkId: string;
  checked?: boolean;
  notApplicable?: boolean;
  userId?: string;
}) {
  const db = getDb();
  const phases = await listProjectPhases(params.projectId);
  const phaseIds = new Set(phases.map((p) => p.id));

  const [check] = await db
    .select()
    .from(projectPhaseChecks)
    .where(eq(projectPhaseChecks.id, params.checkId))
    .limit(1);
  if (!check || !phaseIds.has(check.phaseId)) throw new Error("NOT_FOUND");

  const phase = phases.find((p) => p.id === check.phaseId);
  if (!phase || phase.status === "bloqueada" || phase.status === "validada") {
    throw new Error("INVALID_STATUS");
  }

  const updates: Partial<typeof projectPhaseChecks.$inferInsert> = { updatedAt: new Date() };
  if (params.checked !== undefined) {
    updates.checked = params.checked;
    if (params.checked) updates.notApplicable = false;
  }
  if (params.notApplicable !== undefined) {
    updates.notApplicable = params.notApplicable;
    if (params.notApplicable) updates.checked = false;
  }

  await db.update(projectPhaseChecks).set(updates).where(eq(projectPhaseChecks.id, params.checkId));

  await writeAudit({
    entity: "project_phase_check",
    entityId: params.checkId,
    action: "update",
    userId: params.userId,
    payload: updates,
  });
}

export async function advanceProjectPhase(params: {
  projectId: string;
  phaseId: string;
  userId?: string;
  force?: boolean;
}) {
  const db = getDb();
  const phases = await listProjectPhasesWithChecks(params.projectId);
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
  if (next && next.status === "bloqueada") {
    await db
      .update(projectPhases)
      .set({ status: "disponible", startedAt: next.startedAt ?? new Date(), updatedAt: new Date() })
      .where(eq(projectPhases.id, next.id));
  }

  const refreshed = await listProjectPhases(params.projectId);
  if (refreshed.every((p) => p.status === "validada")) {
    await db
      .update(projects)
      .set({ status: "terminado", updatedAt: new Date() })
      .where(eq(projects.id, params.projectId));
  } else {
    await db
      .update(projects)
      .set({ status: "en_progreso", updatedAt: new Date() })
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

  await db
    .update(projects)
    .set({ status: "en_progreso", updatedAt: new Date() })
    .where(eq(projects.id, params.projectId));

  await writeAudit({
    entity: "project_phase",
    entityId: params.phaseId,
    action: "update",
    userId: params.userId,
    payload: { returned: true },
  });
}

export async function unlockNextProjectPhase(params: {
  projectId: string;
  fromPhaseId: string;
  userId?: string;
}) {
  const db = getDb();
  const phases = await listProjectPhases(params.projectId);
  const current = phases.find((p) => p.id === params.fromPhaseId);
  if (!current) throw new Error("NOT_FOUND");

  const next = phases.find((p) => p.phaseNumber === current.phaseNumber + 1);
  if (!next) throw new Error("NO_NEXT_PHASE");
  if (next.status !== "bloqueada") throw new Error("ALREADY_UNLOCKED");

  await db
    .update(projectPhases)
    .set({
      status: "disponible",
      startedAt: next.startedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(projectPhases.id, next.id));

  await writeAudit({
    entity: "project_phase",
    entityId: next.id,
    action: "update",
    userId: params.userId,
    payload: { unlockedWithoutValidation: true, fromPhaseId: params.fromPhaseId },
  });
}
