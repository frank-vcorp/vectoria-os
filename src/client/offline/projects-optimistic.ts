/** Actualizaciones optimistas locales para cola offline de proyectos. */

import type { ProjectPhaseStatus } from "@/shared/commercial";

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

export function applyProjectPatchOptimistic<T extends Phase>(
  phases: T[],
  body: Record<string, unknown>,
): T[] {
  const action = body.action;

  if (action === "toggle_check" && typeof body.checkId === "string") {
    return phases.map((phase) => ({
      ...phase,
      checks: phase.checks.map((c) => {
        if (c.id !== body.checkId) return c;
        return {
          ...c,
          ...(typeof body.checked === "boolean" ? { checked: body.checked } : {}),
          ...(typeof body.notApplicable === "boolean"
            ? { notApplicable: body.notApplicable, checked: body.notApplicable ? false : c.checked }
            : {}),
        };
      }),
    }));
  }

  if (action === "update_evidence" && typeof body.phaseId === "string") {
    const notes = typeof body.evidenceNotes === "string" ? body.evidenceNotes : null;
    return phases.map((p) =>
      p.id === body.phaseId ? { ...p, evidenceNotes: notes } : p,
    );
  }

  if (action === "advance_phase" && typeof body.phaseId === "string") {
    return phases.map((p) =>
      p.id === body.phaseId ? { ...p, status: "en_validacion" as ProjectPhaseStatus } : p,
    );
  }

  if (action === "validate_phase" && typeof body.phaseId === "string") {
    return phases.map((p) =>
      p.id === body.phaseId
        ? {
            ...p,
            status: "validada" as ProjectPhaseStatus,
            validatedAt: new Date().toISOString(),
            validationNotes: typeof body.notes === "string" ? body.notes : p.validationNotes,
          }
        : p,
    );
  }

  if (action === "return_phase" && typeof body.phaseId === "string") {
    return phases.map((p) =>
      p.id === body.phaseId ? { ...p, status: "disponible" as ProjectPhaseStatus } : p,
    );
  }

  if (action === "unlock_next_phase" && typeof body.fromPhaseId === "string") {
    const from = phases.find((p) => p.id === body.fromPhaseId);
    if (!from) return phases;
    const nextNum = from.phaseNumber + 1;
    return phases.map((p) =>
      p.phaseNumber === nextNum && p.status === "bloqueada"
        ? { ...p, status: "disponible" as ProjectPhaseStatus }
        : p,
    );
  }

  return phases;
}
