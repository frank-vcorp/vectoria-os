"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  SUBSCRIPTION_BILLING_STATUS_LABELS,
  SUBSCRIPTION_SERVICE_STATUS_LABELS,
  formatMoney,
  type SubscriptionBillingStatus,
  type SubscriptionServiceStatus,
} from "@/shared/commercial";

type SubRow = {
  id: string;
  folio: string;
  clientName: string;
  serviceOrderFolio: string;
  description: string;
  price: number;
  periodicityName: string;
  serviceStatus: SubscriptionServiceStatus;
  billingStatus: SubscriptionBillingStatus;
};

const VIEW_OPTIONS = [
  { id: "attention", label: "Requieren atención" },
  { id: "activa", label: "Activas" },
  { id: "pausada", label: "Pausadas" },
  { id: "pendiente_activacion", label: "Pendientes" },
  { id: "cancelada", label: "Canceladas" },
  { id: "all", label: "Todas" },
] as const;

export function SubscriptionsManager() {
  const [items, setItems] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [view, setView] = useState<string>("attention");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ view });
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/subscriptions?${params}`);
    if (res.ok) setItems((await res.json()).subscriptions ?? []);
    setLoading(false);
  }, [q, view]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap gap-2 items-end">
        <label className="text-sm flex-1 min-w-[12rem]">
          <span className="text-[var(--muted)]">Buscar folio o cliente</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="SUS-… o nombre"
            className="mt-1 block w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="text-[var(--muted)]">Vista</span>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="mt-1 block bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          >
            {VIEW_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Cargando…</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-2 pr-4">Folio</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">OS</th>
                <th className="py-2 pr-4">Descripción</th>
                <th className="py-2 pr-4">Precio</th>
                <th className="py-2 pr-4">Servicio</th>
                <th className="py-2 pr-4">Cobranza</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-4">
                    <Link href={`/suscripciones/${s.id}`} className="text-[var(--accent)] hover:underline">
                      {s.folio}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{s.clientName}</td>
                  <td className="py-2 pr-4">{s.serviceOrderFolio}</td>
                  <td className="py-2 pr-4">{s.description}</td>
                  <td className="py-2 pr-4">{formatMoney(s.price)}</td>
                  <td className="py-2 pr-4">
                    <span className="badge">{SUBSCRIPTION_SERVICE_STATUS_LABELS[s.serviceStatus]}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="badge">{SUBSCRIPTION_BILLING_STATUS_LABELS[s.billingStatus]}</span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-[var(--muted)]">
                    Sin suscripciones en esta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
