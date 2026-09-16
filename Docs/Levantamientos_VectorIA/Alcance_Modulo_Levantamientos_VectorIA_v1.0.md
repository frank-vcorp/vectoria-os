# Alcance funcional: módulo de Levantamientos

**Sistema:** VectorIA  
**Versión:** 1.0  
**Fecha:** 15 de septiembre de 2026  
**Estado:** preparado para revisión. Complementa el discovery del módulo y no constituye por sí mismo una aprobación contractual.

## Objetivo

Contar con una herramienta sencilla para entrevistar a un cliente, documentar cómo trabaja su empresa y reunir la información necesaria para elaborar posteriormente el discovery de su sistema.

## Qué permitirá hacer

1. Crear un levantamiento desde una cotización o desde el módulo, seleccionando una cotización existente.
2. Elegir un solo tipo de operación: Servicios, Comercial/distribución, Manufactura/transformación, Proyectos, Atención por citas/expediente o Logística/transporte.
3. Obtener un formulario integrado con los procesos comunes y la operación seleccionada.
4. Contestar mediante campos abiertos, checklists y tablas, con preguntas guía disponibles cuando se necesiten.
5. Guardar automáticamente, dejar pendientes y continuar en otra sesión.
6. Adjuntar ejemplos y documentos de apoyo.
7. Descargar un PDF completo para levantar información en papel antes de contestar en pantalla.
8. Finalizar, reabrir y corregir el levantamiento conservando el historial.
9. Exportar un archivo Markdown con todas las respuestas, notas y pendientes para preparar el discovery.
10. Buscar y consultar los levantamientos según los permisos del usuario.

## Información que cubrirá

Los procesos comunes serán Comercial, Clientes, Compras, Inventario, Facturación, Finanzas, Documentos y administración, Personal, y Dirección y control.

La sección operativa utilizará el PDF del tipo elegido. Incluirá cómo se trabaja actualmente, responsables, software o archivos utilizados, etapas, controles, excepciones, condiciones económicas, evidencias, entrega y cierre, según corresponda.

También habrá espacios para registrar problemas, necesidades, resultados esperados y asuntos pendientes de confirmar.

## Reglas principales

- Todo levantamiento estará ligado a una cotización y tomará de ella el cliente.
- Realizar un levantamiento será opcional para generar una orden de servicio.
- Se seleccionará un solo tipo de operación. Las actividades complementarias se describirán en notas.
- La captura podrá avanzar aunque falten respuestas.
- Las casillas sin marcar y las respuestas vacías no se interpretarán automáticamente como No o No aplica.
- Capturar necesidades no modificará la cotización ni las convertirá en alcance contratado.
- Cambiar una plantilla no borrará silenciosamente lo ya escrito.
- Los permisos existentes protegerán también los documentos y adjuntos.

## Documentos que generará el módulo

| Documento | Contenido y uso |
|---|---|
| PDF para papel | Formato de respuestas en blanco, con datos generales disponibles, preguntas, checklists y espacios para escribir. Integra comunes y una operación. |
| Levantamiento en Markdown | Información capturada organizada para elaborar el discovery; también puede exportarse incompleta y señalará lo pendiente. |

El Markdown conserva la información escrita sin resumir ni inventar respuestas. Los adjuntos se identifican por nombre y referencia; no se incorporan automáticamente al texto.

## Experiencia esperada

Captura minimalista, una sección a la vez, datos heredados, autoguardado, campos que se muestran cuando corresponden y navegación directa entre apartados. No se exige contestar un cuestionario extenso de principio a fin en una sola sesión.

## Qué queda fuera

- Seleccionar o combinar varios tipos de operación en un levantamiento.
- Generar automáticamente el discovery o el alcance mediante IA.
- Leer automáticamente documentos adjuntos o convertir fotografías de formatos contestados en respuestas.
- Crear cotizaciones, cobros, facturas, órdenes o proyectos por el hecho de contestar la entrevista.
- Construir los procesos operativos de la empresa entrevistada dentro del sistema de VectorIA.
- Portal de clientes, edición simultánea en tiempo real, captura completa sin conexión o editor de plantillas para el usuario.

## Detalles propuestos para revisión

El discovery identifica cinco decisiones adicionales: permitir varios levantamientos independientes por cotización; no exigir una cotización autorizada para entrevistar; extender permisos al Vendedor y consulta al Programador relacionado; finalizar con pendientes identificados; y corregir la cotización vinculada conservando el historial. Se documentan como propuestas de esta versión, no como acuerdos anteriores.

## Resultado de la entrega

El módulo se considerará listo para revisión cuando permita completar los flujos de captura digital y en papel, recuperar lo guardado, proteger el acceso y generar ambos documentos con la información correcta, sin impedir la creación de órdenes de servicio sin levantamiento.

Este alcance no fija precio ni plazo de ejecución. Ambos deberán establecerse en la cotización o acuerdo correspondiente.
