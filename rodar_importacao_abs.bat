@echo off
echo.
echo ==============================================
echo   Iniciando Importacao de Dados do ABS...
echo ==============================================
echo.

cd /d "%~dp0"
echo Instalando/Atualizando dependencias (se necessario)...
pip install -r agent_abs/requirements.txt -q

echo.
echo Rodando importador...
python -m agent_abs.cli --once

echo.
echo ==============================================
echo   Importacao Finalizada!
echo ==============================================
pause
