# VectorIA
# Discovery VectorIA v1.6

## 1. Objetivo

Desarrollar un sistema web interno para VectorIA que concentre de forma simple el proceso comercial, la ejecución de proyectos, las suscripciones, las finanzas y la facturación.

El sistema debe priorizar simplicidad, rapidez de captura, trazabilidad, mínima duplicidad de información, automatización de datos heredados y control financiero práctico.

Este documento sustituye a la antigua Definición Funcional como documento principal de Discovery del proyecto.

---

# 2. Reglas generales

## 2.1 Obligatoriedad y edición

- Todo campo capturado será obligatorio salvo que se indique expresamente como opcional.
- Los campos automáticos o calculados no requieren captura manual.
- Los registros podrán editarse mientras la modificación no rompa relaciones, saldos, documentos timbrados o historial.
- Una Factura timbrada nunca se modifica directamente.
- Cuando un registro ya haya generado registros dependientes, cualquier cambio deberá respetar las reglas de integridad definidas en este Discovery.

## 2.2 Carga rápida

Cuando un campo indique **carga rápida**, podrá crearse el registro relacionado sin abandonar la pantalla actual.

El registro creado:

- se guarda en su catálogo o módulo correspondiente;
- queda disponible inmediatamente en el selector actual;
- no obliga al usuario a reiniciar la captura.

## 2.3 Relaciones e herencias

- Toda relación funcional deberá guardarse mediante una referencia explícita entre registros, no únicamente mediante texto copiado.
- Las referencias visibles deberán ser cliqueables cuando exista una vista de detalle relacionada.
- Cuando un registro hijo se crea a partir de otro, los datos heredados se copian como valores iniciales y además se conserva la referencia al registro origen.
- Los cambios posteriores en un catálogo no modifican retroactivamente Cotizaciones, OS, Suscripciones, movimientos o documentos ya creados.
- Los cambios posteriores en una Cotización no deberán modificar automáticamente una OS ya creada.
- Los cambios posteriores en partidas de Suscripción de una Cotización no deberán modificar Suscripciones ya creadas desde esa Cotización.

## 2.4 Integridad e idempotencia

Toda acción que cree automáticamente otro registro deberá ser **idempotente**.

Esto significa que repetir la acción, recargar la pantalla o reintentar un proceso no puede crear duplicados.

Aplica especialmente a:

- Cotización autorizada → OS.
- OS con Servicio que genera Proyecto → Proyecto.
- Cotización → Suscripciones heredadas.
- Generación de ciclos de Suscripción.
- Ciclo → Factura automática.
- Pago → Movimiento financiero.
- Pago de Cuenta por Pagar → Egreso.

## 2.5 Historial

Los registros con historial operativo no deberán eliminarse físicamente.

Cuando aplique se utilizarán estados, cancelación, inactivación o registros de reversa.

## 2.6 Auditoría mínima

El sistema conservará al menos:

- usuario que creó;
- usuario que modificó;
- usuario que canceló, cuando aplique;
- usuario que activó, pausó, reactivó o suspendió una Suscripción, cuando aplique;
- usuario que registró un pago;
- usuario que aplicó un Convenio;
- usuario que envió una fase a validar;
- usuario que validó o devolvió una fase;
- fecha y hora de las acciones relevantes.

## 2.7 Fechas y zona horaria

Las reglas automáticas de:

- cortes;
- vencimientos;
- generación de ciclos;
- facturación automática;

se calcularán utilizando la zona horaria operativa del sistema.

Valor inicial:

**America/Mexico_City**

La zona horaria podrá configurarse desde Configuración.

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
15. Configuración

Comisiones queda fuera del alcance inicial.

---

# 3.1 Modelo de relaciones funcionales

Estas cardinalidades deberán respetarse en el modelo de datos.

| Origen | Relación | Destino |
|---|---|---|
| Cliente | 1 → N | Oportunidades |
| Cliente | 1 → N | Cotizaciones |
| Cliente | 1 → N | Órdenes de Servicio |
| Oportunidad | 1 → 0..N | Cotizaciones |
| Cotización | 1 → 0..1 | Orden de Servicio |
| Cotización | 1 → 0..N | Partidas de Suscripción propuestas |
| Orden de Servicio | 1 → 0..1 | Proyecto |
| Orden de Servicio | 1 → 0..N | Suscripciones |
| Orden de Servicio | 1 → 0..N | Pagos de Servicio principal |
| Proyecto | 1 → 1..7 | Fases después de importar Plan |
| Suscripción | N → 1 | Orden de Servicio |
| Suscripción | 1 → 0..N | Ciclos |
| Suscripción | 1 → 0..N | Pagos |
| Ciclo de Suscripción | N → 1 | Suscripción |
| Ciclo de Suscripción | 1 → 0..1 | Factura automática |
| Banco / Cuenta | 1 → N | Movimientos financieros |
| Cuenta por Pagar | 1 → 0..N | Pagos |
| Pago de OS / Suscripción / CxP | 1 → 1 | Movimiento financiero generado automáticamente |

Reglas:

- una Cotización autorizada solo puede generar **una OS**;
- una OS solo puede generar **un Proyecto**;
- una OS puede tener **varias Suscripciones**;
- una Suscripción pertenece siempre a **una sola OS**;
- un Proyecto pertenece siempre a **una sola OS**;
- una Factura automática de Suscripción deberá conservar referencia al Ciclo que la originó.

---

# 4. Clientes

Campos:

- Folio — automático.
- Nombre del cliente — persona o empresa.
- Contacto — opcional; únicamente cuando el cliente sea empresa.
- Celular.
- Correo.
- Datos fiscales — opcionales y dentro de un apartado desplegable.

Los Datos fiscales deberán almacenar la información necesaria para construir una Factura válida conforme a los requerimientos de **Facturapi**.

Reglas:

- pueden permanecer incompletos si el Cliente no requiere facturación;
- antes de habilitar Facturación automática deberán validarse como completos;
- la información fiscal usada para una Factura Timbrada queda conservada en la Factura y no cambia si posteriormente se editan los datos del Cliente.

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

- Abierta → Cotizada: al generar la primera Cotización relacionada; se heredan datos disponibles y se solicitan solo los faltantes.
- Abierta → No interesado: cuando el cliente indica que no desea continuar.

Reglas:

- una Oportunidad pertenece a un solo Cliente;
- puede tener una o más Cotizaciones relacionadas;
- crear Cotizaciones adicionales no deberá duplicar ni modificar Cotizaciones anteriores;
- No interesado es un estado terminal para seguimiento activo, pero conserva el historial.

---

