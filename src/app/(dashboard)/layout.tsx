import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getRoleModules } from "@/server/services/permissions";
import type { ModuleKey, RoleKey } from "@/shared/modules";
import { LogoutButton } from "@/components/logout-button";

const NAV: { href: string; module: ModuleKey; label: string }[] = [
  { href: "/dashboard", module: "clientes", label: "Inicio" },
  { href: "/admin/usuarios", module: "usuarios_roles", label: "Usuarios" },
  { href: "/admin/permisos", module: "usuarios_roles", label: "Permisos" },
  { href: "/admin/auditoria", module: "usuarios_roles", label: "Auditoría" },
  { href: "/catalogos", module: "catalogos", label: "Catálogos" },
  { href: "/catalogos/planes-desarrollo", module: "catalogos", label: "Planes de Desarrollo" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const modules = await getRoleModules(user.role as RoleKey);
  const navItems = NAV.filter((item) => item.href === "/dashboard" || modules.includes(item.module));

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-6">
        <div>
          <p className="font-semibold text-lg">VectorIA OS</p>
          <p className="text-sm text-[var(--muted)]">{user.name}</p>
          <span className="badge mt-2">{user.role}</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
