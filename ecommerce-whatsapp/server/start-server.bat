@echo off
echo Configurando variables de entorno del servidor con claves del cliente...

if not exist .env (
    echo Creando archivo .env para el servidor...
    (
        echo # Facebook Conversion API - Server Configuration
        echo FB_PIXEL_ID=1613812252958290
        echo FB_ACCESS_TOKEN=EAFpzmMVWlz8BQYmHkNpTq54ES4IOZCb0a5Tzl6r4ZCuSA5VGpsV71l41GW1G4M7ThFBG2kFObGGYzGPCTqqbwkM0hhGxFRetVjzGQsNICgAsL2dsqKyfsJJZCCbWG4CLvtZClor6GkcBC5aaZBuEVQ3HASY4KT6yZBu2B1ppohTJLzjCukvC0KzoSskMPW6QZDZD
        echo FB_EVENT_SOURCE_ID=1613812252958290
        echo FB_TEST_EVENT_CODE=TEST32871
        echo.
        echo # Database - Supabase
        echo SUPABASE_URL=https://prymijhlpoeqhihztuwl.supabase.co
        echo SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1paGxwb2VxaGloaHR1d2wiLCJpYXQiOjE3MzQ1MjM3MDAsImV4cCI6MjA1MDA5OTcwMH0.3v6wQ8kLqFqLz2Jz7XQh2NqK1D9R3sT4U7V2W1X8Yg
        echo SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1paGxwb2VxaGloaHR1d2wiLCJpYXQiOjE3MzQ1MjM3MDAsImV4cCI6MjA1MDA5OTcwMH0.H7K8P3mR9sT5u2V8wX1Y4z6N7Q2jF5kL8pO3n6M9qR
        echo.
        echo # Server
        echo PORT=3001
        echo NODE_ENV=development
    ) > .env
    echo Archivo .env creado con claves de Supabase
) else (
    echo El archivo .env ya existe
)

echo Configuracion completada!
echo.
echo Iniciando servidor...
timeout /t 2 >nul
npm run dev
