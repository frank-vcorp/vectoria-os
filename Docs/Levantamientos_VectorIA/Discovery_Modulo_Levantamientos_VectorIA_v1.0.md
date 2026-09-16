# Discovery: módulo de Levantamientos de VectorIA

**Versión:** 1.0  
**Fecha:** 15 de septiembre de 2026  
**Tipo:** ampliación funcional del sistema administrativo VectorIA  
**Estado:** consolidado para revisión; incluye decisiones de detalle expresamente identificadas.  
**Documento de alcance separado:** `Alcance_Modulo_Levantamientos_VectorIA_v1.0.md`.

## 1. Propósito y resultado esperado

Incorporar un módulo que apoye al vendedor o entrevistador durante el levantamiento con un cliente. Debe registrar cómo trabaja actualmente la empresa, sus procesos, responsables, herramientas, reglas, problemas y resultados esperados. La entrevista debe poder realizarse en pantalla o en papel.

El resultado será un expediente organizado y un archivo Markdown con la información capturada para elaborar posteriormente el discovery del sistema del cliente. El módulo no convierte automáticamente la entrevista en una especificación aprobada.

Se distinguen tres documentos:

| Documento | Función |
|---|---|
| Este discovery | Define cómo debe funcionar el módulo de Levantamientos de VectorIA. |
| Levantamiento exportado del cliente | Contiene respuestas y pendientes de una entrevista; es insumo para un discovery posterior. |
| Discovery y alcance del cliente | Se elaboran y validan posteriormente como documentos separados. |

## 2. Fuentes y reglas heredadas

### 2.1 Fuentes consultadas

- Acuerdos de esta conversación sobre el módulo, incluida la decisión final de selección simple.
- `discovery-vectoria-v1.0.md`: documento general que declara sustituir la antigua Definición Funcional.
- `VectorIA_Manual_del_Programador_V2.pdf`: método de definición funcional, criterios de aceptación y verificación por módulo.
- `02-arquitectura.md` y `03-plan-desarrollo.md`: antecedentes del 28 de agosto de 2026. No prevalecen sobre decisiones funcionales posteriores que los contradigan.
- Los siete PDF del usuario, identificados en la sección 9 y entregados sin modificar en `fuentes/` dentro del paquete.

Este documento amplía el discovery general únicamente en Levantamientos y sus puntos de conexión. No sustituye la definición de los otros módulos ni acredita que se haya revisado el código o el estado actual de un repositorio.

### 2.2 Conciliación con los antecedentes

| Regla previa | Aplicación en este módulo |
|---|---|
| Todos los campos son obligatorios salvo excepción expresa. | Excepción: las respuestas de entrevista, notas, evidencias y datos complementarios son opcionales durante la captura. Se permiten pendientes. |
| Los campos capturados son editables, con las excepciones del sistema. | Se pueden corregir respuestas; si el registro está Finalizado se usa Reabrir. Los datos heredados se corrigen en su módulo de origen. |
| Simplicidad, herencia y mínima duplicidad. | Cliente y cotización se reutilizan. No se crea un cliente nuevo desde el levantamiento. |
| Relaciones cliqueables. | Los vínculos con cotización, cliente y OS/proyecto, cuando existan y haya permiso, permiten abrir el registro relacionado. |
| Registros con historial sin eliminación física; auditoría mínima. | Se preservan respuestas e historial; no se incorpora un botón de eliminación definitiva. |
| Folios automáticos, consecutivos y sin año. | Se propone el prefijo `LEV-000001`, sin reutilizar folios. |
| Roles: Administrador, Vendedor y Programador. | Se amplía el acceso a Levantamientos según la sección 7; no se recupera la matriz antigua de ocho roles. |
| OS directa desde Cliente o desde Cotización autorizada. | Ambas rutas siguen disponibles y ninguna exige levantamiento. |
| Una OS origina como máximo un Proyecto; todo Proyecto nace de OS. | El levantamiento no origina un proyecto por sí mismo. |
| Discovery funcional y alcance separados. | Se entregan separados; la representación JSON no sustituye ninguno. |

La arquitectura y el plan anteriores mencionan permisos, comisiones, campos y procesos que después fueron simplificados. Se conserva de ellos lo compatible; no se reincorporan funciones descartadas. La referencia del manual a Product Manager describe una responsabilidad de revisión y no agrega por sí sola un rol al sistema.

### 2.3 Decisiones de detalle propuestas en esta versión

Estos puntos cierran comportamientos no acordados expresamente en la conversación. Se identifican para que puedan revisarse sin confundirlos con decisiones históricas:

