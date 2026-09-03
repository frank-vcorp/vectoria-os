import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import {
  createInvoiceDraft,
  getInvoiceById,
  listInvoices,
  sendInvoice,
  stampInvoice,
  updateInvoiceStatus,
} from "@/server/services/invoices";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "facturacion", "read");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const invoice = await getInvoiceById(id);
      if (!invoice) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ invoice });
    }

    const invoices = await listInvoices();
    return NextResponse.json({ invoices });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const postSchema = z.object({
  clientId: z.string().uuid(),
  subtotal: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  sourceType: z.string().optional(),
  sourceId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "facturacion", "write");
    const body = postSchema.parse(await request.json());
    const invoice = await createInvoiceDraft({ ...body, userId: user.id });
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("stamp"), id: z.string().uuid() }),
  z.object({ action: z.literal("send"), id: z.string().uuid(), email: z.string().email().optional() }),
  z.object({ action: z.literal("cancel"), id: z.string().uuid() }),
]);

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "facturacion", "write");
    const body = patchSchema.parse(await request.json());

    if (body.action === "stamp") {
      const invoice = await stampInvoice({ id: body.id, userId: user.id });
      return NextResponse.json({ invoice });
    }

    if (body.action === "send") {
      const invoice = await sendInvoice({ id: body.id, email: body.email, userId: user.id });
      return NextResponse.json({ invoice });
    }

    const invoice = await updateInvoiceStatus({ id: body.id, status: "cancelada", userId: user.id });
    return NextResponse.json({ invoice });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "NOT_FOUND"
        ? 404
        : msg === "ALREADY_STAMPED" || msg === "NOT_STAMPED"
          ? 409
          : msg === "UNAUTHORIZED"
            ? 401
            : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
