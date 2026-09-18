import { SER_V2_WORK_STATUS_SUGGESTIONS } from "@/shared/ser-v2-constants";
import type { FieldAnswer, WorkStatusesData } from "@/shared/surveys";

export function newWorkStatusId(prefix = "wst") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugLabel(label: string) {
  return label.slice(0, 16).replace(/\W+/g, "-").toLowerCase();
}

export function buildInitialWorkStatuses(): WorkStatusesData {
  return {
    statuses: SER_V2_WORK_STATUS_SUGGESTIONS.map((label, index) => ({
      id: `wst-tpl-${index}-${slugLabel(label)}`,
      label,
      selected: false,
      updateMode: null,
      relatedActionId: null,
      manualAssigneeId: null,
    })),
  };
}

export function coalesceWorkStatuses(answer: FieldAnswer | undefined): WorkStatusesData {
  if (answer?.workStatuses?.statuses?.length) return answer.workStatuses;
  return buildInitialWorkStatuses();
}

export function selectedWorkStatuses(data: WorkStatusesData | undefined) {
  return (data?.statuses ?? []).filter((item) => item.selected);
}
