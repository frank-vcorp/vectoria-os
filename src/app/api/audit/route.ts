import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import { listAuditLogs } from "@/server/services/audit";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "usuarios_roles", "read");
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);
    const logs = await listAuditLogs(limit);
    return NextResponse.json({ logs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
