import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type postgres from "postgres";

type JournalEntry = { tag: string; when: number };

const RELATION_MARKERS: { tag: string; relation: string }[] = [
  { tag: "0000_stormy_captain_cross", relation: "public.audit_logs" },
  { tag: "0002_phase2_clients_opportunities", relation: "public.clients" },
  { tag: "0003_phase3_quotes_os_payments", relation: "public.financial_incomes" },
  { tag: "0006_phase1_catalogs_v16", relation: "public.system_settings" },
  { tag: "0007_phase2_quote_subscription_items", relation: "public.quote_subscription_items" },
  { tag: "0008_phases3_7_core", relation: "public.financial_expenses" },
  { tag: "0010_validation_plan_checks", relation: "public.project_phase_checks" },
  { tag: "0013_levantamientos", relation: "public.surveys" },
  { tag: "0014_quote_delivery_terms_catalogs", relation: "public.catalog_terms_conditions" },
];

const COLUMN_MARKER = {
  tag: "0001_role_module_read_write",
  table: "role_module_permissions",
  column: "can_read",
};

async function relationExists(client: ReturnType<typeof postgres>, relation: string) {
  const [row] = await client<[{ ok: boolean }]>`
    SELECT to_regclass(${relation}) IS NOT NULL AS ok
  `;
  return Boolean(row?.ok);
}

export async function baselineExistingSchema(client: ReturnType<typeof postgres>) {
  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as {
    entries: JournalEntry[];
  };
  const firstWhen = journal.entries[0]?.when;
  if (!firstWhen) return;
  if (!(await relationExists(client, "public.audit_logs"))) return;

  await client`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await client`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const [last] = await client<[{ created_at: string | number | null }]>`
    SELECT created_at FROM drizzle.__drizzle_migrations
    ORDER BY created_at DESC NULLS LAST
    LIMIT 1
  `;
  const lastAt = last?.created_at == null ? 0 : Number(last.created_at);
  if (Number.isFinite(lastAt) && lastAt >= firstWhen) return;

  const present = new Set<string>();
  for (const marker of RELATION_MARKERS) {
    if (await relationExists(client, marker.relation)) present.add(marker.tag);
  }
  const [column] = await client<[{ ok: boolean }]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${COLUMN_MARKER.table}
        AND column_name = ${COLUMN_MARKER.column}
    ) AS ok
  `;
  if (column?.ok) present.add(COLUMN_MARKER.tag);

  const markerTags = new Set([...RELATION_MARKERS.map((marker) => marker.tag), COLUMN_MARKER.tag]);
  let stampThrough = -1;
  for (let index = 0; index < journal.entries.length; index++) {
    const tag = journal.entries[index].tag;
    if (!markerTags.has(tag)) continue;
    if (!present.has(tag)) break;
    stampThrough = index;
  }
  if (stampThrough < 0) return;

  const pending = journal.entries.slice(0, stampThrough + 1).filter((entry) => entry.when > lastAt);
  if (pending.length === 0) return;

  await client.begin(async (tx) => {
    for (const entry of pending) {
      const sqlText = readFileSync(`drizzle/${entry.tag}.sql`, "utf8");
      const hash = createHash("sha256").update(sqlText).digest("hex");
      await tx`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${hash}, ${entry.when})
      `;
    }
  });

  console.log(
    `Historial de Drizzle atrás del esquema: ${pending.length} migraciones ya aplicadas se registran sin ejecutarse.`,
  );
}
