# Runs the Playwright suite against the running backend and builds the traceability matrix.
# Start the backend first, from code-quest-back:  powershell -File scripts/functional.ps1 -Serve
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$ApiUrl = if ($env:FUNCTIONAL_API_URL) { $env:FUNCTIONAL_API_URL } else { "http://127.0.0.1:8001" }

# CODEQUEST_PROFESSOR_PASSWORD comes from the environment or from the front .env.
if (-not $env:CODEQUEST_PROFESSOR_PASSWORD -and (Test-Path ".env")) {
    foreach ($line in Get-Content ".env") {
        if ($line -match '^\s*CODEQUEST_PROFESSOR_PASSWORD\s*=\s*(.+?)\s*$') {
            $env:CODEQUEST_PROFESSOR_PASSWORD = $Matches[1].Trim('"', "'")
        }
    }
}
if (-not $env:CODEQUEST_PROFESSOR_PASSWORD) {
    Write-Host "Set CODEQUEST_PROFESSOR_PASSWORD (environment or .env): the suite logs in as ft_prof and ft_prof2." -ForegroundColor Red
    exit 1
}

try {
    $health = Invoke-WebRequest "$ApiUrl/health" -UseBasicParsing -TimeoutSec 3
    if ($health.StatusCode -ne 200) { throw "status $($health.StatusCode)" }
} catch {
    Write-Host "Backend not reachable at $ApiUrl." -ForegroundColor Red
    Write-Host "Start it first, from code-quest-back:  powershell -File scripts/functional.ps1 -Serve" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force "docs/evidence" | Out-Null
# Reporters (list + JSON to docs/evidence/playwright.json) are set in playwright.config.ts.
npx playwright test tests/functional
$testExit = $LASTEXITCODE

node scripts/traceability.mjs
$traceExit = $LASTEXITCODE

if ($testExit -ne 0 -or $traceExit -ne 0) { exit 1 }
