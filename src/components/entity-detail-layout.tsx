import Link from "next/link";
import type { ReactNode } from "react";

export function EntityDetailLayout({
  backHref,
  backLabel,
  folio,
  title,
  statusBadge,
  actions,
  children,
}: {
  backHref: string;
  backLabel: string;
  folio: string;
  title?: string;
  statusBadge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <Link href={backHref} className="text-sm text-[var(--muted)] hover:underline">
            ← {backLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-2.5 mt-2">
            <h1 className="detail-folio">{folio}</h1>
            {statusBadge}
          </div>
          {title && <p className="page-description">{title}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-3">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-3 md:grid-cols-2 text-sm">{children}</dl>;
}

export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[var(--muted)] text-xs font-medium uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-[var(--text-secondary)]">{value ?? "—"}</dd>
    </div>
  );
}

export function RelatedTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: { id: string; cells: Record<string, ReactNode> }[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>;
  }
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className ?? ""}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key} className={col.className ?? ""}>
                  {row.cells[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
