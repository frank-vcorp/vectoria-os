"use client";

import { useEffect, useRef, useState } from "react";
import {
  assignRoleMapActivity,
  buildInitialRoleMap,
  newRoleMapId,
  roleMapActivitiesForRole,
  roleMapUnassignedActivities,
} from "@/shared/role-map";
import type { RoleMapData } from "@/shared/surveys";

type SurveyRoleMapBuilderProps = {
  label: string;
  hint?: string;
  suggestedRoles: { label: string; hint?: string }[];
  frequent: string[];
  secondary: string[];
  data: RoleMapData | undefined;
  disabled?: boolean;
  onChange: (next: RoleMapData) => void;
};

export function SurveyRoleMapBuilder({
  label,
  hint,
  suggestedRoles,
  frequent,
  secondary,
  data,
  disabled = false,
  onChange,
}: SurveyRoleMapBuilderProps) {
  const initial = buildInitialRoleMap({ suggestedRoles, frequent, secondary });
  const persisted = Boolean(data?.roles.length);
  const [draft, setDraft] = useState<RoleMapData>(() => data ?? initial);
  const [dragActivityId, setDragActivityId] = useState<string | null>(null);
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [newActivityLabel, setNewActivityLabel] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (data) setDraft(data);
  }, [data]);

  function commit(next: RoleMapData) {
    setDraft(next);
    onChange(next);
  }

  function updateRolePerson(roleId: string, personName: string) {
    commit({
      ...draft,
      roles: draft.roles.map((role) => (role.id === roleId ? { ...role, personName } : role)),
    });
  }

  function updateRoleLabel(roleId: string, roleLabel: string) {
    commit({
      ...draft,
      roles: draft.roles.map((role) => (role.id === roleId ? { ...role, label: roleLabel } : role)),
    });
  }

  function removeRole(roleId: string) {
    commit({
      roles: draft.roles.filter((role) => role.id !== roleId),
      activities: draft.activities.map((activity) =>
        activity.roleId === roleId ? { ...activity, roleId: null } : activity,
      ),
      legacyNotes: draft.legacyNotes,
    });
  }

  function addRole() {
    const trimmed = newRoleLabel.trim();
    if (!trimmed) return;
    commit({
      ...draft,
      roles: [...draft.roles, { id: newRoleMapId("role"), label: trimmed, personName: "", source: "custom" }],
    });
    setNewRoleLabel("");
  }

  function addActivity() {
    const trimmed = newActivityLabel.trim();
    if (!trimmed) return;
    commit({
      ...draft,
      activities: [
        ...draft.activities,
        { id: newRoleMapId("act"), label: trimmed, source: "custom", roleId: null },
      ],
    });
    setNewActivityLabel("");
  }

  function dropOnRole(roleId: string | null) {
    if (!dragActivityId || disabled) return;
    commit(assignRoleMapActivity(draft, dragActivityId, roleId));
    setDragActivityId(null);
  }

  const unassigned = roleMapUnassignedActivities(draft);

  function renderActivityChip(activityId: string, activityLabel: string) {
    return (
      <div
        key={activityId}
        className={`survey-role-activity${dragActivityId === activityId ? " dragging" : ""}`}
        draggable={!disabled}
        onDragStart={() => setDragActivityId(activityId)}
        onDragEnd={() => setDragActivityId(null)}
      >
        <span className="survey-flow-grip" aria-hidden="true">
          ⋮⋮
        </span>
        {activityLabel}
      </div>
    );
  }

  return (
    <fieldset className="survey-role-map space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      {!persisted ? (
        <p className="text-xs text-[var(--muted)] italic">
          Arrastre actividades a cada rol e indique quién las realiza hoy. Una persona puede tener varios roles.
        </p>
      ) : null}
      {draft.legacyNotes ? (
        <p className="text-xs text-[var(--muted)]">
          Nota previa: {draft.legacyNotes}
        </p>
      ) : null}

      <div className="survey-role-map-grid">
        <div
          className="survey-role-pool"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            dropOnRole(null);
          }}
        >
          <p className="survey-role-pool-title">Actividades sin asignar</p>
          <div className="survey-role-activities">
            {unassigned.length > 0 ? (
              unassigned.map((activity) => renderActivityChip(activity.id, activity.label))
            ) : (
              <p className="text-xs text-[var(--muted)]">Todas asignadas</p>
            )}
          </div>
          {!disabled && (
            <div className="flex flex-wrap gap-2 items-center mt-2">
              <input
                className="flex-1 min-w-[10rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                placeholder="Otra actividad"
                value={newActivityLabel}
                onChange={(e) => setNewActivityLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addActivity();
                  }
                }}
              />
              <button type="button" className="btn btn-ghost text-sm" onClick={addActivity}>
                + Actividad
              </button>
            </div>
          )}
        </div>

        <div className="survey-role-cards">
          {draft.roles.map((role) => {
            const assigned = roleMapActivitiesForRole(draft, role.id);
            return (
              <article
                key={role.id}
                className="survey-role-card"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOnRole(role.id);
                }}
              >
                <div className="survey-role-card-head">
                  <input
                    className="survey-role-title"
                    value={role.label}
                    disabled={disabled}
                    onChange={(e) => updateRoleLabel(role.id, e.target.value)}
                    aria-label="Nombre del rol"
                  />
                  {!disabled && role.source === "custom" ? (
                    <button type="button" className="survey-flow-remove" onClick={() => removeRole(role.id)}>
                      ×
                    </button>
                  ) : null}
                </div>
                {role.hint ? <p className="survey-role-hint">{role.hint}</p> : null}
                <label className="survey-role-person">
                  <span>Persona que lo hace hoy</span>
                  <input
                    value={role.personName}
                    disabled={disabled}
                    placeholder="Nombre"
                    onChange={(e) => updateRolePerson(role.id, e.target.value)}
                  />
                </label>
                <div className="survey-role-activities">
                  {assigned.length > 0 ? (
                    assigned.map((activity) => renderActivityChip(activity.id, activity.label))
                  ) : (
                    <p className="text-xs text-[var(--muted)]">Arrastre actividades aquí</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {!disabled && (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="flex-1 min-w-[12rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            placeholder="Nuevo rol"
            value={newRoleLabel}
            onChange={(e) => setNewRoleLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRole();
              }
            }}
          />
          <button type="button" className="btn btn-ghost text-sm" onClick={addRole}>
            + Rol
          </button>
        </div>
      )}
    </fieldset>
  );
}
