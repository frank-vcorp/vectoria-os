"use client";

import { coalesceSystemRoleIds, systemRoleOptions } from "@/shared/system-roles";
import type { AssigneeCatalogData, FieldAnswer } from "@/shared/surveys";

type SystemRolesCheckboxGroupProps = {
  catalog: AssigneeCatalogData | undefined;
  selectedIds: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
  compact?: boolean;
  emptyMessage?: string;
};

export function SystemRolesCheckboxGroup({
  catalog,
  selectedIds,
  disabled = false,
  onChange,
  compact = false,
  emptyMessage = "Agregue roles en Datos generales para habilitar esta selección.",
}: SystemRolesCheckboxGroupProps) {
  const options = systemRoleOptions(catalog);
  const selected = new Set(selectedIds);

  function toggle(roleId: string) {
    const next = new Set(selected);
    if (next.has(roleId)) next.delete(roleId);
    else next.add(roleId);
    onChange([...next]);
  }

  if (options.length === 0) {
    return <p className="text-xs text-[var(--muted)]">{emptyMessage}</p>;
  }

  return (
    <div className={compact ? "space-y-1" : "grid gap-2 md:grid-cols-2"}>
      {options.map((option) => (
        <label
          key={option.id}
          className={`flex items-center gap-2 ${compact ? "text-xs min-h-7" : "text-sm min-h-9"}`}
        >
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
  );
}

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
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      <SystemRolesCheckboxGroup
        catalog={catalog}
        selectedIds={coalesceSystemRoleIds(answer)}
        disabled={disabled}
        onChange={(assigneeIds) => onChange({ ...answer, assigneeIds, assigneeId: null })}
      />
    </fieldset>
  );
}
