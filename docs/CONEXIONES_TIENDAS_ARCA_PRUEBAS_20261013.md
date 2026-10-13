# Global Stock — Verificación de tiendas online y ARCA (Argentina)
Fecha: 13/10/2026 · Beta sin emisión fiscal automática.

## Estado comprobado en producción
- `/api/integrations/status`: `custom:true`; Shopify, Tiendanube, Mercado Libre y WooCommerce sin credenciales o habilitación. Esto solo verifica la configuración del **servidor**, no el acceso de una tienda concreta.
- `/api/fiscal/status`: `configured:false, mode:"locked"`. No existe conexión fiscal lista para emitir. Ninguna venta de Caja debe generar una factura ARCA ni afirmar que tiene CAE.
- Wix, PrestaShop y VTEX: solicitable como integración futura, pero no existe un adaptador funcional confirmado. **No mostrar "sincronización activa" sin permiso del dueño y prueba de API**.

## Prueba individual de cada tienda (sin mezclar datos entre negocios)
1. En Expo Go elegir el **negocio correcto** → Tienda online → proveedor.
2. Registrar su dominio público HTTPS, o editar/eliminar la solicitud si estaba mal.
3. Verificar que el proveedor esté configurado. Para Shopify, Tiendanube o Mercado Libre, el dueño autoriza mediante su aplicación OAuth en el **sitio oficial del proveedor**. Para WooCommerce se requieren permisos REST API de lectura/escritura limitados. Nunca introducir claves en un formulario público de URL o enviar secretos al chat.
4. Una solicitud "Pendiente" **no sincroniza** inventario ni pedidos. Una cuenta marcada "Conectada" todavía debe pasar una prueba de lectura de un producto, lectura de stock y prueba de reversibilidad del acceso.
5. Prueba de lectura (sin mutar stock): consultar 1 producto real, variante, código de barras, precio y stock. Verificar que se corresponde con **esa misma tienda**.
6. Prueba de escritura solo con producto ficticio y permiso explícito del titular: editar una unidad en un entorno de prueba, confirmar en tienda, restaurar el valor y comprobar el log. Nunca usar pedidos reales.
7. Desconectar desde Expo: se borran cuentas y secretos guardados **para ese proveedor en ese negocio** y se registra auditoría. El titular también debe revocar el acceso de Global Stock desde el panel del proveedor para invalidar autorizaciones externas.
8. No ejecutar la prueba con todas las tiendas al mismo tiempo. Completar el checklist por cada proveedor para aislar fallos y evitar sincronización cruzada.

## ¿Qué necesita el dueño?
| Proveedor | Información pública | Acción que solo puede hacer el dueño |
| --- | --- | --- |
| Tienda propia con conector Global Stock | Dominio HTTPS de tienda | Instalar/activar el conector, iniciar sesión como admin y autorizar permisos |
| Mercado Libre | Cuenta de vendedor | Autorizar la aplicación vía OAuth oficial; el servidor debe tener Client ID/Secret configurados |
| Shopify | Dominio oficial de tienda | Instalar/autorizar aplicación; scopes mínimos en backend |
| Tiendanube | Dominio de tienda | Instalar/autorizar aplicación OAuth; app registrada en backend |
| WooCommerce | Dominio público HTTPS | Crear credenciales REST API con permisos mínimos y guardarlas únicamente en un backend cifrado |
| Wix / PrestaShop / VTEX | Dominio y proveedor | Se debe construir/verificar adaptador con API real, autenticación y webhooks antes de habilitar |
No compartir claves, API secrets, certificados, contraseñas ni tokens por chat. El estado del servidor se revisa desde endpoints de solo lectura. Las altas que solo guardan una solicitud no autorizan acceso externo.

## ARCA: preparación para homologación fiscal
1. Con el **titular del CUIT** y/o contador, definir condición fiscal, domicilio, actividad, régimen, tipos de factura y **punto de venta habilitado** para facturación electrónica.
2. Completar **ARCA · Facturación** en Expo Go con el CUIT y datos fiscales no secretos; solo dueño o administrador puede editar el perfil.
3. Definir integrador fiscal real para WSAA/WSFEv1 y el **entorno de homologación**. Gestionar certificados/clave privada y delegaciones exclusivamente con el titular del CUIT y mediante canales oficiales, almacenando la clave privada solo en servicio seguro, fuera de Expo, Git y el chat.
4. Configurar `ARCA_FISCAL_PROVIDER_URL` y `ARCA_FISCAL_PROVIDER_API_KEY` **en Vercel** (o proveedor dedicado). Hasta entonces `/api/fiscal/status` seguirá bloqueado. Revisar requisitos concretos del prestador para homologación: no asumir que cualquier URL de ARCA satisface el contrato del endpoint.
5. Crear un comprobante **de prueba** con cliente y monto ficticios en homologación, confirmar la respuesta firmada/CAE de test en el proveedor; validar numeración, IVA, CUIT, fecha, QR y rechazo/reintento; consultar estado de comprobante y reintentar de forma idempotente.
6. **Nunca usar el flujo de pruebas para producción**. Habilitar producción solo después de validación técnica, tributaria y autorización expresa del titular. La emisión legal efectiva requiere autorización oficial (CAE), no un PDF interno.

## Sucursales y datos separados
- Catálogo y usuarios corresponden al negocio; stock físico se registra por `business_id` + `location_id` + `product_id` en `global_stock_inventory_levels`.
- En Expo Go → Gestión: crear/editar/archivar locales, consultar stock y ventas atribuidas, trasladar existencias con RPC autenticada. Al archivar **no se borra el historial**, y se bloquea si hay stock o reservas.
- La caja actual puede registrar ventas con sucursal predeterminada. **Pendiente de validación:** selector de sucursal de Caja y asignación fiscal por punto de venta. Las ventas sin `location_id` no deben confundirse con ventas atribuibles a una sucursal.
- No convertir dos sucursales en dos negocios separados si pertenecen a la misma empresa: el catálogo general se comparte y las existencias están separadas por `location_id`.

## Evidencia de fin de integración
Guardar resultado de login OAuth, lectura de producto, sincronización, revocación, auditoría y pruebas aisladas por negocio. Solo marcar un proveedor como funcional tras completar una prueba contra una cuenta realmente autorizada, sin claves expuestas.
