ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "concept" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "cycle_id" uuid;
