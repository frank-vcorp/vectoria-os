import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getDb } from "@/server/db";
import {
  catalogServices,
  clients,
  projects,
  quotes,
  serviceOrders,
  surveyAttachments,
  surveys,
  users,
} from "@/server/db/schema";
import type { User } from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";
import { nextFolio } from "@/server/services/folios";
import { getQuoteById } from "@/server/services/quotes";
import { getSurveyTemplate, listReviewableSections } from "@/shared/survey-templates";
import {
  emptyAnswers,
  hasInterviewContent,
  hasOperationContent,
  SURVEY_ATTACHMENT_MAX_BYTES,
  SURVEY_ATTACHMENT_TYPES,
  TEMPLATE_VERSION,
  type ArchivedOperation,
  type FieldAnswer,
  type QuoteLinkHistory,
  type SectionProgress,
  type SectionStateMap,
  type SurveyAnswers,
  type SurveyOperationType,
  type SurveyStatus,
} from "@/shared/surveys";

export type SurveyActor = Pick<User, "id" | "role">;

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads", "levantamientos");

function defaultSectionStates(type: SurveyOperationType): SectionStateMap {
  return Object.fromEntries(listReviewableSections(type).map((section) => [section.id, { status: "sin_revisar" as const }]));
}

export async function listRelatedSurveyQuoteIdsForProgrammer(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ quoteId: serviceOrders.quoteId })
    .from(projects)
    .innerJoin(serviceOrders, eq(projects.serviceOrderId, serviceOrders.id))
    .where(and(eq(projects.programmerId, userId), sql`${serviceOrders.quoteId} is not null`));
  return rows.map((row) => row.quoteId).filter((id): id is string => Boolean(id));
}

export async function canAccessSurvey(actor: SurveyActor, survey: { quoteId: string }) {
  if (actor.role === "administrador" || actor.role === "vendedor") return true;
  if (actor.role !== "programador") return false;
  const allowed = await listRelatedSurveyQuoteIdsForProgrammer(actor.id);
  return allowed.includes(survey.quoteId);
}

export async function canWriteSurvey(actor: SurveyActor) {
  return actor.role === "administrador" || actor.role === "vendedor";
}

export async function listAssignableUsers() {
  const db = getDb();
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.status, "activo"), inArray(users.role, ["administrador", "vendedor"])))
    .orderBy(users.name);
}

