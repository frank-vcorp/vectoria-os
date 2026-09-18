import { escapeHtml, wrapPrintableDocument } from "@/shared/document-letterhead";
import { coalesceFlowAnswer, flowBlocksToArrowText } from "@/shared/flow-blocks";
import { coalesceRoleMapAnswer, roleMapActivitiesForRole, roleMapUnassignedActivities } from "@/shared/role-map";
import { getSurveyTemplate, type TemplateField, type TemplateSection } from "@/shared/survey-templates";
import {
  APPLICABILITY_LABELS,
  SECTION_PROGRESS_LABELS,
  SURVEY_OPERATION_LABELS,
  SURVEY_STATUS_LABELS,
  hasFieldContent,
  toolOptionUsesFileFormat,
  toolOptionUsesSoftware,
  type FieldAnswer,
  type SurveyAnswers,
  type SurveyOperationType,
} from "@/shared/surveys";

function answerOf(answers: SurveyAnswers, fieldId: string): FieldAnswer {
  return answers.fields[fieldId] ?? {};
}

function mdEscape(value: string) {
  return value.replace(/\r\n/g, "\n");
}

function fieldAnswerLines(field: TemplateField, answer: FieldAnswer, blank: boolean): string[] {
  if (field.type === "guide") {
    const lines = [`**${field.label}**`];
    for (const item of field.items ?? []) {
      const note = answer.extraNotes?.[item.id]?.trim();
      lines.push(`- ${item.group ? `*${item.group}:* ` : ""}${item.text}`);
      if (!blank && note) lines.push(`  - Nota ligada: ${mdEscape(note)}`);
    }
    return lines;
  }
  if (blank) {
    if (field.type === "checklist" || field.type === "tools") {
      return [`**${field.label}**`, ...(field.options ?? []).map((option) => `- [ ] ${option}`), field.allowOther ? "- [ ] Otro: ________" : ""].filter(Boolean);
    }
    if (field.type === "table") {
      return [`**${field.label}**`, `| ${(field.columns ?? []).map((col) => col.label).join(" | ")} |`, `| ${(field.columns ?? []).map(() => "---").join(" | ")} |`];
    }
    return [`**${field.label}**`, ""];
  }

  const lines = [`**${field.label}**`];
  if (field.type === "applicability") {
    const value = answer.choice ? APPLICABILITY_LABELS[answer.choice as keyof typeof APPLICABILITY_LABELS] ?? answer.choice : "Sin respuesta";
    lines.push(value);
    return lines;
  }
  if (field.type === "choice") {
    lines.push(answer.choice?.trim() ? answer.choice : "Sin respuesta");
    return lines;
  }
  if (field.type === "checklist" || field.type === "tools") {
    const selected = new Set(answer.selected ?? []);
    for (const option of field.options ?? []) {
      lines.push(`- [${selected.has(option) ? "x" : " "}] ${option}${selected.has(option) ? "" : " *(no seleccionada; no es una respuesta negativa)*"}`);
    }
    if (answer.other?.trim()) lines.push(`- Otro: ${mdEscape(answer.other)}`);
    if (field.type === "tools") {
      const selected = answer.selected ?? [];
      if (toolOptionUsesSoftware(selected) && answer.software?.trim()) {
        lines.push(`- Software: ${mdEscape(answer.software)}`);
      }
      if (toolOptionUsesFileFormat(selected) && answer.fileName?.trim()) {
        lines.push(`- Archivo / formato: ${mdEscape(answer.fileName)}`);
      }
    }
    if (!hasFieldContent(answer)) lines.push("Sin respuesta");
    return lines;
  }
  if (field.type === "table") {
    const cols = field.columns ?? [];
    lines.push(`| ${cols.map((col) => col.label).join(" | ")} |`);
    lines.push(`| ${cols.map(() => "---").join(" | ")} |`);
    const rows = (answer.rows ?? []).filter((row) => Object.values(row).some((value) => value.trim()));
    if (rows.length === 0) lines.push("| Sin respuesta |");
    for (const row of rows) {
      lines.push(`| ${cols.map((col) => mdEscape(row[col.id] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
    }
    return lines;
  }
  if (field.type === "flow") {
    const flowAnswer = coalesceFlowAnswer(answer);
    const sequence = flowBlocksToArrowText(flowAnswer.flowBlocks);
    lines.push(sequence || "Sin respuesta");
    if (flowAnswer.flowNotes?.trim()) lines.push(`Notas: ${mdEscape(flowAnswer.flowNotes)}`);
    return lines;
  }
  if (field.type === "role-map") {
    if (blank) {
      lines.push(`**${field.label}**`);
      for (const role of field.roleOptions ?? []) {
        lines.push(`- **${role.label}**${role.hint ? ` — ${role.hint}` : ""}`);
        lines.push("  - Persona: ____________________");
        lines.push("  - Actividades: ____________________");
      }
      lines.push("- Actividades sin asignar: ____________________");
      return lines;
    }
    const roleAnswer = coalesceRoleMapAnswer(answer, {
      suggestedRoles: field.roleOptions ?? [],
      frequent: field.frequentOptions ?? [],
      secondary: field.secondaryOptions ?? [],
    });
    const data = roleAnswer.roleMap;
    if (!data || data.roles.length === 0) {
      lines.push("Sin respuesta");
      return lines;
    }
    if (data.legacyNotes?.trim()) lines.push(`Nota previa: ${mdEscape(data.legacyNotes)}`);
    for (const role of data.roles) {
      const assigned = roleMapActivitiesForRole(data, role.id);
      lines.push(`- **${role.label}**${role.personName.trim() ? ` — ${mdEscape(role.personName)}` : " — (sin persona)"}`);
      if (role.hint) lines.push(`  - Rol sugerido: ${mdEscape(role.hint)}`);
      if (assigned.length > 0) {
        lines.push(`  - Actividades: ${assigned.map((item) => mdEscape(item.label)).join(", ")}`);
      } else {
        lines.push("  - Actividades: sin asignar");
      }
    }
    const unassigned = roleMapUnassignedActivities(data);
    if (unassigned.length > 0) {
      lines.push(`- Sin asignar: ${unassigned.map((item) => mdEscape(item.label)).join(", ")}`);
    }
    return lines;
  }
  lines.push(answer.text?.trim() ? mdEscape(answer.text) : "Sin respuesta");
  return lines;
}

function pendingLines(answer: FieldAnswer) {
  if (!answer.pending?.marked) return [];
  return [
    "- Estado: Pendiente de confirmar",
    answer.pending.what ? `- Qué falta: ${mdEscape(answer.pending.what)}` : "",
    answer.pending.who ? `- Con quién confirmarlo: ${mdEscape(answer.pending.who)}` : "",
    answer.pending.note ? `- Nota: ${mdEscape(answer.pending.note)}` : "",
  ].filter(Boolean);
}

export function renderSurveyMarkdown(input: {
  folio: string;
  clientName: string;
  quoteFolio: string;
  operationType: SurveyOperationType;
  responsibleName: string;
  status: keyof typeof SURVEY_STATUS_LABELS;
  createdAt: Date;
  updatedAt: Date;
  interviewDate?: Date | null;
  revisionNumber: number;
  lastFinalizedAt?: Date | null;
  transversalTemplateVersion: string;
  operationTemplateVersion: string;
  answers: SurveyAnswers;
  sectionStates: Record<string, { status: string }>;
  attachments: { originalName: string; sectionId: string | null; description: string | null; withdrawn: boolean }[];
  archivedOperations: { type: SurveyOperationType; templateVersion: string; archivedAt: string; answers: SurveyAnswers }[];
  objective?: string;
  notes?: string;
}) {
  const template = getSurveyTemplate(input.operationType);
  const lines: string[] = [
    "# Levantamiento VectorIA",
    "",
    "> Este documento contiene información de levantamiento. Se usa como insumo para elaborar y validar un discovery posterior. Las respuestas no constituyen alcance aprobado.",
    "",
    "## Identificación",
    "",
    `- Folio: ${input.folio}`,
    `- Cliente: ${input.clientName}`,
    `- Cotización: ${input.quoteFolio}`,
    `- Tipo de operación: ${SURVEY_OPERATION_LABELS[input.operationType]}`,
    `- Responsable: ${input.responsibleName}`,
    `- Estado: ${SURVEY_STATUS_LABELS[input.status]}`,
    `- Revisión: ${input.revisionNumber || "sin finalizar"}`,
    `- Fecha de creación: ${input.createdAt.toISOString()}`,
    `- Última modificación: ${input.updatedAt.toISOString()}`,
    `- Fecha de entrevista: ${input.interviewDate ? input.interviewDate.toISOString().slice(0, 10) : "Sin respuesta"}`,
    `- Plantilla transversal: ${input.transversalTemplateVersion}`,
    `- Plantilla operativa: ${input.operationTemplateVersion}`,
    "",
    "## Objetivo general y notas iniciales",
    "",
    input.answers.fields["header.objective"]?.text?.trim() || "Sin respuesta",
    "",
    input.answers.fields["header.notes"]?.text?.trim() || "",
    "",
  ];

  const unreviewed: string[] = [];
  for (const section of template.sections) {
    lines.push(`## ${section.title}`, "");
    const progress = input.sectionStates[section.id]?.status;
    if (progress) lines.push(`Indicador de avance: ${SECTION_PROGRESS_LABELS[progress as keyof typeof SECTION_PROGRESS_LABELS] ?? progress}`, "");
    if (progress === "sin_revisar" || progress === "en_captura") unreviewed.push(section.title);
    for (const field of section.fields) {
      const answer = answerOf(input.answers, field.id);
      lines.push(...fieldAnswerLines(field, answer, false), ...pendingLines(answer), "");
    }
  }

  lines.push("## Adjuntos", "");
  const active = input.attachments.filter((item) => !item.withdrawn);
  if (active.length === 0) {
    lines.push("Sin adjuntos.");
  } else {
    for (const item of active) {
      lines.push(
        `- ${item.originalName}${item.sectionId ? ` · sección ${item.sectionId}` : ""}${item.description ? ` · ${item.description}` : ""}`,
      );
    }
    lines.push("", "El índice no incorpora el contenido de los archivos ni concede acceso público.");
  }

  lines.push("", "## Pendientes y secciones sin revisar", "");
  if (unreviewed.length === 0) lines.push("No hay secciones sin revisar.");
  else unreviewed.forEach((title) => lines.push(`- ${title}`));

  if (input.archivedOperations.length > 0) {
    lines.push("", "## Antecedentes (información conservada fuera de la plantilla vigente)", "");
    for (const archived of input.archivedOperations) {
      lines.push(`### Tipo anterior: ${SURVEY_OPERATION_LABELS[archived.type]} (${archived.templateVersion})`, "");
      const oldTemplate = getSurveyTemplate(archived.type);
      for (const section of oldTemplate.sections.filter((item) => item.group === "operation")) {
        lines.push(`#### ${section.title}`, "");
        for (const field of section.fields) {
          lines.push(...fieldAnswerLines(field, answerOf(archived.answers, field.id), false), "");
        }
      }
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function htmlBox(label: string, tall = false) {
  return `<div class="sv-q"><p class="sv-label">${escapeHtml(label)}</p><div class="sv-line${tall ? " tall" : ""}"></div></div>`;
}

function htmlField(field: TemplateField): string {
  if (field.type === "guide") {
    return `<details class="sv-guide"><summary>${escapeHtml(field.label)}</summary><ul>${(field.items ?? [])
      .map((item) => `<li>${item.group ? `<strong>${escapeHtml(item.group)}.</strong> ` : ""}${escapeHtml(item.text)}</li>`)
      .join("")}</ul></details>`;
  }
  if (field.type === "applicability") {
    return `<p class="sv-label">${escapeHtml(field.label)}</p><p>□ Aplica &nbsp; □ No aplica &nbsp; □ Por confirmar</p>`;
  }
  if (field.type === "choice") {
    return `<p class="sv-label">${escapeHtml(field.label)}</p><p>${(field.options ?? []).map((option) => `□ ${escapeHtml(option)}`).join(" &nbsp; ")}</p>`;
  }
  if (field.type === "checklist" || field.type === "tools") {
    const options = (field.options ?? []).map((option) => `<label class="sv-check">□ ${escapeHtml(option)}</label>`).join("");
    const extra =
      field.type === "tools"
        ? `${htmlBox("Si marcó Software, indique cuál")}${htmlBox("Si marcó Papel / formatos, indique cuál archivo o formato")}`
        : field.allowOther
          ? htmlBox("Otro")
          : "";
    return `<p class="sv-label">${escapeHtml(field.label)}</p><div class="sv-checks">${options}</div>${extra}`;
  }
  if (field.type === "table") {
    const cols = field.columns ?? [];
    const rows = Array.from({ length: 4 }, () => `<tr>${cols.map(() => "<td></td>").join("")}</tr>`).join("");
    return `<p class="sv-label">${escapeHtml(field.label)}</p><table class="sv-table"><thead><tr>${cols
      .map((col) => `<th>${escapeHtml(col.label)}</th>`)
      .join("")}</tr></thead><tbody>${rows}</tbody></table>`;
  }
  if (field.type === "flow") {
    const blocks = field.example
      ? field.example.split(/\s*(?:→|->)\s*/).map((part) => part.trim()).filter(Boolean)
      : ["Etapa 1", "Etapa 2", "Etapa 3"];
    const chips = blocks
      .map(
        (label, index) =>
          `${index > 0 ? '<span class="sv-flow-arrow">→</span>' : ""}<span class="sv-flow-chip">${escapeHtml(label)}</span>`,
      )
      .join("");
    return `<p class="sv-label">${escapeHtml(field.label)}</p><div class="sv-flow-row">${chips}</div>${htmlBox("Notas sobre cómo se realiza", true)}`;
  }
  if (field.type === "role-map") {
    const activities = [...(field.frequentOptions ?? []), ...(field.secondaryOptions ?? [])];
    const activityChips = activities
      .map((label) => `<span class="sv-flow-chip">${escapeHtml(label)}</span>`)
      .join("");
    const roleBlocks = (field.roleOptions ?? [])
      .map(
        (role) => `<div class="sv-role-card">
          <p class="sv-label">${escapeHtml(role.label)}</p>
          ${role.hint ? `<p class="sv-hint">${escapeHtml(role.hint)}</p>` : ""}
          ${htmlBox("Persona que lo hace hoy")}
          ${htmlBox("Actividades asignadas a este rol", true)}
        </div>`,
      )
      .join("");
    return `<p class="sv-label">${escapeHtml(field.label)}</p>
      ${field.hint ? `<p class="sv-hint">${escapeHtml(field.hint)}</p>` : ""}
      <p class="sv-hint">Actividades sugeridas (arrastre en pantalla; en papel, escríbalas bajo cada rol):</p>
      <div class="sv-flow-row">${activityChips}</div>
      <div class="sv-role-grid">${roleBlocks}</div>
      ${htmlBox("Actividades sin asignar", true)}`;
  }
  const example = field.example
    ? `<p class="sv-example">Ejemplo de referencia (no es respuesta): ${escapeHtml(field.example)}</p>`
    : "";
  const hint = field.hint ? `<p class="sv-hint">${escapeHtml(field.hint)}</p>` : "";
  return `${hint}${example}${htmlBox(field.label, true)}`;
}

export function renderSurveyPdfHtml(input: {
  folio: string;
  clientName: string;
  quoteFolio: string;
  operationType: SurveyOperationType;
  responsibleName: string;
  interviewDate?: Date | null;
}) {
  const template = getSurveyTemplate(input.operationType);
  const sectionsHtml = template.sections
    .map((section: TemplateSection) => {
      return `<section class="sv-sec"><h2>${escapeHtml(section.title)}</h2>${section.fields.map(htmlField).join("")}</section>`;
    })
    .join("");

  const body = `
    <style>
      .sv-meta { font-size: 10pt; margin: 0 0 1rem; }
      .sv-sec { break-inside: avoid; margin: 1rem 0; }
      .sv-sec h2 { font-size: 12pt; color: #0a1f44; border-bottom: 2px solid #1f4e8c; padding-bottom: .2rem; }
      .sv-label { font-weight: 600; margin: .55rem 0 .2rem; }
      .sv-hint, .sv-example { font-size: 9pt; color: #5a6478; margin: 0 0 .25rem; }
      .sv-example { font-style: italic; }
      .sv-flow-row { display: flex; flex-wrap: wrap; gap: .25rem; align-items: center; margin: .35rem 0 .55rem; }
      .sv-flow-chip { border: 1px solid #c5cedb; border-radius: 999px; padding: .2rem .55rem; font-size: 9pt; background: #f7f9fc; }
      .sv-flow-arrow { color: #5a6478; font-size: 9pt; }
      .sv-role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; margin: .35rem 0 .55rem; }
      .sv-role-card { border: 1px solid #c5cedb; border-radius: 6px; padding: .45rem .55rem; break-inside: avoid; }
      .sv-line { min-height: 1.4rem; border-bottom: 1px solid #c5cedb; }
      .sv-line.tall { min-height: 2.6rem; }
      .sv-checks { display: grid; grid-template-columns: 1fr 1fr; gap: .2rem .8rem; }
      .sv-check { font-size: 10pt; }
      .sv-table { width: 100%; border-collapse: collapse; margin: .3rem 0 .6rem; }
      .sv-table th, .sv-table td { border: 1px solid #c5cedb; padding: .35rem; height: 1.6rem; }
      .sv-guide { margin: .6rem 0; font-size: 10pt; }
      @page { @bottom-center { content: "Página " counter(page) " de " counter(pages); font-size: 9pt; } }
    </style>
    <p class="sv-meta">Formato en blanco para captura en papel. No incluye respuestas digitales. Puede saltarse lo que no aplique.</p>
    <table class="sv-table">
      <tr><th>Folio</th><td>${escapeHtml(input.folio)}</td><th>Cliente</th><td>${escapeHtml(input.clientName)}</td></tr>
      <tr><th>Cotización</th><td>${escapeHtml(input.quoteFolio)}</td><th>Tipo</th><td>${escapeHtml(SURVEY_OPERATION_LABELS[input.operationType])}</td></tr>
      <tr><th>Responsable</th><td>${escapeHtml(input.responsibleName)}</td><th>Fecha de entrevista</th><td>${input.interviewDate ? escapeHtml(input.interviewDate.toISOString().slice(0, 10)) : "________________"}</td></tr>
    </table>
    ${sectionsHtml}
  `;

  return wrapPrintableDocument({
    title: `Formato de levantamiento · ${SURVEY_OPERATION_LABELS[input.operationType]}`,
    pageTitle: `${input.folio} Formato ${SURVEY_OPERATION_LABELS[input.operationType]}`,
    docLabel: "LEV",
    docNumber: input.folio,
    dateText: new Date().toLocaleDateString("es-MX"),
    body,
  });
}
