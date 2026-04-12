# Guía para IA: cómo construir apps externas sobre YiQi ERP

Este documento está pensado para personas sin experiencia técnica que usan una IA (por ejemplo Codex) para crear una aplicación conectada a YiQi ERP.

## 1) Qué le falta al sitio para que una IA trabaje mejor

Hoy el portal ya tiene los OpenAPI por módulo y un índice (`modules.json`). Para que una IA pueda generar integraciones completas con menos prueba/error, conviene sumar:

1. **Un "Quickstart" end-to-end (obligatorio)**
   - Flujo mínimo real: `login -> guardar token -> listar clientes -> crear pedido -> consultar stock`.
   - Ejemplos listos para copiar en `curl`, JavaScript y Python.

2. **Contrato de autenticación y sesión más explícito**
   - Dónde va el `Bearer token` exactamente.
   - Tiempo de expiración del token y política de recambio.
   - Errores típicos de auth (`401/403`) y recuperación.

3. **Convenciones transversales documentadas en un único lugar**
   - Paginación (`page`, `size`, `limit`, etc.).
   - Filtros, ordenamiento y formato de fechas.
   - Reglas de idempotencia (por ejemplo, creación de comprobantes).
   - Estructura estándar de errores.

4. **Mapa funcional por casos de uso (no solo por módulo)**
   - Ejemplo: "crear venta" cruza Seguridad + Clientes + Stock + Ventas + Finanzas.
   - Esto ayuda a IA y humanos a entender dependencias.

5. **Ambientes y precondiciones**
   - URL base por entorno (demo, producción).
   - Datos mínimos para pruebas (cliente demo, producto demo, depósito demo).
   - Campos obligatorios por tipo de operación.

6. **Checklist de producción**
   - Límites de tasa, timeouts y reintentos.
   - Logging con IDs de correlación.
   - Permisos mínimos por usuario técnico.

7. **Plantilla de prompt recomendada para usuarios no técnicos**
   - Un prompt base para pedirle a la IA una app funcional y segura.

## 2) Definiciones oficiales para integradores (abril 2026)

Estas reglas deben considerarse fuente de verdad al construir recetas para bots:

1. **Base URL**
   - URL única de API: `https://api.yiqi.com.ar`.
   - Pueden existir esquemas de test por cliente, pero no cambia la URL base.

2. **Autenticación**
   - Obtener token con `POST /token` en `Security.api.json`.
   - Enviar token como `Authorization: Bearer <token>`.
   - **No hay refresh token**: al vencer, se debe reloguear.

3. **Healthcheck canónico post-login**
   - Endpoint oficial: `GET /accountapi/GetLoginInformation`.
   - Se usa para validar sesión y recuperar contexto (`userName`, `schemaId`, etc.).

4. **Regla oficial de `schemaId`**
   - Método primario: usar `schemaId` devuelto por `GetLoginInformation` (último esquema usado por el usuario).
   - Método complementario: `GET /schemasapi/GetAvailable` para listar esquemas habilitados si hay más de uno.
   - Referencia operativa alternativa: el `schemaId` también aparece en URLs del frontend YiQi.

5. **Usuario de integración**
   - Recomendado (y próximo a obligatorio): usar usuario no interactivo por integración, marcado como **INTEGRADOR**.
   - Evitar compartir usuario humano entre frontend y procesos automáticos.

6. **Datos demo**
   - No existe dataset demo estable oficial. Las recetas deben declarar precondiciones mínimas.

## 3) Prompt recomendado para pasarle a la IA

Usar algo como:

> "Quiero que construyas una app [web/móvil/backend] que se conecte a YiQi ERP. Usa `modules.json` para descubrir módulos y las specs OpenAPI para generar cliente API tipado. Implementa autenticación con bearer token, manejo de refresh/login, reintentos con backoff, logging y validaciones. Empezá con este flujo: login, obtener clientes, consultar stock de un SKU y crear un pedido de venta. Mostrame estructura de carpetas, variables de entorno, scripts de arranque y tests de integración con mocks." 

