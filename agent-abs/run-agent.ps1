$ErrorActionPreference = 'Stop'

Set-Location -LiteralPath $PSScriptRoot
$logDirectory = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$logFile = Join-Path $logDirectory ("abs-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd'))

try {
  "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Inicio da importacao ABS" | Add-Content -LiteralPath $logFile
  & node --use-system-ca --env-file=.env index.mjs *>> $logFile
  if ($LASTEXITCODE -ne 0) { throw "Agente ABS encerrou com codigo $LASTEXITCODE" }
  "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Importacao concluida" | Add-Content -LiteralPath $logFile
  exit 0
} catch {
  "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERRO: $($_.Exception.Message)" | Add-Content -LiteralPath $logFile
  exit 1
}
