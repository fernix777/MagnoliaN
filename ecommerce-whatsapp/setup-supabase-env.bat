@echo off
echo Configurando variables de entorno de Supabase...
echo.

REM Cliente
echo VITE_SUPABASE_URL=https://prymijhlpoeqhihztuwl.supabase.co > client\.env
echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk3MDUsImV4cCI6MjA3OTIxNTcwNX0.xn29dwZNae71amG8Y_2RgE3ZPCbCqrTzKSFBNxDARgk >> client\.env

echo ✓ Archivo client\.env creado

REM Servidor - leer el .env existente y agregar las variables de Supabase
echo. >> server\.env
echo # Supabase Configuration >> server\.env
echo SUPABASE_URL=https://prymijhlpoeqhihztuwl.supabase.co >> server\.env
echo SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk3MDUsImV4cCI6MjA3OTIxNTcwNX0.xn29dwZNae71amG8Y_2RgE3ZPCbCqrTzKSFBNxDARgk >> server\.env
echo SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYzOTcwNSwiZXhwIjoyMDc5MjE1NzA1fQ.98VJKF196N7wLLBZijMWkch568B7vQi1sUWNqagFcxM >> server\.env

echo ✓ Variables agregadas a server\.env
echo.
echo ✓ Configuración completada!
echo.
echo Ahora debes reiniciar los servidores para que tomen las nuevas variables:
echo   1. Detener los servidores actuales (Ctrl+C en cada terminal)
echo   2. Ejecutar: cd client ^&^& npm run dev
echo   3. Ejecutar: cd server ^&^& npm run dev
pause
