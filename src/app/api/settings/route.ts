import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { getOperationalTimezone, setOperationalTimezone } from "@/server/services/settings";
import {
  emailSettingsForAdmin,
  getEmailSettings,
  setEmailSettings,
} from "@/server/services/email";
import {
  facturapiSettingsForAdmin,
  getFacturapiSettings,
  setFacturapiSettings,
} from "@/server/services/facturapi";

function settingsPayload(
  operationalTimezone: string,
  email: Awaited<ReturnType<typeof getEmailSettings>>,
  facturapi: Awaited<ReturnType<typeof getFacturapiSettings>>,
) {
  return {
    operationalTimezone,
    email: emailSettingsForAdmin(email),
    facturapi: facturapiSettingsForAdmin(facturapi),
  };
}

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
    return NextResponse.json(settingsPayload(operationalTimezone, email, facturapi));
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
      const current = await getEmailSettings();
      const nextEnabled = body.email.enabled ?? current.enabled;
      const nextApiKey = body.email.apiKey?.trim() ? body.email.apiKey : current.apiKey;
      const nextFromEmail = body.email.fromEmail ?? current.fromEmail;

      if (nextEnabled) {
        if (!nextApiKey.trim()) {
          return NextResponse.json({ error: "SENDGRID_API_KEY_REQUIRED" }, { status: 400 });
        }
        if (!nextFromEmail.trim()) {
          return NextResponse.json({ error: "SENDGRID_FROM_EMAIL_REQUIRED" }, { status: 400 });
        }
      }

      await setEmailSettings(body.email);
    }

    if (body.facturapi) {
      const current = await getFacturapiSettings();
      const nextEnabled = body.facturapi.enabled ?? current.enabled;
      const nextApiKey = body.facturapi.apiKey?.trim() ? body.facturapi.apiKey : current.apiKey;

      if (nextEnabled && !nextApiKey.trim()) {
        return NextResponse.json({ error: "FACTURAPI_API_KEY_REQUIRED" }, { status: 400 });
      }

      await setFacturapiSettings(body.facturapi);
    }

    const [operationalTimezone, email, facturapi] = await Promise.all([
      getOperationalTimezone(),
      getEmailSettings(),
      getFacturapiSettings(),
    ]);
    return NextResponse.json(settingsPayload(operationalTimezone, email, facturapi));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: e.errors }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "INVALID_TIMEZONE" ? 400 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
