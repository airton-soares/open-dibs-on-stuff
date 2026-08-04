#!/usr/bin/env pwsh
# Install or update open-dibs-on-stuff in a Slack workspace.
# Safe to re-run: it deploys the current working tree and syncs the link triggers in place,
# so the shortcut links already pinned in your channel keep working across updates.
# Windows equivalent of setup.sh. Run from PowerShell: .\setup.ps1

param(
    [string]$App = "",
    [switch]$Yes
)

$ErrorActionPreference = "Stop"
# PowerShell 7.4+ turns a non-zero exit code from a native command into a terminating error.
# This script checks $LASTEXITCODE itself and expects some commands to fail (e.g. "slack auth
# list" before the first login), so keep the old behaviour.
$PSNativeCommandUseErrorActionPreference = $false
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
$authed = (slack auth list --no-color --skip-update 2>$null | Select-String -Pattern "Team ID:" -Quiet)
if ($authed) {
    Write-Host "- already logged in; skipping (run 'slack login' by hand to add another workspace)"
}
else {
    Write-Host "A browser window will open. Pick the workspace where you want to install the app."
    slack login
    if ($LASTEXITCODE -ne 0) { throw "slack login failed" }
}

Write-Host ""
Write-Host "== Deploying the app =="
Write-Host "Updates an existing installation in place; creates it on the first run."
if ($App) {
    slack deploy --hide-triggers --app $App
}
else {
    slack deploy --hide-triggers
}
if ($LASTEXITCODE -ne 0) { throw "slack deploy failed" }

if (-not $App) {
    $ids = @()
    if (Test-Path ".slack/apps.json") {
        $apps = (Get-Content ".slack/apps.json" -Raw | ConvertFrom-Json).apps
        $ids = @($apps.PSObject.Properties | ForEach-Object { $_.Value.app_id } | Sort-Object -Unique)
    }
    if ($ids.Count -eq 1) {
        $App = $ids[0]
    }
    else {
        Write-Error "Could not tell which app to use (found $($ids.Count) in .slack/apps.json). Re-run picking one explicitly: .\setup.ps1 -App <APP_ID>"
        exit 1
    }
}
Write-Host "- App: $App"

Write-Host ""
Write-Host "== Syncing link triggers =="
Write-Host "Existing shortcuts are updated in place, so their links stay valid."
Write-Host ""

$triggerFiles = @("reserve_link.ts", "release_link.ts", "extend_link.ts", "leave_queue_link.ts", "status_link.ts")

function Get-TriggerTitle([string]$file) {
    $match = Select-String -Path "triggers/$file" -Pattern '^\s*name:\s*"(.*)",\s*$' | Select-Object -First 1
    if (-not $match) { throw "Could not read the trigger name from triggers/$file." }
    return $match.Matches[0].Groups[1].Value
}

function Get-TriggerList {
    $out = (slack trigger list --app $App --limit 200 --no-color --skip-update) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw "slack trigger list failed" }
    return $out
}

# A failure here must abort: an empty list would read as "nothing installed" and the sync
# below would create a second copy of every trigger instead of updating the existing ones.
$installed = Get-TriggerList
$dupes = @()

foreach ($file in $triggerFiles) {
    $title = Get-TriggerTitle $file
    $pattern = "(?m)^\s*" + [regex]::Escape($title) + " (Ft[A-Z0-9]+) \(shortcut\)"
    $ids = @([regex]::Matches($installed, $pattern) | ForEach-Object { $_.Groups[1].Value })

    if ($ids.Count -eq 0) {
        Write-Host "--- ${title}: creating ---"
        slack trigger create --trigger-def "triggers/$file" --app $App
        if ($LASTEXITCODE -ne 0) { throw "slack trigger create failed for $file" }
    }
    else {
        $keep = $ids[0]
        Write-Host "--- ${title}: updating $keep ---"
        slack trigger update --trigger-id $keep --trigger-def "triggers/$file" --app $App
        if ($LASTEXITCODE -ne 0) { throw "slack trigger update failed for $file" }
        if ($ids.Count -gt 1) { $dupes += $ids[1..($ids.Count - 1)] }
    }
    Write-Host ""
}

if ($dupes.Count -gt 0) {
    Write-Host "== Duplicate triggers =="
    Write-Host "These extra shortcuts point at the same workflows, left over from an earlier run."
    Write-Host "The one kept per action is the first the API lists; these are the leftovers:"
    $dupes | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
    Write-Host "Deleting one breaks that specific link if somebody pinned it. The kept links above still work."
    if ($Yes) {
        $reply = "y"
    }
    else {
        $reply = Read-Host "Delete the leftovers? [y/N]"
    }
    if ($reply -match '^(y|yes)$') {
        foreach ($id in $dupes) {
            slack trigger delete --trigger-id $id --app $App --force
            if ($LASTEXITCODE -ne 0) { throw "slack trigger delete failed for $id" }
        }
    }
    else {
        Write-Host "Kept. Delete later with: slack trigger delete --trigger-id <id> --app $App"
    }
    Write-Host ""
}

Write-Host "== Your links =="
try {
    Get-TriggerList
}
catch {
    Write-Host "(could not list triggers; run: slack trigger list --app $App)"
}

Write-Host ""
Write-Host "== Done =="
Write-Host ""
Write-Host "Invite the app to your team's channel, then pin the 5 links above there:"
Write-Host ""
Write-Host "  /invite @open-dibs-on-stuff"
Write-Host ""
Write-Host "The invite is required: Status, Leave queue and the expiration reminders use ephemeral messages,"
Write-Host "which Slack only allows in channels the app belongs to. Anyone in the workspace can then use the"
Write-Host "links, no further setup needed on their end. Re-running this script keeps those links valid."
Write-Host ""
Write-Host "To ship a new version later: pull the latest code and run .\setup.ps1 again."
Write-Host ""
Write-Host "Optional: set a different timezone or end-of-business-hour default (defaults are"
Write-Host "America/Sao_Paulo and 18:00):"
Write-Host ""
Write-Host "  slack env add DIBS_TIMEZONE America/Sao_Paulo"
Write-Host "  slack env add DIBS_BUSINESS_END_HOUR 18"
Write-Host ""
Write-Host "Last step, by hand: open one of the links in Slack and make a reservation to confirm"
Write-Host "the deploy is live."
Write-Host ""
Write-Host "See INSTALL.md for details and troubleshooting."
