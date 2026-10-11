# Global Stock — Argentina: beta gratuita de acceso limitado

**Fecha de planificación:** 11 de octubre de 2026. **Objetivo:** piloto privado durante octubre, beta gratuita más amplia en noviembre *solo si se cumplen las condiciones de salida*. Las fechas no son promesa comercial. No publicar ni procesar transacciones reales mientras existan bloqueos críticos.

## Alcance de la beta

- País de comercialización inicial: **Argentina**; interfaz y soporte iniciales en español y moneda ARS. No afirmar que la ubicación del usuario está verificada: el país se confirma en el registro y el operador revisa la distribución por tiendas.
- **Beta gratuita, sin suscripción ni cobros a usuarios de Global Stock.** Sin acceso de pago, sin prometer facturación fiscal válida y sin procesar pagos ni liquidaciones desde Expo.
- Permitir registro 18+ y declaración separada de que el negocio opera en Argentina, lectura y aceptación registrada por versión de términos y privacidad, y un consentimiento **independiente y revocable** antes de enviar datos comerciales a IA. Estas declaraciones no verifican edad ni domicilio.
- Funciones habilitadas para pilotos: inicio de sesión, negocios aislados con RLS, inventario, lector de códigos, panel, agenda, contactos de proveedores, alertas, preferencias y IA *solo si* el proveedor está configurado y el consentimiento fue otorgado. Los borradores locales **no son ventas**.
- No prometer paridad completa con la web: integraciones ecommerce, emisión fiscal, documentos y cobros complejos quedan fuera del compromiso de la beta hasta pasar pruebas independientes.

## Cuatro hitos verificables

| Cuándo | Entregable | Condición para avanzar |
| --- | --- | --- |
| 11–17 oct | Estabilización, revisión UI y fallos de sesión | CI móvil/web/seguridad verde en SHA publicado; login/logout/refresh de IA, cambio de cuenta y control de permisos comprobados físicamente |
| 18–24 oct | **Piloto privado**, 5–10 adultos dueños de negocios argentinos | Android e iPhone instalados y probados; sin errores P0/P1; tenencia de datos aislada con dos negocios y dos usuarios; respaldo y eliminación verificables |
| 25 oct–7 nov | Corrección de incidencias, ayuda y documentación legal | Consentimientos, exportación/deleción, soporte real, borrado y política de retención revisados; privacidad y textos verificados por profesional competente; capturas y accesibilidad |
| 8–30 nov | Beta gratuita más amplia en Argentina **solo si aprueba el checklist** | Cero vulnerabilidades críticas conocidas, soporte y recuperación, publicación tienda o PWA funcional, monitoreo, gestión de incidentes y revisión legal completados |

No expandir fuera de Argentina antes de un plan de privacidad, edad, contratos, impuestos y soporte específico por país.

## Seguridad y estabilidad: no negociables

1. Cada consulta de negocios, IA, documentos e inventario debe autenticarse y limitarse a la empresa activa en el servidor (Supabase RLS); repetir pruebas con usuarios de negocios diferentes y membresías revocadas.
2. Renovar el token una vez cuando el dispositivo sale del fondo; distinguir problemas de perfil/permisos del vencimiento de sesión. Nunca aconsejar cerrar sesión como primera respuesta a un 403.
3. Datos en SQLite local **no cifrados actualmente**: no usar la beta con datos personales, ventas reales o contactos confidenciales en esos módulos hasta cifrado, borrado por usuario y límites de retención probados.
4. Sin cobros reales, sin facturas tributarias ni sincronización automática de ventas offline. No convertir un borrador en una venta ni restar existencias al guardarlo.
5. Registro de errores con mínimo de datos; sin claves `service_role`, tokens o información de otros comercios en trazas.
6. Procedimiento de reversión por commit, controles automáticos Android/iOS y pruebas manuales de cámara, red lenta, sin conexión, reinicio y cambio de negocio.
7. Auditoría de accesibilidad: iPhone 12 y pequeño, Android económico, fuente aumentada, VoiceOver/TalkBack, áreas táctiles, teclado, safe-area, modo claro/oscuro.
8. Revisar cuotas y costos de Supabase, Vercel y proveedor IA. Beta gratuita no significa infraestructura gratuita ilimitada; aplicar límites por usuario y negocio.

