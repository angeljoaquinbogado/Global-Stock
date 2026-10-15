# Global Stock — Turnstile + Supabase Auth (Argentina beta)

**Estado inicial seguro:** mantener **CAPTCHA desactivado en Supabase** y `NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED=false` (o sin configurar) en Vercel hasta completar las pruebas. **La Site Key ya existente NO obliga al navegador ni a Expo Go a realizar Turnstile.** Antes, confundir ambas cosas abría una ventana blanca de verificación aunque Supabase no la exigiera; se corrigió.

## Qué está conectado

- Sitio web: `AuthScreen` monta `AuthTurnstile` **solo cuando `NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED=true` y existe `NEXT_PUBLIC_TURNSTILE_SITE_KEY`**, bloquea los envíos sin token y pasa `options.captchaToken` en `signInWithPassword` y `options.captchaToken` en `signUp`.
- Política CSP: permite `https://challenges.cloudflare.com` para script, iframe y conexión.
- App Expo Go: consulta `/api/auth/turnstile-config`; solo si la protección está explícitamente habilitada **y** la Site Key está configurada, abre `/auth/turnstile` desde `globalstocks.vercel.app` en un WebView y envía el token efímero por puente nativo hacia Supabase Auth.
- Modo demo: no utiliza Supabase Auth ni requiere CAPTCHA. Google ID-token es un flujo diferente y debe comprobarse después de habilitar CAPTCHA.
- El backend que verifica el token es **Supabase Auth**. No implementes una comprobación casera ni envíes la Secret Key al cliente.

## Claves

1. Cloudflare Turnstile: widget **Managed** y hostname **globalstocks.vercel.app**.
2. Vercel > Global Stock > Settings > Environment Variables: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = **Site Key pública** y `NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED=false` (o dejar esta segunda variable sin crear). No activar todavía; la Site Key por sí sola queda guardada pero no lanza la verificación. Cambiar el interruptor exige un **nuevo despliegue** para la aplicación web.
3. Supabase proyecto correcto (`yckimhbtvijmmkxukxgd`) > Authentication > Protection: seleccionar **Cloudflare Turnstile** y poner la **Secret Key** privada en **Captcha secreto**. Mantener el interruptor **desactivado** mientras se prueba.
4. Nunca copiar la Secret Key a Vercel, `.env`, GitHub, Expo, código JS, capturas ni un mensaje.

## Importante: corregir la verificación en Expo Go

El problema de la ventana blanca/«verificación fallida» se originó porque Expo activaba el captcha apenas encontraba la Site Key, aun cuando Supabase Auth no tenía CAPTCHA habilitado. Con el interruptor separado, Expo continúa con correo y contraseña sin mostrar el modal hasta que decidas activar el requisito.

Al preparar la activación real en el futuro, no confiar solamente en compilar: ejecutar una prueba física en Expo Go con Cloudflare, verificar la recepción y el uso del token contra Supabase, y contemplar las versiones móviles anteriores. Si Turnstile no funciona en el WebView, mantener desactivado el requisito y corregir ese recorrido antes de habilitar el bloqueo.

## Secuencia de activación

1. Con Supabase CAPTCHA **desactivado**, revisar el widget Cloudflare y probar `/auth/turnstile` en la web, sin revelar claves privadas.
2. Confirmar con una cuenta de prueba la verificación en la web y Expo Go bajo condiciones de prueba, sin bloquear usuarios públicos.
3. Configurar `NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED=true` en producción y **redesplegar** para que web y Expo Go soliciten tokens.
4. Sólo una vez confirmada la versión publicada y la app móvil actualizada, activar Cloudflare Turnstile en Supabase Auth y guardar. Probar acceso y registro reales con cuentas de prueba.
5. Para revertir: primero desactivar CAPTCHA en Supabase y guardar, después cambiar `NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED=false` y desplegar.

## Pruebas antes de activar el bloqueo en Supabase

1. Confirmar que Vercel indica **Ready** para un despliegue posterior al guardado de la Site Key.
2. En una ventana privada en `https://globalstocks.vercel.app`, abrir **Iniciar sesión** y **Crear cuenta** y comprobar que la verificación se puede completar sin errores, tanto en tema claro como oscuro. La verificación puede ser invisible cuando Cloudflare considera que la visita es segura.
3. Iniciar sesión con una cuenta de prueba conocida (no la cuenta administradora), sin inventar ni publicar credenciales.
4. En Expo Go: desde el directorio del repositorio ejecutar `git pull origin main`, entrar a `apps/global-stocks-mobile`, ejecutar `npm install` y `npx expo start --clear`. Verificar que la ventana de seguridad se abra, genere un token y regrese a la app. Si el WebView falla en Expo Go, **no activar todavía CAPTCHA en Supabase**.
5. Solo después de esas pruebas, en Supabase habilitar protección CAPTCHA y guardar. Hacer una prueba real de login y signup usando cuentas de prueba (pueden requerir confirmar correo). Repetir en PC, móvil y Expo Go.
6. **Rollback inmediato** si algo falla: Supabase > Authentication > Protection > desactivar Habilitar protección Captcha > Guardar cambios. Las claves y el código pueden permanecer configurados mientras investigás.

## Consideraciones

- Turnstile no reemplaza límites de solicitudes de Supabase, confirmación de correo, contraseñas seguras ni política RLS.
- Cloudflare valida el hostname configurado. `localhost`, IP de LAN y dominios de preview requieren configuración separada o claves de prueba oficiales; no agregar comodines amplios.
- El token es de un solo uso y expira: generar un token nuevo para cada intento. No almacenarlo ni registrarlo en logs.
- Una build móvil antigua que no incluya el flujo CAPTCHA fallará cuando Supabase exija tokens; actualizar Expo Go y planificar compatibilidad para instalaciones antiguas antes de activar en producción.
