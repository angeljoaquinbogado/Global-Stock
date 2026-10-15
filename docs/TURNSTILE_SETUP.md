# Global Stock — Turnstile + Supabase Auth (Argentina beta)

**Estado inicial seguro:** mantené **CAPTCHA desactivado en Supabase** hasta terminar todas las verificaciones. Tener una Site Key en Vercel no activa por sí sola el control en Supabase.

## Qué está conectado

- Sitio web: `AuthScreen` monta `AuthTurnstile` cuando existe `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, bloquea los envíos sin token y pasa `options.captchaToken` en `signInWithPassword` y `options.captchaToken` en `signUp`.
- Política CSP: permite `https://challenges.cloudflare.com` para script, iframe y conexión.
- App Expo Go: consulta `/api/auth/turnstile-config`; si la Site Key está configurada, abre `/auth/turnstile` desde `globalstocks.vercel.app` en un WebView y envía el token efímero por puente nativo hacia Supabase Auth.
- Modo demo: no utiliza Supabase Auth ni requiere CAPTCHA. Google ID-token es un flujo diferente y debe comprobarse después de habilitar CAPTCHA.
- El backend que verifica el token es **Supabase Auth**. No implementes una comprobación casera ni envíes la Secret Key al cliente.

## Claves

1. Cloudflare Turnstile: widget **Managed** y hostname **globalstocks.vercel.app**.
2. Vercel > Global Stock > Settings > Environment Variables: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = **Site Key pública**; seleccionar Production, guardar y completar un nuevo despliegue.
3. Supabase proyecto correcto (`yckimhbtvijmmkxukxgd`) > Authentication > Protection: seleccionar **Cloudflare Turnstile** y poner la **Secret Key** privada en **Captcha secreto**. Mantener el interruptor **desactivado** mientras se prueba.
4. Nunca copiar la Secret Key a Vercel, `.env`, GitHub, Expo, código JS, capturas ni un mensaje.

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
