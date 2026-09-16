@echo off
echo ===================================================
echo Starting PromptShield React + Vite Frontend...
echo ===================================================
cd /d "%~dp0\..\frontend"
npm run dev -- --host
pause
