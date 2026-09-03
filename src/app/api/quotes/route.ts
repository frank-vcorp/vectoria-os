import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { createQuoteFromOpportunity, listQuotes } from "@/server/services/quotes";

export async function GET() {
  try {
    const user = await requireUser();
    await requireModule(user, "cotizaciones", "read");
    const quotes = await listQuotes();
    return NextResponse.json({ quotes });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const createFromOpportunitySchema = z.object({
  opportunityId: z.string().uuid(),
  deliveryTime: z.string().min(1),
  paymentConditionId: z.string().uuid(),
  price: z.number().int().nonnegative().optional(),
  periodicityId: z.string().uuid().nullable().optional(),
  contractType: z.enum(["por_evento", "suscripcion"]).optional(),
  observations: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "cotizaciones", "write");
    const body = createFromOpportunitySchema.parse(await request.json());
    const quote = await createQuoteFromOpportunity({ ...body, userId: user.id });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND" || msg === "SERVICE_NOT_FOUND"
        ? 404
        : msg === "INVALID_STATUS" || msg === "PERIODICITY_REQUIRED"
          ? 409
          : msg === "UNAUTHORIZED"
            ? 401
            : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