export async function listSurveys(params: {
  actor: SurveyActor;
  search?: string;
  quoteId?: string;
  projectId?: string;
  serviceOrderId?: string;
  type?: SurveyOperationType;
  status?: SurveyStatus;
  responsibleUserId?: string;
}) {
  const db = getDb();
  const filters = [];
  if (params.quoteId) filters.push(eq(surveys.quoteId, params.quoteId));
  if (params.type) filters.push(eq(surveys.operationType, params.type));
  if (params.status) filters.push(eq(surveys.status, params.status));
  if (params.responsibleUserId) filters.push(eq(surveys.responsibleUserId, params.responsibleUserId));
  if (params.search?.trim()) {
    const pattern = `%${params.search.trim()}%`;
    filters.push(or(ilike(surveys.folio, pattern), ilike(clients.name, pattern), ilike(quotes.folio, pattern)));
  }
  if (params.projectId) {
    const [project] = await db
      .select({ quoteId: serviceOrders.quoteId })
      .from(projects)
      .innerJoin(serviceOrders, eq(projects.serviceOrderId, serviceOrders.id))
      .where(eq(projects.id, params.projectId))
      .limit(1);
    if (!project?.quoteId) return [];
    filters.push(eq(surveys.quoteId, project.quoteId));
  }
  if (params.serviceOrderId) {
    const [order] = await db
      .select({ quoteId: serviceOrders.quoteId })
      .from(serviceOrders)
      .where(eq(serviceOrders.id, params.serviceOrderId))
      .limit(1);
    if (!order?.quoteId) return [];
    filters.push(eq(surveys.quoteId, order.quoteId));
  }
  if (params.actor.role === "programador") {
    const allowed = await listRelatedSurveyQuoteIdsForProgrammer(params.actor.id);
    if (allowed.length === 0) return [];
    filters.push(inArray(surveys.quoteId, allowed));
  }

  const rows = await db
    .select({
      id: surveys.id,
      folio: surveys.folio,
      quoteId: surveys.quoteId,
      quoteFolio: quotes.folio,
      quoteStatus: quotes.status,
      clientId: surveys.clientId,
      clientName: clients.name,
      operationType: surveys.operationType,
      responsibleUserId: surveys.responsibleUserId,
      responsibleName: users.name,
      status: surveys.status,
      updatedAt: surveys.updatedAt,
      createdAt: surveys.createdAt,
    })
    .from(surveys)
    .innerJoin(quotes, eq(surveys.quoteId, quotes.id))
    .innerJoin(clients, eq(surveys.clientId, clients.id))
    .innerJoin(users, eq(surveys.responsibleUserId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(surveys.updatedAt));

  return rows;
}

export async function getSurveyById(id: string, actor: SurveyActor) {
  const db = getDb();
  const [row] = await db
    .select({
      id: surveys.id,
      folio: surveys.folio,
      quoteId: surveys.quoteId,
      quoteFolio: quotes.folio,
      quoteStatus: quotes.status,
      clientId: surveys.clientId,
      clientName: clients.name,
      liveClientId: quotes.clientId,
      operationType: surveys.operationType,
      responsibleUserId: surveys.responsibleUserId,
      responsibleName: users.name,
      status: surveys.status,
      interviewDate: surveys.interviewDate,
      transversalTemplateVersion: surveys.transversalTemplateVersion,
      operationTemplateVersion: surveys.operationTemplateVersion,
      answers: surveys.answers,
      sectionStates: surveys.sectionStates,
      archivedOperations: surveys.archivedOperations,
      quoteLinkHistory: surveys.quoteLinkHistory,
      correspondenceReviewRequired: surveys.correspondenceReviewRequired,
      correspondenceReviewed: surveys.correspondenceReviewed,
      revisionNumber: surveys.revisionNumber,
      lastFinalizedAt: surveys.lastFinalizedAt,
      exportRevision: surveys.exportRevision,
      createdAt: surveys.createdAt,
      updatedAt: surveys.updatedAt,
      serviceName: catalogServices.name,
      quoteDescription: quotes.description,
    })
    .from(surveys)
    .innerJoin(quotes, eq(surveys.quoteId, quotes.id))
    .innerJoin(clients, eq(surveys.clientId, clients.id))
    .innerJoin(users, eq(surveys.responsibleUserId, users.id))
    .innerJoin(catalogServices, eq(quotes.serviceId, catalogServices.id))
    .where(eq(surveys.id, id))
    .limit(1);

  if (!row) return null;
  if (!(await canAccessSurvey(actor, row))) throw new Error("FORBIDDEN");

  const [liveClient] = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, row.liveClientId))
    .limit(1);

  const related = await db
    .select({
      serviceOrderId: serviceOrders.id,
      serviceOrderFolio: serviceOrders.folio,
      projectId: projects.id,
      projectFolio: projects.folio,
    })
    .from(serviceOrders)
    .leftJoin(projects, eq(projects.serviceOrderId, serviceOrders.id))
    .where(eq(serviceOrders.quoteId, row.quoteId));

  const attachments = await listAttachments(id, false);
  return {
    ...row,
    liveClientName: liveClient?.name ?? row.clientName,
    clientIdentityChanged: row.clientId !== row.liveClientId,
    related,
    attachments,
    canWrite: await canWriteSurvey(actor),
  };
}

