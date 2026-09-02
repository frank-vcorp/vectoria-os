"use client";

import { useEffect, useState } from "react";

type CatalogData = {
  periodicities?: { id: string; name: string; intervalMonths: number; status: string }[];
  services?: {
    id: string;
    name: string;
    contractType: string;
    periodicityId: string | null;
    basePrice: number;
    status: string;
  }[];
  paymentConditions?: { id: string; name: string; status: string }[];
  incomeCategories?: { id: string; name: string }[];
  expenseCategories?: { id: string; name: string }[];
  providers?: { id: string; name: string }[];
};

function StatusBadge({ status }: { status: string }) {
  const active = status === "activo";
  return (
    <span className={`badge ${active ? "badge-success" : "badge-muted"}`}>{status}</span>
  );
}

export function CatalogsManager() {
  const [data, setData] = useState<CatalogData>({});
  const [periodicity, setPeriodicity] = useState({ name: "", intervalMonths: 1 });
  const [service, setService] = useState({
    name: "",
    contractType: "por_evento",
    periodicityId: "",
    basePrice: 0,
  });
  const [payment, setPayment] = useState({ name: "", description: "" });
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [provider, setProvider] = useState("");

  async function load() {
    const res = await fetch("/api/catalogs");
    if (res.ok) setData(await res.json());
  }

  useEffect(() => { void load(); }, []);

  async function post(body: Record<string, unknown>) {
    await fetch("/api/catalogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  async function patch(body: Record<string, unknown>) {
    await fetch("/api/catalogs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  function periodicityName(id: string | null) {
    if (!id) return null;
    return data.periodicities?.find((p) => p.id === id)?.name ?? null;
  }

  return (
    <div className="space-y-8">
      <section className="card space-y-3">
        <h2 className="font-medium">Periodicidades</h2>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void post({ type: "periodicity", ...periodicity }).then(() => setPeriodicity({ name: "", intervalMonths: 1 })); }}>
          <input placeholder="Nombre" value={periodicity.name} onChange={(e) => setPeriodicity({ ...periodicity, name: e.target.value })} required className="field input-like bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <input type="number" min={1} value={periodicity.intervalMonths} onChange={(e) => setPeriodicity({ ...periodicity, intervalMonths: Number(e.target.value) })} required className="w-24 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <button className="btn btn-primary" type="submit">Agregar</button>
        </form>
        <ul className="text-sm space-y-2">
          {data.periodicities?.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>{p.name} — {p.intervalMonths} mes(es)</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => void patch({
                    type: "periodicity",
                    id: p.id,
                    status: p.status === "activo" ? "cancelado" : "activo",
                  })}
                >
                  {p.status === "activo" ? "Cancelar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Servicios</h2>
        <form className="grid gap-2 md:grid-cols-5" onSubmit={(e) => {
          e.preventDefault();
          void post({
            type: "service",
            name: service.name,
            contractType: service.contractType,
            basePrice: service.basePrice,
            periodicityId: service.contractType === "suscripcion" && service.periodicityId
              ? service.periodicityId
              : null,
          }).then(() => setService({ name: "", contractType: "por_evento", periodicityId: "", basePrice: 0 }));
        }}>
          <input placeholder="Nombre" value={service.name} onChange={(e) => setService({ ...service, name: e.target.value })} required className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <select value={service.contractType} onChange={(e) => setService({ ...service, contractType: e.target.value, periodicityId: "" })} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2">
            <option value="por_evento">Por evento</option>
            <option value="suscripcion">Suscripción</option>
          </select>
          {service.contractType === "suscripcion" && (
            <select
              value={service.periodicityId}
              onChange={(e) => setService({ ...service, periodicityId: e.target.value })}
              required
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <option value="">Periodicidad…</option>
              {data.periodicities?.filter((p) => p.status === "activo").map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <input type="number" min={0} placeholder="Precio base (centavos)" value={service.basePrice} onChange={(e) => setService({ ...service, basePrice: Number(e.target.value) })} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <button className="btn btn-primary" type="submit">Agregar</button>
        </form>
        <ul className="text-sm space-y-2">
          {data.services?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>
                {s.name} — {s.contractType}
                {s.periodicityId && ` — ${periodicityName(s.periodicityId)}`}
                {" — $"}
                {(s.basePrice / 100).toFixed(2)}
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => void patch({
                    type: "service",
                    id: s.id,
                    status: s.status === "activo" ? "inactivo" : "activo",
                  })}
                >
                  {s.status === "activo" ? "Desactivar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Condiciones de pago</h2>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void post({ type: "payment_condition", ...payment }).then(() => setPayment({ name: "", description: "" })); }}>
          <input placeholder="Nombre" value={payment.name} onChange={(e) => setPayment({ ...payment, name: e.target.value })} required className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <input placeholder="Descripción (opcional)" value={payment.description} onChange={(e) => setPayment({ ...payment, description: e.target.value })} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <button className="btn btn-primary" type="submit">Agregar</button>
        </form>
        <ul className="text-sm space-y-2">
          {data.paymentConditions?.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>{p.name}</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => void patch({
                    type: "payment_condition",
                    id: p.id,
                    status: p.status === "activo" ? "cancelado" : "activo",
                  })}
                >
                  {p.status === "activo" ? "Cancelar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Ingresos", value: income, set: setIncome, type: "income" as const },
          { title: "Egresos", value: expense, set: setExpense, type: "expense" as const },
          { title: "Proveedores", value: provider, set: setProvider, type: "provider" as const },
        ].map(({ title, value, set, type }) => (
          <section key={type} className="card space-y-3">
            <h2 className="font-medium">{title}</h2>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void post({ type, name: value }).then(() => set("")); }}>
              <input placeholder="Nombre" value={value} onChange={(e) => set(e.target.value)} required className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
              <button className="btn btn-primary" type="submit">+</button>
            </form>
            <ul className="text-sm space-y-1">
              {(type === "income" ? data.incomeCategories : type === "expense" ? data.expenseCategories : data.providers)?.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
