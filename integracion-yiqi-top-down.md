# Evaluación TOP-DOWN para integrar una app con YiQi ERP

## 1) Nivel estratégico (visión general)

**Conclusión:** Sí, la integración es viable.

La base documental es sólida para iniciar una integración:
- Hay un índice de módulos machine-readable (`modules.json`).
- Hay múltiples especificaciones OpenAPI por dominio funcional.
- Existe una guía orientada a integraciones con IA (`ai-integration-playbook.md`) con flujos y riesgos.

Esto permite construir integraciones reales (e-commerce, CRM móvil, B2B, BI), aunque todavía hay huecos de documentación operativa para acelerar una implementación “sin fricción”.

## 2) Nivel arquitectura funcional (dominios y cobertura)

El ERP está fragmentado por módulos de negocio relevantes para una integración empresarial:
- Seguridad
- Ventas
- Stock
- Clientes y Proveedores
- Compras
- Contabilidad
- Finanzas
- Gestión
- Producción
- Comercial/CRM
- RRHH
- POS
- Calidad
- Editorial
- Mensajería
- Parámetros

Esta cobertura es amplia y suficiente para diseñar integraciones horizontales (por caso de uso) y verticales (por módulo).

## 3) Nivel técnico de contrato API (OpenAPI)

### Fortalezas
- Los specs incluyen gran cantidad de endpoints por módulo (ejemplo: Compras y Contabilidad con cientos de operaciones).
- Los módulos de negocio incluyen `bearerAuth` y seguridad global declarada.
- Hay servidor base definido (`https://api.yiqi.com.ar/api/public` para módulos funcionales).

### Brechas detectadas
- El spec de Seguridad (`Security.api.json`) define `/token`, pero no declara `securitySchemes`.
- Parte de los metadatos de operaciones están incompletos (descripciones/operationId vacíos en algunos casos).
- Falta una receta de onboarding técnico en formato “copiar y pegar” para empezar rápido.
- Falta explicitar en todos los documentos la regla operativa oficial para `schemaId` y healthcheck post-login.

## 4) Nivel de autenticación y sesión

Hay un flujo explícito de obtención de token via `POST /token` con `application/x-www-form-urlencoded` (`username`, `password`, `grant_type=password`) y respuesta con `access_token`, `token_type`, `expires_in`.

Esto es suficiente para implementar login en integraciones server-to-server o backend-for-frontend.

Definiciones operativas vigentes:
- No hay refresh token: cuando expira la sesión, se debe reloguear.
- Healthcheck canónico: `GET /accountapi/GetLoginInformation`.
- `schemaId` primario: tomarlo de `GetLoginInformation`.
- `schemaId` complementario: usar `GET /schemasapi/GetAvailable` cuando el usuario tenga acceso a múltiples esquemas.

Mejoras recomendadas para reducir errores de implementación:
- Documentar claramente que no existe refresh token y que el recambio es por relogin.
- Estandarizar dónde enviar el bearer (header `Authorization`).
- Incluir ejemplos de errores 401/403 y estrategia de relogin automático.

## 5) Nivel de implementación (MVP real)

Un MVP de integración es totalmente factible con este orden:
1. Autenticación en Seguridad (`POST /token`).
2. Healthcheck y contexto con `GET /accountapi/GetLoginInformation`.
3. Resolver `schemaId` (desde login info y, si hace falta, `GetAvailableSchemas`).
4. Consulta de disponibilidad de stock (flujo priorizado).
5. Continuar con caso de uso extendido (clientes, pedido, cobranza, etc.) según precondiciones.

Este flujo ya está alineado con la guía `ai-integration-playbook.md`.

## 6) Riesgos y mitigaciones

- **Riesgo:** Ambigüedad en convenciones transversales (paginación, filtros, formato de fecha).
  - **Mitigación:** Definir un contrato interno en el integrador y mapear por endpoint.
- **Riesgo:** Errores de autenticación por diferencias entre specs.
  - **Mitigación:** Encapsular auth en un cliente único y pruebas de humo tempranas.
- **Riesgo:** Integración “por módulo” sin visión de proceso.
  - **Mitigación:** Diseñar por casos de uso end-to-end (venta completa, cobranza, etc.).

## 7) Veredicto final

**Sí, puedes integrar con YiQi ERP hoy** con una estrategia profesional y gradual.

La documentación actual alcanza para construir un primer flujo productivo. Para escalar más rápido y con menor fricción, conviene complementar con quickstarts end-to-end, convenciones globales y ejemplos operativos de manejo de errores.
