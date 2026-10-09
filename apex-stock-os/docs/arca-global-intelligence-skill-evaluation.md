# ARCA + Global Intelligence — evaluación de skill de terceros

**Estado:** propuesta técnica documentada. No instalar scripts externos, no habilitar emisión real y no solicitar credenciales hasta realizar revisión de seguridad y pruebas en homologación.

**Skill externa evaluada:** https://github.com/buanzo/agentic-skill-arca-comprobantes
**Versión revisada:** commit `7b4f13f4033499f9e0a4d54368c2f56cb31668c7` (2026-06-06)
**Licencia declarada:** Apache-2.0. Conservar avisos/atribuciones y revisar cada cambio antes de incorporar código.

## 1. Qué aprovechar de la skill

- Guías de captura de datos fiscales mínimos y preparación del cliente (`preparar_cliente.py`).
- Normalización/validación previa de Facturas A/B y notas de crédito totales (`preparar_emision.py`).
- Lectura, índice, búsqueda y conciliación documental (`parse_comprobante.py`, `index_comprobantes.py`, `buscar_comprobantes.py`, `validar_comprobante.py`).
- Reglas de pausa ante diferencias de CUIT/receptor, condición fiscal, tipo de factura, punto de venta, importe, moneda, referencia de nota de crédito.
- Controles de aprobación humana y protección de credenciales descritos en `SKILL.md` y `references/alcance-y-seguridad.md`.
- Patrón de navegador asistido/RCEL con Playwright para casos locales y manuales, **no** como backend predeterminado de una plataforma SaaS multitenant.

**No usar directamente** `arca_auth_probe.js`, `arca_playwright_common.js` ni `rcel_emission_assistant.js` dentro de la aplicación de servidor sin diseño específico de autenticación, consentimiento, aislamiento y seguridad. Estos scripts esperan `AFIP_CUIT` y `CLAVE_AFIP` en variables locales y automatizan pantallas que pueden cambiar. Nunca pedir la clave fiscal de un cliente por chat, ni almacenarla en Supabase como texto plano, ni inyectarla en un prompt de IA.

## 2. La base ya existente en Global Stock

El repositorio ya contiene:

- `components/FiscalDocumentsCenter.tsx`: configuración por negocio; borradores/documentos fiscales y revisiones.
- `app/api/fiscal/status/route.ts`: informa si existe proveedor fiscal configurado.
- `app/api/fiscal/issue/route.ts`: autenticación, autorización por membresía, envío a un proveedor fiscal desde el servidor y persistencia de respuesta.
- `supabase/migrations/20261004_global_stock_fiscal_documents.sql` y hardening: perfiles fiscales, documentos, líneas y eventos.

**No declarar ARCA funcional sólo por existir esta interfaz.** El endpoint de emisión exige `ARCA_FISCAL_PROVIDER_URL` y `ARCA_FISCAL_PROVIDER_API_KEY`, y no demuestra por sí mismo una integración con ARCA. No se verificó proveedor real, credenciales de prueba ni emisión de CAE.

## 3. Arquitectura de integración elegida

### Capa A — Global Intelligence (copiloto)

Permitir al usuario escribir «Prepará factura A para esta venta» o «¿Por qué ARCA rechazó este comprobante?». El agente consulta herramientas de lectura **del negocio autorizado**, identifica datos faltantes, valida resultados y crea un borrador en Global Stock. La IA no debe poder invocar endpoints arbitrarios, leer secretos, decidir su propia autorización ni emitir de forma directa.

Herramientas sugeridas con permisos explícitos:
- `fiscal.get_capabilities`
- `fiscal.get_profile`
- `fiscal.prepare_draft`
- `fiscal.validate_draft`
- `fiscal.search_documents`
- `fiscal.explain_rejection`
- `fiscal.request_authorization` (solo con confirmación de una persona y permisos verificados en el servidor)

### Capa B — proveedor fiscal oficial

Diseñar una implementación certificada/revisada para ARCA usando interfaces oficiales adecuadas (por ejemplo, autenticación WSAA y facturación WSFEv1 cuando corresponda), **primero en homologación**. Alternativamente, un proveedor fiscal contratado por el usuario bajo contratos claros. La elección requiere comprobación contra documentación ARCA vigente, tipos de comprobante y regímenes aplicables.

- Certificados/llaves bajo manejo seguro por tenant, cifrado y rotación; acceso sólo backend.
- Firma y autorización separadas del modelo de IA y de la sesión del navegador.
- Operaciones idempotentes con clave única por negocio, emisor, punto de venta, tipo y documento.
- Al perder la respuesta, **consultar estado remoto antes de reintentar emisión** para evitar doble comprobante.
- Sólo marcar `authorized` si hay respuesta comprobable del servicio fiscal (p. ej., autorización/CAE cuando corresponda).
- Mantener comprobante emitido, número, vencimiento y estado consistente con la evidencia oficial; auditoría sin secretos.
- Preservar la seguridad actual: permisos de negocio, separación entre empresas, bloqueo a anónimos, y evitar emisión sin revisión.

### Capa C — historial y documentos

Adaptar validación, parseo e indexación del skill con formatos estables propios de Global Stock, cuidando el almacenamiento privado de PDFs, separación por empresa y retención. Enlazar venta ↔ documento ↔ nota de crédito ↔ autorización oficial.

## 4. Secuencia de pruebas sin emitir documentos reales

1. Auditar código de la dependencia, licencias, autenticación y superficies de datos.
2. Crear fixtures sintéticos (CUIT/IVA/importe/moneda sin identidad de clientes reales) y pruebas unitarias del preparador.
3. Simular proveedor y comprobar errores, timeouts, permisos, reintentos y idempotencia; no inventar CAE reales.
4. Integrar ARCA **homologación** y verificar facturas/notas de crédito permitidas, errores y conciliación oficial.
5. Agregar flujo de aprobación humana y trazabilidad.
6. Sólo tras revisión funcional/fiscal y permiso explícito: habilitar producción por empresa, nunca globalmente por defecto.

## 5. Regla de costos y alcance

Esta evaluación **no genera costos ni requiere cuentas ARCA**. La licencia del repositorio es permisiva, pero herramientas de proveedores terceros, certificados, hosting, trámites o servicios pueden tener costos o requisitos que deben aprobarse previamente. No habilitar una suscripción, recurso de pago o emisión en producción sin autorización.

Esta integración está prevista dentro del Centro de Integraciones (tiendas online, pasarelas, logística y fiscalidad), sin exclusividad con DORADO y con ayuda de Global Intelligence.
