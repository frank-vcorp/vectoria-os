import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import { getOpportunityById, listOpportunityLog } from "@/server/services/opportunities";
import { listQuotesByOpportunity } from "@/server/services/quotes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "oportunidades", "read");
    const { id } = await params;
    const opportunity = await getOpportunityById(id);
    if (!opportunity) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const [log, quotes] = await Promise.all([listOpportunityLog(id), listQuotesByOpportunity(id)]);
    return NextResponse.json({ opportunity, log, quotes });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
