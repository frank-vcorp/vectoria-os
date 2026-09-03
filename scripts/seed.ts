import "./load-env";
import { createUser, findUserByEmail } from "@/server/services/users";
import {
  createPeriodicity,
  createPaymentCondition,
  createIncomeCategory,
  createExpenseCategory,
  createProvider,
  createService,
  listServices,
} from "@/server/services/catalogs";
import { setRolePermissions } from "@/server/services/permissions";
import { defaultPermissionsForRole } from "@/shared/modules";
import type { ModuleKey, RoleKey } from "@/shared/modules";
import { ensureDefaultBankAccount } from "@/server/services/bank-accounts";

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

  for (const role of ["administrador", "vendedor", "programador"] as RoleKey[]) {
    const perms = defaultPermissionsForRole(role);
    await setRolePermissions(
      role,
      Object.entries(perms).map(([module, access]) => ({
        module: module as ModuleKey,
        ...access,
      })),
    );
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

  const existingServices = await listServices();
  if (existingServices.length === 0) {
    await createService({ name: "Consultoría por evento" }).catch(() => null);
    await createService({ name: "Soporte mensual" }).catch(() => null);
    console.log("Servicios seed creados");
  }

  await ensureDefaultBankAccount().catch(() => null);

  console.log("Seed completado");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
