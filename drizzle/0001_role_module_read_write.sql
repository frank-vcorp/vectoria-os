ALTER TABLE "role_module_permissions" ADD COLUMN "can_read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD COLUMN "can_write" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "role_module_permissions" SET "can_read" = "enabled", "can_write" = "enabled";--> statement-breakpoint
ALTER TABLE "role_module_permissions" DROP COLUMN "enabled";