export async function createSurvey(params: {
  quoteId: string;
  operationType: SurveyOperationType;
  actor: SurveyActor;
}) {
  if (!(await canWriteSurvey(params.actor))) throw new Error("FORBIDDEN");
  const quote = await getQuoteById(params.quoteId);
  if (!quote) throw new Error("QUOTE_NOT_FOUND");

  const template = getSurveyTemplate(params.operationType);
  const db = getDb();
  const folio = await nextFolio("levantamiento");
  const [created] = await db
    .insert(surveys)
    .values({
      folio,
      quoteId: quote.id,
      clientId: quote.clientId,
      operationType: params.operationType,
      responsibleUserId: params.actor.id,
      status: "borrador",
      transversalTemplateVersion: template.transversalVersion,
      operationTemplateVersion: template.operationVersion,
      answers: emptyAnswers(),
      sectionStates: defaultSectionStates(params.operationType),
      createdBy: params.actor.id,
      updatedBy: params.actor.id,
    })
    .returning({ id: surveys.id, folio: surveys.folio });

  await writeAudit({
    entity: "survey",
    entityId: created.id,
    action: "create",
    userId: params.actor.id,
    payload: { folio: created.folio, quoteId: quote.id, operationType: params.operationType },
  });
  return created;
}

function assertEditable(status: SurveyStatus) {
  if (status === "finalizado") throw new Error("LOCKED");
}

function mergeAnswers(current: SurveyAnswers, incoming?: SurveyAnswers): SurveyAnswers {
  if (!incoming) return current;
  return { fields: { ...current.fields, ...incoming.fields } };
}

function normalizeSectionStates(type: SurveyOperationType, incoming?: SectionStateMap): SectionStateMap {
  const base = defaultSectionStates(type);
  if (!incoming) return base;
  return { ...base, ...incoming };
}

function applyApplicability(type: SurveyOperationType, answers: SurveyAnswers, states: SectionStateMap) {
  const template = getSurveyTemplate(type);
  for (const section of template.sections) {
    if (!section.applicabilityFieldId) continue;
    const value = answers.fields[section.applicabilityFieldId]?.choice;
    if (value === "no_aplica") {
      states[section.id] = { status: "no_aplica" };
    } else if (states[section.id]?.status === "no_aplica") {
      states[section.id] = { status: "en_captura" };
    }
  }
  return states;
}

function nextStatus(current: SurveyStatus, answers: SurveyAnswers): SurveyStatus {
  if (current === "finalizado") return current;
  if (current === "borrador" && hasInterviewContent(answers)) return "en_captura";
  return current;
}

