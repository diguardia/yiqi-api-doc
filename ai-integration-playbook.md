# Guía para IA: cómo construir apps externas sobre YiQi ERP

Este documento está pensado para personas sin experiencia técnica que usan una IA (por ejemplo Codex) para crear una aplicación conectada a YiQi ERP.

## 1) Qué le falta al sitio para que una IA trabaje mejor

Hoy el portal ya tiene los OpenAPI por módulo y un índice (`modules.json`). Para que una IA pueda generar integraciones completas con menos prueba/error, conviene sumar:

1. **Un "Quickstart" end-to-end (obligatorio)**
   - Flujo mínimo real: `login -> guardar token -> listar clientes -> crear pedido -> consultar stock`.
   - Ejemplos listos para copiar en `curl`, JavaScript y Python.

2. **Contrato de autenticación y sesión más explícito**
   - Dónde va el `Bearer token` exactamente.
   - Tiempo de expiración del token y cómo renovarlo.
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

## 2) Prompt recomendado para pasarle a la IA

Usar algo como:

> "Quiero que construyas una app [web/móvil/backend] que se conecte a YiQi ERP. Usa `modules.json` para descubrir módulos y las specs OpenAPI para generar cliente API tipado. Implementa autenticación con bearer token, manejo de refresh/login, reintentos con backoff, logging y validaciones. Empezá con este flujo: login, obtener clientes, consultar stock de un SKU y crear un pedido de venta. Mostrame estructura de carpetas, variables de entorno, scripts de arranque y tests de integración con mocks." 

## 3) Aplicaciones externas posibles (y validación conceptual)

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

## 4) Flujo mínimo sugerido para validar una integración

1. Autenticar en Seguridad y guardar token.
2. Leer maestros básicos (clientes, productos, depósitos).
3. Consultar disponibilidad de stock.
4. Simular creación de documento comercial (pedido/remito/factura según flujo).
5. Confirmar impacto contable/financiero si corresponde.
6. Registrar trazabilidad (request/response + IDs funcionales).

## 5) Criterios de "listo para usar con IA"

Una integración está madura cuando:
- existe un ejemplo funcional de punta a punta;
- los errores comunes están documentados con acciones de recuperación;
- la IA puede inferir el flujo completo sin adivinar campos críticos;
- hay datos demo reproducibles para pruebas.

## 6) Siguiente mejora recomendada del sitio

Publicar una sección "Recetas" con 5 flujos estándar:
1. Login + healthcheck.
2. ABM de clientes.
3. Consulta y ajuste de stock.
4. Pedido de venta completo.
5. Cobranza/pago básico.

Con eso, un usuario no técnico puede pedirle a una IA una app real con mucha menos fricción.
