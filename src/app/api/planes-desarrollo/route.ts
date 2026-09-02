import { NextResponse } from "next/server";
import { requireUser, requireModule } from "@/server/auth/session";
import {
  listDevelopmentPlans,
  importDevelopmentPlan,
  getDevelopmentPlanWithPhases,
} from "@/server/services/plans";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "catalogos");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const plan = await getDevelopmentPlanWithPhases(id);
      if (!plan) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      return NextResponse.json(plan);
    }

    const plans = await listDevelopmentPlans();
    return NextResponse.json({ plans });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 403 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireModule(user, "catalogos");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const content = await file.text();
    const result = await importDevelopmentPlan({
      content,
      fileName: file.name,
      userId: user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : msg.includes("Fase") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
