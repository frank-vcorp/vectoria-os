import { NextResponse } from "next/server";

/** API reservada para Fase 4 — importación de Plan de Desarrollo en Proyectos. */
export async function GET() {
  return NextResponse.json(
    { error: "Planes de Desarrollo disponibles a partir de Fase 4" },
    { status: 404 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Planes de Desarrollo disponibles a partir de Fase 4" },
    { status: 404 },
  );
}
