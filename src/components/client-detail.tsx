"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClientFiscalData } from "@/shared/commercial";
import {
  OPPORTUNITY_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
  formatMoney,
} from "@/shared/commercial";
import { SAT_REGIMEN_FISCAL, SAT_USO_CFDI } from "@/shared/sat-catalogs";
import {
  ClientFiscalFields,
  emptyFiscal,
  hasFiscalData,
} from "@/components/client-fiscal-fields";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  EntityDetailLayout,
  RelatedTable,
} from "@/components/entity-detail-layout";

type ClientDetail = {
  id: string;
  folio: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  fiscalData: ClientFiscalData | null;
  createdAt: string;
  updatedAt: string;
};

type Related = {
  opportunities: { id: string; folio: string; status: string; serviceName: string; createdAt: string }[];
  quotes: {
    id: string;
    folio: string;
    status: string;
    price: number;
    serviceName: string;
    createdAt: string;
  }[];
  serviceOrders: { id: string; folio: string; status: string; price: number; createdAt: string }[];
};

function satLabel(catalog: { code: string; label: string }[], code?: string) {
  if (!code) return "—";
  return catalog.find((o) => o.code === code)?.label ?? code;
}

export function ClientDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [related, setRelated] = useState<Related | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    fiscalData: { ...emptyFiscal },
  });

  async function load() {
    const res = await fetch(`/api/clients/${id}`);
    if (res.status === 404) {
      router.replace("/clientes");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setClient(data.client);
      setRelated(data.related);
      setForm({
        name: data.client.name,
        contact: data.client.contact ?? "",
        phone: data.client.phone ?? "",
        email: data.client.email ?? "",
        fiscalData: { ...emptyFiscal, ...(data.client.fiscalData ?? {}) },
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: form.name,
        contact: form.contact || null,
        phone: form.phone || null,
        email: form.email || null,
        fiscalData: hasFiscalData(form.fiscalData) ? form.fiscalData : null,
      }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error al guardar");
      return;
    }
    setEditing(false);
    await load();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  if (!client) return <p className="text-sm text-[var(--danger)]">Cliente no encontrado</p>;

  return (
    <EntityDetailLayout
      backHref="/clientes"
      backLabel="Clientes"
      folio={client.folio}
      title={client.name}
      actions={
        !editing ? (
          <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
            Editar
          </button>
        ) : undefined
      }
    >
      {editing ? (
        <DetailSection title="Editar cliente">
          <form className="space-y-3" onSubmit={(e) => void save(e)}>
            <div className="grid gap-2 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
              <input
                placeholder="Contacto"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
              <input
                placeholder="Celular"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
              <input
                type="email"
                placeholder="Correo"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
            </div>
            <details open>
              <summary className="cursor-pointer text-sm font-medium">Datos fiscales</summary>
              <ClientFiscalFields
                data={form.fiscalData}
                onChange={(fiscalData) => setForm({ ...form, fiscalData })}
              />
            </details>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </DetailSection>
      ) : (
        <>
          <DetailSection title="Información general">
            <DetailGrid>
              <DetailField label="Nombre" value={client.name} />
              <DetailField label="Contacto" value={client.contact} />
              <DetailField label="Celular" value={client.phone} />
              <DetailField label="Correo" value={client.email} />
              <DetailField
                label="Registrado"
                value={new Date(client.createdAt).toLocaleString("es-MX")}
              />
              <DetailField
                label="Última actualización"
                value={new Date(client.updatedAt).toLocaleString("es-MX")}
              />
            </DetailGrid>
          </DetailSection>

          {client.fiscalData && hasFiscalData(client.fiscalData) && (
            <DetailSection title="Datos fiscales">
              <DetailGrid>
                <DetailField label="RFC" value={client.fiscalData.rfc} />
                <DetailField label="Razón social" value={client.fiscalData.razonSocial} />
                <DetailField
                  label="Régimen fiscal"
                  value={satLabel(SAT_REGIMEN_FISCAL, client.fiscalData.regimenFiscal)}
                />
                <DetailField label="Código postal" value={client.fiscalData.codigoPostal} />
                <DetailField
                  label="Uso CFDI"
                  value={satLabel(SAT_USO_CFDI, client.fiscalData.usoCfdi)}
                />
              </DetailGrid>
            </DetailSection>
          )}
        </>
      )}

      {related && (
        <>
          <DetailSection title="Oportunidades">
            <RelatedTable
              emptyMessage="Sin oportunidades"
              columns={[
                { key: "folio", label: "Folio" },
                { key: "service", label: "Servicio" },
                { key: "status", label: "Estatus" },
                { key: "date", label: "Fecha" },
              ]}
              rows={related.opportunities.map((o) => ({
                id: o.id,
                cells: {
                  folio: (
                    <Link href={`/oportunidades/${o.id}`} className="underline font-mono text-xs">
                      {o.folio}
                    </Link>
                  ),
                  service: o.serviceName,
                  status: OPPORTUNITY_STATUS_LABELS[o.status as keyof typeof OPPORTUNITY_STATUS_LABELS] ?? o.status,
                  date: new Date(o.createdAt).toLocaleDateString("es-MX"),
                },
              }))}
            />
          </DetailSection>

          <DetailSection title="Cotizaciones">
            <RelatedTable
              emptyMessage="Sin cotizaciones"
              columns={[
                { key: "folio", label: "Folio" },
                { key: "service", label: "Servicio" },
                { key: "price", label: "Precio" },
                { key: "status", label: "Estatus" },
              ]}
              rows={related.quotes.map((q) => ({
                id: q.id,
                cells: {
                  folio: (
                    <Link href={`/cotizaciones/${q.id}`} className="underline font-mono text-xs">
                      {q.folio}
                    </Link>
                  ),
                  service: q.serviceName,
                  price: formatMoney(q.price),
                  status: QUOTE_STATUS_LABELS[q.status as keyof typeof QUOTE_STATUS_LABELS] ?? q.status,
                },
              }))}
            />
          </DetailSection>

          <DetailSection title="Órdenes de servicio">
            <RelatedTable
              emptyMessage="Sin órdenes de servicio"
              columns={[
                { key: "folio", label: "Folio" },
                { key: "price", label: "Precio" },
                { key: "status", label: "Estatus" },
              ]}
              rows={related.serviceOrders.map((o) => ({
                id: o.id,
                cells: {
                  folio: (
                    <Link href={`/ordenes-servicio/${o.id}`} className="underline font-mono text-xs">
                      {o.folio}
                    </Link>
                  ),
                  price: formatMoney(o.price),
                  status:
                    SERVICE_ORDER_STATUS_LABELS[o.status as keyof typeof SERVICE_ORDER_STATUS_LABELS] ??
                    o.status,
                },
              }))}
            />
          </DetailSection>
        </>
      )}
    </EntityDetailLayout>
  );
}
