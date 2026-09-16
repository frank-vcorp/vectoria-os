CREATE TABLE IF NOT EXISTS "surveys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "folio" text NOT NULL UNIQUE,
  "quote_id" uuid NOT NULL REFERENCES "quotes"("id"),
  "client_id" uuid NOT NULL REFERENCES "clients"("id"),
  "operation_type" text NOT NULL,
  "responsible_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "status" text NOT NULL DEFAULT 'borrador',
  "interview_date" timestamp with time zone,
  "transversal_template_version" text NOT NULL,
  "operation_template_version" text NOT NULL,
  "answers" jsonb NOT NULL,
  "section_states" jsonb NOT NULL,
  "archived_operations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "quote_link_history" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "correspondence_review_required" boolean NOT NULL DEFAULT false,
  "correspondence_reviewed" boolean NOT NULL DEFAULT false,
  "revision_number" integer NOT NULL DEFAULT 0,
  "last_finalized_at" timestamp with time zone,
  "export_revision" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid
);

CREATE TABLE IF NOT EXISTS "survey_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "survey_id" uuid NOT NULL REFERENCES "surveys"("id") ON DELETE CASCADE,
  "original_name" text NOT NULL,
  "stored_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "section_id" text,
  "description" text,
  "withdrawn" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid,
  "withdrawn_at" timestamp with time zone,
  "withdrawn_by" uuid
);

CREATE INDEX IF NOT EXISTS "surveys_quote_idx" ON "surveys" ("quote_id");
CREATE INDEX IF NOT EXISTS "surveys_client_idx" ON "surveys" ("client_id");
CREATE INDEX IF NOT EXISTS "surveys_status_idx" ON "surveys" ("status");
CREATE INDEX IF NOT EXISTS "survey_attachments_survey_idx" ON "survey_attachments" ("survey_id");
