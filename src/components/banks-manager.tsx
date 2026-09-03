"use client";

import { useEffect, useState } from "react";
import { MoneyInput } from "@/components/money-input";
import { formatMoney } from "@/shared/commercial";

type Account = {
  id: string;
  name: string;
  bank: string | null;
  isFiscal: boolean;
  initialBalance: number;
  status: "activa" | "inactiva";
  balance: number;
};

export function BanksManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    bank: "",
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
      body: JSON.stringify({ ...form, bank: form.bank || null }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    setForm({ name: "", bank: "", isFiscal: true, initialBalance: 0 });
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

  return (
    <div className="space-y-6">
      <form className="card space-y-3 max-w-lg" onSubmit={(e) => void create(e)}>
        <h2 className="font-medium">Nueva cuenta bancaria</h2>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nombre de la cuenta *"
          required
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        />
        <input
          value={form.bank}
          onChange={(e) => setForm({ ...form, bank: e.target.value })}
          placeholder="Banco"
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm">
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
        <button type="submit" className="btn-primary">
          Guardar cuenta
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Banco</th>
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
                <td className="py-2 pr-4">{a.bank ?? "—"}</td>
                <td className="py-2 pr-4">{a.isFiscal ? "Fiscal" : "No fiscal"}</td>
                <td className="py-2 pr-4">{formatMoney(a.balance)}</td>
                <td className="py-2 pr-4">
                  <span className="badge">{a.status}</span>
                </td>
                <td className="py-2">
                  <button type="button" className="btn-secondary text-xs" onClick={() => void toggleStatus(a)}>
                    {a.status === "activa" ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