# 6. Cotizaciones

Puede crearse desde una Oportunidad o directamente desde su módulo.

## Servicio principal

Cada Cotización tendrá **un solo Servicio principal**.

Campos principales:

- Folio — automático.
- Cliente — carga rápida.
- Oportunidad relacionada — opcional y cliqueable.
- Vendedor — heredado.
- Servicio principal — catálogo.
- Descripción.
- Precio del servicio principal.
- Tiempo de entrega.
- Condiciones de pago — catálogo.
- Observaciones — opcional.
- Orden de Servicio relacionada — cliqueable cuando exista.

Al seleccionar el Servicio principal, el sistema podrá cargar el Precio base como valor inicial.

## Suscripciones propuestas

La Cotización podrá incluir **0, 1 o varias partidas de Suscripción**.

Cada partida tendrá:

- Suscripción / servicio recurrente — Catálogo de Suscripciones.
- Descripción.
- Precio.
- Periodicidad.

Acción:

**+ Agregar suscripción**

Las Suscripciones se mostrarán separadas del Servicio principal para distinguir el cargo principal de los cargos recurrentes.

Desde la Cotización habrá carga rápida de:

- Cliente.
- Servicio principal.
- Suscripción / servicio recurrente.

## Estados fijos

- Cotizada — inicial.
- Rechazada.
- Autorizada.
- Cancelada.

## Autorización

Cuando una Cotización sea **Autorizada**:

- se crea una única Orden de Servicio;
- se hereda el único Servicio principal;
- se heredan todas las partidas de Suscripción;
- se solicitan únicamente los datos faltantes;
- las Suscripciones heredadas se crean relacionadas con la OS en estado **Pendiente de activación**.

Reglas:

- autorizar nuevamente o reintentar la operación no puede crear una segunda OS;
- una vez creada la OS, la Cotización conserva la referencia a ella;
- cambios posteriores en la Cotización no se propagan automáticamente a la OS ni a las Suscripciones ya creadas;
- una Cotización Cancelada o Rechazada no puede generar una OS.

## Cancelación

Solo el Administrador podrá cancelar una Cotización.

## Documento

La Cotización deberá permitir:

- generar PDF;
- descargar PDF;
- enviar PDF por correo al Cliente.

El PDF distinguirá claramente:

- Servicio principal.
- Suscripciones propuestas con precio y periodicidad.

---

# 7. Órdenes de Servicio

La Orden de Servicio puede crearse:

- desde una Cotización autorizada;
- directamente desde el módulo Órdenes de Servicio.

La OS representa el servicio principal autorizado por el Cliente y funciona como punto de origen para Proyecto y Suscripciones relacionadas.

## Campos

- Folio — automático.
- Cliente — carga rápida.
- Referencia a Cotización — opcional y cliqueable.
- Vendedor — heredado de la Cotización o del usuario que crea la OS directamente.
- Programador — obligatorio; se selecciona entre usuarios activos con rol **Programador**.
- Servicio — catálogo con carga rápida.
- Descripción.
- Precio.
- Condiciones de pago — catálogo.
- Fecha de entrega.
- Observaciones — opcional.

Si proviene de Cotización, heredará la información disponible y solicitará únicamente los datos faltantes.

## Alta rápida de Servicio

Desde la OS podrá crearse un nuevo Servicio sin abandonar el formulario.

La alta rápida solicitará:

- Nombre.
- Precio base.
- Categoría de ingreso — Catálogo de Ingresos.
- Genera proyecto — Sí / No.
- Estatus — Activo / Inactivo.

## Proyecto automático

Cada Servicio tendrá la configuración **Genera proyecto**.

Si **Genera proyecto = Sí** al guardar la OS:

- se crea automáticamente un Proyecto;
- hereda Cliente, OS, Servicio, Descripción, Programador y Fecha de entrega;
- una OS tendrá como máximo un Proyecto.

Si **Genera proyecto = No**:

- la OS se crea sin Proyecto.

## Suscripciones relacionadas

Una OS podrá tener **0, 1 o varias Suscripciones**.

### Heredadas desde Cotización

Cuando la OS provenga de una Cotización con Suscripciones:

- las Suscripciones se crean automáticamente;
- quedan relacionadas con la OS;
- su Estado del servicio inicial será **Pendiente de activación**;
- no generan ciclos;
- no generan cargos;
- no generan facturas.

Esto permite completar primero la implementación o servicio principal.

### Nuevas Suscripciones desde OS

En cualquier momento podrán agregarse mediante:

**+ Nueva suscripción**

No es necesario que hayan existido previamente en la Cotización.

Toda Suscripción creada directamente desde una OS inicia también como:

**Pendiente de activación**

### Activación

La vista de detalle de la OS mostrará las Suscripciones relacionadas.

Por cada Suscripción Pendiente de activación:

**Activar**

También existirá:

**Activar todas**

Al activar una Suscripción:

- se registra automáticamente la Fecha de activación;
- pasa a Estado del servicio **Activa**;
- comienza su ciclo de cobranza;
- si tiene Facturación automática, comienza su ciclo de facturación.

Las Suscripciones podrán activarse individualmente en fechas diferentes.

La acción **Activar todas** deberá procesar cada Suscripción de manera independiente:

- las que cumplan sus validaciones se activan;
- si alguna no puede activarse, se informa cuál y por qué;
- una falla individual no deberá duplicar ni revertir las Suscripciones que sí fueron activadas correctamente.

### Cobranza de Suscripciones desde la OS

La sección **Suscripciones relacionadas** deberá mostrar información de cobranza de cada Suscripción, como mínimo:

- Suscripción.
- Periodicidad.
- Saldo pendiente.
- Situación de cobranza.
- Acción **Registrar pago**.

La acción **Registrar pago** podrá abrir directamente el formulario de pago de la Suscripción correspondiente.

Aunque el pago pueda iniciarse desde la vista de la OS:

- el pago pertenece a la Suscripción;
- se aplica a sus ciclos;
- no modifica el saldo del Servicio principal de la OS.

## Reglas de integridad de la OS

- Cliente y OS de origen no deberán cambiarse de forma que rompan relaciones ya creadas.
- Si ya existe Proyecto, no se permite cambiar el Servicio principal por otro que invalide la relación del Proyecto.
- Si cambia el Programador de una OS que ya tiene Proyecto, el Programador del Proyecto deberá actualizarse al mismo usuario.
- Si cambia la Fecha de entrega de una OS con Proyecto, la Fecha de entrega del Proyecto deberá actualizarse.
- Si cambia el Precio del Servicio principal, deberá recalcularse el saldo; no podrá establecerse un precio menor al total ya pagado.
- Cancelar una OS no deberá borrar Proyecto, Suscripciones, pagos ni documentos históricos.
- La cancelación de una OS no cancelará automáticamente Suscripciones ya activas; deberá mostrarse una advertencia para que el usuario decida su tratamiento por separado.

