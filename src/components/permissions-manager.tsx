"use client";

import { useEffect, useState } from "react";
import {
  MODULE_LABELS,
  MODULES,
  ROLE_LABELS,
  ROLES,
  defaultPermissionsForRole,
  type ModuleKey,
  type RoleKey,
  type RolePermissions,
} from "@/shared/modules";

function emptyPermissions(): Record<RoleKey, RolePermissions> {
  return {
    administrador: defaultPermissionsForRole("administrador"),
    vendedor: defaultPermissionsForRole("vendedor"),
    programador: defaultPermissionsForRole("programador"),
  };
}

export function PermissionsManager() {
  const [permissions, setPermissions] = useState<Record<RoleKey, RolePermissions>>(emptyPermissions);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("vendedor");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/permissions")
      .then((r) => r.json())
      .then((d) => setPermissions(d.permissions));
  }, []);

  function setAccess(module: ModuleKey, field: "canRead" | "canWrite", value: boolean) {
    setPermissions((prev) => {
      const current = prev[selectedRole][module];
      const next = { ...current, [field]: value };
      if (field === "canWrite" && value) next.canRead = true;
      if (field === "canRead" && !value) next.canWrite = false;
      return {
        ...prev,
        [selectedRole]: { ...prev[selectedRole], [module]: next },
      };
    });
    setSaved(false);
  }

  async function save() {
    const rolePerms = permissions[selectedRole];
    await fetch("/api/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: selectedRole,
        permissions: MODULES.map((module) => ({
          module,
          canRead: rolePerms[module].canRead,
          canWrite: rolePerms[module].canWrite,
        })),
      }),
    });
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            className={`btn ${selectedRole === role ? "btn-primary" : "btn-ghost"}`}
            onClick={() => {
              setSelectedRole(role);
              setSaved(false);
            }}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-4 font-medium">Módulo</th>
              <th className="py-2 px-4 font-medium w-24 text-center">Lectura</th>
              <th className="py-2 pl-4 font-medium w-24 text-center">Escritura</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module) => (
              <tr key={module} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-4">{MODULE_LABELS[module]}</td>
                <td className="py-2 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={permissions[selectedRole][module].canRead}
                    onChange={(e) => setAccess(module, "canRead", e.target.checked)}
                    aria-label={`Lectura: ${MODULE_LABELS[module]}`}
                  />
                </td>
                <td className="py-2 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={permissions[selectedRole][module].canWrite}
                    onChange={(e) => setAccess(module, "canWrite", e.target.checked)}
                    aria-label={`Escritura: ${MODULE_LABELS[module]}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={save}>
          Guardar permisos
        </button>
        {saved && <span className="text-sm text-[var(--success)]">Guardado</span>}
      </div>
    </div>
  );
}
