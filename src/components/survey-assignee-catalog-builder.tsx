"use client";

import { useEffect, useRef, useState } from "react";
import { coalesceAssigneeCatalog, newAssigneeId } from "@/shared/assignee-catalog";
import type { AssigneeCatalogData } from "@/shared/surveys";

type SurveyAssigneeCatalogBuilderProps = {
  label: string;
  hint?: string;
  suggested: { label: string; hint?: string }[];
  data: AssigneeCatalogData | undefined;
  disabled?: boolean;
  onChange: (next: AssigneeCatalogData) => void;
};

export function SurveyAssigneeCatalogBuilder({
  label,
  hint,
  suggested,
  data,
  disabled = false,
  onChange,
}: SurveyAssigneeCatalogBuilderProps) {
  const [draft, setDraft] = useState<AssigneeCatalogData>(() =>
    coalesceAssigneeCatalog(data ? { assigneeCatalog: data } : undefined, suggested),
  );
  const [newLabel, setNewLabel] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (data) setDraft(coalesceAssigneeCatalog({ assigneeCatalog: data }, suggested));
  }, [data, suggested]);

  function commit(next: AssigneeCatalogData) {
    setDraft(next);
    onChange(next);
  }

  function updatePerson(id: string, personName: string) {
    commit({
      ...draft,
      assignees: draft.assignees.map((item) => (item.id === id ? { ...item, personName } : item)),
    });
  }

  function updateLabel(id: string, nextLabel: string) {
    commit({
      ...draft,
      assignees: draft.assignees.map((item) => (item.id === id ? { ...item, label: nextLabel } : item)),
    });
  }

  function removeAssignee(id: string) {
    commit({ ...draft, assignees: draft.assignees.filter((item) => item.id !== id) });
  }

  function addAssignee() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    commit({
      ...draft,
      assignees: [
        ...draft.assignees,
        { id: newAssigneeId(), label: trimmed, personName: "", source: "custom" },
      ],
    });
    setNewLabel("");
  }

  return (
    <div className="survey-role-map-grid">
      <div className="survey-role-pool md:col-span-2">
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-xs text-[var(--muted)] mt-1">{hint}</p> : null}
        <div className="survey-role-cards mt-3">
          {draft.assignees.map((item) => (
            <article key={item.id} className="survey-role-card">
              <div className="survey-role-card-head">
                {item.source === "custom" ? (
                  <input
                    className="survey-role-title"
                    disabled={disabled}
                    value={item.label}
                    onChange={(e) => updateLabel(item.id, e.target.value)}
                  />
                ) : (
                  <strong className="survey-role-title">{item.label}</strong>
                )}
                {item.source === "custom" && !disabled ? (
                  <button type="button" className="survey-flow-remove" onClick={() => removeAssignee(item.id)}>
                    ×
                  </button>
                ) : null}
              </div>
              {item.hint ? <p className="survey-role-hint">{item.hint}</p> : null}
              <label className="survey-role-person">
                <span>Persona de referencia (opcional)</span>
                <input
                  disabled={disabled}
                  value={item.personName}
                  placeholder="Nombre o puesto en la empresa entrevistada"
                  onChange={(e) => updatePerson(item.id, e.target.value)}
                />
              </label>
            </article>
          ))}
        </div>
        {!disabled ? (
          <div className="flex flex-wrap gap-2 mt-3">
            <input
              className="flex-1 min-w-[12rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
              placeholder="Agregar encargado personalizado"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAssignee();
                }
              }}
            />
            <button type="button" className="btn btn-ghost text-xs" onClick={addAssignee}>
              Agregar encargado
            </button>
          </div>
        ) : null}
        {draft.assignees.length === 0 ? (
          <p className="text-xs text-[var(--muted)] mt-2">
            Complete al menos un encargado para habilitar los selectores de este levantamiento.
          </p>
        ) : null}
      </div>
    </div>
  );
}
