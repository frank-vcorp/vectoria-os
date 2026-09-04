"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoneyInput } from "@/components/money-input";
import { DateInput } from "@/components/date-input";
import { SearchableSelect } from "@/components/searchable-select";
import { formatMoney } from "@/shared/commercial";
import {
  renderDataTable,
  wrapPrintableDocument,
} from "@/shared/document-letterhead";

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
type CategoryOption = { id: string; name: string };
type MovementRow = {
  id: string;
  date: string;
  type: string;
  concept: string;
  category: string | null;
  bank: string;
  amount: number;
  sourceType: string | null;
};
type ReportTotals = { income: number; expense: number; net: number; count: number };

const SOURCE_LABELS: Record<string, string> = {
  os_payment: "OS",
  subscription_payment: "Suscripción",
  cxp_payment: "CxP",
  manual: "Manual",
};

function movementExportRows(rows: MovementRow[]) {
  const header = ["Fecha", "Tipo", "Concepto", "Categoría", "Banco", "Importe", "Origen"];
  const lines = rows.map((m) =>
    [
      new Date(m.date).toLocaleDateString("es-MX"),
      m.type,
      m.concept,
      m.category ?? "",
      m.bank,
      (m.amount / 100).toFixed(2),
      SOURCE_LABELS[m.sourceType ?? ""] ?? m.sourceType ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return { header, lines };
}

function exportCsv(rows: MovementRow[]) {
  const { header, lines } = movementExportRows(rows);
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-financiero-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(rows: MovementRow[]) {
  const { header, lines } = movementExportRows(rows);
  const tsv = [header.join("\t"), ...lines.map((l) => l.replace(/"/g, ""))].join("\n");
  const blob = new Blob(["\uFEFF" + tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-financiero-${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPdf(rows: MovementRow[]) {
  const tableRows = rows.map((m) => [
    new Date(m.date).toLocaleDateString("es-MX"),
    m.type,
    m.concept,
    m.category ?? "",
    m.bank,
    formatMoney(m.amount),
    SOURCE_LABELS[m.sourceType ?? ""] ?? m.sourceType ?? "",
  ]);
  const today = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const html = wrapPrintableDocument({
    title: "Reporte financiero",
    docLabel: "Reporte",
    docNumber: new Date().toISOString().slice(0, 10),
    dateLabel: "Generado",
    dateText: today,
    body: `
      <h2 class="doc-section-title">Movimientos</h2>
      ${renderDataTable(
        ["Fecha", "Tipo", "Concepto", "Categoría", "Banco", "Importe", "Origen"],
        tableRows,
      )}
    `,
    logoUrl: "/logo.png",
  });
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export function FinanceManager() {
  const [tab, setTab] = useState<"manual" | "cxp" | null>(null);
  const [sales, setSales] = useState<number | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [receivable, setReceivable] = useState<Receivable | null>(null);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [reportTotals, setReportTotals] = useState<ReportTotals | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [incomeCategories, setIncomeCategories] = useState<CategoryOption[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryOption[]>([]);
  const [reportFilters, setReportFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    type: "ambos" as "ambos" | "ingreso" | "egreso",
    bankAccountId: "",
    categoryId: "",
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
  const [manualForm, setManualForm] = useState({
    type: "income" as "income" | "expense",
    concept: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    bankAccountId: "",
    categoryId: "",
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
      year: String(reportFilters.year),
      month: String(reportFilters.month),
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
      year: String(reportFilters.year),
      month: String(reportFilters.month),
    });
    const res = await fetch(`/api/finance?${q}`);
    if (res.ok) {
      const data = await res.json();
      setSales(data.sales?.total ?? 0);
    }
  }

  async function loadDashboard() {
    await Promise.all([loadBalances(), loadFlow(), loadReceivable(), loadSales(), loadReport(), loadBanks(), loadCatalogs()]);
  }

  async function loadReport() {
    const q = new URLSearchParams({
      view: "report",
      year: String(reportFilters.year),
      month: String(reportFilters.month),
      type: reportFilters.type,
    });
    if (reportFilters.bankAccountId) q.set("bankAccountId", reportFilters.bankAccountId);
    if (reportFilters.categoryId) q.set("categoryId", reportFilters.categoryId);
    const res = await fetch(`/api/finance?${q}`);
    if (res.ok) {
      const data = await res.json();
      setMovements(data.movements ?? []);
      setReportTotals(data.totals ?? null);
      setSelectedIds(new Set());
    }
  }

  async function loadCatalogs() {
    const res = await fetch("/api/catalogs?type=all");
    if (res.ok) {
      const data = await res.json();
      setIncomeCategories(data.incomeCategories ?? []);
      setExpenseCategories(data.expenseCategories ?? []);
    }
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
        setManualForm((f) => ({ ...f, bankAccountId: f.bankAccountId || firstId }));
      }
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [reportFilters.year, reportFilters.month]);

  useEffect(() => {
    if (tab === "cxp") void loadPayables();
  }, [tab]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportReport(selectedOnly: boolean, format: "csv" | "excel" | "pdf" = "csv") {
    const rows = selectedOnly ? movements.filter((m) => selectedIds.has(m.id)) : movements;
    if (rows.length === 0) return;
    if (format === "excel") exportExcel(rows);
    else if (format === "pdf") exportPdf(rows);
    else exportCsv(rows);
  }

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

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: manualForm.type,
        concept: manualForm.concept,
        amount: manualForm.amount,
        bankAccountId: manualForm.bankAccountId || undefined,
        incomeDate: manualForm.date,
        expenseDate: manualForm.date,
        categoryId: manualForm.categoryId || null,
      }),
    });
    setManualForm({ ...manualForm, concept: "", amount: 0, categoryId: "" });
    await loadDashboard();
  }

  const totalBankBalance = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalReceivable = (receivable?.totalOs ?? 0) + (receivable?.totalSubscriptions ?? 0);

  const secondaryTabs = [
    { id: "manual" as const, label: "Captura manual" },
    { id: "cxp" as const, label: "Cuentas por pagar" },
  ];

  const categoryOptions = manualForm.type === "income" ? incomeCategories : expenseCategories;
  const reportCategoryOptions =
    reportFilters.type === "egreso"
      ? expenseCategories
      : reportFilters.type === "ingreso"
        ? incomeCategories
        : [...incomeCategories, ...expenseCategories];

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap gap-2 items-end">
        <label className="text-sm">
          <span className="text-[var(--muted)]">Año</span>
          <input
            type="number"
            value={reportFilters.year}
            onChange={(e) => setReportFilters({ ...reportFilters, year: Number(e.target.value) })}
            className="mt-1 block bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 w-24"
          />
        </label>
        <label className="text-sm">
          <span className="text-[var(--muted)]">Mes</span>
          <select
            value={reportFilters.month}
            onChange={(e) => setReportFilters({ ...reportFilters, month: Number(e.target.value) })}
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
              <p className="font-medium text-sm">Suscripciones vencidas ({formatMoney(receivable.totalSubscriptions)})</p>
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

      <div className="space-y-4">
        <h2 className="section-title">Movimientos y reportes</h2>
        <div className="card flex flex-wrap gap-2 items-end">
          <label className="text-sm">
            <span className="text-[var(--muted)]">Tipo</span>
            <select
              value={reportFilters.type}
              onChange={(e) =>
                setReportFilters({
                  ...reportFilters,
                  type: e.target.value as "ambos" | "ingreso" | "egreso",
                  categoryId: "",
                })
              }
              className="mt-1 block bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <option value="ambos">Ambos</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Cuenta</span>
            <SearchableSelect
              className="mt-1 min-w-[10rem]"
              value={reportFilters.bankAccountId}
              onChange={(bankAccountId) => setReportFilters({ ...reportFilters, bankAccountId })}
              placeholder="Todas"
              options={[{ value: "", label: "Todas" }, ...banks.map((b) => ({ value: b.id, label: b.name }))]}
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Categoría</span>
            <SearchableSelect
              className="mt-1 min-w-[10rem]"
              value={reportFilters.categoryId}
              onChange={(categoryId) => setReportFilters({ ...reportFilters, categoryId })}
              placeholder="Todas"
              options={[
                { value: "", label: "Todas" },
                ...reportCategoryOptions.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </label>
          <button type="button" className="btn btn-secondary text-sm" onClick={() => void loadReport()}>
            Aplicar filtros
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary text-sm" onClick={() => exportReport(false, "csv")}>
              CSV
            </button>
            <button type="button" className="btn btn-secondary text-sm" onClick={() => exportReport(false, "excel")}>
              Excel
            </button>
            <button type="button" className="btn btn-secondary text-sm" onClick={() => exportReport(false, "pdf")}>
              PDF
            </button>
          </div>
        </div>

        {reportTotals && (
          <div className="card grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[var(--muted)] text-sm">Ingresos (filtro)</p>
              <p className="text-xl text-green-600">{formatMoney(reportTotals.income)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)] text-sm">Egresos (filtro)</p>
              <p className="text-xl text-red-600">{formatMoney(reportTotals.expense)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)] text-sm">Neto (filtro)</p>
              <p className="text-xl">{formatMoney(reportTotals.net)}</p>
            </div>
          </div>
        )}

        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2 w-8" />
                <th className="py-2">Fecha</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Concepto</th>
                <th className="py-2">Categoría</th>
                <th className="py-2">Cuenta</th>
                <th className="py-2">Origen</th>
                <th className="py-2">Importe</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-[var(--border)]">
                  <td className="py-2">
                    <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelected(m.id)} />
                  </td>
                  <td className="py-2">{new Date(m.date).toLocaleDateString("es-MX")}</td>
                  <td className="py-2">{m.type}</td>
                  <td className="py-2">{m.concept}</td>
                  <td className="py-2">{m.category ?? "—"}</td>
                  <td className="py-2">{m.bank}</td>
                  <td className="py-2">{SOURCE_LABELS[m.sourceType ?? ""] ?? m.sourceType ?? "—"}</td>
                  <td className="py-2">{formatMoney(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <nav className="tab-bar" aria-label="Operaciones financieras">
        <button
          type="button"
          className={tab === null ? "btn btn-primary text-sm" : "btn btn-secondary text-sm"}
          onClick={() => setTab(null)}
        >
          Resumen
        </button>
        {secondaryTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "btn btn-primary text-sm" : "btn btn-secondary text-sm"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

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
          <SearchableSelect
            className="w-full"
            value={manualForm.bankAccountId}
            onChange={(bankAccountId) => setManualForm({ ...manualForm, bankAccountId })}
            required
            placeholder="Cuenta bancaria *"
            options={banks.map((b) => ({ value: b.id, label: b.name }))}
          />
          <SearchableSelect
            className="w-full"
            value={manualForm.categoryId}
            onChange={(categoryId) => setManualForm({ ...manualForm, categoryId })}
            placeholder="Categoría (opcional)"
            options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))}
          />
          <DateInput
            className="w-full"
            value={manualForm.date}
            onChange={(date) => setManualForm({ ...manualForm, date })}
          />
          <button type="submit" className="btn btn-primary">
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
