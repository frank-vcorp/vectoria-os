import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireModule } from "@/server/auth/session";
import { getAllRolePermissions, setRolePermissions } from "@/server/services/permissions";
import { MODULES, ROLES } from "@/shared/modules";

export async function GET() {
  try {
    const user = await requireUser();
    await requireModule(user, "usuarios_roles", "read");
    const permissions = await getAllRolePermissions();
    return NextResponse.json({ permissions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

const permissionItemSchema = z.object({
  module: z.enum(MODULES),
  canRead: z.boolean(),
  canWrite: z.boolean(),
});

const updateSchema = z.object({
  role: z.enum(ROLES),
  permissions: z.array(permissionItemSchema),
});

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "usuarios_roles", "write");
    if (user.role !== "administrador") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const body = updateSchema.parse(await request.json());
    await setRolePermissions(body.role, body.permissions);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}
