"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/shared/commercial";

type ProjectRow = {
  id: string;
  folio: string;
  clientName: string;
  serviceOrderFolio: string;
  serviceName: string;
  programmerName: string | null;
  deliveryDate: string;
  status: ProjectStatus;
  planImportedAt: string | null;
};

export function ProjectsManager() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
            <th className="py-2 pr-4">Folio</th>
            <th className="py-2 pr-4">Cliente</th>
            <th className="py-2 pr-4">OS</th>
            <th className="py-2 pr-4">Servicio</th>
            <th className="py-2 pr-4">Programador</th>
            <th className="py-2 pr-4">Entrega</th>
            <th className="py-2 pr-4">Estado</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-b border-[var(--border)]">
              <td className="py-2 pr-4">
                <Link href={`/proyectos/${p.id}`} className="text-[var(--accent)] hover:underline">
                  {p.folio}
                </Link>
              </td>
              <td className="py-2 pr-4">{p.clientName}</td>
              <td className="py-2 pr-4">{p.serviceOrderFolio}</td>
              <td className="py-2 pr-4">{p.serviceName}</td>
              <td className="py-2 pr-4">{p.programmerName ?? "—"}</td>
              <td className="py-2 pr-4">{new Date(p.deliveryDate).toLocaleDateString("es-MX")}</td>
              <td className="py-2 pr-4">
                <span className="badge">{PROJECT_STATUS_LABELS[p.status]}</span>
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-[var(--muted)]">
                Sin proyectos. Se crean automáticamente al autorizar una cotización cuyo servicio genera proyecto.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
