# VectorIA
# Plan de Desarrollo v1.0

**Documento base:** Discovery VectorIA v1.0  
**Regla:** máximo 7 fases  
**Objetivo:** dividir la construcción en bloques amplios para evitar microfases y permitir una validación sencilla dentro de VectorIA.

---

# Principio

Este Plan de Desarrollo será utilizado por:

- VectorIA, para generar dinámicamente las fases del Proyecto;
- Cursor, para comprender el orden de construcción.

No deben convertirse tareas técnicas pequeñas en fases independientes.

---

# Fase 1 — Base del sistema, usuarios y catálogos

## Objetivo

Crear la base funcional común necesaria para los módulos posteriores.

## Incluye

- estructura base de la aplicación;
- autenticación;
- Usuarios;
- Roles:
  - Administrador;
  - Vendedor;
  - Programador;
- permisos configurables por módulo;
- accesos por defecto;
- folios automáticos;
- auditoría mínima;
- Catálogos:
  - Servicios;
  - Periodicidades;
  - Condiciones de pago;
  - Ingresos;
  - Egresos;
  - Proveedores / Acreedores;
- reglas de carga rápida.

## Validación de salida

La aplicación permite iniciar sesión y administrar usuarios, permisos y catálogos básicos.

---

# Fase 2 — Clientes y Oportunidades

## Objetivo

Construir el inicio del flujo comercial.

## Incluye

### Clientes

- alta;
- edición;
- contacto opcional;
- celular;
- correo;
- datos fiscales desplegables;
- carga rápida.

### Oportunidades

- alta;
- vendedor heredado;
- Servicio;
- Descripción;
- Bitácora opcional;
- estados:
  - Abierta;
  - Cotizada;
  - No interesado;
- creación de Cotización desde Oportunidad.

## Validación de salida

Es posible registrar un Cliente, crear una Oportunidad y convertirla en Cotización heredando la información disponible.

---

# Fase 3 — Cotizaciones y Órdenes de Servicio

## Objetivo

Completar el flujo comercial hasta la formalización del servicio.

## Incluye

### Cotizaciones

- creación directa o desde Oportunidad;
- herencias;
- Servicio;
- Tipo de contratación;
- Periodicidad;
- Precio;
- Tiempo de entrega;
- Condiciones de pago;
- Observaciones;
- estados fijos;
- autorización;
- rechazo;
- cancelación administrativa;
- relación cliqueable con Oportunidad y OS;
- PDF.

### Órdenes de Servicio

- creación directa o desde Cotización;
- herencias;
- campos definidos en Discovery;
- estados fijos;
- cancelación administrativa;
- referencia cliqueable a Cotización;
- PDF;
- apartado de Pagos;
- cálculo de abono / pago total;
- saldo automático.

## Validación de salida

Es posible recorrer:

Cliente → Oportunidad → Cotización → OS

y también crear Cotización u OS directamente.

Los pagos de OS generan el ingreso financiero correspondiente.

---

# Fase 4 — Proyectos y Suscripciones

## Objetivo

Construir los dos flujos operativos que nacen desde una Orden de Servicio.

## Incluye

### Proyectos

- creación únicamente desde OS;
- máximo un Proyecto por OS;
- información heredada;
- Responsable;
- fecha de inicio automática;
- fecha de entrega;
- contador de días restantes / atraso;
- generación dinámica de fases desde Plan de Desarrollo;
- máximo 7 fases;
- nombre de fase;
- fechas automáticas;
- acción Enviar a validar;
- validación superior;
- observaciones de devolución;
- evidencia opcional.

### Suscripciones

- creación automática desde OS de tipo Suscripción;
- duración indefinida mientras esté Activa;
- Periodicidad;
- generación cronológica de ciclos;
- corte de fin de mes;
- 5 días naturales para pago;
- identificación de Pendiente / Por pagar / Vencido / Pagado;
- cancelación;
- filtros de seguimiento;
- pagos con generación de ingreso financiero.

## Validación de salida

