"use client";

import { useEffect, useState } from "react";
import { QuickAddField } from "@/components/quick-add-field";

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
  paymentConditions?: { id: string; name: string; description: string | null; status: string }[];
  incomeCategories?: { id: string; name: string }[];
  expenseCategories?: { id: string; name: string }[];
  providers?: { id: string; name: string }[];
};

function StatusBadge({ status }: { status: string }) {
  const active = status === "activo";
  return <span className={`badge ${active ? "badge-success" : "badge-muted"}`}>{status}</span>;
}

function SimpleNameRow({
  label,
  onRename,
}: {
  label: string;
  onRename: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label);

  if (editing) {
    return (
      <form
        className="flex flex-wrap gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          void onRename(name).then(() => setEditing(false));
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} required className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm" />
        <button type="submit" className="btn btn-primary text-sm">Guardar</button>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => { setName(label); setEditing(false); }}>Cancelar</button>
      </form>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {label}
      <button type="button" className="btn btn-ghost text-xs" onClick={() => { setName(label); setEditing(true); }}>Editar</button>
    </span>
  );
}

export function CatalogsManager() {
  const [data, setData] = useState<CatalogData>({});
  const [periodicity, setPeriodicity] = useState({ name: "", intervalMonths: 1 });
  const [service, setService] = useState({ name: "", contractType: "por_evento", periodicityId: "", basePrice: 0 });
  const [payment, setPayment] = useState({ name: "", description: "" });
  const [editPeriodicity, setEditPeriodicity] = useState<{ id: string; name: string; intervalMonths: number } | null>(null);
  const [editService, setEditService] = useState<{
    id: string; name: string; contractType: string; periodicityId: string; basePrice: number;
  } | null>(null);
  const [editPayment, setEditPayment] = useState<{ id: string; name: string; description: string } | null>(null);

  async function load() {
    const res = await fetch("/api/catalogs");
    if (res.ok) setData(await res.json());
  }

  useEffect(() => { void load(); }, []);

  async function post(body: Record<string, unknown>) {
    await fetch("/api/catalogs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
  }

  async function patch(body: Record<string, unknown>) {
    await fetch("/api/catalogs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
          <input placeholder="Nombre" value={periodicity.name} onChange={(e) => setPeriodicity({ ...periodicity, name: e.target.value })} required className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <input type="number" min={1} value={periodicity.intervalMonths} onChange={(e) => setPeriodicity({ ...periodicity, intervalMonths: Number(e.target.value) })} required className="w-24 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <button className="btn btn-primary" type="submit">Agregar</button>
        </form>
        {editPeriodicity && (
          <form className="flex flex-wrap gap-2 p-3 rounded-lg bg-[var(--surface-2)]" onSubmit={(e) => {
            e.preventDefault();
            void patch({ type: "periodicity", id: editPeriodicity.id, name: editPeriodicity.name, intervalMonths: editPeriodicity.intervalMonths }).then(() => setEditPeriodicity(null));
          }}>
            <input value={editPeriodicity.name} onChange={(e) => setEditPeriodicity({ ...editPeriodicity, name: e.target.value })} required className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2" />
            <input type="number" min={1} value={editPeriodicity.intervalMonths} onChange={(e) => setEditPeriodicity({ ...editPeriodicity, intervalMonths: Number(e.target.value) })} className="w-24 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2" />
            <button className="btn btn-primary" type="submit">Guardar</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditPeriodicity(null)}>Cancelar</button>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {data.periodicities?.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>{p.name} — {p.intervalMonths} mes(es)</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setEditPeriodicity({ id: p.id, name: p.name, intervalMonths: p.intervalMonths })}>Editar</button>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => void patch({ type: "periodicity", id: p.id, status: p.status === "activo" ? "cancelado" : "activo" })}>
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
            periodicityId: service.contractType === "suscripcion" && service.periodicityId ? service.periodicityId : null,
          }).then(() => setService({ name: "", contractType: "por_evento", periodicityId: "", basePrice: 0 }));
        }}>
          <input placeholder="Nombre" value={service.name} onChange={(e) => setService({ ...service, name: e.target.value })} required className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <select value={service.contractType} onChange={(e) => setService({ ...service, contractType: e.target.value, periodicityId: "" })} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2">
            <option value="por_evento">Por evento</option>
            <option value="suscripcion">Suscripción</option>
          </select>
          {service.contractType === "suscripcion" && (
            <select value={service.periodicityId} onChange={(e) => setService({ ...service, periodicityId: e.target.value })} required className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2">
              <option value="">Periodicidad…</option>
              {data.periodicities?.filter((p) => p.status === "activo").map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <input type="number" min={0} placeholder="Precio base" value={service.basePrice} onChange={(e) => setService({ ...service, basePrice: Number(e.target.value) })} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2" />
          <button className="btn btn-primary" type="submit">Agregar</button>
        </form>
        {editService && (
          <form className="grid gap-2 md:grid-cols-5 p-3 rounded-lg bg-[var(--surface-2)]" onSubmit={(e) => {
            e.preventDefault();
            void patch({
              type: "service",
              id: editService.id,
              name: editService.name,
              contractType: editService.contractType,
              basePrice: editService.basePrice,
              periodicityId: editService.contractType === "suscripcion" && editService.periodicityId ? editService.periodicityId : null,
            }).then(() => setEditService(null));
          }}>
            <input value={editService.name} onChange={(e) => setEditService({ ...editService, name: e.target.value })} required className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2" />
            <select value={editService.contractType} onChange={(e) => setEditService({ ...editService, contractType: e.target.value })} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
              <option value="por_evento">Por evento</option>
              <option value="suscripcion">Suscripción</option>
            </select>
            {editService.contractType === "suscripcion" && (
              <select value={editService.periodicityId} onChange={(e) => setEditService({ ...editService, periodicityId: e.target.value })} required className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
                <option value="">Periodicidad…</option>
                {data.periodicities?.filter((p) => p.status === "activo").map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <input type="number" min={0} value={editService.basePrice} onChange={(e) => setEditService({ ...editService, basePrice: Number(e.target.value) })} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2" />
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">Guardar</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditService(null)}>Cancelar</button>
            </div>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {data.services?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>
                {s.name} — {s.contractType}
                {s.periodicityId && ` — ${periodicityName(s.periodicityId)}`}
                {" — $"}{(s.basePrice / 100).toFixed(2)}
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setEditService({
                  id: s.id, name: s.name, contractType: s.contractType,
                  periodicityId: s.periodicityId ?? "", basePrice: s.basePrice,
                })}>Editar</button>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => void patch({ type: "service", id: s.id, status: s.status === "activo" ? "inactivo" : "activo" })}>
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
        {editPayment && (
          <form className="flex flex-wrap gap-2 p-3 rounded-lg bg-[var(--surface-2)]" onSubmit={(e) => {
            e.preventDefault();
            void patch({ type: "payment_condition", id: editPayment.id, name: editPayment.name, description: editPayment.description || null }).then(() => setEditPayment(null));
          }}>
            <input value={editPayment.name} onChange={(e) => setEditPayment({ ...editPayment, name: e.target.value })} required className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2" />
            <input value={editPayment.description} onChange={(e) => setEditPayment({ ...editPayment, description: e.target.value })} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2" />
            <button className="btn btn-primary" type="submit">Guardar</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditPayment(null)}>Cancelar</button>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {data.paymentConditions?.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>{p.name}{p.description ? ` — ${p.description}` : ""}</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setEditPayment({ id: p.id, name: p.name, description: p.description ?? "" })}>Editar</button>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => void patch({ type: "payment_condition", id: p.id, status: p.status === "activo" ? "cancelado" : "activo" })}>
                  {p.status === "activo" ? "Cancelar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        {([
          { title: "Ingresos", type: "income" as const, items: data.incomeCategories },
          { title: "Egresos", type: "expense" as const, items: data.expenseCategories },
          { title: "Proveedores", type: "provider" as const, items: data.providers },
        ]).map(({ title, type, items }) => (
          <section key={type} className="card space-y-3">
            <h2 className="font-medium">{title}</h2>
            <QuickAddField placeholder="Nombre" onAdd={(name) => post({ type, name })} />
            <ul className="text-sm space-y-2">
              {items?.map((item) => (
                <li key={item.id}>
                  <SimpleNameRow
                    label={item.name}
                    onRename={(name) => patch({ type, id: item.id, name })}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
