"use client";

import { useEffect, useState } from "react";

type Plan = { id: string; name: string; version: string | null; sourceFileName: string | null; status: string };
type Phase = { phaseNumber: number; name: string; objective: string; includes: string };

export function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<{ plan: Plan; phases: Phase[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadPlans() {
    const res = await fetch("/api/planes-desarrollo");
    if (res.ok) {
      const data = await res.json();
      setPlans(data.plans);
    }
  }

  useEffect(() => { void loadPlans(); }, []);

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/planes-desarrollo", { method: "POST", body: form });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al importar");
      return;
    }

    await loadPlans();
    e.target.value = "";
  }

  async function viewPlan(id: string) {
    const res = await fetch(`/api/planes-desarrollo?id=${id}`);
    if (res.ok) setSelected(await res.json());
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <h2 className="font-medium">Importar Plan de Desarrollo</h2>
        <p className="text-sm text-[var(--muted)]">
          Sube un archivo markdown con fases en formato: <code># Fase N — Nombre</code>, secciones{" "}
          <code>## Objetivo</code>, <code>## Incluye</code> y opcionalmente{" "}
          <code>## Validación de salida</code>. Máximo 7 fases.
        </p>
        <input type="file" accept=".md,.txt" onChange={importFile} disabled={loading} />
        {loading && <p className="text-sm text-[var(--muted)]">Importando…</p>}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </div>

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Versión</th>
              <th>Archivo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.version ?? "—"}</td>
                <td>{p.sourceFileName ?? "—"}</td>
                <td>
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => viewPlan(p.id)}>
                    Ver fases
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="font-medium">{selected.plan.name}</h2>
              <p className="text-sm text-[var(--muted)]">{selected.phases.length} fases importadas</p>
            </div>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setSelected(null)}>Cerrar</button>
          </div>
          <div className="space-y-3">
            {selected.phases.map((phase) => (
              <details key={phase.phaseNumber} className="border border-[var(--border)] rounded-lg p-3">
                <summary className="cursor-pointer font-medium">
                  Fase {phase.phaseNumber} — {phase.name}
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <p className="text-[var(--muted)]">Objetivo</p>
                    <p className="whitespace-pre-wrap">{phase.objective}</p>
                  </div>
                  <div>
                    <p className="text-[var(--muted)]">Incluye</p>
                    <p className="whitespace-pre-wrap">{phase.includes}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