| ID | Propuesta aplicada a la definición |
|---|---|
| D-01 | Una cotización puede tener cero o varios levantamientos independientes. Al crear otro, mostrar los existentes y permitir continuar uno o crear uno nuevo. Cada levantamiento conserva un único tipo de operación; no se combinan entre sí. |
| D-02 | Permitir vincular cualquier cotización existente y accesible sin exigir que esté autorizada. Mostrar su estado; si está rechazada o cancelada, advertirlo sin reactivarla. |
| D-03 | Habilitar captura y exportación a Administrador y Vendedor. Programador consulta y exporta los levantamientos vinculados a sus proyectos mediante la OS/cotización, sin edición por defecto. |
| D-04 | Para finalizar, exigir que cada sección haya sido revisada y que lo faltante esté identificado como pendiente, sin exigir todas las respuestas ni una validación superior adicional. |
| D-05 | Permitir corregir la cotización vinculada con confirmación si hay respuestas. Conservar la referencia anterior y las respuestas; señalar que debe revisarse la correspondencia con el cliente correcto. |

Las demás reglas descritas desarrollan los acuerdos de la conversación. Si alguna de estas cinco decisiones cambia, deben actualizarse sus criterios de aceptación antes de implementar el comportamiento afectado.

## 3. Alcance funcional

Incluye crear, consultar, buscar, capturar, retomar, finalizar y reabrir levantamientos; seleccionar un tipo de operación; integrar procesos transversales y la plantilla operativa; adjuntar ejemplos; descargar un PDF para papel y exportar respuestas a `.md`.

La aplicación se usa para VectorIA. Las preguntas sobre compras, inventario, nómina, clínica, producción o transporte describen la empresa entrevistada: no incorporan esos módulos operativos al sistema administrativo de VectorIA.

No incluye selección múltiple de ramos, combinación inteligente de formularios, generación del discovery mediante IA, OCR, transcripción automática, importación de respuestas desde papel, portal externo, edición colaborativa en tiempo real ni un constructor de plantillas para usuarios finales. Tampoco incluye cambios a precios, facturación, finanzas o generación automática de proyectos a partir de respuestas.

## 4. Ubicación y relaciones

El módulo aparece en Comercial, entre Cotizaciones y Órdenes de Servicio.

La ruta con levantamiento es: **Cotización → Levantamiento opcional → Orden de Servicio**. La autorización de la cotización sigue las reglas existentes. Realizar o finalizar un levantamiento no equivale a autorizar una venta.

Las rutas **Cliente → OS** y **Cotización autorizada → OS** continúan funcionando sin levantamiento, incluso si hay uno en captura. La autorización de la cotización puede iniciar la creación de OS como está previsto en el discovery general; el nuevo módulo no inserta una espera obligatoria.

Todo levantamiento pertenece a exactamente una cotización existente, de la cual toma el cliente. No puede guardarse como registro independiente sin cotización. No requiere oportunidad, OS ni proyecto para existir.

Si ya existe OS, el levantamiento puede consultarse o completarse sin alterar lo autorizado. La posición en el flujo indica su uso habitual previo a la OS, no un bloqueo cronológico.

Desde la cotización se mostrarán los levantamientos relacionados. Desde la OS y el proyecto se podrá consultar la referencia por la cotización de origen, cuando exista. Una OS directa sin cotización no recibe un levantamiento creado artificialmente.

## 5. Creación y datos generales

### 5.1 Desde una cotización

1. El usuario pulsa **Crear levantamiento**.
2. Selecciona primero el tipo de operación.
3. La cotización y el cliente ya aparecen heredados.
4. Confirma la creación; se asigna folio y queda en Borrador.
5. Se carga el formulario y se habilita **Descargar formato en PDF** sin responder ninguna pregunta.

### 5.2 Desde el módulo Levantamientos

1. El usuario pulsa **Nuevo levantamiento**.
2. Selecciona el tipo de operación.
3. Busca una cotización existente por folio o cliente y la selecciona.
4. El cliente se obtiene de la cotización; confirma y se crea el Borrador.

Si no existe cotización, debe registrarse en Cotizaciones. No se agrega un cotizador paralelo en esta pantalla. El tipo puede elegirse antes, pero el registro y la descarga vinculada requieren seleccionar la cotización, sin exigir respuestas de entrevista.

### 5.3 Información del encabezado

| Dato | Origen y comportamiento |
|---|---|
| Folio | Automático, único y sin año; prefijo propuesto LEV. |
| Cotización | Obligatoria; heredada o seleccionada; enlace al origen. |
| Cliente | Automático desde cotización; sin captura duplicada. |
| Servicio/descripción cotizada | Referencia heredada; no se interpreta como alcance del levantamiento ya aprobado. |
| Tipo de operación | Obligatorio; selección única entre seis opciones. |
| Responsable del levantamiento | Usuario creador por defecto; reasignable por Administrador a un usuario habilitado. |
| Fecha de creación y última modificación | Automáticas. |
| Fecha de entrevista | Opcional; editable; puede corresponder a una visita futura programada. |
| Persona entrevistada y puesto | Opcionales; texto abierto. Puede diferir del contacto comercial. |
| Actividad, producto o servicio principal del cliente | Opcional; texto abierto. |
| Objetivo general del cliente | Opcional; texto abierto. |
| Notas generales | Opcionales; texto amplio. |
| Estado | Borrador, En captura o Finalizado, según las transiciones definidas. |

No se obligan a recapturar nombre, teléfono, correo ni datos fiscales existentes. Tampoco se exige información fiscal para entrevistar.

