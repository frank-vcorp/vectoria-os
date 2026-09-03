# VECTORIA_PLAN_VALIDACION
version: 1.0
nombre: Plan de Validación
discovery: discovery-vectoria-v1.6-revision-final.md
fases: 6
checklist_obligatorio: false

# Fase 1 — Base, usuarios y catálogos

## Objetivo
Validar que la estructura base del sistema, los usuarios, los permisos y los catálogos funcionen correctamente antes de probar los flujos comerciales y operativos.

## Comprobaciones
- Crear un usuario Administrador.
- Crear un usuario Vendedor.
- Crear un usuario Programador.
- Verificar que cada usuario tenga acceso únicamente a los módulos permitidos por su rol.
- Verificar que las restricciones especiales del Administrador se respeten aunque otro rol tenga acceso al módulo.
- Crear un Servicio.
- Verificar Precio base.
- Verificar Categoría de ingreso.
- Verificar check Genera proyecto.
- Crear un elemento del Catálogo de Suscripciones.
- Verificar Precio base.
- Verificar Periodicidad.
- Verificar Categoría de ingreso.
- Crear Periodicidad.
- Crear Condición de pago.
- Crear Categoría de ingreso.
- Crear Categoría de egreso.
- Crear Proveedor / Acreedor.
- Probar carga rápida desde un formulario.
- Inactivar un registro de catálogo.
- Verificar que un registro inactivo no aparezca en nuevas operaciones.
- Verificar que los registros históricos conserven valores de catálogos posteriormente inactivados.
- Verificar generación automática de folios.
- Verificar registro básico de auditoría.

## Resultado esperado
Usuarios, roles, permisos, folios, carga rápida y catálogos funcionan conforme al Discovery y sirven como base para los módulos posteriores.

# Fase 2 — Clientes, oportunidades y cotizaciones

## Objetivo
Validar el flujo comercial desde el alta del Cliente hasta la autorización de una Cotización, incluyendo el Servicio principal y las Suscripciones propuestas.

## Comprobaciones
- Crear un Cliente.
- Verificar alta rápida de Cliente.
- Capturar Contacto opcional.
- Capturar Celular.
- Capturar Correo.
- Capturar y editar Datos fiscales.
- Crear una Oportunidad.
- Verificar que el Vendedor se herede del usuario que la crea.
- Verificar estado inicial Abierta.
- Cambiar una Oportunidad a No interesado.
- Crear una Cotización desde una Oportunidad.
- Verificar que la Oportunidad pase a Cotizada.
- Crear una segunda Cotización desde la misma Oportunidad.
- Verificar que ambas Cotizaciones conserven su relación con la misma Oportunidad.
- Crear una Cotización directamente sin Oportunidad.
- Agregar un único Servicio principal.
- Verificar que no se permita más de un Servicio principal.
- Verificar herencia del Precio base.
- Agregar una Suscripción propuesta.
- Agregar varias Suscripciones propuestas.
- Verificar precio y periodicidad de cada Suscripción propuesta.
- Probar carga rápida de Servicio principal.
- Probar carga rápida de Suscripción.
- Autorizar una Cotización.
- Verificar que solo se cree una Orden de Servicio.
- Intentar autorizar nuevamente la misma Cotización.
- Verificar que no se genere una segunda OS.
- Verificar que una Cotización Rechazada no genere OS.
- Verificar que una Cotización Cancelada no genere OS.
- Generar PDF de Cotización.
- Verificar que el PDF separe Servicio principal y Suscripciones propuestas.
- Descargar PDF.
- Enviar Cotización por correo.

## Resultado esperado
El flujo comercial funciona correctamente, las relaciones se conservan, las Suscripciones propuestas quedan separadas del Servicio principal y la autorización genera una única OS sin duplicados.

# Fase 3 — Órdenes de Servicio y proyectos

## Objetivo
Validar que la Orden de Servicio concentre correctamente el Servicio principal, genere Proyecto cuando corresponda y administre las Suscripciones relacionadas sin mezclarlas con el saldo principal de la OS.

