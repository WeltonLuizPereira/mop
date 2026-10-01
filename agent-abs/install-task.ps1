param(
  [string]$TaskName = 'MOP - Importacao ABS',
  [string]$DailyAt = '10:00'
)

$ErrorActionPreference = 'Stop'
$runner = Join-Path $PSScriptRoot 'run-agent.ps1'
$powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$startAt = [datetime]::Today.Add([timespan]::Parse($DailyAt))

$action = New-ScheduledTaskAction `
  -Execute $powershell `
  -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$runner`"" `
  -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $startAt
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 10) `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
$principal = New-ScheduledTaskPrincipal `
  -UserId $currentUser `
  -LogonType Interactive `
  -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Description 'Importa automaticamente a BASE_ABS.xlsx para o Supabase em D-1.' `
  -Force `
  -ErrorAction Stop | Out-Null

Write-Output "Tarefa '$TaskName' instalada para $DailyAt."
