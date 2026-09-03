"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  EntityDetailLayout,
} from "@/components/entity-detail-layout";
import {
  PROJECT_PHASE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type ProjectPhaseStatus,
  type ProjectStatus,
} from "@/shared/commercial";

type PhaseCheck = {
  id: string;
  sortOrder: number;
  text: string;
  checked: boolean;
  notApplicable: boolean;
};

type Phase = {
  id: string;
  phaseNumber: number;
  name: string;
  objective: string;
  expectedResult: string;
  status: ProjectPhaseStatus;
  startedAt: string | null;
  validatedAt: string | null;
  validationNotes: string | null;
  evidenceNotes: string | null;
  checks: PhaseCheck[];
};

type Project = {
  id: string;
  folio: string;
  clientName: string;
  serviceOrderId: string;
  serviceOrderFolio: string;
  serviceName: string;
  description: string;
  programmerName: string | null;
  deliveryDate: string;
  status: ProjectStatus;
  planSourceFileName: string | null;
  planImportedAt: string | null;
  planName: string | null;
  planVersion: string | null;
  planDiscovery: string | null;
  checklistRequired: boolean;
  createdAt: string;
};

function deliveryCountdown(deliveryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deliveryDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff >= 0) return { label: "Días restantes", value: String(diff), overdue: false };
  return { label: "Días de retraso", value: String(Math.abs(diff)), overdue: true };
}

function phaseStepClass(status: ProjectPhaseStatus, isSelected: boolean, isCurrent: boolean) {
  const base =
    "flex-1 min-w-[4.5rem] text-center py-2 px-1 rounded-lg text-xs border transition-colors";
  if (isSelected) return `${base} border-[var(--accent)] bg-[var(--surface-2)]`;
  if (status === "validada") return `${base} border-green-600/40 text-green-600 cursor-pointer`;
  if (status === "en_validacion") return `${base} border-amber-500/40 text-amber-600 cursor-pointer`;
  if (isCurrent || status === "disponible")
    return `${base} border-[var(--accent)]/40 text-[var(--accent)] cursor-pointer`;
  return `${base} border-[var(--border)] text-[var(--muted)] opacity-60 cursor-not-allowed`;
}

function pendingChecks(phase: Phase) {
  return phase.checks.filter((c) => !c.checked && !c.notApplicable);
}

