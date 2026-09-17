import "./load-env";
import { createUser, findUserByEmail } from "@/server/services/users";
import {
  createIncomeCategory,
  createExpenseCategory,
  createProvider,
  createService,
  createDeliveryTime,
  createTermsCondition,
  createPaymentCondition,
  listServices,
  listIncomeCategories,
  listDeliveryTimes,
  listTermsConditions,
  listPaymentConditions,
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

  await createIncomeCategory("Servicios").catch(() => null);
  await createIncomeCategory("Suscripciones").catch(() => null);
  await createExpenseCategory("Operación").catch(() => null);
  await createExpenseCategory("Proveedores").catch(() => null);
  await createProvider("Proveedor general").catch(() => null);

  const incomeCategories = await listIncomeCategories();
  const serviciosCat = incomeCategories.find((c) => c.name === "Servicios")?.id;

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

  await ensureDefaultBankAccount().catch(() => null);

  const deliveryTimes = await listDeliveryTimes();
  if (deliveryTimes.length === 0) {
    const defaults = ["15 días hábiles", "30 días hábiles", "45 días hábiles", "60 días hábiles", "90 días hábiles", "A convenir"];
    for (const [index, name] of defaults.entries()) {
      await createDeliveryTime(name, index).catch(() => null);
    }
    console.log("Tiempos de entrega seed creados");
  }

  const paymentConditions = await listPaymentConditions();
  if (paymentConditions.length === 0) {
    await createPaymentCondition("50% anticipo, 50% contra entrega").catch(() => null);
    await createPaymentCondition("100% contra entrega").catch(() => null);
    await createPaymentCondition("100% anticipo").catch(() => null);
    console.log("Condiciones de pago seed creadas");
  }

  const termsConditions = await listTermsConditions();
  if (termsConditions.length === 0) {
    await createTermsCondition({
      name: "Términos generales VectorIA",
      body: [
        "1. Vigencia: esta cotización tiene validez de 15 días naturales a partir de su emisión.",
        "2. Alcance: el servicio incluye únicamente lo descrito en Implementación y Suscripciones.",
        "3. Cambios: solicitudes fuera de alcance se cotizarán por separado.",
        "4. Propiedad intelectual: salvo pacto distinto, el software entregado queda licenciado al cliente.",
        "5. Confidencialidad: ambas partes protegerán la información intercambiada.",
        "6. Pagos: se aplican las condiciones de pago indicadas; retrasos pueden pausar la entrega.",
      ].join("\n"),
    }).catch(() => null);
    console.log("Términos y condiciones seed creados");
  }

  console.log("Seed completado");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
