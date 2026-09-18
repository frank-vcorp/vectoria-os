"use client";

import { useState } from "react";
import { checklistAllOptions, isCustomChecklistOption } from "@/shared/checklist-options";
import { toggleChecklistValue, type FieldAnswer } from "@/shared/surveys";
import type { TemplateField } from "@/shared/survey-templates";

type SurveyProcessChecklistProps = {
  field: TemplateField;
  answer: FieldAnswer;
  disabled?: boolean;
  onChange: (next: FieldAnswer) => void;
};

export function SurveyProcessChecklist({ field, answer, disabled = false, onChange }: SurveyProcessChecklistProps) {
  const [newProcess, setNewProcess] = useState("");
  const baseOptions = field.options ?? [];
  const allOptions = checklistAllOptions(baseOptions, answer);
  const selected = answer.selected ?? [];

  function addProcess() {
    const trimmed = newProcess.trim();
    if (!trimmed) return;
    const customOptions = [...(answer.customOptions ?? [])];
    if (!customOptions.includes(trimmed) && !baseOptions.includes(trimmed)) {
      customOptions.push(trimmed);
    }
    const nextSelected = selected.includes(trimmed) ? selected : [...selected, trimmed];
    onChange({ ...answer, customOptions, selected: nextSelected, other: undefined });
    setNewProcess("");
  }

  function removeCustomOption(option: string) {
    onChange({
      ...answer,
      customOptions: (answer.customOptions ?? []).filter((item) => item !== option),
      selected: selected.filter((item) => item !== option),
    });
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{field.label}</legend>
      {field.hint ? <p className="text-xs text-[var(--muted)]">{field.hint}</p> : null}
      <div className="grid gap-2 md:grid-cols-2">
        {allOptions.map((option) => {
          const custom = isCustomChecklistOption(baseOptions, option);
          return (
            <div key={option} className="flex items-center gap-2 min-h-9">
              <label className="text-sm flex items-center gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  disabled={disabled}
                  onChange={() =>
                    onChange({
                      ...answer,
                      selected: toggleChecklistValue(selected, option, field.exclusiveValues),
                    })
                  }
                />
                {option}
              </label>
              {custom && !disabled ? (
                <button type="button" className="btn btn-ghost text-xs px-1" onClick={() => removeCustomOption(option)}>
                  Quitar
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {!disabled ? (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
            placeholder={field.addLabel ?? "Agregar proceso"}
            value={newProcess}
            onChange={(e) => setNewProcess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProcess();
              }
            }}
          />
          <button type="button" className="btn btn-ghost text-xs" onClick={addProcess}>
            Agregar
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}
