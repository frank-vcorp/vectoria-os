import "./load-env";
import { createUser, findUserByEmail } from "@/server/services/users";
import {
  createPeriodicity,
  createPaymentCondition,
  createIncomeCategory,
  createExpenseCategory,
  createProvider,
  createService,
  createSubscriptionTemplate,
  listServices,
  listSubscriptionTemplates,
  listIncomeCategories,
  listPeriodicities,
} from "@/server/services/catalogs";
import { setRolePermissions } from "@/server/services/permissions";
import { defaultPermissionsForRole } from "@/shared/modules";
import type { ModuleKey, RoleKey } from "@/shared/modules";
import { ensureDefaultBankAccount } from "@/server/services/bank-accounts";
import { ensureDefaultSettings } from "@/server/services/settings";

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

  await ensureDefaultSettings();

  await createPeriodicity("Mensual", 1).catch(() => null);
  await createPeriodicity("Bimestral", 2).catch(() => null);
  await createPeriodicity("Trimestral", 3).catch(() => null);
  await createPeriodicity("Semestral", 6).catch(() => null);
  await createPeriodicity("Anual", 12).catch(() => null);

  await createPaymentCondition(
    "50% anticipo / 50% entrega",
    "Mitad al inicio del proyecto y mitad a la entrega.",
  ).catch(() => null);
  await createPaymentCondition("100% anticipo", "Pago completo antes de iniciar.").catch(() => null);

  await createIncomeCategory("Servicios").catch(() => null);
  await createIncomeCategory("Suscripciones").catch(() => null);
  await createExpenseCategory("Operación").catch(() => null);
  await createExpenseCategory("Proveedores").catch(() => null);
  await createProvider("Proveedor general").catch(() => null);

  const incomeCategories = await listIncomeCategories();
  const serviciosCat = incomeCategories.find((c) => c.name === "Servicios")?.id;
  const suscripcionesCat = incomeCategories.find((c) => c.name === "Suscripciones")?.id;
  const periodicities = await listPeriodicities();
  const mensual = periodicities.find((p) => p.name === "Mensual")?.id;

  const existingServices = await listServices();
  if (existingServices.length === 0 && serviciosCat) {
    await createService({
      name: "Consultoría por evento",
      basePrice: 500_000,
      incomeCategoryId: serviciosCat,
      generatesProject: true,
    }).catch(() => null);
    await createService({
      name: "Implementación a medida",
      basePrice: 1_200_000,
      incomeCategoryId: serviciosCat,
      generatesProject: true,
    }).catch(() => null);
    console.log("Servicios seed creados");
  }

  const existingSubscriptions = await listSubscriptionTemplates();
  if (existingSubscriptions.length === 0 && mensual && suscripcionesCat) {
    await createSubscriptionTemplate({
      name: "Soporte mensual",
      description: "Soporte técnico recurrente con SLA estándar.",
      basePrice: 150_000,
      periodicityId: mensual,
      incomeCategoryId: suscripcionesCat,
    }).catch(() => null);
    await createSubscriptionTemplate({
      name: "Hosting y mantenimiento",
      description: "Infraestructura y actualizaciones periódicas.",
      basePrice: 80_000,
      periodicityId: mensual,
      incomeCategoryId: suscripcionesCat,
    }).catch(() => null);
    console.log("Suscripciones seed creadas");
  }

  await ensureDefaultBankAccount().catch(() => null);

  console.log("Seed completado");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
