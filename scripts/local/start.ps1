$ErrorActionPreference = 'Stop'
$zgRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$zgDirectory = Join-Path $zgRoot 'apps/api'
$zgPrivate = Join-Path $zgRoot '.local'
New-Item -ItemType Directory -Path (Join-Path $zgPrivate 'logs') -Force | Out-Null
$zgConfig = Get-Content -LiteralPath (Join-Path $zgPrivate 'config.json') -Raw | ConvertFrom-Json
$zgPort = $zgConfig.port
docker start zuri-go-postgres | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop, then run this script again.' }
$zgReady = $false
for ($zgAttempt = 0; $zgAttempt -lt 40; $zgAttempt++) {
    docker exec zuri-go-postgres pg_isready -U postgres -d zuri_go | Out-Null
    if ($LASTEXITCODE -eq 0) { $zgReady = $true; break }
    Start-Sleep -Milliseconds 250
}
if (-not $zgReady) { throw 'PostgreSQL is not ready. Check Docker container logs.' }
$zgListening = Get-NetTCPConnection -State Listen -LocalPort $zgPort -ErrorAction SilentlyContinue
if ($zgListening) {
    try {
        $zgResponse = Invoke-RestMethod "http://127.0.0.1:$zgPort/api/zuri-go/v1/bootstrap"
        if ($zgResponse.storage -eq 'postgresql-local' -and $zgResponse.business.id -eq $zgConfig.businessId) {
            Write-Output "Zuri-Go is running: http://127.0.0.1:$zgPort/?view=1&tab=overview"
            exit 0
        }
    } catch { }
    throw "Port $zgPort is in use by another application. It was not stopped."
}
$zgNode = (Get-Command node -ErrorAction Stop).Source
Start-Process -FilePath $zgNode -ArgumentList ('"' + (Join-Path $zgDirectory 'server.mjs') + '"') -WorkingDirectory $zgDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $zgPrivate 'logs/server.log') -RedirectStandardError (Join-Path $zgPrivate 'logs/server-error.log') | Out-Null
Write-Output "Zuri-Go started: http://127.0.0.1:$zgPort/?view=1&tab=overview"
