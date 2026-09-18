import { newAssigneeId } from "@/shared/assignee-catalog";
import type { AssigneeCatalogData } from "@/shared/surveys";

export const SYSTEM_ROLES_CATALOG_FIELD = "header.systemRoles";

export { newAssigneeId };

export function coalesceSystemRolesCatalog(
  answer: { assigneeCatalog?: AssigneeCatalogData } | undefined,
): AssigneeCatalogData {
  if (answer?.assigneeCatalog) return answer.assigneeCatalog;
  return { assignees: [] };
}

export function systemRoleOptions(data: AssigneeCatalogData | undefined) {
  return (data?.assignees ?? [])
    .filter((item) => item.label.trim())
    .map((item) => ({ id: item.id, label: item.label.trim() }));
}

export function systemRoleLabel(data: AssigneeCatalogData | undefined, roleId: string | null | undefined) {
  if (!roleId || !data) return "";
  return data.assignees.find((item) => item.id === roleId)?.label.trim() ?? "";
}

export function systemRoleLabels(data: AssigneeCatalogData | undefined, roleIds: string[]) {
  return roleIds.map((roleId) => systemRoleLabel(data, roleId)).filter(Boolean);
}

export function coalesceSystemRoleIds(answer: { assigneeIds?: string[]; assigneeId?: string | null } | undefined) {
  if (!answer) return [];
  if (answer.assigneeIds?.length) return answer.assigneeIds;
  if (answer.assigneeId) return [answer.assigneeId];
  return [];
}
