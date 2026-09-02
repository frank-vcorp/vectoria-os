import { readFileSync } from "fs";
import { join } from "path";
import { createUser, findUserByEmail } from "@/server/services/users";
import {
  createPeriodicity,
  createPaymentCondition,
  createIncomeCategory,
  createExpenseCategory,
  createProvider,
} from "@/server/services/catalogs";
import { setRoleModules } from "@/server/services/permissions";
import { DEFAULT_ROLE_MODULES } from "@/shared/modules";
import { importDevelopmentPlan, listDevelopmentPlans } from "@/server/services/plans";
import type { RoleKey } from "@/shared/modules";

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@vector-ia.mx";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "VectorIA2026!";
  const adminName = process.env.ADMIN_NAME ?? "Administrador";

  const existingAdmin = await findUserByEmail(adminEmail);
  if (!existingAdmin) {
    await createUser({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "administrador",
    });
    console.log(`Admin creado: ${adminEmail}`);
  } else {
    console.log(`Admin existente: ${adminEmail}`);
  }

  for (const role of Object.keys(DEFAULT_ROLE_MODULES) as RoleKey[]) {
    await setRoleModules(role, DEFAULT_ROLE_MODULES[role]);
  }

  await createPeriodicity("Mensual", 1).catch(() => null);
  await createPeriodicity("Bimestral", 2).catch(() => null);
  await createPeriodicity("Trimestral", 3).catch(() => null);
  await createPeriodicity("Semestral", 6).catch(() => null);
  await createPeriodicity("Anual", 12).catch(() => null);

  await createPaymentCondition("50% anticipo / 50% entrega").catch(() => null);
  await createPaymentCondition("100% anticipo").catch(() => null);

  await createIncomeCategory("Servicios").catch(() => null);
  await createIncomeCategory("Suscripciones").catch(() => null);
  await createExpenseCategory("Operación").catch(() => null);
  await createExpenseCategory("Proveedores").catch(() => null);
  await createProvider("Proveedor general").catch(() => null);

  const existingPlans = await listDevelopmentPlans();
  if (existingPlans.length === 0) {
    const planPath = join(process.cwd(), "Docs/plan-desarrollo-vectoria-v1.0.md");
    try {
      const content = readFileSync(planPath, "utf-8");
      await importDevelopmentPlan({
        content,
        fileName: "plan-desarrollo-vectoria-v1.0.md",
      });
      console.log("Plan de desarrollo v1.0 importado");
    } catch (err) {
      console.warn("Plan no importado:", err);
    }
  } else {
    console.log("Planes de desarrollo ya existen, omitiendo import");
  }

  console.log("Seed completado");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
