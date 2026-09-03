"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/shared/commercial";

type QuoteRow = {
  id: string;
  folio: string;
  clientName: string;
  opportunityId: string | null;
  opportunityFolio: string | null;
  sellerName: string;
  serviceName: string;
  description: string;
  contractType: string;
  price: number;
  deliveryTime: string;
  status: QuoteStatus;
  createdAt: string;
};

const STATUS_LABELS = QUOTE_STATUS_LABELS;

export function QuotesManager() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/quotes")
      .then((r) => r.json())
      .then((d) => {
        setQuotes(d.quotes ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Fase 2: listado y conversión desde Oportunidades. Autorización, PDF y flujo completo en Fase 3.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-2">Folio</th>
              <th className="py-2 pr-2">Cliente</th>
              <th className="py-2 pr-2">Oportunidad</th>
              <th className="py-2 pr-2">Servicio</th>
              <th className="py-2 pr-2">Precio</th>
              <th className="py-2 pr-2">Entrega</th>
              <th className="py-2 pr-2">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-2 font-mono text-xs">{q.folio}</td>
                <td className="py-2 pr-2">{q.clientName}</td>
                <td className="py-2 pr-2">
                  {q.opportunityId ? (
                    <Link href="/oportunidades" className="underline">
                      {q.opportunityFolio}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-2">{q.serviceName}</td>
                <td className="py-2 pr-2">${(q.price / 100).toFixed(2)}</td>
                <td className="py-2 pr-2">{q.deliveryTime}</td>
                <td className="py-2 pr-2">
                  <span className="badge">{STATUS_LABELS[q.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {quotes.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-4 text-center">
            Sin cotizaciones. Créalas desde{" "}
            <Link href="/oportunidades" className="underline">
              Oportunidades
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
