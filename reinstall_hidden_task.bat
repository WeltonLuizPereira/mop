@echo off
NET SESSION >nul 2>&1
if %errorLevel% == 0 (
    echo Elevado. Atualizando tarefas do MOP...
    powershell -ExecutionPolicy Bypass -File "%~dp0agent_abs\install_task.ps1"
    echo Feito! Pode fechar esta janela.
    pause
) else (
    echo Solicitando permissões de Administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c %~dp0reinstall_hidden_task.bat' -Verb RunAs"
)
