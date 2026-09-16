@echo off
echo ===================================================
echo Starting PromptShield FastAPI Backend Server...
echo ===================================================
cd /d "%~dp0\..\backend"
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else (
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
)
pause
