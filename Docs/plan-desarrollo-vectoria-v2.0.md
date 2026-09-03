# VectorIA
# Plan de Desarrollo v2.0

**Documento rector:** `discovery-vectoria-v1.6-revision-final.md`  
**Destino:** VectorIA + Cursor  
**Máximo de fases:** 7

---

# 1. Relación entre Discovery y Plan de Desarrollo

Este Plan de Desarrollo **depende completamente del Discovery VectorIA v1.6**.

El Discovery define:

- qué debe construir el sistema;
- relaciones entre módulos;
- campos;
- reglas funcionales;
- estados;
- permisos;
- automatizaciones;
- herencias;
- validaciones;
- comportamiento esperado.

El Plan de Desarrollo define únicamente:

- en qué orden construirlo;
- cómo agrupar el trabajo;
- qué debe quedar terminado en cada fase;
- qué revisar antes de avanzar.

## Regla de prioridad

Si existe cualquier diferencia, contradicción o ambigüedad entre este Plan y el Discovery:

**el Discovery tiene prioridad.**

Cursor no deberá modificar una regla funcional del Discovery para adaptarla al Plan.

Si durante el desarrollo Cursor detecta:

- una contradicción;
- una regla incompleta;
- un caso no definido;
- una decisión funcional necesaria;

deberá detenerse y señalarla antes de implementar una solución que cambie el comportamiento funcional.

---

# 2. Instrucciones obligatorias para Cursor

Cursor deberá seguir estas reglas durante todo el proyecto.

## 2.1 Leer primero el Discovery

Antes de comenzar la Fase 1, Cursor deberá leer completamente:

1. `discovery-vectoria-v1.6-revision-final.md`
2. este Plan de Desarrollo.

No deberá comenzar a construir basándose únicamente en el Plan.

## 2.2 Trabajar una sola fase a la vez

Cursor deberá trabajar exclusivamente en la fase actual.

No deberá adelantarse a fases posteriores, aunque técnicamente resulte conveniente, salvo que sea necesario crear una base técnica indispensable para completar correctamente la fase actual.

## 2.3 Detenerse entre fases

Al terminar cada fase, Cursor deberá:

1. detener el desarrollo;
2. ejecutar las pruebas correspondientes;
3. revisar los criterios de salida;
4. informar qué construyó;
5. informar qué probó;
6. informar cualquier pendiente, limitación o decisión relevante;
7. indicar cómo puede validarse funcionalmente la fase.

Después deberá **esperar la revisión del programador / responsable**.

Cursor **no deberá comenzar automáticamente la siguiente fase**.

Solo podrá continuar cuando reciba una instrucción expresa para avanzar.

## 2.4 No asumir aprobación

Que una fase compile, se despliegue o pase pruebas técnicas no significa que esté funcionalmente aprobada.

La secuencia será:

**Construcción → Pruebas de Cursor → Revisión humana → Correcciones si existen → Aprobación → Siguiente fase**

## 2.5 Correcciones dentro de la misma fase

Si durante la revisión aparecen errores o desviaciones:

- deberán corregirse dentro de la fase actual;
- Cursor deberá volver a probar;
- deberá presentar nuevamente el resultado;
- seguirá esperando aprobación.

## 2.6 Respetar relaciones y automatizaciones

Cursor deberá implementar explícitamente las relaciones, reglas de idempotencia, herencias y disparadores automáticos definidos en el Discovery.

No deberá sustituir relaciones persistentes por simples textos visuales.

## 2.7 No duplicar lógica

La lógica financiera, de estados, pagos, ciclos, facturación y relaciones deberá centralizarse para evitar comportamientos distintos entre pantallas.

---

# 3. Principio de construcción

El sistema debe construirse desde las dependencias base hacia los flujos de negocio.

Orden general:

**Base → Comercial → OS/Proyecto/Suscripciones → Finanzas → Facturación/Reportes → Integración final**

Las fases están agrupadas deliberadamente para mantenerse dentro del máximo de 7.

---

# FASE 1 — Base del sistema, usuarios, permisos y catálogos

## Objetivo

Construir la base funcional y de configuración que necesitan todos los módulos posteriores.

## Incluye

### Base de aplicación

- estructura general;
- autenticación;
- navegación;
- manejo de sesión;
- auditoría mínima;
- zona horaria operativa;
- manejo de errores base.

### Usuarios y Roles

Roles iniciales:

- Administrador;
- Vendedor;
- Programador.

Implementar:

