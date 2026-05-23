@echo off
chcp 65001 >nul
title Urus Diri Sendiri - Dev Server

echo ========================================
echo   Urus Diri Sendiri - Dev Server
echo ========================================
echo.

cd /d "%~dp0"

REM ---- Cek dependencies ----
if not exist "node_modules" (
    echo [Frontend] node_modules belum ada, menjalankan npm install...
    call npm install
)

if not exist "backend-api\node_modules" (
    echo [Backend] node_modules belum ada, menjalankan npm install...
    cd backend-api
    call npm install
    cd ..
)

REM ---- Jalankan Backend di window baru ----
echo [Backend]  Memulai backend API (Hono/Wrangler)...
start "Backend - Hono/Wrangler" cmd /k "cd /d %~dp0backend-api && npm run dev"

REM Tunggu sebentar
timeout /t 2 /nobreak >nul

REM ---- Jalankan Frontend di window baru ----
echo [Frontend] Memulai frontend (Vite)...
start "Frontend - Vite" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo   Kedua server sudah berjalan!
echo   Tutup window ini atau tekan Ctrl+C
echo   untuk menghentikan
echo ========================================
echo.
pause
