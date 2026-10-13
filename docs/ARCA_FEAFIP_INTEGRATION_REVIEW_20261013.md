# Global Stock — revisión del ejemplo FEAFIP SDK de Bit Ingeniería
Fecha: 13/10/2026. Estado: **solo análisis y validación; ninguna factura emitida**.

## Lo que hace el ejemplo recibido
El PHP publicado por el usuario crea un objeto de factura, lo convierte a JSON y realiza un POST contra `https://api.bitingenieria.com.ar/silex/feafip/fe_autorizar` mediante cURL. **Es un proveedor privado intermediario**, no el web service oficial WSFEv1 de ARCA. El fragmento no indica el método de autenticación, contrato de respuestas o mecanismo homologación/producción; no autoriza a registrar la URL como conector activo ni garantiza que sea pública o gratuita.

El cuerpo contiene datos de muestra de Bit Ingeniería (razón social, domicilio, CUIT, punto de venta 140), un destinatario de ejemplo, `tipo_comp: 1` (código usado para Factura A), `invoice_num: 0140-00000625`, importes y un producto. **Nada de eso corresponde por defecto al contribuyente que use Global Stock.** Nunca se debe emitir con ese CUIT, punto de venta o número.

## Problemas detectados en los importes

| Nivel | Neto / subtotal | IVA | Total |
| --- | ---: | ---: | ---: |
| Producto del PHP | $1.025,95 | $205,19 | $1.231,14 |
| Encabezado del PHP | $1.200,60 | $252,13 | $1.452,73 |

El producto y el encabezado difieren en **$221,59**. No se puede emitir esa factura sin corregir los datos. El campo `tax: 20` tampoco debe interpretarse automáticamente como la alícuota normativa válida: las reglas dependen del producto, tipo de comprobante y contribuyente. En particular, **Global Stock jamás debería copiar el número de factura o CUIT del ejemplo**.

La función `validateFiscalTotals` comprueba cantidades, importes no negativos, centavos, suma de encabezado y suma de líneas. Los tests automatizados incluyen este ejemplo como caso rechazado. La guía `analyzeArcaDraft` ya comprueba campos básicos de emisor, receptor y coherencia de importes.

## Estado del código y acceso a ARCA
- La app tiene perfiles fiscales, borradores, documentos, items, auditoría y pantalla ARCA en Expo Go y PC.
- `/api/fiscal/issue` ahora rechaza inconsistencias y emisiones de producción si falta habilitación explícita en servidor.
- El endpoint usa un **contrato interno normalizado** (issuer, document, `authorizationCode`, `voucherNumber`). **El JSON de FEAFIP es diferente y no funciona copiando solo su URL**.
- Un timeout o corte de conexión después de enviar una solicitud deja el documento en `pending_authorization`. Un intento adicional da `FISCAL_RECONCILIATION_REQUIRED`. Se necesita una consulta de conciliación por CUIT, punto de venta, tipo y número antes de retomar; no se reenvía ciegamente.
- El estado actual del proyecto no incluye `ARCA_FISCAL_PROVIDER_URL` ni `ARCA_FISCAL_PROVIDER_API_KEY` en Vercel. **No se ha verificado ni probado FEAFIP o ARCA en vivo**, y no hay autorización para producción.
- Antes de incorporar el adaptador FEAFIP hace falta documentación oficial del proveedor: contrato de autenticación, modo sandbox/homologación, respuestas CAE y vencimiento, errores y consulta de comprobantes ya autorizados, costos/condiciones comerciales, políticas de tratamiento de datos e idempotencia.

## Procedimiento de prueba sin riesgo
1. Elegir con el titular o contador el CUIT de prueba, condición fiscal, letra/tipo aplicable y punto de venta **habilitado en homologación**.
2. Definir si se usa FEAFIP con **cuenta real del titular** y documentación de homologación, o integración oficial WSAA/WSFEv1.
3. Configurar certificados, secretos y credenciales **solo en backend**, en un gestor de secretos. No compartir contraseñas, certificados privados, tokens, claves fiscales, CUIT ajenos ni datos de clientes reales en ChatGPT o GitHub.
4. Construir un adaptador homologado que transforme documentos internos al formato autorizado por el proveedor y normalice su respuesta.
5. Probar primero un documento enteramente ficticio, comprobar CAE, vencimiento, tipo, numeración y respuesta de consulta posterior; también errores, caídas y conciliación.
6. Aprobar producción **solo** después de revisión técnico-tributaria del contribuyente y autorización expresa del dueño. Un PDF interno o una respuesta sin CAE no es una factura fiscal.

**El ejemplo proporcionado es útil para entender los campos, pero por sí solo no configura una conexión con ARCA.**
