import { createHash, randomBytes } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import type { User } from "@/server/db/schema";
import type { ModuleKey, RoleKey } from "@/shared/modules";
import { DEFAULT_ROLE_MODULES } from "@/shared/modules";
import { getModuleAccess } from "@/server/services/permissions";

const SESSION_COOKIE = "vectoria_session";
const SESSION_DAYS = 7;

export type ModuleAccessLevel = "read" | "write";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row || row.user.status !== "activo") return null;
  return row.user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function userCanReadModule(user: User, module: ModuleKey): Promise<boolean> {
  if (user.role === "administrador") return true;
  const access = await getModuleAccess(user.role as RoleKey, module);
  return access.canRead;
}

export async function userCanWriteModule(user: User, module: ModuleKey): Promise<boolean> {
  if (user.role === "administrador") return true;
  const access = await getModuleAccess(user.role as RoleKey, module);
  return access.canWrite;
}

/** Acceso de lectura al módulo (navegación y páginas). */
export async function userHasModule(user: User, module: ModuleKey): Promise<boolean> {
  return userCanReadModule(user, module);
}

export async function requireModule(
  user: User,
  module: ModuleKey,
  access: ModuleAccessLevel = "read",
): Promise<void> {
  const allowed =
    access === "write"
      ? await userCanWriteModule(user, module)
      : await userCanReadModule(user, module);
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }
}

export { SESSION_COOKIE, DEFAULT_ROLE_MODULES };