## 6. Listado y experiencia de captura

El listado muestra folio, cliente, cotización, tipo de operación, responsable, estado y última actualización. Permite búsqueda por folio, cliente y cotización, y filtros por tipo, estado y responsable dentro del acceso permitido.

La pantalla de captura contiene un encabezado compacto con cliente, cotización, tipo, estado y confirmación de guardado. Una navegación lateral muestra Datos generales, Procesos comunes, Operación, Adjuntos y Cierre. Permite entrar directamente a cualquier sección.

Se muestra una sección a la vez. Las áreas comunes y los apartados operativos aparecen agrupados y desplegables, sin un formulario largo completamente abierto. En pantalla pequeña la navegación puede ser un selector compacto.

### Reglas de interacción

- Campos de texto que crecen al escribir y conservan saltos de línea.
- Checklists con áreas de clic amplias y opción Otro acompañada de texto cuando corresponda.
- Elección única para Sí/No/Depende u opciones mutuamente excluyentes. No y Ninguno excluyen selecciones incompatibles en la misma pregunta.
- Preguntas guía desplegables y ejemplos identificados como ejemplos; nunca se guardan como respuestas del cliente.
- Tablas con **Agregar etapa** o **Agregar fila**. No se obliga a completar las seis filas dibujadas en un PDF.
- Navegación por teclado, etiquetas visibles y errores junto al campo correspondiente. El estado no depende únicamente del color.
- Posibilidad de saltar una pregunta, marcarla pendiente o volver después sin interrumpir la entrevista.
- Indicadores por sección: Sin revisar, En captura, Revisada, Con pendientes o No aplica. Son indicadores de avance, no estados comerciales.
- El progreso indica secciones revisadas respecto de las aplicables. No es una calificación de la calidad de las respuestas ni del alcance vendido.

### Autoguardado

Los cambios se guardan después de una pausa breve o al salir del campo. La interfaz informa **Guardando**, **Guardado** o **Cambios pendientes de guardar** según el resultado real.

Cambiar de sección no pierde respuestas. Salir y volver recupera lo confirmado por el sistema. Si falla la conexión, se conserva el texto en la sesión abierta, se muestra el problema y se permite reintentar; no se promete captura completa sin conexión ni recuperación tras cerrar el navegador.

Al exportar, finalizar o cambiar de plantilla, deben haberse confirmado los cambios pendientes. Si el guardado falla, no se genera un archivo que aparente contener el texto no guardado. Dos sesiones no deben sobrescribir respuestas silenciosamente; debe avisarse del conflicto y conservar la edición pendiente para resolverlo.

## 7. Usuarios y permisos

Se reutilizan los roles y controles de acceso existentes. El Administrador conserva la configuración de acceso por módulo. La siguiente extensión sigue D-03:

| Acción | Administrador | Vendedor | Programador |
|---|---|---|---|
| Crear | Sí | Sí, con cotización accesible | No por defecto |
| Consultar | Todos | Dentro de su acceso comercial vigente | Relacionados con proyectos que puede consultar |
| Capturar/corregir | Sí | Sí, dentro de su acceso vigente | No por defecto |
| Finalizar/reabrir | Sí | Sí, dentro de su acceso vigente | No por defecto |
| PDF y Markdown | Sí | Sí, sobre registros accesibles | Sí, sobre registros accesibles |
| Adjuntar/retirar del expediente vigente | Sí | Sí, dentro de su acceso vigente | Solo consulta/descarga |
| Reasignar responsable | Sí | No por defecto | No |
| Eliminar definitivamente | No desde este módulo | No | No |

Acceder a Levantamientos no concede acceso a cualquier cotización. Se respeta el alcance del usuario existente, sin inventar una nueva estructura de equipos. Los controles se aplican a consultas, acciones, URLs de descarga y adjuntos, además de la interfaz.

Finalizar una entrevista no equivale a la validación de una fase de Proyecto. No se agrega un circuito de aprobación superior al levantamiento.

## 8. Estados y revisión

| Estado | Cómo se alcanza | Comportamiento |
|---|---|---|
| Borrador | Al crear el registro | Datos iniciales disponibles; se puede descargar PDF o exportar identificando pendientes. |
| En captura | Al guardar la primera respuesta de contenido o reabrir | Permite capturar, editar, adjuntar, retomar y exportar. Cambiar solo el encabezado no obliga a cambiar de estado. |
| Finalizado | Acción explícita del usuario después de revisar las secciones | Conserva una revisión identificable; consulta y exportación disponibles. Para corregir se usa Reabrir. |

El cierre presenta secciones revisadas, no aplicables y pendientes. El usuario puede marcar una sección revisada aunque queden datos por confirmar; esos datos deben quedar identificados. Así, Finalizado significa que la entrevista fue revisada, no que el discovery esté completo ni aprobado.

Reabrir devuelve a En captura y conserva el historial de finalización. No se modifica el contenido de archivos ya descargados. Cada exportación identifica la revisión y la fecha que representa.

