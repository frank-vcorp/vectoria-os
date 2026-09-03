Necesito actualizar el **módulo de Proyectos de VectorIA** para que sea compatible con el nuevo concepto de **Plan de Validación**.

Antes de modificar código:

1. Revisa completamente la implementación actual del módulo Proyectos.
2. Revisa sus modelos, componentes, base de datos, relaciones, estados y lógica existente.
3. Conserva todo lo que siga siendo compatible.
4. No hagas una reescritura innecesaria.
5. Respeta como fuente de verdad funcional el Discovery vigente del proyecto.

## Objetivo del cambio

Anteriormente las fases del Proyecto estaban pensadas principalmente como fases del desarrollo.

Ahora deben funcionar como **fases de validación funcional del sistema**, utilizadas por el programador para comprobar progresivamente que lo desarrollado cumple con el Discovery.

Las fases se crearán dinámicamente importando un archivo `.md` denominado **Plan de Validación**.

---

# 1. Formato obligatorio del archivo

El sistema debe importar únicamente archivos `.md` que respeten esta estructura:

```md
# VECTORIA_PLAN_VALIDACION
version: 1.0
nombre: Plan de Validación
discovery: discovery-vectoria-v1.6-revision-final.md
fases: 6
checklist_obligatorio: false

# Fase 1 — Nombre de la fase

## Objetivo
Texto del objetivo.

## Comprobaciones
- Comprobación 1.
- Comprobación 2.
- Comprobación 3.

## Resultado esperado
Texto del resultado esperado.

# Fase 2 — Nombre...
```

## Validaciones del importador

El archivo debe:

- comenzar exactamente con `# VECTORIA_PLAN_VALIDACION`;
- contener `version`;
- contener `nombre`;
- contener `discovery`;
- contener `fases`;
- contener `checklist_obligatorio`;
- tener entre **5 y 7 fases**;
- tener numeración consecutiva desde Fase 1;
- coincidir el número declarado en `fases:` con las fases realmente encontradas.

Cada fase debe tener obligatoriamente:

- Nombre;
- Objetivo;
- Comprobaciones;
- Resultado esperado.

Debe existir al menos una Comprobación por fase.

Si el archivo no cumple el formato:

- no importar parcialmente;
- rechazar la importación completa;
- mostrar claramente qué error se encontró y, cuando aplique, en qué fase.

No intentes interpretar libremente un archivo mal formado.

---

# 2. Información que debe guardar cada fase

Cada fase deberá guardar como mínimo:

- número / posición;
- nombre;
- objetivo;
- resultado esperado;
- fecha de inicio;
- fecha de término;
- situación actual;
- comprobaciones;
- observaciones de validación cuando existan.

Cada Comprobación debe guardar:

- texto;
- marcada / no marcada;
- opcionalmente `No aplica` si la arquitectura actual permite incorporarlo sin complicar innecesariamente el módulo.

---

# 3. Checklist NO obligatorio

El encabezado:

`checklist_obligatorio: false`

significa que las Comprobaciones sirven como guía para el programador, pero **no son requisito obligatorio para enviar la fase a validar**.

El usuario podrá marcar y desmarcar cada comprobación.

Si presiona **Enviar a validar** y existen Comprobaciones pendientes, mostrar una confirmación:

**Hay comprobaciones pendientes en esta fase. Se recomienda revisarlas antes de enviarla a validación.**

Acciones:

- Cancelar
- Enviar de todos modos

Si confirma, debe permitirse el envío.

Por lo tanto:

**el checklist orienta y documenta la revisión, pero no bloquea el flujo.**

La implementación debería respetar también el valor `checklist_obligatorio` importado, para que en el futuro pueda existir un Plan donde sea `true`, aunque inicialmente utilizaremos `false`.

---

# 4. Navegación visual de las fases

Mantener o implementar un **stepper horizontal** en la parte superior del Proyecto.

Debe mostrar visualmente las fases en orden.

Situaciones visuales:

- Validada
- En validación
- Fase actual
- Disponible
- Bloqueada

El usuario puede seleccionar cualquier fase que ya haya sido desbloqueada para consultar su información.

No debe poder entrar operativamente a una fase que todavía esté bloqueada.

No utilizar navegación basada únicamente en botones Anterior / Siguiente.

---

# 5. Vista de una fase

Al seleccionar una fase mostrar una sola tarjeta o vista limpia.

Siempre visible:

- `Fase N de X`
- Nombre
- Objetivo
- Fecha de inicio cuando exista
- Fecha de término cuando exista
- situación
- acción principal correspondiente

Después mostrar:

### Comprobaciones

Preferentemente en una sección desplegable o visualmente compacta para no saturar la pantalla.

Cada elemento debe poder marcarse individualmente.

Mostrar también:

### Resultado esperado

Puede mostrarse debajo de las Comprobaciones o mediante una sección desplegable, pero debe permanecer fácilmente accesible.

La prioridad visual es que la pantalla sea limpia y que la información detallada pueda consultarse cuando se necesite.

---

# 6. Flujo de las fases

La primera fase queda disponible al importar correctamente el Plan.

Las demás comienzan bloqueadas.

El desbloqueo es estrictamente secuencial.

