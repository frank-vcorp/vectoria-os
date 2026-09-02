import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { listUsers, createUser, updateUser } from "@/server/services/users";
import { ROLES } from "@/shared/modules";

export async function GET() {
  try {
    const user = await requireUser();
    await requireModule(user, "usuarios_roles");
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "usuarios_roles");
    const body = createSchema.parse(await request.json());
    const created = await createUser({ ...body, createdBy: user.id });
    return NextResponse.json({ user: created }, { status: 201 });
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
  email: z.string().email().optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(["activo", "inactivo"]).optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "usuarios_roles");
    const body = updateSchema.parse(await request.json());
    const updated = await updateUser({ ...body, updatedBy: user.id });
    return NextResponse.json({ user: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
