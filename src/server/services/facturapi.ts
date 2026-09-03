import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { clients, systemSettings } from "@/server/db/schema";
import { EMAIL_SETTINGS_KEYS } from "@/server/services/email";

export async function getFacturapiSettings() {
  const db = getDb();
  const rows = await db.select().from(systemSettings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    enabled: map[EMAIL_SETTINGS_KEYS.facturapiEnabled] === "true",
    apiKey: map[EMAIL_SETTINGS_KEYS.facturapiKey] ?? "",
  };
}

export async function setFacturapiSettings(params: { enabled?: boolean; apiKey?: string }) {
  const db = getDb();
  if (params.enabled !== undefined) {
    await db
      .insert(systemSettings)
      .values({ key: EMAIL_SETTINGS_KEYS.facturapiEnabled, value: String(params.enabled), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: String(params.enabled), updatedAt: new Date() },
      });
  }
  if (params.apiKey !== undefined) {
    await db
      .insert(systemSettings)
      .values({ key: EMAIL_SETTINGS_KEYS.facturapiKey, value: params.apiKey, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: params.apiKey, updatedAt: new Date() },
      });
  }
}

export async function stampInvoiceWithFacturapi(params: {
  folio: string;
  clientId: string;
  total: number;
}) {
  const settings = await getFacturapiSettings();
  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, params.clientId)).limit(1);
  if (!client) throw new Error("CLIENT_NOT_FOUND");

  if (!settings.enabled || !settings.apiKey) {
    return {
      facturapiId: `sim-${params.folio}`,
      pdfUrl: `/api/invoices/simulated/${params.folio}.pdf`,
      xmlUrl: `/api/invoices/simulated/${params.folio}.xml`,
      simulated: true,
    };
  }

  const res = await fetch("https://www.facturapi.io/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: {
        legal_name: client.fiscalData?.razonSocial ?? client.name,
        tax_id: client.fiscalData?.rfc ?? "XAXX010101000",
        tax_system: client.fiscalData?.regimenFiscal ?? "601",
        address: { zip: client.fiscalData?.codigoPostal ?? "00000" },
      },
      items: [
        {
          quantity: 1,
          product: {
            description: `Factura ${params.folio}`,
            product_key: "01010101",
            price: params.total / 100,
            tax_included: true,
          },
        },
      ],
      use: client.fiscalData?.usoCfdi ?? "G03",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FACTURAPI_ERROR: ${text}`);
  }

  const data = (await res.json()) as { id: string; pdf_custom_section?: string };
  return {
    facturapiId: data.id,
    pdfUrl: `https://www.facturapi.io/v2/invoices/${data.id}/pdf`,
    xmlUrl: `https://www.facturapi.io/v2/invoices/${data.id}/xml`,
  };
}
