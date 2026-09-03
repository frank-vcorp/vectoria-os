"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientFiscalFields, emptyFiscal, hasFiscalData } from "@/components/client-fiscal-fields";
import { MoneyInput } from "@/components/money-input";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  EntityDetailLayout,
} from "@/components/entity-detail-layout";
import {
  INTEGRATION_ERROR_LABELS,
  INVOICE_SEND_STATUS_LABELS,
  INVOICE_SOURCE_LABELS,
  INVOICE_STATUS_LABELS,
  formatMoney,
  type ClientFiscalData,
  type InvoiceSendStatus,
  type InvoiceStatus,
} from "@/shared/commercial";

type Invoice = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  clientFiscalData: ClientFiscalData | null;
  concept: string;
  status: InvoiceStatus;
  sendStatus: InvoiceSendStatus;
  total: number;
  sourceType: string | null;
  sourceId: string | null;
  cycleId: string | null;
  subscriptionId: string | null;
  subscriptionFolio: string | null;
  pdfUrl: string | null;
  xmlUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
};

function formatIntegrationError(code: string) {
  return INTEGRATION_ERROR_LABELS[code] ?? code;
}

export function InvoiceDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editConcept, setEditConcept] = useState("");
  const [editTotal, setEditTotal] = useState(0);
  const [sendEmail, setSendEmail] = useState("");
  const [fiscal, setFiscal] = useState<ClientFiscalData>({ ...emptyFiscal });
  const [showFiscal, setShowFiscal] = useState(false);

  async function load() {
    const res = await fetch(`/api/invoices?id=${id}`);
    if (res.status === 404) {
      router.replace("/facturacion");
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    const inv: Invoice = data.invoice;
    setInvoice(inv);
    setEditConcept(inv.concept);
    setEditTotal(inv.total);
    setSendEmail(inv.clientEmail ?? "");
    setFiscal({ ...emptyFiscal, ...(inv.clientFiscalData ?? {}) });
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function saveDraft() {
    setError("");
    const res = await fetch("/api/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, concept: editConcept, total: editTotal }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    await load();
  }

  async function saveFiscal() {
    if (!invoice) return;
    setError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_fiscal", clientId: invoice.clientId, fiscalData: fiscal }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Datos fiscales incompletos");
      return;
    }
    setShowFiscal(false);
    await load();
  }

  async function patchAction(action: string, extra?: Record<string, unknown>) {
    setError("");
    const res = await fetch("/api/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, ...extra }),
    });
    if (!res.ok) {
      const err = (await res.json()).error ?? "Error";
      setError(formatIntegrationError(err));
      if (err === "FISCAL_INCOMPLETE") setShowFiscal(true);
      return;
    }
    await load();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!invoice) return <p className="text-sm text-[var(--danger)]">Factura no encontrada</p>;

  const canEdit = invoice.status === "borrador";
  const isStamped = invoice.status === "timbrada";

  return (
    <EntityDetailLayout
      backHref="/facturacion"
      backLabel="Facturación"
      folio={invoice.folio}
      title={invoice.concept}
      statusBadge={
        <div className="flex gap-2 flex-wrap">
          <span className="badge">{INVOICE_STATUS_LABELS[invoice.status]}</span>
          <span className="badge">{INVOICE_SEND_STATUS_LABELS[invoice.sendStatus]}</span>
        </div>
      }
    >
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {invoice.errorMessage && (
        <p className="text-sm text-[var(--danger)]">Detalle: {invoice.errorMessage}</p>
      )}

      <DetailSection title="Vista previa">
        <DetailGrid>
          <DetailField label="Cliente" value={invoice.clientName} />
          <DetailField label="Correo" value={invoice.clientEmail ?? "—"} />
          <DetailField
            label="Origen"
            value={INVOICE_SOURCE_LABELS[invoice.sourceType ?? ""] ?? invoice.sourceType ?? "—"}
          />
          <DetailField label="Total" value={formatMoney(invoice.total)} />
          <DetailField
            label="Datos fiscales"
            value={hasFiscalData(invoice.clientFiscalData ?? {}) ? "Completos" : "Incompletos"}
          />
        </DetailGrid>

        {canEdit ? (
          <div className="space-y-3 mt-4 max-w-lg">
            <input
              value={editConcept}
              onChange={(e) => setEditConcept(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <MoneyInput valueCents={editTotal} onChangeCents={setEditTotal} />
            <button type="button" className="btn-secondary text-sm" onClick={() => void saveDraft()}>
              Guardar borrador
            </button>
          </div>
        ) : (
          <p className="text-sm mt-3">{invoice.concept}</p>
        )}
      </DetailSection>

      {(showFiscal || !hasFiscalData(invoice.clientFiscalData ?? {})) && (
        <DetailSection title="Datos fiscales del cliente">
          <ClientFiscalFields data={fiscal} onChange={setFiscal} />
          <button type="button" className="btn-primary text-sm mt-3" onClick={() => void saveFiscal()}>
            Guardar datos fiscales
          </button>
        </DetailSection>
      )}

      <DetailSection title="Acciones">
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <button type="button" className="btn-primary text-sm" onClick={() => void patchAction("stamp")}>
              Timbrar (Facturapi)
            </button>
          )}
          {invoice.status === "error" && (
            <button type="button" className="btn-primary text-sm" onClick={() => void patchAction("retry_stamp")}>
              Reintentar timbrado
            </button>
          )}
          {isStamped && (
            <>
              {invoice.pdfUrl && (
                <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                  Descargar PDF
                </a>
              )}
              {invoice.xmlUrl && (
                <a href={invoice.xmlUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                  Descargar XML
                </a>
              )}
            </>
          )}
          {invoice.status !== "cancelada" && invoice.status !== "borrador" && (
            <button type="button" className="btn-secondary text-sm" onClick={() => void patchAction("cancel")}>
              Cancelar
            </button>
          )}
        </div>

        {isStamped && (
          <form
            className="flex flex-wrap gap-2 items-end mt-4 max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              void patchAction(invoice.sendStatus === "error" ? "retry_send" : "send", { email: sendEmail });
            }}
          >
            <label className="text-sm flex-1 min-w-[12rem]">
              <span className="text-[var(--muted)]">Enviar a</span>
              <input
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                required
                className="mt-1 block w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
            </label>
            <button type="submit" className="btn-primary text-sm">
              {invoice.sendStatus === "error" ? "Reintentar envío" : "Enviar por correo"}
            </button>
          </form>
        )}
      </DetailSection>

      {invoice.sourceType === "service_order" && invoice.sourceId && (
        <p className="text-sm">
          OS origen:{" "}
          <Link href={`/ordenes-servicio/${invoice.sourceId}`} className="text-[var(--accent)]">
            Ver orden
          </Link>
        </p>
      )}
      {invoice.subscriptionId && (
        <p className="text-sm">
          Suscripción:{" "}
          <Link href={`/suscripciones/${invoice.subscriptionId}`} className="text-[var(--accent)]">
            {invoice.subscriptionFolio ?? invoice.subscriptionId}
          </Link>
        </p>
      )}
    </EntityDetailLayout>
  );
}
