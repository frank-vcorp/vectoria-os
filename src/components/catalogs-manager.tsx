"use client";

import { useEffect, useState } from "react";
import { QuickAddField } from "@/components/quick-add-field";

type CatalogData = {
  periodicities?: { id: string; name: string; intervalMonths: number; status: string }[];
  services?: { id: string; name: string; status: string }[];
  paymentConditions?: { id: string; name: string; status: string }[];
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
  const [service, setService] = useState({ name: "" });
  const [payment, setPayment] = useState({ name: "" });
  const [editPeriodicity, setEditPeriodicity] = useState<{ id: string; name: string; intervalMonths: number } | null>(null);
  const [editService, setEditService] = useState<{ id: string; name: string } | null>(null);
  const [editPayment, setEditPayment] = useState<{ id: string; name: string } | null>(null);

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
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void post({ type: "service", name: service.name }).then(() => setService({ name: "" }));
          }}
        >
          <input
            placeholder="Nombre"
            value={service.name}
            onChange={(e) => setService({ name: e.target.value })}
            required
            className="flex-1 min-w-[12rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </form>
        {editService && (
          <form
            className="flex flex-wrap gap-2 p-3 rounded-lg bg-[var(--surface-2)]"
            onSubmit={(e) => {
              e.preventDefault();
              void patch({ type: "service", id: editService.id, name: editService.name }).then(() =>
                setEditService(null),
              );
            }}
          >
            <input
              value={editService.name}
              onChange={(e) => setEditService({ ...editService, name: e.target.value })}
              required
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <button className="btn btn-primary" type="submit">
              Guardar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditService(null)}>
              Cancelar
            </button>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {data.services?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>{s.name}</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => setEditService({ id: s.id, name: s.name })}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    void patch({ type: "service", id: s.id, status: s.status === "activo" ? "inactivo" : "activo" })
                  }
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
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void post({ type: "payment_condition", name: payment.name }).then(() => setPayment({ name: "" }));
          }}
        >
          <input
            placeholder="Nombre"
            value={payment.name}
            onChange={(e) => setPayment({ name: e.target.value })}
            required
            className="flex-1 min-w-[12rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </form>
        {editPayment && (
          <form
            className="flex flex-wrap gap-2 p-3 rounded-lg bg-[var(--surface-2)]"
            onSubmit={(e) => {
              e.preventDefault();
              void patch({ type: "payment_condition", id: editPayment.id, name: editPayment.name }).then(() =>
                setEditPayment(null),
              );
            }}
          >
            <input
              value={editPayment.name}
              onChange={(e) => setEditPayment({ ...editPayment, name: e.target.value })}
              required
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <button className="btn btn-primary" type="submit">
              Guardar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditPayment(null)}>
              Cancelar
            </button>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {data.paymentConditions?.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>{p.name}</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => setEditPayment({ id: p.id, name: p.name })}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    void patch({
                      type: "payment_condition",
                      id: p.id,
                      status: p.status === "activo" ? "cancelado" : "activo",
                    })
                  }
                >
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