## Estados fijos de OS

- Creada.
- Entregada.
- Cancelada.

Solo el Administrador podrá cancelar una OS.

## Pagos de OS

Los pagos registrados en la Orden de Servicio corresponden **únicamente al Servicio principal de la OS**.

Los pagos de Suscripciones relacionadas **no se registran como pagos de la OS**.

Cada OS tendrá un apartado de Pagos del Servicio principal con:

- Importe.
- Banco / Cuenta.
- Fecha.

El sistema calculará:

- Precio del Servicio principal.
- Total pagado de la OS.
- Saldo pendiente de la OS.
- Si el movimiento corresponde a abono o pago total.

Cada pago confirmado de OS:

- se aplica únicamente al saldo del Servicio principal;
- no podrá exceder el saldo pendiente de la OS;
- genera automáticamente un Ingreso financiero;
- conserva como origen la Orden de Servicio;
- utiliza la Categoría de ingreso heredada del Servicio principal.

### Separación de cobranza

Debe mantenerse siempre esta separación:

**Pago de OS → Servicio principal → Ingreso**

**Pago de Suscripción → Ciclo(s) de Suscripción → Ingreso**

Un pago de Suscripción nunca reducirá el saldo de la OS.

Un pago de OS nunca reducirá el saldo de una Suscripción.

## Documento

La OS deberá permitir:

- generar PDF;
- descargar PDF;
- enviar PDF por correo al Cliente.

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
- Programador — heredado automáticamente de la OS.
- Fecha de inicio — automática.
- Fecha de entrega — heredada de la OS.
- Conteo de tiempo de entrega — automático.

El Proyecto deberá mostrar permanentemente los días restantes o días de retraso.

## Fases

Las fases se generan dinámicamente a partir de un **Plan de Desarrollo en formato `.md`**.

### Importar Plan de Desarrollo

Al crear el Proyecto, el sistema deberá solicitar la acción:

**Importar Plan de Desarrollo**

El usuario seleccionará el archivo `.md` correspondiente.

VectorIA deberá leer del archivo cada fase y obtener:

- Nombre.
- Objetivo.
- Incluye.

## Formato esperado del archivo `.md`

El importador deberá reconocer la estructura utilizada por el Plan de Desarrollo:

```md
# Fase 1 — Nombre de la fase

## Objetivo

Texto del objetivo.

## Incluye

- Elemento 1
- Elemento 2
```

Cada encabezado `# Fase N` representa una fase.

Dentro de cada fase:

- `## Objetivo` es obligatorio;
- `## Incluye` es obligatorio;
- el contenido de Incluye puede ser texto o lista Markdown.

La numeración de las fases deberá ser consecutiva.

Si falta Nombre, Objetivo o Incluye, el archivo deberá rechazarse indicando qué fase es inválida.

Con esta información construirá automáticamente las fases del Proyecto.

Regla:

- máximo 7 fases por Proyecto.

Si el archivo contiene más de 7 fases, no deberá importarse y se mostrará una advertencia indicando que el Plan debe agruparse antes de volver a importarlo.

El Proyecto puede existir sin fases mientras el Plan no haya sido importado y deberá mostrar **Plan pendiente de importar**.

El Plan podrá reemplazarse únicamente mientras ninguna fase haya iniciado. Una vez iniciada la primera fase, no podrá reemplazarse para evitar pérdida de historial.

Cada fase tendrá además:

- Fecha de inicio — automática al desbloquearse por primera vez.
- Fecha de término — automática al quedar Validada.

### Navegación visual de fases

La navegación principal será mediante un **stepper horizontal** en la parte superior de la vista del Proyecto.

El stepper mostrará todas las fases en orden y permitirá distinguir visualmente:

- Validada.
- En validación.
- Fase actual.
- Disponible.
- Bloqueada.

El usuario podrá seleccionar cualquier fase que ya haya sido desbloqueada para consultar su información.

No serán necesarios botones independientes de Anterior / Siguiente.

### Vista de la fase seleccionada

Debajo del stepper se mostrará una sola tarjeta correspondiente a la fase seleccionada.

La tarjeta mostrará siempre:

- número de fase dentro del total;
- Nombre;
- Objetivo;
- Fecha de inicio cuando exista;
- Fecha de término cuando exista;
- acción correspondiente.

El contenido **Incluye** estará disponible en una sección desplegable:

**Ver qué incluye**

Al abrirla se mostrará el contenido completo definido en el Plan de Desarrollo.

La intención es mantener disponible la información sin saturar visualmente la pantalla.

### Información general visible del Proyecto

Por encima del stepper se mostrará siempre:

- Fecha de entrega.
- Días restantes.

Si la fecha ya venció:

- Fecha de entrega.
- Días de retraso.

### Desbloqueo secuencial

Las fases deberán desbloquearse estrictamente en orden.

Al inicio:

- Fase 1 — disponible.
- Fases posteriores — bloqueadas.

No será posible saltar una fase bloqueada para trabajar una fase no subsecuente.

Ejemplo:

No puede desbloquearse la Fase 3 mientras la Fase 2 no haya sido desbloqueada previamente.

### Recomendación de avance

El flujo recomendado será:

**Trabajar fase → Enviar a validar → Validar → Avanzar a la siguiente fase**

Cuando una fase quede **Validada**, la siguiente podrá desbloquearse normalmente.

### Avanzar sin validación

El sistema permitirá desbloquear la fase inmediatamente siguiente aunque la fase actual todavía no haya sido validada.

Antes de hacerlo deberá mostrar una advertencia clara indicando que:

- la fase anterior aún no ha sido validada;
- una corrección podría afectar el trabajo posterior;
- se recomienda esperar la validación.

Acciones:

- Cancelar.
- Continuar de todos modos.

Si el usuario confirma, únicamente se desbloquea la fase inmediatamente siguiente.

Esto no permitirá saltar fases.

### Flujo de fase

1. Creada / disponible.
2. El Programador realiza el trabajo.
3. **Enviar a validar**.
4. En validación.
5. El responsable superior valida.
6. Validada.

Si no se valida, podrá devolverse con observación para corrección.

Si una fase es devuelta después de que la fase siguiente ya fue desbloqueada:

- la fase siguiente no volverá a bloquearse automáticamente;
- deberá mostrarse visualmente que existe una fase anterior con correcciones pendientes;
- el Proyecto no podrá considerarse terminado hasta que todas las fases estén Validadas.

Una vez validada:

- deja de mostrarse el botón Enviar a validar;
- se registra automáticamente la fecha de término.

Las evidencias serán opcionales.

El Proyecto se considera terminado cuando todas sus fases estén validadas.

---

# 9. Suscripciones

## Objetivo

Administrar servicios recurrentes dependientes de una Orden de Servicio.

Una OS puede tener cero, una o varias Suscripciones.

Las Suscripciones pueden:

- heredarse de una Cotización al crear la OS;
- agregarse posteriormente desde la OS.

No pueden crearse de manera independiente y nunca generan Proyecto.

## Creación

### Desde Cotización

Las partidas de Suscripción autorizadas se crean junto con la OS y quedan inicialmente como:

**Pendiente de activación**

### Desde OS

Acción:

**+ Nueva suscripción**

La Suscripción hereda:

- Cliente.
- OS relacionada.

El usuario selecciona un elemento del **Catálogo de Suscripciones**.

Puede heredar como valores iniciales:

- Nombre.
- Descripción.
- Precio base.
- Periodicidad.

Estos valores podrán modificarse en la Suscripción sin alterar el catálogo.

## Campos principales

- Folio — automático.
- Cliente — heredado.
- OS relacionada — heredada y cliqueable.
- Suscripción / servicio recurrente — catálogo con carga rápida.
- Descripción.
- Precio.
- Periodicidad.
- Categoría de ingreso — heredada del Catálogo de Suscripciones.
- Fecha de activación — automática al activar.
- Facturación automática — check opcional.
- Estado del servicio.
- Situación de cobranza.

## Alta rápida de Suscripción

Campos:

- Nombre.
- Descripción — opcional.
- Precio base.
- Periodicidad.
- Estatus — Activo / Inactivo.

---

## Estado del servicio

Indica la situación operativa de la Suscripción.

Valores:

- **Pendiente de activación**
- **Activa**
- **Pausada**
- **Cancelada**

### Pendiente de activación

La Suscripción ya existe pero todavía no inicia.

Mientras permanezca así:

- no genera ciclos;
- no genera cargos;
- no genera facturas.

Puede activarse desde la OS o desde su detalle.

### Activa

Genera normalmente sus ciclos conforme a la Periodicidad.

### Pausada

Se utiliza cuando el Cliente solicita detener temporalmente el servicio sin cancelarlo.

Mientras esté Pausada:

- no se generan nuevos ciclos;
- no se generan nuevos cargos;
- no se generan nuevas facturas automáticas;
- los Ciclos ya generados permanecen;
- los adeudos anteriores permanecen y pueden pagarse;
- las Facturas ya timbradas permanecen válidas;
- el historial se conserva.

La reactivación es manual.

Al reactivar:

- se registra Fecha de reactivación;
- los nuevos ciclos continúan a partir de la reactivación.

### Cancelada

Detiene definitivamente futuros ciclos, cargos y facturas, conservando el historial.

Cancelada es terminal y no puede reactivarse.

### Transiciones permitidas del Estado del servicio

- Pendiente de activación → Activa.
- Pendiente de activación → Cancelada.
- Activa → Pausada.
- Activa → Cancelada.
- Pausada → Activa.
- Pausada → Cancelada.

No deberán permitirse otras transiciones sin una regla explícita.

---

## Situación de cobranza

Es independiente del Estado del servicio.

Valores:

- **Al corriente**
- **Vencida**
- **Suspendida por adeudo**

### Al corriente

No existen ciclos vencidos con saldo pendiente.

### Vencida

Se asigna automáticamente cuando existe al menos un ciclo vencido con saldo pendiente.

### Suspendida por adeudo

Solo puede establecerse manualmente cuando la situación sea **Vencida**.

La suspensión por adeudo:

- no elimina el adeudo;
- no detiene nuevos ciclos si el Estado del servicio continúa Activa;
- no detiene nuevos cargos;
- no detiene la facturación automática;
- mantiene el ciclo normal de cobranza;
- permite seguir registrando pagos.

Representa una suspensión por falta de pago y es diferente de **Pausada**, que sí detiene nuevos ciclos.

### Transiciones de cobranza

- Al corriente → Vencida: automática cuando vence al menos un ciclo con saldo.
- Vencida → Al corriente: automática cuando ya no existe saldo vencido, salvo que esté marcada como Suspendida por adeudo.
- Vencida → Suspendida por adeudo: manual.
- Suspendida por adeudo → Al corriente: manual, después de revisar la situación del Cliente.

Pagar o aplicar un Convenio puede dejar el saldo vencido en cero, pero si estaba **Suspendida por adeudo** la marca se conserva hasta liberación manual.

## Combinaciones válidas

Ejemplos:

- Activa + Al corriente.
- Activa + Vencida.
- Activa + Suspendida por adeudo.
- Pausada + Al corriente.
- Pausada + Vencida.
- Cancelada + Al corriente.
- Cancelada + Vencida.

---

## Ciclos

La Periodicidad define cada cuánto se genera un nuevo ciclo.

Ejemplos:

- Mensual → 1 mes.
- Bimestral → 2 meses.
- Trimestral → 3 meses.
- Semestral → 6 meses.
- Anual → 12 meses.

Cada ciclo tendrá:

- Periodo.
- Importe.
- Importe pagado.
- Saldo.
- Fecha de corte.
- Fecha límite de pago.
- Situación.

### Regla temporal de los ciclos

- La Fecha de activación es el punto de inicio para generar el primer ciclo.
- Al activar una Suscripción se crea su primer ciclo por el importe completo configurado.
- En la primera versión no habrá prorrateo automático por activaciones a mitad de mes.
- Los siguientes ciclos se generan de acuerdo con el Intervalo en meses de la Periodicidad.
- Si una Suscripción está Pausada cuando correspondería generar un nuevo ciclo, ese ciclo no se crea.
- Al Reactivar, la Fecha de reactivación se convierte en el nuevo punto de referencia para los ciclos futuros.
- Un ciclo ya generado nunca se elimina por Pausa, Cancelación o Suspensión por adeudo.

### Corte y vencimiento

- corte: último día del mes en que corresponda el ciclo;
- fecha límite: día 5 natural del mes siguiente;
- con saldo después de la fecha límite → Vencido.

Situaciones:

- Pendiente.
- Por pagar.
- Vencido.
- Pagado.
- Regularizado por convenio.

### Cálculo automático de Situación del Ciclo

La prioridad será:

