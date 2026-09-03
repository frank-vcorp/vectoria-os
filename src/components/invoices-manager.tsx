"use client";

import { useEffect, useState } from "react";
import { INVOICE_STATUS_LABELS, formatMoney, type InvoiceStatus } from "@/shared/commercial";

type InvoiceRow = {
  id: string;
  folio: string;
  clientName: string;
  status: InvoiceStatus;
  sendStatus: string;
  total: number;
  createdAt: string;
};

export function InvoicesManager() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/invoices");
    if (res.ok) setInvoices((await res.json()).invoices ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function stamp(id: string) {
    setError("");
    const res = await fetch("/api/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stamp", id }),
    });
    if (!res.ok) setError((await res.json()).error ?? "Error");
    await load();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="py-2 pr-4">Folio</th>
              <th className="py-2 pr-4">Cliente</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Envío</th>
              <th className="py-2 pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-[var(--border)]">
                <td className="py-2 pr-4">{inv.folio}</td>
                <td className="py-2 pr-4">{inv.clientName}</td>
                <td className="py-2 pr-4">{formatMoney(inv.total)}</td>
                <td className="py-2 pr-4">
                  <span className="badge">{INVOICE_STATUS_LABELS[inv.status]}</span>
                </td>
                <td className="py-2 pr-4">{inv.sendStatus}</td>
                <td className="py-2 pr-4">
                  {inv.status === "borrador" && (
                    <button type="button" className="btn-secondary text-xs" onClick={() => void stamp(inv.id)}>
                      Timbrar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-[var(--muted)]">
                  Sin facturas. Cree borradores desde OS o Suscripciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
