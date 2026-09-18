import { SER_V2_OPERATION_VERSION } from "@/shared/ser-v2-constants";
import { SYSTEM_ROLES_CATALOG_FIELD } from "@/shared/system-roles";
import { buildSerV2Sections } from "@/shared/survey-templates-ser-v2";
import {
  SURVEY_OPERATION_LABELS,
  TEMPLATE_VERSION,
  type SurveyOperationType,
} from "@/shared/surveys";

export type FieldType =
  | "text"
  | "flow"
  | "role-map"
  | "choice"
  | "checklist"
  | "tools"
  | "table"
  | "guide"
  | "applicability"
  | "notice"
  | "assignee-catalog"
  | "assignee-select"
  | "os-actions-v2"
  | "work-statuses-v2"
  | "module-links-v2"
  | "special-rules-v2"
  | "client-catalogs-v2"
  | "report-outputs-v2"
  | "extra-fields-v2";

export type SuggestedRole = {
  label: string;
  hint?: string;
};

export type TemplateField = {
  id: string;
  type: FieldType;
  label: string;
  hint?: string;
  example?: string;
  options?: string[];
  roleOptions?: SuggestedRole[];
  frequentOptions?: string[];
  secondaryOptions?: string[];
  allowOther?: boolean;
  exclusiveValues?: string[];
  columns?: { id: string; label: string }[];
  addLabel?: string;
  items?: { id: string; group?: string; text: string }[];
  catalogFieldId?: string;
  showWhen?: { fieldId: string; equals?: string; includes?: string };
};

export type TemplateSection = {
  id: string;
  title: string;
  group: "header" | "transversal" | "operation" | "attachments" | "closure";
  navLabel: string;
  reviewable: boolean;
  applicabilityFieldId?: string;
  fields: TemplateField[];
};

export type SurveyTemplate = {
  version: string;
  transversalVersion: string;
  operationVersion: string;
  operationType: SurveyOperationType;
  sections: TemplateSection[];
};

function text(id: string, label: string, hint?: string, example?: string): TemplateField {
  return { id, type: "text", label, hint, example };
}

function flow(id: string, label: string, example?: string, hint?: string): TemplateField {
  return { id, type: "flow", label, example, hint };
}

function roleMap(
  id: string,
  label: string,
  roleOptions: SuggestedRole[],
  frequent: string[],
  secondary: string[],
  hint?: string,
): TemplateField {
  return {
    id,
    type: "role-map",
    label,
    hint,
    roleOptions,
    frequentOptions: frequent,
    secondaryOptions: secondary,
  };
}

function assigneeCatalog(id: string, label: string, roleOptions: SuggestedRole[], hint?: string): TemplateField {
  return { id, type: "assignee-catalog", label, hint, roleOptions };
}

function generalRoleSelect(id: string, label: string, hint?: string): TemplateField {
  return {
    id,
    type: "assignee-select",
    label,
    hint,
    catalogFieldId: SYSTEM_ROLES_CATALOG_FIELD,
  };
}

function choice(id: string, label: string, options: string[]): TemplateField {
  return { id, type: "choice", label, options };
}

function checklist(
  id: string,
  label: string,
  options: string[],
  extras?: { allowOther?: boolean; exclusiveValues?: string[]; hint?: string },
): TemplateField {
  return {
    id,
    type: "checklist",
    label,
    options,
    allowOther: extras?.allowOther,
    exclusiveValues: extras?.exclusiveValues,
    hint: extras?.hint,
  };
}

function tools(id: string, label: string, options: string[]): TemplateField {
  const hasSoftware = options.some((option) => /software/i.test(option));
  const merged = hasSoftware ? options : [...options, "Software"];
  return { id, type: "tools", label, options: merged };
}

function table(id: string, label: string, columns: { id: string; label: string }[], addLabel: string): TemplateField {
  return { id, type: "table", label, columns, addLabel };
}

function guide(id: string, items: { id: string; group?: string; text: string }[]): TemplateField {
  return { id, type: "guide", label: "Preguntas guía de apoyo", items };
}

function pendingable(fields: TemplateField[]): TemplateField[] {
  return fields;
}

const STAGE_COLUMNS = [
  { id: "stage", label: "Etapa / actividad" },
  { id: "how", label: "Cómo se realiza" },
  { id: "tool", label: "Herramienta / archivo" },
];

const EXEC_COLUMNS = [
  { id: "stage", label: "Etapa" },
  { id: "activity", label: "Actividad principal" },
  { id: "owner", label: "Responsable" },
  { id: "result", label: "Resultado / salida" },
];

const DEFAULT_TOOLS = [
  "WhatsApp",
  "Excel",
  "Correo",
  "Papel / formatos impresos",
  "Agenda / calendario",
  "Carpetas locales",
  "Drive / nube",
];

type GuideItem = { id: string; group?: string; text: string };

type TransversalArea = {
  id: string;
  title: string;
  trigger: string;
  flowExample: string;
  frequent: string[];
  secondary: string[];
  suggestedRoles: SuggestedRole[];
  tools: string[];
  guides: GuideItem[];
};