## Comprobaciones
- Crear una OS desde Cotización autorizada.
- Verificar herencia de Cliente.
- Verificar referencia a Cotización.
- Verificar Vendedor.
- Asignar Programador.
- Verificar Servicio principal.
- Verificar Precio.
- Verificar Condiciones de pago.
- Verificar Fecha de entrega.
- Crear una OS directamente.
- Probar alta rápida de Servicio desde OS.
- Crear una OS con Servicio Genera proyecto = Sí.
- Verificar creación automática de un único Proyecto.
- Verificar que el Proyecto herede Cliente.
- Verificar que el Proyecto herede OS.
- Verificar que el Proyecto herede Servicio.
- Verificar que el Proyecto herede Descripción.
- Verificar que el Proyecto herede Programador.
- Verificar que el Proyecto herede Fecha de entrega.
- Crear una OS con Servicio Genera proyecto = No.
- Verificar que no se genere Proyecto.
- Cambiar Programador en una OS con Proyecto.
- Verificar sincronización con Proyecto.
- Cambiar Fecha de entrega en una OS con Proyecto.
- Verificar sincronización con Proyecto.
- Verificar que las Suscripciones heredadas desde Cotización se creen relacionadas con la OS.
- Verificar que las Suscripciones heredadas queden Pendientes de activación.
- Crear una nueva Suscripción directamente desde la OS.
- Verificar que también quede Pendiente de activación.
- Verificar que la OS pueda tener varias Suscripciones.
- Verificar que ninguna Suscripción genere Proyecto.
- Importar un archivo .md válido de fases cuando aplique al Proyecto.
- Verificar máximo de 7 fases.
- Intentar importar un archivo con formato inválido.
- Verificar rechazo y mensaje de error.
- Verificar stepper horizontal.
- Verificar Nombre de fase.
- Verificar Objetivo.
- Verificar contenido desplegable.
- Verificar desbloqueo secuencial.
- Intentar saltar una fase bloqueada.
- Verificar que no se permita.
- Enviar una fase a validar.
- Avanzar a la siguiente sin validación.
- Verificar advertencia.
- Validar una fase.
- Verificar Fecha de término automática.
- Generar PDF de OS.
- Verificar que incluya Servicio principal y Suscripciones relacionadas.
- Descargar PDF.
- Enviar OS por correo.

## Resultado esperado
La OS funciona como centro del Servicio principal, genera Proyecto únicamente cuando corresponde, conserva todas sus relaciones y permite gestionar correctamente las Suscripciones dependientes.

# Fase 4 — Suscripciones y cobranza

## Objetivo
Validar el ciclo completo de una Suscripción desde su creación y activación hasta el control de ciclos, deuda, pagos, pausas, suspensión por adeudo y convenios.

## Comprobaciones
- Abrir una Suscripción heredada desde Cotización.
- Verificar Estado del servicio Pendiente de activación.
- Verificar que no genere ciclos antes de activarse.
- Verificar que no genere cargos antes de activarse.
- Verificar que no genere facturas antes de activarse.
- Activar una Suscripción desde la OS.
- Verificar Fecha de activación.
- Verificar cambio a Estado Activa.
- Verificar creación del primer Ciclo.
- Probar Activar todas desde la OS.
- Verificar que cada Suscripción se procese de manera independiente.
- Verificar Periodicidad mensual.
- Verificar Periodicidad anual.
- Verificar corte al último día del mes correspondiente.
- Verificar fecha límite de pago al día 5 del mes siguiente.
- Verificar Situación Pendiente.
- Verificar Situación Por pagar.
- Verificar Situación Vencido.
- Verificar Situación Pagado.
- Pausar una Suscripción.
- Verificar que no genere nuevos Ciclos mientras esté Pausada.
- Verificar que los adeudos anteriores permanezcan.
- Registrar un pago mientras esté Pausada.
- Reactivar la Suscripción.
- Verificar que los nuevos ciclos continúen desde la reactivación.
- Generar un adeudo vencido.
- Verificar Situación de cobranza Vencida.
- Cambiar manualmente a Suspendida por adeudo.
- Verificar que continúe generando Ciclos si el Estado del servicio sigue Activa.
- Verificar que continúe generando cargos.
- Registrar un pago parcial.
- Verificar aplicación al adeudo más antiguo.
- Registrar un pago que cubra varios Ciclos.
- Verificar distribución cronológica.
- Verificar que un pago de Suscripción no reduzca el saldo de la OS.
- Aplicar Convenio de pago.
- Verificar alerta de confirmación.
- Verificar Pago real.
- Verificar Ajuste por convenio.
- Verificar que el Ajuste no genere Ingreso.
- Verificar ciclos Regularizados por convenio.
- Verificar que un Convenio no reactive automáticamente una Suscripción Pausada.
- Verificar que una Suscripción Cancelada no genere nuevos Ciclos.
- Verificar que el historial permanezca.
- Verificar vista de detalle.
- Verificar historial de ciclos.
- Verificar historial de pagos.
- Verificar saldo vencido total.
- Verificar total pendiente.
- Verificar ciclos o meses adeudados.
- Verificar filtro predeterminado de Vencidas y Suspendidas por adeudo.

## Resultado esperado
Las Suscripciones funcionan de forma independiente al saldo de la OS, controlan correctamente sus Ciclos y permiten manejar pagos, atrasos, pausas, suspensión y convenios sin perder historial.

# Fase 5 — Finanzas, pagos y cuentas por cobrar/pagar

## Objetivo
Validar que todo movimiento de dinero tenga un origen claro, que los saldos sean correctos y que el sistema mantenga separados Venta, Pago, Factura y Cuenta por Cobrar.

