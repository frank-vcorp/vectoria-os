"use client";

import { useEffect, useState } from "react";
import { MoneyInput } from "@/components/money-input";
import { DateInput } from "@/components/date-input";
import { SearchableSelect } from "@/components/searchable-select";
import { formatMoney } from "@/shared/commercial";
import {
  renderDataTable,
  wrapPrintableDocument,
} from "@/shared/document-letterhead";

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
  a.download = `movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
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
  a.download = `movimientos-${new Date().toISOString().slice(0, 10)}.xls`;
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
    title: "Movimientos",
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

export function MovementsManager() {
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [reportTotals, setReportTotals] = useState<ReportTotals | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [incomeCategories, setIncomeCategories] = useState<CategoryOption[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryOption[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [reportFilters, setReportFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    type: "ambos" as "ambos" | "ingreso" | "egreso",
    bankAccountId: "",
    categoryId: "",
  });
  const [manualForm, setManualForm] = useState({
    type: "income" as "income" | "expense",
    concept: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    bankAccountId: "",
    categoryId: "",
  });

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

  async function loadBanks() {
    const res = await fetch("/api/bank-accounts");
    if (res.ok) {
      const accounts = (await res.json()).accounts ?? [];
      setBanks(accounts.map((a: BankOption) => ({ id: a.id, name: a.name })));
      const firstId = accounts[0]?.id ?? "";
      if (firstId) {
        setManualForm((f) => ({ ...f, bankAccountId: f.bankAccountId || firstId }));
      }
    }
  }

  useEffect(() => {
    void Promise.all([loadBanks(), loadCatalogs()]);
  }, []);

  useEffect(() => {
    void loadReport();
  }, [reportFilters.year, reportFilters.month]);

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
    await loadReport();
  }

  const categoryOptions = manualForm.type === "income" ? incomeCategories : expenseCategories;
  const reportCategoryOptions =
    reportFilters.type === "egreso"
      ? expenseCategories
      : reportFilters.type === "ingreso"
        ? incomeCategories
        : [...incomeCategories, ...expenseCategories];

  return (
    <div className="space-y-4">
      <form className="card space-y-3" onSubmit={(e) => void submitManual(e)}>
        <h2 className="font-medium">Nuevo movimiento</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-sm min-w-[8rem]">
            <span className="text-[var(--muted)]">Tipo</span>
            <select
              value={manualForm.type}
              onChange={(e) =>
                setManualForm({ ...manualForm, type: e.target.value as "income" | "expense", categoryId: "" })
              }
              className="mt-1 block w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
            </select>
          </label>
          <label className="text-sm flex-1 min-w-[12rem]">
            <span className="text-[var(--muted)]">Concepto</span>
            <input
              value={manualForm.concept}
              onChange={(e) => setManualForm({ ...manualForm, concept: e.target.value })}
              placeholder="Concepto"
              required
              className="mt-1 block w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
          </label>
          <MoneyInput
            label="Importe"
            valueCents={manualForm.amount}
            onChangeCents={(amount) => setManualForm({ ...manualForm, amount })}
            className="min-w-[8rem]"
          />
          <label className="text-sm min-w-[10rem]">
            <span className="text-[var(--muted)]">Cuenta</span>
            <SearchableSelect
              className="mt-1 w-full"
              value={manualForm.bankAccountId}
              onChange={(bankAccountId) => setManualForm({ ...manualForm, bankAccountId })}
              required
              placeholder="Cuenta bancaria *"
              options={banks.map((b) => ({ value: b.id, label: b.name }))}
            />
          </label>
          <label className="text-sm min-w-[10rem]">
            <span className="text-[var(--muted)]">Categoría</span>
            <SearchableSelect
              className="mt-1 w-full"
              value={manualForm.categoryId}
              onChange={(categoryId) => setManualForm({ ...manualForm, categoryId })}
              placeholder="Opcional"
              options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))}
            />
          </label>
          <label className="text-sm min-w-[10rem]">
            <span className="text-[var(--muted)]">Fecha</span>
            <DateInput
              className="mt-1 w-full"
              value={manualForm.date}
              onChange={(date) => setManualForm({ ...manualForm, date })}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="section-title">Listado</h2>
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
              <p className="text-[var(--muted)] text-sm">Ingresos</p>
              <p className="text-xl text-green-600">{formatMoney(reportTotals.income)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)] text-sm">Egresos</p>
              <p className="text-xl text-red-600">{formatMoney(reportTotals.expense)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)] text-sm">Neto</p>
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
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[var(--muted)]">
                    Sin movimientos en el periodo seleccionado.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