const TRANSVERSAL_AREAS: TransversalArea[] = [
  {
    id: "comercial",
    title: "Comercial",
    trigger: "¿Cómo inicia normalmente el proceso comercial?",
    flowExample: "Prospecto → Seguimiento → Cotización → Aceptación → Autorización para operación",
    frequent: [
      "Registro de prospectos",
      "Seguimiento comercial",
      "Cotización / propuesta",
      "Cierre / aceptación",
      "Pedido / inicio del servicio",
    ],
    secondary: [
      "Captación / generación de leads",
      "Calificación de prospectos",
      "Visitas comerciales",
      "Negociación",
      "Descuentos / autorizaciones",
      "Comisiones",
      "Contratos",
      "Licitaciones",
      "Renovaciones / ventas recurrentes",
    ],
    suggestedRoles: [
      { label: "Vendedor", hint: "Cotiza y da seguimiento comercial" },
      { label: "Gerente comercial", hint: "Aprueba condiciones, descuentos y cierre" },
      { label: "Atención a clientes", hint: "Recibe solicitudes y canaliza" },
    ],
    tools: ["WhatsApp", "Excel", "Correo", "Papel"],
    guides: [
      { id: "p1", group: "Prospectos", text: "¿Cómo registran actualmente a un prospecto?" },
      { id: "p2", group: "Prospectos", text: "¿Quién puede registrarlo?" },
      { id: "p3", group: "Prospectos", text: "¿Qué información necesitan inicialmente?" },
      { id: "p4", group: "Prospectos", text: "¿De dónde llegan normalmente?" },
      { id: "s1", group: "Seguimiento", text: "¿Cómo saben qué prospectos siguen pendientes?" },
      { id: "s2", group: "Seguimiento", text: "¿Quién es responsable de dar seguimiento?" },
      { id: "s3", group: "Seguimiento", text: "¿Cómo registran llamadas, mensajes o acuerdos?" },
      { id: "s4", group: "Seguimiento", text: "¿Cuándo consideran perdido un prospecto?" },
      { id: "c1", group: "Cotización", text: "¿Cómo elaboran actualmente una cotización?" },
      { id: "c2", group: "Cotización", text: "¿De dónde obtienen precios y condiciones?" },
      { id: "c3", group: "Cotización", text: "¿Quién puede modificar precios?" },
      { id: "c4", group: "Cotización", text: "¿Puede modificarse después de enviarla?" },
      { id: "k1", group: "Cierre", text: "¿Cómo saben que el cliente aceptó?" },
      { id: "k2", group: "Cierre", text: "¿Qué consideran autorización: mensaje, firma, anticipo, orden de compra, etc.?" },
      { id: "k3", group: "Cierre", text: "¿Qué sucede si solicita cambios?" },
      { id: "t1", group: "Transferencia a operación", text: "¿Qué evento autoriza que operación comience?" },
      { id: "t2", group: "Transferencia a operación", text: "¿Qué información debe recibir operación?" },
      { id: "t3", group: "Transferencia a operación", text: "¿Quién entrega esa información?" },
      { id: "t4", group: "Transferencia a operación", text: "¿Qué documento, pedido, orden o proyecto se genera?" },
    ],
  },
  {
    id: "clientes",
    title: "Clientes",
    trigger: "¿En qué momento se crea o registra un cliente?",
    flowExample: "Prospecto → Cliente → Registro de datos → Operaciones → Historial",
    frequent: [
      "Alta / registro de cliente",
      "Datos generales",
      "Consulta de información",
      "Actualización de datos",
      "Historial del cliente",
    ],
    secondary: [
      "Múltiples contactos",
      "Sucursales / direcciones",
      "Datos fiscales",
      "Condiciones comerciales",
      "Crédito / límite de crédito",
      "Contratos / convenios",
      "Clasificación / segmentación",
      "Documentos del cliente",
    ],
    suggestedRoles: [
      { label: "Atención / recepción", hint: "Primer contacto y registro inicial" },
      { label: "Coordinador de cuenta", hint: "Actualiza datos y da seguimiento" },
      { label: "Gerente", hint: "Autoriza condiciones especiales" },
    ],
    tools: ["WhatsApp", "Excel", "Correo", "Papel"],
    guides: [
      { id: "a1", group: "Alta e información", text: "¿Cuándo consideran formalmente que alguien ya es cliente?" },
      { id: "a2", group: "Alta e información", text: "¿Quién puede darlo de alta?" },
      { id: "a3", group: "Alta e información", text: "¿Qué información necesitan guardar?" },
      { id: "a4", group: "Alta e información", text: "¿Una empresa puede tener varios contactos o sucursales?" },
      { id: "a5", group: "Alta e información", text: "¿Manejan datos fiscales o condiciones especiales?" },
      { id: "h1", group: "Historial", text: "¿Pueden consultar su historial completo?" },
      { id: "h2", group: "Historial", text: "¿Qué operaciones necesitan relacionar con el cliente?" },
      { id: "h3", group: "Historial", text: "¿Quién consulta normalmente esa información?" },
      { id: "e1", group: "Casos especiales", text: "¿Qué ocurre si el cliente ya existe?" },
      { id: "e2", group: "Casos especiales", text: "¿Puede quedar inactivo?" },
      { id: "e3", group: "Casos especiales", text: "¿Maneja crédito, precios o condiciones particulares?" },
    ],
  },
  {
    id: "compras",
    title: "Compras",
    trigger: "¿Qué genera normalmente una compra?",
    flowExample: "Necesidad → Solicitud → Autorización → Compra → Recepción",
    frequent: [
      "Necesidad de compra",
      "Solicitud de compra",
      "Selección de proveedor",
      "Autorización",
      "Realización de compra",
      "Recepción",
    ],
    secondary: [
      "Comparación de proveedores",
      "Varias cotizaciones",
      "Anticipos",
      "Crédito con proveedores",
      "Compras urgentes",
      "Devoluciones",
      "Evaluación de proveedores",
    ],
    suggestedRoles: [
      { label: "Solicitante", hint: "Detecta o solicita la compra" },
      { label: "Comprador", hint: "Cotiza y gestiona con el proveedor" },
      { label: "Autorizador de compra", hint: "Aprueba la compra" },
      { label: "Recepción", hint: "Recibe y verifica mercancía" },
    ],
    tools: ["WhatsApp", "Excel", "Correo", "Papel"],
    guides: [
      { id: "p1", group: "Proceso", text: "¿Quién detecta o solicita una compra?" },
      { id: "p2", group: "Proceso", text: "¿Cómo se registra la necesidad?" },
      { id: "p3", group: "Proceso", text: "¿Quién selecciona al proveedor?" },
      { id: "p4", group: "Proceso", text: "¿Solicitan varias cotizaciones?" },
      { id: "p5", group: "Proceso", text: "¿Quién autoriza?" },
      { id: "p6", group: "Proceso", text: "¿Cómo se realiza el pedido?" },
      { id: "s1", group: "Seguimiento", text: "¿Cómo saben qué compras siguen pendientes?" },
      { id: "s2", group: "Seguimiento", text: "¿Quién recibe y verifica?" },
      { id: "s3", group: "Seguimiento", text: "¿Qué ocurre si llega incompleto o incorrecto?" },
      { id: "s4", group: "Seguimiento", text: "¿Cómo se relaciona con una operación, servicio o proyecto?" },
    ],
  },
  {
    id: "inventario",
    title: "Inventario",
    trigger: "¿Cómo entra normalmente un producto o material al inventario?",
    flowExample: "Recepción → Entrada → Existencia → Salida → Ajuste",
    frequent: [
      "Entrada de productos / materiales",
      "Salida",
      "Consulta de existencias",
      "Ajustes",
      "Reposición",
    ],
    secondary: [
      "Transferencias",
      "Reservas",
      "Ubicaciones",
      "Lotes",
      "Números de serie",
      "Caducidades",
      "Inventarios físicos",
      "Mínimos / máximos",
    ],
    suggestedRoles: [
      { label: "Almacenista", hint: "Entradas, salidas y existencias" },
      { label: "Supervisor de almacén", hint: "Autoriza movimientos y ajustes" },
      { label: "Conteo / ajustes", hint: "Realiza inventarios físicos" },
    ],
    tools: ["Excel", "Papel", "Código de barras", "Conteo manual"],
    guides: [
      { id: "c1", group: "Control", text: "¿Qué controlan en inventario?" },
      { id: "c2", group: "Control", text: "¿Cómo se registran entradas y salidas?" },
      { id: "c3", group: "Control", text: "¿Cómo conocen las existencias?" },
      { id: "c4", group: "Control", text: "¿Quién puede retirar material?" },
      { id: "r1", group: "Reposición y trazabilidad", text: "¿Cómo realizan ajustes?" },
      { id: "r2", group: "Reposición y trazabilidad", text: "¿Cómo saben que deben reponer?" },
      { id: "r3", group: "Reposición y trazabilidad", text: "¿Necesitan saber dónde está físicamente cada producto?" },
      { id: "r4", group: "Reposición y trazabilidad", text: "¿Manejan lotes, series o caducidades?" },
      { id: "r5", group: "Reposición y trazabilidad", text: "¿Cómo se relaciona una salida con una operación?" },
    ],
  },
  {
    id: "facturacion",
    title: "Facturación",
    trigger: "¿Qué evento genera normalmente una factura?",
    flowExample: "Operación / Venta → Solicitud → Factura → Envío → Cobro",
    frequent: [
      "Solicitud / generación de factura",
      "Datos fiscales",
      "Relación factura con venta / servicio",
      "Envío de factura",
      "Registro de estatus",
    ],
    secondary: [
      "Facturación parcial",
      "Complementos de pago",
      "Notas de crédito",
      "Cancelaciones",
      "Refacturación",
      "Facturación anticipada",
    ],
    suggestedRoles: [
      { label: "Facturista", hint: "Genera facturas" },
      { label: "Cobranza", hint: "Da seguimiento a pagos" },
      { label: "Autorizador de crédito", hint: "Aprueba crédito o condiciones" },
    ],
    tools: ["Correo", "Excel", "Portal / PAC", "Contabilidad"],
    guides: [
      { id: "p1", group: "Proceso", text: "¿Cuándo se factura?" },
      { id: "p2", group: "Proceso", text: "¿Quién solicita y quién genera la factura?" },
      { id: "p3", group: "Proceso", text: "¿De dónde salen los datos?" },
      { id: "p4", group: "Proceso", text: "¿Cómo saben qué concepto y cantidad facturar?" },
      { id: "p5", group: "Proceso", text: "¿Cómo se relaciona con la operación realizada?" },
      { id: "e1", group: "Casos especiales", text: "¿Existen anticipos o facturas parciales?" },
      { id: "e2", group: "Casos especiales", text: "¿Cómo manejan cancelaciones, complementos o refacturación?" },
      { id: "e3", group: "Casos especiales", text: "¿Qué sistema utilizan actualmente para facturar?" },
    ],
  },
  {
    id: "finanzas",
    title: "Finanzas",
    trigger: "¿De dónde se obtiene actualmente la información financiera?",
    flowExample: "Venta / Servicio → Cuenta por cobrar → Pago → Ingreso → Banco → Control",
    frequent: [
      "Registro de ingresos",
      "Registro de egresos",
      "Cuentas por cobrar",
      "Cobranza / pagos recibidos",
      "Cuentas por pagar",
      "Control de saldos",
    ],
    secondary: [
      "Bancos",
      "Conciliación bancaria",
      "Flujo de efectivo",
      "Presupuestos",
      "Centros de costo",
      "Rentabilidad por operación / proyecto",
      "Proyecciones",
      "Financiamientos",
    ],
    suggestedRoles: [
      { label: "Tesorería", hint: "Registra movimientos y bancos" },
      { label: "Contabilidad", hint: "Control contable y reportes" },
      { label: "Autorizador de egresos", hint: "Aprueba pagos y gastos" },
    ],
    tools: ["Excel", "Bancos", "Papel", "Contabilidad externa"],
    guides: [
      { id: "i1", group: "Ingresos y egresos", text: "¿Cómo registran ingresos y gastos?" },
      { id: "i2", group: "Ingresos y egresos", text: "¿Cómo relacionan un pago con una venta o servicio?" },
      { id: "i3", group: "Ingresos y egresos", text: "¿Manejan pagos parciales?" },
      { id: "i4", group: "Ingresos y egresos", text: "¿Quién autoriza egresos?" },
      { id: "c1", group: "Cuentas pendientes", text: "¿Cómo saben quién les debe?" },
      { id: "c2", group: "Cuentas pendientes", text: "¿Cómo controlan lo que deben?" },
      { id: "c3", group: "Cuentas pendientes", text: "¿Quién realiza cobranza?" },
      { id: "f1", group: "Control financiero", text: "¿Cómo controlan bancos?" },
      { id: "f2", group: "Control financiero", text: "¿Realizan conciliación?" },
      { id: "f3", group: "Control financiero", text: "¿Pueden consultar su flujo disponible?" },
      { id: "f4", group: "Control financiero", text: "¿Pueden conocer la rentabilidad de una venta, servicio o proyecto?" },
      { id: "f5", group: "Control financiero", text: "¿Qué información financiera necesita dirección?" },
    ],
  },
  {
    id: "documentos",
    title: "Documentos y administración",
    trigger: "¿Dónde se generan y guardan actualmente los documentos?",
    flowExample: "Generación → Envío → Archivo → Consulta",
    frequent: [
      "Generación de documentos",
      "Almacenamiento",
      "Consulta",
      "Archivos / evidencias",
      "Relación con cliente / operación",
    ],
    secondary: ["Firmas", "Control de versiones", "Autorizaciones", "Expedientes", "Vigencias", "Documentos legales"],
    suggestedRoles: [
      { label: "Capturista / archivo", hint: "Genera y archiva documentos" },
      { label: "Revisor", hint: "Revisa antes de enviar o firmar" },
      { label: "Autorizador / firmante", hint: "Firma o autoriza documentos" },
    ],
    tools: ["WhatsApp", "Correo", "Carpetas locales", "Nube / Drive", "Papel"],
    guides: [
      { id: "d1", group: "Documentos", text: "¿Qué documentos generan?" },
      { id: "d2", group: "Documentos", text: "¿Quién los crea?" },
      { id: "d3", group: "Documentos", text: "¿Dónde se guardan?" },
      { id: "d4", group: "Documentos", text: "¿Cómo los encuentran después?" },
      { id: "d5", group: "Documentos", text: "¿Con qué cliente, venta u operación deben relacionarse?" },
      { id: "c1", group: "Control", text: "¿Existen documentos que requieren firma o autorización?" },
      { id: "c2", group: "Control", text: "¿Necesitan controlar versiones o vigencias?" },
      { id: "c3", group: "Control", text: "¿Quién puede consultar cada documento?" },
    ],
  },
  {
    id: "personal",
    title: "Personal",
    trigger: "¿Cómo administran actualmente al personal?",
    flowExample: "Alta → Asistencia / Incidencias → Pago → Seguimiento → Baja",
    frequent: [
      "Alta de colaboradores",
      "Datos / expediente",
      "Asistencia",
      "Incidencias",
      "Vacaciones / ausencias",
      "Nómina / pagos",
    ],
    secondary: [
      "Reclutamiento",
      "Capacitación",
      "Evaluación",
      "Productividad",
      "Bonos",
      "Comisiones",
      "Bajas",
    ],
    suggestedRoles: [
      { label: "RH / nómina", hint: "Altas, incidencias y pagos" },
      { label: "Jefe inmediato", hint: "Supervisa al personal" },
      { label: "Dirección", hint: "Aprueba cambios relevantes" },
    ],
    tools: ["Excel", "Papel", "Reloj checador", "WhatsApp"],
    guides: [
      { id: "a1", group: "Administración", text: "¿Qué información guardan de cada colaborador?" },
      { id: "a2", group: "Administración", text: "¿Cómo controlan asistencia e incidencias?" },
      { id: "a3", group: "Administración", text: "¿Cómo manejan vacaciones?" },
      { id: "a4", group: "Administración", text: "¿Cómo calculan pagos?" },
      { id: "d1", group: "Desempeño y cambios", text: "¿Manejan bonos o comisiones?" },
      { id: "d2", group: "Desempeño y cambios", text: "¿Necesitan medir productividad?" },
      { id: "d3", group: "Desempeño y cambios", text: "¿Dónde se guarda el expediente?" },
      { id: "d4", group: "Desempeño y cambios", text: "¿Qué ocurre cuando una persona deja la empresa?" },
    ],
  },
  {
    id: "direccion",
    title: "Dirección y control",
    trigger: "¿Cómo obtiene dirección actualmente la información para tomar decisiones?",
    flowExample: "Áreas → Información → Consolidación → Reporte → Dirección → Decisión",
    frequent: [
      "Indicadores principales",
      "Reportes",
      "Seguimiento comercial",
      "Seguimiento financiero",
      "Control de pendientes",
    ],
    secondary: [
      "Metas",
      "Productividad",
      "Comparativos",
      "Proyecciones",
      "Alertas automáticas",
      "Rentabilidad por área / proyecto",
    ],
    suggestedRoles: [
      { label: "Dueño / director", hint: "Toma decisiones estratégicas" },
      { label: "Control interno", hint: "Revisa cumplimiento" },
      { label: "Quien prepara reportes", hint: "Consolida información" },
    ],
    tools: ["Excel", "WhatsApp", "Correo", "Reportes manuales"],
    guides: [
      { id: "i1", group: "Información", text: "¿Qué necesita saber normalmente el dueño o director?" },
      { id: "i2", group: "Información", text: "¿Qué consulta diariamente?" },
      { id: "i3", group: "Información", text: "¿Qué revisa semanal o mensualmente?" },
      { id: "i4", group: "Información", text: "¿De dónde obtiene actualmente esa información?" },
      { id: "n1", group: "Indicadores y control", text: "¿Cuáles son los números más importantes del negocio?" },
      { id: "n2", group: "Indicadores y control", text: "¿Qué indicadores comerciales y financieros utiliza?" },
      { id: "n3", group: "Indicadores y control", text: "¿Cómo sabe qué problemas requieren su atención?" },
      { id: "n4", group: "Indicadores y control", text: "¿Qué situaciones quisiera conocer inmediatamente?" },
      { id: "r1", group: "Reportes", text: "¿Qué reportes reciben actualmente?" },
      { id: "r2", group: "Reportes", text: "¿Quién los prepara?" },
      { id: "r3", group: "Reportes", text: "¿Cuánto trabajo requiere prepararlos?" },
      { id: "r4", group: "Reportes", text: "¿Hay información que hoy no pueden obtener fácilmente?" },
    ],
  },
];

function collectSystemRoleSuggestions(): SuggestedRole[] {
  const seen = new Set<string>();
  const roles: SuggestedRole[] = [];
  for (const area of TRANSVERSAL_AREAS) {
    for (const role of area.suggestedRoles) {
      const key = role.label.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      roles.push(role);
    }
  }
  return roles;
}

function transversalSection(area: TransversalArea): TemplateSection {
  const p = `tx.${area.id}`;
  return {
    id: `tx.${area.id}`,
    title: area.title,
    group: "transversal",
    navLabel: area.title,
    reviewable: true,
    applicabilityFieldId: `${p}.applicability`,
    fields: pendingable([
      { id: `${p}.applicability`, type: "applicability", label: "Aplicabilidad" },
      generalRoleSelect(
        `${p}.role`,
        "Rol general en esta área",
        "Seleccione uno de los roles generales definidos en Datos generales.",
      ),
      checklist(`${p}.frequent`, "Procesos frecuentes", area.frequent, { allowOther: true }),
      checklist(`${p}.secondary`, "Procesos según aplique", area.secondary, { allowOther: true }),
      text(`${p}.trigger`, area.trigger),
      flow(
        `${p}.flow`,
        "Cómo ocurre hoy en esta área",
        area.flowExample,
        "Describa el flujo actual y cómo se realiza.",
      ),
      tools(`${p}.tools`, "Herramientas utilizadas", area.tools),
      text(`${p}.problems`, "Problemas o necesidades detectadas"),
      text(`${p}.expected`, "Resultado esperado por el cliente"),
      text(`${p}.rules`, "Reglas, autorizaciones y excepciones"),
      text(`${p}.notes`, "Notas y asuntos por confirmar"),
      guide(`${p}.guide`, area.guides),
    ]),
  };
}

