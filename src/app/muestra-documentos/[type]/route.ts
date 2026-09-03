import { NextResponse } from "next/server";
import { renderQuoteHtml, renderServiceOrderHtml } from "@/server/pdf/document-html";
import { renderBrandedEmailHtml } from "@/server/email/email-html";

const SAMPLE_QUOTE = {
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
};

const SAMPLE_OS = {
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
};

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  let html: string;
  switch (type) {
    case "cotizacion":
      html = renderQuoteHtml(SAMPLE_QUOTE);
      break;
    case "orden-servicio":
      html = renderServiceOrderHtml(SAMPLE_OS);
      break;
    case "correo":
      html = renderBrandedEmailHtml({
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
      break;
    default:
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
