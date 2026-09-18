"use client";

import { useEffect, useRef, useState } from "react";
import { coalesceSystemRolesCatalog, newAssigneeId } from "@/shared/system-roles";
import type { AssigneeCatalogData } from "@/shared/surveys";

type SurveySystemRolesBuilderProps = {
  label: string;
  hint?: string;
  data: AssigneeCatalogData | undefined;
  disabled?: boolean;
  onChange: (next: AssigneeCatalogData) => void;
};

export function SurveySystemRolesBuilder({
  label,
  hint,
  data,
  disabled = false,
  onChange,
}: SurveySystemRolesBuilderProps) {
  const [draft, setDraft] = useState<AssigneeCatalogData>(() => coalesceSystemRolesCatalog({ assigneeCatalog: data }));
  const [newLabel, setNewLabel] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (data) setDraft(coalesceSystemRolesCatalog({ assigneeCatalog: data }));
  }, [data]);

  function commit(next: AssigneeCatalogData) {
    setDraft(next);
    onChange(next);
  }

  function addRole() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    commit({
      assignees: [
        ...draft.assignees,
        { id: newAssigneeId("role"), label: trimmed, personName: "", source: "custom" },
      ],
    });
    setNewLabel("");
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      {draft.assignees.length > 0 ? (
        <ul className="space-y-1">
          {draft.assignees.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
                disabled={disabled}
                value={item.label}
                onChange={(e) =>
                  commit({
                    assignees: draft.assignees.map((role) =>
                      role.id === item.id ? { ...role, label: e.target.value } : role,
                    ),
                  })
                }
              />
              {!disabled ? (
                <button
                  type="button"
                  className="btn btn-ghost text-xs px-2"
                  aria-label={`Quitar ${item.label || "rol"}`}
                  onClick={() => commit({ assignees: draft.assignees.filter((role) => role.id !== item.id) })}
                >
                  Quitar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--muted)]">Sin roles. Agregue al menos uno para usarlo en las áreas transversales.</p>
      )}
      {!disabled ? (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
            placeholder="Nombre del rol"
            value={newLabel}
            disabled={disabled}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRole();
              }
            }}
          />
          <button type="button" className="btn btn-ghost text-xs" onClick={addRole}>
            Agregar
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}
