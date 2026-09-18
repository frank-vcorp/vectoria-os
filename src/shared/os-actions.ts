import { SER_V2_DEFAULT_OS_ACTIONS } from "@/shared/ser-v2-constants";
import type { FieldAnswer, OsActionEntry, OsActionsData } from "@/shared/surveys";

export function newOsActionId(prefix = "act") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugLabel(label: string) {
  return label.slice(0, 16).replace(/\W+/g, "-").toLowerCase();
}

export function buildInitialOsActions(): OsActionsData {
  return {
    actions: SER_V2_DEFAULT_OS_ACTIONS.map((label, index) => ({
      id: `act-tpl-${index}-${slugLabel(label)}`,
      label,
      kind: "default",
      enabled: label === "Entrega",
      fixed: label === "Entrega",
      assigneeId: null,
    })),
  };
}

export function coalesceOsActions(answer: FieldAnswer | undefined): OsActionsData {
  if (answer?.osActions?.actions?.length) return answer.osActions;
  return buildInitialOsActions();
}

export function enabledOsActions(data: OsActionsData | undefined) {
  return (data?.actions ?? []).filter((item) => item.enabled || item.fixed);
}
