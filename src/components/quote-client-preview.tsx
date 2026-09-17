"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ClientFiscalData } from "@/shared/commercial";
import { FormSectionBlock } from "@/components/form-panel";

type ClientPreview = {
  id: string;
  folio: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  fiscalData: ClientFiscalData | null;
};

function PreviewField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <span className="label">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function QuoteClientPreview({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<ClientPreview | null>(null);

  useEffect(() => {
    if (!clientId) {
      setClient(null);
      return;
    }
    let cancelled = false;
    void fetch(`/api/clients/${clientId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setClient(data?.client ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <FormSectionBlock
      title="Datos del cliente"
      description={client ? undefined : "Cargando información del cliente…"}
    >
      {client && (
        <div className="space-y-3">
          <div className="client-preview-grid">
            <PreviewField label="Folio" value={client.folio} />
            <PreviewField label="Nombre" value={client.name} />
            <PreviewField label="Contacto" value={client.contact} />
            <PreviewField label="Celular" value={client.phone} />
            <PreviewField label="Correo" value={client.email} />
            <PreviewField label="RFC" value={client.fiscalData?.rfc} />
            <PreviewField label="Razón social" value={client.fiscalData?.razonSocial} />
            <PreviewField label="Régimen fiscal" value={client.fiscalData?.regimenFiscal} />
            <PreviewField label="Código postal" value={client.fiscalData?.codigoPostal} />
            <PreviewField label="Uso CFDI" value={client.fiscalData?.usoCfdi} />
          </div>
          <Link href={`/clientes/${client.id}`} className="text-xs underline text-[var(--accent)]">
            Ver ficha completa del cliente
          </Link>
        </div>
      )}
    </FormSectionBlock>
  );
}
