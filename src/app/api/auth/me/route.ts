import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getRoleModules } from "@/server/services/permissions";
import type { RoleKey } from "@/shared/modules";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const modules = await getRoleModules(user.role as RoleKey);
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    modules,
  });
}
