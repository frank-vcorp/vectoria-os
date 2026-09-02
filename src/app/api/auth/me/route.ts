import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getRoleModules, getRolePermissions } from "@/server/services/permissions";
import type { RoleKey } from "@/shared/modules";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const role = user.role as RoleKey;
  const modules = await getRoleModules(role);
  const permissions = await getRolePermissions(role);
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    modules,
    permissions,
  });
}
