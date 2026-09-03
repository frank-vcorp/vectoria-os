import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import { getClientById, getClientRelatedRecords } from "@/server/services/clients";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    await requireModule(user, "clientes", "read");
    const { id } = await params;
    const client = await getClientById(id);
    if (!client) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const related = await getClientRelatedRecords(id);
    return NextResponse.json({ client, related });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
