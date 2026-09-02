# VectorIA
# Discovery VectorIA v1.0

## 1. Objetivo

Desarrollar un sistema web interno para VectorIA que concentre de forma simple el proceso comercial, la ejecución de proyectos, las suscripciones, las finanzas y la facturación.

El sistema debe priorizar simplicidad, rapidez de captura, trazabilidad, mínima duplicidad de información, automatización de datos heredados y control financiero práctico.

Este documento sustituye a la antigua Definición Funcional como documento principal de Discovery del proyecto.

---

# 2. Reglas generales

- Todo campo capturado será obligatorio salvo que se indique expresamente como opcional.
- Todo campo capturado será editable, salvo documentos fiscales ya timbrados.
- Los campos automáticos o calculados no requieren captura manual.
- Cuando un campo indique **carga rápida**, podrá crearse el registro relacionado sin abandonar la pantalla actual.
- Las relaciones directas entre registros deberán ser cliqueables cuando resulte útil.
- Los registros con historial operativo no deberán eliminarse físicamente.
- El sistema conservará auditoría mínima de creación, modificación, cancelación y validación.

---

# 3. Módulos

1. Clientes
2. Oportunidades
3. Cotizaciones
4. Órdenes de Servicio
5. Proyectos
6. Suscripciones
7. Bancos / Cuentas
8. Ingresos y Egresos manuales
9. Cuentas por Pagar
10. Flujo Financiero
11. Reporte Financiero
12. Facturación
13. Catálogos
14. Usuarios y Roles

Comisiones queda fuera del alcance inicial.

---

# 4. Clientes

Campos:

- Folio — automático.
- Nombre del cliente — persona o empresa.
- Contacto — opcional; únicamente cuando el cliente sea empresa.
- Celular.
- Correo.
- Datos fiscales — opcionales y dentro de un apartado desplegable.

Cada cliente tendrá como máximo un contacto.

Habrá carga rápida de Cliente desde Oportunidades, Cotizaciones, Órdenes de Servicio y Facturación manual.

---

# 5. Oportunidades

Campos:

- Folio — automático.
- Cliente — carga rápida.
- Vendedor — heredado automáticamente del usuario que crea la Oportunidad.
- Servicio — catálogo.
- Descripción.
- Estatus — fijo.
- Bitácora — opcional.

Estados fijos:

- Abierta
- Cotizada
- No interesado

Flujo:

- Abierta → Cotizada: al generar una Cotización; se heredan datos disponibles y se solicitan solo los faltantes.
- Abierta → No interesado: cuando el cliente indica que no desea continuar.

---

# 6. Cotizaciones

Puede crearse desde una Oportunidad o directamente desde su módulo.

Campos:

- Folio — automático.
- Cliente — carga rápida.
- Oportunidad relacionada — opcional y cliqueable.
- Vendedor — heredado.
- Servicio — catálogo.
- Descripción.
- Tipo de contratación:
  - Por evento
  - Suscripción
- Periodicidad — catálogo; requerida para Suscripción.
- Precio.
- Tiempo de entrega.
- Condiciones de pago — catálogo.
- Observaciones — opcional.
- Orden de Servicio relacionada — cliqueable cuando exista.

Al seleccionar un Servicio, el sistema podrá cargar como valores iniciales Tipo de contratación, Periodicidad y Precio base.

Estados fijos:

- Cotizada — inicial.
- Rechazada.
- Autorizada.
- Cancelada.

Cuando una Cotización sea Autorizada:

- se inicia la creación de una Orden de Servicio;
- se heredan los datos disponibles;
- se solicitan únicamente los faltantes.

Solo el Administrador podrá cancelar una Cotización.

El sistema deberá permitir generar y descargar la Cotización en PDF.

---

# 7. Órdenes de Servicio

Puede crearse desde una Cotización autorizada o directamente desde su módulo.

Campos:

- Folio — automático.
- Cliente — carga rápida.
- Referencia a Cotización — opcional y cliqueable.
- Vendedor — heredado de la Cotización o del usuario que crea la OS directamente.
- Servicio — catálogo.
- Descripción.
- Tipo de contratación:
  - Por evento
  - Suscripción
- Periodicidad — catálogo cuando aplique.
- Precio.
- Condiciones de pago — catálogo.
- Fecha de entrega.
- Observaciones — opcional.

Si proviene de Cotización, heredará los datos disponibles y solicitará solo los faltantes.

