import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import {
  getServiceOrderById,
  getServiceOrderPaymentSummary,
} from "@/server/services/service-orders";
import { renderServiceOrderHtml } from "@/server/pdf/document-html";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requireModule(user, "ordenes_servicio", "read");
    const { id } = await params;
    const order = await getServiceOrderById(id);
    if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const summary = await getServiceOrderPaymentSummary(id);
    const html = renderServiceOrderHtml({
      folio: order.folio,
      clientName: order.clientName,
      sellerName: order.sellerName,
      serviceName: order.serviceName,
      description: order.description,
      contractType: order.contractType,
      periodicityName: order.periodicityName,
      price: order.price,
      paymentConditionName: order.paymentConditionName,
      deliveryDate: order.deliveryDate,
      observations: order.observations,
      status: order.status,
      quoteFolio: order.quoteFolio,
      totalPaid: summary.totalPaid,
      balance: summary.balance,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
