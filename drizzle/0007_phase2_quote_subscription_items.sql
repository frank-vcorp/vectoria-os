CREATE TABLE IF NOT EXISTS "quote_subscription_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"subscription_template_id" uuid NOT NULL,
	"description" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"periodicity_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quote_subscription_items" ADD CONSTRAINT "quote_subscription_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quote_subscription_items" ADD CONSTRAINT "quote_subscription_items_subscription_template_id_catalog_subscription_templates_id_fk" FOREIGN KEY ("subscription_template_id") REFERENCES "public"."catalog_subscription_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quote_subscription_items" ADD CONSTRAINT "quote_subscription_items_periodicity_id_catalog_periodicities_id_fk" FOREIGN KEY ("periodicity_id") REFERENCES "public"."catalog_periodicities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "quotes" DROP COLUMN IF EXISTS "contract_type";--> statement-breakpoint
ALTER TABLE "quotes" DROP COLUMN IF EXISTS "periodicity_id";
