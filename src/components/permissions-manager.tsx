"use client";

import { useEffect, useState } from "react";
import { MODULE_LABELS, MODULES, ROLE_LABELS, ROLES, type ModuleKey, type RoleKey } from "@/shared/modules";

export function PermissionsManager() {
  const [permissions, setPermissions] = useState<Record<RoleKey, ModuleKey[]>>({
    administrador: [...MODULES],
    vendedor: [],
    programador: [],
  });
  const [selectedRole, setSelectedRole] = useState<RoleKey>("vendedor");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/permissions")
      .then((r) => r.json())
      .then((d) => setPermissions(d.permissions));
  }, []);

  function toggleModule(module: ModuleKey) {
    setPermissions((prev) => {
      const current = prev[selectedRole];
      const next = current.includes(module)
        ? current.filter((m) => m !== module)
        : [...current, module];
      return { ...prev, [selectedRole]: next };
    });
    setSaved(false);
  }

  async function save() {
    await fetch("/api/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole, modules: permissions[selectedRole] }),
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
            onClick={() => { setSelectedRole(role); setSaved(false); }}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      <div className="card grid gap-2 md:grid-cols-2">
        {MODULES.map((module) => (
          <label key={module} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={permissions[selectedRole]?.includes(module) ?? false}
              onChange={() => toggleModule(module)}
            />
            {MODULE_LABELS[module]}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={save}>Guardar permisos</button>
        {saved && <span className="text-sm text-[var(--success)]">Guardado</span>}
      </div>
    </div>
  );
}
