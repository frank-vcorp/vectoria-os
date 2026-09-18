import {
  SER_V2_ADMIN_INFO,
  SER_V2_FIELD_LOCATIONS,
  SER_V2_FIELD_TYPES,
  SER_V2_OS_ORIGINS,
} from "@/shared/ser-v2-constants";
import { SYSTEM_ROLES_CATALOG_FIELD } from "@/shared/system-roles";
import type { TemplateField, TemplateSection } from "@/shared/survey-templates";

export { SER_V2_OPERATION_VERSION } from "@/shared/ser-v2-constants";

function notice(id: string, label: string, hint: string): TemplateField {
  return { id, type: "notice", label, hint };
}

function generalRoleSelect(id: string, label: string, hint?: string): TemplateField {
  return {
    id,
    type: "system-roles-multi",
    label,
    hint,
    catalogFieldId: SYSTEM_ROLES_CATALOG_FIELD,
  };
}

function text(id: string, label: string, hint?: string): TemplateField {
  return { id, type: "text", label, hint };
}

function choice(
  id: string,
  label: string,
  options: string[],
  extras?: { showWhen?: TemplateField["showWhen"] },
): TemplateField {
  return { id, type: "choice", label, options, showWhen: extras?.showWhen };
}

function checklist(
  id: string,
  label: string,
  options: readonly string[],
  extras?: { allowOther?: boolean; allowAddOptions?: boolean; hint?: string; addLabel?: string },
): TemplateField {
  return {
    id,
    type: "checklist",
    label,
    options: [...options],
    allowOther: extras?.allowOther,
    allowAddOptions: extras?.allowAddOptions,
    hint: extras?.hint,
    addLabel: extras?.addLabel,
  };
}

function opSection(id: string, navLabel: string, title: string, fields: TemplateField[]): TemplateSection {
  return {
    id: `op.SER.v2.${id}`,
    title,
    group: "operation",
    navLabel,
    reviewable: true,
    fields,
  };
}

