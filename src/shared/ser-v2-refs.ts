import { coalesceOsActions, enabledOsActions } from "@/shared/os-actions";
import { coalesceModuleLinks, selectedModuleLinks } from "@/shared/module-links";
import { coalesceWorkStatuses, selectedWorkStatuses } from "@/shared/work-statuses";
import type { SurveyAnswers } from "@/shared/surveys";
import { SER_V2_ACTIONS_FIELD } from "@/shared/ser-v2-constants";

export type SerV2Reference = {
  id: string;
  label: string;
  category: "Acción" | "Estatus" | "Conexión" | "Módulo";
};

export function buildSerV2References(answers: SurveyAnswers): SerV2Reference[] {
  const refs: SerV2Reference[] = [];
  const actions = enabledOsActions(coalesceOsActions(answers.fields[SER_V2_ACTIONS_FIELD]));
  for (const action of actions) {
    refs.push({ id: `action:${action.id}`, label: `Acción · ${action.label}`, category: "Acción" });
  }
  if (actions.some((item) => item.label === "Garantía")) {
    refs.push({ id: "module:garantias", label: "Módulo · Garantías", category: "Módulo" });
  }
  for (const status of selectedWorkStatuses(coalesceWorkStatuses(answers.fields["op.SER.v2.status.workStatuses"]))) {
    refs.push({ id: `status:${status.id}`, label: `Estatus · ${status.label}`, category: "Estatus" });
  }
  for (const link of selectedModuleLinks(coalesceModuleLinks(answers.fields["op.SER.v2.modules.links"]))) {
    refs.push({
      id: `link:${link.id}`,
      label: `Conexión · ${link.group} / ${link.label}`,
      category: "Conexión",
    });
  }
  return refs;
}