type OperationSpec = {
  type: SurveyOperationType;
  processTitle: string;
  frequent: string[];
  secondary: string[];
  flowExample: string;
  startEvent: string;
  receives: string;
  finishedWhen: string;
  howTools: string[];
  recaptureExample: string;
  extraAfterHow?: TemplateSection[];
  extraAfterExec?: TemplateSection[];
  extraBeforeGuide?: TemplateSection[];
  prepTitle: string;
  prepReady: string[];
  prepVerify: string;
  prepMissing: string;
  peopleFields: TemplateField[];
  execExample: string;
  sequenceLabel: string;
  parallelLabel: string;
  decisionHint: string;
  delays: string[];
  followTitle: string;
  followHow: string;
  statuses: string[];
  whoNeeds: string[];
  commitmentLabel: string;
  detectLabel: string;
  extraFollowFields?: TemplateField[];
  changeTitle: string;
  changeWhat: string[];
  changeModify: string[];
  economicTitle: string;
  economicCondition: string[];
  amountChange: string[];
  consult: string[];
  extraEconomic?: TemplateField[];
  evidenceWhat: string[];
  evidenceWhere: string[];
  relatedLabel: string;
  extraEvidence?: TemplateField[];
  validateTitle: string;
  validateFields: TemplateField[];
  closeReady: string[];
  adminInfo: string[];
  extraClose?: TemplateField[];
  afterClose?: TemplateSection[];
  guides: GuideItem[];
};

function opSection(
  type: SurveyOperationType,
  id: string,
  title: string,
  fields: TemplateField[],
  extras?: { applicabilityFieldId?: string },
): TemplateSection {
  return {
    id: `op.${type}.${id}`,
    title,
    group: "operation",
    navLabel: title,
    reviewable: true,
    applicabilityFieldId: extras?.applicabilityFieldId,
    fields: pendingable(fields),
  };
}

function buildOperationSections(spec: OperationSpec): TemplateSection[] {
  const t = spec.type;
  const p = `op.${t}`;
  const sections: TemplateSection[] = [
    opSection(t, "procesos", spec.processTitle, [
      checklist(`${p}.procesos.frequent`, "Procesos frecuentes", spec.frequent, { allowOther: true }),
      checklist(`${p}.procesos.secondary`, "Según aplique", spec.secondary, { allowOther: true }),
    ]),
    opSection(t, "flujo", "Flujo de la operación", [
      text(
        `${p}.flujo.real`,
        "Secuencia actual de la operación",
        "Ordene las etapas principales como las realiza hoy el cliente.",
        spec.flowExample,
      ),
      text(`${p}.flujo.start`, spec.startEvent),
      text(`${p}.flujo.receives`, spec.receives),
      text(`${p}.flujo.finished`, spec.finishedWhen),
    ]),
    opSection(t, "como", "Cómo se realiza actualmente", [
      table(`${p}.como.stages`, "Etapa / actividad, cómo se realiza y herramienta", STAGE_COLUMNS, "Agregar etapa"),
      tools(`${p}.como.tools`, "Herramientas utilizadas", spec.howTools),
      choice(`${p}.como.recapture`, "¿La información se captura más de una vez?", ["Sí", "No"]),
      text(`${p}.como.recaptureWhere`, "¿Dónde?"),
      choice(`${p}.como.manual`, "¿La información pasa manualmente de una herramienta a otra?", ["Sí", "No"]),
      text(`${p}.como.manualHow`, "¿Cómo ocurre actualmente?", undefined, spec.recaptureExample),
      text(`${p}.como.problems`, "Problemas o necesidades detectadas"),
      text(`${p}.como.expected`, "Resultado esperado por el cliente"),
    ]),
    ...(spec.extraAfterHow ?? []),
    opSection(t, "prep", spec.prepTitle, [
      checklist(`${p}.prep.ready`, "¿Qué debe estar listo?", spec.prepReady, { allowOther: true }),
      text(`${p}.prep.verify`, spec.prepVerify),
      text(`${p}.prep.missing`, spec.prepMissing),
    ]),
    opSection(t, "responsables", "Responsables y asignación", spec.peopleFields),
    opSection(t, "ejecucion", "Ejecución", [
      table(`${p}.ejecucion.stages`, "Etapas principales", EXEC_COLUMNS, "Agregar etapa"),
      text(`${p}.ejecucion.example`, "Ejemplo de secuencia", undefined, spec.execExample),
      choice(`${p}.ejecucion.sequence`, spec.sequenceLabel, ["Sí", "No", "Depende"]),
      text(`${p}.ejecucion.parallel`, spec.parallelLabel),
      text(`${p}.ejecucion.decisions`, "Puntos de decisión importantes", spec.decisionHint),
      choice(`${p}.ejecucion.controls`, "¿Existen controles intermedios antes de continuar?", ["Sí", "No"]),
      text(`${p}.ejecucion.controlsWhich`, "¿Cuáles?"),
      checklist(`${p}.ejecucion.delays`, "¿Qué suele detener o retrasar?", spec.delays, { allowOther: true }),
    ]),
    ...(spec.extraAfterExec ?? []),
    opSection(t, "seguimiento", spec.followTitle, [
      text(`${p}.seg.how`, spec.followHow),
      checklist(`${p}.seg.statuses`, "Estados utilizados", spec.statuses, { allowOther: true }),
      text(`${p}.seg.whoUpdates`, "¿Quién actualiza el avance?"),
      checklist(`${p}.seg.whoNeeds`, "¿Quién necesita consultar el estado?", spec.whoNeeds, { allowOther: true }),
      choice(`${p}.seg.commitment`, spec.commitmentLabel, ["Sí", "No"]),
      text(`${p}.seg.detect`, spec.detectLabel),
      ...(spec.extraFollowFields ?? []),
    ]),
    opSection(t, "cambios", spec.changeTitle, [
      checklist(`${p}.cambios.what`, "¿Qué puede desviar el proceso de lo normal?", spec.changeWhat, { allowOther: true }),
      text(`${p}.cambios.who`, "¿Quién decide qué hacer?"),
      checklist(`${p}.cambios.modify`, "¿Un cambio puede modificar?", spec.changeModify, { allowOther: true }),
      text(`${p}.cambios.inform`, "¿Cómo se informa y autoriza con el cliente?"),
    ]),
    opSection(t, "economico", spec.economicTitle, [
      checklist(`${p}.eco.condition`, "¿El dinero condiciona alguna etapa?", spec.economicCondition, {
        allowOther: true,
        exclusiveValues: ["No", "No condiciona"],
      }),
      checklist(`${p}.eco.amount`, "¿El importe puede cambiar?", spec.amountChange, {
        allowOther: true,
        exclusiveValues: ["No"],
      }),
      checklist(`${p}.eco.consult`, "Durante la operación necesitan consultar", spec.consult, {
        exclusiveValues: ["Ninguno"],
      }),
      text(`${p}.eco.where`, "¿Dónde se registran actualmente los pagos?"),
      ...(spec.extraEconomic ?? []),
    ]),
    ...(spec.extraBeforeGuide ?? []),
    opSection(t, "evidencias", "Registros y evidencias", [
      checklist(`${p}.evi.what`, "¿Qué debe quedar documentado?", spec.evidenceWhat, { allowOther: true }),
      checklist(`${p}.evi.where`, "¿Dónde se guarda actualmente?", spec.evidenceWhere, { allowOther: true }),
      choice(`${p}.evi.related`, spec.relatedLabel, ["Sí", "No"]),
      ...(spec.extraEvidence ?? []),
    ]),
    opSection(t, "validacion", spec.validateTitle, spec.validateFields),
    opSection(t, "cierre", "Cierre y salida a administración", [
      checklist(`${p}.cierre.ready`, "¿Qué debe cumplirse para cerrar?", spec.closeReady, { allowOther: true }),
      checklist(`${p}.cierre.admin`, "¿Qué información necesita Administración / Facturación / Finanzas?", spec.adminInfo, {
        allowOther: true,
      }),
      choice(`${p}.cierre.recapture`, "¿Actualmente se vuelve a capturar información?", ["Sí", "No"]),
      text(`${p}.cierre.recaptureWhere`, "¿Dónde?"),
      ...(spec.extraClose ?? []),
    ]),
    ...(spec.afterClose ?? []),
    opSection(t, "guia", "Preguntas guía", [guide(`${p}.guia`, spec.guides)]),
    opSection(t, "notas", "Notas", [
      text(`${p}.notas.text`, "Notas de la operación"),
      text(`${p}.notas.problems`, "Problemas o necesidades de la operación"),
      text(`${p}.notas.expected`, "Resultado esperado de la operación"),
    ]),
  ];
  return sections.filter((section, index, all) => all.findIndex((item) => item.id === section.id) === index);
}

function headerSection(): TemplateSection {
  return {
    id: "header",
    title: "Datos generales",
    group: "header",
    navLabel: "Datos generales",
    reviewable: true,
    fields: [
      text("header.intervieweeName", "Persona entrevistada"),
      text("header.intervieweeRole", "Puesto"),
      assigneeCatalog(
        SYSTEM_ROLES_CATALOG_FIELD,
        "Roles generales de todo el sistema",
        collectSystemRoleSuggestions(),
        "Defina los roles que intervienen en la operación del cliente. En cada área transversal se seleccionará uno de estos roles.",
      ),
      text("header.activity", "Actividad, producto o servicio principal del cliente"),
      text("header.objective", "Objetivo general del cliente"),
      text("header.notes", "Notas generales"),
    ],
  };
}

function attachmentsSection(): TemplateSection {
  return {
    id: "attachments",
    title: "Adjuntos",
    group: "attachments",
    navLabel: "Adjuntos",
    reviewable: true,
    fields: [text("attachments.notes", "Notas sobre evidencias o ejemplos adjuntos")],
  };
}

function closureSection(): TemplateSection {
  return {
    id: "closure",
    title: "Cierre",
    group: "closure",
    navLabel: "Cierre",
    reviewable: true,
    fields: [
      text("closure.priorities", "Prioridades expresadas por el cliente"),
      text("closure.agreements", "Acuerdos"),
      text("closure.pending", "Pendientes de cierre"),
      text("closure.notes", "Notas de cierre"),
    ],
  };
}