Una OS puede generar correctamente un Proyecto y, cuando corresponda por el tipo de contratación, también una Suscripción. Ambos pueden operarse con la lógica definida.

---

# Fase 5 — Finanzas

## Objetivo

Construir el control financiero básico y centralizar los movimientos generados por otros módulos.

## Incluye

### Bancos / Cuentas

- alta;
- Fiscal / No fiscal;
- saldo inicial;
- saldo calculado.

### Ingresos / Egresos manuales

- tipo;
- concepto;
- categoría;
- importe;
- Banco / Cuenta;
- fecha;
- carga rápida de categorías.

### Cuentas por Pagar

- Concepto;
- Proveedor;
- Categoría;
- Importe;
- vencimiento;
- saldo;
- Pendiente / Parcial / Pagada / Vencida;
- Registrar pago;
- abono / pago total automático;
- generación de Egreso.

### Integraciones financieras

- pago de OS → Ingreso;
- pago de Suscripción → Ingreso;
- pago de CxP → Egreso;
- movimiento manual → Ingreso / Egreso.

### Flujo Financiero

- filtro por mes;
- Total ingresos;
- Total egresos;
- Flujo del mes;
- Saldo acumulado.

## Validación de salida

Los movimientos provenientes de OS, Suscripciones, Cuentas por Pagar y capturas manuales alimentan correctamente Bancos y Flujo Financiero.

---

# Fase 6 — Facturación y Reporte Financiero

## Objetivo

Completar la salida fiscal y las herramientas de consulta financiera.

## Incluye

### Facturación

- origen desde OS;
- origen desde Suscripción;
- creación manual independiente;
- Cliente con carga rápida;
- datos fiscales;
- vista previa;
- edición en Borrador;
- timbrado;
- estados:
  - Borrador;
  - Timbrada;
  - Cancelada;
  - Error;
- descarga PDF;
- descarga XML;
- cancelación según permiso.

### Reporte Financiero

Filtros combinables:

- periodo / mes;
- Ingreso / Egreso / Ambos;
- Categoría;
- Banco / Cuenta.

Totales en tiempo real:

- Total ingresos;
- Total egresos;
- Flujo neto;
- Saldo acumulado.

Exportación:

- todos los resultados filtrados;
- únicamente registros seleccionados;
- Excel;
- PDF.

## Validación de salida

Es posible generar una Factura desde sus tres orígenes y consultar/exportar movimientos financieros aplicando filtros combinados.

---

# Fase 7 — Integración y validación final

## Objetivo

Comprobar que el sistema completo funciona como una sola operación.

## Flujos principales a validar

### Comercial

Cliente → Oportunidad → Cotización → OS

### Flujo directo

Cliente → Cotización → OS

Cliente → OS

### Proyecto

OS → Proyecto → Fases → Enviar a validar → Validado

### Suscripción

OS → Suscripción → Ciclos → Pago → Ingreso

### Finanzas

OS / Suscripción → Pago → Banco

Movimiento manual → Banco

Cuenta por Pagar → Pago → Egreso

### Facturación

OS / Suscripción / Manual → Vista previa → Timbrar → PDF/XML

## Revisión final

- permisos por Rol;
- restricciones especiales de Administrador;
- folios;
- relaciones cliqueables;
- carga rápida;
- cálculos;
- saldos;
- fechas;
- vencimientos;
- PDFs;
- exportaciones;
- auditoría mínima;
- comportamiento en errores;
- integración entre módulos.

## Validación de salida

No existen errores críticos conocidos y los principales flujos definidos en Discovery funcionan de principio a fin.

---

# Regla de avance

Cada fase deberá:

1. desarrollarse;
2. probarse técnicamente;
3. probarse funcionalmente;
4. enviarse a validar desde VectorIA;
5. quedar validada o regresar con observaciones.

El Plan no deberá subdividirse en más de 7 fases.

---

# Estado

**Documento:** Plan de Desarrollo VectorIA  
**Versión:** 1.0  
**Fases:** 7  
**Estado:** Listo para utilizarse en VectorIA y Cursor