## 9. Plantillas y cobertura de contenido

### 9.1 Selección única

| Código de referencia | Opción visible | PDF operativo de origen |
|---|---|---|
| SER | Servicios | `Discovery_VectorIA_Empresas_de_Servicios.pdf` |
| DIS | Comercial / distribución | `Discovery_VectorIA_Comercial_Distribucion.pdf` |
| MAN | Manufactura / transformación | `Discovery_VectorIA_Manufactura_Transformacion.pdf` |
| PRY | Proyectos | `Discovery_VectorIA_Empresas_por_Proyectos.pdf` |
| CIT | Atención por citas / expediente | `Discovery_VectorIA_Atencion_Citas_Expediente.pdf` |
| LOG | Logística / transporte | `Discovery_VectorIA_Logistica_Transporte.pdf` |

Todos incorporan una sola vez `Discovery_VectorIA_Procesos_Transversales.pdf`. El nombre visible será **Tipo de operación**. No habrá una opción multirramo ni se combinarán plantillas. Actividades complementarias se registran en notas y campos abiertos.

Los códigos identifican preguntas y apartados; no representan folios ni módulos operativos nuevos.

### 9.2 Procesos transversales

| Área | Página de origen | Temas que deben conservarse |
|---|---|---|
| Comercial | 2 | Prospectos, seguimiento, cotización, cierre, transferencia a operación; alternativas como negociación, descuentos, comisiones, contratos y recurrencia. |
| Clientes | 3 | Alta, datos, consulta, actualización, historial; contactos, sucursales, condiciones, crédito y documentos según aplique. |
| Compras | 4 | Necesidad, solicitud, proveedor, autorización, compra y recepción; anticipos, crédito, urgencias y devoluciones. |
| Inventario | 5 | Entradas, salidas, existencias, ajustes y reposición; reservas, ubicaciones, lotes, series, caducidades y conteos. |
| Facturación | 6 | Solicitud, datos, relación con operación, envío y estatus; parcialidades, complementos, notas de crédito y cancelaciones. |
| Finanzas | 7 | Ingresos, egresos, cuentas pendientes, pagos y saldos; bancos, conciliación, flujo, costos y rentabilidad. |
| Documentos y administración | 8 | Generación, almacenamiento, consulta, evidencias y relación con operaciones; firmas, versiones, autorizaciones y vigencias. |
| Personal | 9 | Alta, expediente, asistencia, incidencias, ausencias y pagos; capacitación, desempeño, bonos, comisiones y bajas. |
| Dirección y control | 10 | Indicadores, reportes, seguimiento y pendientes; metas, comparativos, proyecciones, alertas y rentabilidad. |

La tabla es un índice; no sustituye las opciones y preguntas completas de las fuentes. Todas deben conservar su cobertura. Los nombres como «Comisiones» describen un proceso del cliente y no reintroducen Comisiones como módulo propio de VectorIA.

### 9.3 Estructura de captura por área común

Cada área conserva su checklist y sus preguntas específicas. Comparte estos campos, opcionales durante la entrevista:

1. Aplicabilidad: Aplica / No aplica / Por confirmar; por defecto Por confirmar.
2. Procesos identificados actualmente: checklist y Otro.
3. Inicio o disparador del proceso, con la pregunta específica del PDF.
4. Flujo actual y explicación de cómo se realiza.
5. Personas y áreas participantes.
6. Herramientas utilizadas; nombre del software y nombre del archivo/formato.
7. Problemas o necesidades detectadas.
8. Resultado esperado por el cliente.
9. Reglas, autorizaciones y excepciones.
10. Notas y asuntos por confirmar.

Las preguntas sugeridas del PDF ayudan a completar esos campos. Una respuesta adicional puede conservarse como nota identificada con la pregunta, sin obligar a crear un campo por cada pregunta guía. Esto evita duplicar la entrevista y conserva el contexto.

Cambiar «Prioritarios / comunes» por «Procesos frecuentes» en la presentación. La frecuencia del catálogo no determina la prioridad del cliente. El checklist de actividad actual se distingue de las necesidades o funciones deseadas; una selección nunca significa automáticamente alcance contratado.

### 9.4 Contenido por tipo de operación

Cada operación conserva el orden y los apartados de su PDF. La navegación puede agruparlos visualmente, sin omitir información:

