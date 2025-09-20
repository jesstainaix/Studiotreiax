@echo off
title Backend Server - StudioTriax
cd /d "c:\xampp\htdocs\Studiotreiax_1"

:RESTART
echo.
echo ==================================================
echo    🚀 Iniciando Servidor Backend StudioTriax
echo ==================================================
echo.

node simple-backend.js

echo.
echo ❌ Servidor encerrado. Reiniciando em 3 segundos...
timeout /t 3 /nobreak >nul
goto RESTART