const SER: OperationSpec = {
  type: "SER",
  processTitle: "Procesos del servicio",
  frequent: [
    "Recepción / inicio del servicio",
    "Orden / registro del servicio",
    "Preparación",
    "Asignación",
    "Ejecución",
    "Seguimiento",
    "Validación",
    "Entrega / cierre",
  ],
  secondary: [
    "Diagnóstico",
    "Visita / levantamiento",
    "Programación / agenda",
    "Materiales / refacciones",
    "Compras relacionadas",
    "Subcontratación",
    "Evidencias / checklist",
    "Cambios de alcance",
    "Pagos / anticipos",
    "Garantía / reingreso",
    "Servicio recurrente",
  ],
  flowExample: "Autorización → Orden → Preparación → Asignación → Ejecución → Validación → Entrega → Cierre",
  startEvent: "¿Qué evento inicia formalmente el servicio?",
  receives: "¿Qué recibe operación para poder comenzar?",
  finishedWhen: "¿Cuándo se considera terminado?",
  howTools: DEFAULT_TOOLS,
  recaptureExample: "Excel → WhatsApp → Software → Facturación",
  prepTitle: "Preparación",
  prepReady: [
    "Información / alcance",
    "Fecha / programación",
    "Materiales / refacciones",
    "Permisos / accesos",
    "Personal",
    "Herramientas / equipo",
    "Documentación técnica",
    "Anticipo / autorización",
  ],
  prepVerify: "¿Quién verifica que todo esté listo?",
  prepMissing: "¿Qué sucede si falta algo?",
  peopleFields: [
    text("op.SER.resp.assigner", "¿Quién asigna el trabajo?"),
    checklist(
      "op.SER.resp.how",
      "¿Cómo recibe cada persona su asignación?",
      ["Verbal", "WhatsApp", "Agenda", "Excel", "Orden de servicio"],
      { allowOther: true },
    ),
    text("op.SER.resp.coord", "¿Cómo se coordinan cuando intervienen varias personas o áreas?"),
  ],
  execExample: "Diagnóstico → Reparación → Pruebas → Liberación",
  sequenceLabel: "¿Existe una secuencia obligatoria?",
  parallelLabel: "¿Existen etapas que puedan realizarse en paralelo?",
  decisionHint: "Ejemplo: ¿es reparable?, ¿requiere autorización?, ¿se puede continuar?",
  delays: [
    "Falta de información",
    "Espera del cliente",
    "Problema técnico adicional",
    "Herramienta / equipo",
    "Material / refacción",
    "Espera de autorización",
    "Personal no disponible",
    "Servicio externo",
  ],
  followTitle: "Seguimiento y control",
  followHow: "¿Cómo saben en qué etapa está cada servicio?",
  statuses: ["Pendiente", "Programado", "En proceso", "En espera", "Detenido", "Terminado", "Entregado"],
  whoNeeds: ["Operación", "Ventas", "Administración", "Dirección", "Cliente"],
  commitmentLabel: "¿Manejan fechas compromiso?",
  detectLabel: "¿Cómo detectan retrasos o trabajos detenidos?",
  changeTitle: "Cambios y excepciones",
  changeWhat: [
    "Cliente cambia lo solicitado",
    "Falta de material",
    "Servicio detenido",
    "Reproceso",
    "Trabajo adicional",
    "Falta de información",
    "Cambio de responsable",
    "Autorización adicional",
  ],
  changeModify: ["Alcance", "Precio", "Tiempo", "Materiales", "Fecha de entrega"],
  economicTitle: "Condiciones económicas",
  economicCondition: [
    "No",
    "Anticipo para iniciar",
    "Pago parcial durante el servicio",
    "Pago para continuar",
    "Liquidación antes de entregar",
    "Crédito",
    "Autorización económica de adicionales",
  ],
  amountChange: ["No", "Por materiales / refacciones", "Por tiempo", "Por trabajo adicional", "Por cambio de alcance"],
  consult: ["Total", "Anticipo", "Pagos realizados", "Saldo pendiente", "Ninguno"],
  evidenceWhat: [
    "Actividades realizadas",
    "Fotografías",
    "Videos",
    "Reporte",
    "Checklist",
    "Mediciones / resultados",
    "Materiales utilizados",
    "Tiempo trabajado",
    "Firma / aceptación",
  ],
  evidenceWhere: ["WhatsApp", "Correo", "Papel", "Carpetas", "Drive / nube"],
  relatedLabel: "¿Debe quedar relacionado con la orden o servicio?",
  validateTitle: "Validación y entrega",
  validateFields: [
    text("op.SER.val.how", "¿Cómo se determina que el servicio quedó correctamente terminado?"),
    checklist(
      "op.SER.val.who",
      "¿Quién realiza la validación final?",
      ["Quien realizó el servicio", "Supervisor", "Responsable técnico", "Cliente"],
      { allowOther: true },
    ),
    text("op.SER.val.tests", "¿Existen pruebas o condiciones obligatorias?"),
    text("op.SER.val.deliver", "¿Cómo se entrega o confirma al cliente?"),
    choice("op.SER.val.accept", "¿El cliente debe aceptar formalmente?", ["Sí", "No"]),
  ],
  closeReady: [
    "Trabajo terminado",
    "Validación concluida",
    "Evidencias completas",
    "Adicionales autorizados",
    "Cliente informado / aceptó",
    "Condición económica cumplida",
  ],
  adminInfo: [
    "Servicio realizado",
    "Fecha de terminación",
    "Importe final",
    "Anticipos / pagos",
    "Saldo pendiente",
    "Trabajos adicionales",
    "Materiales / gastos",
    "Información para facturar",
    "Información para cobrar",
  ],
  afterClose: [
    opSection("SER", "garantia", "Garantía / recurrencia", [
      choice("op.SER.gar.has", "¿Existe garantía?", ["Sí", "No"]),
      text("op.SER.gar.return", "¿Qué sucede si el cliente regresa por el mismo problema?"),
      choice("op.SER.gar.newOrder", "¿Se genera una nueva orden?", ["Sí", "No", "Depende"]),
      choice("op.SER.gar.recurrent", "¿Existen servicios recurrentes?", ["Sí", "No"]),
      text("op.SER.gar.next", "¿Cómo se genera o programa el siguiente servicio?"),
    ]),
  ],
  guides: [
    { id: "i1", group: "Inicio", text: "¿Qué recibe operación para comenzar?" },
    { id: "i2", group: "Inicio", text: "¿Qué evento autoriza el servicio?" },
    { id: "i3", group: "Inicio", text: "¿Qué debe estar listo?" },
    { id: "h1", group: "Cómo se hace hoy", text: "¿En qué archivo o software vive cada parte?" },
    { id: "h2", group: "Cómo se hace hoy", text: "¿Qué información se captura más de una vez?" },
    { id: "h3", group: "Cómo se hace hoy", text: "¿Qué información pasa manualmente entre herramientas?" },
    { id: "e1", group: "Ejecución", text: "¿Cuáles son las etapas principales?" },
    { id: "e2", group: "Ejecución", text: "¿Quién realiza cada etapa?" },
    { id: "e3", group: "Ejecución", text: "¿Qué resultado produce cada una?" },
    { id: "e4", group: "Ejecución", text: "¿Dónde se toman decisiones?" },
    { id: "e5", group: "Ejecución", text: "¿Qué puede detener el trabajo?" },
    { id: "s1", group: "Seguimiento", text: "¿Cómo saben dónde está cada servicio?" },
    { id: "s2", group: "Seguimiento", text: "¿Quién actualiza el avance?" },
    { id: "s3", group: "Seguimiento", text: "¿Cómo detectan retrasos?" },
    { id: "x1", group: "Excepciones", text: "¿Qué hace que el flujo normal cambie?" },
    { id: "x2", group: "Excepciones", text: "¿Quién autoriza esos cambios?" },
    { id: "x3", group: "Excepciones", text: "¿Pueden modificar precio, tiempo o alcance?" },
    { id: "d1", group: "Dinero", text: "¿Existe alguna condición de pago para iniciar, continuar o entregar?" },
    { id: "d2", group: "Dinero", text: "¿Necesitan consultar pagos o saldo desde el servicio?" },
    { id: "c1", group: "Cierre", text: "¿Cómo saben que quedó bien?" },
    { id: "c2", group: "Cierre", text: "¿Quién valida?" },
    { id: "c3", group: "Cierre", text: "¿Cómo se entrega?" },
    { id: "c4", group: "Cierre", text: "¿Qué información necesita administración?" },
  ],
};

const DIS: OperationSpec = {
  type: "DIS",
  processTitle: "Procesos de la operación",
  frequent: [
    "Recepción del pedido",
    "Validación del pedido",
    "Consulta de disponibilidad",
    "Preparación / surtido",
    "Entrega",
    "Confirmación de entrega",
    "Cierre del pedido",
  ],
  secondary: [
    "Reserva de producto",
    "Crédito",
    "Compra bajo pedido",
    "Empaque",
    "Envío / paquetería",
    "Instalación",
    "Entrega parcial",
    "Sustitución de producto",
    "Devoluciones",
    "Cambios",
    "Garantías",
    "Pedidos recurrentes",
  ],
  flowExample: "Pedido → Validación → Existencia → Surtido → Entrega → Confirmación → Cierre",
  startEvent: "¿Qué evento inicia formalmente la operación?",
  receives: "¿Qué información recibe operación para comenzar?",
  finishedWhen: "¿Cuándo se considera terminado un pedido?",
  howTools: DEFAULT_TOOLS,
  recaptureExample: "WhatsApp → Excel → Sistema → Facturación",
  prepTitle: "Preparación del pedido",
  prepReady: [
    "Pedido confirmado",
    "Productos definidos",
    "Precios autorizados",
    "Condición de pago / crédito",
    "Transporte / envío",
    "Datos del cliente",
    "Cantidades",
    "Existencia disponible",
    "Dirección de entrega",
    "Documentación",
  ],
  prepVerify: "¿Quién verifica que el pedido pueda procesarse?",
  prepMissing: "¿Qué sucede si falta producto, información o autorización?",
  peopleFields: [
    text("op.DIS.resp.receives", "¿Quién recibe el pedido?"),
    text("op.DIS.resp.authorizes", "¿Quién autoriza que se procese?"),
    text("op.DIS.resp.picks", "¿Quién realiza el surtido?"),
    text("op.DIS.resp.delivery", "¿Quién coordina la entrega?"),
    checklist(
      "op.DIS.resp.how",
      "¿Cómo recibe cada persona sus pendientes?",
      ["Verbal", "WhatsApp", "Correo", "Excel", "Pedido impreso"],
      { allowOther: true },
    ),
    text("op.DIS.resp.coord", "¿Cómo se coordinan ventas, almacén y entrega?"),
  ],
  execExample: "Validación → Reserva → Surtido → Empaque → Envío → Entrega",
  sequenceLabel: "¿Existe una secuencia obligatoria?",
  parallelLabel: "¿Existen etapas que puedan realizarse en paralelo?",
  decisionHint: "Ejemplos: ¿hay existencia?, ¿se puede surtir parcialmente?, ¿se puede sustituir producto?",
  delays: [
    "Falta de existencia",
    "Falta de autorización",
    "Pago pendiente",
    "Transporte no disponible",
    "Espera de proveedor",
    "Crédito bloqueado",
    "Error en pedido",
    "Dirección / datos incorrectos",
  ],
  followTitle: "Seguimiento y control",
  followHow: "¿Cómo saben en qué etapa está cada pedido?",
  statuses: [
    "Recibido",
    "Confirmado",
    "Pendiente de producto",
    "En preparación",
    "Listo para entrega",
    "Enviado",
    "Entregado",
    "Cerrado",
    "Cancelado",
  ],
  whoNeeds: ["Ventas", "Almacén", "Administración", "Dirección", "Cliente"],
  commitmentLabel: "¿Manejan fecha compromiso de entrega?",
  detectLabel: "¿Cómo detectan pedidos retrasados o pendientes?",
  changeTitle: "Cambios y excepciones",
  changeWhat: [
    "No hay existencia",
    "Pedido incompleto",
    "Cliente cambia cantidades",
    "Cliente cambia productos",
    "Sustitución de producto",
    "Entrega parcial",
    "Cancelación",
    "Producto dañado",
    "Error de surtido",
    "Cambio de dirección",
  ],
  changeModify: ["Productos", "Cantidades", "Precio", "Fecha de entrega", "Condición de pago", "Transporte"],
  economicTitle: "Condiciones económicas",
  economicCondition: [
    "No",
    "Pago anticipado",
    "Anticipo",
    "Crédito autorizado",
    "Límite de crédito",
    "Pago contra entrega",
    "Liquidación antes del envío",
  ],
  amountChange: [
    "No",
    "Por cambio de cantidad",
    "Por sustitución de producto",
    "Por envío / flete",
    "Por descuentos",
    "Por productos adicionales",
  ],
  consult: ["Total del pedido", "Pago recibido", "Crédito disponible", "Saldo pendiente", "Ninguno"],
  extraBeforeGuide: [
    opSection("DIS", "inventario", "Inventario y disponibilidad", [
      text("op.DIS.inv.how", "¿Cómo saben si un producto está disponible?"),
      choice("op.DIS.inv.realtime", "¿La existencia se actualiza en tiempo real?", ["Sí", "No"]),
      choice("op.DIS.inv.reserve", "¿Se reserva producto para un pedido?", ["Sí", "No"]),
      choice("op.DIS.inv.future", "¿Puede venderse producto que todavía no está disponible?", ["Sí", "No"]),
      checklist(
        "op.DIS.inv.missing",
        "¿Qué sucede cuando no hay suficiente existencia?",
        ["Compra a proveedor", "Pedido pendiente", "Entrega parcial", "Sustitución", "Cancelación"],
        { allowOther: true },
      ),
      choice("op.DIS.inv.related", "¿El pedido debe quedar relacionado con los movimientos de inventario?", ["Sí", "No"]),
    ]),
  ],
  evidenceWhat: [
    "Pedido original",
    "Productos solicitados",
    "Productos surtidos",
    "Cantidades",
    "Cambios realizados",
    "Empaque",
    "Guía / envío",
    "Evidencia de entrega",
    "Firma del cliente",
    "Incidencias",
  ],
  evidenceWhere: ["WhatsApp", "Correo", "Papel", "Carpetas", "Drive / nube"],
  relatedLabel: "¿Debe quedar relacionado con cada pedido?",
  validateTitle: "Validación y entrega",
  validateFields: [
    text("op.DIS.val.how", "¿Cómo verifican que el pedido preparado corresponde a lo solicitado?"),
    checklist("op.DIS.val.who", "¿Quién realiza la validación antes de entregar?", ["Quien surtió", "Almacén", "Supervisor", "Ventas"], {
      allowOther: true,
    }),
    checklist("op.DIS.val.howDeliver", "¿Cómo se entrega?", ["Cliente recoge", "Reparto propio", "Paquetería", "Transporte externo"], {
      allowOther: true,
    }),
    checklist("op.DIS.val.confirm", "¿Cómo se confirma que el cliente recibió?", ["Firma", "Fotografía", "Acuse", "Guía de paquetería", "WhatsApp / correo"], {
      allowOther: true,
    }),
  ],
  closeReady: [
    "Pedido surtido",
    "Entrega realizada",
    "Evidencia de entrega",
    "Cambios registrados",
    "Cliente confirmó recepción",
    "Condición económica cumplida",
  ],
  adminInfo: [
    "Pedido entregado",
    "Productos finales",
    "Cantidades finales",
    "Importe final",
    "Descuentos",
    "Envío / flete",
    "Pagos recibidos",
    "Saldo pendiente",
    "Información para facturar",
    "Información para cobrar",
  ],
  afterClose: [
    opSection("DIS", "devoluciones", "Devoluciones / garantía / recurrencia", [
      choice("op.DIS.dev.has", "¿Manejan devoluciones?", ["Sí", "No"]),
      text("op.DIS.dev.how", "¿Qué sucede cuando un cliente devuelve un producto?"),
      choice("op.DIS.dev.warranty", "¿Manejan garantías?", ["Sí", "No"]),
      text("op.DIS.dev.warrantyRel", "¿Cómo se relaciona una garantía con la venta original?"),
      choice("op.DIS.dev.recurrent", "¿Existen pedidos recurrentes?", ["Sí", "No"]),
      text("op.DIS.dev.recurrentHow", "¿Cómo se generan?"),
    ]),
  ],
  guides: [
    { id: "i1", group: "Inicio", text: "¿Qué recibe operación cuando se confirma una venta?" },
    { id: "i2", group: "Inicio", text: "¿Qué hace que un pedido pueda comenzar a procesarse?" },
    { id: "i3", group: "Inicio", text: "¿Qué debe estar listo?" },
    { id: "e1", group: "Ejecución", text: "¿Cómo validan disponibilidad?" },
    { id: "e2", group: "Ejecución", text: "¿Cómo se prepara y surte?" },
    { id: "e3", group: "Ejecución", text: "¿Quién participa en cada etapa?" },
    { id: "e4", group: "Ejecución", text: "¿Dónde existen decisiones o autorizaciones?" },
    { id: "e5", group: "Ejecución", text: "¿Qué suele retrasar un pedido?" },
    { id: "s1", group: "Seguimiento", text: "¿Cómo saben dónde está cada pedido?" },
    { id: "s2", group: "Seguimiento", text: "¿Cómo detectan pendientes o retrasos?" },
    { id: "s3", group: "Seguimiento", text: "¿Quién necesita consultar el estatus?" },
    { id: "n1", group: "Inventario", text: "¿Cuándo se descuenta existencia?" },
    { id: "n2", group: "Inventario", text: "¿Se reserva producto?" },
    { id: "n3", group: "Inventario", text: "¿Qué ocurre si no hay suficiente?" },
    { id: "x1", group: "Excepciones", text: "¿Puede surtirse parcialmente?" },
    { id: "x2", group: "Excepciones", text: "¿Puede cambiarse un producto?" },
    { id: "x3", group: "Excepciones", text: "¿Cómo manejan cancelaciones y devoluciones?" },
    { id: "d1", group: "Dinero", text: "¿El pago o crédito condiciona surtido o entrega?" },
    { id: "d2", group: "Dinero", text: "¿Necesitan consultar saldo desde el pedido?" },
    { id: "c1", group: "Cierre", text: "¿Cómo validan que se surtió correctamente?" },
    { id: "c2", group: "Cierre", text: "¿Cómo confirman la entrega?" },
    { id: "c3", group: "Cierre", text: "¿Qué información necesita administración?" },
  ],
};

