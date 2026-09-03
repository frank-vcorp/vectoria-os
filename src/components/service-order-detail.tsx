"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoneyInput } from "@/components/money-input";
import { DateInput } from "@/components/date-input";
import { SearchableSelect } from "@/components/searchable-select";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  EntityDetailLayout,
} from "@/components/entity-detail-layout";
import {
  CONTRACT_TYPE_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
  SUBSCRIPTION_BILLING_STATUS_LABELS,
  SUBSCRIPTION_SERVICE_STATUS_LABELS,
  formatMoney,
  type ServiceOrderStatus,
} from "@/shared/commercial";

type OrderDetail = {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  quoteId: string | null;
  quoteFolio: string | null;
  sellerName: string;
  serviceId: string;
  serviceName: string;
  description: string;
  contractType: "por_evento" | "suscripcion";
  periodicityId: string | null;
  periodicityName: string | null;
  price: number;
  paymentConditionId: string | null;
  paymentConditionName: string | null;
  deliveryDate: string;
  observations: string | null;
  programmerId: string | null;
  programmerName: string | null;
  status: ServiceOrderStatus;
  createdAt: string;
};

type PaymentRow = {
  id: string;
  concept: string;
  amount: number;
  paymentDate: string;
  bankAccountName: string;
};

type Summary = {
  total: number;
  totalPaid: number;
  balance: number;
  paymentType: string;
};

type BankOption = { id: string; name: string };

type LinkedSub = {
  id: string;
  folio: string;
  description: string;
  price: number;
  serviceStatus: string;
  billingStatus: string;
};

type SubTemplate = { id: string; name: string; basePrice: number; periodicityId: string; description: string | null };
type Periodicity = { id: string; name: string };

