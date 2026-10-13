# Global Stock · Android y Windows — lanzamiento Argentina

**Fecha de revisión:** 13 de octubre de 2026. **Objetivo:** candidata de prueba en octubre y lanzamiento en noviembre **solo si pasan las condiciones de salida**. Este documento NO certifica que Global Stock esté legalmente aprobado ni publicado en tiendas.

## Versión de producto

- **PC/Windows:** la aplicación web de Global Stock ya ofrece una PWA instalable en Edge/Chrome desde la página [Download](https://globalstocks.vercel.app/download). La PWA funciona como aplicación de escritorio, pero **no** equivale a tener una ficha en Microsoft Store ni a distribuir un instalador MSIX firmado.
- **Android:** código Expo React Native `apps/global-stocks-mobile`, identidad `app.globalstocks.mobile`, proyecto Expo EAS ya configurado. El workflow manual `Global Stock · Android APK / Play Store AAB` produce un APK de revisión o un AAB de producción. **No hay evidencia aún de archivo APK/AAB firmado publicado**.
- **iOS:** Expo Go permite pruebas. App Store requiere equipo/cuenta Apple Developer y proceso independiente; no está incluido en este lanzamiento.
- **Los dos clientes conservan su UI propia** (web responsive + móvil React Native), pero comparten Supabase y operaciones seguras. No deben ser sustituidos por una WebView que oculte funcionalidades.
- **Argentina beta 18+:** términos, privacidad y consentimiento versionados. Facturación ARCA no se considera legalmente activa hasta homologación y configuración de la autoridad; los recibos internos no equivalen a facturas.

## Lo que está listo a nivel de código

1. Web: PWA `manifest.webmanifest`, instalador visual y páginas de términos/privacidad/soporte.
2. Expo: íconos, splash, permisos de cámara, identificador Android, perfiles EAS `preview` (APK interno) y `production` (AAB para Play Store). No se requiere Flutter ni Microsoft Visual Studio para este camino.
3. CI: validaciones TypeScript, dependencias, Expo, compilación iOS/Android del bundle JS, Playwright (web) y seguridad. **Bundle JS no es APK, AAB ni prueba funcional en un teléfono**.
4. Web y Expo: inventario, caja, negocios/sucursales, cotizaciones, IA e integraciones como módulos existentes. Se agregó gestión de sucursales a la web; falta validar que las operaciones correspondan a un mismo negocio y que todos los roles funcionen en ambos clientes.

## Antes de distribuir a otras personas (bloqueantes)

- [ ] **Integridad de stock y caja:** dos cuentas de prueba y dos negocios independientes. Alta, ajuste, traslado de sucursal, venta en efectivo, devolución, reintento de cobro tras corte de conexión y lectura en PC/móvil. No registrar una venta hasta que el servidor confirme pago y stock.
- [ ] **Móvil real:** Android 10–16 en al menos dos tamaños, login/logout, cámara/barcode, fondos, permisos, teclado y transiciones. Una compilación válida en CI no reemplaza probar dispositivos reales.
- [ ] **Seguridad y privacidad:** RLS por empresa/sucursal, consentimiento de IA independiente, exportación y eliminación de datos, registro de incidentes, almacenamiento local sensible y borradores offline. Revisión jurídica local de términos, transferencias internacionales, proveedores e información de datos personales.
- [ ] **Servicios de terceros:** cuotas estables de IA, secretos de proveedor fuera del repositorio, permisos de cada tienda; sin afirmar integración funcional cuando solo se registró una URL. ARCA no debe emitir CAE hasta homologación.
- [ ] **Google Play Console:** el titular debe abrir/verificar su cuenta de desarrollador, configurar su perfil, país, datos de contacto, nombre de paquete, ficha y capturas reales, clasificación de contenido, política de privacidad `https://globalstocks.vercel.app/legal/privacy`, declaración de seguridad de datos, permisos, pruebas de cuenta y requisitos de testing aplicables. No inventar ni reutilizar cuentas de terceros.
- [ ] **Expo EAS:** configurar secret `EXPO_TOKEN` en GitHub Actions desde la cuenta Expo del titular y completar/autorizar credenciales de firmado Android desde Expo. Nunca publicar keystore, certificados privados ni tokens de API en GitHub.
- [ ] **Microsoft Store (opcional):** contar con una cuenta de Microsoft Partner Center aprobada, generar paquete MSIX/PWA con identidad y firma correctas, entregar descripciones, capturas, privacidad y certificados correspondientes. La instalación PWA desde Edge ya cubre Windows inicialmente.

## Comandos y proceso de entrega

**Instalar PWA Windows ahora:** abrir `https://globalstocks.vercel.app` con Edge o Chrome → menú de navegador → *Aplicaciones / Instalar Global Stock*. Se abre como app independiente. Requiere conexión y una cuenta válida para operaciones online.

**APK privado Android para test (no publica nada):** ejecutar manualmente el workflow `Global Stock · Android APK / Play Store AAB` en GitHub Actions con `profile=preview`, cuando `EXPO_TOKEN` y las credenciales de firmado estén disponibles. El workflow valida sintaxis, acceso, tipos y Expo antes de llamar a EAS.

**AAB Play Store:** después de aprobar pruebas internas, ejecutar el mismo workflow con `profile=production`. Esto **genera** un archivo para Google Play, pero **no lo envía** ni publica automáticamente. La carga y aprobación requieren la cuenta del titular, políticas vigentes y aceptación explícita.

**Criterio de "oficial":** Play Console aprobó la ficha y la publicación; PWA Windows comprobada en Edge/Chrome en equipo real; roles/RLS y flujos de caja/stock verificados; documentación legal revisada. No marcar una versión como oficial basándonos solo en un commit o un estado Vercel Ready.

## Orden de lanzamiento sugerido

- **Semana 1 (13–19 oct):** cerrar paridad funcional y errores P1, ejecutar integraciones/ventas/transferencias con cuentas de test; comprobar PWA Windows.
- **Semana 2 (20–26 oct):** firmar APK de prueba, probarlo físicamente en Android, completar materiales de Play Console.
- **Semana 3 (27 oct–2 nov):** pruebas internas/cerradas exigidas por Google, revisión jurídica y correcciones sin quitar funciones.
- **Noviembre:** publicar cuando los controles anteriores pasen y Google apruebe; no prometer una fecha precisa de aprobación por parte de tiendas.

Si faltan permisos de publicador o tokens, no se debe usar credenciales ajenas ni saltar la publicación oficial.