- alta y edición de usuarios;
- usuario Activo / Inactivo;
- un Rol por usuario;
- permisos configurables por módulo;
- restricciones especiales definidas en Discovery;
- validación de permisos también en servidor.

### Catálogos

Implementar:

- Servicios;
- Suscripciones / servicios recurrentes;
- Periodicidades;
- Condiciones de pago;
- Categorías de Ingresos;
- Categorías de Egresos;
- Proveedores / Acreedores.

### Servicios

Debe incluir:

- Precio base;
- Categoría de ingreso;
- Genera proyecto;
- Activo / Inactivo.

### Catálogo de Suscripciones

Debe incluir:

- Nombre;
- Descripción opcional;
- Precio base;
- Periodicidad;
- Categoría de ingreso;
- Activo / Inactivo.

### Reglas generales

- carga rápida;
- folios automáticos;
- relaciones persistentes;
- valores históricos no alterados por cambios posteriores en catálogo;
- reglas de Activo / Inactivo;
- auditoría.

## Pruebas mínimas

- autenticación;
- restricciones por Rol;
- permisos de módulo;
- alta rápida;
- catálogos activos/inactivos;
- generación de folios;
- auditoría básica.

## Criterio de salida

La base del sistema está operativa y permite administrar Usuarios, Roles y todos los Catálogos requeridos por las siguientes fases.

## Al finalizar

Cursor deberá detenerse, presentar resultados y esperar revisión.

---

# FASE 2 — Clientes, Oportunidades y Cotizaciones

## Objetivo

Construir el flujo comercial previo a la Orden de Servicio.

## Incluye

### Clientes

- datos básicos;
- contacto opcional;
- celular;
- correo;
- datos fiscales desplegables;
- estructura suficiente para Facturapi;
- carga rápida.

### Oportunidades

- Cliente;
- Vendedor heredado;
- Servicio;
- Descripción;
- Bitácora;
- estados fijos:
  - Abierta;
  - Cotizada;
  - No interesado;
- relación 1 → 0..N Cotizaciones.

### Cotizaciones

Cada Cotización tendrá:

- un único Servicio principal;
- 0..N partidas de Suscripción.

Implementar:

- creación directa;
- creación desde Oportunidad;
- herencias;
- Servicio principal;
- precio;
- tiempo de entrega;
- condiciones de pago;
- observaciones;
- partidas de Suscripción;
- carga rápida;
- estados fijos:
  - Cotizada;
  - Rechazada;
  - Autorizada;
  - Cancelada.

### Documento de Cotización

- PDF;
- descarga;
- envío por correo;
- diferenciación visual entre:
  - Servicio principal;
  - Suscripciones propuestas.

## Reglas críticas

- una Cotización autorizada solo puede generar una OS;
- Rechazada o Cancelada no genera OS;
- reintentos no duplican OS;
- cambios posteriores no alteran registros hijos ya creados;
- creación de primera Cotización cambia Oportunidad a Cotizada.

## Pruebas mínimas

- Cliente → Oportunidad;
- Oportunidad → Cotización;
- varias Cotizaciones en una Oportunidad;
- Cotización con y sin Suscripciones;
- PDF;
- correo;
- autorización idempotente.

## Criterio de salida

El flujo comercial puede llegar hasta una Cotización autorizada correctamente estructurada y lista para generar la OS.

## Al finalizar

Cursor deberá detenerse, presentar resultados y esperar revisión.

---

# FASE 3 — Órdenes de Servicio y Proyectos

## Objetivo

Construir el núcleo operativo de los servicios principales y la generación automática de Proyectos.

## Incluye

### Orden de Servicio

Implementar:

- creación desde Cotización;
- creación directa;
- Cliente;
- Vendedor;
- Programador;
- Servicio principal;
- Descripción;
- Precio;
- Condiciones de pago;
- Fecha de entrega;
- Observaciones;
- estados:
  - Creada;
  - Entregada;
  - Cancelada.

### Herencia desde Cotización

Al crear OS:

- heredar Servicio principal;
- heredar datos disponibles;
- crear Suscripciones propuestas como Pendientes de activación;
- conservar referencias a Cotización.

### Proyecto automático

Si Servicio.Genera proyecto = Sí:

- crear automáticamente un único Proyecto;
- heredar Cliente;
- OS;
- Servicio;
- Descripción;
- Programador;
- Fecha de entrega.

Si Genera proyecto = No:

- no crear Proyecto.

### Importación del Plan `.md`

Implementar:

