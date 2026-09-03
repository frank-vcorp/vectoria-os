import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import { getQuoteById } from "@/server/services/quotes";
import { renderQuoteHtml } from "@/server/pdf/document-html";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requireModule(user, "cotizaciones", "read");
    const { id } = await params;
    const quote = await getQuoteById(id);
    if (!quote) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const html = renderQuoteHtml({
      folio: quote.folio,
      clientName: quote.clientName,
      sellerName: quote.sellerName,
      serviceName: quote.serviceName,
      description: quote.description,
      price: quote.price,
      deliveryTime: quote.deliveryTime,
      paymentConditionName: quote.paymentConditionName,
      observations: quote.observations,
      status: quote.status,
      opportunityFolio: quote.opportunityFolio,
      createdAt: quote.createdAt,
      subscriptionItems: quote.subscriptionItems.map((item) => ({
        subscriptionTemplateName: item.subscriptionTemplateName,
        description: item.description,
        price: item.price,
        periodicityName: item.periodicityName,
      })),
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