export function buildSerV2Sections(): TemplateSection[] {
  return [
    opSection("b0", "0. Catálogos", "0. Catálogos de operación", [
      {
        id: "op.SER.v2.cat.clientCatalogs",
        type: "client-catalogs-v2",
        label: "¿Qué catálogos necesitará la operación del cliente?",
        hint: "Agregue catálogos y subniveles según aplique. Puede anidar tantos niveles como necesite el negocio.",
      },
    ]),
    opSection("b1", "1. Creación OS", "1. Creación de la orden de servicio", [
      notice(
        "op.SER.v2.create.rules",
        "Reglas base",
        "Toda OS representa un servicio autorizado. Heredará automáticamente la información aplicable de su origen (cliente, contacto, servicios, alcance, importes, condiciones y documentos). Crear una OS no significa que el trabajo esté pagado, programado o listo para ejecutarse.",
      ),
      checklist("op.SER.v2.create.origins", "¿Desde dónde podrá generarse una OS?", SER_V2_OS_ORIGINS, {
        allowAddOptions: true,
        addLabel: "Agregar origen",
      }),
      generalRoleSelect(
        "op.SER.v2.create.creator",
        "¿Quién podrá crearla?",
        "Seleccione uno o más roles definidos en Datos generales.",
      ),
      text("op.SER.v2.create.auth", "¿Qué debe cumplirse para considerar autorizado el servicio?"),
      choice("op.SER.v2.create.multi", "¿Una OS podrá contener varios servicios?", ["Sí", "No", "Por definir"]),
      choice(
        "op.SER.v2.create.multiMode",
        "¿Cómo se dará seguimiento a esos servicios?",
        [
          "Todos comparten responsable, estatus y terminación",
          "Cada servicio puede tener responsables, estatus y terminación independientes",
          "Otra forma",
          "Por definir",
        ],
        { showWhen: { fieldId: "op.SER.v2.create.multi", equals: "Sí" } },
      ),
      {
        ...text("op.SER.v2.create.multiModeOther", "Explique la otra forma de seguimiento"),
        showWhen: { fieldId: "op.SER.v2.create.multiMode", equals: "Otra forma" },
      },
    ]),
    opSection("b2", "2. Acciones OS", "2. Acciones de la OS", [
      {
        id: "op.SER.v2.acciones",
        type: "os-actions-v2",
        label: "¿Qué acciones necesita la orden?",
        hint: "Seleccione las acciones, asigne roles y agregue notas opcionales. Entrega permanece incluida.",
        catalogFieldId: SYSTEM_ROLES_CATALOG_FIELD,
      },
    ]),
    opSection("b3", "3. Estatus", "3. Estado de la orden, estatus del trabajo y entrega", [
      notice(
        "op.SER.v2.status.states",
        "Estado general de la OS",
        "En operación: la orden está activa. Terminada: cumplió las condiciones para finalizarla. Cancelada: se interrumpió definitivamente su atención y requiere motivo.",
      ),
      notice(
        "op.SER.v2.status.actionEffects",
        "Relación con las acciones",
        "Terminar trabajo concluye el trabajo o servicio. Cerrar marca la OS como Terminada. Cancelar orden marca la OS como Cancelada y solicita motivo. Reabrir devuelve la OS a En operación.",
      ),
      text(
        "op.SER.v2.status.closeConditions",
        "¿Qué debe cumplirse para cerrar la OS?",
        "Trabajos terminados, validación, entrega u otras condiciones. Corresponde a la acción Cerrar si está incluida.",
      ),
      {
        id: "op.SER.v2.status.workStatuses",
        type: "work-statuses-v2",
        label: "¿Qué estatus necesita manejar el trabajo?",
        hint: "Seleccione, modifique o amplíe los estatus sugeridos. Solo se incorporan al alcance los seleccionados.",
        catalogFieldId: SYSTEM_ROLES_CATALOG_FIELD,
      },
      notice(
        "op.SER.v2.status.delivery",
        "Control fijo de entrega",
        "Entregado: la acción Entrega marca el indicador y registra fecha y encargado. Si el equipo regresa, el encargado autorizado puede desmarcarlo. Reabrir no cambia automáticamente este indicador. Una OS cancelada también puede registrar devolución mediante Entrega.",
      ),
    ]),
    opSection("b4", "4. Módulos", "4. Conexión con otros módulos", [
      {
        id: "op.SER.v2.modules.links",
        type: "module-links-v2",
        label: "¿Qué funciones estarán disponibles desde la OS?",
        catalogFieldId: SYSTEM_ROLES_CATALOG_FIELD,
      },
      text("op.SER.v2.modules.other", "¿Se necesita alguna otra conexión?"),
      checklist("op.SER.v2.modules.admin", "¿Qué información administrativa debe mostrarse en la OS?", SER_V2_ADMIN_INFO, {
        allowOther: true,
      }),
    ]),
    opSection("b5", "5. Reglas", "5. Reglas especiales", [
      {
        id: "op.SER.v2.rules",
        type: "special-rules-v2",
        label: "¿Existe alguna condición especial que el sistema deba exigir, permitir o impedir?",
        catalogFieldId: SYSTEM_ROLES_CATALOG_FIELD,
      },
    ]),
    opSection("b6", "6. Consultas", "6. Consultas y resultados", [
      text("op.SER.v2.cat.listInfo", "¿Qué información debe mostrar la lista de órdenes?"),
      text(
        "op.SER.v2.cat.searchInfo",
        "¿Con qué filtros y datos deben poder buscarse?",
        "Estado de la OS, estatus del trabajo, responsable, entregado o pendiente de entrega, situación administrativa…",
      ),
      {
        id: "op.SER.v2.cat.reports",
        type: "report-outputs-v2",
        label: "¿Qué salidas necesita generar el sistema?",
        catalogFieldId: SYSTEM_ROLES_CATALOG_FIELD,
      },
    ]),
    opSection("b7", "7. Campos extra", "7. Campos adicionales — opcional", [
      {
        id: "op.SER.v2.extra",
        type: "extra-fields-v2",
        label: "Campos adicionales",
        options: [...SER_V2_FIELD_TYPES],
        items: SER_V2_FIELD_LOCATIONS.map((location) => ({ id: location, text: location })),
      },
    ]),
  ];
}
