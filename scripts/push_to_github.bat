@echo off
echo ===================================================
echo Pushing PromptShield to GitHub...
echo Repository: https://github.com/25A31A4363/Prompt-Shield
echo ===================================================
cd /d "%~dp0\.."
git push -u origin main --force
echo.
pause