## Comprobaciones
- Crear Banco / Cuenta.
- Capturar Saldo inicial.
- Registrar un Ingreso manual.
- Registrar un Egreso manual.
- Verificar Categoría correspondiente.
- Registrar un pago de OS.
- Verificar que solo reduzca el saldo del Servicio principal.
- Verificar que no afecte Suscripciones.
- Verificar creación automática del Ingreso.
- Verificar Categoría de ingreso heredada del Servicio.
- Registrar un pago de Suscripción.
- Verificar que solo reduzca saldo de sus Ciclos.
- Verificar que no afecte saldo de OS.
- Verificar creación automática del Ingreso.
- Verificar Categoría de ingreso heredada de la Suscripción.
- Verificar relación 1:1 entre Pago y Movimiento financiero.
- Intentar editar un Movimiento automático desde Finanzas.
- Verificar que no se permita de forma independiente.
- Crear una Cuenta por Pagar.
- Registrar pago parcial.
- Verificar Situación Parcial.
- Dejar vencer una Cuenta por Pagar con saldo.
- Verificar Situación Vencida.
- Liquidar una Cuenta por Pagar.
- Verificar Situación Pagada.
- Verificar Egreso automático.
- Verificar saldo de Banco / Cuenta.
- Revisar Total de ingresos.
- Revisar Total de egresos.
- Revisar Saldo acumulado.
- Revisar Flujo del mes.
- Revisar Ventas totales del mes.
- Verificar que Ventas incluya Servicio principal de OS creadas en el mes.
- Verificar que Ventas incluya Ciclos de Suscripción generados en el mes.
- Verificar que los Pagos no cambien Ventas del mes.
- Revisar Total de Cuentas por Cobrar.
- Verificar suma de saldo pendiente de OS.
- Verificar suma de ciclos vencidos de Suscripción.
- Verificar que los saldos se consoliden únicamente en Cuentas por Cobrar.
- Abrir un registro desde el listado breve de Cuentas por Cobrar.
- Verificar que lleve a la OS o Suscripción correcta.

## Resultado esperado
El sistema financiero conserva el origen de cada movimiento, mantiene independientes los saldos de OS y Suscripciones y presenta correctamente flujo, ventas y cartera pendiente.

# Fase 6 — Facturación, documentos, reportes e integración final

## Objetivo
Validar la facturación manual y automática, los documentos, el correo, los reportes y ejecutar una prueba completa de extremo a extremo.

## Comprobaciones
- Configurar Facturapi.
- Configurar SendGrid.
- Verificar almacenamiento seguro de credenciales.
- Configurar correo remitente.
- Configurar nombre del remitente.
- Crear una Factura manual desde OS.
- Generar vista previa.
- Timbrar con Facturapi.
- Verificar PDF de Facturapi.
- Verificar XML de Facturapi.
- Enviar Factura por correo.
- Crear una Factura manual desde Suscripción.
- Verificar relación con la Suscripción.
- Activar Facturación automática en una Suscripción.
- Intentar activarla sin datos fiscales completos.
- Verificar que se soliciten los datos faltantes.
- Intentar activarla sin correo válido.
- Verificar validación.
- Verificar que la Facturación automática solo opere con Estado del servicio Activa.
- Verificar que no opere en Pendiente de activación.
- Verificar que no opere en Pausada.
- Verificar que Suspendida por adeudo siga facturando si el Estado del servicio continúa Activa.
- Verificar generación automática el día 1 del mes siguiente al corte.
- Verificar máximo una Factura automática Timbrada por Ciclo.
- Reintentar el proceso automático.
- Verificar que no se duplique la Factura.
- Generar manualmente una Factura para un Ciclo antes del proceso automático.
- Verificar que el proceso automático reconozca la Factura Timbrada y no duplique.
- Simular fallo de timbrado.
- Verificar Estado fiscal Error de timbrado.
- Simular timbrado correcto y fallo de correo.
- Verificar que la Factura permanezca Timbrada.
- Verificar Estado de envío Error.
- Reintentar únicamente el correo.
- Verificar que no se vuelva a timbrar.
- Verificar envío por correo de Cotización.
- Verificar envío por correo de OS.
- Probar filtros del Reporte Financiero.
- Filtrar por periodo.
- Filtrar por Tipo.
- Filtrar por Categoría.
- Filtrar por Banco / Cuenta.
- Verificar actualización de totales en tiempo real.
- Exportar todos los resultados filtrados a Excel.
- Exportar todos los resultados filtrados a PDF.
- Seleccionar registros específicos.
- Exportar únicamente los seleccionados.
- Ejecutar flujo completo Cliente → Oportunidad → Cotización → OS.
- Verificar Proyecto automático cuando corresponda.
- Verificar Suscripciones heredadas.
- Activar Suscripciones.
- Generar Ciclos.
- Registrar Pagos.
- Verificar Finanzas.
- Verificar Cuentas por Cobrar.
- Verificar Facturación.
- Verificar documentos y correo.
- Repetir acciones críticas para validar idempotencia.
- Verificar que no existan duplicados de OS, Proyecto, Ciclos, Facturas ni Movimientos financieros.

## Resultado esperado
Los flujos principales del sistema funcionan de extremo a extremo, la facturación y los documentos se generan correctamente, los reportes reflejan la información real y no existen duplicidades en los procesos automáticos.
