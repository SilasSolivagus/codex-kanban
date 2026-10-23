# Remove the Codex Kanban scheduled task.
$ErrorActionPreference = "Stop"
$taskName = "CodexKanban"
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($null -eq $task) {
  Write-Host "Not installed: $taskName"
  exit 0
}
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "Removed scheduled task $taskName"
