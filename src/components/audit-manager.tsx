"use client";

import { useEffect, useState } from "react";

type AuditRow = {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId: string | null;
  userName: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  create: "Creación",
  update: "Modificación",
  cancel: "Cancelación",
  validate: "Validación",
};

export function AuditManager() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="card overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Entidad</th>
            <th>Acción</th>
            <th>Usuario</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-[var(--muted)]">Sin registros aún.</td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap text-sm">
                  {new Date(log.createdAt).toLocaleString("es-MX")}
                </td>
                <td>{log.entity}</td>
                <td><span className="badge badge-muted">{ACTION_LABELS[log.action] ?? log.action}</span></td>
                <td>{log.userName ?? "—"}</td>
                <td className="text-xs text-[var(--muted)] font-mono">{log.entityId.slice(0, 8)}…</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