- carga del archivo;
- validación de formato;
- máximo 7 fases;
- Nombre;
- Objetivo;
- Incluye;
- rechazo de archivo inválido;
- Plan pendiente de importar;
- bloqueo de reemplazo una vez iniciada la primera fase.

### Navegación de Proyecto

- stepper horizontal;
- fase actual;
- Validada;
- En validación;
- Disponible;
- Bloqueada;
- tarjeta de fase;
- Objetivo visible;
- Incluye desplegable;
- fechas automáticas;
- días restantes / atraso.

### Avance de fases

- desbloqueo secuencial;
- no saltar fases;
- permitir avanzar a la siguiente sin validación únicamente con advertencia;
- devolución con observaciones;
- fase posterior no vuelve a bloquearse automáticamente si ya fue desbloqueada;
- Proyecto terminado solo con todas las fases Validadas.

### Documento OS

- PDF;
- descarga;
- envío por correo;
- mostrar Servicio principal;
- mostrar Suscripciones relacionadas existentes.

## Reglas críticas

- una OS → máximo un Proyecto;
- Programador y Fecha de entrega se sincronizan con Proyecto;
- idempotencia de creación de Proyecto;
- cambios no pueden romper relaciones ya creadas.

## Pruebas mínimas

- OS directa;
- OS desde Cotización;
- Servicio que genera Proyecto;
- Servicio que no genera Proyecto;
- importación Plan válido/inválido;
- stepper;
- desbloqueo;
- validación;
- avance con advertencia;
- PDF/correo.

## Criterio de salida

Las OS funcionan como centro del servicio principal y los Proyectos pueden operar completo su flujo de fases.

## Al finalizar

Cursor deberá detenerse, presentar resultados y esperar revisión.

---

# FASE 4 — Suscripciones, ciclos y cobranza

## Objetivo

Construir toda la lógica recurrente dependiente de las Órdenes de Servicio.

## Incluye

### Creación de Suscripciones

Desde Cotización:

- crear junto con OS;
- Estado inicial = Pendiente de activación.

Desde OS:

- + Nueva suscripción;
- Estado inicial = Pendiente de activación.

Una OS puede tener 0..N Suscripciones.

### Activación

Desde OS:

- Activar individual;
- Activar todas.

Al activar:

- registrar Fecha de activación;
- pasar a Activa;
- crear primer Ciclo;
- comenzar programación futura.

### Estado del servicio

- Pendiente de activación;
- Activa;
- Pausada;
- Cancelada.

Implementar únicamente transiciones válidas del Discovery.

### Situación de cobranza

- Al corriente;
- Vencida;
- Suspendida por adeudo.

Debe funcionar de manera independiente al Estado del servicio.

### Ciclos

Implementar:

- Periodicidad;
- creación del primer Ciclo;
- generación de Ciclos futuros;
- sin prorrateo automático;
- corte fin de mes;
- vencimiento día 5;
- saldos independientes por Ciclo;
- estados automáticos;
- varios meses adeudados.

### Pausa

Pausada:

- no crea nuevos Ciclos;
- no crea nuevos cargos;
- conserva adeudos;
- permite pagos;
- conserva historial.

### Suspensión por adeudo

- solo desde Vencida;
- manual;
- no detiene Ciclos ni cargos si Estado del servicio sigue Activa.

### Pagos de Suscripción

- registro desde detalle;
- registro desde OS;
- mismo formulario;
- aplicación al adeudo más antiguo;
- distribución entre Ciclos;
- límite al saldo pendiente;
- genera Ingreso con origen Suscripción;
- usa Categoría de ingreso de la Suscripción.

### Convenio

- Pago real;
- Ajuste por convenio;
- confirmación;
- regularización;
- el Ajuste no es Ingreso;
- conserva historial.

### Vista de Suscripción

- detalle;
- OS;
- Cliente;
- Estado del servicio;
- Situación de cobranza;
- saldo vencido;
- total pendiente;
- meses/ciclos adeudados;
- historial de ciclos;
- historial de pagos.

### Filtros

Predeterminado:

- Vencidas;
- Suspendidas por adeudo.

También:

- Activas;
- Pausadas;
- Pendientes;
- Canceladas;
- Todas.

## Reglas críticas

- Suscripción nunca genera Proyecto;
- Pending/Pausada no genera nuevos Ciclos;
- Suspendida por adeudo sí puede seguir generándolos;
- un Ciclo generado nunca se elimina por pausa o cancelación;
- idempotencia de generación de Ciclos.

