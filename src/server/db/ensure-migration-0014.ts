import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type postgres from "postgres";

const MIGRATION_TAG = "0014_quote_delivery_terms_catalogs";

export async function ensureMigration0014(client: ReturnType<typeof postgres>) {
  const [{ exists }] = await client<[{ exists: boolean }]>`
    SELECT to_regclass('public.catalog_terms_conditions') IS NOT NULL AS exists
  `;

  if (exists) {
    console.log("Migración 0014: catálogos ya presentes");
    return;
  }

  console.log("Migración 0014: aplicando fallback…");
  const query = readFileSync(`drizzle/${MIGRATION_TAG}.sql`, "utf8");
  await client.unsafe(query);

  const hash = createHash("sha256").update(query).digest("hex");
  await client`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await client`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
  const [{ count }] = await client<[{ count: string }]>`
    SELECT count(*)::text AS count
    FROM drizzle.__drizzle_migrations
    WHERE hash = ${hash}
  `;
  if (count === "0") {
    await client`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${Date.now()})
    `;
  }

  console.log("Migración 0014: aplicada");
}
