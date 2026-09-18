import type { AssigneeCatalogData, AssigneeEntry } from "@/shared/surveys";

export function newAssigneeId(prefix = "asg") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugLabel(label: string) {
  return label.slice(0, 16).replace(/\W+/g, "-").toLowerCase();
}

export function buildInitialAssigneeCatalog(
  suggested: { label: string; hint?: string }[],
): AssigneeCatalogData {
  return {
    assignees: suggested.map((item, index) => ({
      id: `asg-tpl-${index}-${slugLabel(item.label)}`,
      label: item.label,
      hint: item.hint,
      personName: "",
      source: "suggested",
    })),
  };
}

export function coalesceAssigneeCatalog(
  answer: { assigneeCatalog?: AssigneeCatalogData; text?: string } | undefined,
  suggested: { label: string; hint?: string }[],
): AssigneeCatalogData {
  if (answer?.assigneeCatalog?.assignees?.length) return answer.assigneeCatalog;
  const initial = buildInitialAssigneeCatalog(suggested);
  const legacy = answer?.text?.trim();
  if (legacy) return { ...initial, legacyNotes: legacy };
  return initial;
}

export function assigneeCatalogOptions(data: AssigneeCatalogData | undefined) {
  return (data?.assignees ?? []).map((item) => ({
    id: item.id,
    label: item.personName.trim()
      ? `${item.label} — ${item.personName.trim()}`
      : item.label,
  }));
}

export function assigneeLabel(data: AssigneeCatalogData | undefined, assigneeId: string | null | undefined) {
  if (!assigneeId || !data) return "";
  const item = data.assignees.find((entry) => entry.id === assigneeId);
  if (!item) return "";
  return item.personName.trim() ? `${item.label} — ${item.personName.trim()}` : item.label;
}

export function hasAssigneeCatalogContent(data: AssigneeCatalogData | undefined) {
  if (!data) return false;
  if (data.legacyNotes?.trim()) return true;
  return data.assignees.some((item) => item.personName.trim() || item.source === "custom");
}
