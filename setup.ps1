#!/usr/bin/env pwsh
# One-time setup: deploy open-dibs-on-stuff to a Slack workspace and create the link triggers.
# Run this once, from the repo root, as whoever is setting the app up for their team.
# Windows equivalent of setup.sh. Run from PowerShell: .\setup.ps1

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

if (-not (Test-Path "manifest.ts")) {
    Write-Error "Run this from the root of the open-dibs-on-stuff repo."
    exit 1
}

Write-Host "== Checking prerequisites =="

if (-not (Get-Command slack -ErrorAction SilentlyContinue)) {
    Write-Error "Slack CLI not found. Install it first (PowerShell): irm https://downloads.slack-edge.com/slack-cli/install-windows.ps1 | iex"
    exit 1
}
Write-Host "- Slack CLI: found"

if (-not (Get-Command deno -ErrorAction SilentlyContinue)) {
    Write-Error "Deno not found. Install it first (see README.md 'Pre-requisitos' / Prerequisites)."
    exit 1
}
Write-Host "- Deno: found ($((deno --version | Select-Object -First 1)))"

# Corporate networks that intercept TLS re-sign HTTPS with a root CA that Deno's bundled store
# doesn't trust, which breaks downloading the Slack SDK hooks (get-manifest -> runtime_not_found).
# Trusting the OS store fixes it and is harmless on networks without interception.
$env:DENO_TLS_CA_STORE = "system"

Write-Host ""
Write-Host "== Logging in to Slack =="
Write-Host "A browser window will open. Pick the workspace where you want to install the app."
slack login
if ($LASTEXITCODE -ne 0) { throw "slack login failed" }

Write-Host ""
Write-Host "== Deploying the app =="
slack deploy
if ($LASTEXITCODE -ne 0) { throw "slack deploy failed" }

Write-Host ""
Write-Host "== Creating link triggers =="
Write-Host "Creating one shortcut per action. Copy each link below and pin it in the channel"
Write-Host "your team will use (Slack: pin a message with the link, or just share it)."
Write-Host ""

$triggers = [ordered]@{
    "reserve_link.ts" = "Reserve"
    "release_link.ts" = "Release"
    "extend_link.ts"  = "Extend"
    "status_link.ts"  = "Status"
}

foreach ($file in $triggers.Keys) {
    Write-Host "--- $($triggers[$file]) ---"
    slack trigger create --trigger-def "triggers/$file"
    if ($LASTEXITCODE -ne 0) { throw "slack trigger create failed for $file" }
    Write-Host ""
}

Write-Host "== Done =="
Write-Host ""
Write-Host "Pin the 4 links above in your team's channel. Anyone in the workspace can then use them,"
Write-Host "no further setup needed on their end."
Write-Host ""
Write-Host "Optional: set a different timezone or end-of-business-hour default (defaults are"
Write-Host "America/Sao_Paulo and 18:00):"
Write-Host ""
Write-Host "  slack env add DIBS_TIMEZONE America/Sao_Paulo"
Write-Host "  slack env add DIBS_BUSINESS_END_HOUR 18"
Write-Host ""
Write-Host "See INSTALL.md for details and troubleshooting."