1. **Regularizado por convenio** — cuando el saldo fue cerrado total o parcialmente mediante Ajuste por convenio y el Ciclo quedó regularizado.
2. **Pagado** — cuando Saldo = 0 por pagos normales.
3. **Vencido** — cuando Saldo > 0 y ya pasó la Fecha límite.
4. **Por pagar** — cuando Saldo > 0, ya ocurrió el corte y todavía no vence la Fecha límite.
5. **Pendiente** — cuando el Ciclo existe pero todavía no ha llegado su corte.

## Varios meses adeudados

Cada ciclo conserva su saldo independiente.

La Suscripción mostrará:

- Saldo vencido total.
- Total pendiente.
- Número de ciclos o meses adeudados.
- Detalle de ciclos.

Los pagos normales se aplican primero al adeudo más antiguo y se distribuyen cronológicamente entre ciclos.

## Vista de detalle

### Información general

- Folio.
- Cliente — cliqueable.
- Servicio recurrente.
- OS relacionada — cliqueable.
- Periodicidad.
- Importe recurrente.
- Fecha de activación.
- Estado del servicio.
- Situación de cobranza.
- Facturación automática.

### Resumen financiero

- Saldo vencido.
- Total pendiente.
- Ciclos o meses adeudados.
- Último pago.
- Próximo corte.

### Historial de ciclos

- Periodo.
- Importe.
- Pagado.
- Saldo.
- Vencimiento.
- Situación.

### Historial de pagos

- Fecha.
- Importe recibido.
- Banco / Cuenta.
- Ciclo o ciclos aplicados.
- Indicación de Convenio cuando aplique.

## Registrar pago

Cada Suscripción administra su propia cobranza de manera independiente a la Orden de Servicio.

El pago podrá registrarse:

- desde la vista de detalle de la Suscripción;
- desde la acción **Registrar pago** de la Suscripción mostrada dentro de la OS relacionada.

En ambos casos se utilizará el mismo formulario y el pago quedará registrado en la Suscripción, no en la OS.

Campos:

- Importe pagado.
- Banco / Cuenta.
- Fecha.
- **Aplicar convenio de pago** — check desactivado por defecto.

### Pago normal

El sistema:

1. valida que el pago no exceda el saldo total pendiente;
2. aplica al adeudo más antiguo;
3. distribuye entre ciclos;
4. actualiza saldos;
5. determina abono o liquidación;
6. genera el Ingreso real correspondiente;
7. utiliza la Categoría de ingreso de la Suscripción.

### Convenio de pago

Permite que un pago menor regularice todo el adeudo acumulado.

Antes de confirmar muestra:

- Saldo actual.
- Pago recibido.
- Ajuste por convenio.
- Nuevo saldo.

Acciones:

- Cancelar.
- Confirmar convenio.

Reglas:

- solo el dinero recibido genera Ingreso;
- la diferencia es **Ajuste por convenio**;
- el ajuste no es ingreso;
- ciclos afectados → **Regularizado por convenio**;
- historial original se conserva;
- no reactiva automáticamente una Suscripción Pausada;
- no elimina automáticamente una suspensión por adeudo.

## Facturación automática

Aplica únicamente a Suscripciones.

Check:

**Facturación automática**

Para habilitarlo, el Cliente debe tener los datos fiscales requeridos por Facturapi y un correo válido para envío.

El sistema deberá validar los requisitos tanto:

- al activar el check;
- como nuevamente al momento de ejecutar el timbrado automático.

La automatización empieza únicamente cuando el Estado del servicio es **Activa**.

Si se habilita Facturación automática después de que la Suscripción ya tiene Ciclos anteriores, no deberá facturarlos retroactivamente de forma automática. Los Ciclos previos podrán facturarse manualmente cuando corresponda.

Cuando está habilitada y Activa:

- el ciclo correspondiente se factura automáticamente el **día 1 del mes siguiente a su corte**;
- cada Ciclo puede tener como máximo una Factura automática;
- se genera y timbra la Factura mediante **Facturapi**;
- se utilizan directamente PDF/XML de Facturapi;
- se envía por correo mediante **SendGrid**;
- reintentos no pueden generar duplicados.

La Factura es independiente del pago:

- timbrar una Factura no marca el Ciclo como Pagado;
- registrar un Pago no implica que exista una Factura;
- el saldo del Ciclo solo disminuye mediante Pagos o Ajustes por convenio.

Si está **Pendiente de activación** o **Pausada**:

- no genera nuevos ciclos ni facturas.

Si está **Suspendida por adeudo** pero el Estado del servicio sigue Activa:

- continúa generando ciclos;
- continúa generando cargos;
- continúa la facturación automática.

## Filtros

La vista predeterminada mostrará Suscripciones que requieren atención:

- Vencidas.
- Suspendidas por adeudo.

Además podrá consultar:

- Activas.
- Pausadas.
- Pendientes de activación.
- Canceladas.
- Todas.

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

## Regla de origen de movimientos financieros

Los movimientos pueden ser:

### Automáticos

Generados por:

- Pago de OS.
- Pago de Suscripción.
- Pago de Cuenta por Pagar.

Estos movimientos deberán conservar:

- Tipo.
- Fecha.
- Importe.
- Banco / Cuenta.
- Categoría.
- Origen.
- ID o folio del registro origen.

Un movimiento automático no podrá editarse independientemente desde Finanzas.

Si se corrige un pago, la corrección deberá realizarse desde el registro origen y reflejarse en su movimiento financiero relacionado.

### Manuales

Son los registrados directamente desde este módulo para conceptos que no provienen de OS, Suscripciones o Cuentas por Pagar.

No deberá capturarse manualmente un movimiento que ya fue generado automáticamente, para evitar duplicidades.

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

Cálculo automático:

1. **Pagada** — Saldo = 0.
2. **Vencida** — Saldo > 0 y Fecha de vencimiento ya pasó, aunque existan pagos parciales.
3. **Parcial** — 0 < Saldo < Importe y todavía no vence.
4. **Pendiente** — Saldo = Importe y todavía no vence.

Acción **Registrar pago**:

- Importe.
- Banco / Cuenta.
- Fecha.

El sistema:

- no permitirá pagar un importe mayor al saldo pendiente;
- determinará automáticamente abono o pago total;
- actualizará el saldo;
- generará un único Egreso financiero relacionado con ese pago;
- heredará la Categoría de Egreso definida en la Cuenta por Pagar.

---

# 13. Flujo Financiero

## Objetivo

Mostrar de forma simple la situación financiera y comercial del mes seleccionado.

## Filtro principal

- Mes.

## Fichas principales

