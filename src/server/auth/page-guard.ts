import { redirect } from "next/navigation";
import { getCurrentUser, userHasModule } from "@/server/auth/session";
import type { ModuleKey } from "@/shared/modules";
import type { User } from "@/server/db/schema";

export async function requirePageUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePageModule(module: ModuleKey): Promise<User> {
  const user = await requirePageUser();
  const allowed = await userHasModule(user, module);
  if (!allowed) redirect("/dashboard");
  return user;
}

export async function requirePageAnyModule(modules: ModuleKey[]): Promise<User> {
  const user = await requirePageUser();
  for (const module of modules) {
    if (await userHasModule(user, module)) return user;
  }
  redirect("/dashboard");
}
