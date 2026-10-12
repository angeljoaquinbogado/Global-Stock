# Global Stock · Auditoría de paridad, seguridad y privacidad — Argentina
**Fecha:** 12 de octubre de 2026 · **Estado:** NO LISTA para beta pública sin pruebas de cierre

Este informe diferencia cambios comprobados por código y CI de verificaciones que todavía faltan. **No constituye certificación legal, auditoría de penetración ni aprobación de la AAIP**.

## Avances comprobados
- Expo Go y PC utilizan Supabase como fuente central de negocios y productos; esto **no** implica que todas las pantallas, roles y acciones sean equivalentes.
- Las 21 categorías con nombres cotidianos están alineadas entre la selección móvil y la presentación web; una prueba de contrato detecta discrepancias.
- La app Expo exige declaración de **18 años o más** y operación en Argentina, con aceptación versionada de condiciones y política de privacidad. La web ahora exige una declaración equivalente al registrarse con correo, pero sigue siendo verificación declarativa.
- La página `/legal/cookies` explica almacenamiento necesario, proveedores y medición opcional. Las páginas legales y contacto están enlazados.
- Google Intelligence limita llamadas por modelo; la API tiene una protección **atómica por usuario en base de datos**, más control de frecuencia en memoria. Cuotas de Google Gemini son distintas y todavía pueden bloquear respuestas.
- El endpoint público de cotizaciones usa límites de 7s y caché de servidor de 2–5 minutos.
- Las tareas GitHub Actions de Expo, Playwright, Lighthouse y seguridad tienen controles de duración o frecuencia. No se encontraron archivos dedicados de cron/worker en la estructura del repositorio al revisar, sin garantía sobre integraciones externas.
- TypeScript móvil, dependencia Expo y exportación de JS iOS/Android pasaron en GitHub Actions al commit `c9de66e`. Web CI, Security y Playwright también tienen resultados favorables en commits previos; **cada nuevo cambio exige nueva comprobación**.

## Riesgos prioritarios, no resueltos

**P1 — Acceso, edad y Argentina:** la declaración cliente de +18 no comprueba identidad. Inicios Google/OAuth, rutas PC y miembros invitados necesitan un control obligatorio del lado del servidor antes del acceso a datos empresariales. Mantener la beta 18+; no permitir menores de 14 mediante casilla de padres sin proceso formal.

**P1 — Confidencialidad de datos:** Expo mantiene snapshots y borradores locales SQLite sin cifrado en reposo. Antes de almacenar datos fiscales, listas de clientes, otros datos sensibles o ampliar la beta, cifrar el almacenamiento y probar borrado/recuperación con datos reales de test. Nunca desinstalar app sin respaldar borradores no sincronizados.

**P1 — Cuota real de IA y dinero:** el proveedor externo devuelve 429/503; los límites propios reducen el abuso pero no restauran cuota. Proveedor alternativo con presupuesto de gasto y política de retención necesita aprobación del operador. No simular contestaciones.

**P1 — Diferencias funcionales PC/móvil:** comparten registros, pero caja, reportes, configuración, venta definitiva, integraciones y navegación siguen en dos implementaciones distintas. La campaña web y el onboarding móvil comparten rubros; aún NO hay una interfaz única. Para paridad real, migrar por módulos, pruebas cruzadas usuario/negocio, diseño adaptable y adaptadores de cámara/impresora.

**P1 — Datos de terceros y derechos:** inventarios pueden mezclar datos de clientes, proveedores, empleados y documentos. Completar inventario de tratamientos, proveedor y ubicación de datos, transferencias, políticas de seguridad, base legal y ejercicio de acceso/rectificación/eliminación según Ley 25.326 y normas aplicables, sujeto a evaluación profesional local. La política todavía usa períodos de conservación genéricos.

**P1 — Newsletter:** **NO ESTÁ ACTIVADO**. No enviar mensajes promocionales ni suscribir cuentas automáticamente. Antes de habilitar: opt-in explícito y registrable, doble confirmación cuando proceda, remitente/dominio validado, **List-Unsubscribe y enlace visible en cada mensaje**, baja inmediata y gratuita, supresión de reenvíos tras baja, bajas auditables, controles de abuso y entrega real. Los emails esenciales de autenticación/seguridad no son suscripción a novedades.

**P2 — Cookies/analítica:** distinguir cookies indispensables del servicio de etiquetas opcionales. En el código público revisado no se identificó una carga externa de Google Fonts ni etiqueta de seguimiento publicitario en `app/layout.tsx`. Confirmar contra red de producción y proveedores conectados antes de afirmar ausencia. No activar analytics opcionales antes de consentimiento y aviso apropiado. Revisar qué logs retienen hosting y terceros.

**P2 — Animación/accesibilidad:** el catálogo web tiene fundido cruzado con `prefers-reduced-motion`; shared-element, magnificación y desenfoque progresivo no están implementados universalmente ni probados en iPhone. No introducir pantallas modales nativas que puedan volver a tapar el login. Respetar contraste, foco, tamaño de objetivos y ajustes de movimiento.

## Checklist QA antes del próximo lanzamiento
1. Expo Go en iPhone real: bienvenida → inicio de sesión → menú → IA → categorías → lectura/manual código → cerrar sesión → volver a iniciar. Confirmar que no reaparezca pantalla en blanco.
2. PC y Expo con el **mismo usuario**: altas, stocks, costos, precios, roles y persistencia; luego **otro usuario y otro negocio** para demostrar aislamiento (RLS/IDOR). Comprobar conflictos simultáneos.
3. Playwright en Chromium, Firefox y WebKit: 360×740, 390×844, notebook y escritorio; categoría, navegación, legal, preferencias, protección a menores y errores.
4. Seguridad: scripts de dependencias, auditorías RLS, límites de peticiones, secretos, carga de terceros, loops de IA y tiempos de espera; pruebas adversarias autorizadas.
5. Privacidad: aceptar/revocar políticas y AI consent, borrar cuenta y copias locales, descargar datos, revocar email marketing cuando esté disponible.

## Fuentes normativas pendientes de validación profesional
Ley argentina 25.326 de Protección de Datos Personales y disposiciones/resoluciones de la AAIP que correspondan, reglas de comunicaciones comerciales y defensa del consumidor aplicables. No afirmar conformidad total por publicar textos legales.

**Veredicto: NO LISTA para beta pública irrestricta.** Avances sustanciales de arquitectura y QA; faltan pruebas con dispositivos y cuentas de test, paridad funcional real, validación legal y cuota de IA estable.