const MAN: OperationSpec = {
  type: "MAN",
  processTitle: "Procesos de la operación",
  frequent: [
    "Recepción de requerimiento / demanda",
    "Planeación de producción",
    "Orden de producción",
    "Preparación de materiales",
    "Ejecución / transformación",
    "Seguimiento de producción",
    "Control de calidad",
    "Producto terminado",
    "Liberación",
  ],
  secondary: [
    "Pronóstico de producción",
    "Producción contra inventario",
    "Fórmulas / recetas",
    "Setup / preparación de máquina",
    "Subprocesos externos",
    "Producción por lotes",
    "Números de serie",
    "Merma / scrap",
    "Reproceso",
    "Trazabilidad",
    "Mantenimiento relacionado",
  ],
  flowExample: "Pedido / Demanda → Planeación → Orden de producción → Materiales → Producción → Calidad → Producto terminado → Liberación",
  startEvent: "¿Qué evento genera la necesidad de producir?",
  receives: "¿Qué recibe producción para poder comenzar?",
  finishedWhen: "¿Cuándo se considera terminada una orden de producción?",
  howTools: ["WhatsApp", "Pizarrón", "Excel", "Carpetas locales", "Correo", "Drive / nube", "Papel / formatos impresos"],
  recaptureExample: "Excel → Orden impresa → Formato de producción → Sistema",
  extraAfterHow: [
    opSection("MAN", "planeacion", "Planeación y preparación", [
      checklist(
        "op.MAN.plan.how",
        "¿Cómo determinan qué producir?",
        ["Pedido del cliente", "Inventario mínimo", "Pronóstico", "Programa de producción", "Solicitud interna"],
        { allowOther: true },
      ),
      checklist(
        "op.MAN.plan.ready",
        "¿Qué debe estar listo antes de comenzar?",
        [
          "Orden de producción",
          "Materia prima",
          "Personal",
          "Máquina / equipo",
          "Herramental",
          "Instrucciones / plano",
          "Fórmula / receta",
          "Parámetros de proceso",
          "Fecha / programa",
          "Autorizaciones",
        ],
        { allowOther: true },
      ),
      text("op.MAN.plan.verify", "¿Quién verifica que la producción pueda comenzar?"),
      text("op.MAN.plan.missing", "¿Qué sucede si falta material, personal, máquina o información?"),
    ]),
  ],
  prepTitle: "Preparación",
  prepReady: ["Orden de producción", "Materia prima", "Personal", "Máquina / equipo"],
  prepVerify: "¿Quién verifica que la producción pueda comenzar?",
  prepMissing: "¿Qué sucede si falta material, personal, máquina o información?",
  peopleFields: [
    text("op.MAN.resp.release", "¿Quién genera o libera la orden de producción?"),
    text("op.MAN.resp.schedule", "¿Quién programa la producción?"),
    text("op.MAN.resp.assign", "¿Quién asigna máquinas, líneas u operadores?"),
    checklist(
      "op.MAN.resp.how",
      "¿Cómo recibe cada persona lo que debe producir?",
      ["Verbal", "Pizarrón", "Orden impresa", "Excel", "Programa de producción"],
      { allowOther: true },
    ),
    text("op.MAN.resp.coord", "¿Cómo se coordinan producción, almacén y calidad?"),
  ],
  execExample: "Corte → Maquinado → Ensamble → Acabado → Inspección → Liberación",
  sequenceLabel: "¿Existe una secuencia obligatoria?",
  parallelLabel: "¿Existen procesos que puedan realizarse en paralelo?",
  decisionHint: "Ejemplos: ¿cumple especificación?, ¿requiere reproceso?, ¿se debe detener la producción?",
  delays: [
    "Falta de materia prima",
    "Máquina detenida",
    "Falta de operador",
    "Falta de herramienta",
    "Problema de calidad",
    "Espera de autorización",
    "Servicio externo",
    "Cambio de prioridad",
  ],
  extraAfterExec: [
    opSection("MAN", "materiales", "Materiales y consumos", [
      text("op.MAN.mat.request", "¿Cómo se solicitan los materiales para producción?"),
      text("op.MAN.mat.actual", "¿Cómo se registra lo que realmente se consumió?"),
      choice("op.MAN.mat.related", "¿El consumo queda relacionado con la orden de producción?", ["Sí", "No"]),
      checklist(
        "op.MAN.mat.kinds",
        "¿Manejan?",
        ["Materia prima", "Componentes", "Consumibles", "Producto intermedio", "Subproductos", "Merma / scrap"],
        { allowOther: true },
      ),
      text("op.MAN.mat.leftover", "¿Qué sucede con material sobrante?"),
    ]),
  ],
  followTitle: "Seguimiento y control",
  followHow: "¿Cómo saben en qué etapa está cada orden de producción?",
  statuses: [
    "Pendiente",
    "Programada",
    "Preparación",
    "En producción",
    "Detenida",
    "En calidad",
    "Reproceso",
    "Terminada",
    "Liberada",
  ],
  whoNeeds: ["Producción", "Almacén", "Calidad", "Dirección"],
  commitmentLabel: "¿Manejan fecha compromiso?",
  detectLabel: "¿Cómo detectan atrasos o desviaciones?",
  extraFollowFields: [
    checklist(
      "op.MAN.seg.know",
      "¿Qué necesitan conocer durante la producción?",
      [
        "Cantidad programada",
        "Cantidad producida",
        "Cantidad pendiente",
        "Tiempo utilizado",
        "Material consumido",
        "Merma",
        "Estatus de calidad",
        "Fecha compromiso",
      ],
      { allowOther: true },
    ),
  ],
  changeTitle: "Cambios y excepciones",
  changeWhat: [
    "Falta de material",
    "Falla de máquina",
    "Producto fuera de especificación",
    "Cambio de prioridad",
    "Cambio de pedido",
    "Falta de personal",
    "Reproceso",
    "Producción parcial",
    "Servicio externo",
  ],
  changeModify: ["Cantidad", "Material", "Proceso", "Tiempo", "Fecha de entrega", "Costo"],
  economicTitle: "Costos de producción",
  economicCondition: ["No", "Anticipo", "Pago para continuar"],
  amountChange: ["No", "Por merma", "Por reproceso", "Por material adicional"],
  consult: [
    "Costo de materia prima",
    "Mano de obra",
    "Tiempo máquina",
    "Servicios externos",
    "Consumibles",
    "Merma / scrap",
    "Costo total de la orden",
    "Ninguno",
  ],
  extraEconomic: [
    choice("op.MAN.eco.real", "¿Actualmente calculan el costo real de producción?", ["Sí", "No", "Parcialmente"]),
    text("op.MAN.eco.how", "¿Cómo lo calculan?"),
    choice("op.MAN.eco.compare", "¿El costo real se compara contra el costo esperado?", ["Sí", "No"]),
  ],
  extraBeforeGuide: [
    opSection("MAN", "calidad", "Calidad y validación", [
      text("op.MAN.cal.how", "¿Qué determina que el producto cumple correctamente?"),
      checklist("op.MAN.cal.when", "¿En qué momento se revisa calidad?", ["Durante el proceso", "Al terminar una etapa", "Al finalizar producción", "Muestreo"], {
        allowOther: true,
      }),
      checklist("op.MAN.cal.who", "¿Quién valida?", ["Operador", "Supervisor", "Calidad", "Laboratorio", "Cliente"], { allowOther: true }),
      checklist("op.MAN.cal.fail", "¿Qué sucede si el producto no cumple?", ["Reproceso", "Ajuste", "Scrap", "Liberación condicionada", "Revisión adicional"], {
        allowOther: true,
      }),
      text("op.MAN.cal.evidence", "¿Qué evidencia queda de la validación?"),
    ]),
    opSection("MAN", "pt", "Producto terminado y liberación", [
      checklist(
        "op.MAN.pt.ready",
        "¿Qué debe cumplirse para considerar terminado el producto?",
        ["Cantidad producida", "Calidad aprobada", "Documentación completa", "Empaque terminado", "Identificación / etiqueta", "Costos registrados"],
        { allowOther: true },
      ),
      text("op.MAN.pt.who", "¿Quién libera el producto terminado?"),
      checklist("op.MAN.pt.next", "¿A dónde pasa después?", ["Almacén de producto terminado", "Embarque", "Cliente", "Otra etapa"], { allowOther: true }),
    ]),
  ],
  evidenceWhat: [
    "Orden de producción",
    "Cantidad producida",
    "Material consumido",
    "Operadores",
    "Máquinas utilizadas",
    "Tiempo trabajado",
    "Parámetros del proceso",
    "Mediciones",
    "Merma / scrap",
    "Incidencias",
  ],
  evidenceWhere: ["Papel", "Excel", "Carpetas", "Drive / nube"],
  relatedLabel: "¿Debe quedar relacionado con cada orden de producción?",
  validateTitle: "Validación",
  validateFields: [text("op.MAN.val.notes", "Notas de validación de la orden")],
  closeReady: [
    "Producción terminada",
    "Calidad liberada",
    "Material consumido registrado",
    "Merma registrada",
    "Cantidades finales registradas",
    "Costos registrados",
  ],
  adminInfo: [
    "Cantidad producida",
    "Cantidad entregable",
    "Fecha de terminación",
    "Costo real",
    "Material utilizado",
    "Merma",
    "Pedido relacionado",
    "Información para facturar",
  ],
  afterClose: [
    opSection("MAN", "reproceso", "Reproceso / no conformidad / devoluciones", [
      choice("op.MAN.rep.has", "¿Manejan reproceso?", ["Sí", "No"]),
      text("op.MAN.rep.how", "¿Cómo se controla?"),
      choice("op.MAN.rep.nc", "¿Manejan producto no conforme?", ["Sí", "No"]),
      text("op.MAN.rep.ncHow", "¿Cómo se identifica y registra?"),
      choice("op.MAN.rep.returns", "¿Las devoluciones del cliente regresan al proceso productivo?", ["Sí", "No", "Depende"]),
      text("op.MAN.rep.rel", "¿Cómo se relacionan con la producción original?"),
    ]),
  ],
  guides: [
    { id: "i1", group: "Inicio", text: "¿Qué genera la necesidad de producir?" },
    { id: "i2", group: "Inicio", text: "¿Cómo saben qué, cuánto y cuándo producir?" },
    { id: "i3", group: "Inicio", text: "¿Qué debe estar disponible para iniciar?" },
    { id: "p1", group: "Producción", text: "¿En qué etapas se transforma el producto?" },
    { id: "p2", group: "Producción", text: "¿Qué entra y qué sale de cada etapa?" },
    { id: "p3", group: "Producción", text: "¿Quién interviene?" },
    { id: "p4", group: "Producción", text: "¿Qué debe suceder antes de pasar a la siguiente etapa?" },
    { id: "p5", group: "Producción", text: "¿Qué suele detener la producción?" },
    { id: "m1", group: "Materiales", text: "¿Cómo saben qué material necesita una orden?" },
    { id: "m2", group: "Materiales", text: "¿Cómo registran el consumo real?" },
    { id: "m3", group: "Materiales", text: "¿Qué sucede con sobrantes y merma?" },
    { id: "s1", group: "Seguimiento", text: "¿Cómo saben cuánto se ha producido?" },
    { id: "s2", group: "Seguimiento", text: "¿Cómo conocen lo pendiente?" },
    { id: "s3", group: "Seguimiento", text: "¿Cómo detectan atrasos o paros?" },
    { id: "q1", group: "Calidad", text: "¿Dónde existen puntos de inspección?" },
    { id: "q2", group: "Calidad", text: "¿Qué determina que el producto cumple?" },
    { id: "q3", group: "Calidad", text: "¿Qué ocurre cuando no cumple?" },
    { id: "c1", group: "Costos", text: "¿Pueden conocer cuánto costó realmente producir?" },
    { id: "c2", group: "Costos", text: "¿Qué elementos del costo necesitan controlar?" },
    { id: "k1", group: "Cierre", text: "¿Cómo se libera una orden?" },
    { id: "k2", group: "Cierre", text: "¿Qué ocurre con el producto terminado?" },
    { id: "k3", group: "Cierre", text: "¿Qué información necesita administración al terminar?" },
  ],
};