## Marco argentino: revisión jurídica pendiente

La plataforma requiere una revisión documentada, como mínimo, de:
- **Ley 25.326 de Protección de Datos Personales**, derechos de acceso/rectificación/supresión, responsabilidad en tratamiento, seguridad y transferencias internacionales (proveedores cloud/IA). Evaluar obligaciones y registros vigentes ante la **AAIP**.
- **Ley 24.240 de Defensa del Consumidor**, información suficiente y condiciones claras para la oferta de servicios digitales, soporte, reclamos, publicidad de «gratis», límites de la beta y, cuando corresponda, contratación/cancelación a distancia.
- **Ley 25.506** sobre firma electrónica/digital, sin presentar el checkbox como firma digital certificada.
- Obligaciones fiscales y registrales correspondientes al operador y su actividad (verificación actual ante **ARCA**, inscripción, comprobantes, ingresos brutos y Provincia de Buenos Aires según corresponda), aun si inicialmente no cobra una suscripción.
- Requisitos actuales de Apple App Store y Google Play, políticas de privacidad, ficha de seguridad de datos, menores, control de permisos de cámara, borrado de cuenta, titularidad de contenido y exactitud de declaraciones.
- Contratos/condiciones con procesadores, transferencias, retención, cesión de datos comerciales y subprocesadores, especialmente al habilitar IA.

**Importante:** esto es una guía de tareas, no asesoramiento ni dictamen legal. Los requisitos y procesos pueden cambiar; sin navegación web disponible para verificar actualizaciones normativas a octubre de 2026, deben confirmarse las versiones vigentes en portales oficiales y con un profesional argentino antes de anunciar cumplimiento legal.

## Información que sí habrá que aportar antes de abrir la beta

- Confirmar **nombre y datos de contacto públicos del operador**, correo de soporte controlado por él, domicilio comercial/legal y mecanismo de reclamos aplicable (no publicar datos privados innecesarios).
- Confirmar condición tributaria, quién emite comprobantes cuando corresponda y si existe una persona o empresa registrada como proveedor del servicio.
- Acceso a cuentas de desarrollador de Apple/Google y a Expo EAS si se usa distribución nativa; verificar titularidad del identificador `d3f33419-261b-4615-818d-f6802350b085`.
- Elegir 5–10 testers adultos dispuestos a probar con datos ficticios primero; autorización explícita antes de utilizar información real.
- Obtener revisión legal de política de privacidad, términos, comunicaciones a usuarios, planes de eliminación/retención y flujos de autorización.

## Aprobación de salida

La persona responsable debe marcar y documentar cada evidencia, no aprobar en bloque:

- [ ] CI Android/iOS, Next.js y security en verde **sobre el mismo commit**.
- [ ] Login y AI después de 60 minutos en segundo plano (sin 401 falso).
- [ ] RLS de dos negocios/tres roles; invitación revocada.
- [ ] Alta, edición y refresco de productos desde ambos clientes sin pérdida de datos.
- [ ] Sin operaciones de pago ni factura fiscal nativa durante beta.
- [ ] Eliminación, exportación y revocación de consentimiento IA probadas.
- [ ] Avisos legales revisados, contacto real, enlaces funcionales y aceptación por versión.
- [ ] Cámara, accesibilidad, iOS/Android físicos, reinicio, sin red y dispositivo de gama baja.
- [ ] Alertas, soporte, registro de errores, backups/restauración, respuesta a incidentes.
- [ ] Revisión jurídica y requisitos de publicación para Argentina confirmados.

## Canales de venta: solicitudes y conexiones verificadas

