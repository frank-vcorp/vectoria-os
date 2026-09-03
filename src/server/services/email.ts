import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { systemSettings } from "@/server/db/schema";

export const EMAIL_SETTINGS_KEYS = {
  enabled: "email_enabled",
  fromEmail: "email_from",
  fromName: "email_from_name",
  apiKey: "sendgrid_api_key",
  subjectBase: "email_subject_base",
  bodyBase: "email_body_base",
  facturapiKey: "facturapi_api_key",
  facturapiEnabled: "facturapi_enabled",
} as const;

export async function getEmailSettings() {
  const db = getDb();
  const rows = await db.select().from(systemSettings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    enabled: map[EMAIL_SETTINGS_KEYS.enabled] === "true",
    fromEmail: map[EMAIL_SETTINGS_KEYS.fromEmail] ?? "",
    fromName: map[EMAIL_SETTINGS_KEYS.fromName] ?? "VectorIA",
    apiKey: map[EMAIL_SETTINGS_KEYS.apiKey] ?? "",
    subjectBase: map[EMAIL_SETTINGS_KEYS.subjectBase] ?? "Documento fiscal",
    bodyBase: map[EMAIL_SETTINGS_KEYS.bodyBase] ?? "Adjunto encontrará su documento.",
  };
}

export function assertEmailConfigured(settings: Awaited<ReturnType<typeof getEmailSettings>>) {
  if (!settings.enabled) throw new Error("SENDGRID_DISABLED");
  if (!settings.apiKey.trim()) throw new Error("SENDGRID_NOT_CONFIGURED");
  if (!settings.fromEmail.trim()) throw new Error("SENDGRID_FROM_EMAIL_REQUIRED");
}

export function emailSettingsForAdmin(settings: Awaited<ReturnType<typeof getEmailSettings>>) {
  return {
    enabled: settings.enabled,
    fromEmail: settings.fromEmail,
    fromName: settings.fromName,
    subjectBase: settings.subjectBase,
    bodyBase: settings.bodyBase,
    apiKeyConfigured: Boolean(settings.apiKey.trim()),
  };
}

export async function setEmailSettings(params: {
  enabled?: boolean;
  fromEmail?: string;
  fromName?: string;
  apiKey?: string;
  subjectBase?: string;
  bodyBase?: string;
}) {
  const db = getDb();
  const entries: [string, string][] = [];
  if (params.enabled !== undefined) entries.push([EMAIL_SETTINGS_KEYS.enabled, String(params.enabled)]);
  if (params.fromEmail !== undefined) entries.push([EMAIL_SETTINGS_KEYS.fromEmail, params.fromEmail]);
  if (params.fromName !== undefined) entries.push([EMAIL_SETTINGS_KEYS.fromName, params.fromName]);
  if (params.apiKey !== undefined) entries.push([EMAIL_SETTINGS_KEYS.apiKey, params.apiKey]);
  if (params.subjectBase !== undefined) entries.push([EMAIL_SETTINGS_KEYS.subjectBase, params.subjectBase]);
  if (params.bodyBase !== undefined) entries.push([EMAIL_SETTINGS_KEYS.bodyBase, params.bodyBase]);

  for (const [key, value] of entries) {
    await db
      .insert(systemSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: systemSettings.key, set: { value, updatedAt: new Date() } });
  }
}

export async function sendInvoiceEmail(params: {
  to?: string;
  clientName: string;
  folio: string;
  pdfUrl?: string | null;
}) {
  const settings = await getEmailSettings();
  assertEmailConfigured(settings);
  if (!params.to) throw new Error("EMAIL_REQUIRED");

  const subject = `${settings.subjectBase} — ${params.folio}`;
  const body = `${settings.bodyBase}\n\nCliente: ${params.clientName}\nFolio: ${params.folio}`;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.to }] }],
      from: { email: settings.fromEmail, name: settings.fromName },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SENDGRID_ERROR: ${text}`);
  }

  return { sent: true };
}

export async function sendQuotePdfEmail(params: {
  to: string;
  folio: string;
  clientName: string;
  pdfBuffer?: Buffer;
}) {
  const settings = await getEmailSettings();
  assertEmailConfigured(settings);

  const subject = `${settings.subjectBase} — Cotización ${params.folio}`;
  const body = `${settings.bodyBase}\n\nCotización ${params.folio} para ${params.clientName}.`;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.to }] }],
      from: { email: settings.fromEmail, name: settings.fromName },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SENDGRID_ERROR: ${text}`);
  }

  return { sent: true };
}

export async function sendServiceOrderPdfEmail(params: {
  to: string;
  folio: string;
  clientName: string;
}) {
  const settings = await getEmailSettings();
  assertEmailConfigured(settings);

  const subject = `${settings.subjectBase} — Orden de Servicio ${params.folio}`;
  const body = `${settings.bodyBase}\n\nOrden de Servicio ${params.folio} para ${params.clientName}.`;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.to }] }],
      from: { email: settings.fromEmail, name: settings.fromName },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SENDGRID_ERROR: ${text}`);
  }

  return { sent: true };
}
