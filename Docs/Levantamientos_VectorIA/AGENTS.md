# Reglas para integrar el módulo de Levantamientos en VectorIA

Fecha: 2026-09-15. Este archivo acompaña la definición del módulo; todavía no ha sido incorporado a un repositorio.

## Antes de escribir código

1. Lee el `AGENTS.md` del repositorio existente y su documentación vigente. Integra estas reglas sin reemplazar instrucciones ajenas a este módulo.
2. Lee `Discovery_Modulo_Levantamientos_VectorIA_v1.0.md` completo, sus criterios de aceptación y los siete PDF de `fuentes/`.
3. Conserva el discovery y el alcance como documentos separados. Consulta `Alcance_Modulo_Levantamientos_VectorIA_v1.0.md`.
4. Usa las decisiones explícitas de esta conversación como prioridad para este módulo. El discovery general `discovery-vectoria-v1.0.md` declara que sustituye a la antigua definición funcional. No restaures funcionalidades descartadas usando la arquitectura o el plan antiguos.
5. No cambies infraestructura, base de datos ni arquitectura por iniciativa de este discovery. Reutiliza el proyecto existente y comprueba su estado real.
6. Revisa las decisiones de detalle D-01 a D-05: están propuestas en esta versión y no deben presentarse como acuerdos históricos del usuario.

## Reglas que deben conservarse

- El levantamiento es opcional para generar una OS; su cotización vinculada es obligatoria.
- Mantén las rutas existentes Cliente → OS y Cotización autorizada → OS. Una captura incompleta no bloquea esas rutas.
- Selecciona exactamente un tipo de operación de los seis disponibles. No implementes combinación automática de ramos.
- Incluye los nueve procesos transversales una sola vez y una sola plantilla operativa.
- Distingue la empresa cliente analizada de la empresa VectorIA. Preguntar por inventario, nómina o transporte no implementa esos módulos en VectorIA.
- La captura debe ser breve, progresiva, con autoguardado y datos heredados. Solamente cotización y tipo de operación requieren captura para crear el registro.
- No interpretes una respuesta vacía o una casilla sin marcar como un No.
- Permite PDF completo para papel antes de contestar; usa el estilo de las fuentes, preguntas, checklists y espacios para escritura.
- Exporta las respuestas a Markdown sin resumir, inventar o reinterpretar. Conserva notas, pendientes, opciones no seleccionadas identificadas como tales y las referencias a adjuntos.
- No generes automáticamente el discovery del cliente, alcance aprobado, código, OS, proyectos, cobros ni facturas a partir de respuestas.
- No elimines físicamente registros con historial. No borres respuestas al ocultar preguntas ni al cambiar de plantilla.
- Aplica los permisos vigentes y protege también exportaciones y adjuntos. No publiques archivos privados mediante enlaces abiertos.
- Mantén una revisión identificable del contenido exportado y la versión de las plantillas usadas.
- No agregues OCR, IA generativa, plantillas editables por el usuario, portal de clientes ni operación sin conexión completa al alcance inicial.

## Forma de trabajar

- El discovery describe comportamiento, datos y resultados. Resuelve autónomamente las decisiones técnicas rutinarias compatibles con el repositorio.
- Construye y verifica por partes, dentro de este módulo. Entrega un flujo utilizable y no solo pantallas o estructuras vacías.
- Comprueba especialmente los permisos, autoguardado, cambio de tipo de operación, PDF y fidelidad de la exportación.
- Al terminar, presenta dónde probarlo, qué comprobar y los resultados esperados. Corrige problemas y revisa efectos en funciones relacionadas.
- No comiences otro módulo sin la indicación correspondiente del usuario. La autorización de este documento no equivale a publicar o desplegar código.
- Conserva las reglas existentes de revisión de proyectos. El papel de Product Manager descrito por el manual no crea un nuevo rol de aplicación; en el discovery general la validación definitiva corresponde inicialmente al Administrador.
- No guardes secretos ni credenciales en la documentación ni en el repositorio.

## Entregable JSON

`Discovery_Modulo_Levantamientos_VectorIA_v1.0.json` es una representación documental con referencias al Markdown, tareas y criterios. No se ha verificado contra un importador de VectorIA. Comprueba el contrato real de importación antes de cargarlo; no inventes que es compatible.
