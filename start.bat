@echo off
title Wildlife Portal - Automated Startup Console
echo ====================================================================
echo   🌲 WILDLIFE POPULATION INTELLIGENCE SYSTEM STARTUP CONSOLE 🌲
echo ====================================================================
echo.

:: 1. Launch FastAPI Backend
echo [1/3] Launching FastAPI Backend on port 8000...
start "FastAPI Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

:: 2. Launch Celery Worker
echo [2/3] Launching Celery Background Task Worker...
start "Celery Worker" cmd /k "cd backend && venv\Scripts\celery -A app.core.celery_app.celery_app worker --loglevel=info -P threads"

:: 3. Launch Next.js Frontend
echo [3/3] Launching Next.js Frontend on port 3000...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================================
echo   🚀 All systems initiated successfully!
echo   ------------------------------------------------------------------
echo   - Frontend Portal: http://localhost:3000
echo   - Backend Swagger:  http://localhost:8000/docs
echo ====================================================================
echo.
pause