| Tipo | Apartados del PDF que debe cubrir el formulario |
|---|---|
| Servicios | 1 Procesos; 2 Flujo; 3 Cómo se realiza actualmente; 4 Preparación; 5 Responsables y asignación; 6 Ejecución; 7 Seguimiento; 8 Cambios; 9 Condiciones económicas; 10 Evidencias; 11 Validación y entrega; 12 Cierre administrativo; 13 Garantía/recurrencia; 14 Preguntas guía; 15 Notas. |
| Comercial / distribución | 1 Procesos; 2 Flujo; 3 Cómo se realiza actualmente; 4 Preparación; 5 Responsables; 6 Ejecución del pedido; 7 Seguimiento; 8 Cambios; 9 Condiciones económicas; 10 Inventario y disponibilidad; 11 Evidencias; 12 Validación y entrega; 13 Cierre; 14 Devoluciones/garantía/recurrencia; 15 Guía; 16 Notas. |
| Manufactura / transformación | 1 Procesos; 2 Flujo; 3 Cómo se realiza actualmente; 4 Planeación; 5 Responsables; 6 Transformación; 7 Materiales y consumos; 8 Seguimiento; 9 Cambios; 10 Costos; 11 Evidencias; 12 Calidad; 13 Producto terminado; 14 Cierre; 15 Reproceso/no conformidad/devoluciones; 16 Guía; 17 Notas. |
| Proyectos | 1 Procesos; 2 Flujo; 3 Cómo se realiza actualmente; 4 Definición y preparación; 5 Planeación y responsables; 6 Ejecución; 7 Seguimiento; 8 Cambios de alcance; 9 Condiciones económicas; 10 Recursos y costos; 11 Evidencias; 12 Entregables y validación; 13 Cierre; 14 Garantía/soporte/fases; 15 Guía; 16 Notas. |
| Atención por citas / expediente | 1 Procesos; 2 Flujo; 3 Cómo se realiza actualmente; 4 Agenda; 5 Confirmación/cancelación/reprogramación; 6 Recepción; 7 Expediente; 8 Atención; 9 Diagnóstico/plan/tratamiento; 10 Estatus; 11 Excepciones; 12 Condiciones económicas; 13 Evidencias; 14 Cierre de atención; 15 Seguimiento; 16 Salida administrativa; 17 Guía; 18 Notas. |
| Logística / transporte | 1 Procesos; 2 Flujo; 3 Cómo se realiza actualmente; 4 Programación; 5 Unidades y operadores; 6 Recolección/carga; 7 Traslado; 8 Monitoreo; 9 Incidencias; 10 Entrega; 11 Evidencias; 12 Costos y condiciones económicas; 13 Gastos del viaje; 14 Cierre; 15 Salida administrativa; 16 Devoluciones/reintentos/reclamaciones; 17 Guía; 18 Notas. |

En todas las operaciones deben estar disponibles Problemas/necesidades y Resultado esperado, además de lo ya presente en el PDF. Se conserva cómo se trabaja hoy, con qué software o archivo, captura repetida de información y transferencia manual entre herramientas.

Las tablas de «Cómo se realiza actualmente» y «Ejecución» pueden presentarse juntas para agilizar captura, pero deben distinguir etapa, actividad real, responsable, herramienta/archivo y resultado/salida. No se llenan con ejemplos del PDF por defecto.

### 9.5 Evitar duplicidades y falsas reglas

- Las preguntas transversales financieras describen el control general. Las operativas describen cuándo un pago permite iniciar, continuar o entregar y quién lo registra. No se suprime este último contexto por aparecer también Finanzas.
- Lo mismo aplica a inventario general frente a reserva de pedidos, consumo de materiales y mermas; cada pregunta conserva el contexto que la hace diferente.
- Los datos generales del cliente se heredan del encabezado. El expediente operativo documenta información y permisos propios de la atención.
- En Atención por citas, diagnóstico, recetas, estudios y tratamiento son condicionales. No todas las empresas con agenda son clínicas.
- Los diagramas de flujo de los PDF son ejemplos. No se impone Facturación/Finanzas después de terminar la operación: pueden existir anticipos, facturación previa y cobros durante la ejecución.
- Las frases «documento operativo aparte» del PDF transversal se adaptan a «sección operativa de este levantamiento». La descarga resultante es integrada.
- La lista completa de preguntas guía se imprime como ayuda, pero no se convierte en un segundo grupo obligatorio de respuestas.

## 10. Respuestas, pendientes y campos condicionales

| Situación | Significado y tratamiento |
|---|---|
| Vacío | Sin respuesta; no se transforma en No ni No aplica. |
| Pendiente de confirmar | Existe una duda conocida; puede agregarse qué falta, con quién confirmarlo y una nota, todos opcionales. |
| No aplica | El tema no corresponde al caso; se oculta el detalle activo. |
| No se realiza actualmente | El tema puede ser relevante, pero no hay una práctica actual; permite registrar la necesidad futura. |
| Casilla marcada | La opción fue seleccionada para la pregunta correspondiente. |
| Casilla sin marcar | Opción no seleccionada, sin inferir que el cliente la rechazó. |
| Ninguno explícito | Respuesta válida solo si el usuario la eligió; no se obtiene de una lista vacía. |

Las selecciones Sí/No no llevan respuesta por defecto. Los checklists conservan opciones y selección. La revisión del apartado confirma que fue revisado, sin convertir todas las casillas vacías en respuestas negativas.

Las preguntas de detalle se muestran cuando corresponde. Si el usuario cambia una respuesta y un campo deja de aplicar, su contenido se conserva. Al exportar se identifica en un anexo de información conservada fuera del formulario vigente para que no parezca una respuesta activa.

