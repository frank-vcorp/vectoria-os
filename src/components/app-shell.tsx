"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { PwaInstallPrompt } from "@/components/pwa-manager";
import { OfflineStatusBar } from "@/components/offline-status-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NavGroup } from "@/shared/navigation";
import { ROLE_LABELS, type RoleKey } from "@/shared/modules";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`nav-link${active ? " nav-link-active" : ""}`}>
      {label}
    </Link>
  );
}

export function AppShell({
  groups,
  user,
  children,
}: {
  groups: NavGroup[];
  user: { name: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const roleLabel = ROLE_LABELS[user.role as RoleKey] ?? user.role;

  const mobileTabs = groups
    .flatMap((g) => g.items)
    .filter((item) => item.mobilePrimary)
    .slice(0, 5);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <div className="app-sidebar-inner">
      <div className="app-brand">
        <div className="app-logo-wrap">
          <Image src="/logo.png" alt="VectorIA" width={140} height={36} className="app-logo" priority />
        </div>
        <p className="app-user-name">{user.name}</p>
        <span className="badge badge-role">{roleLabel}</span>
      </div>

      <nav className="app-nav" aria-label="Principal">
        {groups.map((group) => (
          <div key={group.id} className="nav-group">
            <p className="nav-group-title">{group.title}</p>
            <div className="nav-group-links">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={isActive(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="app-sidebar-footer">
        <div className="app-sidebar-footer-tools">
          <ThemeToggle />
        </div>
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <aside className="app-sidebar desktop-only" aria-label="Menú lateral">
        {sidebar}
      </aside>

      {drawerOpen && (
        <button
          type="button"
          className="app-drawer-backdrop mobile-only"
          aria-label="Cerrar menú"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside className={`app-drawer mobile-only${drawerOpen ? " app-drawer-open" : ""}`} aria-hidden={!drawerOpen}>
        {sidebar}
      </aside>

      <div className="app-main-column">
        <PwaInstallPrompt />
        <OfflineStatusBar />
        <header className="app-topbar mobile-only">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Abrir menú"
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </button>
          <Image src="/logo.png" alt="VectorIA" width={108} height={28} className="app-logo-top" priority />
          <ThemeToggle />
        </header>

        <main className="app-main">{children}</main>

        {mobileTabs.length > 0 && (
          <nav className="app-tabbar mobile-only" aria-label="Accesos rápidos">
            {mobileTabs.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`app-tab${isActive(item.href) ? " app-tab-active" : ""}`}
              >
                <span className="app-tab-label">{item.label.split(" ")[0]}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
