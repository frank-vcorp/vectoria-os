import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { writeAudit } from "@/server/services/audit";
import type { RoleKey } from "@/shared/modules";

export async function listUsers() {
  const db = getDb();
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(asc(users.name));
}

export async function listActiveProgrammers() {
  const db = getDb();
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.role, "programador"), eq(users.status, "activo")))
    .orderBy(asc(users.name));
}

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: RoleKey;
  createdBy?: string;
}) {
  const db = getDb();
  const passwordHash = await hashPassword(params.password);

  const [user] = await db
    .insert(users)
    .values({
      name: params.name,
      email: params.email.toLowerCase(),
      passwordHash,
      role: params.role,
      createdBy: params.createdBy ?? null,
      updatedBy: params.createdBy ?? null,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
    });

  await writeAudit({
    entity: "user",
    entityId: user.id,
    action: "create",
    userId: params.createdBy,
  });

  return user;
}

export async function updateUser(params: {
  id: string;
  name?: string;
  email?: string;
  role?: RoleKey;
  status?: "activo" | "inactivo";
  password?: string;
  updatedBy?: string;
}) {
  const db = getDb();
  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy: params.updatedBy ?? null,
  };

  if (params.name) updates.name = params.name;
  if (params.email) updates.email = params.email.toLowerCase();
  if (params.role) updates.role = params.role;
  if (params.status) updates.status = params.status;
  if (params.password) updates.passwordHash = await hashPassword(params.password);

  const [user] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, params.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
    });

  await writeAudit({
    entity: "user",
    entityId: params.id,
    action: "update",
    userId: params.updatedBy,
  });

  return user;
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return user ?? null;
}