El móvil muestra **Tienda online** con:
- Mercado Libre (OAuth), Shopify (OAuth), Tiendanube (OAuth), WooCommerce (API), Wix (API/app), PrestaShop (API), VTEX (API), tienda propia/web personal y **Otra plataforma**.
- Nombre opcional/obligatorio según plataforma y URL pública HTTPS; rechaza URLs locales, IP, protocolos inseguros y contraseñas embebidas.
- **Solicitar vinculación** inserta un estado `requested` en `global_stock_integration_requests` para el negocio activo. No descarga productos ni pedidos. Sólo dueños/administradores tienen INSERT; el RLS permite a miembros leer sus solicitudes.
- **Conexión activa** se muestra solamente desde `global_stock_integration_accounts` cuando su estado es `connected`. No se puede convertir una solicitud en `verified` desde el cliente.
- Los proveedores OAuth necesitan registro de aplicación, secretos sólo del servidor, scopes mínimos, consentimiento del titular, callback firmado, webhooks idempotentes, cuota y reconciliación; los conectores custom necesitan demostrar administración/control técnico de la tienda.
- **No existe conexión universal por pegar un enlace.** El objetivo es una arquitectura extensible por adaptadores; debe evaluarse cada tienda según API/permiso/contrato. No rastrear datos privados ni guardar claves sin autorización.

### Pruebas de integraciones pendientes

- [ ] Probar que negocio A no puede leer/escribir solicitudes de negocio B, incluso con membresía revocada.
- [ ] Verificar el estado OAuth real de Shopify, Tiendanube y Mercado Libre con usuarios de prueba y cuentas oficiales antes de mostrar «Conectado».
- [ ] Probar entrada maliciosa de URL: IPv4/IPv6, loopback, red privada, URL con credenciales, puertos, phishing y duplicados.
- [ ] Implementar protocolo de autorización y verificación para tiendas propias, con permisos explícitos y revocación.
- [ ] Respetar términos de uso y límites de API de cada plataforma, incluidos alcances de datos de compradores.

## ARCA (ex AFIP): qué está hecho y qué NO

**Hecho:** el módulo `ARCA · Facturación` permite guardar por negocio razón social, CUIT con validación de dígito verificador, condición tributaria, domicilio fiscal y punto de venta. El formulario sólo usa Supabase y sus RLS; no pide clave fiscal, certificados ni claves privadas. Para nuevos perfiles usa entorno `testing`, `enabled=false`. Informa si el servidor fiscal tiene un proveedor configurado, lo cual NO acredita que esté certificado ni que emita realmente.

**No habilitado:** autenticación de contribuyentes, certificados, servicio fiscal contratado, intercambio con WSAA/WSFEv1 u otras API correspondientes, homologación aprobada, autorización de comprobantes o emisión real de CAE. Los comprobantes internos nunca son facturas electrónicas oficiales.

Antes de facturar:
1. Identificar condición tributaria, CUIT, sucursal/punto de venta y tipo de comprobantes del contribuyente con un profesional matriculado.
2. Confirmar documentación y habilitaciones oficiales vigentes de ARCA, incluidas autorizaciones del titular y certificados adecuados.
3. Integrar un proveedor fiscal seguro o servicios oficiales desde **backend**, con credenciales cifradas por empresa, auditoría, revocación y pruebas en homologación.
4. Probar idempotencia y consultas de autorización tras timeouts; no reintentar ciegamente solicitudes que puedan haber emitido un CAE.
5. Revisar obligaciones de factura, AFIP/ARCA, IVA, ingresos brutos, protección de datos, requisitos provinciales y procesos de soporte antes de operar en producción.
6. Recién entonces, con la aprobación expresa del titular, habilitar el servicio por negocio.

**Estos pasos requieren documentación oficial vigente y asesoramiento fiscal.** No es posible garantizar hoy cumplimiento de todas las obligaciones argentinas sin esa verificación.


## Cambios de seguridad del 11/10: alcance AR y almacenamiento local

- La aceptación móvil ahora exige confirmar **18+** y **negocio que opera en Argentina**, de forma separada y auditable en Supabase. Esta autodeclaración no demuestra residencia ni impide técnicamente descargar la aplicación desde otro país.
- Nueva versión de términos `2026-10-11-ar-beta`: usuarios de versiones anteriores deben volver a aceptarla, conservando los registros históricos.
- Al cerrar sesión, la app pide confirmación y elimina los inventarios, negocios y presupuestos locales del usuario (SQLite no cifrado). Los datos del servidor no se borran. Hasta implementar cifrado local, mantener pruebas con datos ficticios o no confidenciales.
- **Bloqueo de CI actual:** las ejecuciones recientes de GitHub Actions fallan en pocos segundos sin pasos ni logs accesibles. No considerar el código validado ni publicar la beta hasta recuperar CI y probarlo en dispositivos reales.
