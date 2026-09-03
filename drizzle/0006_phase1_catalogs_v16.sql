ALTER TABLE "catalog_services" ADD COLUMN IF NOT EXISTS "base_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_services" ADD COLUMN IF NOT EXISTS "income_category_id" uuid;--> statement-breakpoint
ALTER TABLE "catalog_services" ADD COLUMN IF NOT EXISTS "generates_project" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "catalog_services" ADD CONSTRAINT "catalog_services_income_category_id_catalog_income_categories_id_fk" FOREIGN KEY ("income_category_id") REFERENCES "public"."catalog_income_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "catalog_payment_conditions" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalog_subscription_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_price" integer DEFAULT 0 NOT NULL,
	"periodicity_id" uuid NOT NULL,
	"income_category_id" uuid,
	"status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "catalog_subscription_templates" ADD CONSTRAINT "catalog_subscription_templates_periodicity_id_catalog_periodicities_id_fk" FOREIGN KEY ("periodicity_id") REFERENCES "public"."catalog_periodicities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "catalog_subscription_templates" ADD CONSTRAINT "catalog_subscription_templates_income_category_id_catalog_income_categories_id_fk" FOREIGN KEY ("income_category_id") REFERENCES "public"."catalog_income_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "system_settings" ("key", "value") VALUES ('operational_timezone', 'America/Mexico_City') ON CONFLICT ("key") DO NOTHING;
