$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env.local"

if (-not (Test-Path $envPath)) {
    New-Item -ItemType File -Path $envPath | Out-Null
}

function Set-EnvValue {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][string]$Value
    )

    $lines = @()
    if (Test-Path $envPath) {
        $lines = @(Get-Content $envPath)
    }

    $found = $false
    $next = foreach ($line in $lines) {
        if ($line -match ("^" + [Regex]::Escape($Name) + "=")) {
            $found = $true
            "$Name=$Value"
        }
        else {
            $line
        }
    }

    if (-not $found) {
        $next += "$Name=$Value"
    }

    Set-Content -Path $envPath -Value $next -Encoding UTF8
}

Write-Host ""
Write-Host "Global Stock - configurar OpenAI" -ForegroundColor Red
Write-Host "La clave se guardara solo en .env.local, que esta excluido de Git." -ForegroundColor Yellow
Write-Host ""

$secure = Read-Host "Pegá tu OPENAI_API_KEY" -AsSecureString
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)

try {
    $apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
}
finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    throw "La clave no puede estar vacia."
}

$model = Read-Host "Escribi el identificador del modelo de OpenAI que queres usar"
if ([string]::IsNullOrWhiteSpace($model)) {
    throw "El modelo no puede estar vacio."
}

Set-EnvValue -Name "OPENAI_API_KEY" -Value $apiKey.Trim()
Set-EnvValue -Name "OPENAI_MODEL" -Value $model.Trim()

Write-Host ""
Write-Host "OpenAI configurado localmente." -ForegroundColor Green
Write-Host "Reinicia Global Stock para que el servidor lea las variables." -ForegroundColor Cyan
Write-Host ""
