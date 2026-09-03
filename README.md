# VectorIA OS

Sistema web interno para VectorIA: flujo comercial, ejecución de proyectos, suscripciones, finanzas y facturación CFDI.

| | |
|---|---|
| **Repositorio** | https://github.com/frank-vcorp/vectoria-os |
| **Stack** | Next.js 15 · TypeScript · Drizzle · PostgreSQL · Facturapi |
| **Puerto** | `43123` |
| **Documentación** | [`Docs/discovery-vectoria-v1.0.md`](Docs/discovery-vectoria-v1.0.md) · [`Docs/plan-desarrollo-vectoria-v1.0.md`](Docs/plan-desarrollo-vectoria-v1.0.md) |
| **Estado** | Fase 2 — Clientes y Oportunidades, pendiente verificación |

---

## Fuentes de verdad

| Archivo | Uso |
|---------|-----|
| [`Docs/discovery-vectoria-v1.0.md`](Docs/discovery-vectoria-v1.0.md) | Especificación funcional por módulo |
| [`Docs/plan-desarrollo-vectoria-v1.0.md`](Docs/plan-desarrollo-vectoria-v1.0.md) | Orden de las 7 fases (documento de construcción, no pantalla de la app) |

Cada fase se detiene para verificación antes de avanzar.

## Inicio rápido

```bash
cp .env.example .env.local   # obligatorio: DATABASE_URL y SESSION_SECRET
# Levantar PostgreSQL (docker compose up -d db)
npm install
npm run bootstrap   # migrate + seed (lee .env.local)
npm run dev
```

Abre **http://127.0.0.1:43123**

### Verificación Fase 1 (Discovery §2, §16, §17, §18)

Referencia: [`Docs/plan-desarrollo-vectoria-v1.0.md`](Docs/plan-desarrollo-vectoria-v1.0.md) Fase 1.

1. **Auth** — login / logout
2. **Usuarios** (§17) — nombre, correo, rol, estatus activo/inactivo; crear, editar, desactivar
3. **Permisos** (§17) — lectura y escritura por módulo y rol; defaults Administrador / Vendedor / Programador
4. **Catálogos** (§16) — servicios, periodicidades, condiciones de pago, ingresos, egresos, proveedores; estatus; carga rápida (+) en ingresos/egresos/proveedores
5. **Auditoría** (§2) — registros de creación, modificación y cancelación
6. **Folios** (§18) — infraestructura lista (`nextFolio`); uso en entidades desde Fase 2+
7. (Opcional) Docker local — healthcheck `/api/health`

**Fuera de Fase 1:** Planes de Desarrollo importables (Fase 4 — Proyectos).

### Verificación Fase 2 (Discovery §4–§5)

Referencia: [`Docs/plan-desarrollo-vectoria-v1.0.md`](Docs/plan-desarrollo-vectoria-v1.0.md) Fase 2.

1. **Clientes** (§4) — folio auto, nombre, contacto opcional, celular, correo, datos fiscales desplegables, búsqueda, carga rápida
2. **Oportunidades** (§5) — folio auto, cliente (carga rápida), vendedor heredado, servicio, descripción, estados Abierta / Cotizada / No interesado, bitácora
3. **Cotización desde Oportunidad** — herencia de cliente, servicio, descripción y defaults del catálogo; completar tiempo de entrega y condiciones de pago

**Fase 3:** autorización, rechazo, PDF y flujo completo de cotizaciones.

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

Scripts de Fase 4 (no usados en Fase 1): `npm run test:plan-parser`

---

## Despliegue Coolify

- Dockerfile incluido · puerto `43123`
- Variables: `DATABASE_URL`, `SESSION_SECRET`, `FACTURAPI_API_KEY`
- Healthcheck: `GET /api/health` · start-period **30s** (Coolify + Dockerfile)
- El entrypoint ejecuta migraciones al arrancar y el seed en segundo plano (idempotente)
- Deploy sin espera larga: `./scripts/coolify-deploy.sh` (dispara y sigue; `--wait` espera máx. ~90s)

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
