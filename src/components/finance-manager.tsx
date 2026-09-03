"use client";

import { useEffect, useState } from "react";
import { MoneyInput } from "@/components/money-input";
import { formatMoney } from "@/shared/commercial";

type Balance = { id: string; name: string; bank: string | null; balance: number };
type Receivable = {
  os: { folio: string; clientName: string; balance: number; id: string }[];
  subscriptions: { folio: string; clientName: string; balance: number }[];
  totalOs: number;
  totalSubscriptions: number;
};
type Flow = { income: number; expense: number; net: number };

export function FinanceManager() {
  const [tab, setTab] = useState<"balances" | "flow" | "receivable" | "movements" | "manual" | "cxp">("balances");
  const [balances, setBalances] = useState<Balance[]>([]);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [receivable, setReceivable] = useState<Receivable | null>(null);
  const [movements, setMovements] = useState<
    { date: string; type: string; concept: string; amount: number; bank: string }[]
  >([]);
  const [payables, setPayables] = useState<
    { folio: string; concept: string; amount: number; paidAmount: number; status: string }[]
  >([]);
  const [manualForm, setManualForm] = useState({
    type: "income" as "income" | "expense",
    concept: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
  });
  const [cxpForm, setCxpForm] = useState({
    concept: "",
    amount: 0,
    dueDate: new Date().toISOString().slice(0, 10),
  });

  async function loadBalances() {
    const res = await fetch("/api/finance?view=balances");
    if (res.ok) setBalances((await res.json()).balances ?? []);
  }

  async function loadFlow() {
    const res = await fetch("/api/finance?view=flow");
    if (res.ok) setFlow((await res.json()).flow ?? null);
  }

  async function loadReceivable() {
    const res = await fetch("/api/finance?view=receivable");
    if (res.ok) setReceivable((await res.json()).receivable ?? null);
  }

  async function loadMovements() {
    const res = await fetch("/api/finance?view=movements");
    if (res.ok) setMovements((await res.json()).movements ?? []);
  }

  async function loadPayables() {
    const res = await fetch("/api/accounts-payable");
    if (res.ok) setPayables((await res.json()).payables ?? []);
  }

  useEffect(() => {
    if (tab === "balances") void loadBalances();
    if (tab === "flow") void loadFlow();
    if (tab === "receivable") void loadReceivable();
    if (tab === "movements") void loadMovements();
    if (tab === "cxp") void loadPayables();
  }, [tab]);

  async function submitCxp(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/accounts-payable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cxpForm),
    });
    setCxpForm({ concept: "", amount: 0, dueDate: new Date().toISOString().slice(0, 10) });
    await loadPayables();
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: manualForm.type,
        concept: manualForm.concept,
        amount: manualForm.amount,
        incomeDate: manualForm.date,
        expenseDate: manualForm.date,
      }),
    });
    setManualForm({ ...manualForm, concept: "", amount: 0 });
    setTab("movements");
  }

  const tabs = [
    { id: "balances" as const, label: "Saldos banco" },
    { id: "flow" as const, label: "Flujo mensual" },
    { id: "receivable" as const, label: "Cuentas por cobrar" },
    { id: "movements" as const, label: "Movimientos" },
    { id: "manual" as const, label: "Captura manual" },
    { id: "cxp" as const, label: "Cuentas por pagar" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "btn-primary text-sm" : "btn-secondary text-sm"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "balances" && (
        <div className="grid gap-3 md:grid-cols-2">
          {balances.map((b) => (
            <div key={b.id} className="card">
              <p className="font-medium">{b.name}</p>
              <p className="text-2xl mt-1">{formatMoney(b.balance)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "flow" && flow && (
        <div className="card grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[var(--muted)] text-sm">Ingresos</p>
            <p className="text-xl text-green-600">{formatMoney(flow.income)}</p>
          </div>
          <div>
            <p className="text-[var(--muted)] text-sm">Egresos</p>
            <p className="text-xl text-red-600">{formatMoney(flow.expense)}</p>
          </div>
          <div>
            <p className="text-[var(--muted)] text-sm">Neto</p>
            <p className="text-xl">{formatMoney(flow.net)}</p>
          </div>
        </div>
      )}

      {tab === "receivable" && receivable && (
        <div className="space-y-4">
          <div className="card">
            <p className="font-medium">OS pendientes: {formatMoney(receivable.totalOs)}</p>
            {receivable.os.map((r) => (
              <p key={r.id} className="text-sm">
                {r.folio} — {r.clientName}: {formatMoney(r.balance)}
              </p>
            ))}
          </div>
          <div className="card">
            <p className="font-medium">Suscripciones vencidas: {formatMoney(receivable.totalSubscriptions)}</p>
            {receivable.subscriptions.map((r, i) => (
              <p key={i} className="text-sm">
                {r.folio} — {r.clientName}: {formatMoney(r.balance)}
              </p>
            ))}
          </div>
        </div>
      )}

      {tab === "movements" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2">Fecha</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Concepto</th>
                <th className="py-2">Banco</th>
                <th className="py-2">Importe</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="py-2">{new Date(m.date).toLocaleDateString("es-MX")}</td>
                  <td className="py-2">{m.type}</td>
                  <td className="py-2">{m.concept}</td>
                  <td className="py-2">{m.bank}</td>
                  <td className="py-2">{formatMoney(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "manual" && (
        <form className="card space-y-3 max-w-md" onSubmit={(e) => void submitManual(e)}>
          <select
            value={manualForm.type}
            onChange={(e) => setManualForm({ ...manualForm, type: e.target.value as "income" | "expense" })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          >
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
          </select>
          <input
            value={manualForm.concept}
            onChange={(e) => setManualForm({ ...manualForm, concept: e.target.value })}
            placeholder="Concepto"
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            required
          />
          <MoneyInput
            valueCents={manualForm.amount}
            onChangeCents={(amount) => setManualForm({ ...manualForm, amount })}
          />
          <input
            type="date"
            value={manualForm.date}
            onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <button type="submit" className="btn-primary">
            Guardar
          </button>
        </form>
      )}

      {tab === "cxp" && (
        <div className="space-y-4">
          <form className="card space-y-3 max-w-md" onSubmit={(e) => void submitCxp(e)}>
            <h2 className="font-medium">Nueva cuenta por pagar</h2>
            <input
              value={cxpForm.concept}
              onChange={(e) => setCxpForm({ ...cxpForm, concept: e.target.value })}
              placeholder="Concepto"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              required
            />
            <MoneyInput valueCents={cxpForm.amount} onChangeCents={(amount) => setCxpForm({ ...cxpForm, amount })} />
            <input
              type="date"
              value={cxpForm.dueDate}
              onChange={(e) => setCxpForm({ ...cxpForm, dueDate: e.target.value })}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              required
            />
            <button type="submit" className="btn-primary">
              Crear CxP
            </button>
          </form>
          <div className="card space-y-2">
            {payables.map((p) => (
              <div key={p.folio} className="text-sm flex justify-between border-b border-[var(--border)] py-2">
                <span>
                  {p.folio} — {p.concept}
                </span>
                <span>
                  {formatMoney(p.paidAmount)} / {formatMoney(p.amount)} ({p.status})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