En el cierre pueden registrarse prioridades expresadas por el cliente, acuerdos y pendientes. Son opcionales y no sustituyen la aprobación del alcance ni modifican la cotización.

## 11. Cambio de operación, cotización y plantillas

### Cambio de tipo de operación

Sin respuestas operativas, se cambia la plantilla conservando encabezado y procesos comunes. Con respuestas, el sistema explica qué sección cambiará y solicita confirmación. Conserva las respuestas de la operación anterior como antecedente y abre la nueva sin adivinar equivalencias. El usuario puede consultarlas para recuperar información.

El PDF para papel contiene únicamente el tipo vigente. La exportación `.md` incluye la información anterior en un anexo claramente separado, cuando exista. Esto conserva lo capturado sin volver a habilitar la selección multirramo.

### Cambio de cotización

Según D-05, permite corregir la vinculación mostrando folio y cliente anteriores/nuevos. Si hay respuestas, requiere confirmación y conserva el historial. Actualiza los datos heredados y señala que debe revisarse si las respuestas pertenecen al nuevo cliente. No copia movimientos, autorizaciones ni condiciones al módulo comercial.

Si cambia el cliente en la cotización de origen, el levantamiento debe detectar la diferencia, conservar el antecedente y solicitar revisión de la correspondencia antes de finalizar o exportar como revisado. Las correcciones del nombre del mismo cliente no se consideran automáticamente un cambio de identidad.

### Cambios a las plantillas

Cada levantamiento conserva una referencia a las versiones de la plantilla transversal y operativa utilizadas. Publicar una nueva versión no reescribe preguntas ni respuestas de registros existentes. No se requiere un editor de plantillas para el usuario en esta versión.

## 12. Adjuntos y trazabilidad

Permite adjuntar ejemplos de cotizaciones, formatos, hojas de cálculo, fotografías y otros documentos admitidos por las reglas de archivos del sistema. Cada adjunto tiene nombre original, sección relacionada, descripción opcional, usuario y fecha.

Los adjuntos son opcionales. Retirar uno del expediente vigente no elimina silenciosamente su historial. Se reutilizan los límites y controles de archivos existentes; si no están definidos, se deben resolver al integrar el componente, sin prometer carga ilimitada.

El sistema conserva autor, fecha y acción de creación, modificación, finalización, reapertura, cambio de tipo, cambio de cotización y exportación. La auditoría permite identificar las correcciones sin inundar la entrevista con mensajes ni exigir comentarios por cada pulsación.

## 13. PDF para levantamiento en papel

Botón: **Descargar formato en PDF**. Disponible con el Borrador creado, después de seleccionar tipo y cotización, sin respuestas obligatorias.

Se genera un solo PDF que contiene:

1. Encabezado con folio, cliente, cotización, tipo y responsable; datos faltantes con espacio para escribir.
2. Las nueve áreas transversales, cada una con aplicabilidad y preguntas completas.
3. La operación seleccionada, con todos sus apartados, checklists, tablas y preguntas de apoyo.
4. Problemas/necesidades, resultados esperados, notas y pendientes para cierre.

La salida es un formato en blanco para las respuestas, aun cuando el registro tenga captura digital. Solo completa el encabezado con datos disponibles. El botón no se presenta como un reporte de respuestas contestadas.

Para que pueda usarse desde el principio, incluye todas las áreas comunes y apartados de la plantilla vigente; no omite preguntas por selecciones aún no realizadas. Las instrucciones impresas indican qué puede saltarse si no aplica. Una decisión digital de No aplica no deja incompleto el formato general para papel.

El diseño sigue los PDF entregados: fondo blanco, títulos legibles, acentos azules discretos, casillas claras, tablas y líneas para escritura. Se unifican portada, tipografía, acentos ortográficos, márgenes y numeración «Página X de Y». No se concatena sin revisar paginación, portadas y espacios.

Se usan los mismos identificadores de apartado en PDF y pantalla para facilitar la captura posterior. Debe haber espacio suficiente para escribir y no cortarse una pregunta de sus opciones. La paridad de contenido se comprueba para las seis combinaciones: comunes + una operación.

Nombre sugerido: `LEV-000001_Formato_Servicios.pdf`. Descargar no modifica el estado ni marca preguntas como contestadas.

## 14. Exportación para crear el discovery

Botón: **Exportar para discovery (.md)**. Disponible también en Borrador y En captura. No se exige finalizar ni contestar todas las preguntas.

El documento contiene:

1. Identificación de levantamiento, cliente, cotización y operación; responsable, estado, fechas, revisión y versiones de plantilla.
2. Objetivo general y notas iniciales.
3. Procesos transversales, aplicabilidad y todas sus respuestas.
4. Operación seleccionada y todas sus respuestas, listas y tablas.
5. Necesidades, resultados esperados, reglas, prioridades, acuerdos y notas capturados.
6. Pendientes y secciones sin revisar.
7. Índice de adjuntos con nombre, sección y descripción; enlace autorizado cuando sea utilizable.
8. Antecedentes de respuestas fuera de la plantilla vigente o campos inactivos, si existen, claramente separados.

