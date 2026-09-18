import { assigneeLabel, coalesceAssigneeCatalog } from "@/shared/assignee-catalog";
import {
  coalesceSystemRoleIds,
  coalesceSystemRolesCatalog,
  systemRoleLabel,
  systemRoleLabels,
  systemRoleOptions,
} from "@/shared/system-roles";
import { coalesceModuleLinks, selectedModuleLinks } from "@/shared/module-links";
import { coalesceOsActions, enabledOsActions } from "@/shared/os-actions";
import { buildSerV2References } from "@/shared/ser-v2-refs";
import { coalesceWorkStatuses, selectedWorkStatuses } from "@/shared/work-statuses";
import type { TemplateField } from "@/shared/survey-templates";
import type { FieldAnswer, SurveyAnswers } from "@/shared/surveys";

function mdEscape(value: string) {
  return value.replace(/\r\n/g, "\n");
}

export function serV2FieldAnswerLines(
  field: TemplateField,
  answer: FieldAnswer,
  blank: boolean,
  answers: SurveyAnswers,
): string[] | null {
  if (field.type === "notice") {
    return [`**${field.label}**`, field.hint ? mdEscape(field.hint) : ""].filter(Boolean);
  }

  if (field.type === "system-roles") {
    if (blank) return [`**${field.label}**`, "Agregar roles:"];
    const data = coalesceSystemRolesCatalog(answer);
    const lines = [`**${field.label}**`];
    for (const item of data.assignees.filter((role) => role.label.trim())) {
      lines.push(`- ${item.label.trim()}`);
    }
    if (lines.length === 1) lines.push("Sin roles definidos");
    return lines;
  }

  if (field.type === "assignee-catalog") {
    if (blank) return [`**${field.label}**`, "Complete encargados y personas de referencia."];
    const data = coalesceAssigneeCatalog(answer, field.roleOptions ?? []);
    const lines = [`**${field.label}**`];
    for (const item of data.assignees) {
      lines.push(
        `- ${item.label}${item.personName.trim() ? ` — ${mdEscape(item.personName)}` : ""}${item.hint ? ` (${mdEscape(item.hint)})` : ""}`,
      );
    }
    if (data.legacyNotes?.trim()) lines.push(`- Nota previa: ${mdEscape(data.legacyNotes)}`);
    return lines;
  }

  if (field.type === "system-roles-multi") {
    const catalog = coalesceSystemRolesCatalog(answers.fields[field.catalogFieldId ?? "header.systemRoles"]);
    if (blank) {
      return [
        `**${field.label}**`,
        ...(systemRoleOptions(catalog).map((role) => `- [ ] ${role.label}`)),
      ];
    }
    const roleIds = coalesceSystemRoleIds(answer);
    const labels = systemRoleLabels(catalog, roleIds);
    return [`**${field.label}**`, labels.length ? labels.map((label) => `- ${label}`).join("\n") : "Sin respuesta"];
  }

  if (field.type === "assignee-select") {
    const catalogFieldId = field.catalogFieldId ?? "";
    if (blank) return [`**${field.label}**`, "Seleccionar rol: ____________________"];
    if (catalogFieldId === "header.systemRoles") {
      const catalog = coalesceSystemRolesCatalog(answers.fields[catalogFieldId]);
      const label = systemRoleLabel(catalog, answer.assigneeId);
      return [`**${field.label}**`, label || "Sin respuesta"];
    }
    const catalog = coalesceAssigneeCatalog(answers.fields[catalogFieldId], field.roleOptions ?? []);
    const label = assigneeLabel(catalog, answer.assigneeId);
    return [`**${field.label}**`, label || "Sin respuesta"];
  }

  if (field.type === "os-actions-v2") {
    const catalog = coalesceAssigneeCatalog(answers.fields[field.catalogFieldId ?? ""], field.roleOptions ?? []);
    const data = coalesceOsActions(answer);
    if (blank) return [`**${field.label}**`, "| Acción | Encargado | Nota |", "| --- | --- | --- |"];
    const lines = [`**${field.label}**`];
    for (const action of enabledOsActions(data)) {
      lines.push(
        `- ${action.label}${action.fixed ? " (incluida)" : ""} — ${assigneeLabel(catalog, action.assigneeId) || "sin encargado"}`,
      );
      if (action.note?.trim()) lines.push(`  - Nota: ${mdEscape(action.note)}`);
      if (action.checklistItems?.some((item) => item.trim())) {
        lines.push(`  - Checklist: ${action.checklistItems.filter((item) => item.trim()).map(mdEscape).join("; ")}`);
      }
    }
    return lines;
  }

  if (field.type === "work-statuses-v2") {
    const catalog = coalesceAssigneeCatalog(answers.fields[field.catalogFieldId ?? ""], field.roleOptions ?? []);
    const data = coalesceWorkStatuses(answer);
    const actions = coalesceOsActions(answers.fields["op.SER.v2.acciones"]);
    if (blank) return [`**${field.label}**`, "Seleccione estatus y complete detalles."];
    const lines = [`**${field.label}**`];
    for (const status of selectedWorkStatuses(data)) {
      lines.push(`- ${status.label}`);
      if (status.description?.trim()) lines.push(`  - Descripción: ${mdEscape(status.description)}`);
      if (status.updateMode) lines.push(`  - Actualización: ${status.updateMode}`);
      if (status.relatedActionId) {
        const action = actions.actions.find((item) => item.id === status.relatedActionId);
        if (action) lines.push(`  - Acción relacionada: ${action.label}`);
      }
      if (status.manualAssigneeId) {
        lines.push(`  - Cambio manual: ${assigneeLabel(catalog, status.manualAssigneeId) || "sin encargado"}`);
      }
    }
    if (data.other?.trim()) lines.push(`- Otro: ${mdEscape(data.other)}`);
    return lines;
  }

  if (field.type === "module-links-v2") {
    const catalog = coalesceAssigneeCatalog(answers.fields[field.catalogFieldId ?? ""], field.roleOptions ?? []);
    const data = coalesceModuleLinks(answer);
    if (blank) return [`**${field.label}**`, "Marque funciones y encargados."];
    const lines = [`**${field.label}**`];
    for (const link of selectedModuleLinks(data)) {
      lines.push(
        `- ${link.group} / ${link.label} — ${assigneeLabel(catalog, link.assigneeId) || "sin encargado"}`,
      );
      if (link.note?.trim()) lines.push(`  - Nota: ${mdEscape(link.note)}`);
    }
    return lines;
  }

  if (field.type === "special-rules-v2") {
    const catalog = coalesceAssigneeCatalog(answers.fields[field.catalogFieldId ?? ""], field.roleOptions ?? []);
    const data = answer.specialRules ?? { hasRules: null, rules: [] };
    const refs = buildSerV2References(answers);
    if (blank) return [`**${field.label}**`, "□ Sí □ No □ Por definir"];
    const lines = [`**${field.label}**`, data.hasRules?.trim() ? data.hasRules : "Sin respuesta"];
    if (data.hasRules === "Sí") {
      for (const rule of data.rules) {
        const ref = refs.find((item) => item.id === rule.appliesTo);
        lines.push(
          `- ${ref?.label ?? (rule.appliesTo || "Sin referencia")}: ${rule.rule.trim() ? mdEscape(rule.rule) : "(sin regla)"}`,
        );
        if (rule.authorizerId) {
          lines.push(`  - Autorizador: ${assigneeLabel(catalog, rule.authorizerId) || "sin encargado"}`);
        }
      }
    }
    return lines;
  }

  if (field.type === "client-catalogs-v2") {
    const catalog = coalesceAssigneeCatalog(answers.fields[field.catalogFieldId ?? ""], field.roleOptions ?? []);
    const data = answer.clientCatalogs ?? { selected: [], details: [] };
    if (blank) return [`**${field.label}**`, "Marque catálogos y complete detalles."];
    const lines = [`**${field.label}**`];
    for (const name of data.selected) {
      const detail = data.details.find((item) => item.catalogId === name);
      lines.push(`- ${name}`);
      if (detail?.infoNeeded?.trim()) lines.push(`  - Información: ${mdEscape(detail.infoNeeded)}`);
      if (detail?.usedWhere?.trim()) lines.push(`  - Uso: ${mdEscape(detail.usedWhere)}`);
      if (detail?.assigneeId) lines.push(`  - Encargado: ${assigneeLabel(catalog, detail.assigneeId)}`);
    }
    if (data.other?.trim()) lines.push(`- Otros: ${mdEscape(data.other)}`);
    return lines;
  }

  if (field.type === "report-outputs-v2") {
    const catalog = coalesceAssigneeCatalog(answers.fields[field.catalogFieldId ?? ""], field.roleOptions ?? []);
    const data = answer.reportOutputs ?? { outputs: [] };
    if (blank) return [`**${field.label}**`, "Marque salidas y complete detalles."];
    const lines = [`**${field.label}**`];
    for (const output of data.outputs.filter((item) => item.selected)) {
      lines.push(`- ${output.label}`);
      if (output.content?.trim()) lines.push(`  - Contenido: ${mdEscape(output.content)}`);
      if (output.assigneeId) lines.push(`  - Encargado: ${assigneeLabel(catalog, output.assigneeId)}`);
    }
    if (data.other?.trim()) lines.push(`- Otros: ${mdEscape(data.other)}`);
    if (data.productivityCalc?.trim()) lines.push(`- Cálculo productividad/rentabilidad: ${mdEscape(data.productivityCalc)}`);
    for (const entry of data.accessRestrictions ?? []) {
      if (!entry.assigneeId && !entry.restriction.trim()) continue;
      lines.push(
        `- Restricción: ${assigneeLabel(catalog, entry.assigneeId) || "sin encargado"} — ${mdEscape(entry.restriction)}`,
      );
    }
    return lines;
  }

  if (field.type === "extra-fields-v2") {
    const data = answer.extraFields ?? { fields: [] };
    if (blank) return [`**${field.label}**`, "| Nombre | Tipo | Obligatorio | Ubicación |", "| --- | --- | --- | --- |"];
    const lines = [`**${field.label}**`];
    for (const item of data.fields.filter((fieldItem) => fieldItem.name.trim())) {
      lines.push(
        `- ${item.name} · ${item.fieldType || "sin tipo"} · ${item.required ? "Obligatorio" : "Opcional"} · ${item.location || "sin ubicación"}`,
      );
    }
    if (lines.length === 1) lines.push("Sin campos adicionales");
    return lines;
  }

  return null;
}
