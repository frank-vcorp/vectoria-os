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
