"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickAddClient } from "@/components/quick-add-client";
import { ListSearchInput } from "@/components/list-search-input";
import { DateInput } from "@/components/date-input";
import { SearchableSelect } from "@/components/searchable-select";
import { MoneyInput } from "@/components/money-input";
import {
  SERVICE_ORDER_STATUS_LABELS,
  formatMoney,
  type ServiceOrderStatus,
} from "@/shared/commercial";

type ClientOption = { id: string; folio: string; name: string };
type ServiceOption = { id: string; name: string };
type CatalogOption = { id: string; name: string };

type OrderRow = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  quoteId: string | null;
  quoteFolio: string | null;
  serviceName: string;
  price: number;
  deliveryDate: string;
  status: ServiceOrderStatus;
};

export function ServiceOrdersManager() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [periodicities, setPeriodicities] = useState<CatalogOption[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [programmers, setProgrammers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    serviceId: "",
    description: "",
    contractType: "por_evento" as "por_evento" | "suscripcion",
    periodicityId: "",
    price: 0,
    paymentConditionId: "",
    deliveryDate: "",
    observations: "",
    programmerId: "",
  });

  async function loadAll(q = search) {
    const searchParams = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : "";
    const [catRes, clientsRes, ordersRes, progRes] = await Promise.all([
      fetch("/api/catalogs?type=all"),
      fetch("/api/clients"),
      fetch(`/api/service-orders${searchParams}`),
      fetch("/api/service-orders?programmers=1"),
    ]);
    if (catRes.ok) {
      const data = await catRes.json();
      setServices((data.services ?? []).filter((s: ServiceOption & { status: string }) => s.status === "activo"));
      setPeriodicities(data.periodicities ?? []);
      setPaymentConditions(
        (data.paymentConditions ?? []).filter((p: CatalogOption & { status: string }) => p.status === "activo"),
      );
    }
    if (clientsRes.ok) setClients((await clientsRes.json()).clients);
    if (ordersRes.ok) setOrders((await ordersRes.json()).orders);
    if (progRes.ok) setProgrammers((await progRes.json()).programmers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function handleQuickAddClient(client: { id: string }) {
    await loadAll();
    setForm((f) => ({ ...f, clientId: client.id }));
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/service-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, observations: form.observations || null }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    const data = await res.json();
    router.push(`/ordenes-servicio/${data.order.id}`);
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-6">
      <form className="card space-y-3" onSubmit={(e) => void createOrder(e)}>
        <h2 className="font-medium">Nueva OS directa</h2>
        <SearchableSelect
          className="w-full"
          value={form.clientId}
          onChange={(clientId) => setForm({ ...form, clientId })}
          required
          placeholder="Cliente…"
          options={clients.map((c) => ({
            value: c.id,
            label: `${c.folio} — ${c.name}`,
            keywords: `${c.folio} ${c.name}`,
          }))}
        />
        <QuickAddClient onCreated={handleQuickAddClient} />
        <SearchableSelect
          className="w-full"
          value={form.programmerId}
          onChange={(programmerId) => setForm({ ...form, programmerId })}
          required
          placeholder="Programador *"
          options={programmers.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SearchableSelect
          className="w-full"
          value={form.serviceId}
          onChange={(serviceId) => setForm({ ...form, serviceId })}
          required
          placeholder="Servicio…"
          options={services.map((s) => ({ value: s.id, label: s.name }))}
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción *"
          required
          rows={2}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        />
        <div className="grid gap-2 md:grid-cols-2">
          <select
            value={form.contractType}
            onChange={(e) =>
              setForm({ ...form, contractType: e.target.value as "por_evento" | "suscripcion" })
            }
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          >
            <option value="por_evento">Por evento</option>
            <option value="suscripcion">Suscripción</option>
          </select>
          {form.contractType === "suscripcion" && (
            <SearchableSelect
              value={form.periodicityId}
              onChange={(periodicityId) => setForm({ ...form, periodicityId })}
              required
              placeholder="Periodicidad…"
              options={periodicities.map((p) => ({ value: p.id, label: p.name }))}
            />
          )}
          <MoneyInput
            label="Precio (MXN)"
            valueCents={form.price}
            onChangeCents={(price) => setForm({ ...form, price })}
            required
          />
          <DateInput
            value={form.deliveryDate}
            onChange={(deliveryDate) => setForm({ ...form, deliveryDate })}
            required
          />
          <SearchableSelect
            className="md:col-span-2"
            value={form.paymentConditionId}
            onChange={(paymentConditionId) => setForm({ ...form, paymentConditionId })}
            placeholder="Condiciones de pago (opcional)"
            options={paymentConditions.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Crear OS
        </button>
      </form>

      <div className="card space-y-3 overflow-x-auto">
        <ListSearchInput
          value={search}
          onChange={setSearch}
          onSearch={() => {
            setLoading(true);
            void loadAll(search);
          }}
        />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-2">Folio</th>
              <th className="py-2 pr-2">Cliente</th>
              <th className="py-2 pr-2">Cotización</th>
              <th className="py-2 pr-2">Precio</th>
              <th className="py-2 pr-2">Entrega</th>
              <th className="py-2 pr-2">Estatus</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[var(--border)] align-top">
                <td className="py-2 pr-2 font-mono text-xs">
                  <Link href={`/ordenes-servicio/${o.id}`} className="underline">
                    {o.folio}
                  </Link>
                </td>
                <td className="py-2 pr-2">
                  <Link href={`/clientes/${o.clientId}`} className="underline">
                    {o.clientName}
                  </Link>
                </td>
                <td className="py-2 pr-2">
                  {o.quoteFolio && o.quoteId ? (
                    <Link href={`/cotizaciones/${o.quoteId}`} className="underline">
                      {o.quoteFolio}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-2">{formatMoney(o.price)}</td>
                <td className="py-2 pr-2">{new Date(o.deliveryDate).toLocaleDateString("es-MX")}</td>
                <td className="py-2 pr-2">
                  <span className="badge">{SERVICE_ORDER_STATUS_LABELS[o.status]}</span>
                </td>
                <td className="py-2">
                  <Link href={`/ordenes-servicio/${o.id}`} className="btn btn-ghost text-xs">
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
