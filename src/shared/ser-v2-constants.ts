export const SER_V2_OPERATION_VERSION = "SER-2.0";
export const SER_V2_ASSIGNEE_CATALOG_FIELD = "op.SER.v2.encargados";
export const SER_V2_ACTIONS_FIELD = "op.SER.v2.acciones";

export const SER_V2_SUGGESTED_ASSIGNEES = [
  { label: "Recepción / front desk", hint: "Recibe solicitudes y abre la OS" },
  { label: "Técnico de servicio", hint: "Ejecuta el trabajo" },
  { label: "Supervisor / jefe de taller", hint: "Supervisa y valida" },
  { label: "Coordinador de operación", hint: "Asigna y da seguimiento" },
  { label: "Gerente / autorizador", hint: "Autoriza excepciones o cierres" },
  { label: "Administración / facturación", hint: "Gestiona cierre administrativo" },
] as const;

export const SER_V2_DEFAULT_OS_ACTIONS = [
  "Registrar trabajo",
  "Asignar responsable",
  "Terminar trabajo",
  "Validar resultado",
  "Entrega",
  "Cancelar orden",
  "Cerrar",
  "Reabrir",
  "Garantía",
] as const;

export const SER_V2_OS_ORIGINS = ["Cotización autorizada", "Crearla desde cero"] as const;

export const SER_V2_WORK_STATUS_SUGGESTIONS = [
  "Pendiente de iniciar",
  "En diagnóstico",
  "Esperando autorización de un adicional",
  "Esperando refacciones o materiales",
  "En reparación o ejecución",
  "En pruebas",
  "Esperando validación",
  "Trabajo terminado",
] as const;

export const SER_V2_MODULE_LINKS = {
  "Almacén e inventario": [
    "Consultar existencias",
    "Solicitar materiales o refacciones",
    "Reservar existencias para la orden",
    "Consultar entregas de materiales",
    "Registrar consumos",
    "Registrar devoluciones",
  ],
  Compras: [
    "Solicitar compras específicas para la OS",
    "Consultar su avance",
    "Relacionar servicios subcontratados",
  ],
  Finanzas: [
    "Registrar anticipos o cobros del cliente",
    "Consultar pagos recibidos y saldo",
    "Registrar gastos de la OS",
    "Solicitar pagos a proveedores",
    "Registrar pagos a proveedores",
    "Consultar costos y rentabilidad",
  ],
  Facturación: [
    "Solicitar facturación",
    "Generar facturas desde la OS",
    "Consultar facturas relacionadas",
  ],
  "Personal y productividad": [
    "Consultar disponibilidad y carga de trabajo",
    "Relacionar técnicos o empleados participantes",
    "Registrar tiempos por persona",
    "Relacionar actividades y resultados con cada participante",
    "Consultar productividad",
  ],
  Documentos: [
    "Consultar documentos relacionados",
    "Generar reportes de servicio",
    "Generar documentos de entrega o remisiones",
    "Relacionar archivos con el expediente documental",
  ],
} as const;

export const SER_V2_ADMIN_INFO = [
  "Facturas y situación de facturación",
  "Remisiones o documentos de entrega",
  "Anticipos y cobros recibidos",
  "Saldo pendiente",
  "Gastos y costos relacionados",
] as const;

export const SER_V2_CLIENT_CATALOGS = [
  "Tipos de servicio",
  "Equipos o productos",
  "Vehículos",
  "Marcas y modelos",
  "Fallas o diagnósticos",
  "Refacciones y materiales",
  "Herramientas",
  "Especialidades técnicas",
  "Plantillas de checklist",
] as const;

export const SER_V2_REPORT_OUTPUTS = [
  "Orden de servicio imprimible",
  "Reporte del trabajo realizado",
  "Documento de entrega o remisión",
  "Órdenes pendientes o atrasadas",
  "Equipos terminados pendientes de entregar",
  "Carga de trabajo por técnico",
  "Productividad",
  "Costos y rentabilidad por OS",
  "Reporte o documento de garantía",
] as const;

export const SER_V2_FIELD_TYPES = [
  "Texto corto",
  "Texto largo",
  "Número",
  "Fecha",
  "Fecha y hora",
  "Sí / No",
  "Lista de opciones",
  "Selección de catálogo",
  "Imagen",
  "Archivo",
] as const;

export const SER_V2_FIELD_LOCATIONS = [
  "Creación de la OS",
  "Datos generales de la OS",
  "Registrar trabajo",
  "Asignar responsable",
  "Terminar trabajo",
  "Validar resultado",
  "Entrega",
  "Cancelar orden",
  "Cerrar",
  "Reabrir",
  "Garantía",
  "Cambio de estatus",
] as const;
