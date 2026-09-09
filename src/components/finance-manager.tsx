"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoneyInput } from "@/components/money-input";
import { DateInput } from "@/components/date-input";
import { SearchableSelect } from "@/components/searchable-select";
import { formatMoney } from "@/shared/commercial";

type Balance = { id: string; name: string; balance: number };
type Receivable = {
  os: { id: string; folio: string; clientName: string; balance: number }[];
  subscriptions: { id: string; folio: string; clientName: string; balance: number }[];
  totalOs: number;
  totalSubscriptions: number;
};
type Flow = { income: number; expense: number; net: number };
type Payable = {
  id: string;
  folio: string;
  concept: string;
  amount: number;
  paidAmount: number;
  status: string;
};
type BankOption = { id: string; name: string };

export function FinanceManager() {
  const [tab, setTab] = useState<"dashboard" | "cxp">("dashboard");
  const [sales, setSales] = useState<number | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [receivable, setReceivable] = useState<Receivable | null>(null);
  const [period, setPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [payables, setPayables] = useState<Payable[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [cxpPayTarget, setCxpPayTarget] = useState<string | null>(null);
  const [cxpPayForm, setCxpPayForm] = useState({
    concept: "Pago CxP",
    amount: 0,
    bankAccountId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
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
    const q = new URLSearchParams({
      view: "flow",
      year: String(period.year),
      month: String(period.month),
    });
    const res = await fetch(`/api/finance?${q}`);
    if (res.ok) setFlow((await res.json()).flow ?? null);
  }

  async function loadReceivable() {
    const res = await fetch("/api/finance?view=receivable");
    if (res.ok) setReceivable((await res.json()).receivable ?? null);
  }

  async function loadSales() {
    const q = new URLSearchParams({
      view: "sales",
      year: String(period.year),
      month: String(period.month),
    });
    const res = await fetch(`/api/finance?${q}`);
    if (res.ok) {
      const data = await res.json();
      setSales(data.sales?.total ?? 0);
    }
  }

  async function loadDashboard() {
    await Promise.all([loadBalances(), loadFlow(), loadReceivable(), loadSales(), loadBanks()]);
  }

  async function loadPayables() {
    const res = await fetch("/api/accounts-payable");
    if (res.ok) setPayables((await res.json()).payables ?? []);
  }

  async function loadBanks() {
    const res = await fetch("/api/bank-accounts");
    if (res.ok) {
      const accounts = (await res.json()).accounts ?? [];
      setBanks(accounts.map((a: BankOption) => ({ id: a.id, name: a.name })));
      const firstId = accounts[0]?.id ?? "";
      if (firstId) {
        setCxpPayForm((f) => ({ ...f, bankAccountId: f.bankAccountId || firstId }));
      }
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [period.year, period.month]);

  useEffect(() => {
    if (tab === "cxp") void loadPayables();
  }, [tab]);

  async function submitCxpPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!cxpPayTarget) return;
    await fetch("/api/accounts-payable", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", id: cxpPayTarget, ...cxpPayForm }),
    });
    setCxpPayTarget(null);
    await loadPayables();
  }

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

  const totalBankBalance = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalReceivable = (receivable?.totalOs ?? 0) + (receivable?.totalSubscriptions ?? 0);

  return (
    <div className="space-y-4">
      <nav className="tab-bar" aria-label="Finanzas">
        <button
          type="button"
          className={tab === "dashboard" ? "btn btn-primary text-sm" : "btn btn-secondary text-sm"}
          onClick={() => setTab("dashboard")}
        >
          Resumen
        </button>
        <button
          type="button"
          className={tab === "cxp" ? "btn btn-primary text-sm" : "btn btn-secondary text-sm"}
          onClick={() => setTab("cxp")}
        >
          Cuentas por pagar
        </button>
      </nav>

      {tab === "dashboard" && (
        <>
          <div className="card flex flex-wrap gap-2 items-end">
            <label className="text-sm">
              <span className="text-[var(--muted)]">Año</span>
              <input
                type="number"
                value={period.year}
                onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
                className="mt-1 block bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 w-24"
              />
            </label>
            <label className="text-sm">
              <span className="text-[var(--muted)]">Mes</span>
              <select
                value={period.month}
                onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
                className="mt-1 block bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="card text-center">
              <p className="text-[var(--muted)] text-xs">Ingresos del mes</p>
              <p className="text-lg font-semibold text-green-600">{formatMoney(flow?.income ?? 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-[var(--muted)] text-xs">Egresos del mes</p>
              <p className="text-lg font-semibold text-red-600">{formatMoney(flow?.expense ?? 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-[var(--muted)] text-xs">Flujo neto</p>
              <p className="text-lg font-semibold">{formatMoney(flow?.net ?? 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-[var(--muted)] text-xs">Ventas del mes</p>
              <p className="text-lg font-semibold">{formatMoney(sales ?? 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-[var(--muted)] text-xs">Por cobrar</p>
              <p className="text-lg font-semibold">{formatMoney(totalReceivable)}</p>
            </div>
            <div className="card text-center">
              <p className="text-[var(--muted)] text-xs">Saldo en bancos</p>
              <p className="text-lg font-semibold">{formatMoney(totalBankBalance)}</p>
            </div>
          </div>

          {balances.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {balances.map((b) => (
                <div key={b.id} className="card">
                  <p className="font-medium text-sm">{b.name}</p>
                  <p className="text-xl mt-1">{formatMoney(b.balance)}</p>
                </div>
              ))}
            </div>
          )}

          {receivable && (receivable.os.length > 0 || receivable.subscriptions.length > 0) && (
            <div className="grid gap-3 md:grid-cols-2">
              {receivable.os.length > 0 && (
                <div className="card space-y-1">
                  <p className="font-medium text-sm">OS pendientes ({formatMoney(receivable.totalOs)})</p>
                  {receivable.os.map((r) => (
                    <p key={r.id} className="text-sm">
                      <Link href={`/ordenes-servicio/${r.id}`} className="text-[var(--accent)] hover:underline">
                        {r.folio}
                      </Link>
                      {" — "}
                      {r.clientName}: {formatMoney(r.balance)}
                    </p>
                  ))}
                </div>
              )}
              {receivable.subscriptions.length > 0 && (
                <div className="card space-y-1">
                  <p className="font-medium text-sm">
                    Suscripciones vencidas ({formatMoney(receivable.totalSubscriptions)})
                  </p>
                  {receivable.subscriptions.map((r) => (
                    <p key={r.id} className="text-sm">
                      <Link href={`/suscripciones/${r.id}`} className="text-[var(--accent)] hover:underline">
                        {r.folio}
                      </Link>
                      {" — "}
                      {r.clientName}: {formatMoney(r.balance)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
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
            <DateInput
              className="w-full"
              value={cxpForm.dueDate}
              onChange={(dueDate) => setCxpForm({ ...cxpForm, dueDate })}
              required
            />
            <button type="submit" className="btn btn-primary">
              Crear CxP
            </button>
          </form>
          <div className="card space-y-3">
            {payables.map((p) => (
              <div key={p.id} className="text-sm border-b border-[var(--border)] py-2 space-y-2">
                <div className="flex justify-between gap-2 flex-wrap">
                  <span>
                    {p.folio} — {p.concept}
                  </span>
                  <span>
                    {formatMoney(p.paidAmount)} / {formatMoney(p.amount)} ({p.status})
                  </span>
                </div>
                {p.status !== "pagada" && (
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => {
                      setCxpPayTarget(p.id);
                      setCxpPayForm((f) => ({
                        ...f,
                        amount: p.amount - p.paidAmount,
                        bankAccountId: f.bankAccountId || banks[0]?.id || "",
                      }));
                    }}
                  >
                    Registrar pago
                  </button>
                )}
                {cxpPayTarget === p.id && (
                  <form className="grid gap-2 md:grid-cols-2 pt-2" onSubmit={(e) => void submitCxpPayment(e)}>
                    <input
                      value={cxpPayForm.concept}
                      onChange={(e) => setCxpPayForm({ ...cxpPayForm, concept: e.target.value })}
                      required
                      className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
                    />
                    <MoneyInput
                      valueCents={cxpPayForm.amount}
                      onChangeCents={(amount) => setCxpPayForm({ ...cxpPayForm, amount })}
                    />
                    <SearchableSelect
                      value={cxpPayForm.bankAccountId}
                      onChange={(bankAccountId) => setCxpPayForm({ ...cxpPayForm, bankAccountId })}
                      required
                      placeholder="Cuenta bancaria…"
                      options={banks.map((b) => ({ value: b.id, label: b.name }))}
                    />
                    <DateInput
                      value={cxpPayForm.paymentDate}
                      onChange={(paymentDate) => setCxpPayForm({ ...cxpPayForm, paymentDate })}
                      required
                    />
                    <button type="submit" className="btn-primary text-xs md:col-span-2">
                      Confirmar pago
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
