param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = "Stop"
$agentRoot = (Resolve-Path $PSScriptRoot).Path
$resolvedProject = (Resolve-Path $ProjectRoot).Path
if (-not $agentRoot.StartsWith($resolvedProject, [StringComparison]::OrdinalIgnoreCase)) {
  throw "O agente precisa permanecer dentro do projeto MOP."
}

# pythonw.exe nao abre janela de console: o agente roda sempre em segundo plano.
# Os logs ficam em <projeto>\logs (o agente grava em arquivo quando nao ha console).
$Python = Join-Path $resolvedProject ".venv\Scripts\pythonw.exe"
if (-not (Test-Path $Python)) {
  $Python = Join-Path $resolvedProject "venv\Scripts\pythonw.exe"
}
if (-not (Test-Path $Python)) {
  Write-Warning "Aviso: Ambiente virtual (.venv) não encontrado. Usando pythonw global. Recomenda-se criar o venv e instalar dependências."
  $Python = "pythonw"
}

$taskNames = @("MOP-ABS-Importacao", "MOP-ABS-Contingencia")

# Encerra instancias antigas (inclusive as que abriram janela de console), senao
# Register-ScheduledTask -Force nao as substitui.
foreach ($name in $taskNames) {
  Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue | Stop-ScheduledTask -ErrorAction SilentlyContinue
}
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^pythonw?\.exe$' -and $_.CommandLine -match 'agent_abs\.cli' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$argumentsMonitor = "-m agent_abs.cli"
$argumentsOnce = "-m agent_abs.cli --once"

# Interactive: roda como o usuario logado, mantendo o acesso a rede (UNC/Y:).
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

# Monitor: sem limite de tempo (ExecutionTimeLimit 0) para nao ser encerrado apos 24h.
$monitorSettings = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Seconds 0)

$monitorTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$monitorTrigger.Delay = 'PT5M'
$monitor = New-ScheduledTask -Action (New-ScheduledTaskAction -Execute $Python -Argument $argumentsMonitor -WorkingDirectory $resolvedProject) `
  -Trigger $monitorTrigger -Principal $principal -Settings $monitorSettings
Register-ScheduledTask -TaskName "MOP-ABS-Importacao" -InputObject $monitor -Force | Out-Null

# Contingencia: todo dia a partir das 00:00, repetindo a cada 5 min durante 1 dia
# (um gatilho -Once so valeria no dia da instalacao).
$onceSettings = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 4)
$trigger = New-ScheduledTaskTrigger -Daily -At "00:00"
$trigger.Repetition = (New-ScheduledTaskTrigger -Once -At "00:00" `
  -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 1)).Repetition
$contingency = New-ScheduledTask -Action (New-ScheduledTaskAction -Execute $Python -Argument $argumentsOnce -WorkingDirectory $resolvedProject) `
  -Trigger $trigger -Principal $principal -Settings $onceSettings
Register-ScheduledTask -TaskName "MOP-ABS-Contingencia" -InputObject $contingency -Force | Out-Null

Start-ScheduledTask -TaskName "MOP-ABS-Importacao"

Write-Host "Tarefas MOP-ABS-Importacao e MOP-ABS-Contingencia instaladas (segundo plano, sem janela)."
Write-Host "Logs em: $(Join-Path $resolvedProject 'logs')"
