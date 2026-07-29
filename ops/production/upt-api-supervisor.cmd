@echo off
setlocal

:monitor
powershell.exe -NoProfile -NonInteractive -Command "if (Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 call "C:\UPT\Services\start-upt-api.cmd"
timeout /t 5 /nobreak >nul
goto monitor
