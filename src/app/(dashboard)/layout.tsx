import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/auth/session";
import { getRoleModules } from "@/server/services/permissions";
import { filterNavGroups, NAV_GROUPS } from "@/shared/navigation";
import type { RoleKey } from "@/shared/modules";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const modules = await getRoleModules(user.role as RoleKey);
  const navGroups = filterNavGroups(NAV_GROUPS, modules);

  return (
    <AppShell
      groups={navGroups}
      user={{ name: user.name, role: user.role }}
    >
      <div className="page-frame">{children}</div>
    </AppShell>
  );
}