export function ServiceOrderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payForm, setPayForm] = useState({
    concept: "",
    amount: 0,
    bankAccountId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
  });
  const [linkedSubs, setLinkedSubs] = useState<LinkedSub[]>([]);
  const [subTemplates, setSubTemplates] = useState<SubTemplate[]>([]);
  const [periodicities, setPeriodicities] = useState<Periodicity[]>([]);
  const [showNewSub, setShowNewSub] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    subscriptionTemplateId: "",
    description: "",
    price: 0,
    periodicityId: "",
  });
  const [subPayTarget, setSubPayTarget] = useState<string | null>(null);
  const [subPayForm, setSubPayForm] = useState({
    concept: "Pago suscripción",
    amount: 0,
    bankAccountId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
  });
  const [linkedProject, setLinkedProject] = useState<{ id: string; folio: string; status: string } | null>(
    null,
  );
  const [sendEmail, setSendEmail] = useState("");
  const [programmers, setProgrammers] = useState<{ id: string; name: string }[]>([]);
  const [detailsForm, setDetailsForm] = useState({ programmerId: "", deliveryDate: "" });
  const [savingDetails, setSavingDetails] = useState(false);

  async function load() {
    const [res, subsRes] = await Promise.all([
      fetch(`/api/service-orders/${id}`),
      fetch(`/api/subscriptions?serviceOrderId=${id}`),
    ]);
    if (res.status === 404) {
      router.replace("/ordenes-servicio");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      setPayments(data.payments);
      setSummary(data.summary);
      setLinkedProject(data.project ?? null);
      setSendEmail(data.order?.clientEmail ?? "");
      if (data.order) {
        setDetailsForm({
          programmerId: data.order.programmerId ?? "",
          deliveryDate: data.order.deliveryDate?.slice(0, 10) ?? "",
        });
      }
    }
    if (subsRes.ok) {
      const subsData = await subsRes.json();
      setLinkedSubs(subsData.subscriptions ?? []);
    }
    setLoading(false);
  }

  async function activateSub(subId: string) {
    await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate", id: subId }),
    });
    await load();
  }

  async function activateAllSubs() {
    await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate_all", serviceOrderId: id }),
    });
    await load();
  }

  async function createSub(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceOrderId: id, ...newSubForm }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    setShowNewSub(false);
    setNewSubForm({ subscriptionTemplateId: "", description: "", price: 0, periodicityId: "" });
    await load();
  }

  async function addSubPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!subPayTarget) return;
    setError("");
    const res = await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", id: subPayTarget, ...subPayForm }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    setSubPayTarget(null);
    await load();
  }

  function onTemplatePick(templateId: string) {
    const t = subTemplates.find((x) => x.id === templateId);
    if (!t) return;
    setNewSubForm({
      subscriptionTemplateId: templateId,
      description: t.description ?? t.name,
      price: t.basePrice,
      periodicityId: t.periodicityId,
    });
  }

  async function loadBanks() {
    const [banksRes, meRes, progRes] = await Promise.all([
      fetch("/api/bank-accounts"),
      fetch("/api/auth/me"),
      fetch("/api/service-orders?programmers=1"),
    ]);
    if (banksRes.ok) {
      const data = await banksRes.json();
      setBanks(data.accounts);
      if (data.accounts[0]) {
        setPayForm((f) => ({ ...f, bankAccountId: data.accounts[0].id }));
      }
    }
    if (meRes.ok) setIsAdmin((await meRes.json()).user?.role === "administrador");
    if (progRes.ok) setProgrammers((await progRes.json()).programmers ?? []);
  }

  async function loadCatalogs() {
    const catRes = await fetch("/api/catalogs?type=all");
    if (catRes.ok) {
      const data = await catRes.json();
      setSubTemplates(
        (data.subscriptionTemplates ?? []).filter((t: SubTemplate & { status: string }) => t.status === "activo"),
      );
      setPeriodicities(data.periodicities ?? []);
    }
  }

  useEffect(() => {
    void Promise.all([load(), loadBanks(), loadCatalogs()]);
  }, [id]);

  async function setStatus(status: ServiceOrderStatus) {
    await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", id, status }),
    });
    await load();
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", id, ...payForm }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    setPayForm((f) => ({ ...f, concept: "", amount: 0 }));
    await load();
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!detailsForm.programmerId || !detailsForm.deliveryDate) {
      setError("Programador y fecha de entrega son obligatorios");
      return;
    }
    setSavingDetails(true);
    setError("");
    const res = await fetch("/api/service-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_details",
        id,
        programmerId: detailsForm.programmerId,
        deliveryDate: detailsForm.deliveryDate,
      }),
    });
    setSavingDetails(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Error al guardar");
      return;
    }
    await load();
  }

  async function createInvoice() {
    setError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "from_service_order", serviceOrderId: id }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    const data = await res.json();
    router.push(`/facturacion/${data.invoice.id}`);
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!order) return <p className="text-sm text-[var(--danger)]">Orden no encontrada</p>;

  const paymentTypeLabel =
    summary?.paymentType === "pago_total"
      ? "Pago total"
      : summary?.paymentType === "abono"
        ? "Abono"
        : "Sin pagos";

  return (
    <EntityDetailLayout
      backHref="/ordenes-servicio"
      backLabel="Órdenes de servicio"
      folio={order.folio}
      title={order.clientName}
      statusBadge={<span className="badge">{SERVICE_ORDER_STATUS_LABELS[order.status]}</span>}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => void createInvoice()}>
            Crear factura
          </button>
          <a
            href={`/api/service-orders/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            Imprimir PDF
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              void fetch("/api/service-orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send_pdf", id, email: sendEmail || undefined }),
              }).then(async (r) => {
                if (!r.ok) setError((await r.json()).error ?? "Error al enviar");
                else setError("");
              })
            }
          >
            Enviar PDF por correo
          </button>
          {order.status === "creada" && (
            <button type="button" className="btn btn-primary" onClick={() => void setStatus("entregada")}>
              Marcar entregada
            </button>
          )}
          {isAdmin && order.status !== "cancelada" && (
            <button type="button" className="btn btn-ghost" onClick={() => void setStatus("cancelada")}>
              Cancelar
            </button>
          )}
        </>
      }
    >
      <DetailSection title="Información">
        <DetailGrid>
          <DetailField
            label="Cliente"
            value={
              <Link href={`/clientes/${order.clientId}`} className="underline">
                {order.clientName}
              </Link>
            }
          />
          <DetailField label="Vendedor" value={order.sellerName} />
          <DetailField label="Programador" value={order.programmerName ?? "—"} />
          <DetailField
            label="Proyecto"
            value={
              linkedProject ? (
                <Link href={`/proyectos/${linkedProject.id}`} className="text-[var(--accent)]">
                  {linkedProject.folio}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <DetailField label="Servicio" value={order.serviceName} />
          <DetailField label="Descripción" value={order.description} />
          <DetailField label="Tipo de contrato" value={CONTRACT_TYPE_LABELS[order.contractType]} />
          {order.contractType === "suscripcion" && (
            <DetailField label="Periodicidad" value={order.periodicityName} />
          )}
          <DetailField label="Precio" value={formatMoney(order.price)} />
          <DetailField label="Condiciones de pago" value={order.paymentConditionName} />
          <DetailField
            label="Fecha de entrega"
            value={new Date(order.deliveryDate).toLocaleDateString("es-MX")}
          />
          <DetailField label="Observaciones" value={order.observations} />
          <DetailField
            label="Fecha de creación"
            value={new Date(order.createdAt).toLocaleString("es-MX")}
          />
          {order.quoteFolio && order.quoteId && (
            <DetailField
              label="Cotización"
              value={
                <Link href={`/cotizaciones/${order.quoteId}`} className="underline font-mono text-xs">
                  {order.quoteFolio}
                </Link>
              }
            />
          )}
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Asignación">
        <form className="grid gap-3 max-w-md" onSubmit={(e) => void saveDetails(e)}>
          <label className="text-sm block">
            <span className="text-[var(--muted)]">Programador</span>
            <SearchableSelect
              className="mt-1 w-full"
              value={detailsForm.programmerId}
              onChange={(programmerId) => setDetailsForm((f) => ({ ...f, programmerId }))}
              required
              placeholder="Seleccionar…"
              options={programmers.map((p) => ({ value: p.id, label: p.name }))}
            />
          </label>
          <label className="text-sm block">
            <span className="text-[var(--muted)]">Fecha de entrega</span>
            <DateInput
              className="mt-1 w-full"
              value={detailsForm.deliveryDate}
              onChange={(deliveryDate) => setDetailsForm((f) => ({ ...f, deliveryDate }))}
              required
            />
          </label>
          <p className="text-xs text-[var(--muted)]">
            Los cambios se sincronizan al proyecto vinculado, si existe.
          </p>
          <button type="submit" className="btn btn-secondary text-sm w-fit" disabled={savingDetails}>
            {savingDetails ? "Guardando…" : "Guardar asignación"}
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Pagos">
        {summary && (
          <p className="text-sm">
            Total: {formatMoney(summary.total)} · Pagado: {formatMoney(summary.totalPaid)} · Saldo:{" "}
            {formatMoney(summary.balance)} · {paymentTypeLabel}
          </p>
        )}
        <ul className="text-sm space-y-2">
          {payments.map((p) => (
            <li key={p.id} className="border-b border-[var(--border)] pb-2">
              {p.concept} — {formatMoney(p.amount)} — {p.bankAccountName} —{" "}
              {new Date(p.paymentDate).toLocaleDateString("es-MX")}
            </li>
          ))}
          {payments.length === 0 && <li className="text-[var(--muted)]">Sin pagos registrados</li>}
        </ul>
        {order.status !== "cancelada" && (
          <form className="grid gap-2 md:grid-cols-2" onSubmit={(e) => void addPayment(e)}>
            <input
              value={payForm.concept}
              onChange={(e) => setPayForm({ ...payForm, concept: e.target.value })}
              placeholder="Concepto"
              required
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <MoneyInput
              label="Importe (MXN)"
              valueCents={payForm.amount}
              onChangeCents={(amount) => setPayForm({ ...payForm, amount })}
              required
            />
            <SearchableSelect
              value={payForm.bankAccountId}
              onChange={(bankAccountId) => setPayForm({ ...payForm, bankAccountId })}
              required
              placeholder="Cuenta bancaria…"
              options={banks.map((b) => ({ value: b.id, label: b.name }))}
            />
            <DateInput
              value={payForm.paymentDate}
              onChange={(paymentDate) => setPayForm({ ...payForm, paymentDate })}
              required
            />
            <button type="submit" className="btn btn-primary md:col-span-2">
              Registrar pago (genera ingreso)
            </button>
          </form>
        )}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </DetailSection>

      <DetailSection title="Suscripciones relacionadas">
        <div className="flex gap-2 flex-wrap mb-3">
          <button type="button" className="btn-secondary text-sm" onClick={() => setShowNewSub((v) => !v)}>
            + Nueva suscripción
          </button>
          {linkedSubs.some((s) => s.serviceStatus === "pendiente_activacion") && (
            <button type="button" className="btn-primary text-sm" onClick={() => void activateAllSubs()}>
              Activar todas
            </button>
          )}
        </div>

        {showNewSub && (
          <form className="card space-y-2 mb-4" onSubmit={(e) => void createSub(e)}>
            <SearchableSelect
              className="w-full"
              value={newSubForm.subscriptionTemplateId}
              onChange={onTemplatePick}
              required
              placeholder="Plantilla de suscripción…"
              options={subTemplates.map((t) => ({ value: t.id, label: t.name }))}
            />
            <input
              value={newSubForm.description}
              onChange={(e) => setNewSubForm({ ...newSubForm, description: e.target.value })}
              placeholder="Descripción"
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            />
            <MoneyInput
              valueCents={newSubForm.price}
              onChangeCents={(price) => setNewSubForm({ ...newSubForm, price })}
            />
            <button type="submit" className="btn-primary text-sm">
              Crear suscripción
            </button>
          </form>
        )}

        {linkedSubs.length === 0 && (
          <p className="text-sm text-[var(--muted)]">Sin suscripciones vinculadas.</p>
        )}

        <div className="space-y-3">
          {linkedSubs.map((s) => (
            <div key={s.id} className="card text-sm space-y-2">
              <div className="flex justify-between gap-2 flex-wrap">
                <div>
                  <Link href={`/suscripciones/${s.id}`} className="text-[var(--accent)] hover:underline font-mono">
                    {s.folio}
                  </Link>
                  {" — "}
                  {s.description}
                </div>
                <div className="flex gap-2">
                  <span className="badge">{SUBSCRIPTION_SERVICE_STATUS_LABELS[s.serviceStatus as keyof typeof SUBSCRIPTION_SERVICE_STATUS_LABELS] ?? s.serviceStatus}</span>
                  <span className="badge">{SUBSCRIPTION_BILLING_STATUS_LABELS[s.billingStatus as keyof typeof SUBSCRIPTION_BILLING_STATUS_LABELS] ?? s.billingStatus}</span>
                </div>
              </div>
              <p>{formatMoney(s.price)} / periodo</p>
              <div className="flex gap-2 flex-wrap">
                {s.serviceStatus === "pendiente_activacion" && (
                  <button type="button" className="btn-primary text-xs" onClick={() => void activateSub(s.id)}>
                    Activar
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => {
                    setSubPayTarget(s.id);
                    setSubPayForm((f) => ({ ...f, bankAccountId: f.bankAccountId || banks[0]?.id || "" }));
                  }}
                >
                  Registrar pago
                </button>
              </div>
              {subPayTarget === s.id && (
                <form className="grid gap-2 md:grid-cols-2 pt-2 border-t border-[var(--border)]" onSubmit={(e) => void addSubPayment(e)}>
                  <input
                    value={subPayForm.concept}
                    onChange={(e) => setSubPayForm({ ...subPayForm, concept: e.target.value })}
                    required
                    className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
                  />
                  <MoneyInput
                    valueCents={subPayForm.amount}
                    onChangeCents={(amount) => setSubPayForm({ ...subPayForm, amount })}
                  />
                  <SearchableSelect
                    value={subPayForm.bankAccountId}
                    onChange={(bankAccountId) => setSubPayForm({ ...subPayForm, bankAccountId })}
                    required
                    placeholder="Cuenta bancaria…"
                    options={banks.map((b) => ({ value: b.id, label: b.name }))}
                  />
                  <DateInput
                    value={subPayForm.paymentDate}
                    onChange={(paymentDate) => setSubPayForm({ ...subPayForm, paymentDate })}
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
      </DetailSection>
    </EntityDetailLayout>
  );
}
