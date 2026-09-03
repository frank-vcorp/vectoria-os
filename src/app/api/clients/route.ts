import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { createClient, listClients, updateClient } from "@/server/services/clients";

const fiscalSchema = z
  .object({
    rfc: z.string().optional(),
    razonSocial: z.string().optional(),
    regimenFiscal: z.string().optional(),
    codigoPostal: z.string().optional(),
    usoCfdi: z.string().optional(),
  })
  .optional()
  .nullable();

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "clientes", "read");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") ?? undefined;
    const clients = await listClients(search);
    return NextResponse.json({ clients });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  fiscalData: fiscalSchema,
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "clientes", "write");
    const body = createSchema.parse(await request.json());
    const client = await createClient({ ...body, email: body.email || null, userId: user.id });
    return NextResponse.json({ client }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  contact: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  fiscalData: fiscalSchema,
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "clientes", "write");
    const body = updateSchema.parse(await request.json());
    const { id, ...data } = body;
    const client = await updateClient({
      id,
      ...data,
      email: data.email === undefined ? undefined : data.email || null,
      userId: user.id,
    });
    return NextResponse.json({ client });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    const status = msg === "NOT_FOUND" ? 404 : msg === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
