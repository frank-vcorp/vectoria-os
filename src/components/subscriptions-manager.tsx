"use client";

import { useEffect, useState } from "react";
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

export function SubscriptionsManager() {
  const [items, setItems] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((d) => setItems(d.subscriptions ?? []))
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
                Sin suscripciones. Se crean al autorizar cotizaciones con partidas de suscripción.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
