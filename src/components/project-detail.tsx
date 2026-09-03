"use client";

import { useEffect, useState } from "react";
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

type Phase = {
  id: string;
  phaseNumber: number;
  name: string;
  objective: string;
  includes: string;
  validationCriteria: string | null;
  status: ProjectPhaseStatus;
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
};

export function ProjectDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planContent, setPlanContent] = useState("");

  async function load() {
    const res = await fetch(`/api/projects?id=${id}`);
    if (res.status === 404) {
      router.replace("/proyectos");
      return;
    }
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProject(data.project);
    setPhases(data.phases ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function importPlan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import_plan", id, content: planContent, fileName: "plan.md" }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error al importar");
      return;
    }
    const data = await res.json();
    setPhases(data.phases ?? []);
    await load();
  }

  async function phaseAction(action: "advance_phase" | "validate_phase" | "return_phase", phaseId: string) {
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, projectId: id, phaseId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPhases(data.phases ?? []);
    }
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!project) return <p className="text-sm text-[var(--danger)]">Proyecto no encontrado</p>;

  return (
    <EntityDetailLayout
      backHref="/proyectos"
      backLabel="Proyectos"
      folio={project.folio}
      title={project.serviceName}
      statusBadge={<span className="badge">{PROJECT_STATUS_LABELS[project.status]}</span>}
    >
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <DetailSection title="Datos">
        <DetailGrid>
          <DetailField label="Cliente" value={project.clientName} />
          <DetailField
            label="OS"
            value={
              <Link href={`/ordenes-servicio/${project.serviceOrderId}`} className="text-[var(--accent)]">
                {project.serviceOrderFolio}
              </Link>
            }
          />
          <DetailField label="Programador" value={project.programmerName ?? "—"} />
          <DetailField label="Entrega" value={new Date(project.deliveryDate).toLocaleDateString("es-MX")} />
          <DetailField label="Plan importado" value={project.planImportedAt ? "Sí" : "No"} />
        </DetailGrid>
        <p className="text-sm mt-3">{project.description}</p>
      </DetailSection>

      {!project.planImportedAt && (
        <form className="card space-y-3" onSubmit={(e) => void importPlan(e)}>
          <h2 className="font-medium">Importar plan de desarrollo (.md)</h2>
          <textarea
            value={planContent}
            onChange={(e) => setPlanContent(e.target.value)}
            rows={8}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 font-mono text-xs"
            placeholder="# Plan de Desarrollo…"
            required
          />
          <button type="submit" className="btn-primary">
            Importar fases
          </button>
        </form>
      )}

      <DetailSection title="Fases">
        <div className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.id} className="card space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">
                  Fase {phase.phaseNumber} — {phase.name}
                </h3>
                <span className="badge">{PROJECT_PHASE_STATUS_LABELS[phase.status]}</span>
              </div>
              <p className="text-sm text-[var(--muted)]">{phase.objective}</p>
              <div className="flex gap-2 flex-wrap">
                {phase.status === "disponible" && (
                  <button type="button" className="btn-secondary text-xs" onClick={() => void phaseAction("advance_phase", phase.id)}>
                    Enviar a validación
                  </button>
                )}
                {phase.status === "en_validacion" && (
                  <>
                    <button type="button" className="btn-primary text-xs" onClick={() => void phaseAction("validate_phase", phase.id)}>
                      Validar
                    </button>
                    <button type="button" className="btn-secondary text-xs" onClick={() => void phaseAction("return_phase", phase.id)}>
                      Regresar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {phases.length === 0 && <p className="text-sm text-[var(--muted)]">Importe un plan para ver las fases.</p>}
        </div>
      </DetailSection>
    </EntityDetailLayout>
  );
}