const PRY: OperationSpec = {
  type: "PRY",
  processTitle: "Procesos de la operación",
  frequent: [
    "Alta / inicio del proyecto",
    "Definición de alcance",
    "Planeación",
    "Asignación de responsables",
    "Ejecución",
    "Seguimiento / avance",
    "Entregables",
    "Validación / aceptación",
    "Cierre",
  ],
  secondary: [
    "Levantamiento",
    "Presupuesto detallado",
    "Hitos",
    "Subcontratistas",
    "Compras específicas",
    "Estimaciones",
    "Aprobaciones intermedias",
    "Cambios de alcance",
    "Órdenes de cambio",
    "Retenciones",
    "Garantía / soporte",
    "Fases posteriores",
  ],
  flowExample: "Autorización → Alta del proyecto → Alcance → Planeación → Ejecución → Entregables → Aceptación → Cierre",
  startEvent: "¿Qué evento inicia formalmente un proyecto?",
  receives: "¿Qué recibe operación para poder comenzar?",
  finishedWhen: "¿Cuándo se considera terminado un proyecto?",
  howTools: ["WhatsApp", "Excel", "Correo", "Papel / formatos", "Agenda / calendario", "Drive / nube", "Software de proyectos"],
  recaptureExample: "Cotización → Excel → WhatsApp → Software de proyecto → Facturación",
  extraAfterHow: [
    opSection("PRY", "definicion", "Definición y preparación del proyecto", [
      checklist(
        "op.PRY.def.ready",
        "¿Qué debe estar definido antes de comenzar?",
        ["Cliente", "Alcance", "Entregables", "Presupuesto", "Fechas", "Responsable", "Equipo de trabajo", "Recursos", "Materiales", "Documentación técnica", "Anticipo / autorización"],
        { allowOther: true },
      ),
      choice("op.PRY.def.scope", "¿El alcance queda documentado?", ["Sí", "No", "Parcialmente"]),
      text("op.PRY.def.verify", "¿Quién valida que el proyecto pueda comenzar?"),
      text("op.PRY.def.missing", "¿Qué sucede si falta información o definición?"),
    ]),
  ],
  prepTitle: "Preparación",
  prepReady: ["Alcance", "Equipo de trabajo", "Presupuesto", "Fechas"],
  prepVerify: "¿Quién valida que el proyecto pueda comenzar?",
  prepMissing: "¿Qué sucede si falta información o definición?",
  peopleFields: [
    checklist("op.PRY.resp.split", "¿Cómo se divide normalmente el proyecto?", ["Etapas", "Hitos", "Actividades", "Tareas", "Entregables"], {
      allowOther: true,
    }),
    text("op.PRY.resp.planner", "¿Quién realiza la planeación?"),
    text("op.PRY.resp.lead", "¿Quién dirige o es responsable del proyecto?"),
    checklist("op.PRY.resp.how", "¿Cómo se asigna el trabajo?", ["Verbal", "WhatsApp", "Excel", "Cronograma"], { allowOther: true }),
    choice("op.PRY.resp.several", "¿Puede haber varios responsables?", ["Sí", "No"]),
    text("op.PRY.resp.coord", "¿Cómo se coordinan?"),
  ],
  execExample: "Diseño → Desarrollo → Revisión → Correcciones → Entrega → Aceptación",
  sequenceLabel: "¿Existe una secuencia obligatoria?",
  parallelLabel: "¿Existen actividades que puedan realizarse en paralelo?",
  decisionHint: "Ejemplos: aprobación del cliente, liberación de etapa, cambio técnico, continuar o detener.",
  delays: [
    "Información del cliente",
    "Autorizaciones",
    "Cambios de alcance",
    "Falta de personal",
    "Materiales / recursos",
    "Proveedor externo",
    "Dependencia de otra actividad",
    "Problema técnico",
  ],
  followTitle: "Seguimiento y control",
  followHow: "¿Cómo saben actualmente en qué estado está cada proyecto?",
  statuses: ["Pendiente", "Planeación", "En ejecución", "En espera", "Bloqueado", "En revisión", "Terminado", "Cerrado"],
  whoNeeds: ["Responsable del proyecto", "Equipo", "Ventas", "Administración", "Dirección", "Cliente"],
  commitmentLabel: "¿Manejan fecha compromiso?",
  detectLabel: "¿Cómo detectan atrasos o bloqueos?",
  extraFollowFields: [
    checklist("op.PRY.seg.measure", "¿Cómo miden el avance?", ["Porcentaje general", "Etapas terminadas", "Hitos", "Tareas terminadas", "Entregables", "Horas utilizadas"], {
      allowOther: true,
    }),
  ],
  changeTitle: "Cambios de alcance y excepciones",
  changeWhat: [
    "Solicitud del cliente",
    "Problema técnico",
    "Información nueva",
    "Trabajo no contemplado",
    "Cambio de fecha",
    "Cambio de especificación",
  ],
  changeModify: ["Alcance", "Precio", "Tiempo", "Entregables", "Recursos", "Fecha final"],
  extraEconomic: [text("op.PRY.eco.extraAuth", "¿Cómo se autorizan económicamente los trabajos adicionales?")],
  economicTitle: "Condiciones económicas del proyecto",
  economicCondition: ["Inicio", "Continuación", "Entrega de hito", "Entrega final", "Cierre", "No condiciona"],
  amountChange: ["No", "Por cambio de alcance", "Por trabajo adicional", "Por tiempo"],
  consult: ["Importe contratado", "Anticipos", "Pagos recibidos", "Saldo", "Trabajo adicional", "Costos", "Rentabilidad", "Ninguno"],
  extraBeforeGuide: [
    opSection("PRY", "recursos", "Recursos y costos", [
      checklist(
        "op.PRY.rec.kinds",
        "¿Qué recursos puede consumir el proyecto?",
        ["Horas de personal", "Materiales", "Compras", "Viáticos", "Equipo / maquinaria", "Subcontratistas", "Servicios externos"],
        { allowOther: true },
      ),
      choice("op.PRY.rec.related", "¿Los recursos utilizados se relacionan con el proyecto?", ["Sí", "No", "Parcialmente"]),
      choice("op.PRY.rec.real", "¿Pueden conocer actualmente el costo real del proyecto?", ["Sí", "No", "Parcialmente"]),
      choice("op.PRY.rec.profit", "¿Necesitan conocer rentabilidad por proyecto?", ["Sí", "No"]),
    ]),
  ],
  evidenceWhat: [
    "Alcance",
    "Planeación",
    "Actividades realizadas",
    "Avances",
    "Fotografías",
    "Documentos",
    "Minutas",
    "Horas trabajadas",
    "Material utilizado",
    "Cambios de alcance",
    "Autorizaciones",
    "Entregables",
  ],
  evidenceWhere: ["WhatsApp", "Correo", "Papel", "Carpetas locales", "Drive / nube"],
  relatedLabel: "¿Debe quedar relacionado con el proyecto?",
  validateTitle: "Entregables y validación",
  validateFields: [
    text("op.PRY.val.what", "¿Qué entrega finalmente el proyecto?"),
    choice("op.PRY.val.partial", "¿Existen entregables parciales?", ["Sí", "No"]),
    text("op.PRY.val.internal", "¿Quién valida internamente cada entregable?"),
    choice("op.PRY.val.client", "¿El cliente debe aprobar?", ["Sí", "No", "Solo algunos entregables"]),
    checklist("op.PRY.val.accept", "¿Cómo queda documentada la aceptación?", ["Firma", "Correo", "WhatsApp", "Acta / formato", "Software"], {
      allowOther: true,
    }),
    text("op.PRY.val.reject", "¿Qué sucede si el cliente no acepta?"),
  ],
  closeReady: [
    "Alcance completado",
    "Entregables terminados",
    "Aprobación interna",
    "Aceptación del cliente",
    "Evidencias completas",
    "Cambios registrados",
    "Costos registrados",
    "Condición económica cumplida",
  ],
  adminInfo: [
    "Proyecto terminado",
    "Avance facturable",
    "Hitos terminados",
    "Importe final",
    "Pagos recibidos",
    "Saldo",
    "Trabajos adicionales",
    "Costos reales",
    "Información para facturar",
  ],
  afterClose: [
    opSection("PRY", "garantia", "Garantía / soporte / fases posteriores", [
      choice("op.PRY.gar.has", "¿Existe garantía o periodo de soporte?", ["Sí", "No"]),
      text("op.PRY.gar.how", "¿Cómo se controla?"),
      choice("op.PRY.gar.phases", "¿El proyecto puede continuar en nuevas fases?", ["Sí", "No"]),
      text("op.PRY.gar.newPhase", "¿Cómo se genera una nueva fase?"),
      choice("op.PRY.gar.recurrent", "¿Existen servicios posteriores recurrentes?", ["Sí", "No"]),
      text("op.PRY.gar.which", "¿Cuáles?"),
    ]),
  ],
  guides: [
    { id: "i1", group: "Inicio", text: "¿Qué convierte una venta en un proyecto?" },
    { id: "i2", group: "Inicio", text: "¿Qué debe estar completamente definido antes de comenzar?" },
    { id: "i3", group: "Inicio", text: "¿Cómo documentan el alcance?" },
    { id: "p1", group: "Planeación", text: "¿Cómo dividen el proyecto?" },
    { id: "p2", group: "Planeación", text: "¿Qué fechas, responsables y dependencias existen?" },
    { id: "p3", group: "Planeación", text: "¿Quién controla la planeación?" },
    { id: "e1", group: "Ejecución", text: "¿Cuáles son las etapas o hitos principales?" },
    { id: "e2", group: "Ejecución", text: "¿Qué produce cada etapa?" },
    { id: "e3", group: "Ejecución", text: "¿Quién es responsable?" },
    { id: "e4", group: "Ejecución", text: "¿Qué depende de qué?" },
    { id: "e5", group: "Ejecución", text: "¿Qué suele bloquear el proyecto?" },
    { id: "s1", group: "Seguimiento", text: "¿Cómo conocen el avance real?" },
    { id: "s2", group: "Seguimiento", text: "¿Cómo saben que está atrasado?" },
    { id: "s3", group: "Seguimiento", text: "¿Qué necesita ver dirección?" },
    { id: "x1", group: "Cambios", text: "¿Qué pasa cuando el cliente pide algo no contemplado?" },
    { id: "d1", group: "Dinero", text: "¿Cómo se relacionan pagos con avances o hitos?" },
    { id: "v1", group: "Entregables", text: "¿Qué recibe exactamente el cliente?" },
    { id: "c1", group: "Cierre", text: "¿Qué condiciones deben cumplirse para cerrar?" },
  ],
};

