# Global Stock · preparación jurídica y operativa internacional

**Estado:** lista de control de lanzamiento, no certificación jurídica. Revisión inicial: 11 de octubre de 2026.

## Limitación importante
Global Stock todavía está en desarrollo y pruebas. Implementar funciones, pantallas de consentimiento y documentación **no demuestra cumplimiento completo** de la legislación argentina ni de otros países. La disponibilidad de Expo Go y Vercel no equivale a autorización comercial o fiscal. Antes de anunciar cada país deben verificarse con asesoría competente los puntos siguientes.

## Funciones de protección que ya tiene la app
- Cuentas autenticadas por Supabase y aislamiento de operaciones por negocio mediante RLS.
- Registros de aceptación de términos y política de privacidad por versión con usuario y hora del servidor, y declaración de 18+ (no prueba de identidad).
- Permiso explícito y revocable por usuario/negocio antes de enviar contexto del inventario desde Expo a proveedores de Global Intelligence.
- Sesión móvil protegida mediante Keychain/Keystore y actualización de tokens en primer plano.
- El POS móvil no procesa pagos ni emite comprobantes fiscales; los borradores offline no constituyen ventas ni reducen stock.
- Enlace a soporte y al inicio de la solicitud de eliminación de cuenta.

## Requisitos por país antes de habilitar ventas o suscripciones
1. **Operador y contratos.** Identidad comercial, datos del responsable, mecanismos de contacto, políticas de reembolso, desistimiento, cobro, impuestos sobre las suscripciones y condiciones localizadas.
2. **Edad/capacidad.** Determinar requisitos locales para crear cuentas, contratos B2B, tratamiento de datos de menores y si una autodeclaración es suficiente. Hasta contar con diseño de verificación apropiado, el registro móvil exige 18+.
3. **Privacidad.** Determinar responsable/encargado, bases legales, derecho de acceso/rectificación/borrado/portabilidad, plazos de conservación, canal de solicitudes, evaluaciones de riesgo, notificación de incidentes y contratos con proveedores.
4. **Transferencias internacionales.** Revisar regiones de almacenamiento de Supabase, Vercel, plataforma IA, proveedores de pagos y correos; documentar mecanismos transfronterizos válidos si hacen falta.
5. **Facturación/contabilidad.** Integrar servicios fiscales específicos, numeración, firma digital, requisitos de archivado y reglas tributarias locales antes de prometer facturación legal. Un PDF o registro interno no es automáticamente factura válida.
6. **Pagos.** Validar la regulación aplicable y contratos del adquirente, intermediarios, tarjetas, PCI DSS y reembolsos. No almacenar números de tarjetas ni credenciales privadas en Expo.
7. **Datos de terceros.** El comercio necesita autorización/base lícita para incorporar información de compradores, empleados y proveedores; separación por tenant y permisos granulares.
8. **Tiendas Apple/Google.** Revisar clasificación por edad, declaraciones de privacidad/datos, permisos de cámara, tratamiento de cuentas, términos de suscripciones y vías de eliminación de cuenta.
9. **Accesibilidad y traducción.** Auditorías con dispositivos y lectores de pantalla; ofrecer textos legales comprensibles en idiomas del mercado y contrastes adecuados.
10. **Incidencias y soporte.** Procedimiento de eliminación/exportación, backups, RTO/RPO, respuesta a brechas, recuperación, seguridad de integraciones y registro de auditoría.

## Regiones a evaluar, **sin afirmar lanzamiento**
| Región | Revisión específica necesaria |
| --- | --- |
| Argentina | Protección de datos personales, consumidor, contratos electrónicos, ARCA/facturación fiscal, edades/capacidad |
| Brasil | LGPD, consumidor, pagos y documentos fiscales, portugués y transferencias |
| Unión Europea / EEE | GDPR y normas locales de edad; DPA/SCC, IVA, derechos de usuario y accesibilidad |
| Estados Unidos | Normas federales/estatales de privacidad, COPPA cuando aplique, impuestos, suscripciones y condiciones de uso |
| Otros países | Evaluación local completa antes de comercializar |

## Pendientes técnicos y comerciales
- Políticas de conservación y exportación verificables y auditadas para todos los módulos.
- Validación documental de identidad/edad cuando la jurisdicción o actividad lo requiera.
- Procesos de consentimientos separados para analítica, marketing, notificaciones push y conectores cuando se habiliten.
- Revisión humana de traducciones legales, seguridad, accesibilidad y pruebas en Android/iPhone físicos.
- Integración de pagos, factura fiscal y capacidades reguladas por región solo después de autorización y ensayos.
- Registro claro de países efectivamente soportados y disponibilidad por funciones.

**Decisión de producto:** no usar en marketing “legal en todos los países” hasta completar la lista específica y obtener revisiones formales.