### Reglas de fidelidad

- Preservar texto completo, acentos, saltos de línea, valores, orden de etapas y detalle de Otro. No resumir ni corregir lo que dijo el entrevistado sin una edición explícita.
- Incluir la pregunta junto a la respuesta. No exportar valores aislados ni encabezados sin contexto.
- Identificar Sin respuesta, Pendiente de confirmar, No aplica y No se realiza actualmente con su significado correcto.
- En listas, mostrar opciones seleccionadas y no seleccionadas indicando que «no seleccionada» no es una respuesta negativa.
- Conservar notas ligadas a una pregunta y no esconder información solo por estar en un desplegable.
- No completar vacíos con ejemplos, conocimientos de otros clientes ni supuestos.
- No convertir el checklist en funcionalidades contratadas ni las prioridades en compromisos comerciales.
- No incluir contenido de archivos adjuntos como si hubiera sido leído por el sistema. Un índice de archivos no transporta los archivos ni garantiza acceso al agente que reciba el Markdown; podrán compartirse por separado cuando haga falta.
- No incluir textos técnicos internos, credenciales ni URLs públicas que evadan permisos. Las descargas deben respetar el acceso del usuario.
- Un archivo corresponde a una revisión consistente del registro, no a una mezcla de momentos distintos.

La introducción del archivo aclara: «Este documento contiene información de levantamiento. Se usa como insumo para elaborar y validar un discovery posterior. Las respuestas no constituyen alcance aprobado».

Nombre sugerido: `LEV-000001_Levantamiento_Servicios_2026-09-15.md`. El formato será Markdown legible en UTF-8. El desarrollo debe resolver la representación de textos con barras, saltos y caracteres especiales sin pérdida de contenido.

El `.md` generado por este módulo no es el JSON para cargar un discovery terminado en VectorIA. El paso posterior de discovery mantiene sus entregables y validaciones propios.

## 15. Acciones y efectos

| Acción | Resultado visible | Efecto sobre otros módulos |
|---|---|---|
| Crear | Borrador con folio, cliente y formulario | Agrega relación consultable a la cotización. |
| Capturar | Cambios guardados y avance actualizado | Ninguno sobre precios o estados comerciales. |
| Marcar No aplica | Detalle oculto y contenido anterior conservado | Ninguno. |
| Agregar etapa | Fila editable ordenada en la sección | No crea tareas de Proyecto automáticamente. |
| Descargar PDF | Archivo integrado para papel | Ninguno. |
| Finalizar | Estado Finalizado y revisión identificada | No autoriza cotización ni crea OS. |
| Reabrir | Estado En captura; historial conservado | No reabre OS ni proyectos. |
| Exportar Markdown | Archivo con respuestas y pendientes | No ejecuta un agente ni genera discovery automáticamente. |
| Autorizar cotización | Flujo existente de creación de OS | No exige ni finaliza un levantamiento. |

## 16. Criterios de aceptación