const CIT: OperationSpec = {
  type: "CIT",
  processTitle: "Procesos de la operación",
  frequent: [
    "Registro del cliente / paciente",
    "Agenda",
    "Programación de cita",
    "Confirmación",
    "Recepción",
    "Atención",
    "Registro de la atención",
    "Cobro",
    "Seguimiento",
  ],
  secondary: [
    "Historia clínica / expediente",
    "Diagnóstico",
    "Plan de tratamiento",
    "Estudios",
    "Prescripción",
    "Sesiones",
    "Paquetes",
    "Consentimientos",
    "Recordatorios",
    "Reprogramaciones",
    "Urgencias",
    "Referencias",
    "Seguimiento recurrente",
  ],
  flowExample: "Solicitud → Cita → Confirmación → Recepción → Atención → Registro → Cobro → Seguimiento",
  startEvent: "¿Qué evento inicia formalmente la atención?",
  receives: "¿Qué información debe existir antes de atender?",
  finishedWhen: "¿Cuándo se considera terminada una atención?",
  howTools: ["WhatsApp", "Excel", "Correo", "Agenda física", "Google Calendar", "Papel / formatos impresos", "Carpetas físicas", "Drive / nube"],
  recaptureExample: "WhatsApp → Agenda → Expediente → Excel → Facturación",
  extraAfterHow: [
    opSection("CIT", "agenda", "Agenda y programación", [
      checklist("op.CIT.ag.how", "¿Cómo se solicita una cita?", ["WhatsApp", "Teléfono", "Presencial", "Página web", "Redes sociales", "Aplicación"], {
        allowOther: true,
      }),
      text("op.CIT.ag.who", "¿Quién agenda?"),
      checklist("op.CIT.ag.info", "¿Qué información se solicita para generar la cita?", ["Nombre", "Teléfono", "Tipo de servicio", "Profesional", "Fecha", "Hora", "Duración", "Motivo"], {
        allowOther: true,
      }),
      text("op.CIT.ag.availability", "¿Cómo determinan disponibilidad?"),
      choice("op.CIT.ag.duration", "¿La duración cambia según el servicio?", ["Sí", "No"]),
      checklist("op.CIT.ag.several", "¿Pueden existir varias agendas?", ["Por profesional", "Por consultorio / espacio", "Por equipo", "Por sucursal", "No"], {
        exclusiveValues: ["No"],
      }),
      choice("op.CIT.ag.blocked", "¿Existen horarios bloqueados?", ["Sí", "No"]),
      text("op.CIT.ag.blockedWhy", "¿Por qué?"),
    ]),
    opSection("CIT", "confirmacion", "Confirmación / cancelación / reprogramación", [
      choice("op.CIT.conf.has", "¿Se confirma la cita antes de atender?", ["Sí", "No"]),
      checklist("op.CIT.conf.how", "¿Cómo se confirma?", ["WhatsApp", "Llamada", "SMS", "Correo", "Automáticamente"], { allowOther: true }),
      text("op.CIT.conf.when", "¿Con cuánto tiempo de anticipación?"),
      text("op.CIT.conf.cancel", "¿Qué sucede si el cliente cancela?"),
      choice("op.CIT.conf.reschedule", "¿Puede reprogramarse?", ["Sí", "No"]),
      checklist(
        "op.CIT.conf.noshow",
        "¿Cómo se controla una persona que no se presenta?",
        ["No se registra", "Se marca como no asistió", "Se intenta contactar", "Se cobra penalización"],
        { allowOther: true },
      ),
    ]),
    opSection("CIT", "recepcion", "Recepción e inicio de atención", [
      checklist(
        "op.CIT.rec.arrive",
        "¿Qué sucede cuando llega el cliente / paciente?",
        ["Se confirma llegada", "Se buscan datos", "Se abre expediente", "Se actualiza información", "Se solicita documentación", "Se registra pago / anticipo", "Se espera turno"],
        { allowOther: true },
      ),
      text("op.CIT.rec.who", "¿Quién realiza la recepción?"),
      text("op.CIT.rec.notify", "¿Cómo sabe el profesional que el paciente ya llegó?"),
      choice("op.CIT.rec.wait", "¿Manejan sala de espera o turnos?", ["Sí", "No"]),
      text("op.CIT.rec.order", "¿Cómo se controla el orden de atención?"),
    ]),
    opSection("CIT", "expediente", "Expediente / información del cliente", [
      choice("op.CIT.exp.has", "¿Existe expediente?", ["Sí", "No"]),
      checklist(
        "op.CIT.exp.contains",
        "¿Qué información contiene?",
        ["Datos generales", "Antecedentes", "Historial de visitas", "Diagnósticos", "Tratamientos", "Estudios", "Fotografías", "Documentos", "Consentimientos", "Recetas / indicaciones", "Pagos"],
        { allowOther: true },
      ),
      checklist("op.CIT.exp.where", "¿Dónde se guarda actualmente?", ["Papel", "Carpetas físicas", "Excel", "Drive / nube", "Software"], { allowOther: true }),
      text("op.CIT.exp.whoRead", "¿Quién puede consultar el expediente?"),
      text("op.CIT.exp.whoWrite", "¿Quién puede modificarlo?"),
    ]),
  ],
  prepTitle: "Preparación",
  prepReady: ["Datos del cliente", "Agenda confirmada", "Expediente disponible"],
  prepVerify: "¿Quién verifica que se puede atender?",
  prepMissing: "¿Qué sucede si falta información o el expediente?",
  peopleFields: [
    text("op.CIT.resp.who", "¿Quién realiza la atención?"),
    text("op.CIT.resp.coord", "¿Cómo se coordinan recepción y el profesional?"),
  ],
  execExample: "Valoración → Diagnóstico → Tratamiento → Indicaciones → Registro → Seguimiento",
  sequenceLabel: "¿Existe una secuencia obligatoria?",
  parallelLabel: "¿Existen etapas que puedan realizarse en paralelo?",
  decisionHint: "Ejemplos: solicitar estudio, cambiar tratamiento, programar nueva sesión, referir a otro profesional.",
  delays: ["Falta de información", "Falta de estudio", "Falta de autorización", "Falta de material", "Condición del paciente", "Falta de pago"],
  extraAfterExec: [
    opSection(
      "CIT",
      "diagnostico",
      "Diagnóstico / plan / tratamiento",
      [
        { id: "op.CIT.dx.applicability", type: "applicability", label: "¿Este apartado aplica? No todas las empresas con agenda son clínicas." },
        choice("op.CIT.dx.has", "¿Existe diagnóstico?", ["Sí", "No", "Depende del servicio"]),
        text("op.CIT.dx.how", "¿Cómo queda registrado?"),
        choice("op.CIT.dx.plan", "¿Puede generarse un plan de tratamiento?", ["Sí", "No"]),
        choice("op.CIT.dx.sessions", "¿El plan puede contener varias citas o sesiones?", ["Sí", "No"]),
        text("op.CIT.dx.progress", "¿Cómo se controla el avance del tratamiento?"),
        choice("op.CIT.dx.change", "¿Puede modificarse durante el proceso?", ["Sí", "No"]),
        text("op.CIT.dx.whoAuth", "¿Quién autoriza los cambios?"),
      ],
      { applicabilityFieldId: "op.CIT.dx.applicability" },
    ),
  ],
  followTitle: "Seguimiento y estatus",
  followHow: "¿Cómo saben actualmente en qué estado está cada atención?",
  statuses: ["Agendada", "Confirmada", "En espera", "En atención", "Terminada", "Cancelada", "Reprogramada", "No asistió", "Seguimiento pendiente"],
  whoNeeds: ["Recepción", "Profesional", "Administración", "Dirección", "Cliente / paciente"],
  commitmentLabel: "¿Manejan cita de seguimiento?",
  detectLabel: "¿Cómo detectan seguimientos pendientes?",
  changeTitle: "Cambios y excepciones",
  changeWhat: [
    "Llegada tarde",
    "Cancelación",
    "Reprogramación",
    "No-show",
    "Atención urgente",
    "Cambio de profesional",
    "Cambio de tratamiento",
    "Sesión adicional",
    "Complicación",
  ],
  changeModify: ["Fecha", "Duración", "Profesional", "Tratamiento", "Precio", "Número de sesiones"],
  economicTitle: "Condiciones económicas",
  economicCondition: ["La reserva de la cita", "El inicio de atención", "La continuación del tratamiento", "La entrega de resultados", "No condiciona"],
  amountChange: ["No", "Por sesión adicional", "Por cambio de tratamiento", "Por paquete"],
  consult: ["Precio", "Anticipo", "Pagos realizados", "Saldo", "Sesiones utilizadas", "Sesiones pendientes", "Ninguno"],
  extraEconomic: [
    checklist("op.CIT.eco.how", "¿Cómo se cobra normalmente?", ["Pago por consulta", "Pago por sesión", "Anticipo", "Pago total", "Paquete", "Mensualidad", "Crédito", "Seguro"], {
      allowOther: true,
    }),
  ],
  evidenceWhat: [
    "Fecha",
    "Profesional",
    "Motivo",
    "Diagnóstico",
    "Actividades realizadas",
    "Tratamiento",
    "Indicaciones",
    "Medicamentos",
    "Estudios",
    "Fotografías",
    "Próxima cita",
    "Firma / consentimiento",
  ],
  evidenceWhere: ["Papel", "Carpetas", "Excel", "Drive / nube", "Software"],
  relatedLabel: "¿Debe quedar relacionado con el expediente?",
  extraEvidence: [text("op.CIT.evi.who", "¿Quién realiza el registro?")],
  validateTitle: "Validación y cierre de la atención",
  validateFields: [
    text("op.CIT.val.how", "¿Cómo se determina que la atención quedó concluida?"),
    checklist("op.CIT.val.ready", "¿Qué debe cumplirse?", ["Atención realizada", "Registro completo", "Indicaciones entregadas", "Documentos completos", "Pago registrado", "Próxima cita definida"], {
      allowOther: true,
    }),
    text("op.CIT.val.who", "¿Quién realiza el cierre?"),
  ],
  closeReady: ["Atención realizada", "Registro completo", "Pago registrado"],
  adminInfo: [
    "Atención realizada",
    "Fecha",
    "Profesional",
    "Servicio realizado",
    "Importe",
    "Pagos",
    "Saldo",
    "Paquete / sesiones utilizadas",
    "Información para facturar",
    "Próxima cita",
  ],
  afterClose: [
    opSection("CIT", "seguimiento_post", "Seguimiento / próxima cita / recurrencia", [
      choice("op.CIT.post.need", "¿Requiere seguimiento?", ["Sí", "No", "Depende"]),
      text("op.CIT.post.when", "¿Cómo se determina cuándo regresar?"),
      choice("op.CIT.post.next", "¿La próxima cita se agenda al finalizar?", ["Sí", "No", "En algunos casos"]),
      choice("op.CIT.post.recurrent", "¿Existen servicios recurrentes?", ["Sí", "No"]),
      checklist("op.CIT.post.remind", "¿Cómo se generan recordatorios?", ["Manualmente", "WhatsApp", "Llamada", "Correo", "Software", "No se generan"], {
        exclusiveValues: ["No se generan"],
      }),
      text("op.CIT.post.lost", "¿Cómo detectan pacientes/clientes que deberían regresar y no lo hicieron?"),
    ]),
  ],
  guides: [
    { id: "a1", group: "Agenda", text: "¿Cómo llega una solicitud de cita?" },
    { id: "a2", group: "Agenda", text: "¿Cómo saben qué horarios están disponibles?" },
    { id: "r1", group: "Recepción", text: "¿Qué ocurre cuando llega la persona?" },
    { id: "e1", group: "Expediente", text: "¿Qué información necesitan conservar históricamente?" },
    { id: "t1", group: "Atención", text: "¿Cuáles son las etapas normales?" },
    { id: "d1", group: "Tratamiento", text: "¿Puede abarcar varias sesiones?" },
    { id: "s1", group: "Seguimiento", text: "¿Cómo saben quién debe regresar?" },
    { id: "m1", group: "Dinero", text: "¿El pago condiciona alguna etapa?" },
    { id: "c1", group: "Cierre", text: "¿Qué debe registrarse antes de cerrar?" },
  ],
};