## Pruebas mínimas

- herencia desde Cotización;
- creación desde OS;
- Activar;
- Activar todas;
- ciclos mensual/anual;
- pausa/reactivación;
- vencimiento;
- suspensión por adeudo;
- varios meses;
- pago parcial;
- pago multicíclo;
- convenio.

## Criterio de salida

Las Suscripciones funcionan completamente desde creación hasta cobranza, incluyendo deuda acumulada y pausas.

## Al finalizar

Cursor deberá detenerse, presentar resultados y esperar revisión.

---

# FASE 5 — Finanzas, pagos y Cuentas por Cobrar/Pagar

## Objetivo

Centralizar correctamente el flujo real de dinero sin mezclar Venta, Factura y Pago.

## Incluye

### Bancos / Cuentas

- alta;
- Fiscal / No fiscal;
- saldo inicial;
- Activa / Inactiva;
- saldo calculado.

### Pagos de OS

Los pagos de OS aplican únicamente al Servicio principal.

Implementar:

- importe;
- Banco / Cuenta;
- fecha;
- saldo OS;
- abono o liquidación;
- límite al saldo pendiente;
- Ingreso automático;
- Categoría de ingreso del Servicio;
- referencia a OS.

### Separación OS / Suscripción

Regla obligatoria:

**Pago OS → Servicio principal**

**Pago Suscripción → Ciclo(s) de Suscripción**

Nunca cruzar saldos.

### Movimientos manuales

- Ingreso / Egreso;
- Concepto;
- Categoría;
- Importe;
- Banco / Cuenta;
- Fecha.

### Movimientos automáticos

Generados por:

- Pago OS;
- Pago Suscripción;
- Pago CxP.

Implementar:

- relación 1:1 Pago → Movimiento;
- origen;
- referencia;
- no edición independiente;
- corrección desde registro origen;
- no duplicación manual.

### Cuentas por Pagar

- Proveedor;
- Concepto;
- Categoría;
- Importe;
- vencimiento;
- saldo;
- estados automáticos;
- pagos parciales/totales;
- Egreso automático.

### Flujo Financiero

Fichas:

1. Total de ingresos.
2. Total de egresos.
3. Saldo acumulado.
4. Flujo del mes.
5. Ventas totales del mes.
6. Total de Cuentas por Cobrar.

### Ventas totales

Incluye:

- Servicio principal de OS creadas en el mes y no Canceladas;
- Ciclos de Suscripción generados en el mes.

No depende de cobros ni Facturas.

### Cuentas por Cobrar

Consolidar:

- saldo pendiente de Servicio principal de OS;
- saldos vencidos de Ciclos de Suscripción.

Mostrar listado breve y referencias cliqueables.

## Reglas críticas

- facturación no afecta Ingreso;
- Ingreso existe únicamente por dinero recibido;
- Ajuste por convenio no es Ingreso;
- movimientos automáticos son idempotentes;
- saldos OS/Suscripción permanecen separados.

## Pruebas mínimas

- pagos OS;
- pagos Suscripción;
- movimientos manuales;
- CxP parcial/vencida/pagada;
- saldo Banco;
- Flujo mensual;
- Ventas del mes;
- Cuentas por Cobrar.

## Criterio de salida

Todo movimiento de dinero tiene origen identificable y los saldos financieros coinciden con los registros operativos.

## Al finalizar

Cursor deberá detenerse, presentar resultados y esperar revisión.

---

# FASE 6 — Facturación, correo y Reporte Financiero

## Objetivo

Completar la operación fiscal y las herramientas de análisis financiero.

## Incluye

### Facturapi

Configurar integración para:

- timbrado;
- cancelación;
- PDF;
- XML.

Usar directamente documentos y formatos de Facturapi.

### SendGrid

Configurable desde sistema:

- activo/inactivo;
- remitente;
- nombre remitente;
- API Key;
- asunto base;
- texto base.

### Facturación manual

Desde:

- OS;
- Suscripción;
- captura independiente.

Implementar:

- datos fiscales;
- vista previa;
- Borrador;
- Timbrar;
- PDF/XML;
- envío por correo.

### Facturación automática

Aplica únicamente a Suscripciones.

Requisitos:

- Facturación automática habilitada;
- Estado del servicio Activa;
- datos fiscales válidos;
- correo válido.

Regla:

- facturar Ciclo el día 1 del mes siguiente al corte;
- máximo una Factura automática Timbrada por Ciclo;
- no facturar retroactivamente Ciclos previos al activar automatización;
- Factura manual vinculada al Ciclo impide duplicado automático.

