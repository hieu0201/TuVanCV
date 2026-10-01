@echo off
chcp 65001 >nul
title SmartRecruit AI - Khởi Động Hệ Thống
echo ============================================================
echo   🚀 ĐANG KHỞI CHẠY HỆ THỐNG SMARTRECRUIT AI...
echo ============================================================
echo.

echo [1/3] Khởi động Backend Server (Port 5000)...
start "SmartRecruit - Backend Server" cmd /k "cd /d "%~dp0server" && node server.js"

timeout /t 2 /nobreak >nul

echo [2/3] Khởi động Frontend Client (Port 5173)...
start "SmartRecruit - Frontend Web" cmd /k "cd /d "%~dp0client" && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Đang mở trình duyệt trực tiếp vào hệ thống...
start http://localhost:5173/

echo.
echo ============================================================
echo   ✅ HỆ THỐNG ĐÃ SẴN SÀNG!
echo   - Giao diện Web: http://localhost:5173/
echo   - Backend API:   http://localhost:5000/
echo ============================================================
echo.
pause
