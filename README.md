# VectorIA OS

Sistema web interno para VectorIA: flujo comercial, ejecución de proyectos, suscripciones, finanzas y facturación CFDI.

| | |
|---|---|
| **Repositorio** | https://github.com/frank-vcorp/vectoria-os |
| **Stack** | Next.js 15 · TypeScript · Drizzle · PostgreSQL · Facturapi |
| **Puerto** | `43123` |
| **Documentación** | [`Docs/discovery-vectoria-v1.0.md`](Docs/discovery-vectoria-v1.0.md) · [`Docs/plan-desarrollo-vectoria-v1.0.md`](Docs/plan-desarrollo-vectoria-v1.0.md) |
| **Estado** | Fase 1 — lista para verificación local |

---

## Inicio rápido

```bash
cp .env.example .env.local   # obligatorio: DATABASE_URL y SESSION_SECRET
# Levantar PostgreSQL (docker compose up -d db)
npm install
npm run bootstrap   # migrate + seed (lee .env.local)
npm run dev
```

Abre **http://127.0.0.1:43123**

### Verificación Fase 1

1. Login con admin seed
2. **Usuarios** — crear, editar, activar/desactivar
3. **Permisos** — toggles por rol y guardar
4. **Catálogos** — CRUD básico, estatus, carga rápida (+) en ingresos/egresos/proveedores
5. **Auditoría** — ver registros de cambios
6. (Opcional) `docker build` + contenedor local — healthcheck en `/api/health`

Credenciales seed (cambiar en producción):

- Correo: `admin@vector-ia.mx`
- Contraseña: `VectorIA2026!`

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo en `:43123` |
| `npm run build` | Build producción |
| `npm start` | Servidor producción |
| `npm run bootstrap` | Migraciones + seed inicial |
| `npm run db:generate` | Generar migraciones Drizzle |
| `npm run test:plan-parser` | Validar parser de Plan de Desarrollo |

---

## Despliegue Coolify

- Dockerfile incluido · puerto `43123`
- Variables: `DATABASE_URL`, `SESSION_SECRET`, `FACTURAPI_API_KEY`
- Healthcheck: `GET /api/health`
- El entrypoint ejecuta migraciones al arrancar y el seed en segundo plano (idempotente)

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
