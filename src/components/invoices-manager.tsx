"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickAddClient } from "@/components/quick-add-client";
import { ListSearchInput } from "@/components/list-search-input";
import { SearchableSelect } from "@/components/searchable-select";
import { ClientFiscalFields, emptyFiscal, hasFiscalData } from "@/components/client-fiscal-fields";
import { MoneyInput } from "@/components/money-input";
import {
  INVOICE_SEND_STATUS_LABELS,
  INVOICE_SOURCE_LABELS,
  INVOICE_STATUS_LABELS,
  formatMoney,
  type ClientFiscalData,
  type InvoiceSendStatus,
  type InvoiceStatus,
} from "@/shared/commercial";

type InvoiceRow = {
  id: string;
  folio: string;
  clientName: string;
  concept: string;
  status: InvoiceStatus;
  sendStatus: InvoiceSendStatus;
  total: number;
  sourceType: string | null;
  createdAt: string;
};

type ClientOption = { id: string; name: string; fiscalData: ClientFiscalData | null };

export function InvoicesManager() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"list" | "create">("list");
  const [form, setForm] = useState({
    clientId: "",
    concept: "",
    total: 0,
    fiscalData: { ...emptyFiscal },
  });
  const [needsFiscal, setNeedsFiscal] = useState(false);

  async function load(q = search) {
    const params = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : "";
    const [invRes, cliRes] = await Promise.all([fetch(`/api/invoices${params}`), fetch("/api/clients")]);
    if (invRes.ok) setInvoices((await invRes.json()).invoices ?? []);
    if (cliRes.ok) {
      const rows = (await cliRes.json()).clients ?? [];
      setClients(rows.map((c: ClientOption) => ({ id: c.id, name: c.name, fiscalData: c.fiscalData })));
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function processAuto() {
    setError("");
    const res = await fetch("/api/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "process_auto" }),
    });
    if (!res.ok) setError((await res.json()).error ?? "Error");
    await load();
  }

  async function createManual(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsFiscal(false);

    const client = clients.find((c) => c.id === form.clientId);
    if (client && !hasFiscalData(client.fiscalData ?? {}) && !hasFiscalData(form.fiscalData)) {
      setNeedsFiscal(true);
      setError("Complete los datos fiscales del cliente");
      return;
    }

    if (hasFiscalData(form.fiscalData)) {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_fiscal",
          clientId: form.clientId,
          fiscalData: form.fiscalData,
        }),
      });
    }

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "manual",
        clientId: form.clientId,
        concept: form.concept,
        total: form.total,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "FISCAL_INCOMPLETE") {
        setNeedsFiscal(true);
      }
      setError(data.error ?? "Error");
      return;
    }
    router.push(`/facturacion/${data.invoice.id}`);
  }

  function onClientPick(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    setForm({
      ...form,
      clientId,
      fiscalData: { ...emptyFiscal, ...(client?.fiscalData ?? {}) },
    });
  }

  async function handleQuickAddClient(client: { id: string; name: string }) {
    await load();
    onClientPick(client.id);
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-4">
      <nav className="tab-bar" aria-label="Facturación">
        <button
          type="button"
          className={tab === "list" ? "btn btn-primary text-sm" : "btn btn-secondary text-sm"}
          onClick={() => setTab("list")}
        >
          Listado
        </button>
        <button
          type="button"
          className={tab === "create" ? "btn btn-primary text-sm" : "btn btn-secondary text-sm"}
          onClick={() => setTab("create")}
        >
          Nueva factura manual
        </button>
        <button type="button" className="btn btn-secondary text-sm" onClick={() => void processAuto()}>
          Procesar automáticas
        </button>
      </nav>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {tab === "create" && (
        <form className="card space-y-3 max-w-lg" onSubmit={(e) => void createManual(e)}>
          <h2 className="font-medium">Captura manual</h2>
          <QuickAddClient onCreated={handleQuickAddClient} />
          <SearchableSelect
            className="w-full"
            value={form.clientId}
            onChange={onClientPick}
            required
            placeholder="Cliente *"
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
          />
          <input
            value={form.concept}
            onChange={(e) => setForm({ ...form, concept: e.target.value })}
            placeholder="Concepto *"
            required
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <MoneyInput valueCents={form.total} onChangeCents={(total) => setForm({ ...form, total })} />
          {(needsFiscal || (form.clientId && !hasFiscalData(form.fiscalData))) && (
            <div className="border-t border-[var(--border)] pt-3">
              <p className="text-sm font-medium mb-2">Datos fiscales requeridos</p>
              <ClientFiscalFields
                data={form.fiscalData}
                onChange={(fiscalData) => setForm({ ...form, fiscalData })}
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary">
            Crear borrador
          </button>
        </form>
      )}

      {tab === "list" && (
        <div className="card space-y-3 overflow-x-auto">
          <ListSearchInput
            value={search}
            onChange={setSearch}
            onSearch={() => {
              setLoading(true);
              void load(search);
            }}
          />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-2 pr-4">Folio</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Concepto</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Envío</th>
                <th className="py-2 pr-4">Origen</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-4">
                    <Link href={`/facturacion/${inv.id}`} className="text-[var(--accent)] hover:underline">
                      {inv.folio}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{inv.clientName}</td>
                  <td className="py-2 pr-4 max-w-[12rem] truncate">{inv.concept}</td>
                  <td className="py-2 pr-4">{formatMoney(inv.total)}</td>
                  <td className="py-2 pr-4">
                    <span className="badge">{INVOICE_STATUS_LABELS[inv.status]}</span>
                  </td>
                  <td className="py-2 pr-4">{INVOICE_SEND_STATUS_LABELS[inv.sendStatus]}</td>
                  <td className="py-2 pr-4">
                    {INVOICE_SOURCE_LABELS[inv.sourceType ?? ""] ?? inv.sourceType ?? "—"}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-[var(--muted)]">
                    Sin facturas. Cree un borrador manual o desde una OS / suscripción.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
