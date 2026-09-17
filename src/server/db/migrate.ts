import "../../../scripts/load-env";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { ensureMigration0014 } from "@/server/db/ensure-migration-0014";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL requerida");
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await ensureMigration0014(client);
  await client.end();
  console.log("Migraciones aplicadas");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
