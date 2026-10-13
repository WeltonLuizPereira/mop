param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = "Stop"
$agentRoot = (Resolve-Path $PSScriptRoot).Path
$resolvedProject = (Resolve-Path $ProjectRoot).Path
if (-not $agentRoot.StartsWith($resolvedProject, [StringComparison]::OrdinalIgnoreCase)) {
  throw "O agente precisa permanecer dentro do projeto MOP."
}

# 1. Limpa tarefas legadas ou redundantes de contingencia e monitoramento continuo
$tasksToClean = @("MOP-ABS-Contingencia", "MOP - Importacao ABS")
foreach ($t in $tasksToClean) {
  if (Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue) {
    Write-Host "Removendo tarefa antiga '$t'..."
    Unregister-ScheduledTask -TaskName $t -Confirm:$false -ErrorAction SilentlyContinue
  }
}

# 2. Localiza o executavel pythonw (sem janela visivel de console)
$Python = "C:\Python314\pythonw.exe"
if (-not (Test-Path $Python)) {
  $resolvedCmd = (Get-Command pythonw -ErrorAction SilentlyContinue)
  if ($resolvedCmd) { $Python = $resolvedCmd.Source }
}
if (-not (Test-Path $Python)) {
  $Python = Join-Path $resolvedProject ".venv\Scripts\pythonw.exe"
}
if (-not (Test-Path $Python)) {
  $Python = "pythonw"
}

$argumentsOnce = "-m agent_abs.cli --once"
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -MultipleInstances IgnoreNew

# 3. Disparos diarios: pontualmente as 10:00 e as 11:00
$trigger10 = New-ScheduledTaskTrigger -Daily -At "10:00AM"
$trigger11 = New-ScheduledTaskTrigger -Daily -At "11:00AM"

$task = New-ScheduledTask -Action (New-ScheduledTaskAction -Execute $Python -Argument $argumentsOnce -WorkingDirectory $resolvedProject) `
  -Trigger @($trigger10, $trigger11) -Principal $principal -Settings $settings

Register-ScheduledTask -TaskName "MOP-ABS-Importacao" -InputObject $task -Force | Out-Null

Write-Host "Sucesso: Tarefa 'MOP-ABS-Importacao' agendada para todos os dias as 10h e 11h (invisivel via pythonw, executa uma vez e fecha)."