### 1. Total de ingresos

Suma del dinero efectivamente recibido durante el mes.

Incluye:

- pagos de OS;
- pagos de Suscripciones;
- ingresos manuales.

Los Ajustes por convenio no se contabilizan como ingreso.

### 2. Total de egresos

Suma del dinero efectivamente egresado durante el mes.

Incluye:

- pagos de Cuentas por Pagar;
- egresos manuales.

### 3. Saldo acumulado

Saldo disponible acumulado de Bancos / Cuentas considerando saldo inicial, ingresos y egresos hasta el último día del mes seleccionado; si se selecciona el mes actual, se calcula hasta la fecha actual.

### 4. Flujo del mes

**Ingresos del mes - Egresos del mes**

### 5. Ventas totales del mes

Muestra el valor total vendido durante el mes, independientemente de que los trabajos estén pagados, parcialmente pagados o pendientes de pago.

Incluye:

- importe del Servicio principal de todas las OS creadas durante el mes y no canceladas;
- importe de los ciclos de Suscripción generados durante ese mes.

Los cobros y las Facturas no modifican esta cifra.

Reglas:

- el importe de una Suscripción no forma parte del precio del Servicio principal de la OS;
- las Suscripciones se contabilizan únicamente por sus ciclos;
- un Ajuste por convenio no modifica retroactivamente la Venta total histórica del mes en que se generó el ciclo;
- una OS Cancelada se excluye de Ventas totales.

### 6. Total de Cuentas por Cobrar

Muestra el saldo total actualmente pendiente de cobro a clientes.

Se alimenta automáticamente de dos fuentes independientes:

- saldos pendientes del Servicio principal de Órdenes de Servicio;
- saldos vencidos de ciclos de Suscripción.

Una misma OS puede, por lo tanto, tener simultáneamente:

- saldo pendiente de su Servicio principal;
- una o varias Suscripciones con saldo pendiente.

Estos importes no deberán mezclarse a nivel de pago, aunque sí deberán sumarse para calcular el Total de Cuentas por Cobrar.

Los importes regularizados mediante Convenio dejan de formar parte del saldo por cobrar, pero conservan su historial como Ajuste por convenio.

Debajo de la ficha deberá aparecer un listado breve de adeudos con:

- Cliente.
- Origen:
  - OS;
  - Suscripción.
- Folio de OS o periodo de Suscripción.
- Saldo pendiente.
- Fecha de vencimiento cuando aplique.

Cada registro del listado será cliqueable para abrir directamente la OS o Suscripción correspondiente.

## Actualización

Las fichas deberán actualizar sus cantidades automáticamente conforme se registren ventas, cargos, pagos, egresos y convenios.

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

Reglas de Categoría:

- pagos de OS utilizan la Categoría de ingreso heredada del Servicio principal;
- pagos de Suscripción utilizan la Categoría de ingreso heredada de la Suscripción;
- pagos de Cuenta por Pagar utilizan su Categoría de egreso;
- movimientos manuales utilizan la Categoría seleccionada al capturarlos.

Detalle:

- Fecha.
- Tipo.
- Concepto.
- Categoría.
- Banco / Cuenta.
- Importe.
- Origen:
  - OS;
  - Suscripción;
  - Cuenta por Pagar;
  - Manual.
- Referencia al registro origen cuando exista.

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

## Objetivo

Permitir facturación manual y facturación automática de Suscripciones utilizando **Facturapi**.

VectorIA utilizará directamente los documentos y formatos generados por Facturapi.

## Origen

Una Factura podrá originarse desde:

- Orden de Servicio — facturación manual.
- Suscripción — manual o automática.
- Captura manual independiente.

La **facturación automática aplica únicamente a Suscripciones**.

## Facturación manual

La captura manual deberá permitir como mínimo:

- Cliente — carga rápida.
- Concepto.
- Importe.
- Datos fiscales requeridos.

Si el Cliente ya cuenta con datos fiscales, se heredarán.

Si faltan, el sistema deberá solicitar su captura y guardarlos en el Cliente.

## Facturación automática de Suscripciones

La configuración se realiza directamente en la Suscripción.

Cuando esté habilitada y la Suscripción esté Activa:

- el Ciclo elegible se procesa automáticamente el **día 1 del mes siguiente a su corte**;
- se genera la Factura;
- se timbra mediante Facturapi;
- se obtienen directamente los documentos fiscales generados por Facturapi;
- se envía por correo al Cliente mediante SendGrid.

La automatización deberá ser idempotente: reintentos o ejecuciones repetidas no podrán generar facturas duplicadas.

Antes de generar una Factura automática, el sistema comprobará si el Ciclo ya tiene una Factura Timbrada relacionada.

Si ya existe, no deberá volver a timbrar.

Si una Factura se genera manualmente para un Ciclo específico de Suscripción:

- deberá conservar referencia explícita a ese Ciclo;
- si queda Timbrada antes del proceso automático, el proceso automático deberá reconocerla y omitir ese Ciclo.

## Independencia entre Venta, Factura y Pago

El sistema deberá tratar estos conceptos de forma independiente:

- **Venta:** valor del Servicio principal de una OS o de un Ciclo de Suscripción.
- **Factura:** documento fiscal.
- **Pago:** entrada real de dinero.
- **Cuenta por Cobrar:** saldo pendiente.

Por lo tanto:

- generar o timbrar una Factura no registra un Pago;
- registrar un Pago no timbra automáticamente una Factura, salvo que exista una regla explícita futura;
- una Factura Timbrada puede seguir teniendo saldo pendiente;
- el Ingreso financiero solo existe cuando se registra dinero efectivamente recibido.

## Flujo manual

1. Crear Factura.
2. Generar vista previa.
3. Revisar y corregir.
4. Timbrar mediante Facturapi.
5. Obtener PDF/XML.
6. Descargar o enviar por correo.

## Documentos fiscales

Después del timbrado, VectorIA utilizará directamente:

- PDF generado por Facturapi.
- XML generado por Facturapi.

No se diseñará un formato fiscal paralelo dentro de VectorIA.

## Envío por correo

Toda Factura timbrada deberá permitir:

- descarga de PDF;
- descarga de XML;
- envío por correo al Cliente.

El envío automático y manual utilizará **SendGrid**.

El destinatario predeterminado será el campo **Correo** del Cliente.

Si una Factura automática se timbra correctamente pero no puede enviarse:

- la Factura continúa como Timbrada;
- se registra Estado de envío = Error;
- podrá reintentarse únicamente el envío, sin volver a timbrar.

## Estado fiscal