Estados fijos:

- Creada
- Entregada
- Cancelada

Solo el Administrador podrá cancelar una OS.

Una OS podrá originar como máximo un Proyecto.

## Pagos de OS

Cada OS tendrá un apartado de Pagos con:

- Concepto relacionado.
- Importe.
- Banco / Cuenta.
- Fecha.

El sistema calculará automáticamente:

- Total de la OS.
- Total pagado.
- Saldo pendiente.
- Si el movimiento corresponde a abono o pago total.

Cada pago confirmado generará automáticamente el ingreso financiero correspondiente.

Si Tipo de contratación = Suscripción, se generará automáticamente la Suscripción correspondiente.

El sistema deberá permitir generar y descargar la OS en PDF.

---

# 8. Proyectos

El módulo Proyectos servirá como guía y mecanismo de validación. No será un gestor complejo de tareas.

Un Proyecto:

- solo podrá originarse desde una OS;
- no podrá crearse de manera independiente;
- tendrá como máximo una relación por OS.

Información principal:

- Folio — automático.
- Cliente — heredado.
- OS — heredada y cliqueable.
- Servicio — heredado.
- Descripción — heredada.
- Responsable.
- Fecha de inicio — automática.
- Fecha de entrega — heredada de la OS.
- Conteo de tiempo de entrega — automático.

El Proyecto deberá mostrar permanentemente los días restantes o días de retraso.

## Fases

Las fases se generan dinámicamente a partir del Plan de Desarrollo asociado.

Regla:

- máximo 7 fases por Proyecto.

Cada fase tomará del Plan de Desarrollo:

- Nombre.
- Objetivo.
- Incluye.
- Fecha de inicio — automática.
- Fecha de término — automática.

### Navegación visual de fases

La navegación principal de las fases será mediante un **stepper horizontal** ubicado en la parte superior de la vista del Proyecto.

El stepper mostrará todas las fases del Proyecto en orden y permitirá identificar visualmente:

- fases validadas;
- fase actual;
- fases en validación;
- fases próximas.

El usuario podrá seleccionar directamente cualquier fase desde el stepper para consultar su información.

No será necesario utilizar botones independientes de Anterior / Siguiente.

### Vista de la fase seleccionada

Debajo del stepper se mostrará una sola tarjeta correspondiente a la fase seleccionada.

La tarjeta deberá mostrar siempre:

- número de fase dentro del total;
- Nombre de la fase;
- Objetivo;
- Fecha de inicio cuando exista;
- Fecha de término cuando exista;
- acción correspondiente a la fase.

El contenido **Incluye** estará disponible mediante una sección desplegable, por ejemplo:

**Ver qué incluye**

Al desplegarla se mostrará el contenido completo definido en el Plan de Desarrollo.

El objetivo es mantener la información disponible sin saturar visualmente la pantalla.

### Información general visible del Proyecto

Por encima del stepper deberá mostrarse siempre:

- Fecha de entrega.
- Días restantes para la entrega.

Si la fecha ya venció, deberá mostrarse:

- Fecha de entrega.
- Días de retraso.

### Representación visual del avance

La navegación deberá comunicar el avance sin depender de una tabla adicional de estados.

Referencias visuales:

- **Validado** — fase terminada y aprobada.
- **En validación** — enviada y pendiente de revisión.
- **Fase actual** — disponible para trabajo.
- **Próxima** — aún no trabajada.

### Flujo de fase

1. Creada.
2. El Programador realiza el trabajo.
3. Botón **Enviar a validar**.
4. Queda en espera de validación.
5. El responsable superior valida.
6. La fase muestra **Validado**.

Una vez validada:

- deja de mostrarse el botón Enviar a validar;
- se muestra la fecha de término automática.

Si no se valida, podrá devolverse con observación para corrección.

Las evidencias serán opcionales.

El Proyecto se considera terminado cuando todas sus fases estén validadas.

---

# 9. Suscripciones

Solo pueden generarse desde una OS con Tipo de contratación = Suscripción.

No pueden crearse de forma independiente.

Toda Suscripción será indefinida mientras esté Activa. Los ciclos se seguirán generando hasta su cancelación.

Heredará:

- Cliente.
- Servicio.
- Precio.
- Periodicidad.
- Fecha de inicio.

Estatus general:

- Activa
- Cancelada

La periodicidad define cada cuánto se genera un nuevo ciclo.

