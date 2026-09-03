# VECTORIA_PLAN_VALIDACION
version: 1.0
nombre: Plan de Validación VectorIA
discovery: discovery-vectoria-v1.6.md
fases: 6
checklist_obligatorio: false

# Fase 1 — Clientes y catálogos base

## Objetivo
Verificar que el módulo de clientes y catálogos operen según Discovery.

## Comprobaciones
- Crear un cliente con folio automático.
- Editar datos de contacto del cliente.
- Registrar datos fiscales opcionales.

## Resultado esperado
El cliente queda disponible para oportunidades, cotizaciones y facturación.

# Fase 2 — Flujo comercial

## Objetivo
Validar oportunidad → cotización → autorización → OS.

## Comprobaciones
- Crear oportunidad vinculada a cliente y servicio.
- Generar cotización desde oportunidad.
- Autorizar cotización con programador obligatorio.

## Resultado esperado
Se genera OS con programador, pagos habilitados y relaciones correctas.

# Fase 3 — Proyectos

## Objetivo
Validar importación del Plan de Validación y flujo de fases.

## Comprobaciones
- Importar Plan de Validación válido.
- Marcar comprobaciones de la fase 1.
- Enviar fase 1 a validar.

## Resultado esperado
La fase avanza a en validación y puede validarse o devolverse.

# Fase 4 — Suscripciones

## Objetivo
Validar suscripciones desde OS, activación y ciclos.

## Comprobaciones
- Crear suscripción desde OS.
- Activar suscripción pendiente.
- Registrar pago de ciclo.

## Resultado esperado
Suscripción activa con ciclo y saldo actualizado.

# Fase 5 — Finanzas

## Objetivo
Validar ingresos automáticos y reporte financiero.

## Comprobaciones
- Registrar pago de OS y verificar ingreso.
- Consultar flujo mensual.
- Exportar reporte filtrado.

## Resultado esperado
Movimientos reflejados en saldos y reporte.

# Fase 6 — Facturación

## Objetivo
Validar facturación manual y desde suscripción.

## Comprobaciones
- Crear factura desde OS con datos fiscales completos.
- Timbrar con Facturapi configurado.
- Enviar factura por correo.

## Resultado esperado
Factura timbrada con PDF/XML y envío registrado.
