@echo off
title Divya Atelier - Virtual Saree Try-On Kiosk (Local AI Engine)
echo ========================================================
echo   DIVYA ATELIER - VIRTUAL SAREE TRY-ON KIOSK
echo   Local AI Engine: YOLOv8 Pose + Cloth Inpainting (RTX 5060 Ti)
echo   100%% Free, Offline, Zero Latency (~150ms)
echo ========================================================
echo.

echo [1/2] Starting Local AI Server on http://127.0.0.1:8000...
start /B python backend\server.py

echo [2/2] Launching Kiosk Web Interface...
start http://localhost:5173

echo.
echo Kiosk is running! Press CTRL+C in this window to stop.
npm run dev