Ejemplos:

- Mensual → 1 mes.
- Bimestral → 2 meses.
- Trimestral → 3 meses.
- Semestral → 6 meses.
- Anual → 12 meses.

Cada ciclo deberá relacionar:

- Periodo.
- Importe.
- Fecha de corte.
- Fecha límite de pago.
- Situación de pago.

Regla de corte:

- Corte: último día del mes correspondiente.
- Plazo de pago: 5 días naturales posteriores al corte.
- Después del plazo, si no está pagado, se considera vencido.

Situaciones automáticas:

- Pendiente.
- Por pagar.
- Vencido.
- Pagado.

Los pagos de Suscripción generarán automáticamente el ingreso financiero correspondiente.

El módulo deberá permitir filtros por Cliente, Servicio, Periodicidad, estatus, situación de pago y periodo.

---

# 10. Bancos / Cuentas

Campos:

- Nombre de la cuenta.
- Banco.
- Tipo:
  - Fiscal
  - No fiscal
- Saldo inicial.
- Estatus:
  - Activa
  - Inactiva

El saldo será calculado automáticamente con saldo inicial + ingresos - egresos.

---

# 11. Ingresos y Egresos manuales

Se utilizará para movimientos que no provengan automáticamente de OS, Suscripción o Cuenta por Pagar.

Campos:

- Tipo:
  - Ingreso
  - Egreso
- Concepto.
- Categoría.
- Importe.
- Banco / Cuenta.
- Fecha del movimiento — automática al registrar y editable.

Si Tipo = Ingreso utilizará Catálogo de Ingresos.

Si Tipo = Egreso utilizará Catálogo de Egresos.

Ambos catálogos tendrán carga rápida.

---

# 12. Cuentas por Pagar

Campos:

- Concepto.
- Proveedor / Acreedor — catálogo con carga rápida.
- Categoría — Catálogo de Egresos con carga rápida.
- Importe.
- Fecha de vencimiento.
- Saldo — automático.
- Situación — automática.

Situaciones:

- Pendiente.
- Parcial.
- Pagada.
- Vencida.

Acción **Registrar pago**:

- Importe.
- Banco / Cuenta.
- Fecha.

El sistema determinará automáticamente abono o pago total y generará el Egreso correspondiente.

---

# 13. Flujo Financiero

Filtro principal:

- Mes.

Indicadores:

- Total de ingresos.
- Total de egresos.
- Saldo acumulado.
- Flujo del mes.

Flujo del mes = Ingresos del mes - Egresos del mes.

---

# 14. Reporte Financiero

Filtros combinables:

- Periodo / mes.
- Tipo:
  - Ingreso
  - Egreso
  - Ambos
- Categoría.
- Banco / Cuenta.

Los resultados y totales deberán actualizarse en tiempo real.

Detalle:

- Fecha.
- Tipo.
- Concepto.
- Categoría.
- Banco / Cuenta.
- Importe.

Totales:

- Total de ingresos.
- Total de egresos.
- Flujo neto.
- Saldo acumulado.

Exportación:

- todos los resultados filtrados;
- únicamente registros seleccionados.

Formatos:

- Excel.
- PDF.

---

# 15. Facturación

Una Factura podrá originarse desde:

- Orden de Servicio.
- Suscripción.
- Captura manual independiente.

Captura manual mínima:

- Cliente — carga rápida.
- Concepto.
- Importe.
- Datos fiscales requeridos.

Si el Cliente ya cuenta con datos fiscales, se heredarán. Si faltan, se solicitarán.

Proceso:

1. Crear factura.
2. Generar vista previa.
3. Revisar y corregir.
4. Timbrar.
5. Descargar PDF/XML.
6. Cancelar cuando exista permiso.

Estados:

- Borrador.
- Timbrada.
- Cancelada.
- Error.

Mientras esté en Borrador podrá editarse.

Una Factura timbrada no podrá modificarse directamente.

---

# 16. Catálogos

## Servicios

- Nombre del servicio.
- Tipo de contratación:
  - Por evento
  - Suscripción
- Periodicidad — cuando sea Suscripción.
- Precio base.
- Estatus:
  - Activo
  - Inactivo

## Periodicidades

- Nombre.
- Intervalo en meses.
- Estatus:
  - Activo
  - Cancelado

Ejemplos:

- Mensual → 1
- Bimestral → 2
- Trimestral → 3
- Semestral → 6
- Anual → 12

