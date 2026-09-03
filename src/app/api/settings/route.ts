import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { getOperationalTimezone, setOperationalTimezone } from "@/server/services/settings";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "administrador") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const operationalTimezone = await getOperationalTimezone();
    return NextResponse.json({ operationalTimezone });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const patchSchema = z.object({
  operationalTimezone: z.string().min(1),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "administrador") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const body = patchSchema.parse(await request.json());
    const operationalTimezone = await setOperationalTimezone(body.operationalTimezone, user.id);
    return NextResponse.json({ operationalTimezone });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "INVALID_TIMEZONE" ? 400 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
