# Global Stock — inicio de sesión con Apple (web)

La interfaz y el flujo de autenticación web están integrados con Supabase Auth:
`AppleIdentityButton` → `supabase.auth.signInWithOAuth({ provider: "apple" })` →
Apple → `/auth/v1/callback` de Supabase → `https://globalstocks.vercel.app/`.

**La interfaz por sí sola no activa el proveedor.** Estos pasos requieren la
cuenta Apple Developer que administra Global Stock y acceso a Auth en Supabase.
No publiques claves `.p8`, secretos OAuth, tokens ni capturas que los contengan.

## Configuración necesaria

1. Contar con la membresía Apple Developer correspondiente y los permisos para
   configurar *Certificates, Identifiers & Profiles*.
2. En Apple Developer: habilitar **Sign in with Apple** para el App ID principal
   de Global Stock y crear un **Services ID** (identificador del cliente web,
   por ejemplo `app.globalstocks.signin`; usar el identificador realmente creado).
3. En la configuración web de ese Services ID:
   - Dominio: `yckimhbtvijmmkxukxgd.supabase.co`
   - Return URL: `https://yckimhbtvijmmkxukxgd.supabase.co/auth/v1/callback`
   - Asociarlo al App ID principal y guardar la configuración.
4. Crear/usar una **Sign in with Apple key** autorizada. Registrar
   **Team ID**, **Key ID**, **Services ID** y el material necesario para
   generar el **client secret JWT** en Apple Developer. El JWT tiene expiración
   limitada y debe renovarse antes de vencer según el método de configuración.
5. Abrir el proyecto de Supabase **Global Stock**
   (`yckimhbtvijmmkxukxgd`) → **Authentication → Providers → Apple**.
   Habilitarlo, colocar el **Services ID** como identificador de cliente y
   configurar el secreto Apple exigido por el panel. Guardar.
6. En **Authentication → URL Configuration** verificar:
   - Site URL: `https://globalstocks.vercel.app`
   - Redirect URL permitida: `https://globalstocks.vercel.app/`
   - Agregar dominios preview únicamente si son confiables y se va a probar
     OAuth allí. No usar comodines amplios en dominios ajenos.
7. Probar desde producción:
   - Abrir una ventana privada, pulsar **Continuar con Apple**.
   - Autorizar en Apple; comprobar que regresa a Global Stock y Supabase
     establece una sesión verificada.
   - Comprobar consentimiento legal, negocios y permisos por usuario.
   - Cerrar sesión y volver a entrar, comprobando que se conserva la misma
     cuenta de Supabase.
   - Probar con **Compartir mi correo** y **Ocultar mi correo**.

## Vincular con cuentas existentes

No se debe unir una cuenta a otra únicamente porque se parezcan sus nombres.
Apple puede devolver un correo privado `@privaterelay.appleid.com`, distinto
del usado para Google/correo, y eso puede crear **otra cuenta independiente**.
Para asociar una identidad Apple a una cuenta existente debe hacerse desde
una sesión ya autenticada, con vinculación segura de identidades de Supabase
(`linkIdentity`, si *Manual Linking* está habilitado). No fusionar
negocios, inventario ni permisos entre IDs de usuarios mediante SQL manual.

## Estado y limitaciones

- Implementación frontend web: incluida. Apple inicia el flujo mediante
  Supabase, sin secretos Apple del lado del cliente.
- Activación real de proveedor en Apple Developer y Supabase: debe comprobarla
  el titular administrador, no está habilitada por un cambio en GitHub.
- Expo Go: no hereda automáticamente el inicio OAuth web de Apple. El login
  Apple nativo requiere una development/production build y una configuración
  OAuth apropiada; no confundir con este acceso web.
- Mantener los documentos y consentimientos legales argentinos para nuevas
  cuentas; Apple OAuth no reemplaza la aceptación legal.
