@echo off
:: Checa se tem privilegios de Administrador
NET SESSION >nul 2>&1
if %errorLevel% == 0 (
    goto :RunAdmin
) else (
    echo Solicitando privilegios de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:RunAdmin
cd /d "%~dp0"
echo Instalando Tarefas Agendadas do MOP ABS (Importacao e Contingencia)...
powershell -ExecutionPolicy Bypass -File "agent_abs\install_task.ps1"
echo.
pause
