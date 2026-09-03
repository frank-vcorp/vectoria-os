#!/usr/bin/env tsx
/** Genera HTML de muestra con membrete VectorIA en public/samples/ */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderQuoteHtml, renderServiceOrderHtml } from "../src/server/pdf/document-html";
import { renderBrandedEmailHtml } from "../src/server/email/email-html";

const outDir = join(process.cwd(), "public", "samples");
mkdirSync(outDir, { recursive: true });

const quoteHtml = renderQuoteHtml({
  folio: "COT-2026-0042",
  clientName: "Acme Industrial S.A. de C.V.",
  sellerName: "María González",
  serviceName: "Desarrollo de plataforma web",
  description:
    "Diseño, desarrollo e implementación de plataforma corporativa con panel administrativo, autenticación y módulos comerciales.",
  price: 185_000_00,
  deliveryTime: "45 días hábiles",
  paymentConditionName: "50% anticipo · 50% contra entrega",
  observations: "Incluye capacitación inicial de 4 horas para el equipo operativo.",
  status: "autorizada",
  opportunityFolio: "OPO-2026-0118",
  createdAt: new Date("2026-03-03T16:00:00"),
  subscriptionItems: [
    {
      subscriptionTemplateName: "Soporte y mantenimiento",
      description: "Monitoreo, actualizaciones menores y soporte técnico prioritario.",
      price: 12_500_00,
      periodicityName: "Mensual",
    },
  ],
});

const osHtml = renderServiceOrderHtml({
  folio: "OS-2026-0027",
  clientName: "Acme Industrial S.A. de C.V.",
  sellerName: "María González",
  serviceName: "Desarrollo de plataforma web",
  description: "Orden de servicio derivada de cotización COT-2026-0042.",
  contractType: "por_evento",
  price: 185_000_00,
  paymentConditionName: "50% anticipo · 50% contra entrega",
  deliveryDate: new Date("2026-04-18T00:00:00"),
  observations: "Programador asignado: Carlos Ruiz.",
  status: "activa",
  quoteFolio: "COT-2026-0042",
  totalPaid: 92_500_00,
  balance: 92_500_00,
});

const emailHtml = renderBrandedEmailHtml({
  subjectLine: "Cotización COT-2026-0042",
  bodyParagraphs: [
    "Adjunto encontrará el resumen de su cotización.",
    "Quedamos atentos para cualquier duda o ajuste.",
  ],
  detailRows: [
    { label: "Cliente", value: "Acme Industrial S.A. de C.V." },
    { label: "Folio", value: "COT-2026-0042" },
  ],
  ctaLabel: "Visitar vector-ia.mx",
  ctaUrl: "https://vector-ia.mx",
});

writeFileSync(join(outDir, "cotizacion-muestra.html"), quoteHtml, "utf8");
writeFileSync(join(outDir, "orden-servicio-muestra.html"), osHtml, "utf8");
writeFileSync(join(outDir, "correo-muestra.html"), emailHtml, "utf8");

console.log("Muestras generadas en public/samples/:");
console.log("  - cotizacion-muestra.html");
console.log("  - orden-servicio-muestra.html");
console.log("  - correo-muestra.html");
