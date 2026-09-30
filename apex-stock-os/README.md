# Global Stock

Primera entrega funcional del nuevo frontend PWA empresarial construido en **Next.js + TypeScript**. Vive en una rama separada para no destruir el prototipo Flutter existente.

## Incluido

- Next.js App Router + TypeScript.
- Tailwind CSS con sistema visual claro/oscuro, crimson `#8F0000`, glassmorphism y tipografía de sistema Apple.
- Framer Motion con transiciones spring `stiffness: 300 / damping: 30`.
- Logo SVG vectorial propio.
- Login/registro con fondo Three.js / React Three Fiber.
- Supabase Auth listo para correo/contraseña y Google OAuth.
- Dashboard P&L con Recharts.
- Inventario editable, filtros y estados Normal/Bajo/Agotado.
- Lector de barras: `BarcodeDetector` + fallback ZXing.
- Consulta por código contra catálogo local, Supabase y enriquecimiento OpenFoodFacts.
- Global Intelligence: chat persistente tipo Dynamic Island, conectado al snapshot real del dashboard.
- i18n inicial: ES / EN / PT / FR / DE.
- Multimoneda: ARS / USD / EUR / BRL / MXN / GBP / JPY.
- PWA con service worker propio, manifest e iconos 192/512 maskable.
- Esquema Supabase multi-tenant con RLS, Realtime, auditoría de stock y función atómica de sincronización.

## Ejecutar en Windows

Desde la raíz del repositorio:

```powershell
git fetch origin
git switch apex-stock-os-nextjs
cd apex-stock-os
npm.cmd install
npm.cmd run dev
```

Abrir:

```text
http://localhost:3000
```

Sin variables de entorno, la app entra en **modo demo funcional**. El login valida formato de correo/contraseña y permite abrir el dashboard con datos locales.

## Supabase

1. Crear un proyecto Supabase separado para Global Stock.
2. Ejecutar `supabase/schema.sql` en el SQL Editor.
3. Copiar `.env.example` a `.env.local`.
4. Completar las variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SYNC_WEBHOOK_SECRET=
```

La `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse al cliente ni usar el prefijo `NEXT_PUBLIC_`.

## Arquitectura

```text
app/
  api/
    fx/
    intelligence/
    product-lookup/
  globals.css
  layout.tsx
  page.tsx
components/
  ApexIntelligence.tsx
  ApexShell.tsx
  AuthScene.tsx
  AuthScreen.tsx
  BarcodeScanner.tsx
  Dashboard.tsx
  Logo.tsx
lib/
  analytics.ts
  demo-data.ts
  intelligence.ts
  supabase.ts
  types.ts
public/
  icons/
  manifest.webmanifest
supabase/
  schema.sql
```

## Seguridad de datos

El modelo multi-tenant separa cada negocio mediante `business_id`. RLS limita lectura y escritura a miembros autorizados. Los cambios de stock se registran en `inventory_events`, y la función `apply_stock_sync` usa bloqueo de fila para impedir stock negativo por actualizaciones concurrentes.

## PWA

En producción se registra un Service Worker propio desde `public/sw.js`. La aplicación puede instalarse desde navegadores compatibles en Android, Windows y macOS; en iPhone/iPad se instala desde Safari usando **Compartir → Añadir a pantalla de inicio**.


## Probar desde un celular

Con la PC y el teléfono en la misma Wi-Fi:

```powershell
npm.cmd run dev:lan
```

En otra terminal de Windows ejecutar `ipconfig` y buscar la dirección IPv4 de la PC. Desde el teléfono abrir `http://IP-DE-LA-PC:3000`.

Para probar instalación PWA, cámara y lector de códigos en condiciones reales se recomienda un despliegue HTTPS en Vercel.

## Despliegue Vercel

El proyecto está preparado para desplegarse usando `apex-stock-os` como directorio raíz.

Desde esta carpeta:

```powershell
npx.cmd vercel@latest --prod
```

La primera ejecución puede pedir iniciar sesión y confirmar el equipo/proyecto. Una vez desplegado, la URL HTTPS permite probar Global Stock desde PC, Android, iPhone y tablet.

## Estado de beta

Sin Supabase configurado, Global Stock funciona en modo demo local: autenticación de demostración, inventario editable, persistencia en el dispositivo, analítica, multimoneda, lector y Global Intelligence. Para un lanzamiento multiusuario real deben configurarse Supabase Auth y la base de datos multi-tenant incluida en `supabase/schema.sql`.


## Global Intelligence real

Global Intelligence no usa respuestas empresariales predeterminadas. El frontend envía al servidor:

- la conversación reciente;
- fecha/hora y zona horaria del dispositivo;
- productos, stock, costos, precios y ventas 30d;
- métricas P&L disponibles;
- tendencias;
- reposición estimada, cobertura de stock, capital inmovilizado y márgenes derivados.

El servidor arma ese contexto dinámicamente y lo envía a un modelo conversacional externo mediante un endpoint compatible con payload de chat completions.

Variables del servidor:

```env
AI_API_URL=
AI_API_KEY=
AI_MODEL=
```

`AI_API_KEY` puede quedar vacío cuando el servidor de modelo local no requiere autenticación.

Para pruebas locales con un servidor de modelos compatible en la misma PC, `AI_API_URL` puede apuntar a localhost. Para producción pública, usar un proveedor accesible desde Vercel y guardar los secretos solamente como variables de entorno del servidor.

Si no hay modelo configurado, la API devuelve un error de configuración en lugar de fingir una respuesta de IA.
