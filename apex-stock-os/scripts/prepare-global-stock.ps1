$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host ""
Write-Host "Global Stock - preparacion local" -ForegroundColor Red
Write-Host "Proyecto: $projectRoot"
Write-Host ""

$earthTarget = Join-Path $projectRoot "public\global-stock-earth.png"

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $earthTarget)) {
    Add-Type -AssemblyName System.Windows.Forms

    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = "Selecciona la imagen realista de la Tierra para Global Stock"
    $dialog.Filter = "Imagenes|*.png;*.jpg;*.jpeg;*.webp|Todos los archivos|*.*"
    $dialog.Multiselect = $false

    $result = $dialog.ShowDialog()

    if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
        throw "No se selecciono la imagen de la Tierra."
    }

    $source = $dialog.FileName
    $extension = [System.IO.Path]::GetExtension($source).ToLowerInvariant()

    if ($extension -eq ".png") {
        Copy-Item $source $earthTarget -Force
    }
    else {
        $image = [System.Drawing.Image]::FromFile($source)
        try {
            $image.Save(
                $earthTarget,
                [System.Drawing.Imaging.ImageFormat]::Png
            )
        }
        finally {
            $image.Dispose()
        }
    }

    Write-Host "Imagen de la Tierra preparada." -ForegroundColor Green
}
else {
    Write-Host "Imagen de la Tierra ya instalada." -ForegroundColor Green
}

# Keep the cinematic Earth sharp without decoding an unnecessarily huge image
# on phones. The UI never displays it above ~760px, so 1600px preserves Retina
# quality while reducing memory and animation cost substantially.
$image = [System.Drawing.Image]::FromFile($earthTarget)
try {
    $maxDimension = 1600
    $largest = [Math]::Max($image.Width, $image.Height)

    if ($largest -gt $maxDimension) {
        $scale = $maxDimension / [double]$largest
        $newWidth = [Math]::Max(1, [int][Math]::Round($image.Width * $scale))
        $newHeight = [Math]::Max(1, [int][Math]::Round($image.Height * $scale))
        $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)

        try {
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)
            }
            finally {
                $graphics.Dispose()
            }

            $tempEarth = Join-Path $projectRoot "public\global-stock-earth.optimized.png"
            $bitmap.Save(
                $tempEarth,
                [System.Drawing.Imaging.ImageFormat]::Png
            )
        }
        finally {
            $bitmap.Dispose()
        }

        $image.Dispose()
        $image = $null
        Move-Item $tempEarth $earthTarget -Force
        Write-Host ("Imagen de la Tierra optimizada a " + $newWidth + "x" + $newHeight + ".") -ForegroundColor Green
    }
}
finally {
    if ($null -ne $image) {
        $image.Dispose()
    }
}

$oldCesium = Join-Path $projectRoot "public\cesium"
if (Test-Path $oldCesium) {
    Remove-Item -Recurse -Force $oldCesium
}

$nextBuild = Join-Path $projectRoot ".next"
if (Test-Path $nextBuild) {
    Remove-Item -Recurse -Force $nextBuild
}

$listener = Get-NetTCPConnection -LocalPort 3010 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $listener |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
}

Write-Host ""
Write-Host "Instalando dependencias..." -ForegroundColor Cyan
& npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install fallo." }

& npm.cmd prune
if ($LASTEXITCODE -ne 0) { throw "npm prune fallo." }

Write-Host ""
Write-Host "Comprobando TypeScript..." -ForegroundColor Cyan
& npm.cmd run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck fallo." }

Write-Host ""
Write-Host "Comprobando ESLint..." -ForegroundColor Cyan
& npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw "Lint fallo." }

Write-Host ""
Write-Host "Compilando produccion..." -ForegroundColor Cyan
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Build fallo." }

Write-Host ""
Write-Host "Global Stock listo." -ForegroundColor Green
Write-Host "PC:      http://localhost:3010"
Write-Host "Celular: http://192.168.0.7:3010"
Write-Host ""
Write-Host "Deja esta terminal abierta mientras uses la app." -ForegroundColor Yellow
Write-Host ""

& npx.cmd next start -H 0.0.0.0 -p 3010
