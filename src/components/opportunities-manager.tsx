"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QuickAddClient } from "@/components/quick-add-client";
import { ListSearchInput } from "@/components/list-search-input";
import { OPPORTUNITY_STATUS_LABELS, type OpportunityStatus } from "@/shared/commercial";

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = { id: string; name: string };

type OpportunityRow = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  sellerName: string;
  serviceId: string;
  serviceName: string;
  description: string;
  status: OpportunityStatus;
  createdAt: string;
};

const STATUS_LABELS = OPPORTUNITY_STATUS_LABELS;

export function OpportunitiesManager() {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ clientId: "", serviceId: "", description: "" });

  async function loadCatalogs() {
    const res = await fetch("/api/catalogs?type=all");
    if (!res.ok) return;
    const data = await res.json();
    setServices((data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"));
  }

  async function loadClients() {
    const res = await fetch("/api/clients");
    if (res.ok) setClients((await res.json()).clients);
  }

  async function loadOpportunities(q = search) {
    const params = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : "";
    const res = await fetch(`/api/opportunities${params}`);
    if (res.ok) setOpportunities((await res.json()).opportunities);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.all([loadCatalogs(), loadClients(), loadOpportunities()]);
  }, []);

  async function handleQuickAddClient(client: { id: string }) {
    await loadClients();
    setForm((f) => ({ ...f, clientId: client.id }));
  }

  async function createOpportunity(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error al crear");
      return;
    }
    const data = await res.json();
    setForm({ clientId: "", serviceId: "", description: "" });
    window.location.href = `/oportunidades/${data.opportunity.id}`;
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-6">
      <form className="card space-y-3" onSubmit={(e) => void createOpportunity(e)}>
        <h2 className="font-medium">Nueva oportunidad</h2>
        <div className="space-y-2">
          <label className="text-sm block">
            <span className="text-[var(--muted)]">Cliente</span>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              required
              className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.folio} — {c.name}
                </option>
              ))}
            </select>
          </label>
          <QuickAddClient onCreated={handleQuickAddClient} />
          <select
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
            required
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          >
            <option value="">Servicio…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Descripción *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={3}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
        </div>
        <p className="text-xs text-[var(--muted)]">
          El vendedor se asigna automáticamente al usuario que crea la oportunidad.
        </p>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Crear oportunidad
        </button>
      </form>

      <div className="card space-y-3 overflow-x-auto">
        <ListSearchInput
          value={search}
          onChange={setSearch}
          onSearch={() => {
            setLoading(true);
            void loadOpportunities(search);
          }}
        />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-2">Folio</th>
              <th className="py-2 pr-2">Cliente</th>
              <th className="py-2 pr-2">Servicio</th>
              <th className="py-2 pr-2">Vendedor</th>
              <th className="py-2 pr-2">Estatus</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id} className="border-b border-[var(--border)] last:border-0 align-top">
                <td className="py-2 pr-2 font-mono text-xs">
                  <Link href={`/oportunidades/${o.id}`} className="underline">
                    {o.folio}
                  </Link>
                </td>
                <td className="py-2 pr-2">
                  <Link href={`/clientes/${o.clientId}`} className="underline">
                    {o.clientName}
                  </Link>
                </td>
                <td className="py-2 pr-2 max-w-xs truncate" title={o.description}>
                  {o.serviceName}
                </td>
                <td className="py-2 pr-2">{o.sellerName}</td>
                <td className="py-2 pr-2">
                  <span className="badge">{STATUS_LABELS[o.status]}</span>
                </td>
                <td className="py-2">
                  <Link href={`/oportunidades/${o.id}`} className="btn btn-ghost text-xs">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
