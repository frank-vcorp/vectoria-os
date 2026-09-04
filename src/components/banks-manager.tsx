"use client";

import { useEffect, useState } from "react";
import { MoneyInput } from "@/components/money-input";
import { FormField, FormPanel } from "@/components/form-panel";
import { formatMoney } from "@/shared/commercial";

type Account = {
  id: string;
  name: string;
  isFiscal: boolean;
  initialBalance: number;
  status: "activa" | "inactiva";
  balance: number;
};

export function BanksManager({ listFirst = false }: { listFirst?: boolean }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    isFiscal: true,
    initialBalance: 0,
  });

  async function load() {
    const res = await fetch("/api/bank-accounts");
    if (res.ok) setAccounts((await res.json()).accounts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    setForm({ name: "", isFiscal: true, initialBalance: 0 });
    await load();
  }

  async function toggleStatus(account: Account) {
    await fetch("/api/bank-accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: account.id,
        status: account.status === "activa" ? "inactiva" : "activa",
      }),
    });
    await load();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  const list = (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
            <th className="py-2 pr-4">Nombre</th>
            <th className="py-2 pr-4">Tipo</th>
            <th className="py-2 pr-4">Saldo</th>
            <th className="py-2 pr-4">Estatus</th>
            <th className="py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id} className="border-b border-[var(--border)]">
              <td className="py-2 pr-4">{a.name}</td>
              <td className="py-2 pr-4">{a.isFiscal ? "Fiscal" : "No fiscal"}</td>
              <td className="py-2 pr-4">{formatMoney(a.balance)}</td>
              <td className="py-2 pr-4">
                <span className="badge">{a.status}</span>
              </td>
              <td className="py-2">
                <button type="button" className="btn btn-secondary text-xs" onClick={() => void toggleStatus(a)}>
                  {a.status === "activa" ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const createForm = (
    <form onSubmit={(e) => void create(e)} className="max-w-lg">
      <FormPanel
        title="Nueva cuenta"
        description="Nombre identificador de la cuenta (ej. BBVA operaciones, Fiscal principal)."
        actions={
          <button type="submit" className="btn btn-primary">
            Guardar cuenta
          </button>
        }
      >
        <FormField label="Nombre *">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej. BBVA operaciones"
            required
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={form.isFiscal}
            onChange={(e) => setForm({ ...form, isFiscal: e.target.checked })}
          />
          Cuenta fiscal
        </label>
        <MoneyInput
          label="Saldo inicial"
          valueCents={form.initialBalance}
          onChangeCents={(initialBalance) => setForm({ ...form, initialBalance })}
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </FormPanel>
    </form>
  );

  return (
    <div className="space-y-6">
      {listFirst ? (
        <>
          {list}
          {createForm}
        </>
      ) : (
        <>
          {createForm}
          {list}
        </>
      )}
    </div>
  );
}
