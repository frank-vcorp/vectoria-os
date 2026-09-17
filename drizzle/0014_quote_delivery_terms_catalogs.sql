CREATE TABLE IF NOT EXISTS "catalog_delivery_times" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'activo' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "catalog_terms_conditions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "body" text NOT NULL,
  "status" text DEFAULT 'activo' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "delivery_time_id" uuid;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "terms_condition_id" uuid;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "terms_text" text;

DO $$ BEGIN
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_delivery_time_id_catalog_delivery_times_id_fk"
    FOREIGN KEY ("delivery_time_id") REFERENCES "public"."catalog_delivery_times"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_terms_condition_id_catalog_terms_conditions_id_fk"
    FOREIGN KEY ("terms_condition_id") REFERENCES "public"."catalog_terms_conditions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