> "Quiero que construyas una app [web/móvil/backend] que se conecte a YiQi ERP. Usa `modules.json` para descubrir módulos y las specs OpenAPI para generar cliente API tipado. Implementa autenticación con bearer token (sin refresh token: si vence, reloguear), healthcheck con `GetLoginInformation`, resolución de `schemaId` desde ese endpoint y fallback con `GetAvailableSchemas`. Empezá con este flujo: login, healthcheck, consultar disponibilidad de stock de un SKU. Mostrame estructura de carpetas, variables de entorno, scripts de arranque y tests de integración con mocks." 

## 4) Aplicaciones externas posibles (y validación conceptual)

### A. E-commerce conectado a ERP
- **Objetivo:** sincronizar catálogo, stock y pedidos.
- **Módulos YiQi:** Seguridad, Stock, Clientes y Proveedores, Ventas, Finanzas.
- **Viabilidad:** **Alta**.
- **Riesgo principal:** desfasaje de stock si no hay estrategia de sincronización.
- **Mitigación:** polling incremental + reserva de stock + conciliación nocturna.

### B. App de vendedores (CRM + toma de pedidos)
- **Objetivo:** cargar oportunidades, visitas y pedidos desde celular.
- **Módulos YiQi:** Comercial/CRM, Clientes, Ventas.
- **Viabilidad:** **Alta**.
- **Riesgo principal:** operación offline/online.
- **Mitigación:** cola local + sincronización por lotes + deduplicación por clave externa.

### C. Portal de clientes B2B (autogestión)
- **Objetivo:** que clientes vean cuenta corriente, facturas y estado de pedidos.
- **Módulos YiQi:** Clientes y Proveedores, Ventas, Finanzas.
- **Viabilidad:** **Media-Alta**.
- **Riesgo principal:** seguridad y permisos por cliente.
- **Mitigación:** token por usuario final + autorización por entidad + auditoría.

### D. BI / tableros de gestión
- **Objetivo:** consolidar KPIs de ventas, cobranza y stock.
- **Módulos YiQi:** Ventas, Stock, Finanzas, Contabilidad.
- **Viabilidad:** **Alta**.
- **Riesgo principal:** performance de consultas masivas.
- **Mitigación:** ETL incremental + cache + réplicas analíticas.

### E. Automatización de compras
- **Objetivo:** generar sugerencias o órdenes según quiebre de stock.
- **Módulos YiQi:** Stock, Compras, Producción (si aplica).
- **Viabilidad:** **Media**.
- **Riesgo principal:** reglas de negocio incompletas (mínimos, lead time).
- **Mitigación:** etapa 1 de recomendación, etapa 2 de aprobación humana.

## 5) Flujo mínimo sugerido para validar una integración

1. Autenticar en Seguridad (`POST /token`) y guardar token.
2. Ejecutar healthcheck (`GET /accountapi/GetLoginInformation`) y tomar `schemaId`.
3. Si hay múltiples esquemas posibles, confirmar con `GET /schemasapi/GetAvailable`.
4. Consultar disponibilidad de stock (flujo priorizado).
5. Continuar con el caso de uso (clientes, pedido, cobranza, etc.) segun precondiciones del cliente.
6. Registrar trazabilidad (request/response + IDs funcionales) y manejo de 401 con relogin.

## 6) Criterios de "listo para usar con IA"

Una integración está madura cuando:
- existe un ejemplo funcional de punta a punta;
- los errores comunes están documentados con acciones de recuperación;
- la IA puede inferir el flujo completo sin adivinar campos críticos;
- hay datos demo reproducibles para pruebas.

## 7) Siguiente mejora recomendada del sitio

Publicar una sección "Recetas" con 5 flujos estándar:
1. Login + healthcheck.
2. Consulta de disponibilidad de stock (prioridad actual).
3. ABM de clientes.
4. Pedido de venta completo.
5. Cobranza/pago básico.

Con eso, un usuario no técnico puede pedirle a una IA una app real con mucha menos fricción.
