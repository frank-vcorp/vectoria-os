import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import {
  getServiceOrderById,
  getServiceOrderPaymentSummary,
  listServiceOrderPayments,
} from "@/server/services/service-orders";
import { getProjectByServiceOrderId } from "@/server/services/projects";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "ordenes_servicio", "read");
    const { id } = await params;
    const order = await getServiceOrderById(id);
    if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const [payments, summary, project] = await Promise.all([
      listServiceOrderPayments(id),
      getServiceOrderPaymentSummary(id),
      getProjectByServiceOrderId(id),
    ]);
    return NextResponse.json({ order, payments, summary, project });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