export function ProjectDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [showChecks, setShowChecks] = useState(true);
  const [showExpectedResult, setShowExpectedResult] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planContent, setPlanContent] = useState("");
  const [planFileName, setPlanFileName] = useState("plan-validacion.md");
  const [evidenceDraft, setEvidenceDraft] = useState("");
  const [returnNotes, setReturnNotes] = useState("");

  const selectedPhase = useMemo(
    () => phases.find((p) => p.id === selectedPhaseId) ?? phases[0] ?? null,
    [phases, selectedPhaseId],
  );

  const currentPhase = useMemo(
    () =>
      phases.find((p) => p.status === "disponible" || p.status === "en_validacion") ??
      phases.find((p) => p.status !== "validada" && p.status !== "bloqueada") ??
      null,
    [phases],
  );

  const nextPhase = useMemo(() => {
    if (!selectedPhase) return null;
    return phases.find((p) => p.phaseNumber === selectedPhase.phaseNumber + 1) ?? null;
  }, [phases, selectedPhase]);

  const hasPriorPendingValidation = useMemo(() => {
    if (!selectedPhase) return false;
    return phases.some(
      (p) => p.phaseNumber < selectedPhase.phaseNumber && p.status !== "validada",
    );
  }, [phases, selectedPhase]);

  async function load() {
    const [projectRes, meRes] = await Promise.all([
      fetch(`/api/projects?id=${id}`),
      fetch("/api/auth/me"),
    ]);
    if (projectRes.status === 404) {
      router.replace("/proyectos");
      return;
    }
    if (!projectRes.ok) {
      setError((await projectRes.json()).error ?? "Error");
      setLoading(false);
      return;
    }
    if (meRes.ok) {
      const me = await meRes.json();
      setIsAdmin(me.user?.role === "administrador");
      setCanWrite(Boolean(me.permissions?.proyectos?.canWrite));
    }
    const data = await projectRes.json();
    setProject(data.project);
    const loadedPhases: Phase[] = data.phases ?? [];
    setPhases(loadedPhases);
    setSelectedPhaseId((prev) => {
      if (prev && loadedPhases.some((p) => p.id === prev)) return prev;
      const current =
        loadedPhases.find((p) => p.status === "disponible" || p.status === "en_validacion") ??
        loadedPhases[0];
      return current?.id ?? null;
    });
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    if (selectedPhase) setEvidenceDraft(selectedPhase.evidenceNotes ?? "");
  }, [selectedPhase?.id, selectedPhase?.evidenceNotes]);

  async function importPlan(replace = false) {
    setError("");
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "import_plan",
        id,
        content: planContent,
        fileName: planFileName,
        replace,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al importar");
      if (data.error === "PLAN_EXISTS") setShowReplaceConfirm(true);
      return;
    }
    setPlanContent("");
    setShowReplaceConfirm(false);
    setPhases(data.phases ?? []);
    await load();
  }

  function onPlanFile(file: File | null) {
    if (!file) return;
    setPlanFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPlanContent(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function phaseAction(
    action: "advance_phase" | "validate_phase" | "return_phase" | "unlock_next_phase",
    phaseId: string,
    extra?: { force?: boolean; notes?: string },
  ) {
    setError("");
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "unlock_next_phase"
          ? { action, projectId: id, fromPhaseId: phaseId }
          : {
              action,
              projectId: id,
              phaseId,
              force: extra?.force,
              notes: extra?.notes,
            },
      ),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error");
      return;
    }
    const data = await res.json();
    setPhases(data.phases ?? []);
    setShowUnlockConfirm(false);
    setShowSendConfirm(false);
    setReturnNotes("");
    await load();
  }

  async function toggleCheck(checkId: string, patch: { checked?: boolean; notApplicable?: boolean }) {
    if (!canWrite) return;
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_check", projectId: id, checkId, ...patch }),
    });
    if (res.ok) {
      const data = await res.json();
      setPhases(data.phases ?? []);
    }
  }

  function selectPhase(phase: Phase) {
    if (phase.status === "bloqueada") return;
    setSelectedPhaseId(phase.id);
    setShowExpectedResult(false);
    setEvidenceDraft(phase.evidenceNotes ?? "");
  }

  function handleSendToValidate() {
    if (!selectedPhase) return;
    if (pendingChecks(selectedPhase).length > 0) {
      setShowSendConfirm(true);
      return;
    }
    void phaseAction("advance_phase", selectedPhase.id);
  }

  async function saveEvidence() {
    if (!selectedPhase || !canWrite) return;
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_evidence",
        projectId: id,
        phaseId: selectedPhase.id,
        evidenceNotes: evidenceDraft.trim() || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPhases(data.phases ?? []);
    }
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!project) return <p className="text-sm text-[var(--danger)]">Proyecto no encontrado</p>;

  const countdown = deliveryCountdown(project.deliveryDate);

  return (
    <EntityDetailLayout
      backHref="/proyectos"
      backLabel="Proyectos"
      folio={project.folio}
      title={project.serviceName}
      statusBadge={<span className="badge">{PROJECT_STATUS_LABELS[project.status]}</span>}
    >
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="card flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-[var(--muted)]">Cliente</p>
          <p className="font-medium">{project.clientName}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">OS</p>
          <Link href={`/ordenes-servicio/${project.serviceOrderId}`} className="font-medium text-[var(--accent)]">
            {project.serviceOrderFolio}
          </Link>
        </div>
        <div>
          <p className="text-[var(--muted)]">Programador</p>
          <p className="font-medium">{project.programmerName ?? "—"}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Fecha de entrega</p>
          <p className="font-medium">{new Date(project.deliveryDate).toLocaleDateString("es-MX")}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">{countdown.label}</p>
          <p className={`font-medium text-lg ${countdown.overdue ? "text-[var(--danger)]" : ""}`}>
            {countdown.value}
          </p>
        </div>
      </div>

      {!project.planImportedAt && (
        <div className="card space-y-3 border border-amber-500/30">
          <h2 className="font-medium">Plan de Validación pendiente de importar</h2>
          <p className="text-sm text-[var(--muted)]">
            Importe un archivo `.md` con el formato VECTORIA_PLAN_VALIDACION (5 a 7 fases).
          </p>
          {canWrite && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void importPlan(false);
              }}
            >
              <input
                type="file"
                accept=".md,text/markdown"
                onChange={(e) => onPlanFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <textarea
                value={planContent}
                onChange={(e) => setPlanContent(e.target.value)}
                rows={8}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 font-mono text-xs"
                placeholder="# VECTORIA_PLAN_VALIDACION"
                required
              />
              <button type="submit" className="btn-primary">
                Importar Plan de Validación
              </button>
            </form>
          )}
        </div>
      )}

      {project.planImportedAt && (
        <DetailSection title="Plan de Validación">
          <DetailGrid>
            <DetailField label="Nombre" value={project.planName ?? project.planSourceFileName ?? "—"} />
            <DetailField label="Versión" value={project.planVersion ?? "—"} />
            <DetailField label="Discovery" value={project.planDiscovery ?? "—"} />
            <DetailField
              label="Checklist obligatorio"
              value={project.checklistRequired ? "Sí" : "No"}
            />
          </DetailGrid>
          {canWrite && (
            <form
              className="mt-4 space-y-3 border-t border-[var(--border)] pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (phases.length > 0) setShowReplaceConfirm(true);
                else void importPlan(true);
              }}
            >
              <h3 className="font-medium text-sm">Reemplazar Plan de Validación</h3>
              <p className="text-sm text-amber-600">
                Puede importar un nuevo archivo en cualquier momento. Se reiniciará todo el avance: fases,
                comprobaciones marcadas y validaciones.
              </p>
              <input
                type="file"
                accept=".md,text/markdown"
                onChange={(e) => onPlanFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <textarea
                value={planContent}
                onChange={(e) => setPlanContent(e.target.value)}
                rows={6}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 font-mono text-xs"
                placeholder="# VECTORIA_PLAN_VALIDACION"
                required
              />
              <button type="submit" className="btn-secondary text-sm">
                Reemplazar plan
              </button>
            </form>
          )}
        </DetailSection>
      )}

      {phases.length > 0 && (
        <DetailSection title="Fases de validación">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {phases.map((phase) => (
              <button
                key={phase.id}
                type="button"
                disabled={phase.status === "bloqueada"}
                className={phaseStepClass(
                  phase.status,
                  phase.id === selectedPhase?.id,
                  currentPhase?.id === phase.id,
                )}
                onClick={() => selectPhase(phase)}
              >
                <div className="font-medium">F{phase.phaseNumber}</div>
                <div className="truncate max-w-[5rem]">{phase.name}</div>
                <div className="text-[10px] mt-0.5">{PROJECT_PHASE_STATUS_LABELS[phase.status]}</div>
              </button>
            ))}
          </div>

          {hasPriorPendingValidation && (
            <p className="text-sm text-amber-600 mb-3">
              Hay fases anteriores con correcciones o validación pendiente.
            </p>
          )}

          {selectedPhase && (
            <div className="card space-y-4">
              <div className="flex justify-between gap-2 flex-wrap items-start">
                <div>
                  <p className="text-xs text-[var(--muted)]">
                    Fase {selectedPhase.phaseNumber} de {phases.length}
                  </p>
                  <h3 className="font-medium text-lg">{selectedPhase.name}</h3>
                </div>
                <span className="badge">{PROJECT_PHASE_STATUS_LABELS[selectedPhase.status]}</span>
              </div>

              <div>
                <p className="text-xs text-[var(--muted)] mb-1">Objetivo</p>
                <p className="text-sm whitespace-pre-wrap">{selectedPhase.objective}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
                {selectedPhase.startedAt && (
                  <span>Inicio: {new Date(selectedPhase.startedAt).toLocaleDateString("es-MX")}</span>
                )}
                {selectedPhase.validatedAt && (
                  <span>Término: {new Date(selectedPhase.validatedAt).toLocaleDateString("es-MX")}</span>
                )}
              </div>

              {selectedPhase.validationNotes && (
                <div className="text-sm border border-amber-500/30 rounded-lg p-3 bg-amber-500/5">
                  <p className="font-medium text-amber-700">Observaciones de validación</p>
                  <p className="mt-1 whitespace-pre-wrap">{selectedPhase.validationNotes}</p>
                </div>
              )}

              <details open={showChecks} onToggle={(e) => setShowChecks((e.target as HTMLDetailsElement).open)}>
                <summary className="cursor-pointer text-sm font-medium">
                  Comprobaciones ({selectedPhase.checks.filter((c) => c.checked || c.notApplicable).length}/
                  {selectedPhase.checks.length})
                </summary>
                <ul className="mt-3 space-y-2">
                  {selectedPhase.checks.map((check) => (
                    <li key={check.id} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={check.checked}
                        disabled={!canWrite || selectedPhase.status === "en_validacion" || selectedPhase.status === "validada"}
                        onChange={(e) => void toggleCheck(check.id, { checked: e.target.checked })}
                        className="mt-1"
                      />
                      <span className={check.notApplicable ? "line-through text-[var(--muted)]" : ""}>
                        {check.text}
                      </span>
                      {canWrite &&
                        selectedPhase.status !== "en_validacion" &&
                        selectedPhase.status !== "validada" &&
                        selectedPhase.status !== "bloqueada" && (
                          <button
                            type="button"
                            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] ml-auto shrink-0"
                            onClick={() =>
                              void toggleCheck(check.id, { notApplicable: !check.notApplicable })
                            }
                          >
                            {check.notApplicable ? "Quitar N/A" : "No aplica"}
                          </button>
                        )}
                    </li>
                  ))}
                </ul>
              </details>

              <details
                open={showExpectedResult}
                onToggle={(e) => setShowExpectedResult((e.target as HTMLDetailsElement).open)}
              >
                <summary className="cursor-pointer text-sm font-medium">Resultado esperado</summary>
                <p className="mt-2 text-sm whitespace-pre-wrap">{selectedPhase.expectedResult}</p>
              </details>

              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Evidencias (opcional)</summary>
                <div className="mt-2 space-y-2">
                  <textarea
                    value={evidenceDraft}
                    onChange={(e) => setEvidenceDraft(e.target.value)}
                    disabled={
                      !canWrite ||
                      selectedPhase.status === "en_validacion" ||
                      selectedPhase.status === "validada"
                    }
                    rows={4}
                    placeholder="Notas, enlaces o referencias de la validación realizada…"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                  />
                  {canWrite &&
                    selectedPhase.status !== "en_validacion" &&
                    selectedPhase.status !== "validada" && (
                      <button type="button" className="btn-secondary text-xs" onClick={() => void saveEvidence()}>
                        Guardar evidencias
                      </button>
                    )}
                </div>
              </details>

              {canWrite && (
                <div className="flex gap-2 flex-wrap pt-2 border-t border-[var(--border)]">
                  {selectedPhase.status === "disponible" && (
                    <button type="button" className="btn-primary text-xs" onClick={handleSendToValidate}>
                      Enviar a validar
                    </button>
                  )}
                  {isAdmin && selectedPhase.status === "en_validacion" && (
                    <>
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        onClick={() => void phaseAction("validate_phase", selectedPhase.id)}
                      >
                        Validar
                      </button>
                      <div className="flex gap-2 items-center flex-wrap w-full">
                        <input
                          value={returnNotes}
                          onChange={(e) => setReturnNotes(e.target.value)}
                          placeholder="Observaciones al devolver"
                          className="flex-1 min-w-[12rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() =>
                            void phaseAction("return_phase", selectedPhase.id, { notes: returnNotes })
                          }
                        >
                          Devolver con observaciones
                        </button>
                      </div>
                    </>
                  )}
                  {nextPhase?.status === "bloqueada" && selectedPhase.status !== "bloqueada" && (
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => setShowUnlockConfirm(true)}
                    >
                      Desbloquear siguiente fase
                    </button>
                  )}
                </div>
              )}

              {showSendConfirm && selectedPhase && (
                <div className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-3 space-y-2 text-sm">
                  <p>
                    Hay comprobaciones pendientes en esta fase. Se recomienda revisarlas antes de enviarla a
                    validación.
                  </p>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary text-xs" onClick={() => setShowSendConfirm(false)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      onClick={() =>
                        void phaseAction("advance_phase", selectedPhase.id, { force: true })
                      }
                    >
                      Enviar de todos modos
                    </button>
                  </div>
                </div>
              )}

              {showUnlockConfirm && (
                <div className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-3 space-y-2 text-sm">
                  <p>
                    La fase anterior aún no ha sido validada. Se recomienda esperar su validación porque una
                    corrección podría afectar el trabajo posterior.
                  </p>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary text-xs" onClick={() => setShowUnlockConfirm(false)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      onClick={() => void phaseAction("unlock_next_phase", selectedPhase!.id)}
                    >
                      Continuar de todos modos
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DetailSection>
      )}

      {showReplaceConfirm && canWrite && (
        <div className="card border border-amber-500/40 space-y-2 text-sm">
          <p>
            Reemplazar el Plan de Validación reiniciará todo el avance del proyecto: fases, comprobaciones
            marcadas y validaciones se perderán. Solo quedará la Fase 1 disponible del nuevo plan.
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary text-xs" onClick={() => setShowReplaceConfirm(false)}>
              Cancelar
            </button>
            <button type="button" className="btn-primary text-xs" onClick={() => void importPlan(true)}>
              Reemplazar y reiniciar
            </button>
          </div>
        </div>
      )}
    </EntityDetailLayout>
  );
}
