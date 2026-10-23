# Install a Windows Scheduled Task that serves the Codex Kanban web board at logon.
param(
  [string]$Root = (Get-Location).Path,
  [int]$Port = 4317,
  [switch]$Open
)

$ErrorActionPreference = "Stop"
$taskName = "CodexKanban"
$pluginDir = Split-Path -Parent $PSScriptRoot
$cli = Join-Path $pluginDir "plugin\bin\codex-kanban.mjs"
$node = (Get-Command node -ErrorAction Stop).Source

if (-not (Test-Path $Root)) { throw "root does not exist: $Root" }
if (-not (Test-Path $cli)) { throw "CLI not found: $cli" }

$mode = if ($Open) { "--open" } else { "--no-open" }
$arguments = "`"$cli`" serve --root `"$Root`" --port $Port $mode"

$action = New-ScheduledTaskAction -Execute $node -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Codex Kanban web board" -Force | Out-Null

Write-Host "Installed scheduled task $taskName"
Write-Host "  root: $Root"
Write-Host "  url:  http://127.0.0.1:$Port"
Write-Host "  run:  Start-ScheduledTask -TaskName $taskName"
