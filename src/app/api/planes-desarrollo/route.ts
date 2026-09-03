import { NextResponse } from "next/server";

const DEPRECATED_MSG =
  "Planes de desarrollo en catálogo deprecados. Use importación de Plan de Validación (.md) en cada Proyecto.";

export async function GET() {
  return NextResponse.json({ error: DEPRECATED_MSG, deprecated: true }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: DEPRECATED_MSG, deprecated: true }, { status: 410 });
}
