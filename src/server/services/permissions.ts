import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { roleModulePermissions } from "@/server/db/schema";
import {
  defaultPermissionsForRole,
  MODULES,
  type ModuleAccess,
  type ModuleKey,
  type RoleKey,
  type RolePermissions,
} from "@/shared/modules";

function normalizeAccess(access: ModuleAccess): ModuleAccess {
  const canRead = access.canWrite || access.canRead;
  const canWrite = access.canWrite && canRead;
  return { canRead, canWrite };
}

export async function getRolePermissions(role: RoleKey): Promise<RolePermissions> {
  const db = getDb();
  const rows = await db
    .select()
    .from(roleModulePermissions)
    .where(eq(roleModulePermissions.role, role));

  const defaults = defaultPermissionsForRole(role);

  if (rows.length === 0) {
    return defaults;
  }

  const result = { ...defaults };
  for (const row of rows) {
    result[row.module as ModuleKey] = normalizeAccess({
      canRead: row.canRead,
      canWrite: row.canWrite,
    });
  }
  return result;
}

/** Módulos visibles en navegación (al menos lectura). */
export async function getRoleModules(role: RoleKey): Promise<ModuleKey[]> {
  const perms = await getRolePermissions(role);
  return MODULES.filter((m) => perms[m].canRead);
}

export async function getModuleAccess(role: RoleKey, module: ModuleKey): Promise<ModuleAccess> {
  const perms = await getRolePermissions(role);
  return perms[module];
}

export async function setRolePermissions(
  role: RoleKey,
  items: Array<{ module: ModuleKey; canRead: boolean; canWrite: boolean }>,
): Promise<void> {
  const db = getDb();
  const byModule = new Map(items.map((item) => [item.module, normalizeAccess(item)]));

  for (const module of MODULES) {
    const access = byModule.get(module) ?? { canRead: false, canWrite: false };
    await db
      .insert(roleModulePermissions)
      .values({ role, module, canRead: access.canRead, canWrite: access.canWrite })
      .onConflictDoUpdate({
        target: [roleModulePermissions.role, roleModulePermissions.module],
        set: { canRead: access.canRead, canWrite: access.canWrite },
      });
  }
}

export async function getAllRolePermissions(): Promise<Record<RoleKey, RolePermissions>> {
  const result = {} as Record<RoleKey, RolePermissions>;
  for (const role of ["administrador", "vendedor", "programador"] as RoleKey[]) {
    result[role] = await getRolePermissions(role);
  }
  return result;
}
