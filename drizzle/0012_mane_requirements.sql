-- Catálogo suscripciones: solo nombre, descripción y precio
ALTER TABLE "catalog_subscription_templates" DROP CONSTRAINT IF EXISTS "catalog_subscription_templates_periodicity_id_catalog_periodicities_id_fk";
ALTER TABLE "catalog_subscription_templates" DROP CONSTRAINT IF EXISTS "catalog_subscription_templates_income_category_id_catalog_income_categories_id_fk";
ALTER TABLE "catalog_subscription_templates" DROP COLUMN IF EXISTS "periodicity_id";
ALTER TABLE "catalog_subscription_templates" DROP COLUMN IF EXISTS "income_category_id";

-- Cuentas bancarias: un solo nombre identificador
ALTER TABLE "bank_accounts" DROP COLUMN IF EXISTS "bank";