## Condiciones de pago

- Nombre.
- Descripción — opcional.
- Estatus:
  - Activo
  - Cancelado

## Catálogo de Ingresos

- Nombre.

## Catálogo de Egresos

- Nombre.

## Proveedores / Acreedores

- Nombre.

Ingresos, Egresos y Proveedores permitirán carga rápida.

Los estados de Oportunidad, Cotización y OS no serán catálogos.

---

# 17. Usuarios y Roles

Roles iniciales:

- Administrador
- Vendedor
- Programador

Campos de Usuario:

- Nombre.
- Correo.
- Rol.
- Estatus:
  - Activo
  - Inactivo

El Administrador podrá configurar qué módulos tiene habilitados cada Rol.

Accesos por defecto:

### Administrador
Todos los módulos.

### Vendedor
- Clientes.
- Oportunidades.
- Cotizaciones.
- Órdenes de Servicio.
- Consulta de Proyectos.
- Consulta de Suscripciones relacionadas con su operación.

### Programador
- Proyectos.
- Consulta de OS relacionadas con sus Proyectos.

Reglas especiales:

- solo Administrador puede cancelar Cotizaciones;
- solo Administrador puede cancelar OS;
- Programador puede enviar fases a validar;
- la validación definitiva corresponde inicialmente al Administrador.

---

# 18. Folios

Folios automáticos sugeridos:

- Cliente: CLI-000001
- Oportunidad: OPO-000001
- Cotización: COT-000001
- Orden de Servicio: OS-000001
- Proyecto: PRY-000001
- Suscripción: SUS-000001
- Cuenta por Pagar: CXP-000001
- Factura: FAC-000001

Reglas:

- sin año;
- consecutivo continuo;
- generación automática.

---

# 19. Búsqueda y filtros

Los listados deberán permitir búsqueda por folio y Cliente cuando aplique.

Cada módulo podrá añadir filtros basados en sus campos principales.

Suscripciones y Reporte Financiero deberán incluir expresamente los filtros definidos en este Discovery.

---

# 20. Documentos y exportaciones

Documentos formales:

- Cotización → PDF.
- Orden de Servicio → PDF.
- Factura → PDF y XML después de timbrar.

Reporte Financiero:

- exportación de todos los resultados filtrados;
- exportación de registros seleccionados;
- Excel;
- PDF.

---

# 21. Flujo general

Flujo comercial:

Cliente → Oportunidad → Cotización → Orden de Servicio

También son válidos:

Cliente → Cotización → OS

Cliente → OS

Desde OS:

- OS → Proyecto → Fases dinámicas → Validación
- OS → Suscripción → Ciclos → Pagos

Finanzas:

- Pago de OS → Ingreso
- Pago de Suscripción → Ingreso
- Movimiento manual → Ingreso / Egreso
- Cuenta por Pagar → Pago → Egreso

Facturación:

OS / Suscripción / Manual → Vista previa → Timbrar → PDF/XML

---

# 22. Fuera de alcance inicial

- Comisiones.
- Contabilidad general completa.
- Inventarios.
- Nómina.
- Cuentas por cobrar como módulo independiente.
- Reportes comerciales avanzados.
- Reportes de Proyectos avanzados.
- Reporte separado de Suscripciones.
- Gestor complejo de tareas dentro de Proyectos.
- Estados configurables para Oportunidad, Cotización u OS.

---

# 23. Criterio general de aceptación

La primera versión deberá permitir:

1. Registrar Clientes.
2. Gestionar Oportunidades.
3. Generar Cotizaciones.
4. Autorizar Cotizaciones y convertirlas en OS.
5. Crear OS directamente.
6. Registrar pagos de OS.
7. Generar Proyectos y validar sus fases.
8. Generar y administrar Suscripciones.
9. Administrar Bancos y movimientos.
10. Registrar Ingresos / Egresos manuales.
11. Registrar y pagar Cuentas por Pagar.
12. Consultar Flujo Financiero.
13. Filtrar y exportar Reportes Financieros.
14. Generar Facturas con vista previa y timbrado.
15. Generar PDFs de Cotización y OS.
16. Administrar Catálogos.
17. Administrar Usuarios, Roles y accesos por módulo.

---

# 24. Estado

**Documento:** Discovery VectorIA  
**Versión:** 1.0  
**Estado:** Consolidado para generación del Plan de Desarrollo
