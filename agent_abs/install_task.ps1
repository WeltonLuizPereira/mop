param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = "Stop"
$agentRoot = (Resolve-Path $PSScriptRoot).Path
$resolvedProject = (Resolve-Path $ProjectRoot).Path
if (-not $agentRoot.StartsWith($resolvedProject, [StringComparison]::OrdinalIgnoreCase)) {
  throw "O agente precisa permanecer dentro do projeto MOP."
}

$Python = Join-Path $resolvedProject ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
  $Python = Join-Path $resolvedProject "venv\Scripts\python.exe"
}
if (-not (Test-Path $Python)) {
  Write-Warning "Aviso: Ambiente virtual (.venv) não encontrado. Usando python global. Recomenda-se criar o venv e instalar dependências."
  $Python = "python"
}

$argumentsMonitor = "-m agent_abs.cli"
$argumentsOnce = "-m agent_abs.cli --once"
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 1)

$monitor = New-ScheduledTask -Action (New-ScheduledTaskAction -Execute $Python -Argument $argumentsMonitor -WorkingDirectory $resolvedProject) `
  -Trigger (New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME) -Principal $principal -Settings $settings
Register-ScheduledTask -TaskName "MOP-ABS-Importacao" -InputObject $monitor -Force | Out-Null

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 1)
$contingency = New-ScheduledTask -Action (New-ScheduledTaskAction -Execute $Python -Argument $argumentsOnce -WorkingDirectory $resolvedProject) `
  -Trigger $trigger -Principal $principal -Settings (New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 4))
Register-ScheduledTask -TaskName "MOP-ABS-Contingencia" -InputObject $contingency -Force | Out-Null

Write-Host "Tarefas MOP-ABS-Importacao e MOP-ABS-Contingencia instaladas."

