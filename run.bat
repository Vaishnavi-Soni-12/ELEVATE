@echo off
title ELEVATE Launcher
echo ===================================================
echo   Starting ELEVATE Backend and Frontend...
echo ===================================================

echo Starting FastAPI backend on http://127.0.0.1:8000 ...
start "ELEVATE Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite frontend on http://localhost:5173 ...
start "ELEVATE Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo   Both services launched in separate windows!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo ===================================================
timeout /t 5
