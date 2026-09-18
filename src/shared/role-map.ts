import type { FieldAnswer, RoleMapActivity, RoleMapData, RoleMapRole } from "@/shared/surveys";

export function newRoleMapId(prefix = "rm") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugLabel(label: string) {
  return label.slice(0, 16).replace(/\W+/g, "-").toLowerCase();
}

export function buildInitialRoleMap(input: {
  suggestedRoles: { label: string; hint?: string }[];
  frequent: string[];
  secondary: string[];
}): RoleMapData {
  const roles: RoleMapRole[] = input.suggestedRoles.map((role, index) => ({
    id: `role-tpl-${index}-${slugLabel(role.label)}`,
    label: role.label,
    hint: role.hint,
    personName: "",
    source: "suggested",
  }));

  const activities: RoleMapActivity[] = [
    ...input.frequent.map((label, index) => ({
      id: `act-fr-${index}-${slugLabel(label)}`,
      label,
      source: "frequent" as const,
      roleId: null,
    })),
    ...input.secondary.map((label, index) => ({
      id: `act-sc-${index}-${slugLabel(label)}`,
      label,
      source: "secondary" as const,
      roleId: null,
    })),
  ];

  return { roles, activities };
}

export function hasRoleMapContent(data: RoleMapData | undefined) {
  if (!data) return false;
  if (data.roles.some((role) => role.personName.trim() || role.label.trim())) return true;
  if (data.activities.some((activity) => activity.roleId)) return true;
  if (data.legacyNotes?.trim()) return true;
  return false;
}

/** Migrates legacy free-text people answers into roleMap notes. */
export function coalesceRoleMapAnswer(
  answer: FieldAnswer | undefined,
  init: { suggestedRoles: { label: string; hint?: string }[]; frequent: string[]; secondary: string[] },
): FieldAnswer {
  const base = answer ?? {};
  if (base.roleMap && (base.roleMap.roles.length > 0 || base.roleMap.activities.length > 0)) {
    return base;
  }

  const initial = buildInitialRoleMap(init);
  const legacy = base.text?.trim();
  if (legacy) {
    return { ...base, roleMap: { ...initial, legacyNotes: legacy }, text: undefined };
  }

  return { ...base, roleMap: initial };
}

export function roleMapActivitiesForRole(data: RoleMapData, roleId: string) {
  return data.activities.filter((activity) => activity.roleId === roleId);
}

export function roleMapUnassignedActivities(data: RoleMapData) {
  return data.activities.filter((activity) => !activity.roleId);
}

export function assignRoleMapActivity(data: RoleMapData, activityId: string, roleId: string | null): RoleMapData {
  return {
    ...data,
    activities: data.activities.map((activity) =>
      activity.id === activityId ? { ...activity, roleId } : activity,
    ),
  };
}