| ID | Condición comprobable |
|---|---|
| CA-01 | Desde una cotización, crear un levantamiento hereda su cliente y pide un solo tipo de operación. |
| CA-02 | Desde Levantamientos se selecciona primero el tipo y después una cotización existente; no permite guardar sin cotización. |
| CA-03 | El selector tiene exactamente las seis opciones definidas y no permite selección múltiple. |
| CA-04 | Cada combinación carga las nueve áreas transversales una vez y solo los apartados de la operación vigente. |
| CA-05 | Se conservan todas las preguntas, opciones, tablas y temas de los siete PDF según su función de captura o apoyo. |
| CA-06 | Un Borrador sin respuestas puede descargar un único PDF completo con encabezado, comunes y operación correcta. |
| CA-07 | El PDF incluye espacios para escritura, casillas legibles, preguntas guía y numeración continua, sin contenido cortado. |
| CA-08 | Cada pregunta de captura tiene correspondencia reconocible entre pantalla, PDF y Markdown. |
| CA-09 | Un usuario puede dejar respuestas pendientes, cambiar de sección y regresar sin perder datos confirmados. |
| CA-10 | Al guardar y volver a abrir se recuperan textos, listas, filas, Otro, notas y aplicabilidad. |
| CA-11 | Un fallo de guardado no muestra Guardado ni permite una exportación aparentemente actual con respuestas faltantes. |
| CA-12 | La captura concurrente detecta cambios ajenos y no reemplaza contenido silenciosamente. |
| CA-13 | Sí/No/Ninguno no se preseleccionan; no se admiten combinaciones incompatibles. |
| CA-14 | Marcar No aplica oculta detalle sin destruir respuestas; estas reaparecen al reactivar el campo. |
| CA-15 | Los ejemplos y preguntas guía no se registran automáticamente como respuestas. |
| CA-16 | Se agregan y ordenan etapas con actividad, responsable, herramienta y resultado, sin exigir filas vacías. |
| CA-17 | Sin guardar respuestas de entrevista, el registro queda en Borrador; con la primera respuesta pasa a En captura. |
| CA-18 | Finalizar exige revisión de secciones según D-04 y conserva los pendientes explícitos; no exige aprobación comercial. |
| CA-19 | Reabrir permite corregir y conserva la revisión anterior y sus fechas. |
| CA-20 | Cambiar de operación con respuestas pide confirmación, conserva comunes y mantiene el contenido anterior como antecedente. |
| CA-21 | Cambiar de cotización muestra ambas referencias y clientes, conserva respuestas e historial y exige revisar la correspondencia. |
| CA-22 | Una plantilla nueva no cambia automáticamente un levantamiento existente. |
| CA-23 | Exportar en Borrador, En captura o Finalizado produce un `.md` con estado, revisión y fecha correctos. |
| CA-24 | El `.md` preserva cada respuesta completa, incluidos saltos, acentos, símbolos, tablas, Otro y notas, sin resumir. |
| CA-25 | Vacío, pendiente, No aplica, No se realiza actualmente y casilla no marcada permanecen distinguibles. |
| CA-26 | El archivo identifica adjuntos sin afirmar que incorpora su contenido ni conceder acceso público. |
| CA-27 | Una OS puede crearse sin levantamiento o con uno incompleto; la ruta directa desde Cliente sigue funcionando. |
| CA-28 | Capturar, finalizar o exportar no modifica importe, autorización, OS, proyecto ni movimientos financieros. |
| CA-29 | Los permisos impiden acceder, editar o descargar registros ajenos al alcance permitido, incluso por URL directa. |
| CA-30 | El Programador puede consultar/exportar levantamientos relacionados con sus proyectos, pero no editar por defecto. |
| CA-31 | El listado permite buscar por folio/cliente/cotización y filtrar por tipo, estado y responsable. |
| CA-32 | Las acciones relevantes quedan en historial y el módulo no ofrece eliminación física de registros con historial. |
| CA-33 | Al crear un segundo levantamiento de una cotización se muestran los existentes; crear el nuevo no mezcla respuestas. |
| CA-34 | Vincular una cotización rechazada o cancelada muestra su estado y no la reactiva ni elimina el levantamiento. |
| CA-35 | Preguntar por inventario, nómina, crédito o tratamientos no crea esos módulos ni impone sus reglas en VectorIA. |
| CA-36 | En Atención por citas se puede documentar un servicio no clínico sin obligar a contestar diagnóstico o tratamiento. |

## 17. Casos de negocio para verificación

1. **Servicios con entrevista digital:** desde una cotización, seleccionar Servicios; describir diagnóstico, reparación, pruebas, herramientas actuales y anticipo; guardar, retomar y exportar. Comprobar que anticipos se describen sin registrar ingresos reales.
2. **Distribuidora con visita en papel:** seleccionar Comercial / distribución y una cotización; descargar antes de contestar; completar en papel y capturar después. Comprobar correspondencia de preguntas y entrega parcial.
3. **Atención con agenda no clínica:** seleccionar Atención por citas, documentar agenda y atención, marcar diagnóstico/tratamiento como No aplica y exportar sin inferencias médicas.
4. **Manufactura con faltantes:** capturar producción, consumos y merma; dejar costo real pendiente; revisar el apartado, finalizar según D-04 y verificar la advertencia de información pendiente en el `.md`.
5. **Proyecto con corrección:** finalizar un levantamiento de Proyectos, reabrir para corregir hitos y volver a exportar; ambas salidas deben indicar su revisión correcta.
6. **Logística con cambio de plantilla:** capturar un viaje y gastos, cambiar de tipo con confirmación y verificar conservación de antecedentes; el PDF solo muestra el tipo vigente.
7. **Venta sin levantamiento:** crear una OS desde una cotización autorizada y otra directamente desde Cliente. Ninguna operación debe exigir entrevista.
8. **Acceso del equipo técnico:** el Programador consulta el levantamiento relacionado con su proyecto; no puede editarlo ni acceder a uno no relacionado.
9. **Corrección de vínculo y datos comerciales:** cambiar cotización, comprobar el cliente y mantener respuestas para revisión; cancelar una cotización no borra su información de entrevista.
10. **Exportación completa:** usar respuestas largas, saltos, caracteres especiales, checklists, Otro, notas, adjuntos y campos desactivados; comparar cada contenido capturado con su representación exportada.

## 18. Entrega y límites de esta versión documental

Este discovery y su alcance son archivos nuevos de ampliación. No se han sustituido los documentos generales ni modificado un repositorio. La incorporación al sistema debe conservar los acuerdos actuales y revisar el código real antes de diseñar la solución técnica.

El paquete contiene el Markdown funcional, el alcance separado, un archivo `AGENTS.md` con reglas de integración, una representación JSON documental y los siete PDF fuente. El JSON facilita el traspaso de la definición; no se declara compatible con un importador de VectorIA sin verificar el contrato real.

Al implementar, cada parte deberá ser utilizable y comprobable. Al concluir el módulo se entregará un punto de prueba, una guía breve de verificación y evidencia de los criterios relevantes. La redacción de este discovery no acredita que el módulo ya esté construido ni desplegado.
