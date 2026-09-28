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

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SidebarExpandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 12h10M4 18h16M15 9l3 3-3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarCollapseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M10 12h10M4 18h16M9 9l-3 3 3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SIDEBAR_COLLAPSED_KEY = "vectoria-sidebar-collapsed";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarReady, setSidebarReady] = useState(false);
  const roleLabel = ROLE_LABELS[user.role as RoleKey] ?? user.role;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "0") setSidebarCollapsed(false);
      else if (stored === "1") setSidebarCollapsed(true);
    } catch {
      /* ignore */
    }
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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
    <>
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
    </>
  );

  return (
    <div className="app-shell">
      <aside
        className={`app-sidebar desktop-only${sidebarCollapsed ? " is-collapsed" : ""}${sidebarReady ? " is-ready" : ""}`}
        aria-label="Menú lateral"
        aria-expanded={!sidebarCollapsed}
      >
        <button
          type="button"
          className="app-sidebar-toggle btn btn-ghost btn-icon"
          aria-label={sidebarCollapsed ? "Mostrar menú" : "Ocultar menú"}
          title={sidebarCollapsed ? "Mostrar menú" : "Ocultar menú"}
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? <SidebarExpandIcon /> : <SidebarCollapseIcon />}
        </button>
        {sidebarCollapsed ? (
          <Link href="/dashboard" className="app-sidebar-mini-logo" aria-label="Inicio">
            <Image src="/logo.png" alt="" width={32} height={32} className="app-sidebar-mini-logo-img" />
          </Link>
        ) : null}
        <div className="app-sidebar-inner">{sidebar}</div>
      </aside>

      {drawerOpen && (
        <button
          type="button"
          className="app-drawer-backdrop mobile-only"
          aria-label="Cerrar menú"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`app-drawer mobile-only${drawerOpen ? " app-drawer-open" : ""}`}
        aria-hidden={!drawerOpen}
        inert={drawerOpen ? undefined : true}
      >
        <div className="app-drawer-header">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="app-sidebar-inner">{sidebar}</div>
      </aside>

      <div className="app-main-column">
        <PwaInstallPrompt />
        <OfflineStatusBar />
        <header className="app-topbar mobile-only">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </button>
          <Image src="/logo.png" alt="VectorIA" width={108} height={28} className="app-logo-top" priority />
          <ThemeToggle />
        </header>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