export async function updateSurvey(params: {
  id: string;
  actor: SurveyActor;
  expectedUpdatedAt: string;
  answers?: SurveyAnswers;
  sectionStates?: SectionStateMap;
  interviewDate?: string | null;
  correspondenceReviewed?: boolean;
}) {
  if (!(await canWriteSurvey(params.actor))) throw new Error("FORBIDDEN");
  const existing = await getSurveyById(params.id, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  assertEditable(existing.status);
  if (new Date(existing.updatedAt).toISOString() !== new Date(params.expectedUpdatedAt).toISOString()) {
    throw new Error("CONFLICT");
  }

  const answers = mergeAnswers(existing.answers, params.answers);
  let sectionStates = normalizeSectionStates(existing.operationType, params.sectionStates ?? existing.sectionStates);
  sectionStates = applyApplicability(existing.operationType, answers, sectionStates);
  const status = nextStatus(existing.status, answers);
  const interviewDate =
    params.interviewDate === undefined
      ? existing.interviewDate
      : params.interviewDate
        ? new Date(params.interviewDate)
        : null;

  const db = getDb();
  const [updated] = await db
    .update(surveys)
    .set({
      answers,
      sectionStates,
      status,
      interviewDate,
      correspondenceReviewed: params.correspondenceReviewed ?? existing.correspondenceReviewed,
      updatedAt: new Date(),
      updatedBy: params.actor.id,
    })
    .where(eq(surveys.id, params.id))
    .returning({ id: surveys.id, updatedAt: surveys.updatedAt, status: surveys.status });

  await writeAudit({
    entity: "survey",
    entityId: params.id,
    action: "update",
    userId: params.actor.id,
    payload: { kind: "capture", status: updated.status },
  });
  return getSurveyById(params.id, params.actor);
}

export async function markSectionReviewed(params: {
  id: string;
  actor: SurveyActor;
  expectedUpdatedAt: string;
  sectionId: string;
  pending: boolean;
}) {
  const existing = await getSurveyById(params.id, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  const nextStates = { ...existing.sectionStates };
  const current = nextStates[params.sectionId];
  if (current?.status === "no_aplica") {
    return existing;
  }
  nextStates[params.sectionId] = { status: params.pending ? "con_pendientes" : "revisada" };
  return updateSurvey({
    id: params.id,
    actor: params.actor,
    expectedUpdatedAt: params.expectedUpdatedAt,
    sectionStates: nextStates,
  });
}

function unfinishedSections(type: SurveyOperationType, states: SectionStateMap, answers: SurveyAnswers) {
  return listReviewableSections(type).filter((section) => {
    const applicability = section.applicabilityFieldId
      ? answers.fields[section.applicabilityFieldId]?.choice
      : undefined;
    if (applicability === "no_aplica") return false;
    const status = states[section.id]?.status;
    return status !== "revisada" && status !== "con_pendientes" && status !== "no_aplica";
  });
}

export async function finalizeSurvey(params: { id: string; actor: SurveyActor; expectedUpdatedAt: string }) {
  if (!(await canWriteSurvey(params.actor))) throw new Error("FORBIDDEN");
  const existing = await getSurveyById(params.id, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  assertEditable(existing.status);
  if (new Date(existing.updatedAt).toISOString() !== new Date(params.expectedUpdatedAt).toISOString()) {
    throw new Error("CONFLICT");
  }
  if (existing.clientIdentityChanged && !existing.correspondenceReviewed) {
    throw new Error("CORRESPONDENCE_REQUIRED");
  }
  const pending = unfinishedSections(existing.operationType, existing.sectionStates, existing.answers);
  if (pending.length > 0) throw new Error("SECTIONS_UNREVIEWED");

  const db = getDb();
  await db
    .update(surveys)
    .set({
      status: "finalizado",
      revisionNumber: existing.revisionNumber + 1,
      lastFinalizedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: params.actor.id,
    })
    .where(eq(surveys.id, params.id));

  await writeAudit({
    entity: "survey",
    entityId: params.id,
    action: "validate",
    userId: params.actor.id,
    payload: { kind: "finalize", revision: existing.revisionNumber + 1 },
  });
  return getSurveyById(params.id, params.actor);
}

export async function reopenSurvey(params: { id: string; actor: SurveyActor }) {
  if (!(await canWriteSurvey(params.actor))) throw new Error("FORBIDDEN");
  const existing = await getSurveyById(params.id, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status !== "finalizado") throw new Error("INVALID_STATUS");

  const db = getDb();
  await db
    .update(surveys)
    .set({
      status: "en_captura",
      updatedAt: new Date(),
      updatedBy: params.actor.id,
    })
    .where(eq(surveys.id, params.id));

  await writeAudit({
    entity: "survey",
    entityId: params.id,
    action: "update",
    userId: params.actor.id,
    payload: { kind: "reopen", previousRevision: existing.revisionNumber },
  });
  return getSurveyById(params.id, params.actor);
}

export async function changeOperationType(params: {
  id: string;
  actor: SurveyActor;
  expectedUpdatedAt: string;
  operationType: SurveyOperationType;
}) {
  if (!(await canWriteSurvey(params.actor))) throw new Error("FORBIDDEN");
  const existing = await getSurveyById(params.id, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  assertEditable(existing.status);
  if (new Date(existing.updatedAt).toISOString() !== new Date(params.expectedUpdatedAt).toISOString()) {
    throw new Error("CONFLICT");
  }
  if (existing.operationType === params.operationType) return existing;

  const archive: ArchivedOperation[] = [...existing.archivedOperations];
  if (hasOperationContent(existing.answers)) {
    const operationFields = Object.fromEntries(
      Object.entries(existing.answers.fields).filter(([key]) => key.startsWith("op.")),
    );
    archive.push({
      type: existing.operationType,
      templateVersion: existing.operationTemplateVersion,
      answers: { fields: operationFields },
      archivedAt: new Date().toISOString(),
    });
  }

  const keptFields = Object.fromEntries(
    Object.entries(existing.answers.fields).filter(([key]) => !key.startsWith("op.")),
  );
  const template = getSurveyTemplate(params.operationType);
  const sectionStates = applyApplicability(
    params.operationType,
    { fields: keptFields },
    defaultSectionStates(params.operationType),
  );

  const db = getDb();
  await db
    .update(surveys)
    .set({
      operationType: params.operationType,
      operationTemplateVersion: template.operationVersion,
      answers: { fields: keptFields },
      sectionStates,
      archivedOperations: archive,
      updatedAt: new Date(),
      updatedBy: params.actor.id,
    })
    .where(eq(surveys.id, params.id));

  await writeAudit({
    entity: "survey",
    entityId: params.id,
    action: "update",
    userId: params.actor.id,
    payload: { kind: "change_type", from: existing.operationType, to: params.operationType },
  });
  return getSurveyById(params.id, params.actor);
}

export async function changeQuote(params: {
  id: string;
  actor: SurveyActor;
  expectedUpdatedAt: string;
  quoteId: string;
}) {
  if (!(await canWriteSurvey(params.actor))) throw new Error("FORBIDDEN");
  const existing = await getSurveyById(params.id, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  assertEditable(existing.status);
  if (new Date(existing.updatedAt).toISOString() !== new Date(params.expectedUpdatedAt).toISOString()) {
    throw new Error("CONFLICT");
  }
  const quote = await getQuoteById(params.quoteId);
  if (!quote) throw new Error("QUOTE_NOT_FOUND");

  const history: QuoteLinkHistory[] = [
    ...existing.quoteLinkHistory,
    {
      quoteId: existing.quoteId,
      quoteFolio: existing.quoteFolio,
      clientId: existing.clientId,
      clientName: existing.clientName,
      changedAt: new Date().toISOString(),
    },
  ];

  const db = getDb();
  await db
    .update(surveys)
    .set({
      quoteId: quote.id,
      clientId: quote.clientId,
      quoteLinkHistory: history,
      correspondenceReviewRequired: true,
      correspondenceReviewed: false,
      updatedAt: new Date(),
      updatedBy: params.actor.id,
    })
    .where(eq(surveys.id, params.id));

  await writeAudit({
    entity: "survey",
    entityId: params.id,
    action: "update",
    userId: params.actor.id,
    payload: {
      kind: "change_quote",
      from: existing.quoteFolio,
      to: quote.folio,
      fromClient: existing.clientName,
      toClient: quote.clientName,
    },
  });
  return getSurveyById(params.id, params.actor);
}

export async function reassignResponsible(params: { id: string; actor: SurveyActor; userId: string }) {
  if (params.actor.role !== "administrador") throw new Error("FORBIDDEN");
  const existing = await getSurveyById(params.id, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  const assignees = await listAssignableUsers();
  if (!assignees.some((user) => user.id === params.userId)) throw new Error("INVALID_ASSIGNEE");

  const db = getDb();
  await db
    .update(surveys)
    .set({
      responsibleUserId: params.userId,
      updatedAt: new Date(),
      updatedBy: params.actor.id,
    })
    .where(eq(surveys.id, params.id));

  await writeAudit({
    entity: "survey",
    entityId: params.id,
    action: "update",
    userId: params.actor.id,
    payload: { kind: "reassign", to: params.userId },
  });
  return getSurveyById(params.id, params.actor);
}

export async function listAttachments(surveyId: string, includeWithdrawn: boolean) {
  const db = getDb();
  const rows = await db
    .select()
    .from(surveyAttachments)
    .where(
      includeWithdrawn
        ? eq(surveyAttachments.surveyId, surveyId)
        : and(eq(surveyAttachments.surveyId, surveyId), eq(surveyAttachments.withdrawn, false)),
    )
    .orderBy(desc(surveyAttachments.createdAt));
  return rows;
}

export async function addAttachment(params: {
  surveyId: string;
  actor: SurveyActor;
  file: { name: string; type: string; size: number; bytes: Buffer };
  sectionId?: string | null;
  description?: string | null;
}) {
  if (!(await canWriteSurvey(params.actor))) throw new Error("FORBIDDEN");
  const existing = await getSurveyById(params.surveyId, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  assertEditable(existing.status);
  if (params.file.size > SURVEY_ATTACHMENT_MAX_BYTES) throw new Error("FILE_TOO_LARGE");
  if (!SURVEY_ATTACHMENT_TYPES.includes(params.file.type as (typeof SURVEY_ATTACHMENT_TYPES)[number])) {
    throw new Error("FILE_TYPE");
  }

  const storedName = `${randomUUID()}-${params.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
  await mkdir(path.join(UPLOAD_DIR, params.surveyId), { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, params.surveyId, storedName), params.file.bytes);

  const db = getDb();
  const [created] = await db
    .insert(surveyAttachments)
    .values({
      surveyId: params.surveyId,
      originalName: params.file.name,
      storedName,
      mimeType: params.file.type,
      sizeBytes: params.file.size,
      sectionId: params.sectionId ?? null,
      description: params.description ?? null,
      createdBy: params.actor.id,
    })
    .returning();

  await writeAudit({
    entity: "survey",
    entityId: params.surveyId,
    action: "update",
    userId: params.actor.id,
    payload: { kind: "attach", name: params.file.name },
  });
  return created;
}

export async function withdrawAttachment(params: { surveyId: string; attachmentId: string; actor: SurveyActor }) {
  if (!(await canWriteSurvey(params.actor))) throw new Error("FORBIDDEN");
  const existing = await getSurveyById(params.surveyId, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  assertEditable(existing.status);
  const db = getDb();
  await db
    .update(surveyAttachments)
    .set({
      withdrawn: true,
      withdrawnAt: new Date(),
      withdrawnBy: params.actor.id,
    })
    .where(and(eq(surveyAttachments.id, params.attachmentId), eq(surveyAttachments.surveyId, params.surveyId)));
  await writeAudit({
    entity: "survey",
    entityId: params.surveyId,
    action: "update",
    userId: params.actor.id,
    payload: { kind: "withdraw_attachment", attachmentId: params.attachmentId },
  });
}

export async function getAttachmentFile(params: { surveyId: string; attachmentId: string; actor: SurveyActor }) {
  const existing = await getSurveyById(params.surveyId, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  const db = getDb();
  const [row] = await db
    .select()
    .from(surveyAttachments)
    .where(and(eq(surveyAttachments.id, params.attachmentId), eq(surveyAttachments.surveyId, params.surveyId)))
    .limit(1);
  if (!row || row.withdrawn) throw new Error("NOT_FOUND");
  return {
    ...row,
    filePath: path.join(UPLOAD_DIR, params.surveyId, row.storedName),
  };
}

export async function markExport(params: { id: string; actor: SurveyActor; kind: "pdf" | "markdown" }) {
  const existing = await getSurveyById(params.id, params.actor);
  if (!existing) throw new Error("NOT_FOUND");
  await writeAudit({
    entity: "survey",
    entityId: params.id,
    action: "update",
    userId: params.actor.id,
    payload: { kind: "export", format: params.kind, status: existing.status, revision: existing.revisionNumber },
  });
  return existing;
}

export type { FieldAnswer };
