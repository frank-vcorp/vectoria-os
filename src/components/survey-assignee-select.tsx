"use client";

import { assigneeCatalogOptions } from "@/shared/assignee-catalog";
import type { AssigneeCatalogData } from "@/shared/surveys";

type SurveyAssigneeSelectProps = {
  label: string;
  hint?: string;
  catalog: AssigneeCatalogData | undefined;
  options?: { id: string; label: string }[];
  value: string | null | undefined;
  disabled?: boolean;
  onChange: (assigneeId: string | null) => void;
};

export function SurveyAssigneeSelect({
  label,
  hint,
  catalog,
  options: optionsOverride,
  value,
  disabled = false,
  onChange,
}: SurveyAssigneeSelectProps) {
  const options = optionsOverride ?? assigneeCatalogOptions(catalog);

  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="block text-xs text-[var(--muted)]">{hint}</span> : null}
      {options.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">
          {optionsOverride ? "Agregue roles en Datos generales para habilitar este selector." : "Complete primero el catálogo de encargados de procesos para habilitar este selector."}
        </p>
      ) : (
        <select
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          disabled={disabled}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">Seleccionar encargado…</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}