Ejemplo:

Fase 1 disponible  
Fase 2 bloqueada  
Fase 3 bloqueada

No puede desbloquearse Fase 3 mientras Fase 2 nunca haya sido desbloqueada.

## Flujo recomendado

Trabajar fase  
→ realizar Comprobaciones  
→ Enviar a validar  
→ Validar  
→ avanzar a la siguiente

## Avanzar sin validación

Debe seguir siendo posible avanzar a la fase inmediatamente siguiente aunque la actual todavía no haya sido validada.

Mostrar advertencia:

**La fase anterior aún no ha sido validada. Se recomienda esperar su validación porque una corrección podría afectar el trabajo posterior.**

Acciones:

- Cancelar
- Continuar de todos modos

Si confirma:

- desbloquear únicamente la fase inmediatamente siguiente;
- nunca permitir saltar fases.

---

# 7. Enviar a validar

El Programador tendrá la acción:

**Enviar a validar**

Después:

- la fase queda En validación;
- un usuario autorizado puede Validar;
- o puede devolverla con Observaciones.

Al Validar:

- estado visible = Validada;
- registrar automáticamente Fecha de término.

Si se devuelve:

- conservar observaciones;
- permitir continuar trabajando;
- permitir volver a Enviar a validar.

Si una fase anterior se devuelve después de haber desbloqueado una posterior:

- NO volver a bloquear automáticamente la fase posterior;
- mostrar claramente que existe una fase anterior con correcciones pendientes;
- el Proyecto no puede considerarse terminado hasta que todas las fases estén Validadas.

---

# 8. Fechas

Fecha de inicio de fase:

- automática cuando la fase se desbloquea por primera vez.

Fecha de término:

- automática cuando queda Validada.

No sobrescribir la Fecha de inicio si una fase vuelve a revisión.

---

# 9. Información general del Proyecto

Mantener siempre visible:

- Folio del Proyecto;
- Cliente;
- OS relacionada;
- Servicio;
- Programador;
- Fecha de entrega;
- días restantes.

Si está vencido:

- mostrar días de retraso.

El Proyecto se considera terminado únicamente cuando **todas las fases están Validadas**.

---

# 10. Importación del Plan

El Proyecto puede existir sin fases antes de importar el Plan.

En ese caso mostrar claramente:

**Plan de Validación pendiente de importar**

Acción:

**Importar Plan de Validación**

Una vez importado correctamente:

- generar las fases;
- generar sus Comprobaciones;
- habilitar únicamente la Fase 1.

No permitir importar dos veces accidentalmente.

El proceso debe ser idempotente.

Si ya existe un Plan importado y ninguna fase ha iniciado, puede permitirse reemplazarlo previa confirmación.

Si alguna fase ya inició:

- no permitir reemplazar el Plan;
- explicar que existe historial de validación y que el Plan ya no puede sustituirse.

---

# 11. No confundir este Plan con instrucciones para Cursor

El **Plan de Validación no define cómo debe desarrollarse técnicamente el sistema**.

Su función es exclusivamente:

- organizar pruebas;
- orientar al programador;
- registrar comprobaciones;
- ordenar validaciones;
- documentar avance funcional.

No conviertas las Comprobaciones en tareas técnicas de desarrollo.

---

# 12. Compatibilidad y migración

Revisa la estructura actual del módulo Proyectos y adapta lo necesario procurando:

- conservar datos existentes cuando sea posible;
- evitar tablas o campos duplicados;
- reutilizar componentes actuales compatibles;
- mantener relaciones existentes Proyecto ↔ OS;
- mantener Programador heredado desde OS;
- mantener máximo de 7 fases;
- mantener evidencias opcionales si ya existen y no interfieren.

Si se necesita una migración de base de datos, constrúyela de forma segura.

---

# 13. Antes de terminar

Prueba como mínimo:

1. Importar Plan válido de 6 fases.
2. Crear correctamente todas las fases.
3. Crear todas las Comprobaciones.
4. Rechazar Plan con menos de 5 fases.
5. Rechazar Plan con más de 7.
6. Rechazar Plan sin Objetivo.
7. Rechazar Plan sin Comprobaciones.
8. Rechazar numeración incorrecta.
9. Marcar y desmarcar checklist.
10. Enviar a validar con checklist completo.
11. Enviar a validar con checklist incompleto y confirmar advertencia.
12. Validar fase.
13. Desbloquear siguiente.
14. Avanzar sin validar mediante advertencia.
15. Intentar saltar una fase.
16. Devolver una fase anterior después de haber avanzado.
17. Verificar que la posterior no vuelva a bloquearse.
18. Verificar que Proyecto no termine mientras exista alguna fase sin validar.
19. Intentar importar nuevamente un Plan una vez iniciado.
20. Confirmar que no se generen registros duplicados.

## Al finalizar

No continúes haciendo cambios adicionales.

Entrégame:

- resumen de lo modificado;
- migraciones realizadas;
- archivos principales modificados;
- pruebas ejecutadas;
- resultados;
- cualquier decisión que hayas tenido que tomar;
- cualquier discrepancia encontrada contra el Discovery;
- pasos exactos para que yo pueda probar manualmente el nuevo módulo de Proyectos.