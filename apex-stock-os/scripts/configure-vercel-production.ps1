$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$teamId = "team_syydHOcLIftXPb26YSiEjMAN"
$projectId = "prj_ryYHuqIqjWCaAdWbqLwJw932nKHE"
$projectName = "global-stock"
$teamSlug = "angel-6b19"
$productionUrl = "https://global-stock-ten.vercel.app"

Write-Host ""
Write-Host "Global Stock - Vercel Production Setup" -ForegroundColor Red
Write-Host "Proyecto Vercel: $projectName"
Write-Host "Equipo: $teamSlug"
Write-Host "Produccion: $productionUrl"
Write-Host ""

$vercelDir = Join-Path $projectRoot ".vercel"
New-Item -ItemType Directory -Path $vercelDir -Force | Out-Null

$link = @{
    orgId = $teamId
    projectId = $projectId
} | ConvertTo-Json

Set-Content -Path (Join-Path $vercelDir "project.json") -Value $link -Encoding UTF8

function ConvertFrom-SecureValue {
    param([Security.SecureString]$Value)

    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function Read-Secret {
    param(
        [Parameter(Mandatory=$true)][string]$Label,
        [switch]$Optional
    )

    $secure = Read-Host $Label -AsSecureString
    $plain = ConvertFrom-SecureValue $secure

    if (-not $Optional -and [string]::IsNullOrWhiteSpace($plain)) {
        throw "$Label no puede estar vacio."
    }

    return $plain.Trim()
}

function Read-Plain {
    param(
        [Parameter(Mandatory=$true)][string]$Label,
        [switch]$Optional
    )

    $value = Read-Host $Label

    if (-not $Optional -and [string]::IsNullOrWhiteSpace($value)) {
        throw "$Label no puede estar vacio."
    }

    return $value.Trim()
}

function Set-VercelEnv {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][string]$Value,
        [switch]$Sensitive
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Host "Omitido: $Name" -ForegroundColor DarkGray
        return
    }

    foreach ($environment in @("production", "preview")) {
        Write-Host "Configurando $Name ($environment)..." -ForegroundColor Cyan

        $previousErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"

        $Value | & npx.cmd vercel@latest env update $Name $environment --scope $teamSlug 2>$null
        $updated = $LASTEXITCODE -eq 0

        if (-not $updated) {
            if ($Sensitive) {
                $Value | & npx.cmd vercel@latest env add $Name $environment --sensitive --scope $teamSlug
            }
            else {
                $Value | & npx.cmd vercel@latest env add $Name $environment --scope $teamSlug
            }

            if ($LASTEXITCODE -ne 0) {
                $ErrorActionPreference = $previousErrorAction
                throw "No se pudo configurar $Name en $environment."
            }
        }

        $ErrorActionPreference = $previousErrorAction
    }
}

function New-RandomSecret {
    param([int]$Bytes = 48)

    $buffer = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

    try {
        $rng.GetBytes($buffer)
    }
    finally {
        $rng.Dispose()
    }

    return [Convert]::ToBase64String($buffer)
}

Write-Host "1/4 OpenAI" -ForegroundColor Yellow
$openAiKey = Read-Secret "Pegá OPENAI_API_KEY"
$openAiModel = Read-Plain "Escribí OPENAI_MODEL exactamente como aparece habilitado en tu proyecto de OpenAI"

Write-Host ""
Write-Host "2/4 Supabase (opcional por ahora)" -ForegroundColor Yellow
Write-Host "Dejá vacío cualquier dato que todavía no tengas." -ForegroundColor DarkGray
$supabaseUrl = Read-Plain "NEXT_PUBLIC_SUPABASE_URL" -Optional
$supabaseAnon = Read-Secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" -Optional
$supabaseService = Read-Secret "SUPABASE_SERVICE_ROLE_KEY" -Optional

Write-Host ""
Write-Host "3/4 Ecommerce oficial (opcional por ahora)" -ForegroundColor Yellow
Write-Host "Dejá vacío lo que todavía no tengas. Podés volver a ejecutar este script más adelante." -ForegroundColor DarkGray
$shopifyId = Read-Plain "SHOPIFY_CLIENT_ID" -Optional
$shopifySecret = Read-Secret "SHOPIFY_CLIENT_SECRET" -Optional
$tiendanubeId = Read-Plain "TIENDANUBE_APP_ID" -Optional
$tiendanubeSecret = Read-Secret "TIENDANUBE_CLIENT_SECRET" -Optional
$mercadoLibreId = Read-Plain "MERCADOLIBRE_CLIENT_ID" -Optional
$mercadoLibreSecret = Read-Secret "MERCADOLIBRE_CLIENT_SECRET" -Optional

Write-Host ""
Write-Host "4/4 Configuración automática" -ForegroundColor Yellow
$connectorSecret = New-RandomSecret 48
$syncSecret = New-RandomSecret 48

Set-VercelEnv -Name "OPENAI_API_KEY" -Value $openAiKey -Sensitive
Set-VercelEnv -Name "OPENAI_MODEL" -Value $openAiModel
Set-VercelEnv -Name "GLOBAL_STOCK_CONNECTOR_SECRET" -Value $connectorSecret -Sensitive
Set-VercelEnv -Name "SYNC_WEBHOOK_SECRET" -Value $syncSecret -Sensitive
Set-VercelEnv -Name "NEXT_PUBLIC_APP_URL" -Value $productionUrl

Set-VercelEnv -Name "NEXT_PUBLIC_SUPABASE_URL" -Value $supabaseUrl
Set-VercelEnv -Name "NEXT_PUBLIC_SUPABASE_ANON_KEY" -Value $supabaseAnon -Sensitive
Set-VercelEnv -Name "SUPABASE_SERVICE_ROLE_KEY" -Value $supabaseService -Sensitive

Set-VercelEnv -Name "SHOPIFY_CLIENT_ID" -Value $shopifyId
Set-VercelEnv -Name "SHOPIFY_CLIENT_SECRET" -Value $shopifySecret -Sensitive
Set-VercelEnv -Name "TIENDANUBE_APP_ID" -Value $tiendanubeId
Set-VercelEnv -Name "TIENDANUBE_CLIENT_SECRET" -Value $tiendanubeSecret -Sensitive
Set-VercelEnv -Name "MERCADOLIBRE_CLIENT_ID" -Value $mercadoLibreId
Set-VercelEnv -Name "MERCADOLIBRE_CLIENT_SECRET" -Value $mercadoLibreSecret -Sensitive

Write-Host ""
Write-Host "Variables de Vercel configuradas." -ForegroundColor Green
Write-Host "La OPENAI_API_KEY no se guardó en GitHub ni en el código." -ForegroundColor Green
Write-Host ""

$deploy = Read-Host "¿Querés desplegar esta versión a producción ahora? (s/n)"
if ($deploy.Trim().ToLowerInvariant() -eq "s") {
    Write-Host "Desplegando Global Stock..." -ForegroundColor Cyan
    & npx.cmd vercel@latest deploy --prod --yes --scope $teamSlug --project $projectId

    if ($LASTEXITCODE -ne 0) {
        throw "El despliegue falló. Las variables sí quedaron configuradas."
    }

    Write-Host ""
    Write-Host "Global Stock desplegado." -ForegroundColor Green
    Write-Host $productionUrl -ForegroundColor Cyan
}
else {
    Write-Host ""
    Write-Host "No se desplegó. Cuando quieras: npx.cmd vercel@latest deploy --prod --yes --scope $teamSlug --project $projectId" -ForegroundColor Yellow
}
