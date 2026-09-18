"use client";

import { useState } from "react";
import { SystemRolesCheckboxGroup } from "@/components/survey-system-roles-multi-select";
import { coalesceRoleIdList, systemRoleOptions } from "@/shared/system-roles";
import { coalesceModuleLinks, newModuleLinkId } from "@/shared/module-links";
import { coalesceOsActions, enabledOsActions, newOsActionId } from "@/shared/os-actions";
import { SER_V2_CLIENT_CATALOGS, SER_V2_REPORT_OUTPUTS } from "@/shared/ser-v2-constants";
import { buildSerV2References } from "@/shared/ser-v2-refs";
import { coalesceWorkStatuses, newWorkStatusId } from "@/shared/work-statuses";
import type {
  AssigneeCatalogData,
  ClientCatalogsData,
  ExtraFieldsData,
  FieldAnswer,
  ModuleLinksData,
  OsActionsData,
  ReportOutputsData,
  SpecialRulesData,
  SurveyAnswers,
  WorkStatusesData,
} from "@/shared/surveys";

function RoleCheckboxField({
  catalog,
  ids,
  legacyId,
  disabled,
  onChange,
  label,
}: {
  catalog: AssigneeCatalogData | undefined;
  ids?: string[];
  legacyId?: string | null;
  disabled?: boolean;
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  return (
    <div className="space-y-1">
      {label ? <span className="text-xs">{label}</span> : null}
      <SystemRolesCheckboxGroup
        catalog={catalog}
        selectedIds={coalesceRoleIdList(ids, legacyId)}
        disabled={disabled}
        compact
        onChange={onChange}
      />
    </div>
  );
}

function NoteToggle({
  value,
  disabled,
  onChange,
}: {
  value?: string;
  disabled?: boolean;
  onChange: (note: string | undefined) => void;
}) {
  const [open, setOpen] = useState(Boolean(value?.trim()));
  if (!open) {
    return (
      <button type="button" className="btn btn-ghost text-xs" disabled={disabled} onClick={() => setOpen(true)}>
        Agregar nota
      </button>
    );
  }
  return (
    <textarea
      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      rows={2}
      disabled={disabled}
      placeholder="Nota opcional"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value.trim() ? e.target.value : undefined)}
    />
  );
}