- Borrador.
- Timbrada.
- Cancelada.
- Error de timbrado.

## Estado de envío

- Pendiente.
- Enviado.
- Error.

El Estado de envío es independiente del Estado fiscal.

Mientras esté en Borrador podrá editarse.

Una Factura timbrada no podrá modificarse directamente.

## Errores y reintentos

Si falla:

- validación de datos fiscales;
- timbrado;
- obtención de documentos;
- envío por correo;

el sistema deberá registrar:

- fecha y hora;
- Ciclo u origen relacionado;
- etapa que falló;
- mensaje técnico disponible.

Deberá permitir reintentar únicamente la etapa correspondiente sin generar una Factura duplicada.

Si falla antes del timbrado, no deberá marcarse la Factura como Timbrada.

Si el timbrado fue exitoso y únicamente falla el correo, se reintenta el envío sin volver a timbrar.

## Cancelación

La cancelación se realizará mediante el flujo permitido por Facturapi y únicamente por usuarios autorizados.

---


# 16. Catálogos

## Regla general de Catálogos

- Los registros Activos pueden seleccionarse en nuevas operaciones.
- Los registros Inactivos o Cancelados no deberán aparecer como opciones para nuevas operaciones.
- Los registros históricos que ya utilizan un valor inactivo o cancelado conservan su relación y continúan mostrándolo.
- Inactivar un valor de catálogo nunca modifica ni elimina registros históricos.
- Las altas rápidas respetan las mismas validaciones y campos obligatorios que el alta desde Catálogos.

## 16.1 Servicios

Define los servicios principales utilizados en Cotizaciones y Órdenes de Servicio.

Campos:

- Nombre.
- Precio base.
- Genera proyecto — Sí / No.
- Estatus:
  - Activo
  - Inactivo

Regla:

- si **Genera proyecto = Sí**, al crear una OS con ese Servicio se genera automáticamente el Proyecto;
- si **Genera proyecto = No**, la OS no genera Proyecto.

Permitirá carga rápida desde la Orden de Servicio.

La Categoría de ingreso se copia a la OS al seleccionarse el Servicio y será la categoría utilizada por los Ingresos generados por sus pagos.

## 16.2 Catálogo de Suscripciones

Define los servicios recurrentes que pueden asociarse a una OS.

Campos:

- Nombre.
- Descripción — opcional.
- Precio base.
- Periodicidad.
- Categoría de ingreso — Catálogo de Ingresos.
- Estatus:
  - Activo
  - Inactivo

Ejemplos:

- Mantenimiento.
- Hosting.
- Dominio.
- Soporte.
- Licenciamiento.

Permitirá carga rápida desde la creación de una Suscripción.

La Categoría de ingreso se copia a cada Suscripción al crearla y será utilizada por los Ingresos generados por sus pagos.

## 16.3 Periodicidades

Campos:

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

## 16.4 Condiciones de pago

Campos:

- Nombre.
- Descripción — opcional.
- Estatus:
  - Activo
  - Cancelado

## 16.5 Catálogo de Ingresos

Campo:

- Nombre.

Permitirá carga rápida.

## 16.6 Catálogo de Egresos

Campo:

- Nombre.

Permitirá carga rápida.

## 16.7 Proveedores / Acreedores

Campo:

- Nombre.

Permitirá carga rápida.

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

Cada Usuario tendrá un solo Rol en la primera versión.

El Administrador podrá configurar qué módulos tiene habilitados cada Rol.

Regla:

- tener acceso a un módulo permite sus operaciones normales;
- las restricciones especiales definidas en este Discovery tienen prioridad sobre el acceso general al módulo;
- las validaciones de permisos deberán aplicarse en servidor, no únicamente ocultando botones en la interfaz.

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


# 18. Configuración

El sistema tendrá una sección de Configuración accesible para Administrador.

Inicialmente incluirá la configuración de servicios externos necesarios para la operación.

También incluirá:

- Zona horaria operativa.
- Valor inicial: `America/Mexico_City`.

## SendGrid

Permitirá configurar:

- envío automático activo / inactivo;
- correo remitente;
- nombre del remitente;
- API Key;
- asunto base;
- texto base del correo.

## Facturapi

La integración utilizará Facturapi para:

- timbrado;
- cancelación;
- obtención de PDF;
- obtención de XML.

Las credenciales y parámetros necesarios deberán almacenarse de forma segura.

---

# 19. Folios

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

# 20. Búsqueda y filtros

Los listados deberán permitir búsqueda por folio y Cliente cuando aplique.

Cada módulo podrá añadir filtros basados en sus campos principales.

Suscripciones y Reporte Financiero deberán incluir expresamente los filtros definidos en este Discovery.

---

# 21. Documentos y exportaciones

## Regla general de documentos

Todo documento formal generado por el sistema deberá permitir, cuando aplique:

- visualizar;
- descargar;
- enviar por correo al Cliente.

El envío utilizará la configuración de **SendGrid** definida en el sistema.

## Cotización

- Generar PDF.
- Descargar PDF.
- Enviar PDF por correo.

## Orden de Servicio

- Generar PDF.
- Descargar PDF.
- Enviar PDF por correo.
- El documento deberá distinguir el Servicio principal y mostrar las Suscripciones relacionadas existentes al momento de generar el PDF.

## Factura

- Utilizar PDF y XML generados por Facturapi.
- Descargar PDF.
- Descargar XML.
- Enviar por correo.
- En Suscripciones con facturación automática, el envío se realizará automáticamente después del timbrado.

## Reporte Financiero

Permitirá:

- exportar todos los resultados filtrados;
- exportar registros seleccionados;
- Excel;
- PDF.

---


# 22. Flujo general

## Flujo comercial

Cliente → Oportunidad → Cotización → Orden de Servicio

También:

Cliente → Cotización → OS

Cliente → OS

## Cotización

Puede contener:

- 1 Servicio principal.
- 0..N Suscripciones propuestas.

Al autorizar:

Cotización → OS

Las Suscripciones propuestas se crean como **Pendientes de activación**.

## Proyecto

Si el Servicio tiene **Genera proyecto = Sí**:

OS → Proyecto automático → Importar Plan de Desarrollo `.md` → Fases → Validación

Si **Genera proyecto = No**:

OS → Sin Proyecto

## Suscripciones

Desde Cotización:

Cotización → OS → Suscripciones Pendientes de activación → Activar → Ciclos

Desde OS:

OS → Nueva Suscripción → Pendiente de activación → Activar → Ciclos

Una OS puede tener 0..N Suscripciones.

Las Suscripciones no generan Proyecto.

## Finanzas

