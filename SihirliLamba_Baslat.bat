@echo off
title Sihirli Lamba VTT Baslatici
color 0E
echo ====================================================
echo        SIHIRLI LAMBA VTT PLATFORMU BASLATILIYOR
echo ====================================================
echo.
echo Proje Dizini: %~dp0
cd /d "%~dp0"

echo [1/2] Tarayici Aciliyor...
start http://localhost:5173/

echo [2/2] Sunucu Calisiyor (Kapatmak icin bu pencereyi kapatin)...
echo.
call npm.cmd run dev
pause
