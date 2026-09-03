import { NextResponse } from "next/server";
import { processAutoSubscriptionInvoices } from "@/server/services/invoices";

export async function POST(request: Request) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
    }

    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const results = await processAutoSubscriptionInvoices();
    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