La procedencia del dinero deberá conservarse explícitamente.

- Pago de OS → se aplica al Servicio principal → Ingreso con origen OS.
- Pago de Suscripción → se aplica a uno o varios ciclos → Ingreso con origen Suscripción.
- Movimiento manual → Ingreso / Egreso.
- Cuenta por Pagar → Pago → Egreso.
- Convenio de Suscripción → Ingreso real + Ajuste por convenio.

Los saldos de OS y Suscripciones se administran de forma independiente aunque ambos pertenezcan a la misma relación comercial.

## Facturación

### Manual

OS / Suscripción / Captura manual → Vista previa → Facturapi → PDF/XML → envío por correo opcional.

### Automática

Suscripción Activa con Facturación automática → Ciclo → Día 1 posterior al corte → Facturapi → PDF/XML → SendGrid.

---

# 22.1 Matriz de disparadores automáticos

| Evento | Resultado automático | Debe evitar duplicados |
|---|---|---|
| Crear primera Cotización desde Oportunidad | Oportunidad → Cotizada | Sí |
| Autorizar Cotización | Crear una OS | Sí |
| Crear OS desde Cotización | Crear Suscripciones propuestas como Pendientes de activación | Sí |
| Guardar OS con Servicio `Genera proyecto = Sí` | Crear Proyecto | Sí |
| Importar Plan `.md` válido | Crear fases | Sí |
| Activar Suscripción | Crear primer Ciclo y comenzar programación futura | Sí |
| Llegar fecha de nuevo Ciclo y Suscripción Activa | Crear Ciclo | Sí |
| Vencer Ciclo con saldo | Cobranza → Vencida | Sí |
| Día 1 posterior al corte + Facturación automática | Timbrar una Factura del Ciclo | Sí |
| Timbrado automático exitoso | Enviar PDF/XML por SendGrid | Sí |
| Registrar Pago OS | Crear Ingreso origen OS | Sí |
| Registrar Pago Suscripción | Crear Ingreso origen Suscripción | Sí |
| Registrar Pago CxP | Crear Egreso origen CxP | Sí |
| Validar Fase | Registrar fecha término y permitir avance recomendado | Sí |

---

# 23. Fuera de alcance inicial

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

# 23.1 Reglas que Cursor no debe inferir de otra manera

Para evitar interpretaciones durante la construcción:

1. La OS cobra únicamente su Servicio principal.
2. Las Suscripciones cobran únicamente sus propios Ciclos.
3. Una OS puede existir sin Proyecto.
4. Una OS puede existir sin Suscripciones.
5. Una OS puede tener Proyecto y Suscripciones simultáneamente.
6. Una Suscripción nunca genera Proyecto.
7. Una Suscripción heredada o creada desde OS inicia Pendiente de activación.
8. Pendiente de activación y Pausada no generan nuevos Ciclos.
9. Suspendida por adeudo sí puede continuar generando Ciclos y Facturas si el Estado del servicio es Activa.
10. Facturar no equivale a cobrar.
11. Cobrar no equivale a facturar.
12. Los movimientos financieros automáticos no deben duplicarse mediante captura manual.
13. Las modificaciones de Catálogos no cambian registros históricos existentes.
14. Una Cotización autorizada no puede crear más de una OS.
15. Una OS no puede crear más de un Proyecto.
16. Un Ciclo no puede tener más de una Factura automática Timbrada.
17. Las Suscripciones de una Cotización son propuestas hasta que la OS se crea; después son registros independientes relacionados con la OS.
18. Los saldos de OS y Suscripciones son independientes y solo se consolidan en Cuentas por Cobrar y vistas financieras.
19. Un Ajuste por convenio reduce el saldo por cobrar, pero no genera Ingreso.
20. Ventas, Facturas, Pagos y Cuentas por Cobrar son conceptos independientes.

---

# 24. Criterio general de aceptación

La primera versión deberá permitir:

1. Registrar Clientes.
2. Gestionar Oportunidades.
3. Generar Cotizaciones con un Servicio principal.
4. Agregar 0..N Suscripciones propuestas a una Cotización.
5. Autorizar Cotizaciones y convertirlas en OS.
6. Heredar Suscripciones a OS como Pendientes de activación.
7. Crear OS directamente.
8. Dar de alta Servicios rápidamente desde OS.
9. Crear Proyecto automáticamente cuando **Genera proyecto = Sí**.
10. Importar Plan de Desarrollo `.md` con máximo 7 fases.
11. Controlar desbloqueo secuencial y validación de fases.
12. Crear 0..N Suscripciones desde una OS.
13. Activar Suscripciones individualmente o todas desde OS.
14. Dar de alta Servicios recurrentes con carga rápida.
15. Distinguir Estado del servicio y Situación de cobranza.
16. Pausar temporalmente sin cancelar y sin generar nuevos ciclos.
17. Suspender por adeudo sin detener cobranza, cargos ni facturación.
18. Administrar ciclos, vencimientos, pagos y convenios.
19. Registrar pagos de OS.
20. Administrar Bancos y movimientos.
21. Registrar Ingresos / Egresos manuales.
22. Registrar y pagar Cuentas por Pagar.
23. Consultar Flujo Financiero, Ventas del mes y Cuentas por Cobrar.
24. Filtrar y exportar Reportes Financieros.
25. Generar Facturas manuales mediante Facturapi.
26. Activar Facturación automática únicamente en Suscripciones.
27. Timbrar y enviar Facturas automáticas de Suscripción el día 1 del mes siguiente al corte.
28. Generar/descargar PDFs de Cotización y OS.
29. Enviar Cotizaciones, OS y Facturas por correo.
30. Configurar SendGrid y Facturapi.
31. Administrar Catálogos.
32. Administrar Usuarios, Roles y accesos por módulo.
33. Mantener separados los pagos del Servicio principal de OS y los pagos de Suscripciones.
34. Registrar pagos de Suscripción desde su detalle o desde la OS relacionada sin afectar el saldo de la OS.
35. Consolidar ambos tipos de adeudo únicamente en Cuentas por Cobrar.
36. Categorizar automáticamente Ingresos de OS y Suscripciones para los filtros del Reporte Financiero.
37. Mantener relación 1:1 entre cada Pago automático y su Movimiento financiero.
38. Mantener Factura y Pago como eventos independientes.
39. Evitar duplicados en todos los procesos automáticos definidos.
40. Aplicar las reglas temporales de Ciclos, corte, vencimiento y facturación automática.

---

# 25. Estado

**Documento:** Discovery VectorIA  
**Versión:** 1.6  
**Estado:** Revisión funcional final para construcción con Cursor
