"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DateInput } from "@/components/date-input";
import { EntityDetailLayout } from "@/components/entity-detail-layout";
import { SearchableSelect } from "@/components/searchable-select";
import { SurveyFlowBuilder } from "@/components/survey-flow-builder";
import { SurveyRoleMapBuilder } from "@/components/survey-role-map-builder";
import { coalesceFlowAnswer } from "@/shared/flow-blocks";
import { coalesceRoleMapAnswer } from "@/shared/role-map";
import { getSurveyTemplate, type TemplateField, type TemplateSection } from "@/shared/survey-templates";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/shared/commercial";
import {
  APPLICABILITY_LABELS,
  SECTION_PROGRESS_LABELS,
  SURVEY_ATTACHMENT_ACCEPT,
  SURVEY_OPERATION_LABELS,
  SURVEY_OPERATION_TYPES,
  SURVEY_STATUS_LABELS,
  emptyAnswers,
  hasFieldContent,
  toggleChecklistValue,
  toolOptionUsesFileFormat,
  toolOptionUsesSoftware,
  type FieldAnswer,
  type SectionProgress,
  type SurveyAnswers,
  type SurveyOperationType,
  type SurveyStatus,
} from "@/shared/surveys";

type Related = {
  serviceOrderId: string;
  serviceOrderFolio: string | null;
  projectId: string | null;
  projectFolio: string | null;
};

type Attachment = {
  id: string;
  originalName: string;
  sectionId: string | null;
  description: string | null;
  sizeBytes: number;
};

type SurveyDetail = {
  id: string;
  folio: string;
  quoteId: string;
  quoteFolio: string;
  quoteStatus: QuoteStatus;
  clientId: string;
  clientName: string;
  liveClientId: string;
  liveClientName: string;
  clientIdentityChanged: boolean;
  operationType: SurveyOperationType;
  responsibleUserId: string;
  responsibleName: string;
  status: SurveyStatus;
  interviewDate: string | null;
  answers: SurveyAnswers;
  sectionStates: Record<string, { status: SectionProgress }>;
  archivedOperations: { type: SurveyOperationType; archivedAt: string }[];
  quoteLinkHistory: { quoteFolio: string; clientName: string }[];
  correspondenceReviewRequired: boolean;
  correspondenceReviewed: boolean;
  revisionNumber: number;
  updatedAt: string;
  serviceName: string;
  quoteDescription: string;
  related: Related[];
  attachments: Attachment[];
  canWrite: boolean;
};

type SaveState = "saved" | "saving" | "pending" | "error" | "conflict";

function AutoText({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      rows={Math.max(2, value.split("\n").length)}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
    />
  );
}

