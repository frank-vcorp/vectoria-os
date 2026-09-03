import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { getOperationalTimezone, setOperationalTimezone } from "@/server/services/settings";
import { getEmailSettings, setEmailSettings } from "@/server/services/email";
import { getFacturapiSettings, setFacturapiSettings } from "@/server/services/facturapi";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "administrador") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const [operationalTimezone, email, facturapi] = await Promise.all([
      getOperationalTimezone(),
      getEmailSettings(),
      getFacturapiSettings(),
    ]);
    return NextResponse.json({ operationalTimezone, email, facturapi });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const patchSchema = z.object({
  operationalTimezone: z.string().min(1).optional(),
  email: z
    .object({
      enabled: z.boolean().optional(),
      fromEmail: z.string().optional(),
      fromName: z.string().optional(),
      apiKey: z.string().optional(),
      subjectBase: z.string().optional(),
      bodyBase: z.string().optional(),
    })
    .optional(),
  facturapi: z
    .object({
      enabled: z.boolean().optional(),
      apiKey: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "administrador") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const body = patchSchema.parse(await request.json());

    if (body.operationalTimezone) {
      await setOperationalTimezone(body.operationalTimezone, user.id);
    }
    if (body.email) {
      await setEmailSettings(body.email);
    }
    if (body.facturapi) {
      await setFacturapiSettings(body.facturapi);
    }

    const [operationalTimezone, email, facturapi] = await Promise.all([
      getOperationalTimezone(),
      getEmailSettings(),
      getFacturapiSettings(),
    ]);
    return NextResponse.json({ operationalTimezone, email, facturapi });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "INVALID_TIMEZONE" ? 400 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
