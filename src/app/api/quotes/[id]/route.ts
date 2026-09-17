import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import { getQuoteById } from "@/server/services/quotes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "cotizaciones", "read");
    const { id } = await params;
    const quote = await getQuoteById(id);
    if (!quote) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ quote });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 });
    console.error("GET /api/quotes/[id]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
