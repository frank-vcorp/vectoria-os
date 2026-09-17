import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres from "postgres";
import "./load-env";

const MIGRATION_TAG = "0014_quote_delivery_terms_catalogs";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL requerida");

  const sql = postgres(url, { max: 1 });
  const [{ exists }] = await sql<[{ exists: boolean }]>`
    SELECT to_regclass('public.catalog_terms_conditions') IS NOT NULL AS exists
  `;

  if (exists) {
    console.log("Migración 0014: catálogos ya presentes");
    await sql.end();
    return;
  }

  console.log("Migración 0014: aplicando fallback…");
  const query = readFileSync(`drizzle/${MIGRATION_TAG}.sql`, "utf8");
  await sql.unsafe(query);

  const hash = createHash("sha256").update(query).digest("hex");
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
  const [{ count }] = await sql<[{ count: string }]>`
    SELECT count(*)::text AS count
    FROM drizzle.__drizzle_migrations
    WHERE hash = ${hash}
  `;
  if (count === "0") {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${Date.now()})
    `;
  }

  console.log("Migración 0014: aplicada");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