### Estados separados

Estado fiscal:

- Borrador;
- Timbrada;
- Cancelada;
- Error de timbrado.

Estado de envío:

- Pendiente;
- Enviado;
- Error.

### Errores y reintentos

- reintentar etapa fallida;
- no volver a timbrar si ya se timbró;
- si falla correo, reintentar solo correo;
- conservar detalle del error.

### Independencia

Mantener separados:

- Venta;
- Factura;
- Pago;
- Cuenta por Cobrar.

### Reporte Financiero

Filtros combinables:

- periodo;
- Ingreso/Egreso/Ambos;
- Categoría;
- Banco / Cuenta.

Detalle:

- Fecha;
- Tipo;
- Concepto;
- Categoría;
- Banco;
- Importe;
- Origen;
- Referencia.

Totales en tiempo real.

Exportación:

- filtrados;
- seleccionados;
- Excel;
- PDF.

## Pruebas mínimas

- Factura manual;
- Factura automática;
- Facturapi;
- PDF/XML;
- SendGrid;
- fallo timbrado;
- fallo correo;
- reintentos;
- duplicados;
- filtros financieros;
- exportaciones.

## Criterio de salida

Facturación, envío de documentos y reportes financieros funcionan sin duplicar documentos ni movimientos.

## Al finalizar

Cursor deberá detenerse, presentar resultados y esperar revisión.

---

# FASE 7 — Integración funcional y validación final

## Objetivo

Validar el sistema completo de extremo a extremo antes de considerarlo terminado.

## Incluye

### Flujo comercial completo

Cliente  
→ Oportunidad  
→ Cotización  
→ OS

Validar también:

- Cliente → Cotización → OS;
- Cliente → OS.

### Proyecto

OS  
→ Proyecto automático  
→ Importar Plan  
→ Fases  
→ Validación

### Suscripciones

Cotización / OS  
→ Pendiente de activación  
→ Activa  
→ Ciclos  
→ Pago / Convenio  
→ Vencida / Suspensión / Pausa

### Finanzas

OS / Suscripciones / CxP  
→ Pagos  
→ Movimientos  
→ Bancos  
→ Flujo Financiero  
→ Cuentas por Cobrar

### Facturación

Suscripción  
→ Ciclo  
→ Factura automática  
→ Facturapi  
→ PDF/XML  
→ SendGrid

### Documentos

Validar:

- Cotización PDF/correo;
- OS PDF/correo;
- Factura PDF/XML/correo;
- Reporte Excel/PDF.

### Seguridad y permisos

Revisar:

- módulos por Rol;
- restricciones de Administrador;
- validación en servidor.

### Integridad

Probar expresamente:

- reintentos;
- acciones dobles;
- recarga de páginas;
- creación de duplicados;
- cambios en Catálogos;
- cancelaciones;
- relaciones históricas;
- saldos.

## Criterio de salida

Todos los flujos principales del Discovery funcionan de principio a fin y no existen desviaciones funcionales críticas conocidas.

## Al finalizar

Cursor deberá:

1. detenerse;
2. presentar el resultado global;
3. listar pruebas ejecutadas;
4. listar cualquier pendiente;
5. esperar la validación final del responsable.

---

# 4. Formato de cierre obligatorio de cada fase para Cursor

Al terminar cada fase, Cursor deberá responder utilizando una estructura equivalente a:

## Fase terminada

**Fase:** [nombre]

### Construido

- ...
- ...

### Pruebas realizadas

- ...
- ...

### Cómo validar

1. ...
2. ...
3. ...

### Pendientes o advertencias

- Ninguno.

o, si existen:

- ...

### Estado

**Listo para revisión.**

**No continuaré con la siguiente fase hasta recibir autorización expresa.**

---

# 5. Regla final para Cursor

Este Plan organiza el trabajo, pero **no sustituye al Discovery**.

Ante cualquier duda funcional:

1. consultar el Discovery;
2. aplicar la regla del Discovery;
3. si el Discovery no resuelve el caso, detenerse;
4. solicitar definición antes de inventar comportamiento.

Cursor no deberá completar huecos funcionales importantes tomando decisiones de negocio por su cuenta.

---

# Estado

**Documento:** Plan de Desarrollo VectorIA  
**Versión:** 2.0  
**Discovery requerido:** v1.6 revisión final  
**Número de fases:** 7  
**Estado:** Listo para ejecución controlada con Cursor
