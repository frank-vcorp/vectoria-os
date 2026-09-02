import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { roleModulePermissions } from "@/server/db/schema";
import {
  DEFAULT_ROLE_MODULES,
  MODULES,
  type ModuleKey,
  type RoleKey,
} from "@/shared/modules";

export async function getRoleModules(role: RoleKey): Promise<ModuleKey[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(roleModulePermissions)
    .where(eq(roleModulePermissions.role, role));

  if (rows.length === 0) {
    return DEFAULT_ROLE_MODULES[role];
  }

  return rows.filter((r) => r.enabled).map((r) => r.module as ModuleKey);
}

export async function setRoleModules(role: RoleKey, modules: ModuleKey[]): Promise<void> {
  const db = getDb();
  for (const module of MODULES) {
    await db
      .insert(roleModulePermissions)
      .values({ role, module, enabled: modules.includes(module) })
      .onConflictDoUpdate({
        target: [roleModulePermissions.role, roleModulePermissions.module],
        set: { enabled: modules.includes(module) },
      });
  }
}

export async function getAllRolePermissions(): Promise<Record<RoleKey, ModuleKey[]>> {
  const result = {} as Record<RoleKey, ModuleKey[]>;
  for (const role of ["administrador", "vendedor", "programador"] as RoleKey[]) {
    result[role] = await getRoleModules(role);
  }
  return result;
}
