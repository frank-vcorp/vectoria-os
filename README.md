# VectorIA OS

Sistema web interno para VectorIA: flujo comercial, ejecución de proyectos, suscripciones, finanzas y facturación CFDI.

| | |
|---|---|
| **Repositorio** | https://github.com/frank-vcorp/vectoria-os |
| **Documentación** | [`Docs/discovery-vectoria-v1.0.md`](Docs/discovery-vectoria-v1.0.md) · [`Docs/plan-desarrollo-vectoria-v1.0.md`](Docs/plan-desarrollo-vectoria-v1.0.md) |
| **Estado** | Discovery y plan de desarrollo v1.0 — listo para Fase 1 |

---

## Alcance

14 módulos funcionales: Clientes, Oportunidades, Cotizaciones, Órdenes de Servicio, Proyectos, Suscripciones, Bancos, Ingresos/Egresos, Cuentas por Pagar, Flujo Financiero, Reporte Financiero, Facturación, Catálogos, Usuarios y Roles.

Principios: simplicidad, captura rápida, trazabilidad, mínima duplicidad, automatización de herencias y control financiero práctico.

---

## Plan de desarrollo (7 fases)

| Fase | Objetivo |
|------|----------|
| 1 | Base del sistema, usuarios y catálogos |
| 2 | Clientes y Oportunidades |
| 3 | Cotizaciones y Órdenes de Servicio |
| 4 | Proyectos y Suscripciones |
| 5 | Finanzas |
| 6 | Facturación y Reporte Financiero |
| 7 | Integración y validación final |

Detalle completo en [`Docs/plan-desarrollo-vectoria-v1.0.md`](Docs/plan-desarrollo-vectoria-v1.0.md).

---

## Flujo comercial principal

```
Cliente → Oportunidad → Cotización → Orden de Servicio
                              ↓
                    Proyecto / Suscripción
                              ↓
                    Finanzas / Facturación
```

---

## Licencia

Uso interno Vector IA / VCorp. Repositorio privado.
