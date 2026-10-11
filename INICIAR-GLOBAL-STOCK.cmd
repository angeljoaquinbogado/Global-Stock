@echo off
setlocal
title Global Stock - Expo Go
cd /d "%~dp0apps\global-stocks-mobile"
if errorlevel 1 (
  echo ERROR: No se encontro la carpeta apps\global-stocks-mobile.
  pause
  exit /b 1
)
if not exist "package.json" (
  echo ERROR: La aplicacion movil de Global Stock no esta completa.
  echo Primero ejecuta git pull origin main desde la carpeta principal.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Instala Node.js LTS desde https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm no esta disponible. Reinstala Node.js LTS.
  pause
  exit /b 1
)
echo.
echo ==================================================
echo           GLOBAL STOCK - APP MOVIL
echo ==================================================
echo Carpeta correcta: %CD%
echo NO se iniciara Flutter ni la web de Next.js.
echo.
if not exist "node_modules\expo\package.json" (
  echo Primera ejecucion: instalando React Native y Expo...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)
if not exist ".env" (
  echo.
  echo AVISO: No hay archivo .env con datos publicos de Supabase.
  echo Se abrira la vista previa DEMO de Global Stock.
  echo Luego podras conectar tu cuenta con .env.
)
echo.
echo En el celular, abre Expo Go, usa "Scan QR Code" y escanea el QR de ESTA ventana.
echo Si tu PC y el celular no estan en la misma Wi-Fi, cierra y ejecuta:
echo   cd apps\global-stocks-mobile
echo   npx expo start --go --clear --tunnel
echo.
echo Iniciando Global Stock...
call npx expo start --go --clear --lan
if errorlevel 1 (
  echo.
  echo Si no se inicio, copia la salida de esta ventana para revisar el error.
  pause
  exit /b 1
)
endlocal