export function SurveyOsActionsBuilder({
  label,
  hint,
  catalog,
  data,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  catalog: AssigneeCatalogData | undefined;
  data: OsActionsData;
  disabled?: boolean;
  onChange: (next: OsActionsData) => void;
}) {
  const [newAction, setNewAction] = useState("");
  const [newChecklist, setNewChecklist] = useState("");

  function updateAction(id: string, patch: Partial<(typeof data.actions)[number]>) {
    onChange({
      actions: data.actions.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function addCustomAction(labelValue: string, kind: "custom" | "checklist") {
    const trimmed = labelValue.trim();
    if (!trimmed) return;
    onChange({
      actions: [
        ...data.actions,
        {
          id: newOsActionId(kind === "checklist" ? "chk" : "cus"),
          label: trimmed,
          kind,
          enabled: true,
          assigneeId: null,
          checklistItems: kind === "checklist" ? [""] : undefined,
        },
      ],
    });
    if (kind === "checklist") setNewChecklist("");
    else setNewAction("");
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left pr-2 pb-1">Acción</th>
              <th className="text-left pr-2 pb-1">Roles</th>
              <th className="text-left pb-1">Nota</th>
            </tr>
          </thead>
          <tbody>
            {data.actions.map((action) => {
              const active = action.enabled || action.fixed;
              return (
                <tr key={action.id} className="align-top">
                  <td className="pr-2 pb-3">
                    <label className="flex items-start gap-2">
                      {action.fixed ? (
                        <span className="text-xs mt-1">Incluida</span>
                      ) : (
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={action.enabled}
                          onChange={(e) => updateAction(action.id, { enabled: e.target.checked })}
                        />
                      )}
                      <span>
                        {action.label}
                        {action.kind === "checklist" && action.checklistItems ? (
                          <div className="mt-2 space-y-1">
                            {action.checklistItems.map((item, index) => (
                              <input
                                key={`${action.id}-${index}`}
                                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1 text-xs"
                                disabled={disabled || !active}
                                placeholder={`Punto ${index + 1}`}
                                value={item}
                                onChange={(e) => {
                                  const checklistItems = [...(action.checklistItems ?? [])];
                                  checklistItems[index] = e.target.value;
                                  updateAction(action.id, { checklistItems });
                                }}
                              />
                            ))}
                            {!disabled && active ? (
                              <button
                                type="button"
                                className="btn btn-ghost text-xs"
                                onClick={() =>
                                  updateAction(action.id, {
                                    checklistItems: [...(action.checklistItems ?? []), ""],
                                  })
                                }
                              >
                                Agregar punto
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </span>
                    </label>
                  </td>
                  <td className="pr-2 pb-3 min-w-[12rem]">
                    {active ? (
                      <RoleCheckboxField
                        catalog={catalog}
                        ids={action.assigneeIds}
                        legacyId={action.assigneeId}
                        disabled={disabled}
                        onChange={(assigneeIds) =>
                          updateAction(action.id, { assigneeIds, assigneeId: null })
                        }
                      />
                    ) : (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    )}
                  </td>
                  <td className="pb-3">
                    {active ? (
                      <NoteToggle
                        value={action.note}
                        disabled={disabled}
                        onChange={(note) => updateAction(action.id, { note })}
                      />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!disabled ? (
        <div className="grid gap-2 md:grid-cols-2">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
              placeholder="Agregar otra acción"
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
            />
            <button type="button" className="btn btn-ghost text-xs" onClick={() => addCustomAction(newAction, "custom")}>
              Agregar
            </button>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
              placeholder="Agregar acción tipo checklist"
              value={newChecklist}
              onChange={(e) => setNewChecklist(e.target.value)}
            />
            <button type="button" className="btn btn-ghost text-xs" onClick={() => addCustomAction(newChecklist, "checklist")}>
              Agregar checklist
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SurveyWorkStatusesBuilder({
  label,
  hint,
  catalog,
  actions,
  data,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  catalog: AssigneeCatalogData | undefined;
  actions: OsActionsData;
  data: WorkStatusesData;
  disabled?: boolean;
  onChange: (next: WorkStatusesData) => void;
}) {
  const [newStatus, setNewStatus] = useState("");
  const actionOptions = enabledOsActions(actions);

  function updateStatus(id: string, patch: Partial<(typeof data.statuses)[number]>) {
    onChange({
      ...data,
      statuses: data.statuses.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      </div>
      <div className="space-y-3">
        {data.statuses.map((status) => (
          <article key={status.id} className="survey-role-card">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                disabled={disabled}
                checked={status.selected}
                onChange={(e) => updateStatus(status.id, { selected: e.target.checked })}
              />
              <input
                className="flex-1 bg-transparent border-b border-[var(--border)] px-1 py-0.5"
                disabled={disabled}
                value={status.label}
                onChange={(e) => updateStatus(status.id, { label: e.target.value })}
              />
            </label>
            {status.selected ? (
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <label className="text-xs space-y-1 md:col-span-2">
                  <span>Descripción (opcional)</span>
                  <input
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1"
                    disabled={disabled}
                    value={status.description ?? ""}
                    onChange={(e) => updateStatus(status.id, { description: e.target.value })}
                  />
                </label>
                <label className="text-xs space-y-1">
                  <span>¿Cómo se actualiza?</span>
                  <select
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1"
                    disabled={disabled}
                    value={status.updateMode ?? ""}
                    onChange={(e) =>
                      updateStatus(status.id, {
                        updateMode: (e.target.value || null) as WorkStatusesData["statuses"][number]["updateMode"],
                      })
                    }
                  >
                    <option value="">Seleccionar…</option>
                    <option value="manual">Manualmente</option>
                    <option value="action">Mediante una acción</option>
                    <option value="both">De ambas formas</option>
                  </select>
                </label>
                {(status.updateMode === "action" || status.updateMode === "both") && (
                  <label className="text-xs space-y-1">
                    <span>Acción relacionada</span>
                    <select
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1"
                      disabled={disabled}
                      value={status.relatedActionId ?? ""}
                      onChange={(e) => updateStatus(status.id, { relatedActionId: e.target.value || null })}
                    >
                      <option value="">Seleccionar acción…</option>
                      {actionOptions.map((action) => (
                        <option key={action.id} value={action.id}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {(status.updateMode === "manual" || status.updateMode === "both") && (
                  <div className="text-xs space-y-1 md:col-span-2">
                    <RoleCheckboxField
                      catalog={catalog}
                      ids={status.manualAssigneeIds}
                      legacyId={status.manualAssigneeId}
                      disabled={disabled}
                      label="Quién podrá cambiarlo manualmente"
                      onChange={(manualAssigneeIds) =>
                        updateStatus(status.id, { manualAssigneeIds, manualAssigneeId: null })
                      }
                    />
                  </div>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {!disabled ? (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            placeholder="Agregar otro estatus"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => {
              const trimmed = newStatus.trim();
              if (!trimmed) return;
              onChange({
                ...data,
                statuses: [
                  ...data.statuses,
                  { id: newWorkStatusId(), label: trimmed, selected: true, updateMode: null },
                ],
              });
              setNewStatus("");
            }}
          >
            Agregar estatus
          </button>
        </div>
      ) : null}
      <input
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        disabled={disabled}
        placeholder="Otro estatus (especificar)"
        value={data.other ?? ""}
        onChange={(e) => onChange({ ...data, other: e.target.value })}
      />
    </div>
  );
}

export function SurveyModuleLinksBuilder({
  label,
  catalog,
  data,
  disabled,
  onChange,
}: {
  label: string;
  catalog: AssigneeCatalogData | undefined;
  data: ModuleLinksData;
  disabled?: boolean;
  onChange: (next: ModuleLinksData) => void;
}) {
  const groups = [...new Set(data.links.map((item) => item.group))];

  function updateLink(id: string, patch: Partial<(typeof data.links)[number]>) {
    onChange({ links: data.links.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{label}</p>
      {groups.map((group) => (
        <fieldset key={group} className="space-y-2">
          <legend className="text-sm font-medium">{group}</legend>
          {data.links
            .filter((item) => item.group === group)
            .map((link) => (
              <div key={link.id} className="border border-[var(--border)] rounded-lg p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={link.selected}
                    onChange={(e) => updateLink(link.id, { selected: e.target.checked })}
                  />
                  {link.label}
                </label>
                {link.selected ? (
                  <>
                    <RoleCheckboxField
                      catalog={catalog}
                      ids={link.assigneeIds}
                      legacyId={link.assigneeId}
                      disabled={disabled}
                      label="Roles que podrán utilizarla"
                      onChange={(assigneeIds) => updateLink(link.id, { assigneeIds, assigneeId: null })}
                    />
                    <NoteToggle
                      value={link.note}
                      disabled={disabled}
                      onChange={(note) => updateLink(link.id, { note })}
                    />
                  </>
                ) : null}
              </div>
            ))}
        </fieldset>
      ))}
    </div>
  );
}

export function SurveySpecialRulesBuilder({
  label,
  catalog,
  answers,
  data,
  disabled,
  onChange,
}: {
  label: string;
  catalog: AssigneeCatalogData | undefined;
  answers: SurveyAnswers;
  data: SpecialRulesData;
  disabled?: boolean;
  onChange: (next: SpecialRulesData) => void;
}) {
  const refs = buildSerV2References(answers);

  function updateRule(id: string, patch: Partial<(typeof data.rules)[number]>) {
    onChange({ ...data, rules: data.rules.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  return (
    <div className="space-y-3">
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">{label}</legend>
        <div className="flex flex-wrap gap-3">
          {["Sí", "No", "Por definir"].map((option) => (
            <label key={option} className="text-sm flex items-center gap-2">
              <input
                type="radio"
                name="special-rules"
                disabled={disabled}
                checked={data.hasRules === option}
                onChange={() => onChange({ ...data, hasRules: option })}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
      {data.hasRules === "Sí" ? (
        <div className="space-y-3">
          {data.rules.map((rule) => (
            <article key={rule.id} className="survey-role-card space-y-2">
              <select
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
                disabled={disabled}
                value={rule.appliesTo}
                onChange={(e) => updateRule(rule.id, { appliesTo: e.target.value })}
              >
                <option value="">¿Dónde aplica?</option>
                {refs.map((ref) => (
                  <option key={ref.id} value={ref.id}>
                    {ref.label}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                rows={2}
                disabled={disabled}
                placeholder="¿Cuál es la regla?"
                value={rule.rule}
                onChange={(e) => updateRule(rule.id, { rule: e.target.value })}
              />
              <RoleCheckboxField
                catalog={catalog}
                ids={rule.authorizerIds}
                legacyId={rule.authorizerId}
                disabled={disabled}
                label="Roles que pueden autorizar (opcional)"
                onChange={(authorizerIds) => updateRule(rule.id, { authorizerIds, authorizerId: null })}
              />
            </article>
          ))}
          {!disabled ? (
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() =>
                onChange({
                  ...data,
                  rules: [...data.rules, { id: newModuleLinkId("rule"), appliesTo: "", rule: "" }],
                })
              }
            >
              Agregar regla
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function catalogId(label: string) {
  return label.toLowerCase().replace(/\W+/g, "-");
}

export function SurveyClientCatalogsBuilder({
  label,
  hint,
  data,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  data: ClientCatalogsData;
  disabled?: boolean;
  onChange: (next: ClientCatalogsData) => void;
}) {
  const selected = new Set(data.selected);

  function toggleCatalog(name: string) {
    const nextSelected = selected.has(name) ? data.selected.filter((item) => item !== name) : [...data.selected, name];
    onChange({ ...data, selected: nextSelected });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {SER_V2_CLIENT_CATALOGS.map((option) => (
          <label key={option} className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              disabled={disabled}
              checked={selected.has(option)}
              onChange={() => toggleCatalog(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <input
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        disabled={disabled}
        placeholder="Otros catálogos (especificar)"
        value={data.other ?? ""}
        onChange={(e) => onChange({ ...data, other: e.target.value })}
      />
    </div>
  );
}

export function SurveyReportOutputsBuilder({
  label,
  catalog,
  data,
  disabled,
  onChange,
}: {
  label: string;
  catalog: AssigneeCatalogData | undefined;
  data: ReportOutputsData;
  disabled?: boolean;
  onChange: (next: ReportOutputsData) => void;
}) {
  const outputs: ReportOutputsData["outputs"] =
    data.outputs.length > 0
      ? data.outputs
      : SER_V2_REPORT_OUTPUTS.map((labelItem) => ({
          id: catalogId(labelItem),
          label: labelItem,
          selected: false,
          content: "",
          assigneeId: null,
        }));

  function commit(next: ReportOutputsData) {
    onChange(next);
  }

  function updateOutput(id: string, patch: Partial<(typeof outputs)[number]>) {
    commit({ ...data, outputs: outputs.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  const hasProductivity = outputs.some((item) => item.selected && /productividad|rentabilidad/i.test(item.label));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="space-y-3">
        {outputs.map((output) => (
          <article key={output.id} className="survey-role-card space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={disabled}
                checked={output.selected}
                onChange={(e) => updateOutput(output.id, { selected: e.target.checked })}
              />
              {output.label}
            </label>
            {output.selected ? (
              <>
                <textarea
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  disabled={disabled}
                  placeholder="¿Qué información debe contener?"
                  value={output.content ?? ""}
                  onChange={(e) => updateOutput(output.id, { content: e.target.value })}
                />
                <RoleCheckboxField
                  catalog={catalog}
                  ids={output.assigneeIds}
                  legacyId={output.assigneeId}
                  disabled={disabled}
                  label="¿Quién podrá generarla o consultarla?"
                  onChange={(assigneeIds) => updateOutput(output.id, { assigneeIds, assigneeId: null })}
                />
              </>
            ) : null}
          </article>
        ))}
      </div>
      <input
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        disabled={disabled}
        placeholder="Otras salidas (especificar)"
        value={data.other ?? ""}
        onChange={(e) => commit({ ...data, other: e.target.value })}
      />
      {hasProductivity ? (
        <textarea
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          rows={3}
          disabled={disabled}
          placeholder="¿Cómo deben calcularse los indicadores de productividad o rentabilidad?"
          value={data.productivityCalc ?? ""}
          onChange={(e) => commit({ ...data, productivityCalc: e.target.value })}
        />
      ) : null}
      <div className="space-y-2">
        <p className="text-sm font-medium">Restricciones de consulta por rol</p>
        {(data.accessRestrictions ?? []).map((entry, index) => (
          <div key={`${entry.assigneeId}-${index}`} className="grid gap-2 md:grid-cols-2">
            <select
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
              disabled={disabled}
              value={entry.assigneeId}
              onChange={(e) => {
                const accessRestrictions = [...(data.accessRestrictions ?? [])];
                accessRestrictions[index] = { ...entry, assigneeId: e.target.value };
                commit({ ...data, accessRestrictions });
              }}
            >
              <option value="">Rol…</option>
              {systemRoleOptions(catalog).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
              disabled={disabled}
              placeholder="Restricción"
              value={entry.restriction}
              onChange={(e) => {
                const accessRestrictions = [...(data.accessRestrictions ?? [])];
                accessRestrictions[index] = { ...entry, restriction: e.target.value };
                commit({ ...data, accessRestrictions });
              }}
            />
          </div>
        ))}
        {!disabled ? (
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() =>
              commit({
                ...data,
                accessRestrictions: [...(data.accessRestrictions ?? []), { assigneeId: "", restriction: "" }],
              })
            }
          >
            Agregar restricción
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SurveyExtraFieldsBuilder({
  label,
  fieldTypes,
  locations,
  data,
  disabled,
  onChange,
}: {
  label: string;
  fieldTypes: string[];
  locations: string[];
  data: ExtraFieldsData;
  disabled?: boolean;
  onChange: (next: ExtraFieldsData) => void;
}) {
  function updateField(id: string, patch: Partial<(typeof data.fields)[number]>) {
    onChange({ fields: data.fields.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      {data.fields.map((field) => (
        <div key={field.id} className="grid gap-2 md:grid-cols-4">
          <input
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
            disabled={disabled}
            placeholder="Nombre del campo"
            value={field.name}
            onChange={(e) => updateField(field.id, { name: e.target.value })}
          />
          <select
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
            disabled={disabled}
            value={field.fieldType}
            onChange={(e) => updateField(field.id, { fieldType: e.target.value })}
          >
            <option value="">Tipo…</option>
            {fieldTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
            disabled={disabled}
            value={field.required ? "yes" : "no"}
            onChange={(e) => updateField(field.id, { required: e.target.value === "yes" })}
          >
            <option value="no">Opcional</option>
            <option value="yes">Obligatorio</option>
          </select>
          <select
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
            disabled={disabled}
            value={field.location}
            onChange={(e) => updateField(field.id, { location: e.target.value })}
          >
            <option value="">Ubicación…</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      ))}
      {!disabled ? (
        <button
          type="button"
          className="btn btn-ghost text-xs"
          onClick={() =>
            onChange({
              fields: [
                ...data.fields,
                { id: newOsActionId("fld"), name: "", fieldType: "", required: false, location: "" },
              ],
            })
          }
        >
          Agregar campo
        </button>
      ) : null}
    </div>
  );
}

export function coalesceClientCatalogs(answer: FieldAnswer | undefined): ClientCatalogsData {
  return answer?.clientCatalogs ?? { selected: [], details: [] };
}

export function coalesceReportOutputs(answer: FieldAnswer | undefined): ReportOutputsData {
  return answer?.reportOutputs ?? { outputs: [] };
}

export function coalesceSpecialRules(answer: FieldAnswer | undefined): SpecialRulesData {
  return answer?.specialRules ?? { hasRules: null, rules: [] };
}

export function coalesceExtraFields(answer: FieldAnswer | undefined): ExtraFieldsData {
  return answer?.extraFields ?? { fields: [] };
}
