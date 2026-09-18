"use client";

import { coalesceSystemRoleIds, systemRoleOptions } from "@/shared/system-roles";
import type { AssigneeCatalogData, FieldAnswer } from "@/shared/surveys";

type SurveySystemRolesMultiSelectProps = {
  label: string;
  hint?: string;
  catalog: AssigneeCatalogData | undefined;
  answer: FieldAnswer;
  disabled?: boolean;
  onChange: (next: FieldAnswer) => void;
};

export function SurveySystemRolesMultiSelect({
  label,
  hint,
  catalog,
  answer,
  disabled = false,
  onChange,
}: SurveySystemRolesMultiSelectProps) {
  const options = systemRoleOptions(catalog);
  const selected = new Set(coalesceSystemRoleIds(answer));

  function toggle(roleId: string) {
    const next = new Set(selected);
    if (next.has(roleId)) next.delete(roleId);
    else next.add(roleId);
    onChange({ ...answer, assigneeIds: [...next], assigneeId: null });
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      {options.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">Agregue roles en Datos generales para habilitar esta selección.</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {options.map((option) => (
            <label key={option.id} className="text-sm flex items-center gap-2 min-h-9">
              <input
                type="checkbox"
                checked={selected.has(option.id)}
                disabled={disabled}
                onChange={() => toggle(option.id)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
