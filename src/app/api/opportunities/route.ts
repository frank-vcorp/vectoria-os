import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { OPPORTUNITY_STATUSES } from "@/shared/commercial";
import {
  addOpportunityLog,
  createOpportunity,
  listOpportunities,
  listOpportunityLog,
  updateOpportunity,
} from "@/server/services/opportunities";
import { getQuotePrefillFromOpportunity } from "@/server/services/quotes";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "oportunidades", "read");
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get("logFor");

    if (opportunityId) {
      const log = await listOpportunityLog(opportunityId);
      return NextResponse.json({ log });
    }

    const search = searchParams.get("search") ?? undefined;
    const opportunities = await listOpportunities(search);
    return NextResponse.json({ opportunities });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const createSchema = z.object({
  clientId: z.string().uuid(),
  serviceId: z.string().uuid(),
  description: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "oportunidades", "write");
    const body = createSchema.parse(await request.json());
    const opportunity = await createOpportunity({
      ...body,
      sellerId: user.id,
      userId: user.id,
    });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const updateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    id: z.string().uuid(),
    clientId: z.string().uuid().optional(),
    serviceId: z.string().uuid().optional(),
    description: z.string().min(1).optional(),
    status: z.enum(OPPORTUNITY_STATUSES).optional(),
  }),
  z.object({
    action: z.literal("log"),
    id: z.string().uuid(),
    note: z.string().min(1),
  }),
  z.object({
    action: z.literal("prefill_quote"),
    id: z.string().uuid(),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = updateSchema.parse(await request.json());

    if (body.action === "log") {
      await requireModule(user, "oportunidades", "write");
      const entry = await addOpportunityLog({
        opportunityId: body.id,
        note: body.note,
        userId: user.id,
      });
      return NextResponse.json({ entry });
    }

    if (body.action === "prefill_quote") {
      await requireModule(user, "cotizaciones", "read");
      const prefill = await getQuotePrefillFromOpportunity(body.id);
      return NextResponse.json(prefill);
    }

    await requireModule(user, "oportunidades", "write");
    const { action: _, id, ...data } = body;
    const opportunity = await updateOpportunity({ id, ...data, userId: user.id });
    return NextResponse.json({ opportunity });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND" ? 404 : msg === "LOCKED" ? 409 : msg === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