function FieldEditor({
  field,
  answer,
  disabled,
  onChange,
}: {
  field: TemplateField;
  answer: FieldAnswer;
  disabled: boolean;
  onChange: (next: FieldAnswer) => void;
}) {
  if (field.type === "guide") {
    return (
      <details className="text-sm">
        <summary className="cursor-pointer text-[var(--muted)]">{field.label} — no se guardan como respuestas</summary>
        <ul className="mt-2 space-y-2">
          {(field.items ?? []).map((item) => (
            <li key={item.id}>
              <p>
                {item.group ? <strong>{item.group}. </strong> : null}
                {item.text}
              </p>
              <AutoText
                value={answer.extraNotes?.[item.id] ?? ""}
                disabled={disabled}
                onChange={(text) =>
                  onChange({ ...answer, extraNotes: { ...answer.extraNotes, [item.id]: text } })
                }
              />
            </li>
          ))}
        </ul>
      </details>
    );
  }

  if (field.type === "applicability" || field.type === "choice") {
    const options = field.type === "applicability" ? Object.entries(APPLICABILITY_LABELS) : (field.options ?? []).map((option) => [option, option] as const);
    return (
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">{field.label}</legend>
        <div className="flex flex-wrap gap-3">
          {options.map(([value, label]) => (
            <label key={value} className="text-sm flex items-center gap-2">
              <input
                type="radio"
                name={field.id}
                checked={answer.choice === value}
                disabled={disabled}
                onChange={() => onChange({ ...answer, choice: value })}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "checklist" || field.type === "tools") {
    const selected = answer.selected ?? [];
    const showsSoftware =
      field.type === "tools" &&
      (toolOptionUsesSoftware(selected) || Boolean(answer.software?.trim()));
    const showsFileFormat =
      field.type === "tools" &&
      (toolOptionUsesFileFormat(selected) || Boolean(answer.fileName?.trim()));

    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{field.label}</legend>
        <div className="grid gap-2 md:grid-cols-2">
          {(field.options ?? []).map((option) => (
            <label key={option} className="text-sm flex items-center gap-2 min-h-9">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                disabled={disabled}
                onChange={() => {
                  const nextSelected = toggleChecklistValue(selected, option, field.exclusiveValues);
                  const nextAnswer: FieldAnswer = { ...answer, selected: nextSelected };
                  if (field.type === "tools" && !toolOptionUsesSoftware(nextSelected)) {
                    nextAnswer.software = undefined;
                  }
                  if (field.type === "tools" && !toolOptionUsesFileFormat(nextSelected)) {
                    nextAnswer.fileName = undefined;
                  }
                  onChange(nextAnswer);
                }}
              />
              {option}
            </label>
          ))}
        </div>
        {field.type === "checklist" && field.allowOther ? (
          <input
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            placeholder="Otro"
            disabled={disabled}
            value={answer.other ?? ""}
            onChange={(e) => onChange({ ...answer, other: e.target.value })}
          />
        ) : null}
        {showsSoftware ? (
          <label className="block space-y-1">
            <span className="text-xs text-[var(--muted)]">¿Qué software utilizan?</span>
            <input
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
              placeholder="Ej. SAP, Odoo, Excel, sistema propio…"
              disabled={disabled}
              value={answer.software ?? ""}
              onChange={(e) => onChange({ ...answer, software: e.target.value })}
            />
          </label>
        ) : null}
        {showsFileFormat ? (
          <label className="block space-y-1">
            <span className="text-xs text-[var(--muted)]">¿Qué archivo o formato utilizan?</span>
            <input
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
              placeholder="Ej. Excel de ventas, formato impreso, carpeta compartida…"
              disabled={disabled}
              value={answer.fileName ?? ""}
              onChange={(e) => onChange({ ...answer, fileName: e.target.value })}
            />
          </label>
        ) : null}
      </fieldset>
    );
  }

  if (field.type === "flow") {
    const flowAnswer = coalesceFlowAnswer(answer);
    return (
      <SurveyFlowBuilder
        label={field.label}
        example={field.example}
        hint={field.hint}
        blocks={flowAnswer.flowBlocks}
        notes={flowAnswer.flowNotes}
        disabled={disabled}
        onChange={(next) => onChange({ ...flowAnswer, ...next, text: undefined })}
      />
    );
  }

  if (field.type === "role-map") {
    const roleAnswer = coalesceRoleMapAnswer(answer, {
      suggestedRoles: field.roleOptions ?? [],
      frequent: field.frequentOptions ?? [],
      secondary: field.secondaryOptions ?? [],
    });
    return (
      <SurveyRoleMapBuilder
        label={field.label}
        hint={field.hint}
        suggestedRoles={field.roleOptions ?? []}
        frequent={field.frequentOptions ?? []}
        secondary={field.secondaryOptions ?? []}
        data={roleAnswer.roleMap}
        disabled={disabled}
        onChange={(roleMap) => onChange({ ...roleAnswer, roleMap, text: undefined })}
      />
    );
  }

  if (field.type === "table") {
    const columns = field.columns ?? [];
    const rows = answer.rows ?? [];
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{field.label}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.id} className="text-left pr-2 pb-1">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${field.id}-${index}`}>
                  {columns.map((col) => (
                    <td key={col.id} className="pr-2 pb-2">
                      <input
                        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1"
                        disabled={disabled}
                        value={row[col.id] ?? ""}
                        onChange={(e) => {
                          const next = rows.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, [col.id]: e.target.value } : item,
                          );
                          onChange({ ...answer, rows: next });
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!disabled && (
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() =>
              onChange({
                ...answer,
                rows: [...rows, Object.fromEntries(columns.map((col) => [col.id, ""]))],
              })
            }
          >
            {field.addLabel ?? "Agregar fila"}
          </button>
        )}
      </div>
    );
  }

  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{field.label}</span>
      {field.hint ? <span className="block text-xs text-[var(--muted)]">{field.hint}</span> : null}
      {field.example ? (
        <span className="block text-xs text-[var(--muted)] italic">
          Ejemplo de referencia (no es respuesta): {field.example}
        </span>
      ) : null}
      <AutoText value={answer.text ?? ""} disabled={disabled} onChange={(text) => onChange({ ...answer, text })} />
    </label>
  );
}

export function SurveyDetailView({ id }: { id: string }) {
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>(emptyAnswers());
  const [sectionId, setSectionId] = useState("header");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [quotes, setQuotes] = useState<{ id: string; folio: string; clientName: string; status: QuoteStatus }[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  const [role, setRole] = useState("");
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const template = useMemo(
    () => (survey ? getSurveyTemplate(survey.operationType) : null),
    [survey],
  );
  const section = template?.sections.find((item) => item.id === sectionId) ?? template?.sections[0];
  const readonly = !survey?.canWrite || survey?.status === "finalizado";

  const load = useCallback(async () => {
    const res = await fetch(`/api/surveys/${id}`);
    if (!res.ok) {
      setError("No se pudo cargar el levantamiento");
      return;
    }
    const data = await res.json();
    setSurvey(data.survey);
    setAnswers(data.survey.answers ?? emptyAnswers());
    setInterviewDate(data.survey.interviewDate ? data.survey.interviewDate.slice(0, 10) : "");
    dirtyRef.current = false;
    setSaveState("saved");
  }, [id]);

  useEffect(() => {
    void load();
    void fetch("/api/quotes")
      .then((res) => (res.ok ? res.json() : { quotes: [] }))
      .then((data) => setQuotes(data.quotes ?? []));
    void fetch("/api/surveys?assignees=1")
      .then((res) => (res.ok ? res.json() : { assignees: [] }))
      .then((data) => setAssignees(data.assignees ?? []));
    void fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user?: { role?: string } | null }) => setRole(data.user?.role ?? ""));
  }, [load]);

  async function persist(nextAnswers = answers, extras: Record<string, unknown> = {}) {
    if (!survey || readonly) return survey;
    setSaveState("saving");
    const res = await fetch(`/api/surveys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        expectedUpdatedAt: survey.updatedAt,
        answers: nextAnswers,
        sectionStates: survey.sectionStates,
        interviewDate: interviewDate || null,
        ...extras,
      }),
    });
    if (res.status === 409) {
      const payload = await res.json();
      if (payload.error === "CONFLICT") {
        setSaveState("conflict");
        setError("Otro usuario modificó este levantamiento. Conserve su texto y recargue para resolverlo.");
        return null;
      }
      setSaveState("error");
      setError(payload.error ?? "No se pudo guardar");
      return null;
    }
    if (!res.ok) {
      setSaveState("error");
      setError((await res.json()).error ?? "No se pudo guardar");
      return null;
    }
    const data = await res.json();
    setSurvey(data.survey);
    dirtyRef.current = false;
    setSaveState("saved");
    setError("");
    return data.survey as SurveyDetail;
  }

  function queueSave(next: SurveyAnswers, nextStates?: SurveyDetail["sectionStates"]) {
    setAnswers(next);
    dirtyRef.current = true;
    setSaveState("pending");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      void persist(next, nextStates ? { sectionStates: nextStates } : {});
    }, 800);
  }

  function setField(fieldId: string, next: FieldAnswer) {
    const fields = { ...answers.fields, [fieldId]: next };
    const sectionStates = { ...survey?.sectionStates };
    if (survey && section && sectionStates[section.id]?.status === "sin_revisar" && hasFieldContent(next)) {
      sectionStates[section.id] = { status: "en_captura" };
    }
    queueSave({ fields }, sectionStates);
    if (survey) setSurvey({ ...survey, sectionStates });
  }

  async function action(body: Record<string, unknown>) {
    let current = survey;
    if (dirtyRef.current) {
      const saved = await persist();
      if (!saved) return;
      current = saved;
    }
    if ("expectedUpdatedAt" in body && current) body.expectedUpdatedAt = current.updatedAt;
    const res = await fetch(`/api/surveys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    const data = await res.json();
    setSurvey(data.survey);
    setAnswers(data.survey.answers);
    setError("");
  }

  async function uploadAttachment(file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("sectionId", sectionId);
    const res = await fetch(`/api/surveys/${id}/attachments`, { method: "POST", body: form });
    if (!res.ok) {
      setError((await res.json()).error ?? "No se pudo adjuntar");
      return;
    }
    await load();
  }

  if (!survey || !template || !section) {
    return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  }

  const groups = [
    { id: "header", title: "Datos generales", items: template.sections.filter((item) => item.group === "header") },
    { id: "transversal", title: "Procesos comunes", items: template.sections.filter((item) => item.group === "transversal") },
    { id: "operation", title: "Operación", items: template.sections.filter((item) => item.group === "operation") },
    { id: "attachments", title: "Adjuntos", items: template.sections.filter((item) => item.group === "attachments") },
    { id: "closure", title: "Cierre", items: template.sections.filter((item) => item.group === "closure") },
  ];
  const hiddenDetail = section.applicabilityFieldId && answers.fields[section.applicabilityFieldId]?.choice === "no_aplica";
  const saveLabel =
    saveState === "saving"
      ? "Guardando"
      : saveState === "pending"
        ? "Cambios pendientes de guardar"
        : saveState === "conflict"
          ? "Conflicto de edición"
          : saveState === "error"
            ? "No guardado"
            : "Guardado";

  return (
    <EntityDetailLayout
      backHref="/levantamientos"
      backLabel="Levantamientos"
      folio={survey.folio}
      title={survey.clientName}
      statusBadge={<span className="badge">{SURVEY_STATUS_LABELS[survey.status]}</span>}
      actions={
        <>
          <a href={`/api/surveys/${id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Descargar formato en PDF
          </a>
          <a href={`/api/surveys/${id}/markdown`} className="btn btn-ghost">
            Exportar para discovery (.md)
          </a>
          {survey.canWrite && survey.status !== "finalizado" && (
            <button type="button" className="btn btn-primary" onClick={() => void action({ action: "finalize", expectedUpdatedAt: survey.updatedAt })}>
              Finalizar
            </button>
          )}
          {survey.canWrite && survey.status === "finalizado" && (
            <button type="button" className="btn btn-primary" onClick={() => void action({ action: "reopen" })}>
              Reabrir
            </button>
          )}
        </>
      }
    >
      <div className="card text-sm flex flex-wrap gap-4">
        <div>
          <p className="text-[var(--muted)]">Cliente</p>
          <Link href={`/clientes/${survey.clientId}`} className="underline">
            {survey.clientName}
          </Link>
        </div>
        <div>
          <p className="text-[var(--muted)]">Cotización</p>
          <Link href={`/cotizaciones/${survey.quoteId}`} className="underline font-mono text-xs">
            {survey.quoteFolio}
          </Link>{" "}
          <span className="badge">{QUOTE_STATUS_LABELS[survey.quoteStatus]}</span>
        </div>
        <div>
          <p className="text-[var(--muted)]">Tipo</p>
          <p>{SURVEY_OPERATION_LABELS[survey.operationType]}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Servicio cotizado</p>
          <p>{survey.serviceName}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Guardado</p>
          <p>{saveLabel}</p>
        </div>
      </div>

      {(survey.quoteStatus === "rechazada" || survey.quoteStatus === "cancelada") && (
        <p className="text-sm text-[var(--warning)]">
          La cotización está {QUOTE_STATUS_LABELS[survey.quoteStatus]}. El levantamiento se conserva y no reactiva la venta.
        </p>
      )}
      {(survey.clientIdentityChanged || survey.correspondenceReviewRequired) && (
        <p className="text-sm text-[var(--warning)]">
          Debe revisarse si las respuestas corresponden al cliente {survey.liveClientName}.{" "}
          {!readonly && (
            <button
              type="button"
              className="underline"
              onClick={() => void persist(answers, { correspondenceReviewed: true })}
            >
              Marcar correspondencia revisada
            </button>
          )}
        </p>
      )}
      {survey.related.some((item) => item.serviceOrderFolio || item.projectFolio) && (
        <p className="text-sm">
          Relacionados:{" "}
          {survey.related.map((item) => (
            <span key={`${item.serviceOrderId}-${item.projectId ?? ""}`} className="mr-3">
              {item.serviceOrderFolio && (
                <Link href={`/ordenes-servicio/${item.serviceOrderId}`} className="underline">
                  {item.serviceOrderFolio}
                </Link>
              )}
              {item.projectId && item.projectFolio && (
                <>
                  {" / "}
                  <Link href={`/proyectos/${item.projectId}`} className="underline">
                    {item.projectFolio}
                  </Link>
                </>
              )}
            </span>
          ))}
        </p>
      )}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <nav className="card space-y-3 text-sm">
          <select
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 lg:hidden"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          >
            {template.sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.navLabel}
              </option>
            ))}
          </select>
          <div className="hidden lg:block space-y-3">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-1">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const progress = survey.sectionStates[item.id]?.status ?? "sin_revisar";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full text-left px-2 py-1 rounded ${item.id === section.id ? "bg-[var(--surface-2)]" : ""}`}
                        onClick={() => setSectionId(item.id)}
                      >
                        <span className="block">{item.navLabel}</span>
                        <span className="block text-xs text-[var(--muted)]">{SECTION_PROGRESS_LABELS[progress]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title">{section.title}</h2>
            <span className="badge">{SECTION_PROGRESS_LABELS[survey.sectionStates[section.id]?.status ?? "sin_revisar"]}</span>
          </div>

          {section.id === "header" && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm space-y-1">
                <span>Fecha de entrevista</span>
                <DateInput
                  className="w-full"
                  value={interviewDate}
                  disabled={readonly}
                  onChange={(value) => {
                    setInterviewDate(value);
                    setSaveState("pending");
                    dirtyRef.current = true;
                    if (timerRef.current) window.clearTimeout(timerRef.current);
                    timerRef.current = window.setTimeout(() => void persist(), 800);
                  }}
                />
              </label>
              <p className="text-sm text-[var(--muted)] md:col-span-2">{survey.quoteDescription}</p>
            </div>
          )}

          {section.fields
            .filter((field) => !hiddenDetail || field.id === section.applicabilityFieldId)
            .map((field) => (
              <div key={field.id} className="space-y-2">
                <FieldEditor
                  field={field}
                  answer={answers.fields[field.id] ?? {}}
                  disabled={readonly}
                  onChange={(next) => setField(field.id, next)}
                />
                {!readonly && field.type !== "guide" && (
                  <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={Boolean(answers.fields[field.id]?.pending?.marked)}
                      onChange={(e) =>
                        setField(field.id, {
                          ...answers.fields[field.id],
                          pending: { marked: e.target.checked, what: answers.fields[field.id]?.pending?.what },
                        })
                      }
                    />
                    Pendiente de confirmar
                  </label>
                )}
                {answers.fields[field.id]?.pending?.marked && (
                  <input
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                    placeholder="Qué falta / con quién confirmarlo"
                    disabled={readonly}
                    value={answers.fields[field.id]?.pending?.what ?? ""}
                    onChange={(e) =>
                      setField(field.id, {
                        ...answers.fields[field.id],
                        pending: { marked: true, what: e.target.value },
                      })
                    }
                  />
                )}
              </div>
            ))}

          {section.id === "attachments" && (
            <div className="space-y-2">
              {!readonly && (
                <input
                  type="file"
                  accept={SURVEY_ATTACHMENT_ACCEPT}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadAttachment(file);
                    e.target.value = "";
                  }}
                />
              )}
              {survey.attachments.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <a className="underline" href={`/api/surveys/${id}/attachments/${item.id}`}>
                    {item.originalName}
                  </a>
                  {!readonly && (
                    <button
                      type="button"
                      className="btn btn-ghost text-xs"
                      onClick={() => void fetch(`/api/surveys/${id}/attachments/${item.id}`, { method: "DELETE" }).then(() => load())}
                    >
                      Retirar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readonly && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  void action({
                    action: "review_section",
                    expectedUpdatedAt: survey.updatedAt,
                    sectionId: section.id,
                    pending: Object.values(answers.fields).some((item) => item.pending?.marked) && section.fields.some((field) => answers.fields[field.id]?.pending?.marked),
                  })
                }
              >
                Marcar revisada
              </button>
            </div>
          )}
        </section>
      </div>

      {survey.canWrite && survey.status !== "finalizado" && (
        <div className="card space-y-3">
          <h2 className="section-title">Correcciones</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <SearchableSelect
              className="w-full"
              value={survey.operationType}
              onChange={(operationType) => {
                if (operationType === survey.operationType) return;
                if (confirm("Se conservarán las respuestas operativas anteriores como antecedente y se abrirá la nueva plantilla.")) {
                  void action({ action: "change_type", expectedUpdatedAt: survey.updatedAt, operationType });
                }
              }}
              options={SURVEY_OPERATION_TYPES.map((type) => ({ value: type, label: SURVEY_OPERATION_LABELS[type] }))}
            />
            <SearchableSelect
              className="w-full"
              value={survey.quoteId}
              onChange={(quoteId) => {
                const next = quotes.find((item) => item.id === quoteId);
                if (!next || quoteId === survey.quoteId) return;
                if (confirm(`Cambiar de ${survey.quoteFolio} / ${survey.clientName} a ${next.folio} / ${next.clientName}?`)) {
                  void action({ action: "change_quote", expectedUpdatedAt: survey.updatedAt, quoteId });
                }
              }}
              options={quotes.map((quote) => ({
                value: quote.id,
                label: `${quote.folio} — ${quote.clientName}`,
                keywords: `${quote.folio} ${quote.clientName}`,
              }))}
            />
            {role === "administrador" && (
              <SearchableSelect
                className="w-full"
                value={survey.responsibleUserId}
                onChange={(userId) => void action({ action: "reassign", userId })}
                options={assignees.map((user) => ({ value: user.id, label: user.name }))}
              />
            )}
          </div>
          {survey.archivedOperations.length > 0 && (
            <p className="text-xs text-[var(--muted)]">
              Hay antecedentes de {survey.archivedOperations.map((item) => SURVEY_OPERATION_LABELS[item.type]).join(", ")}. Se incluyen al exportar Markdown.
            </p>
          )}
          {survey.quoteLinkHistory.length > 0 && (
            <p className="text-xs text-[var(--muted)]">
              Cotizaciones anteriores: {survey.quoteLinkHistory.map((item) => `${item.quoteFolio} / ${item.clientName}`).join(" · ")}
            </p>
          )}
        </div>
      )}
    </EntityDetailLayout>
  );
}
