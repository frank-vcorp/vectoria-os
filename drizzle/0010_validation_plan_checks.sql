ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "plan_version" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "plan_name" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "plan_discovery" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "checklist_required" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "project_phase_checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "phase_id" uuid NOT NULL REFERENCES "project_phases"("id") ON DELETE CASCADE,
  "sort_order" integer NOT NULL,
  "text" text NOT NULL,
  "checked" boolean NOT NULL DEFAULT false,
  "not_applicable" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "project_phase_checks_phase_id_idx" ON "project_phase_checks" ("phase_id");