const LOG: OperationSpec = {
  type: "LOG",
  processTitle: "Procesos de la operación",
  frequent: [
    "Recepción de solicitud",
    "Programación",
    "Asignación de unidad / operador",
    "Recolección / carga",
    "Traslado",
    "Seguimiento",
    "Entrega",
    "Evidencia de entrega",
    "Cierre del servicio",
  ],
  secondary: [
    "Cotización por viaje",
    "Planeación de ruta",
    "Consolidación de cargas",
    "Cross-docking",
    "GPS / rastreo",
    "Custodia",
    "Maniobras",
    "Peajes / casetas",
    "Viáticos",
    "Devoluciones",
    "Reintentos de entrega",
    "Incidencias / siniestros",
    "Mantenimiento de unidades",
  ],
  flowExample: "Solicitud → Programación → Asignación → Recolección → Traslado → Entrega → Evidencia → Cierre",
  startEvent: "¿Qué evento inicia formalmente el servicio?",
  receives: "¿Qué información necesita operación para comenzar?",
  finishedWhen: "¿Cuándo se considera terminado un viaje / envío?",
  howTools: ["WhatsApp", "Excel", "Correo", "Papel / formatos impresos", "Agenda / calendario", "GPS / rastreo", "Drive / nube"],
  recaptureExample: "WhatsApp → Excel → GPS → Evidencia → Facturación",
  extraAfterHow: [
    opSection("LOG", "programacion", "Programación y preparación", [
      checklist(
        "op.LOG.prog.ready",
        "¿Qué debe estar listo antes de iniciar?",
        ["Solicitud / orden confirmada", "Origen", "Destino", "Fecha / horario", "Unidad", "Operador", "Tipo de carga", "Capacidad requerida", "Ruta", "Documentos", "Datos de contacto", "Condición de pago / autorización"],
        { allowOther: true },
      ),
      text("op.LOG.prog.verify", "¿Quién verifica que el viaje pueda realizarse?"),
      text("op.LOG.prog.missing", "¿Qué sucede si falta unidad, operador, documentación o información?"),
    ]),
    opSection("LOG", "unidades", "Unidades y operadores", [
      checklist("op.LOG.uni.select", "¿Cómo se selecciona la unidad?", ["Disponibilidad", "Capacidad", "Tipo de carga", "Ruta", "Cliente"], { allowOther: true }),
      checklist("op.LOG.uni.info", "¿Qué información de la unidad se necesita consultar?", ["Placas", "Tipo", "Capacidad", "Kilometraje", "Documentos", "Seguro", "Mantenimiento", "Disponibilidad"], {
        allowOther: true,
      }),
      text("op.LOG.uni.assign", "¿Cómo se asigna al operador?"),
      checklist("op.LOG.uni.receive", "¿Cómo recibe el operador su servicio?", ["Verbal", "WhatsApp", "Llamada", "Orden impresa", "Aplicación"], { allowOther: true }),
      choice("op.LOG.uni.change", "¿Puede cambiarse unidad u operador después de asignado?", ["Sí", "No"]),
      text("op.LOG.uni.changeHow", "¿Cómo se registra ese cambio?"),
    ]),
    opSection("LOG", "recoleccion", "Recolección / carga", [
      checklist(
        "op.LOG.rec.arrive",
        "¿Qué sucede al llegar al punto de origen?",
        ["Confirmación de llegada", "Identificación de mercancía", "Revisión de cantidades", "Revisión de estado", "Carga", "Firma / documentación", "Evidencia fotográfica", "Pesaje"],
        { allowOther: true },
      ),
      text("op.LOG.rec.confirm", "¿Cómo se confirma que la carga corresponde al servicio?"),
      checklist("op.LOG.rec.docs", "¿Qué documentos acompañan la carga?", ["Carta porte", "Remisión", "Factura", "Orden de carga", "Lista de empaque"], { allowOther: true }),
      text("op.LOG.rec.diff", "¿Qué pasa si existe una diferencia al recoger?"),
    ]),
  ],
  prepTitle: "Preparación",
  prepReady: ["Solicitud confirmada", "Unidad", "Operador", "Documentos"],
  prepVerify: "¿Quién verifica que el viaje pueda realizarse?",
  prepMissing: "¿Qué sucede si falta unidad, operador, documentación o información?",
  peopleFields: [
    text("op.LOG.resp.traffic", "¿Quién programa y asigna?"),
    text("op.LOG.resp.operator", "¿Cómo se coordina con el operador?"),
  ],
  execExample: "Recolección → Salida → Tránsito → Arribo → Descarga → Entrega",
  sequenceLabel: "¿Existe una ruta definida?",
  parallelLabel: "¿Puede cambiarse durante el viaje?",
  decisionHint: "¿Quién autoriza el cambio de ruta? ¿Existen puntos de control?",
  delays: [
    "Tráfico",
    "Falla de unidad",
    "Accidente",
    "Bloqueo / carretera cerrada",
    "Cliente no disponible",
    "Problema con documentación",
    "Problema con mercancía",
    "Clima",
    "Autoridad / revisión",
  ],
  extraAfterExec: [
    opSection("LOG", "monitoreo", "Seguimiento y monitoreo", [
      checklist("op.LOG.mon.how", "¿Cómo saben dónde está cada servicio?", ["GPS", "Llamadas", "WhatsApp", "Reporte del operador", "Plataforma"], { allowOther: true }),
      text("op.LOG.mon.who", "¿Quién monitorea?"),
      checklist("op.LOG.mon.freq", "¿Con qué frecuencia?", ["Continuo", "Por eventos", "Cada cierto tiempo", "Sólo cuando existe incidencia"]),
    ]),
  ],
  followTitle: "Seguimiento y control",
  followHow: "¿Cómo saben en qué etapa está cada servicio?",
  statuses: ["Programado", "Asignado", "En recolección", "Cargado", "En tránsito", "Detenido", "En destino", "Entregado", "Cerrado", "Cancelado"],
  whoNeeds: ["Tráfico / logística", "Ventas", "Administración", "Dirección", "Cliente"],
  commitmentLabel: "¿Manejan fecha/hora compromiso?",
  detectLabel: "¿Cómo detectan retrasos?",
  changeTitle: "Cambios e incidencias",
  changeWhat: [
    "Retraso",
    "Cambio de ruta",
    "Cambio de destino",
    "Cambio de unidad",
    "Cambio de operador",
    "Falla mecánica",
    "Accidente",
    "Mercancía dañada",
    "Mercancía incompleta",
    "Cliente ausente",
    "Entrega rechazada",
  ],
  changeModify: ["Tiempo", "Ruta", "Costo", "Unidad", "Operador", "Fecha de entrega"],
  extraEconomic: [
    checklist("op.LOG.eco.price", "¿Cómo se determina el precio del servicio?", ["Tarifa fija", "Distancia", "Tipo de unidad", "Peso", "Volumen", "Tiempo", "Ruta", "Cliente"], {
      allowOther: true,
    }),
    checklist(
      "op.LOG.eco.costs",
      "¿Qué costos pueden generarse durante el servicio?",
      ["Combustible", "Casetas", "Viáticos", "Maniobras", "Estacionamiento", "Reparaciones", "Custodia", "Tiempo de espera", "Kilómetros adicionales"],
      { allowOther: true },
    ),
    text("op.LOG.eco.extra", "¿Qué puede generar un cargo adicional?"),
    text("op.LOG.eco.whoAuth", "¿Quién autoriza esos cargos?"),
  ],
  economicTitle: "Costos y condiciones económicas",
  economicCondition: ["No", "Anticipo", "Pago contra entrega", "Liquidación al cierre"],
  amountChange: ["No", "Por casetas", "Por espera", "Por kilómetros adicionales", "Por maniobras"],
  consult: ["Tarifa", "Anticipo", "Pagos", "Saldo", "Gastos del viaje", "Costos adicionales", "Ninguno"],
  extraBeforeGuide: [
    opSection("LOG", "entrega", "Entrega", [
      checklist(
        "op.LOG.ent.arrive",
        "¿Qué sucede al llegar al destino?",
        ["Confirmación de llegada", "Validación del receptor", "Descarga", "Revisión de mercancía", "Firma", "Fotografía", "Sello", "Entrega de documentos"],
        { allowOther: true },
      ),
      choice("op.LOG.ent.partial", "¿Puede existir entrega parcial?", ["Sí", "No"]),
      checklist("op.LOG.ent.noreceive", "¿Qué sucede si el cliente no recibe?", ["Se espera", "Se reprograma", "Se regresa mercancía", "Se contacta a tráfico", "Se genera costo adicional"], {
        allowOther: true,
      }),
      text("op.LOG.ent.who", "¿Quién confirma que la entrega fue completada?"),
    ]),
    opSection("LOG", "gastos", "Gastos del viaje", [
      choice("op.LOG.gas.advance", "¿El operador recibe dinero antes del viaje?", ["Sí", "No"]),
      checklist("op.LOG.gas.for", "¿Para qué?", ["Combustible", "Casetas", "Viáticos", "Maniobras"], { allowOther: true }),
      checklist("op.LOG.gas.proof", "¿Cómo comprueba los gastos?", ["Tickets", "Facturas", "Fotografías", "Formato", "Aplicación"], { allowOther: true }),
      choice("op.LOG.gas.settle", "¿Se realiza liquidación del viaje?", ["Sí", "No"]),
      text("op.LOG.gas.how", "¿Cómo?"),
    ]),
  ],
  evidenceWhat: [
    "Fotografías de carga",
    "Fotografías de entrega",
    "Firma del receptor",
    "Sello",
    "Acuse",
    "Carta porte",
    "Remisión",
    "GPS / ubicación",
    "Hora de entrega",
    "Incidencias",
  ],
  evidenceWhere: ["WhatsApp", "Correo", "Papel", "Carpetas", "Drive / nube"],
  relatedLabel: "¿Debe quedar relacionada con el viaje / envío?",
  validateTitle: "Cierre del servicio",
  validateFields: [
    checklist(
      "op.LOG.val.ready",
      "¿Qué debe cumplirse para cerrar el viaje / envío?",
      ["Entrega realizada", "Evidencia completa", "Documentos completos", "Incidencias cerradas", "Gastos registrados", "Operador liquidado", "Condición económica cumplida"],
      { allowOther: true },
    ),
    text("op.LOG.val.who", "¿Quién realiza el cierre?"),
  ],
  closeReady: ["Entrega realizada", "Evidencia completa", "Documentos completos"],
  adminInfo: [
    "Cliente",
    "Viaje / envío realizado",
    "Origen",
    "Destino",
    "Fecha",
    "Unidad",
    "Operador",
    "Tarifa",
    "Cargos adicionales",
    "Gastos",
    "Evidencia de entrega",
    "Información para facturar",
    "Saldo por cobrar",
  ],
  afterClose: [
    opSection("LOG", "devoluciones", "Devoluciones / reintentos / reclamaciones", [
      choice("op.LOG.dev.return", "¿Puede regresar mercancía al origen?", ["Sí", "No"]),
      text("op.LOG.dev.how", "¿Cómo se controla?"),
      choice("op.LOG.dev.retry", "¿Existen reintentos de entrega?", ["Sí", "No"]),
      choice("op.LOG.dev.new", "¿Se genera un nuevo servicio?", ["Sí", "No", "Depende"]),
      text("op.LOG.dev.damage", "¿Cómo se manejan daños o pérdidas?"),
      text("op.LOG.dev.rel", "¿Cómo se relacionan con el viaje original?"),
    ]),
  ],
  guides: [
    { id: "i1", group: "Inicio", text: "¿Cómo llega una solicitud de transporte?" },
    { id: "p1", group: "Programación", text: "¿Cómo seleccionan unidad y operador?" },
    { id: "r1", group: "Recolección", text: "¿Cómo saben exactamente qué deben recoger?" },
    { id: "t1", group: "Traslado", text: "¿Cómo monitorean el viaje?" },
    { id: "x1", group: "Incidencias", text: "¿Qué sucede cuando algo sale mal?" },
    { id: "e1", group: "Entrega", text: "¿Cómo saben que la mercancía fue recibida correctamente?" },
    { id: "c1", group: "Costos", text: "¿Cómo calculan la tarifa?" },
    { id: "k1", group: "Cierre", text: "¿Qué debe cumplirse para cerrar el viaje?" },
  ],
};

const SPECS: Record<SurveyOperationType, OperationSpec> = { SER, DIS, MAN, PRY, CIT, LOG };

function isSerLegacyVersion(operationVersion?: string | null) {
  return operationVersion === "SER-1.0";
}

function operationSectionsFor(type: SurveyOperationType, operationVersion?: string | null) {
  if (type === "SER" && !isSerLegacyVersion(operationVersion)) return buildSerV2Sections();
  return buildOperationSections(SPECS[type]);
}

function operationVersionFor(type: SurveyOperationType, operationVersion?: string | null) {
  if (type === "SER" && !isSerLegacyVersion(operationVersion)) return SER_V2_OPERATION_VERSION;
  return `${type}-${TEMPLATE_VERSION}`;
}

export function getSurveyTemplate(type: SurveyOperationType, operationVersion?: string | null): SurveyTemplate {
  return {
    version: TEMPLATE_VERSION,
    transversalVersion: TEMPLATE_VERSION,
    operationVersion: operationVersionFor(type, operationVersion),
    operationType: type,
    sections: [
      headerSection(),
      ...TRANSVERSAL_AREAS.map(transversalSection),
      ...operationSectionsFor(type, operationVersion),
      attachmentsSection(),
      closureSection(),
    ],
  };
}

export function listReviewableSections(type: SurveyOperationType, operationVersion?: string | null) {
  return getSurveyTemplate(type, operationVersion).sections.filter((section) => section.reviewable);
}

export function getTemplateField(type: SurveyOperationType, fieldId: string, operationVersion?: string | null) {
  for (const section of getSurveyTemplate(type, operationVersion).sections) {
    const field = section.fields.find((item) => item.id === fieldId);
    if (field) return { section, field };
  }
  return null;
}

export function operationTypeLabel(type: SurveyOperationType) {
  return SURVEY_OPERATION_LABELS[type];
}
